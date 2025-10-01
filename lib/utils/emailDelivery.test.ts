/**
 * Email Delivery Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for retry logic, exponential backoff, and async delivery
 */

import { beforeEach, vi } from 'vitest'
import { sendEmailWithRetry, isValidEmail, type DeliveryResult } from './emailDelivery'
import type { EmailResult } from '../services/emailService'

// Mock the email service
vi.mock('../services/emailService', () => ({
  sendEmail: vi.fn(),
}))

import { sendEmail } from '../services/emailService'

describe('Email Delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('sendEmailWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockSendEmail = vi.mocked(sendEmail)
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: 'msg-123',
      })

      const result = await sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('msg-123')
      expect(result.retryCount).toBe(0)
      expect(mockSendEmail).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure with exponential backoff', async () => {
      const mockSendEmail = vi.mocked(sendEmail)

      // Fail first 2 times, succeed on 3rd
      mockSendEmail
        .mockResolvedValueOnce({ success: false, error: 'Temporary failure' })
        .mockResolvedValueOnce({ success: false, error: 'Temporary failure' })
        .mockResolvedValueOnce({ success: true, messageId: 'msg-123' })

      const resultPromise = sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      // Fast-forward through retry delays
      await vi.advanceTimersByTimeAsync(1000) // First retry after 1s
      await vi.advanceTimersByTimeAsync(2000) // Second retry after 2s

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(result.retryCount).toBe(2)
      expect(mockSendEmail).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const mockSendEmail = vi.mocked(sendEmail)
      mockSendEmail.mockResolvedValue({ success: false, error: 'Permanent failure' })

      const resultPromise = sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      // Fast-forward through all retries (1s + 2s + 4s + 8s + 16s)
      await vi.advanceTimersByTimeAsync(31000)

      const result = await resultPromise

      expect(result.success).toBe(false)
      expect(result.retryCount).toBe(5)
      expect(mockSendEmail).toHaveBeenCalledTimes(6) // Initial + 5 retries
    })

    it('should handle exceptions with retry', async () => {
      const mockSendEmail = vi.mocked(sendEmail)

      // Throw exception first time, succeed second time
      mockSendEmail
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, messageId: 'msg-123' })

      const resultPromise = sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      await vi.advanceTimersByTimeAsync(1000)

      const result = await resultPromise

      expect(result.success).toBe(true)
      expect(result.retryCount).toBe(1)
    })

    it('should use correct exponential backoff delays', async () => {
      const mockSendEmail = vi.mocked(sendEmail)
      mockSendEmail.mockResolvedValue({ success: false, error: 'Failure' })

      const delays: number[] = []
      const originalSetTimeout = global.setTimeout

      // Track delay values
      vi.spyOn(global, 'setTimeout').mockImplementation(((callback: any, delay: number) => {
        delays.push(delay)
        return originalSetTimeout(callback, 0) as any
      }) as any)

      const resultPromise = sendEmailWithRetry({
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
      })

      await vi.advanceTimersByTimeAsync(31000)
      await resultPromise

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      expect(delays).toEqual([1000, 2000, 4000, 8000, 16000])
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
      expect(isValidEmail('name.surname@company.io')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('invalid@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
      expect(isValidEmail('no-at-sign.com')).toBe(false)
      expect(isValidEmail('spaces in@email.com')).toBe(false)
    })
  })
})