import { Router } from 'express';
import { generateSummary, generateQuiz, generateFlashcards } from '../controllers/generation-controller';

const router = Router();

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
