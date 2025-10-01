/**
 * GDPR Data Export API Endpoint
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides GDPR-compliant data export functionality for user data requests.
 * Implements Article 15 (Right of access) of the GDPR.
 */

import { NextRequest, NextResponse } from 'next/server'
import { exportUserData, logAuditEvent } from '@/lib/utils/dataCompliance'
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
    const body = await request.json()
    
    // Validate required fields
    if (!body.email) {
      logInfo('Data export failed - missing email', context)
      return NextResponse.json(
        { success: false, error: 'Email address is required for data export' },
        { 
          status: 400,
          headers: {
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      logInfo('Data export failed - invalid email format', context, { email: body.email })
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { 
          status: 400,
          headers: {
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    // Export user data
    const exportResult = await exportUserData(body.email)
    
    if (!exportResult.success) {
      logError(new Error(exportResult.error || 'Export failed'), context, { 
        component: 'gdpr_export',
        email: body.email
      })
      return NextResponse.json(
        { success: false, error: 'Failed to export user data' },
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

    logInfo('Data export completed successfully', context, { 
      email: body.email,
      recordsExported: exportResult.data ? {
        leads: exportResult.data.lead ? 1 : 0,
        designs: exportResult.data.designs.length,
        analytics: exportResult.data.analytics.length
      } : {},
      responseTime: timer.end()
    })

    return NextResponse.json({
      success: true,
      data: exportResult.data
    }, { 
      status: 200,
      headers: {
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders(),
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="data-export-${body.email}-${new Date().toISOString().split('T')[0]}.json"`
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'gdpr_export' })
    
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

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

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
