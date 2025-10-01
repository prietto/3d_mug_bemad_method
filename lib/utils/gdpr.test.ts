/**
 * GDPR Utilities Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for unsubscribe token generation and validation
 */

import {
  generateUnsubscribeToken,
  validateUnsubscribeToken,
  getPreferenceUrl,
  getUnsubscribeUrl,
} from './gdpr'

describe('GDPR Utilities', () => {
  describe('generateUnsubscribeToken', () => {
    it('should generate unique tokens for different emails', () => {
      const token1 = generateUnsubscribeToken('user1@example.com')
      const token2 = generateUnsubscribeToken('user2@example.com')

      expect(token1).not.toBe(token2)
      expect(token1).toHaveLength(64) // SHA256 hex is 64 characters
      expect(token2).toHaveLength(64)
    })

    it('should generate different tokens for same email on different calls', () => {
      const email = 'user@example.com'
      const token1 = generateUnsubscribeToken(email)
      const token2 = generateUnsubscribeToken(email)

      // Should be different due to random data and timestamp
      expect(token1).not.toBe(token2)
    })

    it('should only contain hex characters', () => {
      const token = generateUnsubscribeToken('user@example.com')

      expect(token).toMatch(/^[a-f0-9]{64}$/i)
    })
  })

  describe('validateUnsubscribeToken', () => {
    it('should validate correct token format', () => {
      const token = generateUnsubscribeToken('user@example.com')

      expect(validateUnsubscribeToken(token)).toBe(true)
    })

    it('should reject invalid token lengths', () => {
      expect(validateUnsubscribeToken('short')).toBe(false)
      expect(validateUnsubscribeToken('a'.repeat(63))).toBe(false)
      expect(validateUnsubscribeToken('a'.repeat(65))).toBe(false)
    })

    it('should reject non-hex characters', () => {
      const invalidToken = 'g'.repeat(64) // 'g' is not a hex character
      expect(validateUnsubscribeToken(invalidToken)).toBe(false)

      const tokenWithSpaces = 'a'.repeat(32) + ' ' + 'a'.repeat(31)
      expect(validateUnsubscribeToken(tokenWithSpaces)).toBe(false)
    })

    it('should accept valid hex tokens', () => {
      const validToken = 'a1b2c3d4e5f6'.repeat(5) + 'abcd' // 64 chars
      expect(validateUnsubscribeToken(validToken)).toBe(true)
    })
  })

  describe('getPreferenceUrl', () => {
    it('should generate correct preference URL', () => {
      const token = 'test-token-123'
      const url = getPreferenceUrl(token)

      expect(url).toContain('/api/email/preferences')
      expect(url).toContain(`token=${token}`)
    })

    it('should use NEXT_PUBLIC_APP_URL when available', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
      const token = 'test-token-123'
      const url = getPreferenceUrl(token)

      expect(url).toContain('https://example.com')
      expect(url).toContain('/api/email/preferences')
      expect(url).toContain(`token=${token}`)
    })

    it('should use localhost as fallback', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      const token = 'test-token-123'
      const url = getPreferenceUrl(token)

      expect(url).toContain('http://localhost:3000')
    })
  })

  describe('getUnsubscribeUrl', () => {
    it('should generate correct unsubscribe URL', () => {
      const token = 'test-token-123'
      const url = getUnsubscribeUrl(token)

      expect(url).toContain('/api/email/unsubscribe')
      expect(url).toContain(`token=${token}`)
    })

    it('should use NEXT_PUBLIC_APP_URL when available', () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
      const token = 'test-token-123'
      const url = getUnsubscribeUrl(token)

      expect(url).toContain('https://example.com')
      expect(url).toContain('/api/email/unsubscribe')
      expect(url).toContain(`token=${token}`)
    })

    it('should use localhost as fallback', () => {
      delete process.env.NEXT_PUBLIC_APP_URL
      const token = 'test-token-123'
      const url = getUnsubscribeUrl(token)

      expect(url).toContain('http://localhost:3000')
    })
  })
})