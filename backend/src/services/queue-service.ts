import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import { logger } from '../utils/logger';
import { webhookService } from './webhook-service';

export interface JobData {
  type: 'process_document' | 'generate_summary' | 'generate_quiz' | 'generate_flashcards';
  documentId: string;
  userId?: string;
  options?: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

// In-memory fallback queue for when Redis is not available
class InMemoryQueue {
  private jobs: Map<string, { data: JobData; status: 'waiting' | 'active' | 'completed' | 'failed'; result?: JobResult; createdAt: Date; completedAt?: Date }> = new Map();
  private processingCallbacks: Array<(job: JobData, jobId: string) => Promise<JobResult>> = [];

  async add(_name: string, data: JobData): Promise<{ id: string }> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.jobs.set(jobId, {
      data,
      status: 'waiting',
      createdAt: new Date()
    });

    logger.info({ jobId, type: data.type }, 'Job added to in-memory queue');

    // Process immediately in background
    setImmediate(() => this.processJob(jobId));

    return { id: jobId };
  }

  private async processJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job || this.processingCallbacks.length === 0) return;

    job.status = 'active';
    logger.info({ jobId, type: job.data.type }, 'Processing job');

    try {
      const result = await this.processingCallbacks[0](job.data, jobId);

      job.status = 'completed';
      job.result = result;
      job.completedAt = new Date();

      logger.info({ jobId, type: job.data.type }, 'Job completed');

      // Trigger webhook
      webhookService.trigger('job.completed', {
        jobId,
        type: job.data.type,
        documentId: job.data.documentId
      }).catch(err => logger.error({ error: err }, 'Failed to trigger job.completed webhook'));
    } catch (error) {
      job.status = 'failed';
      job.result = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      job.completedAt = new Date();

      logger.error({ jobId, error }, 'Job failed');

      // Trigger webhook
      webhookService.trigger('job.failed', {
        jobId,
        type: job.data.type,
        documentId: job.data.documentId,
        error: error instanceof Error ? error.message : 'Unknown error'
      }).catch(err => logger.error({ error: err }, 'Failed to trigger job.failed webhook'));
    }
  }

  onProcess(callback: (job: JobData, jobId: string) => Promise<JobResult>) {
    this.processingCallbacks.push(callback);
  }

  async getJob(jobId: string) {
    return this.jobs.get(jobId);
  }

  async getJobStatus(jobId: string): Promise<'waiting' | 'active' | 'completed' | 'failed' | 'unknown'> {
    const job = this.jobs.get(jobId);
    return job?.status || 'unknown';
  }

  async getJobResult(jobId: string): Promise<JobResult | undefined> {
    const job = this.jobs.get(jobId);
    return job?.result;
  }

  async close() {
    this.jobs.clear();
    this.processingCallbacks = [];
  }
}

class QueueService {
  private queue: Queue | InMemoryQueue | null = null;
  private worker: Worker | null = null;
  private queueEvents: QueueEvents | null = null;
  private useRedis: boolean = false;

