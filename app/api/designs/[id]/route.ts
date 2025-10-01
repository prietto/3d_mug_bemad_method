import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { Design, GetDesignResponse } from '@/lib/types'
import { 
  rateLimit, 
  getClientIdentifier, 
  getSecurityHeaders, 
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo
} from '@/lib/middleware/security'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const rateLimitResult = rateLimit(clientId, { maxRequests: 30 })
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for design retrieval', context)
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
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

    const { id } = params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      logInfo('Design retrieval failed - invalid UUID format', context, { providedId: id })
      return NextResponse.json(
        { success: false, error: 'Invalid design ID format' },
        { 
          status: 400,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    const supabase = createServerClient()
    
    // Retrieve design by ID with timeout
    const dbOperation = supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .single()

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    })

    const { data, error } = await Promise.race([dbOperation, timeoutPromise]) as any

    if (error) {
      if (error.code === 'PGRST116') {
        // Design not found
        logInfo('Design not found', context, { designId: id })
        return NextResponse.json(
          { success: false, error: 'Design not found' },
          { 
            status: 404,
            headers: {
              ...rateLimitResult.headers,
              ...getSecurityHeaders(),
              ...getCorsHeaders(request.headers.get('origin') || undefined),
              ...timer.getHeaders()
            }
          }
        )
      }
      
      logError(error, context, { 
        component: 'design_retrieval',
        designId: id
      })
      return NextResponse.json(
        { success: false, error: 'Failed to retrieve design' },
        { 
          status: 500,
          headers: {
            ...rateLimitResult.headers,
            ...getSecurityHeaders(),
            ...getCorsHeaders(request.headers.get('origin') || undefined),
            ...timer.getHeaders()
          }
        }
      )
    }

    const response: GetDesignResponse = {
      success: true,
      data: data as Design
    }

    logInfo('Design retrieved successfully', context, { 
      designId: id,
      responseTime: timer.end()
    })

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders()
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'design_retrieval' })
    
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
