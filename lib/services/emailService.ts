import sgMail from '@sendgrid/mail';

// Email service configuration
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'noreply@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Custom Mug Company';
const isDevelopment = process.env.NODE_ENV === 'development';

// Initialize SendGrid
if (SENDGRID_API_KEY && !isDevelopment) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via SendGrid
 * In development mode, logs email instead of sending
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Development mode: Log email instead of sending
  if (isDevelopment || !SENDGRID_API_KEY) {
    console.log('📧 [DEV MODE] Email would be sent:', {
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: options.to,
      subject: options.subject,
      htmlLength: options.html.length,
      textLength: options.text?.length || 0,
    });
    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  try {
    const msg = {
      to: options.to,
      from: {
        email: EMAIL_FROM,
        name: EMAIL_FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text || '',
    };

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (error: any) {
    console.error('❌ Email send error:', error);

    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Validate email service configuration
 */
export function validateEmailConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!EMAIL_FROM) {
    errors.push('EMAIL_FROM environment variable is not set');
  }

  if (!SENDGRID_API_KEY && !isDevelopment) {
    errors.push('SENDGRID_API_KEY environment variable is not set (required for production)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}