/**
 * Health Monitoring Tests
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Tests for OPS-001: Monitoring Service Dependencies SPOF mitigation
 */

import { beforeEach, vi, afterEach } from 'vitest';
import {
  CircuitBreaker,
  ServiceHealthMonitor,
  SystemHealthChecker,
  checkDatabaseHealth,
  checkSentryHealth,
  checkVercelAnalyticsHealth,
  checkGoogleAnalyticsHealth,
  checkEmailServiceHealth,
  getSystemHealthChecker
} from './health';

// Mock global fetch
global.fetch = vi.fn();
global.AbortSignal = {
  timeout: vi.fn((ms: number) => ({
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
} as any;

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [{ count: 1 }], error: null }))
      }))
    }))
  }))
}));

// Mock process and environment
Object.defineProperty(global, 'process', {
  value: {
    uptime: vi.fn(() => 12345),
    env: {
      SENTRY_DSN: 'test-sentry-dsn',
      NEXT_PUBLIC_GA_MEASUREMENT_ID: 'test-ga-id',
      SENDGRID_API_KEY: 'test-sendgrid-key',
      npm_package_version: '1.5.0'
    }
  },
  writable: true
});

// Mock crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123')
  },
  writable: true
});

describe('CircuitBreaker', () => {
  let circuitBreaker: CircuitBreaker;

  beforeEach(() => {
    circuitBreaker = new CircuitBreaker('test-service', {
      failureThreshold: 3,
      timeout: 5000,
      monitorTimeout: 1000
    });
  });

  it('should start in closed state', () => {
    const status = circuitBreaker.getStatus();
    expect(status.state).toBe('closed');
    expect(status.failureCount).toBe(0);
  });

  it('should execute successful operations in closed state', async () => {
    const operation = vi.fn().mockResolvedValue('success');
    
    const result = await circuitBreaker.execute(operation);
    
    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledOnce();
  });

  it('should open circuit after failure threshold', async () => {
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    
    // Trigger failures to reach threshold
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow('Service failure');
    }
    
    const status = circuitBreaker.getStatus();
    expect(status.state).toBe('open');
    expect(status.failureCount).toBe(3);
  });

  it('should use fallback when circuit is open', async () => {
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    const fallback = vi.fn().mockResolvedValue('fallback-result');
    
    // Open circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
    }
    
    // Should use fallback
    const result = await circuitBreaker.execute(failingOperation, fallback);
    expect(result).toBe('fallback-result');
    expect(fallback).toHaveBeenCalledOnce();
  });

  it('should transition to half-open after timeout', async () => {
    vi.useFakeTimers();
    
    const failingOperation = vi.fn().mockRejectedValue(new Error('Service failure'));
    
    // Open circuit
    for (let i = 0; i < 3; i++) {
      await expect(circuitBreaker.execute(failingOperation)).rejects.toThrow();
    }
    
    expect(circuitBreaker.getStatus().state).toBe('open');
    
    // Advance time past timeout
    vi.advanceTimersByTime(6000);
    
    const successOperation = vi.fn().mockResolvedValue('success');
    await circuitBreaker.execute(successOperation);
    
    expect(circuitBreaker.getStatus().state).toBe('closed');
    
    vi.useRealTimers();
  });

  it('should handle operation timeout', async () => {
    const slowOperation = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 2000))
    );
    
    await expect(circuitBreaker.execute(slowOperation)).rejects.toThrow('Timeout');
  });

  it('should reset circuit breaker state', () => {
    // Manually set failure count
    (circuitBreaker as any).state.failureCount = 5;
    (circuitBreaker as any).state.state = 'open';
    
    circuitBreaker.reset();
    
    const status = circuitBreaker.getStatus();
    expect(status.state).toBe('closed');
    expect(status.failureCount).toBe(0);
  });
});

