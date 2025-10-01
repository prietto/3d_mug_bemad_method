/**
 * Data Retention Cleanup API Tests
 * Story 3.2: Lead Data Storage and Management
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'

// Mock Supabase client
const mockSupabaseOperations: any = {
  from: vi.fn(function(this: any) { return this }),
  select: vi.fn(function(this: any) { return this }),
  delete: vi.fn(function(this: any) { return this }),
  lt: vi.fn(function(this: any) { return this }),
  neq: vi.fn(function(this: any) { return this }),
  eq: vi.fn(function(this: any) { return this }),
  single: vi.fn()
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabaseOperations
}))

// Mock environment variables
const originalEnv = process.env
beforeEach(() => {
  process.env = { ...originalEnv }
  process.env.CLEANUP_API_TOKEN = 'test-token-123'
})

const createMockRequest = (
  body: any = {}, 
  headers: Record<string, string> = {}
) => {
  const mockHeaders = new Map(Object.entries({
    'content-type': 'application/json',
    'user-agent': 'Cleanup-Service/1.0',
    'x-forwarded-for': '192.168.1.100',
    'authorization': 'Bearer test-token-123',
    ...headers
  }))

  return {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: (key: string) => mockHeaders.get(key.toLowerCase()) || null
    },
    url: 'https://test.com/api/leads/cleanup'
  } as any
}

describe('Data Retention Cleanup API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/leads/cleanup', () => {
    it('should execute successful cleanup with default retention config', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()

      // Mock successful deletions
      mockSupabaseOperations.single
        // Mock analytics deletion
        .mockResolvedValueOnce({
          data: [{ id: 'analytics-1' }, { id: 'analytics-2' }],
          error: null
        })
        // Mock performance logs deletion
        .mockResolvedValueOnce({
          data: [{ id: 'perf-1' }],
          error: null
        })
        // Mock designs deletion
        .mockResolvedValueOnce({
          data: [{ id: 'design-1' }],
          error: null
        })
        // Mock leads deletion
        .mockResolvedValueOnce({
          data: [],
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.deletedCounts).toBeDefined()
      expect(result.deletedCounts.analytics).toBe(2)
      expect(result.deletedCounts.performanceLogs).toBe(1)
      expect(result.deletedCounts.designs).toBe(1)
      expect(result.deletedCounts.leads).toBe(0)
      expect(result.retentionConfig).toBeDefined()
      expect(result.executedAt).toBeDefined()
    })

    it('should use custom retention configuration', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const customConfig = {
        leadRetentionDays: 365,
        designRetentionDays: 180,
        analyticsRetentionDays: 90,
        performanceLogRetentionDays: 7
      }

      const mockRequest = createMockRequest({
        retentionConfig: customConfig
      })

      // Mock successful cleanup
      mockSupabaseOperations.single.mockResolvedValue({
        data: [],
        error: null
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.retentionConfig).toMatchObject(customConfig)
    })

    it('should require valid authorization', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest({}, {
        'authorization': 'Bearer invalid-token'
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle missing authorization header', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest({}, {
        'authorization': '' // Remove auth header
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Unauthorized')
    })

    it('should handle database errors during cleanup', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()

      // Mock database error
      mockSupabaseOperations.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to execute data cleanup')
    })

    it('should handle partial cleanup failures gracefully', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()

      // Mock mixed success/failure results
      mockSupabaseOperations.single
        // Analytics deletion succeeds
        .mockResolvedValueOnce({
          data: [{ id: 'analytics-1' }],
          error: null
        })
        // Performance logs deletion fails
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Performance log cleanup failed')
        })
        // Designs deletion succeeds
        .mockResolvedValueOnce({
          data: [],
          error: null
        })
        // Leads deletion succeeds
        .mockResolvedValueOnce({
          data: [],
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.deletedCounts.analytics).toBe(1)
      expect(result.deletedCounts.performanceLogs).toBe(0) // Failed deletion
    })

    it('should never delete converted leads', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()

      // Mock successful cleanup
      mockSupabaseOperations.single.mockResolvedValue({
        data: [],
        error: null
      })

      await POST(mockRequest)

      // Verify that leads deletion includes .neq('status', 'converted')
      expect(mockSupabaseOperations.neq).toHaveBeenCalledWith('status', 'converted')
    })
  })

  describe('GET /api/leads/cleanup (Health Check)', () => {
    it('should return service health status', async () => {
      const { GET } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = {
        headers: {
          get: () => null
        },
        url: 'https://test.com/api/leads/cleanup'
      } as any

      const response = await GET(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.service).toBe('data-retention-cleanup')
      expect(result.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
      expect(result.retentionConfig).toBeDefined()
    })

    it('should handle health check errors', async () => {
      const { GET } = await import('@/app/api/leads/cleanup/route')
      
      // Mock request that will cause an error
      const mockRequest = {
        headers: {
          get: () => {
            throw new Error('Request processing failed')
          }
        },
        url: 'https://test.com/api/leads/cleanup'
      } as any

      const response = await GET(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.service).toBe('data-retention-cleanup')
      expect(result.status).toBe('error')
    })
  })

  describe('Method restrictions', () => {
    it('should reject PUT requests', async () => {
      const { PUT } = await import('@/app/api/leads/cleanup/route')
      
      const response = await PUT()
      const result = await response.json()

      expect(response.status).toBe(405)
      expect(result.error).toBe('Method not allowed')
    })

    it('should reject DELETE requests', async () => {
      const { DELETE } = await import('@/app/api/leads/cleanup/route')
      
      const response = await DELETE()
      const result = await response.json()

      expect(response.status).toBe(405)
      expect(result.error).toBe('Method not allowed')
    })
  })

  describe('Security and logging', () => {
    it('should include security headers', async () => {
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()
      mockSupabaseOperations.single.mockResolvedValue({
        data: [],
        error: null
      })

      const response = await POST(mockRequest)

      expect(response.headers.get('x-content-type-options')).toBeDefined()
      expect(response.headers.get('x-frame-options')).toBeDefined()
    })

    it('should log cleanup operations', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      const { POST } = await import('@/app/api/leads/cleanup/route')
      
      const mockRequest = createMockRequest()
      mockSupabaseOperations.single.mockResolvedValue({
        data: [],
        error: null
      })

      await POST(mockRequest)

      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
})

afterAll(() => {
  process.env = originalEnv
})
