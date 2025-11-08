import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const config = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),

  // LLM Provider Selection (groq, gemini, or anthropic)
  llmProvider: (process.env.LLM_PROVIDER || 'groq').toLowerCase() as 'groq' | 'gemini' | 'anthropic',

  // API Keys for different LLM providers
  groqApiKey: process.env.GROQ_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'change-this-in-production',
  jwtExpiresIn: '7d' as const,

  // File Upload
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  maxFileSizeBytes: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10) * 1024 * 1024,
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),

  // Allowed file types
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'text/csv', // .csv
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
  ],

  allowedExtensions: ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx'],

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  uploadRateLimitMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '10', 10),

  // Document Settings
  documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS || '30', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3001']
};

// Validate required config
export function validateConfig() {
  const errors: string[] = [];

  // Validate LLM provider API key
  if (config.env === 'production') {
    switch (config.llmProvider) {
      case 'groq':
        if (!config.groqApiKey) {
          errors.push('GROQ_API_KEY is required when using Groq provider');
        }
        break;
      case 'gemini':
        if (!config.geminiApiKey) {
          errors.push('GEMINI_API_KEY is required when using Gemini provider');
        }
        break;
      case 'anthropic':
        if (!config.anthropicApiKey) {
          errors.push('ANTHROPIC_API_KEY is required when using Anthropic provider');
        }
        break;
      default:
        errors.push(`Invalid LLM_PROVIDER: ${config.llmProvider}. Must be 'groq', 'gemini', or 'anthropic'`);
    }
  }

  if (config.env === 'production' && config.jwtSecret === 'change-this-in-production') {
    errors.push('JWT_SECRET must be changed in production');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
