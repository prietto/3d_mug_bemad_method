import type { Lead, Design } from '@/types/email';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Generate HTML email template for business owner notification
 */
export function generateBusinessNotificationEmail(
  lead: Lead,
  design?: Design
): { subject: string; html: string; text: string } {
  const subject = `🎯 New Lead Captured: ${lead.name} - ${lead.engagementLevel.toUpperCase()}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #4CAF50;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #4CAF50;
      font-size: 24px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }
    .badge-high { background-color: #ff5252; color: white; }
    .badge-medium { background-color: #ffa726; color: white; }
    .badge-low { background-color: #66bb6a; color: white; }
    .info-section {
      margin: 20px 0;
      padding: 15px;
      background-color: #f9f9f9;
      border-left: 4px solid #4CAF50;
      border-radius: 4px;
    }
    .info-section h3 {
      margin-top: 0;
      color: #4CAF50;
    }
    .info-row {
      margin: 8px 0;
    }
    .info-label {
      font-weight: bold;
      color: #666;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #4CAF50;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 New Lead Captured!</h1>
      <p><span class="badge badge-${lead.engagementLevel}">${lead.engagementLevel} Engagement</span></p>
    </div>

    <div class="info-section">
      <h3>Lead Information</h3>
      <div class="info-row">
        <span class="info-label">Name:</span> ${lead.name}
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span> <a href="mailto:${lead.email}">${lead.email}</a>
      </div>
      ${lead.phone ? `<div class="info-row"><span class="info-label">Phone:</span> <a href="tel:${lead.phone}">${lead.phone}</a></div>` : ''}
      <div class="info-row">
        <span class="info-label">Source:</span> ${lead.source}
      </div>
      <div class="info-row">
        <span class="info-label">Captured:</span> ${new Date(lead.createdAt).toLocaleString()}
      </div>
    </div>

    <div class="info-section">
      <h3>Project Description</h3>
      <p>${lead.projectDescription}</p>
    </div>

    ${design ? `
    <div class="info-section">
      <h3>Design Details</h3>
      <div class="info-row">
        <span class="info-label">Mug Color:</span> ${design.mugColor}
      </div>
      ${design.customText ? `<div class="info-row"><span class="info-label">Custom Text:</span> "${design.customText}"</div>` : ''}
      ${design.uploadedImageBase64 ? '<div class="info-row"><span class="info-label">Uploaded Image:</span> Yes ✓</div>' : ''}
    </div>
    ` : ''}

    <center>
      <a href="${APP_URL}/admin/leads/${lead.id}" class="button">View Lead Details</a>
    </center>

    <div class="footer">
      <p>This is an automated notification from Custom Mug Company</p>
      <p>Lead ID: ${lead.id}</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
New Lead Captured: ${lead.name} - ${lead.engagementLevel.toUpperCase()} Engagement

Lead Information:
- Name: ${lead.name}
- Email: ${lead.email}
${lead.phone ? `- Phone: ${lead.phone}` : ''}
- Source: ${lead.source}
- Captured: ${new Date(lead.createdAt).toLocaleString()}

Project Description:
${lead.projectDescription}

${design ? `
Design Details:
- Mug Color: ${design.mugColor}
${design.customText ? `- Custom Text: "${design.customText}"` : ''}
${design.uploadedImageBase64 ? '- Uploaded Image: Yes' : ''}
` : ''}

View full details: ${APP_URL}/admin/leads/${lead.id}

Lead ID: ${lead.id}
`;

  return { subject, html, text };
}

/**
 * Generate HTML email template for user confirmation
 */
export function generateUserConfirmationEmail(
  lead: Lead,
  design?: Design,
  unsubscribeToken?: string
): { subject: string; html: string; text: string } {
  const subject = 'Your Custom Mug Design - Next Steps';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      margin-bottom: 30px;
      border-bottom: 2px solid #4CAF50;
    }
    .header h1 {
      margin: 0;
      color: #4CAF50;
      font-size: 24px;
    }
    .greeting {
      font-size: 18px;
      margin: 20px 0;
    }
    .section {
      margin: 20px 0;
    }
    .section h3 {
      color: #4CAF50;
      margin-bottom: 10px;
    }
    .design-preview {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .timeline {
      background-color: #e8f5e9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .timeline ol {
      margin: 10px 0;
      padding-left: 20px;
    }
    .contact-info {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #999;
      font-size: 12px;
    }
    .footer a {
      color: #999;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Thank You for Your Interest!</h1>
    </div>

    <div class="greeting">
      <p>Hi ${lead.name},</p>
      <p>Thank you for designing your custom mug with us! We've received your request and our team is excited to help bring your vision to life.</p>
    </div>

    ${design ? `
    <div class="design-preview">
      <h3>Your Design</h3>
      <p><strong>Mug Color:</strong> ${design.mugColor}</p>
      ${design.customText ? `<p><strong>Custom Text:</strong> "${design.customText}"</p>` : ''}
      ${design.uploadedImageBase64 ? '<p><strong>Custom Image:</strong> Uploaded ✓</p>' : ''}
    </div>
    ` : ''}

    <div class="timeline">
      <h3>What Happens Next?</h3>
      <ol>
        <li><strong>Review (24-48 hours):</strong> Our team will review your design and project requirements</li>
        <li><strong>Quote:</strong> We'll email you a detailed quote including pricing and production timeline</li>
        <li><strong>Approval:</strong> Once you approve, we'll begin production</li>
        <li><strong>Delivery:</strong> Your custom mugs will be delivered to your doorstep!</li>
      </ol>
    </div>

    <div class="section">
      <h3>Have Questions?</h3>
      <div class="contact-info">
        <p><strong>Email:</strong> <a href="mailto:${process.env.BUSINESS_EMAIL || 'support@example.com'}">${process.env.BUSINESS_EMAIL || 'support@example.com'}</a></p>
        <p><strong>Business Hours:</strong> Monday-Friday, 9AM-5PM EST</p>
        <p>We typically respond within 24 hours during business days.</p>
      </div>
    </div>

    <div class="footer">
      <p>Custom Mug Company - Quality Custom Ceramics</p>
      ${unsubscribeToken ? `<p><a href="${APP_URL}/api/email/unsubscribe?token=${unsubscribeToken}">Unsubscribe from future emails</a></p>` : ''}
      <p><a href="${APP_URL}/privacy">Privacy Policy</a></p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Thank You for Your Interest!

Hi ${lead.name},

Thank you for designing your custom mug with us! We've received your request and our team is excited to help bring your vision to life.

${design ? `
Your Design:
- Mug Color: ${design.mugColor}
${design.customText ? `- Custom Text: "${design.customText}"` : ''}
${design.uploadedImageBase64 ? '- Custom Image: Uploaded' : ''}
` : ''}

What Happens Next?
1. Review (24-48 hours): Our team will review your design and project requirements
2. Quote: We'll email you a detailed quote including pricing and production timeline
3. Approval: Once you approve, we'll begin production
4. Delivery: Your custom mugs will be delivered to your doorstep!

Have Questions?
Email: ${process.env.BUSINESS_EMAIL || 'support@example.com'}
Business Hours: Monday-Friday, 9AM-5PM EST
We typically respond within 24 hours during business days.

---
Custom Mug Company - Quality Custom Ceramics
${unsubscribeToken ? `Unsubscribe: ${APP_URL}/api/email/unsubscribe?token=${unsubscribeToken}` : ''}
Privacy Policy: ${APP_URL}/privacy
`;

  return { subject, html, text };
}