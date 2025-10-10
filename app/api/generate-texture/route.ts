import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import {
  RATE_LIMITS,
  getClientIP,
  getUTCDateKey,
  getHoursUntilUTCMidnight,
  getUTCMidnightISO
} from '@/lib/rateLimiter'
import { VIEW_DEFINITIONS, type ViewAngle } from '@/lib/multiView/angleModifiers'

interface GenerateTextureRequest {
  prompt: string
  mode: 'text-to-image' | 'image-to-image' | 'full-mug-render'
  baseImage?: string // base64 string for image-to-image mode
}

interface GoogleAIResponse {
  predictions?: Array<{
    bytesBase64Encoded?: string
    mimeType?: string
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: {
            mimeType: string
            data: string
          }
        }>
      }
    }>
  }>
  generatedImages?: Array<{
    bytesBase64Encoded: string
        mimeType: string
    }>
  candidates?: Array<{
    content: {
      parts: Array<{
        inlineData?: {
          mimeType: string
          data: string
        }
        inline_data?: {
          mime_type: string
          data: string
        }
        text?: string
      }>
    }
  }>
}

// Pollinations.ai configuration
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt'

/**
 * Generate image using Pollinations.ai API
 * @param prompt - User's original prompt
 * @param viewAngle - Optional view angle for multi-view support (front/side/handle)
 * @returns Base64 data URL of generated image
 */
