import type {
  ClientConfig,
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
  Webhook,
  RegisterWebhookOptions,
  HealthStatus,
  ApiResponse,
  DocumentAgentError,
} from './types';

/**
 * Document Processing Agent Client
 */
export class DocumentAgentClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(config: ClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
  }

  /**
   * Make an API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: {
            code: 'UNKNOWN_ERROR',
            message: `HTTP ${response.status}: ${response.statusText}`,
            timestamp: new Date().toISOString(),
          },
        }));

        throw new DocumentAgentError(
          error.error?.message || error.message || 'Request failed',
          error.error?.code || 'REQUEST_FAILED',
          response.status
        ) as any;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new DocumentAgentError(
          'Request timeout',
          'TIMEOUT',
          408
        ) as any;
      }
      throw error;
    }
  }

  // ========================================
  // Document Methods
  // ========================================

  /**
   * Upload a document
   */
  async uploadDocument(options: UploadDocumentOptions): Promise<ApiResponse<Document>> {
    const formData = new FormData();

    if (options.file instanceof File) {
      formData.append('file', options.file);
    } else {
      // Buffer support for Node.js
      const blob = new Blob([options.file]);
      formData.append('file', blob, options.filename);
    }

    const response = await fetch(`${this.baseUrl}/api/v1/documents`, {
      method: 'POST',
      headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new DocumentAgentError(
        error.error?.message || 'Upload failed',
        error.error?.code || 'UPLOAD_FAILED',
        response.status
      ) as any;
    }

    return await response.json();
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<ApiResponse<Document>> {
    return this.request(`/api/v1/documents/${documentId}`);
  }

  /**
   * List all documents
   */
  async listDocuments(): Promise<ApiResponse<{ documents: Document[] }>> {
    return this.request('/api/v1/documents');
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  // ========================================
  // Generation Methods
  // ========================================

  /**
   * Generate a summary
   */
  async generateSummary(options: GenerateSummaryOptions): Promise<ApiResponse<{ jobId: string }>> {
    return this.request('/api/v1/generate/summary', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Generate a quiz
   */
  async generateQuiz(options: GenerateQuizOptions): Promise<ApiResponse<{ jobId: string }>> {
    return this.request('/api/v1/generate/quiz', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Generate flashcards
   */
  async generateFlashcards(options: GenerateFlashcardsOptions): Promise<ApiResponse<{ jobId: string }>> {
    return this.request('/api/v1/generate/flashcards', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  // ========================================
  // Job Methods
  // ========================================

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<ApiResponse<{ status: string }>> {
    return this.request(`/api/v1/jobs/${jobId}/status`);
  }

  /**
   * Get job result
   */
  async getJobResult(jobId: string): Promise<ApiResponse<JobResult>> {
    return this.request(`/api/v1/jobs/${jobId}/result`);
  }

  /**
   * Wait for job completion with polling
   */
  async waitForJob(
    jobId: string,
    options: { pollInterval?: number; maxAttempts?: number } = {}
  ): Promise<JobResult> {
    const pollInterval = options.pollInterval || 2000;
    const maxAttempts = options.maxAttempts || 60;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const statusResponse = await this.getJobStatus(jobId);
      const status = statusResponse.data?.status;

      if (status === 'completed' || status === 'failed') {
        const resultResponse = await this.getJobResult(jobId);
        if (resultResponse.data) {
          return resultResponse.data;
        }
        throw new DocumentAgentError(
          'Job result not available',
          'RESULT_NOT_AVAILABLE'
        ) as any;
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new DocumentAgentError(
      'Job did not complete within the expected time',
      'JOB_TIMEOUT'
    ) as any;
  }

  // ========================================
  // Webhook Methods
  // ========================================

  /**
   * Register a webhook
   */
  async registerWebhook(options: RegisterWebhookOptions): Promise<ApiResponse<Webhook>> {
    return this.request('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * List webhooks
   */
  async listWebhooks(): Promise<ApiResponse<{ webhooks: Webhook[]; count: number }>> {
    return this.request('/api/v1/webhooks');
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<ApiResponse<Webhook>> {
    return this.request(`/api/v1/webhooks/${webhookId}`);
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Omit<Webhook, 'id' | 'createdAt' | 'secret'>>
  ): Promise<ApiResponse<Webhook>> {
    return this.request(`/api/v1/webhooks/${webhookId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<ApiResponse<void>> {
    return this.request(`/api/v1/webhooks/${webhookId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get webhook deliveries
   */
  async getWebhookDeliveries(webhookId: string, limit?: number): Promise<ApiResponse<any>> {
    const params = limit ? `?limit=${limit}` : '';
    return this.request(`/api/v1/webhooks/${webhookId}/deliveries${params}`);
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(webhookId: string): Promise<ApiResponse<any>> {
    return this.request(`/api/v1/webhooks/${webhookId}/stats`);
  }

  // ========================================
  // Health Methods
  // ========================================

  /**
   * Get health status
   */
  async getHealth(): Promise<HealthStatus> {
    const response = await this.request<HealthStatus>('/health');
    return response;
  }

  /**
   * Get detailed health status
   */
  async getDetailedHealth(): Promise<ApiResponse<HealthStatus>> {
    return this.request('/health/detailed');
  }
}

/**
 * Create a new Document Agent client
 */
export function createClient(config: ClientConfig): DocumentAgentClient {
  return new DocumentAgentClient(config);
}
