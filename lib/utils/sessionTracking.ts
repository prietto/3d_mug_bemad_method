/**
 * Session Tracking Utilities
 * Story 3.2: Lead Data Storage and Management
 * 
 * Provides utilities for capturing and processing user session data
 * for enhanced lead analytics and duplicate detection.
 */

import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { LeadSessionData } from '@/lib/types'

/**
 * Extracts comprehensive session tracking data from HTTP request
 * @param request - Next.js request object
 * @param sessionId - Optional session ID (will generate if not provided)
 * @returns Complete session tracking data
 */
export function extractSessionData(request: NextRequest, sessionId?: string): LeadSessionData {
  const userAgent = request.headers.get('user-agent') || 'Unknown'
  const referer = request.headers.get('referer')
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  // Extract IP address from various headers (Vercel/CDN compatibility)
  const clientIp = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  
  return {
    sessionId: sessionId || crypto.randomUUID(),
    userAgent,
    referralSource: extractReferralSource(referer, request.url),
    deviceType: detectDeviceType(userAgent),
    browserType: detectBrowserType(userAgent),
    ipAddressHash: hashIpAddress(clientIp),
    engagementDuration: 0 // Will be calculated client-side and passed in request
  }
}

/**
 * Detects device type from User-Agent string
 * @param userAgent - Browser User-Agent string
 * @returns Device type classification
 */
export function detectDeviceType(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase()
  
  // Check for tablet indicators first (more specific)
  if (ua.includes('ipad') || 
      (ua.includes('android') && !ua.includes('mobile')) ||
      ua.includes('tablet')) {
    return 'tablet'
  }
  
  // Check for mobile indicators
  if (ua.includes('mobile') || 
      ua.includes('iphone') || 
      ua.includes('android') ||
      ua.includes('blackberry') ||
      ua.includes('windows phone')) {
    return 'mobile'
  }
  
  // Default to desktop
  return 'desktop'
}

/**
 * Extracts browser family from User-Agent string
 * @param userAgent - Browser User-Agent string
 * @returns Browser family name
 */
export function detectBrowserType(userAgent: string): string {
  const ua = userAgent.toLowerCase()
  
  // Check for specific browsers (order matters for accuracy)
  if (ua.includes('edg/')) return 'Edge'
  if (ua.includes('chrome/') && !ua.includes('chromium/')) return 'Chrome'
  if (ua.includes('firefox/')) return 'Firefox'
  if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
  if (ua.includes('opera/') || ua.includes('opr/')) return 'Opera'
  if (ua.includes('chromium/')) return 'Chromium'
  if (ua.includes('ie/') || ua.includes('trident/')) return 'Internet Explorer'
  
  return 'Unknown'
}

/**
 * Extracts and cleans referral source information
 * @param referer - HTTP Referer header value
 * @param currentUrl - Current request URL
 * @returns Cleaned referral source or null
 */
export function extractReferralSource(referer: string | null, currentUrl: string): string | undefined {
  if (!referer) return undefined
  
  try {
    const refererUrl = new URL(referer)
    const currentDomain = new URL(currentUrl).hostname
    
    // Skip self-referrals (same domain navigation)
    if (refererUrl.hostname === currentDomain) {
      return undefined
    }
    
    // Return clean hostname for external referrals
    return refererUrl.hostname
  } catch (error) {
    // Invalid referer URL
    return undefined
  }
}

/**
 * Creates privacy-compliant hash of IP address for duplicate detection
 * @param ipAddress - Client IP address
 * @returns SHA-256 hash of IP address
 */
export function hashIpAddress(ipAddress: string): string {
  if (ipAddress === 'unknown') return 'unknown'
  
  // Add salt to prevent rainbow table attacks
  const salt = process.env.IP_HASH_SALT || 'default-salt-change-in-production'
  const saltedIp = `${ipAddress}:${salt}`
  
  return createHash('sha256').update(saltedIp).digest('hex')
}

/**
 * Validates session tracking data completeness
 * @param sessionData - Session data to validate
 * @returns Validation result with missing fields
 */
export function validateSessionData(sessionData: Partial<LeadSessionData>): {
  isValid: boolean;
  missingFields: string[];
} {
  const requiredFields: (keyof LeadSessionData)[] = [
    'sessionId',
    'userAgent',
    'deviceType',
    'browserType'
  ]
  
  const missingFields = requiredFields.filter(field => 
    !sessionData[field] || sessionData[field] === ''
  )
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  }
}

/**
 * Merges client-provided session data with server-extracted data
 * Server data takes precedence for security-sensitive fields
 * @param serverData - Server-extracted session data
 * @param clientData - Client-provided session data
 * @returns Merged session data
 */
export function mergeSessionData(
  serverData: LeadSessionData, 
  clientData: Partial<LeadSessionData> = {}
): LeadSessionData {
  return {
    ...serverData,
    // Allow client to override engagement duration and session ID
    sessionId: clientData.sessionId || serverData.sessionId,
    engagementDuration: clientData.engagementDuration || serverData.engagementDuration,
    // Server data takes precedence for security fields
    userAgent: serverData.userAgent,
    deviceType: serverData.deviceType,
    browserType: serverData.browserType,
    ipAddressHash: serverData.ipAddressHash,
    referralSource: serverData.referralSource
  }
}
