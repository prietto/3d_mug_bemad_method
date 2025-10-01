/**
 * Design Validation and Lead Linking Utilities
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides utilities for validating design data integrity
 * and managing design-lead relationships.
 */

import { createServerClient } from '@/lib/supabase'
import { Design } from '@/lib/types'

/**
 * Design validation result
 */
export interface DesignValidationResult {
  /** Whether the design is valid for lead association */
  isValid: boolean;
  /** Validation error messages */
  errors: string[];
  /** Design completion status */
  isComplete: boolean;
  /** Quality score for lead scoring (0-100) */
  qualityScore: number;
}

/**
 * Design snapshot for preservation when lead is captured
 */
export interface DesignSnapshot {
  /** Original design ID */
  designId: string;
  /** Snapshot timestamp */
  snapshotAt: string;
  /** Complete design state at time of lead capture */
  designState: Design;
  /** Hash of design state for integrity verification */
  stateHash: string;
}

/**
 * Validates design state before associating with lead
 * Checks data integrity and calculates completion/quality scores
 * 
 * @param designId - Design ID to validate
 * @returns Validation result with quality metrics
 */
export async function validateDesignForLead(designId: string): Promise<DesignValidationResult> {
  const supabase = createServerClient()
  
  try {
    // Fetch design from database
    const { data: design, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single()
    
    if (error || !design) {
      return {
        isValid: false,
        errors: ['Design not found'],
        isComplete: false,
        qualityScore: 0
      }
    }
    
    const errors: string[] = []
    let qualityScore = 0
    
    // Basic validation checks
    if (!design.mug_color) {
      errors.push('Mug color is required')
    } else {
      qualityScore += 20 // Base color selection
    }
    
    // Check for customization elements
    if (design.uploaded_image_base64 || design.uploaded_image_url) {
      qualityScore += 40 // Image customization adds significant value
    }
    
    if (design.custom_text && design.custom_text.trim().length > 0) {
      qualityScore += 30 // Text customization
      
      if (design.text_font) {
        qualityScore += 5 // Font selection
      }
      
      if (design.text_position) {
        try {
          const position = JSON.parse(design.text_position)
          if (position && typeof position === 'object') {
            qualityScore += 5 // Valid position data
          }
        } catch (e) {
          errors.push('Invalid text position data')
        }
      }
    }
    
    // Check design completion status
    const isComplete = design.is_complete && qualityScore >= 20 // Minimum viable design
    
    // Validate data integrity
    if (design.created_at && design.last_modified) {
      const created = new Date(design.created_at)
      const modified = new Date(design.last_modified)
      
      if (modified < created) {
        errors.push('Invalid timestamp data: last modified before created')
      }
    }
    
    // Check for minimum viable customization
    const hasMinimumCustomization = 
      design.mug_color !== 'default' || 
      design.uploaded_image_base64 || 
      design.custom_text
    
    if (!hasMinimumCustomization) {
      errors.push('Design lacks meaningful customization')
      qualityScore = Math.max(0, qualityScore - 20)
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      isComplete,
      qualityScore: Math.min(100, qualityScore)
    }
    
  } catch (error) {
    return {
      isValid: false,
      errors: ['Database error during design validation'],
      isComplete: false,
      qualityScore: 0
    }
  }
}

/**
 * Creates a snapshot of design state when lead is captured
 * Preserves design data for audit trail and quality analysis
 * 
 * @param designId - Design to snapshot
 * @returns Design snapshot with integrity hash
 */
export async function createDesignSnapshot(designId: string): Promise<DesignSnapshot | null> {
  const supabase = createServerClient()
  
  try {
    const { data: design, error } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .single()
    
    if (error || !design) {
      return null
    }
    
    // Convert database row to Design interface
    const designState: Design = {
      id: design.id,
      mugColor: design.mug_color,
      uploadedImageBase64: design.uploaded_image_base64,
      uploadedImageUrl: design.uploaded_image_url,
      customText: design.custom_text,
      textFont: design.text_font,
      textPosition: design.text_position,
      textSize: design.text_size,
      textColor: design.text_color,
      createdAt: design.created_at,
      lastModified: design.last_modified,
      isComplete: design.is_complete
    }
    
    // Create integrity hash
    const stateHash = await createDesignStateHash(designState)
    
    const snapshot: DesignSnapshot = {
      designId,
      snapshotAt: new Date().toISOString(),
      designState,
      stateHash
    }
    
    return snapshot
    
  } catch (error) {
    console.error('Error creating design snapshot:', error)
    return null
  }
}

/**
 * Creates SHA-256 hash of design state for integrity verification
 */
async function createDesignStateHash(design: Design): Promise<string> {
  // Create deterministic string representation
  const stateString = JSON.stringify({
    mugColor: design.mugColor,
    uploadedImageBase64: design.uploadedImageBase64,
    customText: design.customText,
    textFont: design.textFont,
    textPosition: design.textPosition,
    textSize: design.textSize,
    textColor: design.textColor,
    isComplete: design.isComplete
  }, Object.keys(design).sort()) // Ensure consistent key order
  
  // Create hash using Web Crypto API (available in Node.js 16+)
  const encoder = new TextEncoder()
  const data = encoder.encode(stateString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Updates design completion status based on validation results
 * 
 * @param designId - Design to update
 * @param validationResult - Result from validateDesignForLead
 * @returns Update success status
 */
export async function updateDesignCompletionStatus(
  designId: string, 
  validationResult: DesignValidationResult
): Promise<{ success: boolean; error?: string }> {
  const supabase = createServerClient()
  
  try {
    const { error } = await supabase
      .from('designs')
      .update({
        is_complete: validationResult.isComplete,
        last_modified: new Date().toISOString()
      })
      .eq('id', designId)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Validates design-lead relationship integrity
 * Ensures both records exist and are properly linked
 * 
 * @param leadId - Lead ID
 * @param designId - Design ID
 * @returns Relationship validation result
 */
export async function validateDesignLeadRelationship(
  leadId: string, 
  designId: string
): Promise<{ isValid: boolean; errors: string[] }> {
  const supabase = createServerClient()
  const errors: string[] = []
  
  try {
    // Check lead exists and references design
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, design_id')
      .eq('id', leadId)
      .single()
    
    if (leadError || !lead) {
      errors.push('Lead record not found')
    } else if (lead.design_id !== designId) {
      errors.push('Lead does not reference the specified design')
    }
    
    // Check design exists
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id')
      .eq('id', designId)
      .single()
    
    if (designError || !design) {
      errors.push('Design record not found')
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
    
  } catch (error) {
    return {
      isValid: false,
      errors: ['Database error during relationship validation']
    }
  }
}

/**
 * Calculate lead quality score based on design engagement
 * Higher scores indicate more engaged prospects
 * 
 * @param designValidation - Design validation result
 * @param sessionData - Session tracking data for additional context
 * @returns Quality score (0-100)
 */
export function calculateLeadQualityScore(
  designValidation: DesignValidationResult,
  sessionData?: { engagementDuration: number; deviceType: string }
): number {
  let score = designValidation.qualityScore
  
  if (sessionData) {
    // Engagement time bonus (up to 20 points)
    const engagementMinutes = sessionData.engagementDuration / 60
    if (engagementMinutes > 5) {
      score += Math.min(20, engagementMinutes * 2)
    }
    
    // Device type consideration (desktop users may be more serious)
    if (sessionData.deviceType === 'desktop') {
      score += 5
    }
  }
  
  return Math.min(100, Math.round(score))
}
