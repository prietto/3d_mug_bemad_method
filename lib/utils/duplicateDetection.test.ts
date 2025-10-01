/**
 * Duplicate Detection Tests
 * Story 3.2: Lead Data Storage and Management
 */

import { beforeEach, vi } from 'vitest'
import {
  checkForDuplicateLead,
  mergeDuplicateLead,
  logDuplicateDetection,
  DEFAULT_DUPLICATE_CONFIG
} from '@/lib/utils/duplicateDetection'
import { LeadSessionData } from '@/lib/types'

// Mock Supabase client
const mockSupabase: any = {
  from: vi.fn(function(this: any) { return this }),
  select: vi.fn(function(this: any) { return this }),
  eq: vi.fn(function(this: any) { return this }),
  gte: vi.fn(function(this: any) { return this }),
  order: vi.fn(function(this: any) { return this }),
  limit: vi.fn(function(this: any) { return this }),
  single: vi.fn(),
  update: vi.fn(function(this: any) { return this })
}

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => mockSupabase
}))

describe('Duplicate Detection', () => {
  const mockSessionData: LeadSessionData = {
    sessionId: 'test-session-123',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceType: 'desktop',
    browserType: 'Chrome',
    ipAddressHash: 'hashed-ip-address',
    engagementDuration: 300
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkForDuplicateLead', () => {
    it('should detect email-based duplicates', async () => {
      // Mock existing lead found by email
      mockSupabase.single.mockResolvedValueOnce({
        data: [{ id: 'existing-lead-123', email: 'test@example.com', created_at: new Date().toISOString() }],
        error: null
      })

      const result = await checkForDuplicateLead('test@example.com', mockSessionData)

      expect(result.isDuplicate).toBe(true)
      expect(result.duplicateType).toBe('email')
      expect(result.existingLeadId).toBe('existing-lead-123')
      expect(result.canMerge).toBe(true)
    })

    it('should detect session-based duplicates', async () => {
      // Mock no email duplicate
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: null })
      
      // Mock existing lead found by session
      mockSupabase.single.mockResolvedValueOnce({
        data: [{ id: 'session-lead-456', session_id: 'test-session-123', created_at: new Date().toISOString() }],
        error: null
      })

      const result = await checkForDuplicateLead('different@example.com', mockSessionData)

      expect(result.isDuplicate).toBe(true)
      expect(result.duplicateType).toBe('session')
      expect(result.existingLeadId).toBe('session-lead-456')
    })

    it('should detect fingerprint-based duplicates', async () => {
      // Mock no email or session duplicates
      mockSupabase.single
        .mockResolvedValueOnce({ data: null, error: null })
        .mockResolvedValueOnce({ data: null, error: null })
      
      // Mock existing lead found by fingerprint
      mockSupabase.single.mockResolvedValueOnce({
        data: [{ 
          id: 'fingerprint-lead-789', 
          ip_address_hash: 'hashed-ip-address',
          user_agent: mockSessionData.userAgent,
          created_at: new Date().toISOString() 
        }],
        error: null
      })

      const result = await checkForDuplicateLead('another@example.com', mockSessionData)

      expect(result.isDuplicate).toBe(true)
      expect(result.duplicateType).toBe('fingerprint')
      expect(result.existingLeadId).toBe('fingerprint-lead-789')
    })

    it('should return no duplicate when none found', async () => {
      // Mock no duplicates found in any check
      mockSupabase.single
        .mockResolvedValue({ data: null, error: null })

      const result = await checkForDuplicateLead('unique@example.com', mockSessionData)

      expect(result.isDuplicate).toBe(false)
      expect(result.duplicateType).toBeUndefined()
      expect(result.canMerge).toBe(false)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      mockSupabase.single.mockResolvedValue({ 
        data: null, 
        error: new Error('Database connection failed') 
      })

      const result = await checkForDuplicateLead('error@example.com', mockSessionData)

      expect(result.isDuplicate).toBe(false)
    })
  })

  describe('mergeDuplicateLead', () => {
    it('should merge new data with existing lead', async () => {
      const existingLead = {
        id: 'existing-123',
        email: 'test@example.com',
        name: 'John Doe',
        phone: null,
        project_description: 'Original description',
        design_id: null
      }

      const newLeadData = {
        email: 'test@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        projectDescription: 'Additional details about the project',
        designId: 'new-design-456',
        source: 'google',
        sessionData: mockSessionData
      }

      // Mock existing lead fetch
      mockSupabase.single.mockResolvedValueOnce({
        data: existingLead,
        error: null
      })

      // Mock update operation
      mockSupabase.single.mockResolvedValueOnce({
        data: { ...existingLead, phone: newLeadData.phone, design_id: newLeadData.designId },
        error: null
      })

      const result = await mergeDuplicateLead('existing-123', newLeadData)

      expect(result.success).toBe(true)
      expect(result.data.phone).toBe(newLeadData.phone)
      expect(result.data.design_id).toBe(newLeadData.designId)
    })

    it('should handle missing existing lead', async () => {
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Lead not found')
      })

      const result = await mergeDuplicateLead('non-existent', {
        email: 'test@example.com',
        name: 'Test',
        projectDescription: 'Test',
        source: 'direct',
        sessionData: mockSessionData
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Existing lead not found')
    })
  })

  describe('logDuplicateDetection', () => {
    it('should log duplicate detection events', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const duplicateResult = {
        isDuplicate: true,
        duplicateType: 'email' as const,
        existingLeadId: 'test-123',
        canMerge: true,
        reason: 'Email already exists'
      }

      logDuplicateDetection(duplicateResult, 'test@example.com', 'session-123', { requestId: 'req-456' })

      expect(consoleSpy).toHaveBeenCalledWith('Duplicate lead detection:', expect.objectContaining({
        event: 'duplicate_detection',
        isDuplicate: true,
        duplicateType: 'email',
        email: 'test@example.com',
        sessionId: 'session-123'
      }))

      consoleSpy.mockRestore()
    })

    it('should log no duplicate events', () => {
      const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {})

      const duplicateResult = {
        isDuplicate: false,
        canMerge: false
      }

      logDuplicateDetection(duplicateResult, 'unique@example.com', 'session-456', { requestId: 'req-789' })

      expect(consoleSpy).toHaveBeenCalledWith('No duplicate detected:', expect.objectContaining({
        event: 'duplicate_detection',
        isDuplicate: false,
        email: 'unique@example.com',
        sessionId: 'session-456'
      }))

      consoleSpy.mockRestore()
    })
  })

  describe('Configuration handling', () => {
    it('should use custom detection configuration', async () => {
      const customConfig = {
        emailTimeWindowHours: 12,
        sessionTimeWindowMinutes: 15,
        allowMergeUpdates: false
      }

      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await checkForDuplicateLead('test@example.com', mockSessionData, customConfig)

      expect(result.canMerge).toBe(false) // Custom config disallows merging
    })

    it('should use default configuration when none provided', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const result = await checkForDuplicateLead('test@example.com', mockSessionData)

      // Should use DEFAULT_DUPLICATE_CONFIG values
      expect(DEFAULT_DUPLICATE_CONFIG.allowMergeUpdates).toBe(true)
    })
  })
})
