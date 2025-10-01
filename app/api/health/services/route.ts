/**
 * External Services Health Check API
 * Story 3.5: Performance Monitoring and System Health
 * 
 * Health monitoring for external service dependencies
 * Addresses TECH-001: Complex multi-service integration points
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
import { 
  checkSentryHealth,
  checkVercelAnalyticsHealth,
  checkGoogleAnalyticsHealth,
  checkEmailServiceHealth
} from '@/lib/monitoring/health';

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
    const rateLimitResult = rateLimit(clientId, { maxRequests: 20 });
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for services health check', context);
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

    // Get URL parameters
    const url = new URL(request.url);
    const service = url.searchParams.get('service');
    const timeout = parseInt(url.searchParams.get('timeout') || '10000');

    // Define service health checks
    const serviceChecks = {
      sentry: checkSentryHealth,
      'vercel-analytics': checkVercelAnalyticsHealth,
      'google-analytics': checkGoogleAnalyticsHealth,
      'email-service': checkEmailServiceHealth
    };

    let results: any = {};

    if (service && serviceChecks[service as keyof typeof serviceChecks]) {
      // Check specific service
      try {
        const healthCheck = serviceChecks[service as keyof typeof serviceChecks];
        const result = await Promise.race([
          healthCheck(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), timeout)
          )
        ]);
        results = {
          service,
          ...(result as any),
          requestId
        };
      } catch (error) {
        results = {
          service,
          name: service,
          status: 'unhealthy',
          lastCheck: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
          requestId
        };
      }
    } else {
      // Check all services concurrently
      const healthCheckPromises = Object.entries(serviceChecks).map(
        async ([serviceName, healthCheck]) => {
          try {
            return await Promise.race([
              healthCheck(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Health check timeout')), timeout)
              )
            ]);
          } catch (error) {
            return {
              name: serviceName,
              status: 'unhealthy' as const,
              lastCheck: new Date(),
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      );

      const healthResults = await Promise.allSettled(healthCheckPromises);
      
      const services = healthResults.map((result, index) => {
        const serviceName = Object.keys(serviceChecks)[index];
        
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: serviceName,
            status: 'unhealthy' as const,
            lastCheck: new Date(),
            error: 'Health check promise rejected'
          };
        }
      });

      // Determine overall services status
      const hasUnhealthy = services.some((s: any) => s.status === 'unhealthy');
      const hasDegraded = services.some((s: any) => s.status === 'degraded');
      
      let overallStatus: string;
      if (hasUnhealthy) {
        overallStatus = 'unhealthy';
      } else if (hasDegraded) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'healthy';
      }

      results = {
        overall: overallStatus,
        services,
        timestamp: new Date().toISOString(),
        requestId,
        serviceCount: services.length,
        healthyCount: services.filter((s: any) => s.status === 'healthy').length,
        degradedCount: services.filter((s: any) => s.status === 'degraded').length,
        unhealthyCount: services.filter((s: any) => s.status === 'unhealthy').length
      };
    }

    logInfo('Services health check completed', context, { 
      serviceSpecific: !!service,
      overallStatus: results.overall || results.status,
      responseTime: timer.end() 
    });

    // Set HTTP status based on results
    const overallStatus = results.overall || results.status;
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json({
      ...results,
      responseTime: timer.end()
    }, {
      status: httpStatus,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Services-Status': overallStatus
      }
    });
    
  } catch (error) {
    logError(error, context, { component: 'services_health_check' });
    
    return NextResponse.json(
      { 
        error: 'Services health check failed',
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
          'X-Services-Status': 'unhealthy'
        }
      }
    );
  }
}