// Rate Limiting Constants and Utility Functions
// Story 8.3: Multi-Layer Rate Limiting

/**
 * Rate limit tiers (hardcoded to prevent accidental misconfiguration)
 * These values ensure we stay within Google AI Studio free tier (1,500/day)
 */
export const RATE_LIMITS = {
  SESSION_LIMIT: 5,        // Layer 1: Free generations without IP tracking
  IP_DAILY_LIMIT: 15,      // Layer 2: Max per IP per day
  GLOBAL_DAILY_LIMIT: 1400 // Layer 3: Total across all users (100 token buffer)
} as const;

/**
 * Error codes for rate limiting
 */
export type RateLimitErrorCode =
  | 'SESSION_LIMIT_REACHED'
  | 'IP_LIMIT_REACHED'
  | 'GLOBAL_LIMIT_REACHED';

/**
 * Get current UTC date in YYYY-MM-DD format
 */
export function getUTCDateKey(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Calculate hours until UTC midnight
 */
export function getHoursUntilUTCMidnight(): number {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  const diff = midnight.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60));
}

/**
 * Get UTC midnight ISO timestamp (for retry-after)
 */
export function getUTCMidnightISO(): string {
  const now = new Date();
  const midnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0, 0, 0, 0
  ));

  return midnight.toISOString();
}

/**
 * Extract client IP address from request headers
 * Checks multiple headers in order of preference
 */
export function getClientIP(headers: Headers): string {
  const xForwardedFor = headers.get('x-forwarded-for');
  if (xForwardedFor) {
    // x-forwarded-for can be comma-separated, take first IP
    return xForwardedFor.split(',')[0].trim();
  }

  const xRealIP = headers.get('x-real-ip');
  if (xRealIP) {
    return xRealIP;
  }

  // Fallback for development/testing
  return 'unknown';
}
