import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { 
  rateLimit, 
  getClientIdentifier, 
  getSecurityHeaders, 
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo
} from '@/lib/middleware/security'

export async function GET(request: NextRequest) {
  const timer = createRequestTimer()
  const clientId = getClientIdentifier(request)
  const requestId = crypto.randomUUID()
  
  const context = {
    method: 'GET',
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date().toISOString(),
    requestId,
    clientIp: clientId
  }

  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(clientId, { maxRequests: 30 }) // More lenient for health checks
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for health check', context)
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
      )
    }

    // Test database connectivity
    let dbStatus = 'unknown'
    try {
      const supabase = createServerClient()
      const { error } = await supabase.from('designs').select('id').limit(1)
      dbStatus = error ? 'error' : 'connected'
    } catch (dbError) {
      dbStatus = 'error'
      logError(dbError, context, { component: 'database_health_check' })
    }

    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Custom Ceramic Mug Landing Page API',
      version: '1.5.0',
      database: dbStatus,
      uptime: process.uptime(),
      requestId
    }

    logInfo('Health check completed', context, { responseTime: timer.end() })

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders()
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'health_check' })
    
    return NextResponse.json(
      { 
        error: 'Health check failed',
        requestId,
        timestamp: new Date().toISOString()
      },
      { 
        status: 500,
        headers: {
          ...getSecurityHeaders(),
          ...getCorsHeaders(request.headers.get('origin') || undefined),
          ...timer.getHeaders()
        }
      }
    )
  }
}
