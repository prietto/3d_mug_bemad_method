
import { Lead, Design, AnalyticsEvent } from '@/lib/types'

describe('TypeScript Interfaces', () => {
  describe('Lead Interface', () => {
    it('should have all required properties', () => {
      const lead: Lead = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'John Doe',
        projectDescription: 'Need 100 custom mugs',
        createdAt: '2025-09-26T00:00:00.000Z',
        source: 'google_ads',
        engagementLevel: 'high',
        status: 'new'
      }

      expect(lead.id).toBe('550e8400-e29b-41d4-a716-446655440000')
      expect(lead.email).toBe('test@example.com')
      expect(lead.name).toBe('John Doe')
      expect(lead.projectDescription).toBe('Need 100 custom mugs')
      expect(lead.engagementLevel).toBe('high')
      expect(lead.status).toBe('new')
    })

    it('should allow optional properties', () => {
      const lead: Lead = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        name: 'John Doe',
        phone: '+1-555-123-4567',
        projectDescription: 'Need 100 custom mugs',
        designId: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: '2025-09-26T00:00:00.000Z',
        source: 'google_ads',
        engagementLevel: 'high',
        status: 'new'
      }

      expect(lead.phone).toBe('+1-555-123-4567')
      expect(lead.designId).toBe('550e8400-e29b-41d4-a716-446655440001')
    })
  })

  describe('Design Interface', () => {
    it('should have all required properties', () => {
      const design: Design = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        mugColor: 'blue',
        createdAt: '2025-09-26T00:00:00.000Z',
        lastModified: '2025-09-26T00:00:00.000Z',
        isComplete: false
      }

      expect(design.id).toBe('550e8400-e29b-41d4-a716-446655440001')
      expect(design.mugColor).toBe('blue')
      expect(design.isComplete).toBe(false)
    })

    it('should allow optional properties', () => {
      const design: Design = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        mugColor: 'red',
        uploadedImageBase64: 'data:image/png;base64,iVBOR...',
        customText: 'Custom Message',
        textFont: 'Arial',
        textPosition: '{"x": 0, "y": 0, "z": 0}',
        createdAt: '2025-09-26T00:00:00.000Z',
        lastModified: '2025-09-26T00:00:00.000Z',
        isComplete: true
      }

      expect(design.uploadedImageBase64).toBe('data:image/png;base64,iVBOR...')
      expect(design.customText).toBe('Custom Message')
      expect(design.textFont).toBe('Arial')
      expect(design.textPosition).toBe('{"x": 0, "y": 0, "z": 0}')
      expect(design.isComplete).toBe(true)
    })
  })

  describe('AnalyticsEvent Interface', () => {
    it('should have all required properties', () => {
      const event: AnalyticsEvent = {
        id: '550e8400-e29b-41d4-a716-446655440002',
        sessionId: 'sess_123456',
        eventType: 'mug_rotate',
        eventData: { angle: 45, duration: 1000 },
        timestamp: new Date(),
        userAgent: 'Mozilla/5.0...'
      }

      expect(event.sessionId).toBe('sess_123456')
      expect(event.eventType).toBe('mug_rotate')
      expect(event.eventData).toEqual({ angle: 45, duration: 1000 })
    })

    it('should enforce valid event types', () => {
      const validEventTypes = ['page_view', 'mug_rotate', 'color_change', 'image_upload', 'text_add', 'lead_capture']
      
      validEventTypes.forEach(eventType => {
        const event: AnalyticsEvent = {
          id: '550e8400-e29b-41d4-a716-446655440002',
          sessionId: 'sess_123456',
          eventType: eventType as AnalyticsEvent['eventType'],
          eventData: {},
          timestamp: new Date(),
          userAgent: 'Mozilla/5.0...'
        }
        
        expect(validEventTypes).toContain(event.eventType)
      })
    })
  })
})
