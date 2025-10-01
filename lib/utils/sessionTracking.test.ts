/**
 * Session Tracking Utilities Tests
 * Story 3.2: Lead Data Storage and Management
 */

import { beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  extractSessionData,
  detectDeviceType,
  detectBrowserType,
  extractReferralSource,
  hashIpAddress,
  validateSessionData,
  mergeSessionData
} from '@/lib/utils/sessionTracking'
import { LeadSessionData } from '@/lib/types'

describe('Session Tracking Utilities', () => {
  
  describe('detectDeviceType', () => {
    it('should detect mobile devices correctly', () => {
      const mobileUserAgents = [
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
        'Mozilla/5.0 (Mobile; Windows Phone 8.1; Android 4.0; ARM; Trident/7.0)'
      ]
      
      mobileUserAgents.forEach(ua => {
        expect(detectDeviceType(ua)).toBe('mobile')
      })
    })

    it('should detect tablet devices correctly', () => {
      const tabletUserAgents = [
        'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        'Mozilla/5.0 (Linux; Android 11; SM-T870) AppleWebKit/537.36',
        'Mozilla/5.0 (Windows NT 10.0; ARM; Trident/7.0; Touch; Tablet PC 2.0)'
      ]
      
      tabletUserAgents.forEach(ua => {
        expect(detectDeviceType(ua)).toBe('tablet')
      })
    })

    it('should detect desktop devices correctly', () => {
      const desktopUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      ]
      
      desktopUserAgents.forEach(ua => {
        expect(detectDeviceType(ua)).toBe('desktop')
      })
    })
  })

  describe('detectBrowserType', () => {
    it('should detect different browsers correctly', () => {
      const browserTests = [
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', expected: 'Chrome' },
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0', expected: 'Firefox' },
        { ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15', expected: 'Safari' },
        { ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59', expected: 'Edge' }
      ]
      
      browserTests.forEach(({ ua, expected }) => {
        expect(detectBrowserType(ua)).toBe(expected)
      })
    })
  })

  describe('extractReferralSource', () => {
    it('should extract external referral sources', () => {
      const referrals = [
        { referer: 'https://google.com/search', currentUrl: 'https://mysite.com', expected: 'google.com' },
        { referer: 'https://facebook.com/page', currentUrl: 'https://mysite.com', expected: 'facebook.com' }
      ]
      
      referrals.forEach(({ referer, currentUrl, expected }) => {
        expect(extractReferralSource(referer, currentUrl)).toBe(expected)
      })
    })

    it('should ignore same-domain referrals', () => {
      expect(extractReferralSource('https://mysite.com/page1', 'https://mysite.com/page2')).toBeUndefined()
    })

    it('should handle null referrer', () => {
      expect(extractReferralSource(null, 'https://mysite.com')).toBeUndefined()
    })
  })

  describe('hashIpAddress', () => {
    it('should create consistent hashes for same IP', () => {
      const ip = '192.168.1.1'
      const hash1 = hashIpAddress(ip)
      const hash2 = hashIpAddress(ip)
      expect(hash1).toBe(hash2)
    })

    it('should create different hashes for different IPs', () => {
      const hash1 = hashIpAddress('192.168.1.1')
      const hash2 = hashIpAddress('192.168.1.2')
      expect(hash1).not.toBe(hash2)
    })

    it('should handle unknown IPs', () => {
      expect(hashIpAddress('unknown')).toBe('unknown')
    })
  })

  describe('validateSessionData', () => {
    it('should validate complete session data', () => {
      const validData: LeadSessionData = {
        sessionId: 'test-session',
        userAgent: 'Mozilla/5.0...',
        deviceType: 'desktop',
        browserType: 'Chrome',
        engagementDuration: 120
      }
      
      const result = validateSessionData(validData)
      expect(result.isValid).toBe(true)
      expect(result.missingFields).toHaveLength(0)
    })

    it('should identify missing required fields', () => {
      const incompleteData: Partial<LeadSessionData> = {
        sessionId: 'test-session'
        // Missing other required fields
      }
      
      const result = validateSessionData(incompleteData)
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toContain('userAgent')
      expect(result.missingFields).toContain('deviceType')
      expect(result.missingFields).toContain('browserType')
    })
  })

  describe('mergeSessionData', () => {
    it('should merge server and client data correctly', () => {
      const serverData: LeadSessionData = {
        sessionId: 'server-session',
        userAgent: 'server-ua',
        deviceType: 'desktop',
        browserType: 'Chrome',
        ipAddressHash: 'server-hash',
        engagementDuration: 0
      }
      
      const clientData: Partial<LeadSessionData> = {
        sessionId: 'client-session',
        engagementDuration: 120,
        userAgent: 'client-ua' // Should be ignored for security
      }
      
      const merged = mergeSessionData(serverData, clientData)
      
      expect(merged.sessionId).toBe('client-session') // Client preference
      expect(merged.engagementDuration).toBe(120) // Client value
      expect(merged.userAgent).toBe('server-ua') // Server security data
      expect(merged.ipAddressHash).toBe('server-hash') // Server security data
    })
  })

  describe('extractSessionData integration', () => {
    it('should extract comprehensive session data from request', () => {
      // Mock NextRequest
      const mockRequest = {
        headers: new Map([
          ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124'],
          ['referer', 'https://google.com/search'],
          ['x-forwarded-for', '192.168.1.1, 10.0.0.1'],
          ['x-real-ip', '192.168.1.1']
        ]),
        url: 'https://mysite.com/landing'
      } as unknown as NextRequest

      // Mock headers.get method
      mockRequest.headers.get = (key: string) => {
        const map = mockRequest.headers as unknown as Map<string, string>
        return map.get(key) || null
      }
      
      const sessionData = extractSessionData(mockRequest, 'test-session-id')
      
      expect(sessionData.sessionId).toBe('test-session-id')
      expect(sessionData.deviceType).toBe('desktop')
      expect(sessionData.browserType).toBe('Chrome')
      expect(sessionData.referralSource).toBe('google.com')
      expect(sessionData.ipAddressHash).toBeDefined()
      expect(sessionData.ipAddressHash).not.toBe('192.168.1.1') // Should be hashed
    })
  })
})
