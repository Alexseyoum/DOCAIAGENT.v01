import { Router } from 'express';
import { createJob, getJob, getJobStatus, getJobResult } from '../controllers/jobs-controller';
import { generationLimiter } from '../middleware/rate-limit';

const router = Router();

/**
 * POST /api/v1/jobs
 * Create a new async job
 */
router.post('/', generationLimiter, createJob);

/**
 * GET /api/v1/jobs/:id
 * Get job status and result
 */
router.get('/:id', getJob);

/**
 * GET /api/v1/jobs/:id/status
 * Get job status only
 */
router.get('/:id/status', getJobStatus);

/**
 * GET /api/v1/jobs/:id/result
 * Get job result (waits for completion)
 */
router.get('/:id/result', getJobResult);

export default router;
