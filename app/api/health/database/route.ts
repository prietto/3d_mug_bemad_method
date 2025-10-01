/**
 * Database Health Check API
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Dedicated database health endpoint with performance monitoring
 * Addresses database performance monitoring requirements
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
import { checkDatabaseHealth } from '@/lib/monitoring/health';
import { getDatabasePerformanceAnalytics } from '@/lib/utils/performanceMonitoring';

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
    // Apply rate limiting
    const rateLimitResult = rateLimit(clientId, { maxRequests: 30 });
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for database health check', context);
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

    // Get URL parameters for detailed analysis
    const url = new URL(request.url);
    const includeAnalytics = url.searchParams.get('analytics') === 'true';
    const timeRange = parseInt(url.searchParams.get('hours') || '24');

    // Perform database health check
    const healthStatus = await checkDatabaseHealth();

    // Build response
    const response: any = {
      ...healthStatus,
      requestId,
      responseTime: timer.end(),
      timestamp: new Date().toISOString()
    };

    // Include performance analytics if requested and database is healthy
    if (includeAnalytics && healthStatus.status !== 'unhealthy') {
      try {
        const analytics = await getDatabasePerformanceAnalytics(timeRange);
        if (analytics.success) {
          response.analytics = {
            timeRangeHours: timeRange,
            ...analytics.data
          };
        } else {
          response.analytics = {
            error: 'Analytics unavailable',
            reason: analytics.error
          };
        }
      } catch (analyticsError) {
        response.analytics = {
          error: 'Analytics collection failed',
          reason: analyticsError instanceof Error ? analyticsError.message : 'Unknown error'
        };
      }
    }

    logInfo('Database health check completed', context, { 
      status: healthStatus.status,
      responseTime: healthStatus.responseTime,
      includeAnalytics 
    });

    // Set HTTP status based on database health
    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return NextResponse.json(response, {
      status: httpStatus,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Database-Status': healthStatus.status
      }
    });
    
  } catch (error) {
    logError(error, context, { component: 'database_health_check' });
    
    return NextResponse.json(
      { 
        error: 'Database health check failed',
        requestId,
        timestamp: new Date().toISOString(),
        status: 'unhealthy'
      },
      { 
        status: 503,
        headers: {
          ...getSecurityHeaders(),
          ...getCorsHeaders(request.headers.get('origin') || undefined),
          ...timer.getHeaders(),
          'X-Database-Status': 'unhealthy'
        }
      }
    );
  }
}