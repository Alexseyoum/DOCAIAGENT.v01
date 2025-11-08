/**
 * React hooks for Document Processing Agent
 */

import { useState, useEffect, useCallback } from 'react';
import type { DocumentAgentClient } from './client';
import type {
  Document,
  UploadDocumentOptions,
  GenerateSummaryOptions,
  GenerateQuizOptions,
  GenerateFlashcardsOptions,
  JobResult,
} from './types';

// ========================================
// Hook Types
// ========================================

interface UseDocumentUploadResult {
  upload: (options: UploadDocumentOptions) => Promise<Document | null>;
  isUploading: boolean;
  error: Error | null;
  document: Document | null;
}

interface UseJobResult<T = any> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

interface UseDocumentsResult {
  documents: Document[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

// ========================================
// Hooks
// ========================================

/**
 * Hook for uploading documents
 */
export function useDocumentUpload(client: DocumentAgentClient): UseDocumentUploadResult {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [document, setDocument] = useState<Document | null>(null);

  const upload = useCallback(
    async (options: UploadDocumentOptions) => {
      setIsUploading(true);
      setError(null);
      setDocument(null);

      try {
        const response = await client.uploadDocument(options);
        if (response.data) {
          setDocument(response.data);
          return response.data;
        }
        return null;
      } catch (err) {
        setError(err as Error);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [client]
  );

  return { upload, isUploading, error, document };
}

/**
 * Hook for fetching a document
 */
export function useDocument(
  client: DocumentAgentClient,
  documentId: string | null
): UseJobResult<Document> {
  const [data, setData] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!documentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await client.getDocument(documentId);
      if (response.data) {
        setData(response.data);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [client, documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  return { data, isLoading, error, refetch: fetchDocument };
}

/**
 * Hook for fetching all documents
 */
export function useDocuments(client: DocumentAgentClient): UseDocumentsResult {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await client.listDocuments();
      if (response.data?.documents) {
        setDocuments(response.data.documents);
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = useCallback(
    async (id: string) => {
      await client.deleteDocument(id);
      await fetchDocuments();
    },
    [client, fetchDocuments]
  );

  return { documents, isLoading, error, refetch: fetchDocuments, deleteDocument };
}

/**
 * Hook for generating a summary with automatic polling
 */
export function useSummaryGeneration(
  client: DocumentAgentClient
): {
  generate: (options: GenerateSummaryOptions) => Promise<void>;
  data: any | null;
  isGenerating: boolean;
  error: Error | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any | null>(null);

  const generate = useCallback(
    async (options: GenerateSummaryOptions) => {
      setIsGenerating(true);
      setError(null);
      setData(null);

      try {
        const response = await client.generateSummary(options);
        if (response.data?.jobId) {
          const result = await client.waitForJob(response.data.jobId);
          if (result.success && result.data) {
            setData(result.data);
          } else {
            throw new Error(result.error || 'Generation failed');
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsGenerating(false);
      }
    },
    [client]
  );

  return { generate, data, isGenerating, error };
}

/**
 * Hook for generating a quiz with automatic polling
 */
export function useQuizGeneration(
  client: DocumentAgentClient
): {
  generate: (options: GenerateQuizOptions) => Promise<void>;
  data: any | null;
  isGenerating: boolean;
  error: Error | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any | null>(null);

  const generate = useCallback(
    async (options: GenerateQuizOptions) => {
      setIsGenerating(true);
      setError(null);
      setData(null);

      try {
        const response = await client.generateQuiz(options);
        if (response.data?.jobId) {
          const result = await client.waitForJob(response.data.jobId);
          if (result.success && result.data) {
            setData(result.data);
          } else {
            throw new Error(result.error || 'Generation failed');
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsGenerating(false);
      }
    },
    [client]
  );

  return { generate, data, isGenerating, error };
}

/**
 * Hook for generating flashcards with automatic polling
 */
export function useFlashcardsGeneration(
  client: DocumentAgentClient
): {
  generate: (options: GenerateFlashcardsOptions) => Promise<void>;
  data: any | null;
  isGenerating: boolean;
  error: Error | null;
} {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<any | null>(null);

  const generate = useCallback(
    async (options: GenerateFlashcardsOptions) => {
      setIsGenerating(true);
      setError(null);
      setData(null);

      try {
        const response = await client.generateFlashcards(options);
        if (response.data?.jobId) {
          const result = await client.waitForJob(response.data.jobId);
          if (result.success && result.data) {
            setData(result.data);
          } else {
            throw new Error(result.error || 'Generation failed');
          }
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsGenerating(false);
      }
    },
    [client]
  );

  return { generate, data, isGenerating, error };
}

/**
 * Hook for monitoring job status
 */
export function useJob(
  client: DocumentAgentClient,
  jobId: string | null,
  options: { pollInterval?: number; autoPoll?: boolean } = {}
): UseJobResult<JobResult> {
  const [data, setData] = useState<JobResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchJob = useCallback(async () => {
    if (!jobId) return;

    setIsLoading(true);
    setError(null);

    try {
      const statusResponse = await client.getJobStatus(jobId);
      const status = statusResponse.data?.status;

      if (status === 'completed' || status === 'failed') {
        const resultResponse = await client.getJobResult(jobId);
        if (resultResponse.data) {
          setData(resultResponse.data);
        }
        setIsLoading(false);
      }
    } catch (err) {
      setError(err as Error);
      setIsLoading(false);
    }
  }, [client, jobId]);

  useEffect(() => {
    if (!jobId || !options.autoPoll) return;

    fetchJob();

    const interval = setInterval(fetchJob, options.pollInterval || 2000);

    return () => clearInterval(interval);
  }, [fetchJob, jobId, options.autoPoll, options.pollInterval]);

  return { data, isLoading, error, refetch: fetchJob };
}
