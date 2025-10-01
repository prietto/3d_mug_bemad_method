import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { CreateDesignRequest, CreateDesignResponse, Design } from '@/lib/types'
import { 
  rateLimit, 
  getClientIdentifier, 
  getSecurityHeaders, 
  getCorsHeaders,
  createRequestTimer,
  logError,
  logInfo
} from '@/lib/middleware/security'

export async function POST(request: NextRequest) {
  const timer = createRequestTimer()
  const clientId = getClientIdentifier(request)
  const requestId = crypto.randomUUID()
  
  const context = {
    method: 'POST',
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    timestamp: new Date().toISOString(),
    requestId,
    clientIp: clientId
  }

  try {
    // Apply rate limiting
    const rateLimitResult = rateLimit(clientId, { maxRequests: 20 })
    
    if (!rateLimitResult.allowed) {
      logInfo('Rate limit exceeded for design creation', context)
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

    const body: CreateDesignRequest = await request.json()
    
    // Validate required fields
    if (!body.mugColor) {
      logInfo('Design creation failed - missing mugColor', context)
      return NextResponse.json(
        { success: false, error: 'Missing required field: mugColor' },
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

    // Validate image size if provided
    if (body.uploadedImageBase64) {
      const imageSizeInBytes = (body.uploadedImageBase64.length * 3) / 4 // Approximate base64 size
      const maxSizeInBytes = 5 * 1024 * 1024 // 5MB limit
      
      if (imageSizeInBytes > maxSizeInBytes) {
        logInfo('Design creation failed - image too large', context, { 
          imageSizeBytes: imageSizeInBytes,
          maxSizeBytes: maxSizeInBytes 
        })
        return NextResponse.json(
          { success: false, error: 'Image size exceeds 5MB limit' },
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
    }

    const supabase = createServerClient()
    
    // Create design record
    const designData: Partial<Design> = {
      id: crypto.randomUUID(),
      mugColor: body.mugColor,
      uploadedImageBase64: body.uploadedImageBase64,
      customText: body.customText,
      textFont: body.textFont,
      textPosition: body.textPosition,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      isComplete: false
    }

    // Add timeout to database operation
    const dbOperation = supabase
      .from('designs')
      .insert([designData])
      .select()
      .single()

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    })

    const { data, error } = await Promise.race([dbOperation, timeoutPromise]) as any

    if (error) {
      logError(error, context, { 
        component: 'design_creation',
        designData: { mugColor: body.mugColor, hasImage: !!body.uploadedImageBase64 }
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create design' },
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

    const response: CreateDesignResponse = {
      success: true,
      data: data as Design
    }

    logInfo('Design created successfully', context, { 
      designId: data.id,
      mugColor: body.mugColor,
      responseTime: timer.end()
    })

    return NextResponse.json(response, { 
      status: 201,
      headers: {
        ...rateLimitResult.headers,
        ...getSecurityHeaders(),
        ...getCorsHeaders(request.headers.get('origin') || undefined),
        ...timer.getHeaders()
      }
    })
    
  } catch (error) {
    logError(error, context, { component: 'design_creation' })
    
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
