export interface EmailTemplate {
  templateId: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
}

export interface EmailDelivery {
  id: string;
  leadId: string;
  emailType: 'business_notification' | 'user_confirmation';
  recipient: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  sentAt?: Date;
  failureReason?: string;
  retryCount: number;
  createdAt: Date;
}

export interface EmailPreference {
  id: string;
  email: string;
  unsubscribeToken: string;
  isSubscribed: boolean;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  email: string;
  name: string;
  phone?: string;
  projectDescription: string;
  designId?: string;
  createdAt: string;
  source: string;
  engagementLevel: 'low' | 'medium' | 'high';
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

export interface Design {
  id: string;
  mugColor: string;
  uploadedImageBase64?: string;
  customText?: string;
  textFont?: string;
  textPosition?: string;
  createdAt: string;
  lastModified: string;
  isComplete: boolean;
}