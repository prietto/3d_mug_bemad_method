/**
 * Duplicate Detection Utilities  
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides utilities for preventing duplicate lead submissions
 * using multiple detection strategies including session fingerprinting,
 * email-based detection, and configurable time windows.
 */

import { createServerClient } from '@/lib/supabase'
import { LeadSessionData } from '@/lib/types'

/**
 * Configuration for duplicate detection rules
 */
export interface DuplicateDetectionConfig {
  /** Time window for email-based detection (hours) */
  emailTimeWindowHours: number;
  /** Time window for session-based detection (minutes) */
  sessionTimeWindowMinutes: number;
  /** Whether to allow updates to existing leads */
  allowMergeUpdates: boolean;
}

/**
 * Default duplicate detection configuration
 */
export const DEFAULT_DUPLICATE_CONFIG: DuplicateDetectionConfig = {
  emailTimeWindowHours: 24,
  sessionTimeWindowMinutes: 30,
  allowMergeUpdates: true
};

/**
 * Result of duplicate detection check
 */
export interface DuplicateCheckResult {
  /** Whether a duplicate was found */
  isDuplicate: boolean;
  /** Type of duplicate detection that matched */
  duplicateType?: 'email' | 'session' | 'fingerprint';
  /** Existing lead ID if duplicate found */
  existingLeadId?: string;
  /** Whether the existing lead can be updated */
  canMerge: boolean;
  /** Human readable reason for duplicate detection */
  reason?: string;
}

/**
 * Comprehensive duplicate detection for lead submissions
 * Checks email, session, and fingerprint-based duplicates
 * 
 * @param email - Lead email address
 * @param sessionData - Session tracking data
 * @param config - Detection configuration
 * @returns Duplicate check result
 */
export async function checkForDuplicateLead(
  email: string,
  sessionData: LeadSessionData,
  config: DuplicateDetectionConfig = DEFAULT_DUPLICATE_CONFIG
): Promise<DuplicateCheckResult> {
  const supabase = createServerClient()
  
  // Check 1: Email-based duplicate detection
  const emailDuplicate = await checkEmailDuplicate(email, config.emailTimeWindowHours)
  if (emailDuplicate.isDuplicate) {
    return {
      ...emailDuplicate,
      canMerge: config.allowMergeUpdates
    }
  }
  
  // Check 2: Session-based duplicate detection
  const sessionDuplicate = await checkSessionDuplicate(sessionData.sessionId, config.sessionTimeWindowMinutes)
  if (sessionDuplicate.isDuplicate) {
    return {
      ...sessionDuplicate,
      canMerge: config.allowMergeUpdates
    }
  }
  
  // Check 3: Fingerprint-based duplicate detection
  const fingerprintDuplicate = await checkFingerprintDuplicate(sessionData, config.sessionTimeWindowMinutes)
  if (fingerprintDuplicate.isDuplicate) {
    return {
      ...fingerprintDuplicate,
      canMerge: config.allowMergeUpdates
    }
  }
  
  return {
    isDuplicate: false,
    canMerge: false
  }
}

/**
 * Check for email-based duplicates within time window
 */
async function checkEmailDuplicate(
  email: string, 
  timeWindowHours: number
): Promise<DuplicateCheckResult> {
  const supabase = createServerClient()
  const timeThreshold = new Date(Date.now() - (timeWindowHours * 60 * 60 * 1000)).toISOString()
  
  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, email')
    .eq('email', email)
    .gte('created_at', timeThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('Error checking email duplicate:', error)
    return { isDuplicate: false, canMerge: false }
  }
  
  if (data && data.length > 0) {
    return {
      isDuplicate: true,
      duplicateType: 'email',
      existingLeadId: data[0].id,
      canMerge: true,
      reason: `Email ${email} already submitted within ${timeWindowHours} hours`
    }
  }
  
  return { isDuplicate: false, canMerge: false }
}

/**
 * Check for session-based duplicates within time window
 */
