import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue-service';
import { logger } from '../utils/logger';

/**
 * POST /api/v1/jobs
 * Create a new async job
 */
export async function createJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, documentId, options } = req.body;

    if (!type || !documentId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'type and documentId are required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const validTypes = ['process_document', 'generate_summary', 'generate_quiz', 'generate_flashcards'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_JOB_TYPE',
          message: `Invalid job type. Must be one of: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Create job
    const jobId = await queueService.addJob(type, {
      documentId,
      options: options || {}
    });

    logger.info({ jobId, type, documentId }, 'Job created');

    res.status(202).json({
      success: true,
      data: {
        jobId,
        type,
        documentId,
        status: 'queued',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/jobs/:id
 * Get job status and result
 */
export async function getJob(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const status = await queueService.getJobStatus(id);

    if (status === 'unknown') {
      res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const result = await queueService.getJobResult(id);

    res.status(200).json({
      success: true,
      data: {
        jobId: id,
        status,
        result: result || null,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/jobs/:id/status
 * Get job status only (lighter endpoint)
 */
export async function getJobStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const status = await queueService.getJobStatus(id);

    if (status === 'unknown') {
      res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: id,
        status,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/jobs/:id/result
 * Get job result (waits for completion if still processing)
 */
export async function getJobResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const timeout = parseInt(req.query.timeout as string || '30000', 10);

    const status = await queueService.getJobStatus(id);

    if (status === 'unknown') {
      res.status(404).json({
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: `Job not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // If job is still processing, poll for result
    if (status === 'waiting' || status === 'active') {
      const startTime = Date.now();
      const pollInterval = 1000; // 1 second

      while (Date.now() - startTime < timeout) {
        const currentStatus = await queueService.getJobStatus(id);

        if (currentStatus === 'completed' || currentStatus === 'failed') {
          const result = await queueService.getJobResult(id);

          res.status(200).json({
            success: true,
            data: {
              jobId: id,
              status: currentStatus,
              result,
              timestamp: new Date().toISOString()
            }
          });
          return;
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Timeout reached
      res.status(408).json({
        success: false,
        error: {
          code: 'JOB_TIMEOUT',
          message: 'Job is still processing. Please try again later.',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Job already completed or failed
    const result = await queueService.getJobResult(id);

    res.status(200).json({
      success: true,
      data: {
        jobId: id,
        status,
        result,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
}
