import { config } from '../config';
import { logger } from '../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Unified LLM response interface
export interface LLMResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Unified LLM service
class LLMService {
  private anthropicClient?: Anthropic;
  private groqClient?: Groq;
  private geminiClient?: GoogleGenerativeAI;

  constructor() {
    // Initialize the selected provider
    switch (config.llmProvider) {
      case 'anthropic':
        if (config.anthropicApiKey) {
          this.anthropicClient = new Anthropic({
            apiKey: config.anthropicApiKey
          });
          logger.info('Initialized Anthropic Claude client');
        }
        break;

      case 'groq':
        if (config.groqApiKey) {
          this.groqClient = new Groq({
            apiKey: config.groqApiKey
          });
          logger.info('Initialized Groq client');
        }
        break;

      case 'gemini':
        if (config.geminiApiKey) {
          this.geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
          logger.info('Initialized Google Gemini client');
        }
        break;
    }
  }

  /**
   * Generate text using the configured LLM provider
   */
  async generateText(
    systemPrompt: string,
    userPrompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<LLMResponse> {
    const { maxTokens = 4096, temperature = 0.7 } = options;

    logger.info({
      provider: config.llmProvider,
      promptLength: userPrompt.length,
      maxTokens
    }, 'Generating text with LLM');

    switch (config.llmProvider) {
      case 'anthropic':
        return this.generateWithClaude(systemPrompt, userPrompt, maxTokens, temperature);

      case 'groq':
        return this.generateWithGroq(systemPrompt, userPrompt, maxTokens, temperature);

      case 'gemini':
        return this.generateWithGemini(systemPrompt, userPrompt, maxTokens, temperature);

      default:
        throw new Error(`Unsupported LLM provider: ${config.llmProvider}`);
    }
  }

  /**
   * Generate text using Anthropic Claude
   */
  private async generateWithClaude(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<LLMResponse> {
    if (!this.anthropicClient) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens
      }
    };
  }

  /**
   * Generate text using Groq (FREE)
   * Uses Llama 3.3 70B model
   */
  private async generateWithGroq(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<LLMResponse> {
    if (!this.groqClient) {
      throw new Error('Groq client not initialized');
    }

    const response = await this.groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast and free!
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: maxTokens,
      temperature
    });

    const content = response.choices[0]?.message?.content || '';

    return {
      content,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0
      }
    };
  }

  /**
   * Generate text using Google Gemini (FREE)
   * Uses Gemini 1.5 Flash model
   */
  private async generateWithGemini(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number,
    temperature: number
  ): Promise<LLMResponse> {
    if (!this.geminiClient) {
      throw new Error('Gemini client not initialized');
    }

    const model = this.geminiClient.getGenerativeModel({
      model: 'gemini-1.5-flash', // Fast and free!
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature
      },
      systemInstruction: systemPrompt
    });

    const result = await model.generateContent(userPrompt);
    const response = result.response;
    const content = response.text();

    return {
      content,
      usage: {
        inputTokens: response.usageMetadata?.promptTokenCount || 0,
        outputTokens: response.usageMetadata?.candidatesTokenCount || 0
      }
    };
  }

  /**
   * Get the current provider name
   */
  getProviderName(): string {
    return config.llmProvider;
  }

  /**
   * Check if LLM is available
   */
  isAvailable(): boolean {
    switch (config.llmProvider) {
      case 'anthropic':
        return !!this.anthropicClient;
      case 'groq':
        return !!this.groqClient;
      case 'gemini':
        return !!this.geminiClient;
      default:
        return false;
    }
  }
}

// Export singleton instance
export const llmService = new LLMService();
