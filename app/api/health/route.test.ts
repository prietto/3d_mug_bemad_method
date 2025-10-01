/**
 * @jest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: '550e8400-e29b-41d4-a716-446655440000',
              email: 'test@example.com',
              name: 'John Doe',
              projectDescription: 'Test project',
              createdAt: '2025-09-26T00:00:00.000Z',
              source: 'direct',
              engagementLevel: 'medium',
              status: 'new'
            },
            error: null
          }))
        }))
      }))
    }))
  }))
}))

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
  randomUUID: vi.fn(() => '550e8400-e29b-41d4-a716-446655440000')
})

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/api/health', () => {
    it('should return health check response', async () => {
      // Import the handler after mocking
      const { GET } = await import('@/app/api/health/route')
      
      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.service).toBe('Custom Ceramic Mug Landing Page API')
      expect(data.timestamp).toBeDefined()
    })
  })

  describe('/api/leads', () => {
    it('should create a new lead with valid data', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const requestBody = {
        email: 'test@example.com',
        name: 'John Doe',
        projectDescription: 'Need 100 custom mugs',
        engagementLevel: 'high'
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(data.data.email).toBe('test@example.com')
    })

    it('should reject request with missing required fields', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const requestBody = {
        email: 'test@example.com'
        // Missing name and projectDescription
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Missing required fields')
    })

    it('should reject request with invalid email format', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const requestBody = {
        email: 'invalid-email',
        name: 'John Doe',
        projectDescription: 'Test project'
      }

      const request = new NextRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Invalid email format')
    })
  })
})
