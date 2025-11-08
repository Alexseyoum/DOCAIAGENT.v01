import { Router, Request, Response, NextFunction } from 'express';
import { webhookService, WebhookEvent } from '../services/webhook-service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * POST /api/v1/webhooks
 * Register a new webhook
 */
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, events, metadata } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'url (string) and events (array) are required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Invalid webhook URL',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Validate events
    const validEvents: WebhookEvent[] = [
      'job.completed',
      'job.failed',
      'document.processed',
      'document.failed',
      'summary.generated',
      'quiz.generated',
      'flashcards.generated'
    ];

    for (const event of events) {
      if (!validEvents.includes(event)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EVENT',
            message: `Invalid event: ${event}. Valid events: ${validEvents.join(', ')}`,
            timestamp: new Date().toISOString()
          }
        });
        return;
      }
    }

    const webhook = webhookService.register(url, events, metadata);

    logger.info({ webhookId: webhook.id, url, events }, 'Webhook registered via API');

    res.status(201).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        secret: webhook.secret,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
        message: 'Webhook registered successfully. Save the secret for signature verification.'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/webhooks
 * List all webhooks
 */
router.get('/', (_req: Request, res: Response, next: NextFunction) => {
  try {
    const webhooks = webhookService.list();

    res.status(200).json({
      success: true,
      data: {
        webhooks: webhooks.map(wh => ({
          id: wh.id,
          url: wh.url,
          events: wh.events,
          active: wh.active,
          createdAt: wh.createdAt,
          lastTriggered: wh.lastTriggered,
          metadata: wh.metadata
          // Secret is intentionally omitted for security
        })),
        count: webhooks.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/webhooks/:id
 * Get webhook details
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const webhook = webhookService.get(id);

    if (!webhook) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: `Webhook not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt,
        lastTriggered: webhook.lastTriggered,
        metadata: webhook.metadata
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/v1/webhooks/:id
 * Update webhook
 */
router.patch('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { url, events, active, metadata } = req.body;

    const webhook = webhookService.get(id);
    if (!webhook) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: `Webhook not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const updated = webhookService.update(id, { url, events, active, metadata });

    res.status(200).json({
      success: true,
      data: {
        id: updated!.id,
        url: updated!.url,
        events: updated!.events,
        active: updated!.active,
        metadata: updated!.metadata,
        message: 'Webhook updated successfully'
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/webhooks/:id
 * Delete webhook
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const deleted = webhookService.delete(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: `Webhook not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/webhooks/:id/deliveries
 * Get webhook delivery history
 */
router.get('/:id/deliveries', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const webhook = webhookService.get(id);
    if (!webhook) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: `Webhook not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const deliveries = webhookService.getDeliveries(id, limit);

    res.status(200).json({
      success: true,
      data: {
        webhookId: id,
        deliveries,
        count: deliveries.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/webhooks/:id/stats
 * Get webhook statistics
 */
router.get('/:id/stats', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const webhook = webhookService.get(id);
    if (!webhook) {
      res.status(404).json({
        success: false,
        error: {
          code: 'WEBHOOK_NOT_FOUND',
          message: `Webhook not found: ${id}`,
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const stats = webhookService.getStats(id);

    res.status(200).json({
      success: true,
      data: {
        webhookId: id,
        stats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/webhooks/test
 * Test webhook delivery
 */
router.post('/test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url, event = 'job.completed' } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_URL',
          message: 'url is required for webhook testing',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const testData = {
      test: true,
      message: 'This is a test webhook payload',
      timestamp: new Date().toISOString()
    };

    await webhookService.trigger(event as WebhookEvent, testData);

    res.status(200).json({
      success: true,
      message: 'Test webhook triggered. Check your endpoint for delivery.',
      event,
      testData
    });
  } catch (error) {
    next(error);
  }
});

export default router;
