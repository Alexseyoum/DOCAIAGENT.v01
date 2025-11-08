import { Request, Response, NextFunction } from 'express';
import { documentStore } from '../storage/document-store';
import { llmService } from '../services/llm-service';
import { ApiException } from '../middleware/error-handler';
import { ErrorCode } from '../types';
import { logger } from '../utils/logger';
import { config } from '../config';

interface SummaryRequest {
  documentId: string;
  detailLevel?: 'brief' | 'standard' | 'detailed';
  maxLength?: number;
}

/**
 * Generate summary from document
 * POST /api/v1/generate/summary
 */
export async function generateSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { documentId, detailLevel = 'brief', maxLength }: SummaryRequest = req.body;

    // Validate request
    if (!documentId) {
      throw new ApiException(
        ErrorCode.INVALID_PARAMETERS,
        400,
        'documentId is required'
      );
    }

    // Get document from store
    const document = documentStore.get(documentId);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${documentId} not found`
      );
    }

    // Check if document has been processed
    if (!document.extractedText) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        'Document has not been processed yet. Call POST /api/v1/documents/:id/process first to extract text.'
      );
    }

    logger.info({
      documentId,
      detailLevel,
      textLength: document.extractedText.length,
      llmProvider: config.llmProvider
    }, 'Starting summary generation');

    const startTime = Date.now();

    // Create prompts based on detail level
    const { systemPrompt, userPrompt } = createSummaryPrompts(
      document.extractedText,
      detailLevel,
      document.originalFilename
    );

    // Generate summary using LLM
    const llmResponse = await llmService.generateText(
      systemPrompt,
      userPrompt,
      {
        maxTokens: getMaxTokensForDetailLevel(detailLevel, maxLength),
        temperature: 0.3 // Lower temperature for more focused summaries
      }
    );

    const duration = Date.now() - startTime;

    logger.info({
      documentId,
      detailLevel,
      llmProvider: config.llmProvider,
      duration,
      inputTokens: llmResponse.usage?.inputTokens,
      outputTokens: llmResponse.usage?.outputTokens
    }, 'Summary generated successfully');

    // Parse the summary (LLM should return JSON, but we'll handle both)
    let summary;
    try {
      summary = JSON.parse(llmResponse.content);
    } catch {
      // If not JSON, treat as plain text summary
      summary = {
        title: document.originalFilename.replace(/\.[^/.]+$/, ''),
        overview: llmResponse.content,
        keyPoints: extractKeyPoints(llmResponse.content),
        detailLevel
      };
    }

    res.status(200).json({
      success: true,
      documentId,
      generatedAt: new Date().toISOString(),
      summary,
      metadata: {
        detailLevel,
        wordCount: llmResponse.content.split(/\s+/).length,
        processingTime: duration / 1000, // in seconds
        llmProvider: config.llmProvider,
        inputTokens: llmResponse.usage?.inputTokens,
        outputTokens: llmResponse.usage?.outputTokens
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Create prompts for summary generation based on detail level
 */
function createSummaryPrompts(
  text: string,
  detailLevel: string,
  filename: string
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert educational content summarizer. Your task is to create clear, concise, and well-structured summaries of academic and educational documents.

Generate summaries that are:
- Accurate and faithful to the source material
- Well-organized with clear structure
- Easy to understand for students
- Focused on key concepts and important information

Return your response as a JSON object with this structure:
{
  "title": "Document title",
  "documentType": "textbook|research_paper|notes|article|other",
  "overview": "2-3 sentence executive summary",
  "keyPoints": ["Main point 1", "Main point 2", ...],
  "importantTerms": [{"term": "Term", "definition": "Definition"}],
  "mainTopics": ["Topic 1", "Topic 2"],
  "estimatedReadTime": "X minutes"
}`;

  let detailInstructions = '';
  switch (detailLevel) {
    case 'brief':
      detailInstructions = `
Create a BRIEF summary (1-2 pages equivalent, 300-500 words):
- Focus on the absolute essentials
- 5-7 key points maximum
- 3-5 important terms
- Very concise overview`;
      break;

    case 'standard':
      detailInstructions = `
Create a STANDARD summary (3-5 pages equivalent, 800-1200 words):
- Comprehensive but concise
- 8-12 key points organized by topic
- 5-8 important terms with context
- Detailed overview paragraph`;
      break;

    case 'detailed':
      detailInstructions = `
Create a DETAILED summary (5-10 pages equivalent, 1500-2500 words):
- In-depth coverage of all major topics
- 15-20 key points with explanations
- 10-15 important terms with context and examples
- Comprehensive overview
- Include connections between concepts`;
      break;
  }

  const userPrompt = `Document: "${filename}"

${detailInstructions}

Please analyze and summarize the following document:

${text.substring(0, 100000)}

${text.length > 100000 ? '\n[Document truncated due to length]' : ''}

Return ONLY the JSON object, no additional text.`;

  return { systemPrompt, userPrompt };
}

