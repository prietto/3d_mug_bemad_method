/**
 * Data Retention Cleanup API Endpoint  
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides automated data cleanup functionality based on retention policies.
 * This endpoint should be called by a cron job or scheduled task.
 */

import { NextRequest, NextResponse } from 'next/server'
import { executeDataRetentionCleanup, DEFAULT_RETENTION_CONFIG } from '@/lib/utils/dataCompliance'
import { 
  getSecurityHeaders, 
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo,
  getClientIdentifier
} from '@/lib/middleware/security'

export async function POST(request: NextRequest) {
  const timer = createRequestTimer()
  const requestId = crypto.randomUUID()
  const clientId = getClientIdentifier(request)
  
  const context = {
    method: 'POST',
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date().toISOString(),
    requestId,
    clientIp: clientId
  }

  try {
    // Verify authorization (in production, this should be protected by API key)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CLEANUP_API_TOKEN || 'dev-token-change-in-production'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      logInfo('Data cleanup failed - unauthorized', context)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { 
          status: 401,
          headers: {
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    const body = await request.json().catch(() => ({}))
    
    // Use custom retention config if provided, otherwise use defaults
    const retentionConfig = {
      ...DEFAULT_RETENTION_CONFIG,
      ...body.retentionConfig
    }

    logInfo('Starting data retention cleanup', context, { retentionConfig })

    // Execute cleanup operation
    const cleanupResult = await executeDataRetentionCleanup(retentionConfig)
    
    if (!cleanupResult.success) {
      logError(new Error(cleanupResult.error || 'Cleanup failed'), context, { 
        component: 'data_retention_cleanup',
        retentionConfig
      })
      return NextResponse.json(
        { success: false, error: 'Failed to execute data cleanup' },
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

    logInfo('Data retention cleanup completed successfully', context, { 
      deletedCounts: cleanupResult.deletedCounts,
      retentionConfig,
      responseTime: timer.end()
    })

    return NextResponse.json({
      success: true,
      deletedCounts: cleanupResult.deletedCounts,
      retentionConfig,
      executedAt: new Date().toISOString()
    }, { 
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders()
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'data_retention_cleanup' })
    
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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

// Health check endpoint for monitoring
export async function GET(request: NextRequest) {
  const context = {
    method: 'GET',
    url: request.url,
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    clientIp: getClientIdentifier(request)
  }

  try {
    // Return cleanup service status
    return NextResponse.json({
      service: 'data-retention-cleanup',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      retentionConfig: DEFAULT_RETENTION_CONFIG
    }, {
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined)
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'cleanup_health_check' })
    
    return NextResponse.json(
      { service: 'data-retention-cleanup', status: 'error' },
      { 
        status: 500,
        headers: {
          ...getSecurityHeaders(),
          ...getCorsHeaders(request.headers.get('origin') || undefined)
        }
      }
    )
  }
}

// Only allow POST and GET methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}
