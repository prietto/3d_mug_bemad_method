import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    }))
  }))
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabaseClient
}))

describe('/api/designs/[id] GET', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createRequest = (url: string) => {
    return new NextRequest(url, {
      method: 'GET'
    })
  }

  const mockDesignData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    mugColor: '#FF0000',
    uploadedImageBase64: 'data:image/png;base64,test',
    customText: 'Test Text',
    textFont: 'Arial',
    textPosition: '{"x": 0, "y": 0}',
    createdAt: '2025-09-26T10:00:00.000Z',
    lastModified: '2025-09-26T10:00:00.000Z',
    isComplete: true
  }

  it('should return design successfully with valid UUID', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000'
    
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: mockDesignData,
      error: null
    })

    const request = createRequest(`http://localhost:3000/api/designs/${validId}`)
    const response = await GET(request, { params: { id: validId } })
    
    expect(response.status).toBe(200)
    
    const json = await response.json()
    expect(json.success).toBe(true)
    expect(json.data).toEqual(mockDesignData)
    expect(json.error).toBeUndefined()
  })

  it('should return 400 for invalid UUID format', async () => {
    const invalidId = 'invalid-uuid'
    
    const request = createRequest(`http://localhost:3000/api/designs/${invalidId}`)
    const response = await GET(request, { params: { id: invalidId } })
    
    expect(response.status).toBe(400)
    
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Invalid design ID format')
  })

  it('should return 404 when design not found', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000'
    
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }
    })

    const request = createRequest(`http://localhost:3000/api/designs/${validId}`)
    const response = await GET(request, { params: { id: validId } })
    
    expect(response.status).toBe(404)
    
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Design not found')
  })

  it('should return 500 for database errors', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000'
    
    mockSupabaseClient.from().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'DATABASE_ERROR', message: 'Connection failed' }
    })

    const request = createRequest(`http://localhost:3000/api/designs/${validId}`)
    const response = await GET(request, { params: { id: validId } })
    
    expect(response.status).toBe(500)
    
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Failed to retrieve design')
  })

  it('should handle unexpected errors gracefully', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000'
    
    mockSupabaseClient.from().select().eq().single.mockRejectedValue(
      new Error('Unexpected error')
    )

    const request = createRequest(`http://localhost:3000/api/designs/${validId}`)
    const response = await GET(request, { params: { id: validId } })
    
    expect(response.status).toBe(500)
    
    const json = await response.json()
    expect(json.success).toBe(false)
    expect(json.error).toBe('Internal server error')
  })

  it('should validate UUID format correctly', async () => {
    const testCases = [
      { id: '550e8400-e29b-41d4-a716-446655440000', valid: true },
      { id: '550E8400-E29B-41D4-A716-446655440000', valid: true },
      { id: 'invalid-uuid', valid: false },
      { id: '550e8400-e29b-41d4-a716', valid: false },
      { id: '550e8400-e29b-41d4-a716-446655440000-extra', valid: false },
      { id: '', valid: false }
    ]

    for (const testCase of testCases) {
      const request = createRequest(`http://localhost:3000/api/designs/${testCase.id}`)
      const response = await GET(request, { params: { id: testCase.id } })
      
      if (testCase.valid) {
        expect(response.status).not.toBe(400)
      } else {
        expect(response.status).toBe(400)
        const json = await response.json()
        expect(json.error).toBe('Invalid design ID format')
      }
    }
  })
})
