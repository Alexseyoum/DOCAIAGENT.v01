import { logger } from './logger';

export interface TextChunk {
  index: number;
  text: string;
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

export interface ChunkingOptions {
  maxChunkSize?: number; // in characters
  overlap?: number; // overlap between chunks in characters
  splitOnParagraphs?: boolean;
  splitOnSentences?: boolean;
}

/**
 * Chunk large text into smaller pieces for processing
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkSize = 4000, // ~1000 tokens
    overlap = 200,
    splitOnParagraphs = true,
    splitOnSentences = true
  } = options;

  if (text.length <= maxChunkSize) {
    // Text is small enough, return as single chunk
    return [{
      index: 0,
      text,
      startPosition: 0,
      endPosition: text.length,
      wordCount: text.split(/\s+/).length
    }];
  }

  const chunks: TextChunk[] = [];
  let position = 0;
  let chunkIndex = 0;

  while (position < text.length) {
    let chunkEnd = Math.min(position + maxChunkSize, text.length);

    // If not at the end, try to find a good split point
    if (chunkEnd < text.length) {
      // Try to split on paragraph boundary
      if (splitOnParagraphs) {
        const paragraphBreak = text.lastIndexOf('\n\n', chunkEnd);
        if (paragraphBreak > position) {
          chunkEnd = paragraphBreak + 2; // Include the newlines
        }
      }

      // If no paragraph break found, try sentence boundary
      if (chunkEnd === position + maxChunkSize && splitOnSentences) {
        const sentenceBreak = findSentenceBoundary(text, position, chunkEnd);
        if (sentenceBreak > position) {
          chunkEnd = sentenceBreak;
        }
      }

      // If still no good break, try word boundary
      if (chunkEnd === position + maxChunkSize) {
        const wordBreak = text.lastIndexOf(' ', chunkEnd);
        if (wordBreak > position) {
          chunkEnd = wordBreak + 1; // Include the space
        }
      }
    }

    const chunkText = text.substring(position, chunkEnd);

    chunks.push({
      index: chunkIndex,
      text: chunkText.trim(),
      startPosition: position,
      endPosition: chunkEnd,
      wordCount: chunkText.split(/\s+/).length
    });

    // Move position forward, accounting for overlap
    position = chunkEnd - overlap;
    if (position <= chunks[chunks.length - 1].startPosition) {
      position = chunkEnd; // Prevent infinite loop
    }

    chunkIndex++;
  }

  logger.info({
    totalLength: text.length,
    chunkCount: chunks.length,
    avgChunkSize: Math.round(text.length / chunks.length),
    maxChunkSize
  }, 'Text chunked successfully');

  return chunks;
}

/**
 * Find a sentence boundary near the target position
 */
function findSentenceBoundary(text: string, start: number, targetEnd: number): number {
  // Look for sentence-ending punctuation followed by space or newline
  const sentenceEnders = ['. ', '! ', '? ', '.\n', '!\n', '?\n'];

  let bestMatch = -1;

  for (const ender of sentenceEnders) {
    const pos = text.lastIndexOf(ender, targetEnd);
    if (pos > start && pos > bestMatch) {
      bestMatch = pos + ender.length;
    }
  }

  return bestMatch > start ? bestMatch : targetEnd;
}

/**
 * Combine results from multiple chunks
 */
export function combineChunkResults<T>(
  chunkResults: T[],
  combiner: (results: T[]) => T
): T {
  return combiner(chunkResults);
}

/**
 * Process text in chunks with a callback
 */
export async function processInChunks<T>(
  text: string,
  processor: (chunk: TextChunk) => Promise<T>,
  options: ChunkingOptions = {}
): Promise<T[]> {
  const chunks = chunkText(text, options);

  logger.info({ chunkCount: chunks.length }, 'Processing text in chunks');

  const results: T[] = [];

  for (const chunk of chunks) {
    try {
      const result = await processor(chunk);
      results.push(result);

      logger.debug({
        chunkIndex: chunk.index,
        totalChunks: chunks.length
      }, 'Chunk processed');
    } catch (error) {
      logger.error({
        error,
        chunkIndex: chunk.index
      }, 'Chunk processing failed');
      throw error;
    }
  }

  return results;
}

/**
 * Get statistics about text chunking
 */
export function getChunkingStats(text: string, options: ChunkingOptions = {}): {
  textLength: number;
  estimatedChunks: number;
  estimatedTokens: number;
  recommendedMaxChunkSize: number;
} {
  const { maxChunkSize = 4000 } = options;

  const textLength = text.length;
  const estimatedTokens = Math.ceil(textLength / 4); // Rough estimate: 4 chars per token
  const estimatedChunks = Math.ceil(textLength / maxChunkSize);

  // Recommend chunk size based on text length
  let recommendedMaxChunkSize = 4000;
  if (textLength > 100000) {
    recommendedMaxChunkSize = 8000; // Larger chunks for very long documents
  }

  return {
    textLength,
    estimatedChunks,
    estimatedTokens,
    recommendedMaxChunkSize
  };
}
