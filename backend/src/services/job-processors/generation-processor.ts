import { JobData, JobResult } from '../queue-service';
import { documentStore } from '../../storage/document-store';
import { llmService } from '../llm-service';
import { logger } from '../../utils/logger';

export async function generateSummaryJob(jobData: JobData): Promise<JobResult> {
  try {
    const { documentId, options = {} } = jobData;

    // Get document
    const document = documentStore.get(documentId);
    if (!document || !document.extractedText) {
      throw new Error(`Document not found or not processed: ${documentId}`);
    }

    const detailLevel = options.detailLevel || 'brief';
    const maxTokens = options.maxTokens || 500;

    logger.info({ documentId, detailLevel, maxTokens }, 'Generating summary');

    // Create prompts
    const systemPrompt = `You are an expert summarizer. Create a ${detailLevel} summary of the provided document.`;
    const userPrompt = `Please provide a ${detailLevel} summary of the following document:\n\n${document.extractedText}`;

    // Generate summary
    const llmResponse = await llmService.generateText(systemPrompt, userPrompt, {
      maxTokens,
      temperature: 0.3
    });

    return {
      success: true,
      data: { summary: llmResponse.content, detailLevel }
    };
  } catch (error) {
    logger.error({ error, documentId: jobData.documentId }, 'Summary generation failed');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateQuizJob(jobData: JobData): Promise<JobResult> {
  try {
    const { documentId, options = {} } = jobData;

    // Get document
    const document = documentStore.get(documentId);
    if (!document || !document.extractedText) {
      throw new Error(`Document not found or not processed: ${documentId}`);
    }

    const questionCount = options.questionCount || 10;
    const difficulty = options.difficulty || 'medium';
    const questionTypes = options.questionTypes || ['multiple-choice', 'true-false'];

    logger.info({ documentId, questionCount, difficulty }, 'Generating quiz');

    // Create prompts
    const systemPrompt = 'You are an expert educational content creator. Generate a quiz based on the provided document.';
    const userPrompt = `Generate a quiz with ${questionCount} questions of ${difficulty} difficulty.\nQuestion types: ${questionTypes.join(', ')}\n\nDocument content:\n${document.extractedText}`;

    // Generate quiz
    const llmResponse = await llmService.generateText(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.5
    });

    // Try to parse as JSON, but return text if parsing fails
    let quiz;
    try {
      quiz = JSON.parse(llmResponse.content);
    } catch {
      quiz = llmResponse.content;
    }

    return {
      success: true,
      data: { quiz, questionCount, difficulty, questionTypes }
    };
  } catch (error) {
    logger.error({ error, documentId: jobData.documentId }, 'Quiz generation failed');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function generateFlashcardsJob(jobData: JobData): Promise<JobResult> {
  try {
    const { documentId, options = {} } = jobData;

    // Get document
    const document = documentStore.get(documentId);
    if (!document || !document.extractedText) {
      throw new Error(`Document not found or not processed: ${documentId}`);
    }

    const cardCount = options.cardCount || 15;
    const focusAreas = options.focusAreas || ['key-terms', 'concepts', 'facts'];

    logger.info({ documentId, cardCount, focusAreas }, 'Generating flashcards');

    // Create prompts
    const systemPrompt = 'You are an expert educational content creator. Generate flashcards based on the provided document.';
    const userPrompt = `Generate ${cardCount} flashcards focusing on: ${focusAreas.join(', ')}\n\nDocument content:\n${document.extractedText}`;

    // Generate flashcards
    const llmResponse = await llmService.generateText(systemPrompt, userPrompt, {
      maxTokens: 2000,
      temperature: 0.5
    });

    // Try to parse as JSON, but return text if parsing fails
    let flashcards;
    try {
      flashcards = JSON.parse(llmResponse.content);
    } catch {
      flashcards = llmResponse.content;
    }

    return {
      success: true,
      data: { flashcards, cardCount, focusAreas }
    };
  } catch (error) {
    logger.error({ error, documentId: jobData.documentId }, 'Flashcard generation failed');

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