describe('ServiceHealthMonitor', () => {
  let monitor: ServiceHealthMonitor;

  beforeEach(() => {
    monitor = new ServiceHealthMonitor();
  });

  it('should register service with circuit breaker', () => {
    const healthCheck = vi.fn().mockResolvedValue({
      name: 'test-service',
      status: 'healthy',
      lastCheck: new Date()
    });

    monitor.registerService('test-service', healthCheck);
    
    const states = monitor.getCircuitBreakerStates();
    expect(states).toHaveLength(1);
    expect(states[0].serviceName).toBe('test-service');
  });

  it('should check service health with circuit breaker protection', async () => {
    const healthCheck = vi.fn().mockResolvedValue({
      name: 'test-service',
      status: 'healthy',
      lastCheck: new Date()
    });

    monitor.registerService('test-service', healthCheck);
    
    const result = await monitor.checkServiceHealth('test-service', healthCheck);
    
    expect(result.status).toBe('healthy');
    expect(healthCheck).toHaveBeenCalledOnce();
  });

  it('should provide fallback health when service fails', async () => {
    const failingHealthCheck = vi.fn().mockRejectedValue(new Error('Service down'));

    monitor.registerService('failing-service', failingHealthCheck);
    
    const result = await monitor.checkServiceHealth('failing-service', failingHealthCheck);
    
    expect(result.status).toBe('unknown');
    expect(result.error).toContain('fallback');
    expect(result.metadata?.fallback).toBe(true);
  });

  it('should reset specific circuit breaker', () => {
    const healthCheck = vi.fn();
    monitor.registerService('test-service', healthCheck);
    
    const success = monitor.resetCircuitBreaker('test-service');
    expect(success).toBe(true);
    
    const failure = monitor.resetCircuitBreaker('non-existent');
    expect(failure).toBe(false);
  });

  it('should reset all circuit breakers', () => {
    const healthCheck = vi.fn();
    monitor.registerService('service1', healthCheck);
    monitor.registerService('service2', healthCheck);
    
    expect(() => monitor.resetAllCircuitBreakers()).not.toThrow();
  });
});

describe('Health Check Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkDatabaseHealth', () => {
    it('should return healthy status for successful database connection', async () => {
      // Mock performance.now to return predictable timing
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 100; // 100ms response time
      });
      
      const result = await checkDatabaseHealth();
      
      expect(result.name).toBe('database');
      expect(result.status).toBe('healthy');
      expect(result.responseTime).toBe(100);
      
      vi.restoreAllMocks();
    });

    it('should return unhealthy status for database errors', async () => {
      // Mock Supabase to throw error
      const { createServerClient } = await import('@/lib/supabase');
      (createServerClient as any).mockReturnValue({
        from: () => ({
          select: () => ({
            limit: () => Promise.resolve({ 
              data: null, 
              error: { message: 'Connection failed' }
            })
          })
        })
      });
      
      const result = await checkDatabaseHealth();
      
      expect(result.status).toBe('unhealthy');
      expect(result.error).toBe('Connection failed');
    });

    it('should classify response time correctly', async () => {
      // Mock slow response (600ms = degraded)
      let callCount = 0;
      vi.spyOn(performance, 'now').mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0 : 600; // 600ms response time
      });
      
      // Ensure database mock returns success
      const { createServerClient } = await import('@/lib/supabase');
      (createServerClient as any).mockReturnValue({
        from: () => ({
          select: () => ({
            limit: () => Promise.resolve({ 
              data: [{ count: 1 }], 
              error: null 
            })
          })
        })
      });
      
      const result = await checkDatabaseHealth();
      
      expect(result.status).toBe('degraded');
      expect(result.responseTime).toBe(600);
      expect(result.error).toBeUndefined();
      
      vi.restoreAllMocks();
    });
  });

  describe('checkSentryHealth', () => {
    it('should return healthy status for successful Sentry API call', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200
      });
      
      const result = await checkSentryHealth();
      
      expect(result.name).toBe('sentry');
      expect(result.status).toBe('healthy');
      expect(result.metadata?.configured).toBe(true);
    });

    it('should return degraded status for non-200 response', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 503
      });
      
      const result = await checkSentryHealth();
      
      expect(result.status).toBe('degraded');
      expect(result.metadata?.httpStatus).toBe(503);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));
      
      const result = await checkSentryHealth();
      
      expect(result.status).toBe('unhealthy');
      expect(result.error).toContain('Network error');
    });
  });

  describe('checkVercelAnalyticsHealth', () => {
    it('should always return healthy for Vercel Analytics', async () => {
      const result = await checkVercelAnalyticsHealth();
      
      expect(result.name).toBe('vercel-analytics');
      expect(result.status).toBe('healthy');
      expect(result.metadata?.configured).toBe(true);
    });
  });

  describe('checkGoogleAnalyticsHealth', () => {
    it('should return healthy status for accessible GA4 endpoint', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200
      });
      
      const result = await checkGoogleAnalyticsHealth();
      
      expect(result.name).toBe('google-analytics');
      expect(result.status).toBe('healthy');
      expect(result.metadata?.configured).toBe(true);
    });

    it('should handle GA4 endpoint errors as degraded', async () => {
      (global.fetch as any).mockRejectedValue(new Error('CORS error'));
      
      const result = await checkGoogleAnalyticsHealth();
      
      expect(result.status).toBe('degraded');
      expect(result.error).toContain('CORS error');
    });
  });

  describe('checkEmailServiceHealth', () => {
    it('should return healthy status for SendGrid API', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          status: {
            indicator: 'none',
            description: 'All Systems Operational'
          }
        })
      });
      
      const result = await checkEmailServiceHealth();
      
      expect(result.name).toBe('email-service');
      expect(result.status).toBe('healthy');
      expect(result.metadata?.configured).toBe(true);
    });

    it('should return degraded for SendGrid issues', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          status: {
            indicator: 'minor',
            description: 'Minor Service Outage'
          }
        })
      });
      
      const result = await checkEmailServiceHealth();
      
      expect(result.status).toBe('degraded');
      expect(result.metadata?.sendgridStatus).toBe('Minor Service Outage');
    });
  });
});

