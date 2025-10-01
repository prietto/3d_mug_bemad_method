import { createHash, randomBytes } from 'crypto';

/**
 * Generate a secure unsubscribe token for email preferences
 */
export function generateUnsubscribeToken(email: string): string {
  // Create a unique token based on email and random data
  const randomData = randomBytes(32).toString('hex');
  const data = `${email}:${randomData}:${Date.now()}`;

  return createHash('sha256').update(data).digest('hex');
}

/**
 * Validate an unsubscribe token
 * In production, this should verify against database
 */
export function validateUnsubscribeToken(token: string): boolean {
  // Token should be 64 characters (SHA256 hex)
  return token.length === 64 && /^[a-f0-9]+$/i.test(token);
}

/**
 * Create preference management URL
 */
export function getPreferenceUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email/preferences?token=${token}`;
}

/**
 * Create unsubscribe URL
 */
export function getUnsubscribeUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email/unsubscribe?token=${token}`;
}