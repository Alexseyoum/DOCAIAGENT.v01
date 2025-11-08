/**
 * Document Processing Agent SDK for Next.js
 */

// Export client
export { DocumentAgentClient, createClient } from './client';

// Export types
export type {
  Document,
  UploadDocumentOptions,
  GenerateSummaryOptions,
  GenerateQuizOptions,
  GenerateFlashcardsOptions,
  SummaryResult,
  QuizResult,
  FlashcardsResult,
  Job,
  JobResult,
  WebhookEvent,
  Webhook,
  RegisterWebhookOptions,
  WebhookPayload,
  HealthStatus,
  ServiceHealth,
  SystemMetrics,
  ApiResponse,
  ClientConfig,
} from './types';

export { DocumentAgentError } from './types';

// Export hooks
export {
  useDocumentUpload,
  useDocument,
  useDocuments,
  useSummaryGeneration,
  useQuizGeneration,
  useFlashcardsGeneration,
  useJob,
} from './hooks';

// Export webhook utilities
export {
  verifyWebhookSignature,
  parseWebhookPayload,
  createWebhookHandler,
} from './webhooks';
