/**
 * System Health Check API
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Comprehensive system health endpoint with circuit breaker protection
 * Addresses OPS-001: Monitoring service dependencies with fallback mechanisms
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  rateLimit, 
  getClientIdentifier, 
  getSecurityHeaders, 
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo
} from '@/lib/middleware/security';
import { getSystemHealthChecker } from '@/lib/monitoring/health';

export async function GET(request: NextRequest) {
  const timer = createRequestTimer();
  const clientId = getClientIdentifier(request);
  const requestId = crypto.randomUUID();
  
  const context = {
    method: 'GET',
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date().toISOString(),
    requestId,
    clientIp: clientId
  };

  try {
    // Apply rate limiting (generous for health checks)
    const rateLimitResult = rateLimit(clientId, { maxRequests: 50 });
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for system health check', context);
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      );
    }

    // Perform comprehensive system health check with circuit breaker protection
    const healthChecker = getSystemHealthChecker();
    const systemHealth = await healthChecker.checkSystemHealth(requestId);

    // Include circuit breaker states in response for monitoring
    const circuitBreakerStates = healthChecker.getCircuitBreakerStates();

    const response = {
      ...systemHealth,
      circuitBreakers: circuitBreakerStates,
      responseTime: timer.end()
    };

    logInfo('System health check completed', context, { 
      overallStatus: systemHealth.overall,
      serviceCount: systemHealth.services.length,
      responseTime: timer.end() 
    });

    // Set HTTP status based on system health
    const httpStatus = systemHealth.overall === 'healthy' ? 200 : 
                      systemHealth.overall === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': systemHealth.overall
      }
    });
    
  } catch (error) {
    logError(error, context, { component: 'system_health_check' });
    
    // Return minimal error response to avoid exposing system details
    return NextResponse.json(
      { 
        error: 'System health check failed',
        requestId,
        timestamp: new Date().toISOString(),
        overall: 'unhealthy'
      },
      { 
        status: 503,
        headers: {
          ...getSecurityHeaders(),
          ...getCorsHeaders(request.headers.get('origin') || undefined),
          ...timer.getHeaders(),
          'X-Health-Status': 'unhealthy'
        }
      }
    );
  }
}