/**
 * Get max tokens based on detail level
 */
function getMaxTokensForDetailLevel(detailLevel: string, customMax?: number): number {
  if (customMax) return customMax;

  switch (detailLevel) {
    case 'brief':
      return 1000;
    case 'standard':
      return 2500;
    case 'detailed':
      return 5000;
    default:
      return 1000;
  }
}

/**
 * Extract key points from plain text (fallback)
 */
function extractKeyPoints(text: string): string[] {
  // Simple extraction: split by paragraphs and take first sentences
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 20);
  return paragraphs.slice(0, 7).map(p => {
    const sentences = p.split(/[.!?]/);
    return sentences[0]?.trim() || p.substring(0, 100);
  });
}

/**
 * Generate quiz from document
 * POST /api/v1/generate/quiz
 */
export async function generateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      documentId,
      questionCount = 10,
      difficulty = 'medium',
      questionTypes = ['multiple-choice', 'true-false']
    } = req.body;

    // Validate request
    if (!documentId) {
      throw new ApiException(
        ErrorCode.INVALID_PARAMETERS,
        400,
        'documentId is required'
      );
    }

    // Get document from store
    const document = documentStore.get(documentId);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${documentId} not found`
      );
    }

    // Check if document has been processed
    if (!document.extractedText) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        'Document has not been processed yet. Call POST /api/v1/documents/:id/process first to extract text.'
      );
    }

    logger.info({
      documentId,
      questionCount,
      difficulty,
      questionTypes,
      textLength: document.extractedText.length,
      llmProvider: config.llmProvider
    }, 'Starting quiz generation');

    const startTime = Date.now();

    // Create prompts for quiz generation
    const { systemPrompt, userPrompt } = createQuizPrompts(
      document.extractedText,
      document.originalFilename,
      questionCount,
      difficulty,
      questionTypes
    );

    // Generate quiz using LLM
    const llmResponse = await llmService.generateText(
      systemPrompt,
      userPrompt,
      {
        maxTokens: questionCount * 300, // ~300 tokens per question
        temperature: 0.7 // Moderate creativity for question generation
      }
    );

    const duration = Date.now() - startTime;

    logger.info({
      documentId,
      questionCount,
      llmProvider: config.llmProvider,
      duration,
      inputTokens: llmResponse.usage?.inputTokens,
      outputTokens: llmResponse.usage?.outputTokens
    }, 'Quiz generated successfully');

    // Parse the quiz (LLM should return JSON)
    let quiz;
    try {
      quiz = JSON.parse(llmResponse.content);
    } catch {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        500,
        'Failed to parse quiz response from LLM'
      );
    }

    res.status(200).json({
      success: true,
      documentId,
      generatedAt: new Date().toISOString(),
      quiz,
      metadata: {
        questionCount: quiz.questions?.length || 0,
        difficulty,
        questionTypes,
        processingTime: duration / 1000,
        llmProvider: config.llmProvider,
        inputTokens: llmResponse.usage?.inputTokens,
        outputTokens: llmResponse.usage?.outputTokens
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Create prompts for quiz generation
 */
function createQuizPrompts(
  text: string,
  filename: string,
  questionCount: number,
  difficulty: string,
  questionTypes: string[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert educational quiz creator. Your task is to create high-quality, educational quiz questions based on document content.

Create quiz questions that are:
- Clear and unambiguous
- Directly based on the document content
- Appropriate for the specified difficulty level
- Well-structured with proper distractors (for multiple choice)
- Designed to test comprehension, not just memorization

Return your response as a JSON object with this structure:
{
  "title": "Quiz title",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "id": 1,
      "type": "multiple-choice" | "true-false" | "short-answer",
      "question": "The question text",
      "options": ["Option A", "Option B", "Option C", "Option D"], // for multiple-choice
      "correctAnswer": "The correct answer",
      "explanation": "Why this is the correct answer",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "Topic/concept this question tests"
    }
  ]
}`;

  const difficultyInstructions = getDifficultyInstructions(difficulty);
  const typeInstructions = getQuestionTypeInstructions(questionTypes);

  const userPrompt = `Document: "${filename}"

Create a ${difficulty} difficulty quiz with ${questionCount} questions.

${difficultyInstructions}

${typeInstructions}

Please analyze the following document and create quiz questions:

${text.substring(0, 50000)}

${text.length > 50000 ? '\n[Document truncated due to length]' : ''}

Requirements:
- Generate exactly ${questionCount} questions
- Mix question types: ${questionTypes.join(', ')}
- Ensure questions cover different topics from the document
- Make distractors plausible but clearly incorrect
- Provide clear explanations for each answer

Return ONLY the JSON object, no additional text.`;

  return { systemPrompt, userPrompt };
}

