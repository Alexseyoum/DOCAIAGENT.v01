import { Router } from 'express';
import { generateSummary, generateQuiz, generateFlashcards } from '../controllers/generation-controller';
import { generationLimiter } from '../middleware/rate-limit';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all generation routes
router.use(authenticate);

// Apply rate limiting to all generation endpoints
router.use(generationLimiter);

/**
 * POST /api/v1/generate/summary
 * Generate summary from document
 */
router.post('/summary', generateSummary);

/**
 * POST /api/v1/generate/quiz
 * Generate quiz from document
 */
router.post('/quiz', generateQuiz);

/**
 * POST /api/v1/generate/flashcards
 * Generate flashcards from document
 */
router.post('/flashcards', generateFlashcards);

export default router;
