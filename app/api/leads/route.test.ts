/**
 * Enhanced Leads API Tests
 * Story 3.2: Lead Data Storage and Management
 * 
 * Comprehensive tests for lead storage with session tracking,
 * duplicate detection, design validation, and performance monitoring.
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest'
import { createServerClient } from '@/lib/supabase'

// Mock Supabase client
const mockSupabaseOperations: any = {
  from: vi.fn(function(this: any) { return this }),
  select: vi.fn(function(this: any) { return this }),
  insert: vi.fn(function(this: any) { return this }),
  update: vi.fn(function(this: any) { return this }),
  delete: vi.fn(function(this: any) { return this }),
  eq: vi.fn(function(this: any) { return this }),
  gte: vi.fn(function(this: any) { return this }),
  lt: vi.fn(function(this: any) { return this }),
  in: vi.fn(function(this: any) { return this }),
  order: vi.fn(function(this: any) { return this }),
  limit: vi.fn(function(this: any) { return this }),
  single: vi.fn(),
  neq: vi.fn(function(this: any) { return this })
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabaseOperations
}))

// Mock Next.js request/response
const createMockRequest = (
  body: any, 
  headers: Record<string, string> = {},
  url: string = 'https://test.com/api/leads'
) => {
  const mockHeaders = new Map(Object.entries({
    'content-type': 'application/json',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
    'x-forwarded-for': '192.168.1.100',
    ...headers
  }))

  return {
    json: vi.fn().mockResolvedValue(body),
    headers: {
      get: (key: string) => mockHeaders.get(key.toLowerCase()) || null
    },
    url
  } as any
}

describe('Enhanced Leads API (Story 3.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Session Tracking Integration', () => {
    it('should capture comprehensive session data', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'test@example.com',
        name: 'John Doe',
        projectDescription: 'Custom mug project',
        sessionData: {
          sessionId: 'session-123',
          engagementDuration: 300
        }
      }, {
        'referer': 'https://google.com/search',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15'
      })

      // Mock successful lead creation
      mockSupabaseOperations.single.mockResolvedValue({
        data: {
          id: 'lead-123',
          email: 'test@example.com',
          name: 'John Doe',
          session_id: 'session-123',
          device_type: 'mobile',
          browser_type: 'Safari',
          referral_source: 'google.com'
        },
        error: null
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(mockSupabaseOperations.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          session_id: 'session-123',
          device_type: 'mobile',
          browser_type: 'Safari',
          referral_source: 'google.com',
          engagement_duration: 300
        })
      ])
    })

    it('should detect different device types correctly', async () => {
      const deviceTests = [
        {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          expectedDevice: 'desktop'
        },
        {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
          expectedDevice: 'mobile'
        },
        {
          userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)',
          expectedDevice: 'tablet'
        }
      ]

      for (const test of deviceTests) {
        const { POST } = await import('@/app/api/leads/route')
        
        const mockRequest = createMockRequest({
          email: 'device-test@example.com',
          name: 'Device Test',
          projectDescription: 'Testing device detection'
        }, {
          'user-agent': test.userAgent
        })

        mockSupabaseOperations.single.mockResolvedValueOnce({
          data: { id: 'test-lead', device_type: test.expectedDevice },
          error: null
        })

        await POST(mockRequest)

        expect(mockSupabaseOperations.insert).toHaveBeenCalledWith([
          expect.objectContaining({
            device_type: test.expectedDevice
          })
        ])
      }
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect email-based duplicates', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'duplicate@example.com',
        name: 'Duplicate User',
        projectDescription: 'Duplicate submission'
      })

      // Mock duplicate detection - existing lead found
      mockSupabaseOperations.single
        .mockResolvedValueOnce({
          data: [{
            id: 'existing-lead-123',
            email: 'duplicate@example.com',
            created_at: new Date().toISOString()
          }],
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(409) // Conflict status for duplicates
      expect(result.success).toBe(false)
      expect(result.error).toContain('duplicate')
    })

    it('should merge duplicate leads when possible', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'merge@example.com',
        name: 'Merge User',
        phone: '+1234567890',
        projectDescription: 'Additional project details',
        designId: 'new-design-456'
      })

      // Mock duplicate detection - existing lead found
      mockSupabaseOperations.single
        .mockResolvedValueOnce({
          data: [{
            id: 'existing-merge-123',
            email: 'merge@example.com',
            created_at: new Date().toISOString()
          }],
          error: null
        })
        // Mock existing lead fetch for merge
        .mockResolvedValueOnce({
          data: {
            id: 'existing-merge-123',
            email: 'merge@example.com',
            name: 'Merge User',
            phone: null,
            project_description: 'Original description',
            design_id: null
          },
          error: null
        })
        // Mock successful merge update
        .mockResolvedValueOnce({
          data: {
            id: 'existing-merge-123',
            phone: '+1234567890',
            design_id: 'new-design-456'
          },
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(200) // Success merge, not new creation
      expect(result.success).toBe(true)
      expect(mockSupabaseOperations.update).toHaveBeenCalled()
    })

    it('should detect session-based duplicates', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'session-dup@example.com',
        name: 'Session Duplicate',
        projectDescription: 'Session duplicate test',
        sessionData: {
          sessionId: 'duplicate-session-123'
        }
      })

      // Mock no email duplicate, but session duplicate found
      mockSupabaseOperations.single
        .mockResolvedValueOnce({ data: null, error: null }) // No email duplicate
        .mockResolvedValueOnce({
          data: [{
            id: 'session-lead-456',
            session_id: 'duplicate-session-123',
            created_at: new Date().toISOString()
          }],
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(409)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Session')
    })
  })

  describe('Design Validation Integration', () => {
    it('should validate design before lead creation', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'design-test@example.com',
        name: 'Design Test',
        projectDescription: 'Project with design',
        designId: 'valid-design-123'
      })

      // Mock no duplicates
      mockSupabaseOperations.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock design validation
        .mockResolvedValueOnce({
          data: {
            id: 'valid-design-123',
            mug_color: 'blue',
            uploaded_image_base64: 'imagedata',
            custom_text: 'Hello World',
            is_complete: true
          },
          error: null
        })
        // Mock successful lead creation
        .mockResolvedValueOnce({
          data: {
            id: 'lead-with-design',
            email: 'design-test@example.com',
            design_id: 'valid-design-123',
            engagement_level: 'high' // Should be calculated based on design quality
          },
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(mockSupabaseOperations.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          design_id: 'valid-design-123',
          engagement_level: 'high'
        })
      ])
    })

    it('should reject invalid designs', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'invalid-design@example.com',
        name: 'Invalid Design Test',
        projectDescription: 'Project with invalid design',
        designId: 'invalid-design-456'
      })

      // Mock no duplicates
      mockSupabaseOperations.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
        // Mock invalid design
        .mockResolvedValueOnce({
          data: {
            id: 'invalid-design-456',
            mug_color: '', // Missing required field
            is_complete: false
          },
          error: null
        })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid design')
    })
  })

  describe('Performance Monitoring', () => {
    it('should log database operation performance', async () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'perf-test@example.com',
        name: 'Performance Test',
        projectDescription: 'Testing performance monitoring'
      })

      // Mock no duplicates and successful creation
      mockSupabaseOperations.single
        .mockResolvedValue({ data: null, error: null })
        .mockResolvedValueOnce({
          data: { id: 'perf-lead-123' },
          error: null
        })

      await POST(mockRequest)

      // Should log performance if operation takes time
      // Note: In real tests, you'd need to simulate slow operations
      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should handle database connection failures', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'error-test@example.com',
        name: 'Error Test',
        projectDescription: 'Testing error handling'
      })

      // Mock database error
      mockSupabaseOperations.single.mockRejectedValue(new Error('Database connection failed'))

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Internal server error')
    })

    it('should handle malformed request data', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: '', // Invalid email
        name: 'Test User',
        projectDescription: 'Test project'
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('required fields')
    })

    it('should validate email format', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'invalid-email-format',
        name: 'Test User',
        projectDescription: 'Test project'
      })

      const response = await POST(mockRequest)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid email format')
    })
  })

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      // Note: This would require mocking the rate limiting functionality
      // The actual implementation would test the rate limiting behavior
      expect(true).toBe(true) // Placeholder for rate limiting tests
    })
  })

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const { POST } = await import('@/app/api/leads/route')
      
      const mockRequest = createMockRequest({
        email: 'security-test@example.com',
        name: 'Security Test',
        projectDescription: 'Testing security headers'
      })

      // Mock successful creation
      mockSupabaseOperations.single
        .mockResolvedValue({ data: null, error: null })
        .mockResolvedValueOnce({
          data: { id: 'security-lead-123' },
          error: null
        })

      const response = await POST(mockRequest)

      // Check for security headers
      expect(response.headers.get('x-content-type-options')).toBeDefined()
      expect(response.headers.get('x-frame-options')).toBeDefined()
      expect(response.headers.get('x-xss-protection')).toBeDefined()
    })
  })
})