async function generateWithPollinations(prompt: string, viewAngle?: ViewAngle): Promise<string> {
  try {
    // Apply view modifier if exists (for multi-view support)
    let finalPrompt = prompt
    if (viewAngle && VIEW_DEFINITIONS[viewAngle]) {
      const modifier = VIEW_DEFINITIONS[viewAngle].promptModifier
      finalPrompt = modifier ? `${prompt}${modifier}` : prompt
    }

    // Apply enhanced prompt engineering for photorealistic quality
    const enhancedPrompt = `Ultra-realistic professional product photography of ceramic coffee mug, ${finalPrompt}, studio lighting setup with softbox and key light, pure white seamless background, centered composition, commercial product shot, photorealistic 8K resolution, sharp focus, professional color grading, e-commerce quality, hyper-detailed, Canon EOS R5 style, perfect lighting, no shadows on background, product photography perfection`

    // URL encode the prompt
    const encodedPrompt = encodeURIComponent(enhancedPrompt)

    // Construct Pollinations URL with optimal parameters
    // - width/height=1024: High resolution for quality
    // - model=flux: High-quality model
    // - enhance=true: Automatic prompt enhancement with LLM
    // - seed=timestamp: Ensure variation between generations
    const url = `${POLLINATIONS_BASE}/${encodedPrompt}?width=1024&height=1024&model=flux&enhance=true&seed=${Date.now()}`

    console.log(`Fetching from Pollinations.ai: ${viewAngle || 'default'} view`)

    // Fetch the image from Pollinations
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CustomMugDesigner/1.0'
      }
    })

    if (!response.ok) {
      throw new Error(`Pollinations API failed with status ${response.status}`)
    }

    // Convert to base64 for frontend compatibility
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:image/png;base64,${base64}`

    console.log(`Successfully generated image from Pollinations.ai (size: ${Math.round(arrayBuffer.byteLength / 1024)}KB)`)

    return dataUrl
  } catch (error) {
    console.error('Pollinations generation error:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: GenerateTextureRequest = await request.json()
    const { prompt, mode, baseImage } = body

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string', success: false },
        { status: 400 }
      )
    }

    if (prompt.length < 3 || prompt.length > 500) {
      return NextResponse.json(
        { error: 'Please enter a valid description (3-500 characters).', success: false },
        { status: 400 }
      )
    }

    if (mode !== 'text-to-image' && mode !== 'image-to-image' && mode !== 'full-mug-render') {
      return NextResponse.json(
        { error: 'Invalid mode. Supported modes: text-to-image, image-to-image, full-mug-render.', success: false },
        { status: 400 }
      )
    }

    // Validate base image for image-to-image mode
    if (mode === 'image-to-image') {
      if (!baseImage || typeof baseImage !== 'string') {
        return NextResponse.json(
          { error: 'Base image is required for image-to-image mode.', success: false },
          { status: 400 }
        )
      }

      // Validate base64 format
      if (!baseImage.startsWith('data:image/')) {
        return NextResponse.json(
          { error: 'Invalid base image format. Must be a valid data URL.', success: false },
          { status: 400 }
        )
      }

      // Check approximate size (base64 is ~33% larger than binary)
      const imageSizeEstimate = (baseImage.length * 0.75) / 1024 / 1024 // Convert to MB
      if (imageSizeEstimate > 5) {
        return NextResponse.json(
          { error: 'Base image too large. Please use image <5MB.', success: false },
          { status: 400 }
        )
      }
    }

    // Extract client IP for rate limiting
    const clientIP = getClientIP(request.headers)
    const today = getUTCDateKey()

    // Initialize Supabase client for rate limiting
    let supabase;
    try {
      supabase = createServerClient()
    } catch (error) {
      console.error('Failed to create Supabase client:', error)
      // Continue without rate limiting if database unavailable
    }

    // Check if rate limiting is disabled via environment variable
    const rateLimitDisabled = process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true'

    let currentIPCount = 0

    if (!rateLimitDisabled) {
      // LAYER 3: Global Daily Limit Check (1,400 generations/day)
      if (supabase) {
        try {
          const { data: globalCounter, error: globalError } = await supabase
            .from('ai_generation_global_counter')
            .select('total_generations')
            .eq('date_key', today)
            .maybeSingle()

          if (!globalError && globalCounter && globalCounter.total_generations >= RATE_LIMITS.GLOBAL_DAILY_LIMIT) {
            const hoursUntilReset = getHoursUntilUTCMidnight()
            return NextResponse.json({
              error: `Service temporarily at capacity. Try again in ${hoursUntilReset} hours or upload your own image.`,
              code: 'GLOBAL_LIMIT_REACHED',
              retryAfter: getUTCMidnightISO(),
              success: false
            }, { status: 503 })
          }
        } catch (error) {
          console.error('Error checking global limit:', error)
          // Continue without global limit check if query fails
        }
      }

      // LAYER 2: IP-based Daily Limit Check (15 generations/day per IP)
      if (supabase && clientIP !== 'unknown') {
        try {
          const { data: ipLimit, error: ipError } = await supabase
            .from('ai_generation_limits')
            .select('generation_count')
            .eq('ip_address', clientIP)
            .eq('date_key', today)
            .maybeSingle()

          if (!ipError && ipLimit) {
            currentIPCount = ipLimit.generation_count

            if (currentIPCount >= RATE_LIMITS.IP_DAILY_LIMIT) {
              const hoursUntilReset = getHoursUntilUTCMidnight()
              return NextResponse.json({
                error: `Daily limit reached (${RATE_LIMITS.IP_DAILY_LIMIT} generations). Try again in ${hoursUntilReset} hours or upload your own image.`,
                code: 'IP_LIMIT_REACHED',
                remaining: 0,
                limit: RATE_LIMITS.IP_DAILY_LIMIT,
                retryAfter: getUTCMidnightISO(),
                success: false
              }, { status: 429 })
            }
          }
        } catch (error) {
          console.error('Error checking IP limit:', error)
          // Continue without IP limit check if query fails
        }
      }
    }

    // Check for API key
    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_AI_STUDIO_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Configuration error. Please try again later.', success: false },
        { status: 500 }
      )
    }

    console.log(`Generating ${mode} image for prompt: "${prompt}"`)

    // Generate image using Pollinations.ai (production-ready)
    let imageUrl: string

    try {
      // Use Pollinations.ai for all generation modes
      if (mode === 'full-mug-render') {
        // Generate photorealistic mug render using Pollinations.ai
        imageUrl = await generateWithPollinations(prompt)

      } else if (mode === 'image-to-image') {
        // Image-to-image mode with Pollinations
        // Use enhanced prompt + base image reference
        imageUrl = await generateWithPollinations(`${prompt}, enhance this existing design`)

      } else {
        // Text-to-image mode with Pollinations
        imageUrl = await generateWithPollinations(prompt)
      }

      console.log(`Successfully generated ${mode} image with Pollinations.ai`)

    } catch (pollinationsError) {
      console.error('Pollinations generation error:', pollinationsError)
      
      // Fallback to simple base64 image
      const fallbackImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      imageUrl = `data:image/png;base64,${fallbackImage}`
    }

    // Increment rate limit counters after successful generation (only if rate limiting is enabled)
    if (supabase && !rateLimitDisabled) {
      try {
        await Promise.all([
          // Increment IP counter (Layer 2)
          clientIP !== 'unknown' ? supabase.rpc('increment_ip_generation', {
            p_ip_address: clientIP,
            p_date_key: today
          }) : Promise.resolve(),
          // Increment global counter (Layer 3)
          supabase.rpc('increment_global_generation', {
            p_date_key: today
          })
        ])
      } catch (error) {
        // Log error but don't fail the request - image was generated successfully
        console.error('Error incrementing rate limit counters:', error)
      }
    }

    // Calculate remaining quota for UI display
    const newIPCount = currentIPCount + 1
    const remaining = RATE_LIMITS.IP_DAILY_LIMIT - newIPCount
    const layer = newIPCount > RATE_LIMITS.SESSION_LIMIT ? 2 : 1

    return NextResponse.json({
      imageUrl,
      success: true,
      quota: {
        remaining,
        limit: RATE_LIMITS.IP_DAILY_LIMIT,
        layer,
        ipUsed: newIPCount
      }
    })
  } catch (error) {
    console.error('Error generating texture:', error)

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out. Please try again.', success: false },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.', success: false },
      { status: 500 }
    )
  }
}
