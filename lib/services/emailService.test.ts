/**
 * Email Service Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for SendGrid integration, email delivery, and configuration validation
 */

import { beforeEach, vi, afterEach } from 'vitest'
import { sendEmail, validateEmailConfig, type EmailOptions } from './emailService'

// Mock SendGrid with factory function
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn(),
  },
}))

import sgMail from '@sendgrid/mail'
const mockSendGrid = vi.mocked(sgMail)

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset environment
    process.env.NODE_ENV = 'test'
    process.env.EMAIL_FROM = 'test@example.com'
    process.env.EMAIL_FROM_NAME = 'Test Company'
    process.env.SENDGRID_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('sendEmail', () => {
    it('should send email successfully with all options', async () => {
      mockSendGrid.send.mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'msg-123' },
        } as any,
        {},
      ])

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
        text: 'Test',
      }

      const result = await sendEmail(options)

      expect(result.success).toBe(true)
      expect(result.messageId).toBeDefined()
    })

    it('should handle SendGrid errors gracefully', async () => {
      mockSendGrid.send.mockRejectedValue(new Error('SendGrid API error'))

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      }

      const result = await sendEmail(options)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should work in development mode without actual sending', async () => {
      process.env.NODE_ENV = 'development'

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      }

      const result = await sendEmail(options)

      expect(result.success).toBe(true)
      expect(result.messageId).toContain('dev-')
      expect(mockSendGrid.send).not.toHaveBeenCalled()
    })

    it('should include text fallback when not provided', async () => {
      mockSendGrid.send.mockResolvedValue([
        {
          statusCode: 202,
          headers: { 'x-message-id': 'msg-123' },
        } as any,
        {},
      ])

      const options: EmailOptions = {
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<h1>Test</h1>',
      }

      await sendEmail(options)

      expect(mockSendGrid.send).toHaveBeenCalledWith(
        expect.objectContaining({
          text: '',
        })
      )
    })
  })

  describe('validateEmailConfig', () => {
    it('should validate correct configuration', () => {
      const result = validateEmailConfig()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when EMAIL_FROM is missing', () => {
      delete process.env.EMAIL_FROM

      const result = validateEmailConfig()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('EMAIL_FROM environment variable is not set')
    })

    it('should allow missing SENDGRID_API_KEY in development', () => {
      process.env.NODE_ENV = 'development'
      delete process.env.SENDGRID_API_KEY

      const result = validateEmailConfig()

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail when SENDGRID_API_KEY is missing in production', () => {
      process.env.NODE_ENV = 'production'
      delete process.env.SENDGRID_API_KEY

      const result = validateEmailConfig()

      expect(result.valid).toBe(false)
      expect(result.errors).toContain(
        'SENDGRID_API_KEY environment variable is not set (required for production)'
      )
    })
  })
})