async function checkSessionDuplicate(
  sessionId: string, 
  timeWindowMinutes: number
): Promise<DuplicateCheckResult> {
  const supabase = createServerClient()
  const timeThreshold = new Date(Date.now() - (timeWindowMinutes * 60 * 1000)).toISOString()
  
  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, session_id')
    .eq('session_id', sessionId)
    .gte('created_at', timeThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('Error checking session duplicate:', error)
    return { isDuplicate: false, canMerge: false }
  }
  
  if (data && data.length > 0) {
    return {
      isDuplicate: true,
      duplicateType: 'session',
      existingLeadId: data[0].id,
      canMerge: true,
      reason: `Session ${sessionId} already submitted within ${timeWindowMinutes} minutes`
    }
  }
  
  return { isDuplicate: false, canMerge: false }
}

/**
 * Check for fingerprint-based duplicates using IP hash and user agent
 */
async function checkFingerprintDuplicate(
  sessionData: LeadSessionData, 
  timeWindowMinutes: number
): Promise<DuplicateCheckResult> {
  const supabase = createServerClient()
  const timeThreshold = new Date(Date.now() - (timeWindowMinutes * 60 * 1000)).toISOString()
  
  // Only check fingerprint if we have IP hash
  if (!sessionData.ipAddressHash || sessionData.ipAddressHash === 'unknown') {
    return { isDuplicate: false, canMerge: false }
  }
  
  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, ip_address_hash, user_agent')
    .eq('ip_address_hash', sessionData.ipAddressHash)
    .eq('user_agent', sessionData.userAgent)
    .gte('created_at', timeThreshold)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (error) {
    console.error('Error checking fingerprint duplicate:', error)
    return { isDuplicate: false, canMerge: false }
  }
  
  if (data && data.length > 0) {
    return {
      isDuplicate: true,
      duplicateType: 'fingerprint',
      existingLeadId: data[0].id,
      canMerge: true,
      reason: `Browser fingerprint already submitted within ${timeWindowMinutes} minutes`
    }
  }
  
  return { isDuplicate: false, canMerge: false }
}

/**
 * Merge new lead data with existing lead record
 * Updates fields that are empty or provide additional information
 * 
 * @param existingLeadId - ID of existing lead to update
 * @param newLeadData - New lead data to merge
 * @returns Updated lead record
 */
export async function mergeDuplicateLead(
  existingLeadId: string,
  newLeadData: {
    email: string;
    name: string;
    phone?: string;
    projectDescription: string;
    designId?: string;
    source: string;
    sessionData: LeadSessionData;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = createServerClient()
  
  try {
    // First, get the existing lead
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', existingLeadId)
      .single()
    
    if (fetchError || !existingLead) {
      return { success: false, error: 'Existing lead not found' }
    }
    
    // Prepare update data (only update empty fields or add additional info)
    const updates: any = {}
    
    // Update phone if not provided before
    if (!existingLead.phone && newLeadData.phone) {
      updates.phone = newLeadData.phone
    }
    
    // Append to project description if significantly different
    if (newLeadData.projectDescription !== existingLead.project_description) {
      updates.project_description = `${existingLead.project_description}\n\n[Additional submission]: ${newLeadData.projectDescription}`
    }
    
    // Update design if new one provided
    if (newLeadData.designId && newLeadData.designId !== existingLead.design_id) {
      updates.design_id = newLeadData.designId
    }
    
    // Update session data with latest information
    updates.session_id = newLeadData.sessionData.sessionId
    updates.user_agent = newLeadData.sessionData.userAgent
    updates.device_type = newLeadData.sessionData.deviceType
    updates.browser_type = newLeadData.sessionData.browserType
    
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return { success: true, data: existingLead }
    }
    
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', existingLeadId)
      .select()
      .single()
    
    if (updateError) {
      return { success: false, error: updateError.message }
    }
    
    return { success: true, data: updatedLead }
    
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Log duplicate detection event for monitoring and debugging
 */
export function logDuplicateDetection(
  duplicateResult: DuplicateCheckResult,
  email: string,
  sessionId: string,
  context: any
): void {
  const logData = {
    event: 'duplicate_detection',
    isDuplicate: duplicateResult.isDuplicate,
    duplicateType: duplicateResult.duplicateType,
    email,
    sessionId,
    reason: duplicateResult.reason,
    timestamp: new Date().toISOString(),
    ...context
  }
  
  if (duplicateResult.isDuplicate) {
    console.warn('Duplicate lead detection:', logData)
  } else {
    console.info('No duplicate detected:', logData)
  }
}
