/**
 * Unsubscribe API Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for unsubscribe functionality and GDPR compliance
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
  const url = new URL('https://test.com/api/email/unsubscribe')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    nextUrl: { searchParams: url.searchParams },
    json: vi.fn().mockResolvedValue(body),
  } as any
}

describe('Unsubscribe API', () => {
  describe('GET /api/email/unsubscribe', () => {
    it('should return success page for valid token', async () => {
      const request = createMockRequest({ token: 'valid-token' })
      const response = await GET(request)
      const text = await response.text()

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('text/html')
      expect(text).toContain('Successfully Unsubscribed')
    })

    it('should return 400 for missing token', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid unsubscribe token')
    })

    it('should return 400 for invalid token format', async () => {
      const request = createMockRequest({ token: 'invalid' })
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid unsubscribe token')
    })
  })

  describe('POST /api/email/unsubscribe', () => {
    it('should process unsubscribe for valid token', async () => {
      const request = createMockRequest({}, { token: 'valid-token' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toContain('Successfully unsubscribed')
    })

    it('should return 400 for missing token in body', async () => {
      const request = createMockRequest({}, {})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid unsubscribe token')
    })

    it('should return 400 for invalid token format', async () => {
      const request = createMockRequest({}, { token: 'invalid' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid unsubscribe token')
    })
  })
})