  async initialize() {
    try {
      // Try to connect to Redis
      const connection = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: 1,
        connectTimeout: 2000
      };

      // Test Redis connection
      const Redis = (await import('ioredis')).default;
      const testClient = new Redis(connection);

      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          testClient.disconnect();
          reject(new Error('Redis connection timeout'));
        }, 2000);

        testClient.on('ready', () => {
          clearTimeout(timeout);
          testClient.disconnect();
          resolve();
        });

        testClient.on('error', (err) => {
          clearTimeout(timeout);
          testClient.disconnect();
          reject(err);
        });
      });

      // Redis is available, use BullMQ
      this.queue = new Queue('document-processing', { connection });
      this.worker = new Worker('document-processing', async (job: Job) => {
        return await this.processJob(job.data, job.id || 'unknown');
      }, { connection });

      this.queueEvents = new QueueEvents('document-processing', { connection });

      this.worker.on('completed', (job) => {
        logger.info({ jobId: job.id }, 'Job completed');

        // Trigger webhook
        webhookService.trigger('job.completed', {
          jobId: job.id,
          type: job.data.type,
          documentId: job.data.documentId
        }).catch(err => logger.error({ error: err }, 'Failed to trigger job.completed webhook'));
      });

      this.worker.on('failed', (job, err) => {
        logger.error({ jobId: job?.id, error: err }, 'Job failed');

        // Trigger webhook
        if (job) {
          webhookService.trigger('job.failed', {
            jobId: job.id,
            type: job.data.type,
            documentId: job.data.documentId,
            error: err.message
          }).catch(webhookErr => logger.error({ error: webhookErr }, 'Failed to trigger job.failed webhook'));
        }
      });

      this.useRedis = true;
      logger.info('Queue service initialized with Redis');
    } catch (error) {
      // Redis not available, fall back to in-memory queue
      logger.warn({ error }, 'Redis not available, using in-memory queue');

      const inMemoryQueue = new InMemoryQueue();
      inMemoryQueue.onProcess(async (data, jobId) => {
        return await this.processJob(data, jobId);
      });

      this.queue = inMemoryQueue;
      this.useRedis = false;
      logger.info('Queue service initialized with in-memory fallback');
    }
  }

  private async processJob(data: JobData, jobId: string): Promise<JobResult> {
    logger.info({ jobId, type: data.type, documentId: data.documentId }, 'Processing job');

    try {
      switch (data.type) {
        case 'process_document':
          // Import dynamically to avoid circular dependencies
          const { processDocumentJob } = await import('./job-processors/document-processor');
          return await processDocumentJob(data);

        case 'generate_summary':
          const { generateSummaryJob } = await import('./job-processors/generation-processor');
          return await generateSummaryJob(data);

        case 'generate_quiz':
          const { generateQuizJob } = await import('./job-processors/generation-processor');
          return await generateQuizJob(data);

        case 'generate_flashcards':
          const { generateFlashcardsJob } = await import('./job-processors/generation-processor');
          return await generateFlashcardsJob(data);

        default:
          throw new Error(`Unknown job type: ${data.type}`);
      }
    } catch (error) {
      logger.error({ jobId, error }, 'Job processing failed');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async addJob(type: JobData['type'], data: Omit<JobData, 'type'>): Promise<string> {
    if (!this.queue) {
      throw new Error('Queue service not initialized');
    }

    const jobData: JobData = { type, ...data };
    const job = await this.queue.add(type, jobData);

    if (!job.id) {
      throw new Error('Failed to create job: no job ID returned');
    }

    return job.id;
  }

  async getJobStatus(jobId: string): Promise<'waiting' | 'active' | 'completed' | 'failed' | 'unknown'> {
    if (!this.queue) {
      throw new Error('Queue service not initialized');
    }

    if (this.useRedis && this.queue instanceof Queue) {
      const job = await this.queue.getJob(jobId);
      if (!job) return 'unknown';

      const state = await job.getState();
      return state as 'waiting' | 'active' | 'completed' | 'failed';
    } else if (this.queue instanceof InMemoryQueue) {
      return await this.queue.getJobStatus(jobId);
    }

    return 'unknown';
  }

  async getJobResult(jobId: string): Promise<JobResult | null> {
    if (!this.queue) {
      throw new Error('Queue service not initialized');
    }

    if (this.useRedis && this.queue instanceof Queue) {
      const job = await this.queue.getJob(jobId);
      if (!job) return null;

      const state = await job.getState();
      if (state === 'completed') {
        return {
          success: true,
          data: job.returnvalue
        };
      } else if (state === 'failed') {
        return {
          success: false,
          error: job.failedReason || 'Job failed'
        };
      }

      return null;
    } else if (this.queue instanceof InMemoryQueue) {
      return await this.queue.getJobResult(jobId) || null;
    }

    return null;
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queue && this.useRedis && this.queue instanceof Queue) {
      await this.queue.close();
    }
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
    if (!this.useRedis && this.queue instanceof InMemoryQueue) {
      await this.queue.close();
    }

    logger.info('Queue service closed');
  }

  isUsingRedis(): boolean {
    return this.useRedis;
  }
}

export const queueService = new QueueService();
