/**
 * Document Processing Agent SDK Types
 */

// ========================================
// Document Types
// ========================================

export interface Document {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  extractedText?: string;
  wordCount?: number;
  pageCount?: number;
  extractedAt?: string;
  extractionError?: string;
}

export interface UploadDocumentOptions {
  file: File | Buffer;
  filename: string;
}

// ========================================
// Generation Types
// ========================================

export interface GenerateSummaryOptions {
  documentId: string;
  detailLevel?: 'brief' | 'standard' | 'detailed';
  maxTokens?: number;
}

export interface GenerateQuizOptions {
  documentId: string;
  questionCount?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: ('multiple-choice' | 'true-false' | 'short-answer')[];
}

export interface GenerateFlashcardsOptions {
  documentId: string;
  cardCount?: number;
  focusAreas?: ('key-terms' | 'concepts' | 'facts' | 'formulas')[];
}

export interface SummaryResult {
  summary: string;
  detailLevel: string;
}

export interface QuizResult {
  quiz: any;
  questionCount: number;
  difficulty: string;
  questionTypes: string[];
}

export interface FlashcardsResult {
  flashcards: any;
  cardCount: number;
  focusAreas: string[];
}

// ========================================
// Job Types
// ========================================

export interface Job {
  id: string;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  result?: JobResult;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

// ========================================
// Webhook Types
// ========================================

export type WebhookEvent =
  | 'job.completed'
  | 'job.failed'
  | 'document.processed'
  | 'document.failed'
  | 'summary.generated'
  | 'quiz.generated'
  | 'flashcards.generated';

export interface Webhook {
  id: string;
  url: string;
  secret?: string;
  events: WebhookEvent[];
  active: boolean;
  createdAt: string;
  lastTriggered?: string;
  metadata?: Record<string, any>;
}

export interface RegisterWebhookOptions {
  url: string;
  events: WebhookEvent[];
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
  webhookId: string;
}

// ========================================
// Health Types
// ========================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services?: {
    cache: ServiceHealth;
    queue: ServiceHealth;
    llm: ServiceHealth;
  };
  system?: SystemMetrics;
}

export interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  type?: string;
  message?: string;
  lastCheck?: string;
}

export interface SystemMetrics {
  memory: {
    total: number;
    free: number;
    used: number;
    usedPercentage: number;
    processUsed: number;
    processUsedMB: number;
  };
  cpu: {
    loadAverage: number[];
    cores: number;
  };
  uptime: {
    process: number;
    system: number;
  };
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
  message?: string;
}

// ========================================
// Client Configuration
// ========================================

export interface ClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

// ========================================
// Error Types
// ========================================

export class DocumentAgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'DocumentAgentError';
  }
}
