/**
 * Email Templates Tests
 * Story 3.4: Automated Lead Notifications and Confirmations
 *
 * Tests for email template generation and content
 */

import {
  generateBusinessNotificationEmail,
  generateUserConfirmationEmail,
} from './emailTemplates'
import type { Lead, Design } from '@/types/email'

describe('Email Templates', () => {
  const mockLead: Lead = {
    id: 'lead-123',
    email: 'john@example.com',
    name: 'John Doe',
    phone: '+1-555-123-4567',
    projectDescription: 'Need 50 custom mugs for company event',
    designId: 'design-456',
    createdAt: '2024-01-15T10:00:00Z',
    source: 'google_ads',
    engagementLevel: 'high',
    status: 'new',
  }

  const mockDesign: Design = {
    id: 'design-456',
    mugColor: 'blue',
    customText: 'Company Event 2024',
    textFont: 'Arial',
    uploadedImageBase64: 'data:image/png;base64,iVBORw0KGgo...',
    createdAt: '2024-01-15T09:00:00Z',
    lastModified: '2024-01-15T09:30:00Z',
    isComplete: true,
  }

  describe('generateBusinessNotificationEmail', () => {
    it('should generate business notification with all lead details', () => {
      const result = generateBusinessNotificationEmail(mockLead, mockDesign)

      expect(result.subject).toContain(mockLead.name)
      expect(result.subject).toContain('HIGH')
      expect(result.html).toContain(mockLead.name)
      expect(result.html).toContain(mockLead.email)
      expect(result.html).toContain(mockLead.phone)
      expect(result.html).toContain(mockLead.projectDescription)
      expect(result.html).toContain(mockLead.source)
      expect(result.text).toContain(mockLead.name)
      expect(result.text).toContain(mockLead.email)
    })

    it('should include design details when provided', () => {
      const result = generateBusinessNotificationEmail(mockLead, mockDesign)

      expect(result.html).toContain(mockDesign.mugColor)
      expect(result.html).toContain(mockDesign.customText)
      expect(result.html).toContain('Uploaded Image')
      expect(result.text).toContain(mockDesign.mugColor)
      expect(result.text).toContain(mockDesign.customText)
    })

    it('should work without design', () => {
      const result = generateBusinessNotificationEmail(mockLead)

      expect(result.subject).toContain(mockLead.name)
      expect(result.html).toContain(mockLead.name)
      expect(result.html).not.toContain('Design Details')
    })

    it('should work without phone number', () => {
      const leadWithoutPhone = { ...mockLead, phone: undefined }
      const result = generateBusinessNotificationEmail(leadWithoutPhone)

      expect(result.html).not.toContain('Phone:')
      expect(result.text).not.toContain('Phone:')
    })

    it('should include engagement level badge', () => {
      const highLead = { ...mockLead, engagementLevel: 'high' as const }
      const mediumLead = { ...mockLead, engagementLevel: 'medium' as const }
      const lowLead = { ...mockLead, engagementLevel: 'low' as const }

      expect(generateBusinessNotificationEmail(highLead).html).toContain('badge-high')
      expect(generateBusinessNotificationEmail(mediumLead).html).toContain('badge-medium')
      expect(generateBusinessNotificationEmail(lowLead).html).toContain('badge-low')
    })

    it('should include view lead link', () => {
      const result = generateBusinessNotificationEmail(mockLead, mockDesign)

      expect(result.html).toContain(`/admin/leads/${mockLead.id}`)
      expect(result.text).toContain(`/admin/leads/${mockLead.id}`)
    })

    it('should be mobile-responsive', () => {
      const result = generateBusinessNotificationEmail(mockLead, mockDesign)

      expect(result.html).toContain('max-width: 600px')
      expect(result.html).toContain('viewport')
    })
  })

  describe('generateUserConfirmationEmail', () => {
    it('should generate user confirmation with personalized greeting', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.subject).toContain('Your Custom Mug Design')
      expect(result.html).toContain(`Hi ${mockLead.name}`)
      expect(result.text).toContain(`Hi ${mockLead.name}`)
    })

    it('should include design details when provided', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).toContain(mockDesign.mugColor)
      expect(result.html).toContain(mockDesign.customText)
      expect(result.text).toContain(mockDesign.mugColor)
      expect(result.text).toContain(mockDesign.customText)
    })

    it('should include next steps timeline', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).toContain('What Happens Next')
      expect(result.html).toContain('24-48 hours')
      expect(result.html).toContain('Quote')
      expect(result.html).toContain('Approval')
      expect(result.html).toContain('Delivery')
      expect(result.text).toContain('What Happens Next')
    })

    it('should include contact information', () => {
      process.env.BUSINESS_EMAIL = 'support@custommugs.com'
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).toContain('support@custommugs.com')
      expect(result.text).toContain('support@custommugs.com')
    })

    it('should include unsubscribe link when token provided', () => {
      const token = 'unsubscribe-token-123'
      const result = generateUserConfirmationEmail(mockLead, mockDesign, token)

      expect(result.html).toContain(`/api/email/unsubscribe?token=${token}`)
      expect(result.html).toContain('Unsubscribe')
      expect(result.text).toContain(`/api/email/unsubscribe?token=${token}`)
    })

    it('should work without unsubscribe token', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).not.toContain('/api/email/unsubscribe')
    })

    it('should include privacy policy link', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).toContain('/privacy')
      expect(result.text).toContain('/privacy')
    })

    it('should be mobile-responsive', () => {
      const result = generateUserConfirmationEmail(mockLead, mockDesign)

      expect(result.html).toContain('max-width: 600px')
      expect(result.html).toContain('viewport')
    })

    it('should work without design', () => {
      const result = generateUserConfirmationEmail(mockLead)

      expect(result.html).toContain(`Hi ${mockLead.name}`)
      expect(result.html).not.toContain('Your Design')
    })
  })
})