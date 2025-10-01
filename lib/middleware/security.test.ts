import { vi, beforeEach } from 'vitest'
import { 
  rateLimit, 
  getClientIdentifier, 
  getSecurityHeaders, 
  getCorsHeaders,
  logError,
  logInfo,
  createRequestTimer
} from './security'

describe('Security Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rateLimit', () => {
    it('should allow requests within rate limit', () => {
      const result = rateLimit('test-client', { maxRequests: 5, windowMs: 60000 })
      
      expect(result.allowed).toBe(true)
      expect(result.remainingRequests).toBe(4)
      expect(result.headers['X-RateLimit-Limit']).toBe('5')
      expect(result.headers['X-RateLimit-Remaining']).toBe('4')
    })

    it('should block requests exceeding rate limit', () => {
      const clientId = 'test-client-block'
      const config = { maxRequests: 2, windowMs: 60000 }
      
      // First two requests should be allowed
      let result = rateLimit(clientId, config)
      expect(result.allowed).toBe(true)
      expect(result.remainingRequests).toBe(1)
      
      result = rateLimit(clientId, config)
      expect(result.allowed).toBe(true)
      expect(result.remainingRequests).toBe(0)
      
      // Third request should be blocked
      result = rateLimit(clientId, config)
      expect(result.allowed).toBe(false)
      expect(result.remainingRequests).toBe(0)
    })

    it('should reset rate limit after window expires', async () => {
      const clientId = 'test-client-reset'
      const config = { maxRequests: 1, windowMs: 10 } // Very short window
      
      // First request allowed
      let result = rateLimit(clientId, config)
      expect(result.allowed).toBe(true)
      
      // Second request blocked
      result = rateLimit(clientId, config)
      expect(result.allowed).toBe(false)
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 15))
      
      // Should be allowed again
      result = rateLimit(clientId, config)
      expect(result.allowed).toBe(true)
    })
  })

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      })
      
      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'x-real-ip': '192.168.1.2' }
      })
      
      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.2')
    })

    it('should extract IP from cf-connecting-ip header', () => {
      const request = new Request('http://localhost', {
        headers: { 'cf-connecting-ip': '192.168.1.3' }
      })
      
      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.3')
    })

    it('should return unknown when no IP headers present', () => {
      const request = new Request('http://localhost')
      
      const result = getClientIdentifier(request)
      expect(result).toBe('unknown')
    })
  })

  describe('getSecurityHeaders', () => {
    it('should return security headers', () => {
      const headers = getSecurityHeaders()
      
      expect(headers).toEqual({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'",
      })
    })
  })

  describe('getCorsHeaders', () => {
    it('should allow localhost origins', () => {
      const headers = getCorsHeaders('http://localhost:3000')
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
      expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, PUT, DELETE, OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type, Authorization')
    })

    it('should default to localhost:3000 for unknown origins', () => {
      const headers = getCorsHeaders('http://evil.com')
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
    })

    it('should handle undefined origin', () => {
      const headers = getCorsHeaders(undefined)
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000')
    })
  })

  describe('createRequestTimer', () => {
    it('should track request timing', async () => {
      const timer = createRequestTimer()
      
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const duration = timer.end()
      expect(duration).toBeGreaterThanOrEqual(10)
      
      const headers = timer.getHeaders()
      expect(headers['X-Response-Time']).toMatch(/^\d+ms$/)
    })
  })

  describe('logError', () => {
    it('should log structured error data', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const error = new Error('Test error')
      const context = {
        method: 'POST',
        url: 'http://localhost/api/test',
        timestamp: '2025-09-26T10:00:00.000Z',
        requestId: 'test-123',
        clientIp: '127.0.0.1'
      }
      
      logError(error, context, { component: 'test' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.stringContaining('"level": "error"')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'API Error:',
        expect.stringContaining('"message": "Test error"')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('logInfo', () => {
    it('should log structured info data', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      const context = {
        method: 'GET',
        url: 'http://localhost/api/test',
        timestamp: '2025-09-26T10:00:00.000Z',
        requestId: 'test-123',
        clientIp: '127.0.0.1'
      }
      
      logInfo('Test message', context, { data: 'test' })
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'API Info:',
        expect.stringContaining('"level": "info"')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        'API Info:',
        expect.stringContaining('"message": "Test message"')
      )
      
      consoleSpy.mockRestore()
    })
  })
})