/**
 * Get difficulty-specific instructions
 */
function getDifficultyInstructions(difficulty: string): string {
  switch (difficulty) {
    case 'easy':
      return `EASY difficulty guidelines:
- Test basic recall and understanding
- Use straightforward language
- Focus on main concepts and definitions
- Make correct answers obvious to someone who read carefully
- Avoid trick questions`;

    case 'medium':
      return `MEDIUM difficulty guidelines:
- Test comprehension and application
- Require understanding of relationships between concepts
- Include some analysis questions
- Distractors should be plausible
- Mix recall and reasoning questions`;

    case 'hard':
      return `HARD difficulty guidelines:
- Test deep understanding and analysis
- Require synthesis of multiple concepts
- Include application to new scenarios
- Use complex distractors that require careful thought
- Test critical thinking and evaluation skills`;

    default:
      return '';
  }
}

/**
 * Get question type-specific instructions
 */
function getQuestionTypeInstructions(types: string[]): string {
  const instructions: string[] = [];

  if (types.includes('multiple-choice')) {
    instructions.push(`Multiple Choice: Provide 4 options (A, B, C, D) with one correct answer and three plausible distractors.`);
  }

  if (types.includes('true-false')) {
    instructions.push(`True/False: Create statements that are clearly true or false based on the document.`);
  }

  if (types.includes('short-answer')) {
    instructions.push(`Short Answer: Ask questions that require a brief (1-2 sentence) response.`);
  }

  return instructions.join('\n');
}

/**
 * Generate flashcards from document
 * POST /api/v1/generate/flashcards
 */
