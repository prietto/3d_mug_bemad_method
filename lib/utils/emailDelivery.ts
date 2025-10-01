import { sendEmail, type EmailOptions, type EmailResult } from '../services/emailService';

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff in ms
const MAX_RETRIES = 5;

export interface DeliveryResult {
  success: boolean;
  messageId?: string;
  error?: string;
  retryCount: number;
}

/**
 * Send email with retry logic and exponential backoff
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  retryCount = 0
): Promise<DeliveryResult> {
  try {
    const result = await sendEmail(options);

    if (result.success) {
      return {
        success: true,
        messageId: result.messageId,
        retryCount,
      };
    }

    // Retry if we haven't exceeded max attempts
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`⏳ Email delivery failed. Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

      await sleep(delay);
      return sendEmailWithRetry(options, retryCount + 1);
    }

    // Max retries exceeded
    return {
      success: false,
      error: result.error || 'Max retries exceeded',
      retryCount,
    };
  } catch (error: any) {
    console.error('❌ Email delivery error:', error);

    // Retry on exception
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      console.log(`⏳ Retrying after exception in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);

      await sleep(delay);
      return sendEmailWithRetry(options, retryCount + 1);
    }

    return {
      success: false,
      error: error.message || 'Email delivery failed',
      retryCount,
    };
  }
}

/**
 * Send email asynchronously without blocking the caller
 * Logs errors but doesn't throw
 */
export async function sendEmailAsync(options: EmailOptions): Promise<void> {
  try {
    const result = await sendEmailWithRetry(options);

    if (result.success) {
      console.log(`✅ Email sent successfully to ${options.to} (${result.retryCount} retries)`);
    } else {
      console.error(`❌ Failed to send email to ${options.to}: ${result.error}`);
      // TODO: Store failed email in database for manual retry
    }
  } catch (error) {
    console.error('❌ Async email delivery error:', error);
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log email delivery failure for monitoring
 * In production, this should store to database
 */
export function logEmailFailure(
  recipient: string,
  subject: string,
  error: string,
  retryCount: number
): void {
  console.error('📧 Email Delivery Failure:', {
    recipient,
    subject,
    error,
    retryCount,
    timestamp: new Date().toISOString(),
  });

  // TODO: Store in database for monitoring dashboard
  // TODO: Alert system admin if critical failure
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}