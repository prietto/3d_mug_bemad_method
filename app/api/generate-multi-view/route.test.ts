import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock modules
vi.mock('@/lib/rateLimiter', () => ({
  RateLimiter: vi.fn().mockImplementation(() => ({
    checkLimit: vi.fn().mockResolvedValue({ allowed: true }),
    incrementCount: vi.fn().mockResolvedValue(undefined)
  }))
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null }))
      }))
    }))
  }))
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('/api/generate-multi-view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.GOOGLE_AI_STUDIO_API_KEY = 'test-api-key'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  it('generates multiple views successfully', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedImages: [{ image: 'base64data' }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'A beautiful coffee mug',
        viewAngles: ['front', 'side'],
        sessionId: 'session-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.views).toHaveLength(2)
    expect(data.views[0]).toHaveProperty('angle', 'front')
    expect(data.views[0]).toHaveProperty('url')
    expect(data.views[0]).toHaveProperty('generatedAt')
    expect(data.views[1]).toHaveProperty('angle', 'side')
  })

  it('rejects request with missing fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123'
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Missing required fields')
  })

  it('rejects request with too many views', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front', 'side', 'handle', 'extra']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Maximum 3 views')
  })

  it('rejects request with invalid view angles', async () => {
    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front', 'invalid', 'back']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid view angles')
  })

  it('handles rate limit exceeded', async () => {
    const { RateLimiter } = await import('@/lib/rateLimiter')
    const mockCheckLimit = vi.fn().mockResolvedValue({
      allowed: false,
      reason: 'Rate limit exceeded',
      retryAfter: 3600
    })

    vi.mocked(RateLimiter).mockImplementation(() => ({
      checkLimit: mockCheckLimit,
      incrementCount: vi.fn()
    }) as any)

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(429)
    expect(data.error).toBe('Rate limit exceeded')
    expect(data.retryAfter).toBe(3600)
  })

  it('handles API error gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'API Error' } })
    })

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate any views')
  })

  it('returns partial success when some views fail', async () => {
    let callCount = 0
    mockFetch.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ generatedImages: [{ image: 'base64data' }] })
        })
      }
      return Promise.resolve({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'API Error' } })
      })
    })

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front', 'side']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.partialSuccess).toBe(true)
    expect(data.views).toHaveLength(1)
    expect(data.errors).toHaveLength(1)
  })

  it('uses correct prompt modifiers for each angle', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedImages: [{ image: 'base64data' }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'A beautiful coffee mug',
        viewAngles: ['front', 'side', 'handle']
      })
    })

    await POST(request)

    expect(mockFetch).toHaveBeenCalledTimes(3)

    // Check that prompts were modified correctly
    const firstCall = mockFetch.mock.calls[0][1]
    const firstBody = JSON.parse(firstCall.body as string)
    expect(firstBody.prompt).toBe('A beautiful coffee mug') // Front has no modifier

    const secondCall = mockFetch.mock.calls[1][1]
    const secondBody = JSON.parse(secondCall.body as string)
    expect(secondBody.prompt).toContain('side profile view') // Side has modifier

    const thirdCall = mockFetch.mock.calls[2][1]
    const thirdBody = JSON.parse(thirdCall.body as string)
    expect(thirdBody.prompt).toContain('close-up detail of handle') // Handle has modifier
  })

  it('increments rate limit counter for each successful generation', async () => {
    const mockIncrementCount = vi.fn().mockResolvedValue(undefined)
    const { RateLimiter } = await import('@/lib/rateLimiter')

    vi.mocked(RateLimiter).mockImplementation(() => ({
      checkLimit: vi.fn().mockResolvedValue({ allowed: true }),
      incrementCount: mockIncrementCount
    }) as any)

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        generatedImages: [{ image: 'base64data' }]
      })
    })

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front', 'side']
      })
    })

    await POST(request)

    expect(mockIncrementCount).toHaveBeenCalledTimes(2)
  })

  it('handles missing API key', async () => {
    delete process.env.GOOGLE_AI_STUDIO_API_KEY

    const request = new NextRequest('http://localhost:3000/api/generate-multi-view', {
      method: 'POST',
      body: JSON.stringify({
        designId: 'design-123',
        basePrompt: 'Test prompt',
        viewAngles: ['front']
      })
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.error).toBe('Failed to generate any views')
  })
})
