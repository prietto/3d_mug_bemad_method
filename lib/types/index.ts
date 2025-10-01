// Core business entity interfaces for the Custom Ceramic Mug Landing Page
// Based on architecture.md data models specification

/**
 * Represents a potential customer who has engaged with the 3D designer
 * and provided contact information for follow-up.
 */
export interface Lead {
  /** Unique identifier (UUID) */
  id: string;
  /** Primary contact method (required) */
  email: string;
  /** Full name for personalization */
  name: string;
  /** Optional phone contact */
  phone?: string;
  /** User-provided project details */
  projectDescription: string;
  /** Reference to associated design */
  designId?: string;
  /** Lead capture timestamp (ISO string for PostgreSQL compatibility) */
  createdAt: string;
  /** Traffic source (analytics tracking) */
  source: string;
  /** Engagement level based on 3D interaction */
  engagementLevel: 'low' | 'medium' | 'high';
  /** Lead status for pipeline tracking */
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

/**
 * Represents a user's 3D mug customization including uploaded images,
 * colors, and text configuration.
 */
export interface Design {
  /** Unique identifier (UUID) */
  id: string;
  /** Selected base color */
  mugColor: string;
  /** User-uploaded image (stored as base64 for simplicity) */
  uploadedImageBase64?: string;
  /** CDN URL for optimized texture */
  uploadedImageUrl?: string;
  /** User-added text */
  customText?: string;
  /** Selected font family */
  textFont?: string;
  /** 3D positioning data (JSON string for PostgreSQL storage) */
  textPosition?: string;
  /** Text size scaling factor */
  textSize?: number;
  /** Text color (hex or color name) */
  textColor?: string;
  /** Design creation timestamp (ISO string for PostgreSQL compatibility) */
  createdAt: string;
  /** Last interaction timestamp (ISO string for PostgreSQL compatibility) */
  lastModified: string;
  /** Track if design is ready for lead capture */
  isComplete: boolean;
}

/**
 * Represents user interactions with the 3D designer for conversion
 * funnel analysis and optimization.
 */
export interface AnalyticsEvent {
  /** Unique identifier (UUID) */
  id: string;
  /** Browser session identifier */
  sessionId: string;
  /** Type of user interaction */
  eventType: 'page_view' | 'mug_rotate' | 'color_change' | 'image_upload' | 'text_add' | 'lead_capture';
  /** Event-specific data payload */
  eventData: Record<string, any>;
  /** When event occurred */
  timestamp: Date;
  /** Device/browser information */
  userAgent: string;
  /** Associated lead (if available) */
  leadId?: string;
}

/**
 * Session tracking data for enhanced lead analytics
 * New for Story 3.2: Lead Data Storage and Management
 */
export interface LeadSessionData {
  /** Unique session identifier for duplicate detection */
  sessionId: string;
  /** Browser and device information from User-Agent header */
  userAgent: string;
  /** Traffic source (referral URL or campaign) */
  referralSource?: string;
  /** Detected device type for marketing insights */
  deviceType: 'mobile' | 'desktop' | 'tablet';
  /** Browser family (Chrome, Safari, Firefox, etc.) */
  browserType: string;
  /** Hashed IP address for privacy-compliant duplicate detection */
  ipAddressHash?: string;
  /** Time spent on site before lead conversion (seconds) */
  engagementDuration: number;
}

/**
 * Enhanced lead interface with session tracking data
 * Extended for Story 3.2 requirements
 */
export interface LeadWithSession extends Lead {
  /** Session tracking data */
  sessionData: LeadSessionData;
}

/**
 * API request/response types for type-safe client-server communication
 */

// Lead API types
export interface CreateLeadRequest {
  email: string;
  name: string;
  phone?: string;
  projectDescription: string;
  designId?: string;
  source: string;
  engagementLevel: 'low' | 'medium' | 'high';
  /** Session tracking data (optional, will be auto-detected if not provided) */
  sessionData?: Partial<LeadSessionData>;
}

export interface CreateLeadResponse {
  success: boolean;
  data?: Lead;
  error?: string;
}

// Design API types
export interface CreateDesignRequest {
  mugColor: string;
  uploadedImageBase64?: string;
  customText?: string;
  textFont?: string;
  textPosition?: string;
}

export interface CreateDesignResponse {
  success: boolean;
  data?: Design;
  error?: string;
}

export interface GetDesignResponse {
  success: boolean;
  data?: Design;
  error?: string;
}

export interface UpdateDesignRequest extends Partial<CreateDesignRequest> {
  isComplete?: boolean;
}

export interface UpdateDesignResponse {
  success: boolean;
  data?: Design;
  error?: string;
}

// Upload API types
export interface UploadFileRequest {
  file: File;
  designId?: string;
}

export interface UploadFileResponse {
  url: string;
  fileId: string;
  fileName: string;
  size: number;
  type: string;
}

export interface DeleteFileResponse {
  success: boolean;
}

// Analytics API types
export interface CreateAnalyticsEventRequest {
  sessionId: string;
  eventType: AnalyticsEvent['eventType'];
  eventData: Record<string, any>;
  leadId?: string;
}

export interface CreateAnalyticsEventResponse {
  success: boolean;
  data?: AnalyticsEvent;
  error?: string;
}

/**
 * Enhanced analytics interfaces for Story 3.3: Google Analytics Integration
 */

export interface GA4Event {
  eventName: string;
  parameters: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
}

export interface EngagementMetrics {
  rotationCount: number;
  zoomEvents: number;
  timeSpent: number;
  customizationPath: string[];
}

export interface ConversionFunnelStep {
  step: 'page_view' | '3d_engagement' | 'customization' | 'lead_capture';
  timestamp: Date;
  metadata: Record<string, any>;
  previousStep?: string;
}
