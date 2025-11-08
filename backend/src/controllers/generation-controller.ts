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
