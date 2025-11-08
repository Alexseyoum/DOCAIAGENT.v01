import { logger } from '../utils/logger';
import { cacheService } from './cache-service';
import { queueService } from './queue-service';
import { llmService } from './llm-service';
import { config } from '../config';
import os from 'os';

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    cache: ServiceHealth;
    queue: ServiceHealth;
    llm: ServiceHealth;
  };
  system: SystemMetrics;
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

class HealthService {
  private startTime: number;
  private requestCount: number = 0;
  private errorCount: number = 0;
  private lastHealthCheck: Date | null = null;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Increment request counter
   */
  recordRequest() {
    this.requestCount++;
  }

  /**
   * Increment error counter
   */
  recordError() {
    this.errorCount++;
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    this.lastHealthCheck = new Date();

    const services = await this.checkServices();
    const system = this.getSystemMetrics();

    // Determine overall status
    const serviceStatuses = Object.values(services).map(s => s.status);
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (serviceStatuses.includes('down')) {
      overallStatus = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: config.env,
      services,
      system
    };
  }

  /**
   * Check all services
   */
  private async checkServices(): Promise<HealthStatus['services']> {
    return {
      cache: await this.checkCache(),
      queue: await this.checkQueue(),
      llm: this.checkLLM()
    };
  }

  /**
   * Check cache service health
   */
  private async checkCache(): Promise<ServiceHealth> {
    try {
      const stats = cacheService.getStats();

      return {
        status: 'up',
        type: stats.type,
        message: `Hit rate: ${stats.hitRate}`,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Cache health check failed');
      return {
        status: 'degraded',
        message: 'Cache service unavailable',
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Check queue service health
   */
  private async checkQueue(): Promise<ServiceHealth> {
    try {
      const queueType = queueService.isUsingRedis() ? 'Redis' : 'In-Memory';

      return {
        status: 'up',
        type: queueType,
        message: 'Queue service operational',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'Queue health check failed');
      return {
        status: 'degraded',
        message: 'Queue service unavailable',
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Check LLM service health
   */
  private checkLLM(): ServiceHealth {
    try {
      const isAvailable = llmService.isAvailable();

      return {
        status: isAvailable ? 'up' : 'down',
        type: config.llmProvider,
        message: isAvailable ? 'LLM service available' : 'LLM API key not configured',
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error({ error }, 'LLM health check failed');
      return {
        status: 'down',
        message: 'LLM service check failed',
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): SystemMetrics {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const processUsed = process.memoryUsage().heapUsed;

    return {
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usedPercentage: parseFloat(((usedMem / totalMem) * 100).toFixed(2)),
        processUsed,
        processUsedMB: parseFloat((processUsed / 1024 / 1024).toFixed(2))
      },
      cpu: {
        loadAverage: os.loadavg(),
        cores: os.cpus().length
      },
      uptime: {
        process: process.uptime(),
        system: os.uptime()
      }
    };
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      uptime: process.uptime(),
      requests: {
        total: this.requestCount,
        errors: this.errorCount,
        errorRate: this.requestCount > 0
          ? parseFloat(((this.errorCount / this.requestCount) * 100).toFixed(2))
          : 0
      },
      lastHealthCheck: this.lastHealthCheck?.toISOString() || null,
      startTime: new Date(this.startTime).toISOString()
    };
  }

  /**
   * Readiness probe - check if app is ready to serve traffic
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.getHealthStatus();
      return health.status !== 'unhealthy';
    } catch {
      return false;
    }
  }

  /**
   * Liveness probe - check if app is alive
   */
  isAlive(): boolean {
    return true; // If we can execute this, the app is alive
  }
}

export const healthService = new HealthService();
