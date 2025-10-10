import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildAnglePrompt, VIEW_DEFINITIONS, type ViewAngle } from '@/lib/multiView/angleModifiers'
import {
  RATE_LIMITS,
  getUTCDateKey,
  getHoursUntilUTCMidnight,
  getUTCMidnightISO
} from '@/lib/rateLimiter'

interface GenerateMultiViewRequest {
  designId: string
  basePrompt: string
  viewAngles: ViewAngle[]
  sessionId?: string
}

interface MultiViewResult {
  angle: ViewAngle
  url: string
  generatedAt: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateMultiViewRequest = await request.json()
    const { designId, basePrompt, viewAngles } = body

    // Validation
    if (!designId || !basePrompt || !viewAngles || viewAngles.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: designId, basePrompt, and viewAngles are required' },
        { status: 400 }
      )
    }

    if (viewAngles.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 views can be generated at once' },
        { status: 400 }
      )
    }

    // Validate view angles
    const validAngles: ViewAngle[] = ['front', 'side', 'handle']
    const invalidAngles = viewAngles.filter(angle => !validAngles.includes(angle))
    if (invalidAngles.length > 0) {
      return NextResponse.json(
        { error: `Invalid view angles: ${invalidAngles.join(', ')}` },
        { status: 400 }
      )
    }

    // Extract client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               'unknown'

    // Initialize Supabase client for rate limiting
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const dateKey = getUTCDateKey()

    // Check rate limits for the number of views being generated
    const viewsToGenerate = viewAngles.length

    // Check global limit
    const { data: globalCounter, error: globalError } = await supabase
      .from('generation_counter')
      .select('total_generations')
      .eq('date', dateKey)
      .single()

    if (!globalError && globalCounter &&
        globalCounter.total_generations + viewsToGenerate >= RATE_LIMITS.GLOBAL_DAILY_LIMIT) {
      const hoursUntilReset = getHoursUntilUTCMidnight()
      return NextResponse.json(
        {
          error: `Daily generation limit reached for all users. Try again in ${hoursUntilReset} hours.`,
          code: 'GLOBAL_LIMIT_REACHED',
          retryAfter: getUTCMidnightISO()
        },
        { status: 429 }
      )
    }

    // Check IP limit
    const { data: ipRecord, error: ipError } = await supabase
      .from('ip_generation_tracker')
      .select('generation_count')
      .eq('ip_address', ip)
      .eq('date', dateKey)
      .maybeSingle()

    const currentIPCount = ipRecord?.generation_count || 0

    if (currentIPCount + viewsToGenerate >= RATE_LIMITS.IP_DAILY_LIMIT) {
      const hoursUntilReset = getHoursUntilUTCMidnight()
      return NextResponse.json(
        {
          error: `Daily limit reached (${RATE_LIMITS.IP_DAILY_LIMIT} generations). Try again in ${hoursUntilReset} hours.`,
          code: 'IP_LIMIT_REACHED',
          limit: RATE_LIMITS.IP_DAILY_LIMIT,
          retryAfter: getUTCMidnightISO()
        },
        { status: 429 }
      )
    }

    // Generate views sequentially
    const results: MultiViewResult[] = []
    const errors: string[] = []

    for (const angle of viewAngles) {
      try {
        const viewDef = VIEW_DEFINITIONS[angle]
        const modifiedPrompt = buildAnglePrompt(basePrompt, angle)

        // Call Google AI Studio API
        const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY
        if (!apiKey) {
          throw new Error('GOOGLE_AI_STUDIO_API_KEY not configured')
        }

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: modifiedPrompt,
              numberofImages: 1,
              aspectRatio: '1:1',
              safetySettings: [
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                },
                {
                  category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                  threshold: 'BLOCK_MEDIUM_AND_ABOVE'
                }
              ]
            })
          }
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error?.message || `API request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (!data.generatedImages || data.generatedImages.length === 0) {
          throw new Error('No images generated')
        }

        const imageData = data.generatedImages[0].image
        const imageUrl = `data:image/jpeg;base64,${imageData}`

        results.push({
          angle,
          url: imageUrl,
          generatedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error(`Error generating ${angle} view:`, error)
        errors.push(`Failed to generate ${angle} view: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // If no views were generated successfully, return error
    if (results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any views', details: errors },
        { status: 500 }
      )
    }

    // Increment rate limit counters for successfully generated views
    try {
      const successCount = results.length

      // Increment IP counter
      await supabase.rpc('increment_ip_generation', {
        p_ip_address: ip,
        p_date: dateKey,
        p_increment: successCount
      })

      // Increment global counter
      await supabase.rpc('increment_global_generation', {
        p_date: dateKey,
        p_increment: successCount
      })
    } catch (error) {
      console.error('Error incrementing rate limit counters:', error)
      // Continue anyway - generation was successful
    }

    // Store results in database
    const multiViewData = results.reduce((acc, result) => {
      acc[result.angle] = result.url
      return acc
    }, {} as Record<string, string>)

    const { error: dbError } = await supabase
      .from('designs')
      .update({
        multi_view_urls: multiViewData,
        multi_view_generated_at: new Date().toISOString()
      })
      .eq('id', designId)

    if (dbError) {
      console.error('Database error:', dbError)
      // Don't fail the request if DB update fails - return the generated images
    }

    return NextResponse.json({
      success: true,
      views: results,
      partialSuccess: errors.length > 0,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Multi-view generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
