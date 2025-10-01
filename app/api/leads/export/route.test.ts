/**
 * GDPR Data Export API Tests
 * Story 3.2: Lead Data Storage and Management
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase client
const mockSupabaseOperations: any = {
  from: vi.fn(function(this: any) { return this }),
  select: vi.fn(function(this: any) { return this }),
  eq: vi.fn(function(this: any) { return this }),
  in: vi.fn(function(this: any) { return this }),
  single: vi.fn()
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabaseOperations
}))

const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
  const mockHeaders = new Map(Object.entries({
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'x-forwarded-for': '192.168.1.100',
    ...headers
  }))

  return {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: (key: string) => mockHeaders.get(key.toLowerCase()) || null
    },
    url: 'https://test.com/api/leads/export'
  } as any
}

describe('GDPR Data Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/leads/export', () => {
    it('should export complete user data', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({
        email: 'export-test@example.com'
      })

      // Mock lead data
      mockSupabaseOperations.single
        .mockResolvedValueOnce({
          data: [{
            id: 'lead-123',
            email: 'export-test@example.com',
            name: 'Export Test User',
            phone: '+1234567890',
            project_description: 'Test project',
            design_id: 'design-456',
            created_at: '2025-01-01T00:00:00Z',
            session_id: 'session-789',
            device_type: 'desktop',
            browser_type: 'Chrome'
          }],
          error: null
        })
        // Mock design data
        .mockResolvedValueOnce({
          data: [{
            id: 'design-456',
            mug_color: 'blue',
            custom_text: 'Hello World',
            created_at: '2025-01-01T00:00:00Z'
          }],
          error: null
        })
        // Mock analytics data
        .mockResolvedValueOnce({
          data: [{
            id: 'analytics-789',
            session_id: 'session-789',
            event_type: 'page_view',
            timestamp: '2025-01-01T00:00:00Z',
            lead_id: 'lead-123'
          }],
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.lead).toBeDefined()
      expect(result.data.designs).toHaveLength(1)
      expect(result.data.analytics).toHaveLength(1)
      expect(result.data.dataHash).toBeDefined()
      expect(result.data.exportedAt).toBeDefined()
    })

    it('should handle missing email', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({})

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Email address is required')
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({
        email: 'invalid-email-format'
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })

    it('should handle users with no data', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({
        email: 'nodata@example.com'
      })

      // Mock no lead data found
      mockSupabaseOperations.single.mockResolvedValue({
        data: null,
        error: null
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.lead).toBeNull()
      expect(result.data.designs).toHaveLength(0)
      expect(result.data.analytics).toHaveLength(0)
    })

    it('should handle database errors gracefully', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({
        email: 'error-test@example.com'
      })

      // Mock database error
      mockSupabaseOperations.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed')
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to export user data')
    })

    it('should include proper headers for file download', async () => {
      const { POST } = await import('@/app/api/leads/export/route')
      
      const mockRequest = createMockRequest({
        email: 'download-test@example.com'
      })

      // Mock successful export
      mockSupabaseOperations.single
        .mockResolvedValueOnce({
          data: [{ id: 'lead-123', email: 'download-test@example.com' }],
          error: null
        })
        .mockResolvedValue({ data: [], error: null })

      const response = await POST(mockRequest)

      expect(response.headers.get('content-type')).toBe('application/json')
      expect(response.headers.get('content-disposition')).toContain('attachment')
      expect(response.headers.get('content-disposition')).toContain('download-test@example.com')
    })
  })

  describe('Method restrictions', () => {
    it('should reject GET requests', async () => {
      const { GET } = await import('@/app/api/leads/export/route')
      
      const response = await GET()
      const result = await response.json()

      expect(response.status).toBe(405)
      expect(result.error).toBe('Method not allowed')
    })

    it('should reject PUT requests', async () => {
      const { PUT } = await import('@/app/api/leads/export/route')
      
      const response = await PUT()
      const result = await response.json()

      expect(response.status).toBe(405)
      expect(result.error).toBe('Method not allowed')
    })

    it('should reject DELETE requests', async () => {
      const { DELETE } = await import('@/app/api/leads/export/route')
      
      const response = await DELETE()
      const result = await response.json()

      expect(response.status).toBe(405)
      expect(result.error).toBe('Method not allowed')
    })
  })
})