describe('SystemHealthChecker', () => {
  let healthChecker: SystemHealthChecker;

  beforeEach(() => {
    healthChecker = new SystemHealthChecker();
    vi.clearAllMocks();
  });

  it('should check system health with all services', async () => {
    // Mock performance.now for consistent timing
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? 0 : 50; // 50ms response time for all checks
    });

    // Mock all health checks to be healthy
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        status: { indicator: 'none' }
      })
    });
    
    const result = await healthChecker.checkSystemHealth('test-request-id');
    
    expect(result.overall).toBe('healthy');
    expect(result.services).toHaveLength(5); // database, sentry, vercel, ga4, email
    expect(result.requestId).toBe('test-request-id');
    expect(result.version).toBe('1.5.0');
    
    vi.restoreAllMocks();
  });

  it('should return degraded status when non-critical services fail', async () => {
    // Mock performance.now for consistent timing
    let callCount = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => {
      callCount++;
      return callCount % 2 === 1 ? 0 : 50; // 50ms response time for all checks
    });

    // Mock Sentry to fail (non-critical)
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('sentry.io')) {
        return Promise.reject(new Error('Sentry down'));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ status: { indicator: 'none' }})
      });
    });
    
    const result = await healthChecker.checkSystemHealth();
    
    expect(result.overall).toBe('degraded');
    expect(result.services.find(s => s.name === 'sentry')?.status).toBe('unhealthy');
    
    vi.restoreAllMocks();
  });

  it('should return unhealthy status when critical services fail', async () => {
    // Mock database to fail (critical)
    const { createServerClient } = await import('@/lib/supabase');
    (createServerClient as any).mockReturnValue({
      from: () => ({
        select: () => ({
          limit: () => Promise.reject(new Error('Database connection failed'))
        })
      })
    });
    
    const result = await healthChecker.checkSystemHealth();
    
    expect(result.overall).toBe('unhealthy');
    expect(result.services.find(s => s.name === 'database')?.status).toBe('unhealthy');
  });

  it('should check specific service health', async () => {
    const result = await healthChecker.checkSpecificService('database');
    
    expect(result.name).toBe('database');
    expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(result.status);
  });

  it('should throw error for unregistered service', async () => {
    await expect(
      healthChecker.checkSpecificService('non-existent-service')
    ).rejects.toThrow('Service non-existent-service not registered');
  });

  it('should get circuit breaker states', () => {
    const states = healthChecker.getCircuitBreakerStates();
    
    expect(Array.isArray(states)).toBe(true);
    expect(states.length).toBeGreaterThan(0);
    expect(states[0]).toHaveProperty('serviceName');
    expect(states[0]).toHaveProperty('state');
  });

  it('should reset all circuit breakers', () => {
    expect(() => healthChecker.resetCircuitBreakers()).not.toThrow();
  });
});

describe('Global Health Checker Instance', () => {
  it('should return singleton instance', () => {
    const instance1 = getSystemHealthChecker();
    const instance2 = getSystemHealthChecker();
    
    expect(instance1).toBe(instance2);
  });

  it('should provide working health checker', async () => {
    const healthChecker = getSystemHealthChecker();
    const result = await healthChecker.checkSystemHealth();
    
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('services');
    expect(result).toHaveProperty('timestamp');
  });
});

describe('Error Handling and Edge Cases', () => {
  it('should handle concurrent health checks gracefully', async () => {
    const healthChecker = new SystemHealthChecker();
    
    // Run multiple health checks concurrently
    const promises = Array(5).fill(0).map(() => 
      healthChecker.checkSystemHealth(`concurrent-${Math.random()}`)
    );
    
    const results = await Promise.all(promises);
    
    results.forEach(result => {
      expect(result.overall).toBeDefined();
      expect(result.services).toBeDefined();
      expect(result.requestId).toBeDefined();
    });
  });

  it('should handle network timeouts gracefully', async () => {
    // Mock fetch to timeout
    (global.fetch as any).mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Network timeout')), 100)
      )
    );
    
    const healthChecker = new SystemHealthChecker();
    const result = await healthChecker.checkSystemHealth();
    
    // Should still return a result, even with failures
    expect(result.overall).toBeDefined();
    expect(result.services).toBeDefined();
  });
});