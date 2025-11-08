import { Router } from 'express';
import { generateSummary } from '../controllers/generation-controller';

const router = Router();

/**
 * POST /api/v1/generate/summary
 * Generate summary from document
 */
router.post('/summary', generateSummary);

// TODO: Add quiz and flashcard routes in future stories
// router.post('/quiz', generateQuiz);
// router.post('/flashcards', generateFlashcards);

export default router;
