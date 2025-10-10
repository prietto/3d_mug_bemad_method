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

// Helper function to transform snake_case DB response to camelCase Design
function dbToDesign(dbRow: any): Design {
  return {
    id: dbRow.id,
    mugColor: dbRow.mug_color,
    uploadedImageBase64: dbRow.uploaded_image_base64,
    uploadedImageUrl: dbRow.uploaded_image_url,
    customText: dbRow.custom_text,
    textFont: dbRow.text_font,
    textPosition: dbRow.text_position,
    textSize: dbRow.text_size,
    textColor: dbRow.text_color,
    createdAt: dbRow.created_at,
    lastModified: dbRow.last_modified,
    isComplete: dbRow.is_complete
  }
}

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

    // Create design record with snake_case for database
    const designId = crypto.randomUUID()
    const dbDesignData = {
      id: designId,
      mug_color: body.mugColor,
      uploaded_image_base64: body.uploadedImageBase64,
      custom_text: body.customText,
      text_font: body.textFont,
      text_position: body.textPosition,
      created_at: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      is_complete: false
    }

    // Add timeout to database operation
    const dbOperation = supabase
      .from('designs')
      .insert([dbDesignData])
      .select()
      .single()

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database operation timeout')), 5000)
    })

    let data: Design | null = null
    let error: any = null

    try {
      const result = await Promise.race([dbOperation, timeoutPromise])
      data = result.data
      error = result.error
    } catch (err) {
      // Handle timeout or other Promise.race errors
      error = err
    }

    if (error || !data) {
      logError(error || new Error('No data returned from database'), context, {
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

    // Transform snake_case DB response to camelCase
    const designResponse = dbToDesign(data)

    const response: CreateDesignResponse = {
      success: true,
      data: designResponse
    }

    logInfo('Design created successfully', context, {
      designId: designResponse.id,
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
