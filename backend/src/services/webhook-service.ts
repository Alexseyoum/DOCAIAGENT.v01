import { logger } from '../utils/logger';
import crypto from 'crypto';

export interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
  metadata?: Record<string, any>;
}

export type WebhookEvent =
  | 'job.completed'
  | 'job.failed'
  | 'document.processed'
  | 'document.failed'
  | 'summary.generated'
  | 'quiz.generated'
  | 'flashcards.generated';

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  webhookId: string;
}

export interface WebhookDelivery {
  webhookId: string;
  event: WebhookEvent;
  url: string;
  attempt: number;
  status: 'pending' | 'success' | 'failed';
  statusCode?: number;
  error?: string;
  timestamp: Date;
  responseTime?: number;
}

class WebhookService {
  private webhooks: Map<string, Webhook> = new Map();
  private deliveries: WebhookDelivery[] = [];
  private maxDeliveryHistory = 100;
  private maxRetries = 3;

  /**
   * Register a new webhook
   */
  register(url: string, events: WebhookEvent[], metadata?: Record<string, any>): Webhook {
    const webhook: Webhook = {
      id: `wh_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
      url,
      secret: crypto.randomBytes(32).toString('hex'),
      events,
      active: true,
      createdAt: new Date(),
      metadata
    };

    this.webhooks.set(webhook.id, webhook);

    logger.info({
      webhookId: webhook.id,
      url,
      events
    }, 'Webhook registered');

    return webhook;
  }

  /**
   * Get webhook by ID
   */
  get(webhookId: string): Webhook | undefined {
    return this.webhooks.get(webhookId);
  }

  /**
   * List all webhooks
   */
  list(): Webhook[] {
    return Array.from(this.webhooks.values());
  }

  /**
   * Update webhook
   */
  update(webhookId: string, updates: Partial<Webhook>): Webhook | null {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      return null;
    }

    const updated = { ...webhook, ...updates, id: webhook.id };
    this.webhooks.set(webhookId, updated);

    logger.info({ webhookId, updates }, 'Webhook updated');

    return updated;
  }

  /**
   * Delete webhook
   */
  delete(webhookId: string): boolean {
    const deleted = this.webhooks.delete(webhookId);

    if (deleted) {
      logger.info({ webhookId }, 'Webhook deleted');
    }

    return deleted;
  }

  /**
   * Trigger webhook event
   */
  async trigger(event: WebhookEvent, data: any): Promise<void> {
    const matchingWebhooks = Array.from(this.webhooks.values())
      .filter(wh => wh.active && wh.events.includes(event));

    logger.info({
      event,
      matchingWebhooks: matchingWebhooks.length
    }, 'Triggering webhook event');

    // Send webhooks in parallel
    await Promise.allSettled(
      matchingWebhooks.map(webhook => this.deliver(webhook, event, data))
    );
  }

  /**
   * Deliver webhook to endpoint
   */
  private async deliver(
    webhook: Webhook,
    event: WebhookEvent,
    data: any,
    attempt: number = 1
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      webhookId: webhook.id
    };

    const signature = this.generateSignature(payload, webhook.secret);

    const delivery: WebhookDelivery = {
      webhookId: webhook.id,
      event,
      url: webhook.url,
      attempt,
      status: 'pending',
      timestamp: new Date()
    };

    try {
      const startTime = Date.now();

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhook.id,
          'User-Agent': 'DocumentProcessingAgent-Webhook/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      delivery.responseTime = Date.now() - startTime;
      delivery.statusCode = response.status;

      if (response.ok) {
        delivery.status = 'success';
        webhook.lastTriggered = new Date();

        logger.info({
          webhookId: webhook.id,
          event,
          statusCode: response.status,
          responseTime: delivery.responseTime
        }, 'Webhook delivered successfully');
      } else {
        delivery.status = 'failed';
        delivery.error = `HTTP ${response.status}: ${response.statusText}`;

        logger.warn({
          webhookId: webhook.id,
          event,
          statusCode: response.status,
          attempt
        }, 'Webhook delivery failed');

        // Retry if not max retries
        if (attempt < this.maxRetries) {
          await this.retryDelivery(webhook, event, data, attempt + 1);
        }
      }
    } catch (error) {
      delivery.status = 'failed';
      delivery.error = error instanceof Error ? error.message : 'Unknown error';

      logger.error({
        webhookId: webhook.id,
        event,
        error,
        attempt
      }, 'Webhook delivery error');

      // Retry if not max retries
      if (attempt < this.maxRetries) {
        await this.retryDelivery(webhook, event, data, attempt + 1);
      }
    }

    this.recordDelivery(delivery);
  }

  /**
   * Retry webhook delivery with exponential backoff
   */
  private async retryDelivery(
    webhook: Webhook,
    event: WebhookEvent,
    data: any,
    attempt: number
  ): Promise<void> {
    // Exponential backoff: 2^attempt seconds
    const delay = Math.pow(2, attempt - 1) * 1000;

    logger.info({
      webhookId: webhook.id,
      event,
      attempt,
      delayMs: delay
    }, 'Scheduling webhook retry');

    setTimeout(() => {
      this.deliver(webhook, event, data, attempt);
    }, delay);
  }

  /**
   * Generate HMAC signature for webhook payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const payloadString = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Record delivery attempt
   */
  private recordDelivery(delivery: WebhookDelivery): void {
    this.deliveries.unshift(delivery);

    // Keep only recent deliveries
    if (this.deliveries.length > this.maxDeliveryHistory) {
      this.deliveries = this.deliveries.slice(0, this.maxDeliveryHistory);
    }
  }

  /**
   * Get delivery history
   */
  getDeliveries(webhookId?: string, limit: number = 50): WebhookDelivery[] {
    let deliveries = this.deliveries;

    if (webhookId) {
      deliveries = deliveries.filter(d => d.webhookId === webhookId);
    }

    return deliveries.slice(0, limit);
  }

  /**
   * Get webhook statistics
   */
  getStats(webhookId?: string) {
    const deliveries = this.getDeliveries(webhookId, this.maxDeliveryHistory);

    const total = deliveries.length;
    const successful = deliveries.filter(d => d.status === 'success').length;
    const failed = deliveries.filter(d => d.status === 'failed').length;
    const pending = deliveries.filter(d => d.status === 'pending').length;

    const avgResponseTime = deliveries
      .filter(d => d.responseTime)
      .reduce((sum, d) => sum + (d.responseTime || 0), 0) / (successful || 1);

    return {
      total,
      successful,
      failed,
      pending,
      successRate: total > 0 ? parseFloat(((successful / total) * 100).toFixed(2)) : 0,
      avgResponseTime: Math.round(avgResponseTime)
    };
  }
}

export const webhookService = new WebhookService();
