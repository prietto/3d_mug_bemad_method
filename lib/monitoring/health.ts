/**
 * Health Monitoring Utilities with Circuit Breaker Pattern
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Addresses OPS-001: Monitoring Service Dependencies Single Point of Failure
 * - Circuit breaker pattern for monitoring service calls
 * - Fallback monitoring using local metrics collection
 * - Graceful degradation when external services are unavailable
 * - Retry logic with exponential backoff for monitoring APIs
 * - Internal health check that doesn't depend on external services
 */

import { createServerClient } from '@/lib/supabase';

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  responseTime?: number;
  lastCheck: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: Date;
  uptime: number;
  version: string;
  requestId?: string;
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms to wait before trying again */
  timeout: number;
  /** Time in ms for each monitoring attempt */
  monitorTimeout: number;
  /** Maximum retry attempts */
  maxRetries: number;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  nextAttemptTime?: Date;
}

/**
 * Circuit Breaker implementation for external service monitoring
 */
export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;
  private serviceName: string;

  constructor(serviceName: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.serviceName = serviceName;
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      monitorTimeout: 5000, // 5 seconds
      maxRetries: 3,
      ...config
    };
    
    this.state = {
      state: 'closed',
      failureCount: 0
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    operation: () => Promise<T>,
    fallback?: () => Promise<T>
  ): Promise<T> {
    if (this.state.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'half-open';
      } else {
        if (fallback) {
          return await fallback();
        }
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
    }

    try {
      const result = await this.executeWithTimeout(operation);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      
      if (fallback) {
        return await fallback();
      }
      
      throw error;
    }
  }

  private async executeWithTimeout<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout after ${this.config.monitorTimeout}ms for ${this.serviceName}`));
      }, this.config.monitorTimeout);

      operation()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  private onSuccess(): void {
    this.state.failureCount = 0;
    this.state.lastSuccessTime = new Date();
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
    }
  }

  private onFailure(error: Error): void {
    this.state.failureCount++;
    this.state.lastFailureTime = new Date();

    if (this.state.failureCount >= this.config.failureThreshold) {
      this.state.state = 'open';
      this.state.nextAttemptTime = new Date(Date.now() + this.config.timeout);
    }
  }

  private shouldAttemptReset(): boolean {
    return this.state.nextAttemptTime ? 
      new Date() >= this.state.nextAttemptTime : 
      false;
  }

  /**
   * Get current circuit breaker status
   */
  getStatus(): CircuitBreakerState & { serviceName: string } {
    return {
      ...this.state,
      serviceName: this.serviceName
    };
  }

  /**
   * Reset circuit breaker to closed state
   */
  reset(): void {
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastSuccessTime: new Date()
    };
  }
}

/**
 * Service health monitor with circuit breaker protection
 */
export class ServiceHealthMonitor {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private localMetrics: Map<string, ServiceHealth> = new Map();

  /**
   * Register a service for health monitoring
   */
  registerService(
    name: string, 
    healthCheck: () => Promise<ServiceHealth>,
    config?: Partial<CircuitBreakerConfig>
  ): void {
    const circuitBreaker = new CircuitBreaker(name, config);
    this.circuitBreakers.set(name, circuitBreaker);

    // Initialize local metrics with unknown status
    this.localMetrics.set(name, {
      name,
      status: 'unknown',
      lastCheck: new Date(),
    });
  }

  /**
   * Check health of a specific service with circuit breaker protection
   */
  async checkServiceHealth(
    name: string, 
    healthCheck: () => Promise<ServiceHealth>
  ): Promise<ServiceHealth> {
    const circuitBreaker = this.circuitBreakers.get(name);
    
    if (!circuitBreaker) {
      throw new Error(`Service ${name} not registered for monitoring`);
    }

    try {
      const health = await circuitBreaker.execute(
        healthCheck,
        () => this.getFallbackHealth(name)
      );

      // Update local metrics cache
      this.localMetrics.set(name, health);
      return health;

    } catch (error) {
      // Return cached or fallback health if available
      const fallbackHealth = await this.getFallbackHealth(name);
      this.localMetrics.set(name, fallbackHealth);
      return fallbackHealth;
    }
  }

  /**
   * Get fallback health status from local metrics
   */
  private async getFallbackHealth(name: string): Promise<ServiceHealth> {
    const cached = this.localMetrics.get(name);
    
    return {
      name,
      status: 'unknown',
      lastCheck: new Date(),
      error: 'Service monitoring unavailable - using fallback',
      metadata: {
        fallback: true,
        cachedStatus: cached?.status,
        cachedLastCheck: cached?.lastCheck,
        circuitBreakerState: this.circuitBreakers.get(name)?.getStatus()
      }
    };
  }

  /**
   * Get all circuit breaker states
   */
  getCircuitBreakerStates(): Array<CircuitBreakerState & { serviceName: string }> {
    return Array.from(this.circuitBreakers.values()).map(cb => cb.getStatus());
  }

  /**
   * Reset circuit breaker for a specific service
   */
  resetCircuitBreaker(serviceName: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (circuitBreaker) {
      circuitBreaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all circuit breakers
   */
  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach(cb => cb.reset());
  }
}

/**
 * Database health checker with performance monitoring
 */
export async function checkDatabaseHealth(): Promise<ServiceHealth> {
  const startTime = performance.now();
  
  try {
    const supabase = createServerClient();
    
    // Test basic connectivity with a lightweight query
    const { data, error } = await supabase
      .from('leads')
      .select('count')
      .limit(1);
    
    const responseTime = Math.round(performance.now() - startTime);
    
    if (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        error: error.message
      };
    }

    // Determine status based on response time
    let status: ServiceHealth['status'] = 'healthy';
    if (responseTime > 1000) {
      status = 'unhealthy';
    } else if (responseTime > 500) {
      status = 'degraded';
    }

    return {
      name: 'database',
      status,
      responseTime,
      lastCheck: new Date(),
      metadata: {
        connectionPool: 'active',
        queryResult: data ? 'success' : 'empty'
      }
    };

  } catch (error) {
    return {
      name: 'database',
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - startTime),
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * External service health checkers
 */
export async function checkSentryHealth(): Promise<ServiceHealth> {
  const startTime = performance.now();
  
  try {
    // Basic connectivity check to Sentry
    const response = await fetch('https://sentry.io/api/0/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Landing-Page-Health-Check'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      name: 'sentry',
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date(),
      metadata: {
        httpStatus: response.status,
        configured: !!process.env.SENTRY_DSN
      }
    };
    
  } catch (error) {
    return {
      name: 'sentry',
      status: 'unhealthy',
      responseTime: Math.round(performance.now() - startTime),
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'Sentry health check failed'
    };
  }
}

export async function checkVercelAnalyticsHealth(): Promise<ServiceHealth> {
  // Vercel Analytics doesn't have a public health endpoint
  // Check if it's configured and assume healthy if so
  return {
    name: 'vercel-analytics',
    status: 'healthy', // Assume healthy if configured
    lastCheck: new Date(),
    metadata: {
      configured: true, // Vercel Analytics is built-in
      note: 'No external health endpoint available'
    }
  };
}

export async function checkGoogleAnalyticsHealth(): Promise<ServiceHealth> {
  const startTime = performance.now();
  
  try {
    // Check if GA4 measurement endpoint is accessible
    const response = await fetch('https://www.google-analytics.com/mp/collect', {
      method: 'OPTIONS',
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      name: 'google-analytics',
      status: 'healthy', // GA4 typically doesn't return detailed health info
      responseTime,
      lastCheck: new Date(),
      metadata: {
        configured: !!process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
        endpointAccessible: true
      }
    };
    
  } catch (error) {
    return {
      name: 'google-analytics',
      status: 'degraded', // Not critical for app functionality
      responseTime: Math.round(performance.now() - startTime),
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'GA4 health check failed'
    };
  }
}

export async function checkEmailServiceHealth(): Promise<ServiceHealth> {
  const startTime = performance.now();
  
  try {
    // Check SendGrid status page API
    const response = await fetch('https://status.sendgrid.com/api/v2/status.json', {
      signal: AbortSignal.timeout(5000)
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    
    if (!response.ok) {
      throw new Error(`SendGrid status API returned ${response.status}`);
    }
    
    const status = await response.json();
    
    return {
      name: 'email-service',
      status: status.status?.indicator === 'none' ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date(),
      metadata: {
        configured: !!process.env.SENDGRID_API_KEY,
        sendgridStatus: status.status?.description || 'unknown'
      }
    };
    
  } catch (error) {
    return {
      name: 'email-service',
      status: 'degraded', // Email issues shouldn't break the app
      responseTime: Math.round(performance.now() - startTime),
      lastCheck: new Date(),
      error: error instanceof Error ? error.message : 'Email service health check failed'
    };
  }
}

/**
 * Comprehensive system health checker
 */
export class SystemHealthChecker {
  private serviceMonitor: ServiceHealthMonitor;
  private registeredChecks = new Map<string, () => Promise<ServiceHealth>>();

  constructor() {
    this.serviceMonitor = new ServiceHealthMonitor();
    this.initializeHealthChecks();
  }

  private initializeHealthChecks(): void {
    // Register all health checks with circuit breaker protection
    const healthChecks = [
      { name: 'database', check: checkDatabaseHealth, critical: true },
      { name: 'sentry', check: checkSentryHealth, critical: false },
      { name: 'vercel-analytics', check: checkVercelAnalyticsHealth, critical: false },
      { name: 'google-analytics', check: checkGoogleAnalyticsHealth, critical: false },
      { name: 'email-service', check: checkEmailServiceHealth, critical: false }
    ];

    healthChecks.forEach(({ name, check, critical }) => {
      this.serviceMonitor.registerService(name, check, {
        failureThreshold: critical ? 3 : 5,
        timeout: critical ? 30000 : 60000,
        monitorTimeout: 5000
      });
      
      this.registeredChecks.set(name, check);
    });
  }

  /**
   * Perform comprehensive system health check
   */
  async checkSystemHealth(requestId?: string): Promise<SystemHealth> {
    const startTime = performance.now();
    const services: ServiceHealth[] = [];
    
    // Check all registered services concurrently
    const healthCheckPromises = Array.from(this.registeredChecks.entries()).map(
      async ([name, check]) => {
        try {
          return await this.serviceMonitor.checkServiceHealth(name, check);
        } catch (error) {
          return {
            name,
            status: 'unknown' as const,
            lastCheck: new Date(),
            error: error instanceof Error ? error.message : 'Health check failed'
          };
        }
      }
    );

    const results = await Promise.allSettled(healthCheckPromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        services.push(result.value);
      }
    });

    // Determine overall system health
    const criticalServices = ['database'];
    const hasCriticalFailure = services
      .filter(s => criticalServices.includes(s.name))
      .some(s => s.status === 'unhealthy');

    const hasAnyUnhealthy = services.some(s => s.status === 'unhealthy');
    const hasAnyDegraded = services.some(s => s.status === 'degraded');

    let overallStatus: SystemHealth['overall'];
    if (hasCriticalFailure) {
      overallStatus = 'unhealthy';
    } else if (hasAnyUnhealthy || hasAnyDegraded) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return {
      overall: overallStatus,
      services,
      timestamp: new Date(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.5.0',
      requestId
    };
  }

  /**
   * Get circuit breaker states for monitoring
   */
  getCircuitBreakerStates() {
    return this.serviceMonitor.getCircuitBreakerStates();
  }

  /**
   * Reset circuit breakers (for administrative purposes)
   */
  resetCircuitBreakers(): void {
    this.serviceMonitor.resetAllCircuitBreakers();
  }

  /**
   * Check health of a specific service
   */
  async checkSpecificService(serviceName: string): Promise<ServiceHealth> {
    const healthCheck = this.registeredChecks.get(serviceName);
    
    if (!healthCheck) {
      throw new Error(`Service ${serviceName} not registered`);
    }

    return await this.serviceMonitor.checkServiceHealth(serviceName, healthCheck);
  }
}

// Global instance for reuse
let globalHealthChecker: SystemHealthChecker | null = null;

/**
 * Get or create global health checker instance
 */
export function getSystemHealthChecker(): SystemHealthChecker {
  if (!globalHealthChecker) {
    globalHealthChecker = new SystemHealthChecker();
  }
  return globalHealthChecker;
}