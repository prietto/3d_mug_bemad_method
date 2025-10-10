import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    rpc: vi.fn(() => Promise.resolve({ data: null, error: null }))
  }))
}))

// Mock canvas module
vi.mock('canvas', () => ({
  createCanvas: vi.fn(() => {
    const mockCanvas = {
      getContext: vi.fn(() => ({
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 0,
        font: '',
        textAlign: 'left',
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        beginPath: vi.fn(),
        roundRect: vi.fn(),
        arc: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        createLinearGradient: vi.fn(() => ({
          addColorStop: vi.fn()
        })),
        createRadialGradient: vi.fn(() => ({
          addColorStop: vi.fn()
        }))
      })),
      toBuffer: vi.fn(() => Buffer.from('mockImageData', 'utf-8'))
    }
    return mockCanvas
  })
}))

// Mock environment variables
const mockEnv = {
  GOOGLE_AI_STUDIO_API_KEY: 'test-api-key',
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key'
}

describe('POST /api/generate-texture', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set up environment variables
    process.env.GOOGLE_AI_STUDIO_API_KEY = mockEnv.GOOGLE_AI_STUDIO_API_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = mockEnv.NEXT_PUBLIC_SUPABASE_URL
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = mockEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.SUPABASE_SERVICE_ROLE_KEY = mockEnv.SUPABASE_SERVICE_ROLE_KEY
  })

  const createMockRequest = (body: unknown) => {
    return {
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1'
      })
    } as NextRequest
  }

  const mockGoogleApiResponse = (success: boolean, data?: unknown) => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: success,
        status: success ? 200 : 500,
        json: async () => data,
        text: async () => JSON.stringify(data),
      })
    ) as unknown as typeof fetch
  }

  it('should successfully generate texture from valid prompt', async () => {
    const mockImageData = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'base64ImageData',
                },
              },
            ],
          },
        },
      ],
    }

    mockGoogleApiResponse(true, mockImageData)

    const request = createMockRequest({
      prompt: 'watercolor flowers on white background',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toContain('data:image/png;base64,')
    expect(json.imageUrl).toContain('base64ImageData')
  })

  it('should return 400 for missing prompt', async () => {
    const request = createMockRequest({
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('required')
  })

  it('should return 400 for prompt too short', async () => {
    const request = createMockRequest({
      prompt: 'ab',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('3-500 characters')
  })

  it('should return 400 for prompt too long', async () => {
    const request = createMockRequest({
      prompt: 'a'.repeat(501),
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('3-500 characters')
  })

  it('should return 400 for invalid mode', async () => {
    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'invalid-mode',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toContain('text-to-image')
  })

  it('should return 500 when API key is missing', async () => {
    delete process.env.GOOGLE_AI_STUDIO_API_KEY

    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Configuration error')
  })

  it('should return 429 for rate limit errors', async () => {
    mockGoogleApiResponse(false, { error: 'Rate limit exceeded' })
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        text: async () => 'Rate limit exceeded',
      })
    ) as unknown as typeof fetch

    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(429)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Too many requests')
  })

  it('should return 500 for Google API authentication errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      })
    ) as unknown as typeof fetch

    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Configuration error')
  })

  it('should return 500 when Google API returns no candidates', async () => {
    mockGoogleApiResponse(true, { candidates: [] })

    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Generation failed')
  })

  it('should return 500 when Google API returns no image data', async () => {
    mockGoogleApiResponse(true, {
      candidates: [
        {
          content: {
            parts: [{}],
          },
        },
      ],
    })

    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'text-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.success).toBe(false)
    expect(json.error).toContain('Generation failed')
  })

  // Image-to-Image Mode Tests
  it('should successfully generate texture from image with valid prompt', async () => {
    const mockImageData = {
      candidates: [
        {
          content: {
            parts: [
              {
                inlineData: {
                  mimeType: 'image/png',
                  data: 'enhancedImageData',
                },
              },
            ],
          },
        },
      ],
    }

    mockGoogleApiResponse(true, mockImageData)

    const request = createMockRequest({
      prompt: 'make this more vibrant',
      mode: 'image-to-image',
      baseImage: 'data:image/jpeg;base64,validImageData',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toBe('data:image/png;base64,enhancedImageData')
  })

  it('should return 400 when image-to-image mode has no base image', async () => {
    const request = createMockRequest({
      prompt: 'make this more vibrant',
      mode: 'image-to-image',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Base image is required for image-to-image mode.')
  })

  it('should return 400 when base image format is invalid', async () => {
    const request = createMockRequest({
      prompt: 'make this more vibrant',
      mode: 'image-to-image',
      baseImage: 'invalid-base64-string',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Invalid base image format. Must be a valid data URL.')
  })

  it('should return 400 when base image is too large', async () => {
    // Create a mock base64 string that would represent > 5MB
    const largeBase64 = 'data:image/jpeg;base64,' + 'a'.repeat(7000000) // ~7MB when decoded

    const request = createMockRequest({
      prompt: 'make this more vibrant',
      mode: 'image-to-image',
      baseImage: largeBase64,
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Base image too large. Please use image <5MB.')
  })

  it('should return 400 for invalid mode', async () => {
    const request = createMockRequest({
      prompt: 'valid prompt',
      mode: 'invalid-mode',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.success).toBe(false)
    expect(json.error).toBe('Invalid mode. Supported modes: text-to-image, image-to-image, full-mug-render.')
  })

  it('should successfully generate full mug render', async () => {
    const request = createMockRequest({
      prompt: 'Watercolor flowers on white ceramic',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toContain('data:image/png;base64,')
    expect(json.quota).toBeDefined()
  })

  it('should apply prompt engineering for full-mug-render mode', async () => {
    const request = createMockRequest({
      prompt: 'Abstract geometric patterns',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    // The API should successfully generate with enhanced prompt
    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toBeDefined()
  })

  it('should generate larger image for full-mug-render mode', async () => {
    const request = createMockRequest({
      prompt: 'Test mug design',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    // Should successfully generate
    expect(response.status).toBe(200)
    expect(json.imageUrl).toBeDefined()
  })

  it('should handle full-mug-render with floral prompt', async () => {
    const request = createMockRequest({
      prompt: 'Beautiful flowers and floral patterns',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toBeDefined()
  })

  it('should handle full-mug-render with geometric prompt', async () => {
    const request = createMockRequest({
      prompt: 'Abstract geometric shapes and patterns',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.imageUrl).toBeDefined()
  })

  it('should respect rate limiting for full-mug-render mode', async () => {
    const request = createMockRequest({
      prompt: 'Test design',
      mode: 'full-mug-render',
    })

    const response = await POST(request)
    const json = await response.json()

    // Should include quota information
    expect(json.quota).toBeDefined()
    expect(json.quota.remaining).toBeDefined()
    expect(json.quota.limit).toBeDefined()
  })
})