export async function generateFlashcards(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      documentId,
      cardCount = 15,
      focusAreas = ['key-terms', 'concepts', 'facts']
    } = req.body;

    // Validate request
    if (!documentId) {
      throw new ApiException(
        ErrorCode.INVALID_PARAMETERS,
        400,
        'documentId is required'
      );
    }

    // Get document from store
    const document = documentStore.get(documentId);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${documentId} not found`
      );
    }

    // Check if document has been processed
    if (!document.extractedText) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        'Document has not been processed yet. Call POST /api/v1/documents/:id/process first to extract text.'
      );
    }

    logger.info({
      documentId,
      cardCount,
      focusAreas,
      textLength: document.extractedText.length,
      llmProvider: config.llmProvider
    }, 'Starting flashcard generation');

    const startTime = Date.now();

    // Create prompts for flashcard generation
    const { systemPrompt, userPrompt } = createFlashcardPrompts(
      document.extractedText,
      document.originalFilename,
      cardCount,
      focusAreas
    );

    // Generate flashcards using LLM
    const llmResponse = await llmService.generateText(
      systemPrompt,
      userPrompt,
      {
        maxTokens: cardCount * 200, // ~200 tokens per flashcard
        temperature: 0.6 // Slightly lower temperature for factual content
      }
    );

    const duration = Date.now() - startTime;

    logger.info({
      documentId,
      cardCount,
      llmProvider: config.llmProvider,
      duration,
      inputTokens: llmResponse.usage?.inputTokens,
      outputTokens: llmResponse.usage?.outputTokens
    }, 'Flashcards generated successfully');

    // Parse the flashcards (LLM should return JSON)
    let flashcards;
    try {
      flashcards = JSON.parse(llmResponse.content);
    } catch {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        500,
        'Failed to parse flashcard response from LLM'
      );
    }

    res.status(200).json({
      success: true,
      documentId,
      generatedAt: new Date().toISOString(),
      flashcards,
      metadata: {
        cardCount: flashcards.cards?.length || 0,
        focusAreas,
        processingTime: duration / 1000,
        llmProvider: config.llmProvider,
        inputTokens: llmResponse.usage?.inputTokens,
        outputTokens: llmResponse.usage?.outputTokens
      }
    });

  } catch (error) {
    next(error);
  }
}

/**
 * Create prompts for flashcard generation
 */
function createFlashcardPrompts(
  text: string,
  filename: string,
  cardCount: number,
  focusAreas: string[]
): { systemPrompt: string; userPrompt: string } {
  const systemPrompt = `You are an expert educational flashcard creator. Your task is to create high-quality study flashcards based on document content.

Create flashcards that are:
- Clear and concise
- Focused on important concepts, terms, and facts
- Well-structured for effective memorization
- Properly categorized by topic
- Include helpful context and mnemonics where appropriate

Return your response as a JSON object with this structure:
{
  "title": "Flashcard deck title",
  "description": "Brief description of what this deck covers",
  "cards": [
    {
      "id": 1,
      "front": "Question or term",
      "back": "Answer or definition",
      "category": "Category/topic",
      "difficulty": "easy" | "medium" | "hard",
      "tags": ["tag1", "tag2"],
      "hint": "Optional hint or mnemonic",
      "relatedConcepts": ["Related concept 1", "Related concept 2"]
    }
  ]
}`;

  const focusInstructions = getFocusAreaInstructions(focusAreas);

  const userPrompt = `Document: "${filename}"

Create ${cardCount} flashcards covering the key information from this document.

${focusInstructions}

Please analyze the following document and create flashcards:

${text.substring(0, 50000)}

${text.length > 50000 ? '\n[Document truncated due to length]' : ''}

Requirements:
- Generate exactly ${cardCount} flashcards
- Focus on: ${focusAreas.join(', ')}
- Cover diverse topics from the document
- Make fronts concise (questions or terms)
- Make backs comprehensive but clear (answers or definitions)
- Include helpful hints or mnemonics where appropriate
- Tag cards by topic for easy organization
- Vary difficulty levels appropriately

Return ONLY the JSON object, no additional text.`;

  return { systemPrompt, userPrompt };
}

/**
 * Get focus area-specific instructions
 */
function getFocusAreaInstructions(focusAreas: string[]): string {
  const instructions: string[] = [];

  if (focusAreas.includes('key-terms')) {
    instructions.push(`Key Terms: Create cards for important terminology and definitions from the document.`);
  }

  if (focusAreas.includes('concepts')) {
    instructions.push(`Concepts: Create cards explaining major concepts and their applications.`);
  }

  if (focusAreas.includes('facts')) {
    instructions.push(`Facts: Create cards for important facts, data, dates, and specific information.`);
  }

  if (focusAreas.includes('processes')) {
    instructions.push(`Processes: Create cards explaining step-by-step processes and procedures.`);
  }

  if (focusAreas.includes('examples')) {
    instructions.push(`Examples: Create cards with examples that illustrate key concepts.`);
  }

  return instructions.join('\n');
}
