/**
 * Design Validation Tests
 * Story 3.2: Lead Data Storage and Management
 */

import { beforeEach, vi } from 'vitest'
import {
  validateDesignForLead,
  createDesignSnapshot,
  updateDesignCompletionStatus,
  calculateLeadQualityScore,
  validateDesignLeadRelationship
} from '@/lib/utils/designValidation'

// Mock Supabase client
const mockSupabase: any = {
  from: vi.fn(function(this: any) { return this }),
  select: vi.fn(function(this: any) { return this }),
  eq: vi.fn(function(this: any) { return this }),
  single: vi.fn(),
  update: vi.fn(function(this: any) { return this })
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase
}))

describe('Design Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('validateDesignForLead', () => {
    it('should validate a complete design successfully', async () => {
      const mockDesign = {
        id: 'design-123',
        mug_color: 'blue',
        uploaded_image_base64: 'base64imagedata',
        custom_text: 'Hello World',
        text_font: 'Arial',
        text_position: '{"x": 0, "y": 0}',
        created_at: '2025-01-01T00:00:00Z',
        last_modified: '2025-01-01T00:05:00Z',
        is_complete: true
      }

      mockSupabase.single.mockResolvedValue({
        data: mockDesign,
        error: null
      })

      const result = await validateDesignForLead('design-123')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.isComplete).toBe(true)
      expect(result.qualityScore).toBeGreaterThan(50)
    })

    it('should detect invalid design data', async () => {
      const mockInvalidDesign = {
        id: 'design-456',
        mug_color: '', // Missing required field
        uploaded_image_base64: null,
        custom_text: '',
        text_position: 'invalid-json',
        created_at: '2025-01-01T00:05:00Z',
        last_modified: '2025-01-01T00:00:00Z', // Invalid: modified before created
        is_complete: false
      }

      mockSupabase.single.mockResolvedValue({
        data: mockInvalidDesign,
        error: null
      })

      const result = await validateDesignForLead('design-456')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Mug color is required')
      expect(result.errors).toContain('Invalid text position data')
      expect(result.errors).toContain('Invalid timestamp data: last modified before created')
      expect(result.qualityScore).toBeLessThan(30)
    })

    it('should handle missing design', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Design not found')
      })

      const result = await validateDesignForLead('non-existent')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Design not found')
      expect(result.qualityScore).toBe(0)
    })

    it('should calculate quality scores correctly', async () => {
      const highQualityDesign = {
        id: 'design-high',
        mug_color: 'red', // 20 points
        uploaded_image_base64: 'imagedata', // 40 points
        custom_text: 'Custom Message', // 30 points
        text_font: 'Helvetica', // 5 points
        text_position: '{"x": 10, "y": 20}', // 5 points
        created_at: '2025-01-01T00:00:00Z',
        last_modified: '2025-01-01T00:05:00Z',
        is_complete: true
      }

      mockSupabase.single.mockResolvedValue({
        data: highQualityDesign,
        error: null
      })

      const result = await validateDesignForLead('design-high')

      expect(result.qualityScore).toBe(100) // Should cap at 100
      expect(result.isComplete).toBe(true)
    })
  })

  describe('createDesignSnapshot', () => {
    it('should create design snapshot with integrity hash', async () => {
      const mockDesign = {
        id: 'design-123',
        mug_color: 'blue',
        uploaded_image_base64: 'imagedata',
        custom_text: 'Test',
        text_font: 'Arial',
        created_at: '2025-01-01T00:00:00Z',
        last_modified: '2025-01-01T00:05:00Z',
        is_complete: true
      }

      mockSupabase.single.mockResolvedValue({
        data: mockDesign,
        error: null
      })

      // Mock crypto.subtle for hash creation
      const mockDigest = vi.fn().mockResolvedValue(new ArrayBuffer(32))
      Object.defineProperty(global, 'crypto', {
        value: {
          subtle: { digest: mockDigest }
        },
        writable: true
      })

      const snapshot = await createDesignSnapshot('design-123')

      expect(snapshot).toBeDefined()
      expect(snapshot?.designId).toBe('design-123')
      expect(snapshot?.designState.mugColor).toBe('blue')
      expect(snapshot?.stateHash).toBeDefined()
    })

    it('should return null for missing design', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Not found')
      })

      const snapshot = await createDesignSnapshot('missing')

      expect(snapshot).toBeNull()
    })
  })

  describe('updateDesignCompletionStatus', () => {
    it('should update completion status successfully', async () => {
      const validationResult = {
        isValid: true,
        errors: [],
        isComplete: true,
        qualityScore: 85
      }

      mockSupabase.update.mockResolvedValue({ error: null })

      const result = await updateDesignCompletionStatus('design-123', validationResult)

      expect(result.success).toBe(true)
      expect(mockSupabase.update).toHaveBeenCalledWith({
        is_complete: true,
        last_modified: expect.any(String)
      })
    })

    it('should handle database errors', async () => {
      const validationResult = {
        isValid: false,
        errors: ['Some error'],
        isComplete: false,
        qualityScore: 0
      }

      mockSupabase.update.mockResolvedValue({
        error: new Error('Update failed')
      })

      const result = await updateDesignCompletionStatus('design-123', validationResult)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Update failed')
    })
  })

  describe('validateDesignLeadRelationship', () => {
    it('should validate proper relationship', async () => {
      // Mock lead lookup
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'lead-123', design_id: 'design-456' },
          error: null
        })
        // Mock design lookup
        .mockResolvedValueOnce({
          data: { id: 'design-456' },
          error: null
        })

      const result = await validateDesignLeadRelationship('lead-123', 'design-456')

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should detect mismatched relationship', async () => {
      // Mock lead with different design ID
      mockSupabase.single
        .mockResolvedValueOnce({
          data: { id: 'lead-123', design_id: 'design-different' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { id: 'design-456' },
          error: null
        })

      const result = await validateDesignLeadRelationship('lead-123', 'design-456')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Lead does not reference the specified design')
    })

    it('should detect missing records', async () => {
      // Mock missing lead
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: new Error('Not found') })
        .mockResolvedValueOnce({ data: null, error: new Error('Not found') })

      const result = await validateDesignLeadRelationship('missing-lead', 'missing-design')

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Lead record not found')
      expect(result.errors).toContain('Design record not found')
    })
  })

  describe('calculateLeadQualityScore', () => {
    it('should calculate score with design and session data', () => {
      const designValidation = {
        isValid: true,
        errors: [],
        isComplete: true,
        qualityScore: 70
      }

      const sessionData = {
        engagementDuration: 600, // 10 minutes
        deviceType: 'desktop'
      }

      const score = calculateLeadQualityScore(designValidation, sessionData)

      expect(score).toBeGreaterThan(70) // Should add bonuses
      expect(score).toBeLessThanOrEqual(100) // Should not exceed maximum
    })

    it('should handle missing session data', () => {
      const designValidation = {
        isValid: true,
        errors: [],
        isComplete: true,
        qualityScore: 80
      }

      const score = calculateLeadQualityScore(designValidation)

      expect(score).toBe(80) // Should use base design score
    })

    it('should apply engagement time bonus', () => {
      const designValidation = {
        isValid: true,
        errors: [],
        isComplete: true,
        qualityScore: 50
      }

      const longEngagement = {
        engagementDuration: 1200, // 20 minutes
        deviceType: 'mobile'
      }

      const score = calculateLeadQualityScore(designValidation, longEngagement)

      expect(score).toBeGreaterThan(50) // Should get engagement bonus
    })
  })
})
