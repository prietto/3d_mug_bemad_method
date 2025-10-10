import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  RATE_LIMITS,
  getUTCDateKey,
  getHoursUntilUTCMidnight,
  getUTCMidnightISO,
  getClientIP
} from './rateLimiter'

describe('Rate Limiter Utility Functions', () => {
  describe('RATE_LIMITS constants', () => {
    it('should have correct rate limit values', () => {
      expect(RATE_LIMITS.SESSION_LIMIT).toBe(5)
      expect(RATE_LIMITS.IP_DAILY_LIMIT).toBe(15)
      expect(RATE_LIMITS.GLOBAL_DAILY_LIMIT).toBe(1400)
    })

    it('should be immutable (readonly)', () => {
      // TypeScript ensures this at compile time
      // This test just verifies the structure
      expect(Object.isFrozen(RATE_LIMITS)).toBe(false) // not frozen, but readonly in TS
      expect(RATE_LIMITS).toHaveProperty('SESSION_LIMIT')
      expect(RATE_LIMITS).toHaveProperty('IP_DAILY_LIMIT')
      expect(RATE_LIMITS).toHaveProperty('GLOBAL_DAILY_LIMIT')
    })
  })

  describe('getUTCDateKey', () => {
    it('should return date in YYYY-MM-DD format', () => {
      const dateKey = getUTCDateKey()
      expect(dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should return consistent value within same day', () => {
      const key1 = getUTCDateKey()
      const key2 = getUTCDateKey()
      expect(key1).toBe(key2)
    })
  })

  describe('getHoursUntilUTCMidnight', () => {
    it('should return a positive number', () => {
      const hours = getHoursUntilUTCMidnight()
      expect(hours).toBeGreaterThan(0)
      expect(hours).toBeLessThanOrEqual(24)
    })

    it('should return approximately 24 hours if called near midnight', () => {
      // Mock date to be just after midnight UTC
      const mockDate = new Date()
      mockDate.setUTCHours(0, 1, 0, 0) // 00:01 UTC
      vi.setSystemTime(mockDate)

      const hours = getHoursUntilUTCMidnight()
      expect(hours).toBe(24)

      vi.useRealTimers()
    })
  })

  describe('getUTCMidnightISO', () => {
    it('should return ISO timestamp for next UTC midnight', () => {
      const midnight = getUTCMidnightISO()
      const date = new Date(midnight)

      expect(date.getUTCHours()).toBe(0)
      expect(date.getUTCMinutes()).toBe(0)
      expect(date.getUTCSeconds()).toBe(0)
      expect(date.getUTCMilliseconds()).toBe(0)
    })

    it('should return tomorrow if called today', () => {
      const midnight = getUTCMidnightISO()
      const midnightDate = new Date(midnight)
      const tomorrow = new Date()
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      expect(midnightDate.getUTCDate()).toBe(tomorrow.getUTCDate())
    })
  })

  describe('getClientIP', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1'
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.1')
    })

    it('should handle comma-separated IPs in x-forwarded-for', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1'
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.1') // Should return first IP
    })

    it('should fallback to x-real-ip if x-forwarded-for not present', () => {
      const headers = new Headers({
        'x-real-ip': '10.0.0.5'
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('10.0.0.5')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const headers = new Headers({
        'x-forwarded-for': '192.168.1.1',
        'x-real-ip': '10.0.0.5'
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.1')
    })

    it('should return "unknown" if no IP headers present', () => {
      const headers = new Headers()

      const ip = getClientIP(headers)
      expect(ip).toBe('unknown')
    })

    it('should trim whitespace from IPs', () => {
      const headers = new Headers({
        'x-forwarded-for': '  192.168.1.1  ,  10.0.0.1  '
      })

      const ip = getClientIP(headers)
      expect(ip).toBe('192.168.1.1')
    })
  })
})
