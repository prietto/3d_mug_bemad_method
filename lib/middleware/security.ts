// Rate limiting middleware for API routes
// Implements a simple in-memory rate limiter with sliding window

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (for production, consider Redis)
const rateLimitMap = new Map<string, RateLimitEntry>();

// Default configuration
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute

export interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
  skipSuccessfulRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  headers: Record<string, string>;
}

/**
 * Rate limiter implementation with sliding window
 * @param identifier - Unique identifier for the client (IP, user ID, etc.)
 * @param config - Rate limiting configuration
 * @returns Rate limit result with headers
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig = {}
): RateLimitResult {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
  } = config;

  const now = Date.now();
  const key = identifier;
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupExpiredEntries(now);
  }

  let entry = rateLimitMap.get(key);
  
  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(key, entry);
  } else {
    // Increment existing entry
    entry.count++;
  }

  const remainingRequests = Math.max(0, maxRequests - entry.count);
  const allowed = entry.count <= maxRequests;

  return {
    allowed,
    remainingRequests,
    resetTime: entry.resetTime,
    headers: {
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': remainingRequests.toString(),
      'X-RateLimit-Reset': new Date(entry.resetTime).toISOString(),
    },
  };
}

/**
 * Get client identifier from request (IP address fallback)
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from various headers (for deployment behind proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';
  
  return ip.trim();
}

/**
 * Security headers to add to all API responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'",
  };
}

/**
 * CORS headers for API routes
 */
export function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://*.vercel.app',
  ];
  
  const isAllowed = origin && (
    allowedOrigins.includes(origin) ||
    allowedOrigins.some(allowed => 
      allowed.includes('*') && origin.endsWith(allowed.replace('*', ''))
    )
  );

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'http://localhost:3000',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Enhanced error logging with structured data
 */
export interface LogContext {
  method: string;
  url: string;
  userAgent?: string;
  timestamp: string;
  requestId: string;
  clientIp: string;
}

export function logError(
  error: Error | unknown,
  context: LogContext,
  additionalData?: Record<string, any>
) {
  let errorMessage: string
  let stack: string | undefined
  let errorDetails: any = undefined

  if (error instanceof Error) {
    errorMessage = error.message
    stack = error.stack
    // Include any additional error properties
    errorDetails = {
      name: error.name,
      ...Object.getOwnPropertyNames(error).reduce((acc, key) => {
        if (key !== 'message' && key !== 'stack' && key !== 'name') {
          acc[key] = (error as any)[key]
        }
        return acc
      }, {} as Record<string, any>)
    }
  } else if (typeof error === 'object' && error !== null) {
    // Handle non-Error objects
    errorMessage = JSON.stringify(error)
    errorDetails = error
  } else {
    errorMessage = String(error)
  }

  const logData = {
    level: 'error',
    message: errorMessage,
    stack,
    errorDetails,
    context,
    additionalData,
    timestamp: new Date().toISOString(),
  };

  console.error('API Error:', JSON.stringify(logData, null, 2));
}

export function logInfo(
  message: string,
  context: Partial<LogContext>,
  additionalData?: Record<string, any>
) {
  const logData = {
    level: 'info',
    message,
    context,
    additionalData,
    timestamp: new Date().toISOString(),
  };
  
  console.log('API Info:', JSON.stringify(logData, null, 2));
}

/**
 * Request timing middleware
 */
export function createRequestTimer() {
  const startTime = Date.now();
  
  return {
    end: () => Date.now() - startTime,
    getHeaders: () => ({
      'X-Response-Time': `${Date.now() - startTime}ms`,
    }),
  };
}

/**
 * Clean up expired rate limit entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number) {
  const keysToDelete: string[] = [];
  
  rateLimitMap.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitMap.delete(key));
}
