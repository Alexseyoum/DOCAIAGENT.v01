import { logger } from '../utils/logger';
import { ErrorCode } from '../types';

interface ErrorMetric {
  code: ErrorCode;
  count: number;
  lastOccurrence: Date;
  endpoints: Map<string, number>;
}

interface ErrorContext {
  requestId?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

class ErrorTrackingService {
  private errorMetrics: Map<ErrorCode, ErrorMetric> = new Map();
  private errorHistory: Array<{
    timestamp: Date;
    code: ErrorCode;
    message: string;
    context: ErrorContext;
  }> = [];

  private readonly MAX_HISTORY_SIZE = 1000;

  /**
   * Track an error occurrence
   */
  trackError(
    code: ErrorCode,
    message: string,
    context: ErrorContext = {}
  ): void {
    // Update metrics
    const metric = this.errorMetrics.get(code) || {
      code,
      count: 0,
      lastOccurrence: new Date(),
      endpoints: new Map()
    };

    metric.count++;
    metric.lastOccurrence = new Date();

    if (context.endpoint) {
      const endpointCount = metric.endpoints.get(context.endpoint) || 0;
      metric.endpoints.set(context.endpoint, endpointCount + 1);
    }

    this.errorMetrics.set(code, metric);

    // Add to history
    this.errorHistory.unshift({
      timestamp: new Date(),
      code,
      message,
      context
    });

    // Maintain history size
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory = this.errorHistory.slice(0, this.MAX_HISTORY_SIZE);
    }

    // Log structured error
    logger.error({
      errorCode: code,
      message,
      ...context,
      metrics: {
        totalOccurrences: metric.count,
        endpointsAffected: metric.endpoints.size
      }
    }, 'Error tracked');
  }

  /**
   * Get error metrics summary
   */
  getMetrics(): {
    totalErrors: number;
    errorsByCode: Record<string, number>;
    recentErrors: number;
    topErrors: Array<{ code: ErrorCode; count: number }>;
  } {
    const totalErrors = Array.from(this.errorMetrics.values())
      .reduce((sum, m) => sum + m.count, 0);

    const errorsByCode: Record<string, number> = {};
    this.errorMetrics.forEach((metric, code) => {
      errorsByCode[code] = metric.count;
    });

    // Recent errors (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(e => e.timestamp > oneHourAgo).length;

    // Top errors
    const topErrors = Array.from(this.errorMetrics.entries())
      .map(([code, metric]) => ({ code, count: metric.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors,
      errorsByCode,
      recentErrors,
      topErrors
    };
  }

  /**
   * Get error history
   */
  getHistory(limit: number = 50): Array<{
    timestamp: Date;
    code: ErrorCode;
    message: string;
    context: ErrorContext;
  }> {
    return this.errorHistory.slice(0, limit);
  }

  /**
   * Check error rate for specific code
   */
  getErrorRate(code: ErrorCode, timeWindowMinutes: number = 60): number {
    const cutoff = new Date(Date.now() - timeWindowMinutes * 60 * 1000);
    const recentCount = this.errorHistory.filter(
      e => e.code === code && e.timestamp > cutoff
    ).length;

    return recentCount / timeWindowMinutes; // Errors per minute
  }

  /**
   * Detect error spikes
   */
  detectSpike(code: ErrorCode, threshold: number = 10): boolean {
    const rate = this.getErrorRate(code, 5); // Last 5 minutes
    return rate > threshold;
  }

  /**
   * Clear metrics (for testing/reset)
   */
  clearMetrics(): void {
    this.errorMetrics.clear();
    this.errorHistory = [];
    logger.info('Error metrics cleared');
  }

  /**
   * Get endpoint error breakdown
   */
  getEndpointErrors(limit: number = 10): Array<{
    endpoint: string;
    errorCount: number;
    errorCodes: Record<string, number>;
  }> {
    const endpointMap = new Map<string, {
      errorCount: number;
      errorCodes: Map<ErrorCode, number>;
    }>();

    this.errorHistory.forEach(error => {
      if (error.context.endpoint) {
        const endpoint = error.context.endpoint;
        if (!endpointMap.has(endpoint)) {
          endpointMap.set(endpoint, {
            errorCount: 0,
            errorCodes: new Map()
          });
        }

        const data = endpointMap.get(endpoint)!;
        data.errorCount++;

        const codeCount = data.errorCodes.get(error.code) || 0;
        data.errorCodes.set(error.code, codeCount + 1);
      }
    });

    return Array.from(endpointMap.entries())
      .map(([endpoint, data]) => ({
        endpoint,
        errorCount: data.errorCount,
        errorCodes: Object.fromEntries(data.errorCodes)
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
      .slice(0, limit);
  }
}

// Singleton instance
export const errorTracking = new ErrorTrackingService();

/**
 * Sanitize stack trace for production
 */
export function sanitizeStackTrace(error: Error, includeStack: boolean = false): {
  name: string;
  message: string;
  stack?: string;
} {
  const result: any = {
    name: error.name,
    message: error.message
  };

  if (includeStack && error.stack) {
    // Remove sensitive paths and internal details
    result.stack = error.stack
      .split('\n')
      .map(line => line.replace(/\(.*[/\\]node_modules[/\\]/, '(node_modules/'))
      .map(line => line.replace(/\(.*[/\\]src[/\\]/, '(src/'))
      .join('\n');
  }

  return result;
}

/**
 * Categorize error severity
 */
export function getErrorSeverity(statusCode: number): 'low' | 'medium' | 'high' | 'critical' {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400 && statusCode < 500) return 'medium';
  if (statusCode >= 300) return 'low';
  return 'low';
}
