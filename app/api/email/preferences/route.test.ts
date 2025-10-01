/**
 * Email Preferences API Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for email preference management
 */

import { describe, it, expect, vi } from 'vitest'
import { GET, POST } from './route'

// Mock GDPR utilities
vi.mock('@/lib/utils/gdpr', () => ({
  validateUnsubscribeToken: vi.fn((token: string) => {
    return token === 'valid-token' || token.length === 64
  }),
}))

// Create mock NextRequest
const createMockRequest = (searchParams: Record<string, string> = {}, body: any = null) => {
  const url = new URL('https://test.com/api/email/preferences')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    nextUrl: { searchParams: url.searchParams },
    json: vi.fn().mockResolvedValue(body),
  } as any
}

describe('Email Preferences API', () => {
  describe('GET /api/email/preferences', () => {
    it('should return preferences page for valid token', async () => {
      const request = createMockRequest({ token: 'valid-token' })
      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/html')
      expect(text).toContain('Email Preferences')
      expect(text).toContain('Manage your email subscription')
    })

    it('should return 400 for missing token', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid preference token')
    })

    it('should return 400 for invalid token format', async () => {
      const request = createMockRequest({ token: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid preference token')
    })

    it('should include preference form with checkboxes', async () => {
      const request = createMockRequest({ token: 'valid-token' })
      const response = await GET(request)
      const text = await response.text()

      expect(text).toContain('lead_confirmations')
      expect(text).toContain('marketing')
      expect(text).toContain('newsletter')
      expect(text).toContain('Save Preferences')
    })
  })

  describe('POST /api/email/preferences', () => {
    it('should update preferences for valid token', async () => {
      const request = createMockRequest(
        {},
        {
          token: 'valid-token',
          preferences: {
            lead_confirmations: true,
            marketing: false,
            newsletter: true,
          },
        }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Preferences updated successfully')
    })

    it('should return 400 for missing token in body', async () => {
      const request = createMockRequest(
        {},
        {
          preferences: {
            marketing: false,
          },
        }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid preference token')
    })

    it('should return 400 for invalid token format', async () => {
      const request = createMockRequest(
        {},
        {
          token: 'invalid',
          preferences: {},
        }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid preference token')
    })

    it('should handle empty preferences object', async () => {
      const request = createMockRequest(
        {},
        {
          token: 'valid-token',
          preferences: {},
        }
      )
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})