/**
 * Google Analytics 4 Integration Module
 * Handles client-side and server-side analytics tracking for the Custom Mug Landing Page
 */

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date | Record<string, any>,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

/**
 * 3D Analytics Integration
 * Session ID management for tracking
 */
let sessionId: string;
if (typeof window !== 'undefined') {
  sessionId = sessionStorage.getItem('analytics-session-id') || crypto.randomUUID();
  sessionStorage.setItem('analytics-session-id', sessionId);
}

export function getSessionId(): string {
  return sessionId || crypto.randomUUID();
}

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

/**
 * A/B Test Framework Foundation
 * Configuration structure for future experimentation (e.g., single-page vs multi-screen)
 */
export interface ABTestConfig {
  experimentId: string;
  variants: string[]; // e.g., ['single-page', 'multi-screen']
  assignmentLogic: 'random' | 'weighted';
  weights?: Record<string, number>; // e.g., { 'single-page': 0.5, 'multi-screen': 0.5 }
}

export interface ABTestAssignment {
  experimentId: string;
  variant: string;
  assignedAt: number;
  sessionId: string;
}

/**
 * Initialize Google Analytics 4 with consent management
 */
export function initializeGA4(): void {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  
  if (!gaId) {
    console.warn('Google Analytics ID not found in environment variables');
    return;
  }

  // Initialize dataLayer if it doesn't exist
  window.dataLayer = window.dataLayer || [];
  
  // gtag function for sending data to Google Analytics
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  // Initialize with timestamp
  window.gtag('js', new Date());

  // Configure Google Analytics with enhanced measurement
  window.gtag('config', gaId, {
    // Enhanced measurement settings
    enhanced_measurement: {
      scrolls: true,
      outbound_clicks: true,
      site_search: true,
      video_engagement: true,
      file_downloads: true,
    },
    // Performance and privacy settings
    send_page_view: true,
    anonymize_ip: true,
    allow_ad_features: false,
    cookie_expires: 63072000, // 2 years
    // Custom parameters for 3D mug customization tracking
    custom_map: {
      'custom_dimension_1': 'engagement_depth',
      'custom_dimension_2': 'customization_path',
      'custom_dimension_3': 'device_type',
      'custom_dimension_4': 'ab_test_variant',
    },
  });

  console.log('Google Analytics 4 initialized successfully');
}

/**
 * Track page views with enhanced metadata
 */
export function trackPageView(
  page: string,
  title?: string,
  metadata: Record<string, any> = {}
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_title: title || document.title,
    page_location: window.location.href,
    page_path: page,
    ...metadata,
  });
}

/**
 * Track custom events with GA4 parameters
 */
export function trackEvent(
  eventName: string,
  parameters: Record<string, any> = {},
  options: {
    sessionId?: string;
    userId?: string;
    engagementTime?: number;
  } = {}
): void {
  if (typeof window === 'undefined' || !window.gtag) {
    return;
  }

  // Prepare event parameters with GA4 best practices
  const eventParams = {
    ...parameters,
    // Session tracking
    ...(options.sessionId && { session_id: options.sessionId }),
    // User identification
    ...(options.userId && { user_id: options.userId }),
    // Engagement tracking
    ...(options.engagementTime && { engagement_time_msec: options.engagementTime }),
    // Timestamp for correlation
    event_time: Date.now(),
  };

  window.gtag('event', eventName, eventParams);
}

/**
 * Track 3D engagement events
 */
export function track3DEngagement(
  action: 'rotate' | 'zoom' | 'reset' | 'customize',
  details: Record<string, any> = {},
  sessionId: string
): void {
  trackEvent('3d_engagement', {
    engagement_type: action,
    ...details,
  }, { sessionId });
}

/**
 * Track customization events with path tracking
 */
export function trackCustomization(
  type: 'color' | 'image' | 'text',
  value: string | number,
  customizationPath: string[],
  sessionId: string
): void {
  trackEvent('customization', {
    customization_type: type,
    customization_value: value,
    customization_path: customizationPath.join(' -> '),
    customization_step: customizationPath.length,
  }, { sessionId });
}

/**
 * Track conversion funnel progression
 */
export function trackConversionFunnel(
  step: ConversionFunnelStep['step'],
  metadata: Record<string, any> = {},
  sessionId: string
): void {
  trackEvent('conversion_funnel', {
    funnel_step: step,
    funnel_stage: getFunnelStage(step),
    ...metadata,
  }, { sessionId });
}

/**
 * Track form visible on load for single-page UX baseline measurement
 */
export function trackFormVisibleOnLoad(
  metadata: Record<string, any> = {},
  sessionId: string
): void {
  trackEvent('form_visible_on_load', {
    event_category: 'lead_capture',
    event_label: 'form_visible_on_page_load',
    ...metadata,
  }, { sessionId });
}

/**
 * Track time to first form interaction for engagement speed measurement
 */
export function trackTimeToFirstFormInteraction(
  timeMs: number,
  interactionType: 'focus' | 'input' | 'click',
  fieldName: string,
  sessionId: string
): void {
  trackEvent('time_to_first_form_interaction', {
    event_category: 'lead_capture',
    event_label: 'first_form_interaction',
    interaction_type: interactionType,
    field_name: fieldName,
    time_to_interaction_ms: timeMs,
    time_to_interaction_seconds: Math.round(timeMs / 1000),
  }, { sessionId });
}

/**
 * A/B Test Framework Functions
 * Foundation for future experiments (e.g., single-page vs multi-screen comparison)
 */

/**
 * Assign user to A/B test variant
 * Stores assignment in sessionStorage for consistency across page navigation
 *
 * @example
 * const assignment = assignABTestVariant({
 *   experimentId: 'ux_comparison_2024',
 *   variants: ['single-page', 'multi-screen'],
 *   assignmentLogic: 'random'
 * })
 */
export function assignABTestVariant(config: ABTestConfig): ABTestAssignment {
  const sessionId = getSessionId();
  const storageKey = `ab_test_assignment_${config.experimentId}`;

  // Check if assignment already exists for this experiment
  if (typeof window !== 'undefined') {
    const existingAssignment = sessionStorage.getItem(storageKey);
    if (existingAssignment) {
      try {
        return JSON.parse(existingAssignment) as ABTestAssignment;
      } catch (e) {
        console.warn('Failed to parse existing A/B test assignment:', e);
      }
    }
  }

  // Assign new variant based on logic
  let variant: string;

  if (config.assignmentLogic === 'random') {
    // Random assignment with equal distribution
    const randomIndex = Math.floor(Math.random() * config.variants.length);
    variant = config.variants[randomIndex];
  } else if (config.assignmentLogic === 'weighted' && config.weights) {
    // Weighted assignment
    const random = Math.random();
    let cumulativeWeight = 0;
    variant = config.variants[0]; // Default to first variant

    for (const [variantName, weight] of Object.entries(config.weights)) {
      cumulativeWeight += weight;
      if (random <= cumulativeWeight) {
        variant = variantName;
        break;
      }
    }
  } else {
    // Fallback to first variant
    variant = config.variants[0];
  }

  const assignment: ABTestAssignment = {
    experimentId: config.experimentId,
    variant,
    assignedAt: Date.now(),
    sessionId,
  };

  // Store assignment in sessionStorage for consistency
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(storageKey, JSON.stringify(assignment));
  }

  // Track assignment event
  trackABTestAssignment(assignment);

  return assignment;
}

/**
 * Track A/B test variant assignment in Google Analytics
 * Stores variant as custom dimension for segmentation in reports
 */
export function trackABTestAssignment(assignment: ABTestAssignment): void {
  // Track as event
  trackEvent('ab_test_assigned', {
    event_category: 'ab_testing',
    event_label: assignment.experimentId,
    experiment_id: assignment.experimentId,
    variant: assignment.variant,
    assigned_at: assignment.assignedAt,
  }, { sessionId: assignment.sessionId });

  // Set custom dimension for all subsequent events in this session
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('set', {
      ab_test_variant: assignment.variant,
      experiment_id: assignment.experimentId,
    });
  }

  debugGA4Event('ab_test_assigned', {
    experimentId: assignment.experimentId,
    variant: assignment.variant,
  });
}

/**
 * Get current A/B test assignment for an experiment
 * Returns null if no assignment exists
 */
export function getABTestAssignment(experimentId: string): ABTestAssignment | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const storageKey = `ab_test_assignment_${experimentId}`;
  const existingAssignment = sessionStorage.getItem(storageKey);

  if (existingAssignment) {
    try {
      return JSON.parse(existingAssignment) as ABTestAssignment;
    } catch (e) {
      console.warn('Failed to parse A/B test assignment:', e);
      return null;
    }
  }

  return null;
}

/**
 * Performance Validation Functions
 * Track page load performance and Web Vitals for <3 second page load requirement
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
}

/**
 * Track page load performance with both 3D and form components visible
 * Validates <3 second page load requirement and fires alert if threshold exceeded
 */
export function trackPageLoadPerformance(sessionId: string): void {
  if (typeof window === 'undefined' || !window.performance || !window.performance.timing) {
    return;
  }

  const timing = window.performance.timing;
  const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
  const domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
  const timeToInteractive = timing.domInteractive - timing.navigationStart;

  const THRESHOLD_MS = 3000;

  // Track page load performance event
  trackEvent('page_load_performance', {
    event_category: 'performance',
    event_label: 'page_load_with_both_components',
    page_load_time_ms: pageLoadTime,
    dom_content_loaded_ms: domContentLoadedTime,
    time_to_interactive_ms: timeToInteractive,
    exceeds_threshold: pageLoadTime > THRESHOLD_MS,
  }, { sessionId });

  // Fire performance alert if threshold exceeded
  if (pageLoadTime > THRESHOLD_MS) {
    trackEvent('performance_threshold_exceeded', {
      event_category: 'performance',
      event_label: 'page_load_slow',
      value: pageLoadTime,
      page_load_time: pageLoadTime,
      threshold: THRESHOLD_MS,
      exceeded_by_ms: pageLoadTime - THRESHOLD_MS,
    }, { sessionId });

    console.warn(
      `Performance threshold exceeded: ${pageLoadTime}ms (threshold: ${THRESHOLD_MS}ms)`
    );
  }

  debugGA4Event('page_load_performance', { pageLoadTime, timeToInteractive });
}

/**
 * Track Core Web Vitals (LCP, INP, CLS) using web-vitals library v5
 * Integrates with Google Analytics for performance monitoring
 * Note: FID has been replaced by INP (Interaction to Next Paint) in web-vitals v5
 */
export function trackWebVitals(sessionId: string): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Dynamic import to avoid SSR issues
  import('web-vitals').then(({ onCLS, onINP, onLCP }) => {
    // Largest Contentful Paint (LCP) - Target: <2.5s
    onLCP((metric) => {
      trackEvent('web_vitals_lcp', {
        event_category: 'web_vitals',
        event_label: 'largest_contentful_paint',
        value: Math.round(metric.value),
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_id: metric.id,
        rating: metric.rating, // 'good', 'needs-improvement', 'poor'
      }, { sessionId });

      debugGA4Event('web_vitals_lcp', { value: metric.value, rating: metric.rating });
    });

    // Interaction to Next Paint (INP) - Target: <200ms (replaces FID in web-vitals v5)
    onINP((metric) => {
      trackEvent('web_vitals_inp', {
        event_category: 'web_vitals',
        event_label: 'interaction_to_next_paint',
        value: Math.round(metric.value),
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_id: metric.id,
        rating: metric.rating,
      }, { sessionId });

      debugGA4Event('web_vitals_inp', { value: metric.value, rating: metric.rating });
    });

    // Cumulative Layout Shift (CLS) - Target: <0.1
    onCLS((metric) => {
      trackEvent('web_vitals_cls', {
        event_category: 'web_vitals',
        event_label: 'cumulative_layout_shift',
        value: Math.round(metric.value * 1000) / 1000, // Round to 3 decimals
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_id: metric.id,
        rating: metric.rating,
      }, { sessionId });

      debugGA4Event('web_vitals_cls', { value: metric.value, rating: metric.rating });
    });
  }).catch((error) => {
    console.error('Failed to load web-vitals library:', error);
  });
}

/**
 * Track lazy loading performance for React.lazy components
 */
export function trackComponentLoadTime(
  componentName: string,
  loadTimeMs: number,
  sessionId: string
): void {
  trackEvent('component_load_time', {
    event_category: 'performance',
    event_label: 'lazy_loading',
    component_name: componentName,
    load_time_ms: loadTimeMs,
    load_time_seconds: Math.round(loadTimeMs / 1000),
  }, { sessionId });

  debugGA4Event('component_load_time', { componentName, loadTimeMs });
}

/**
 * Track lead conversion with e-commerce data
 */
export function trackLeadConversion(
  leadData: {
    leadId: string;
    engagementLevel: string;
    designId?: string;
    source: string;
  },
  sessionId: string
): void {
  // Track as conversion event
  trackEvent('conversion', {
    transaction_id: leadData.leadId,
    value: getLeadValue(leadData.engagementLevel),
    currency: 'USD',
    item_category: 'lead_capture',
    engagement_level: leadData.engagementLevel,
    design_id: leadData.designId,
    traffic_source: leadData.source,
  }, { sessionId });

  // Track as purchase event for e-commerce reporting
  trackEvent('purchase', {
    transaction_id: leadData.leadId,
    value: getLeadValue(leadData.engagementLevel),
    currency: 'USD',
    items: [{
      item_id: leadData.designId || 'no_design',
      item_name: 'Custom Mug Lead',
      item_category: 'lead_capture',
      quantity: 1,
      price: getLeadValue(leadData.engagementLevel),
    }],
  }, { sessionId });
}

/**
 * Calculate engagement depth based on user actions
 */
export function calculateEngagementDepth(metrics: EngagementMetrics): 'low' | 'medium' | 'high' {
  const { rotationCount, zoomEvents, timeSpent, customizationPath } = metrics;
  
  // Calculate engagement score
  let score = 0;
  
  // Time spent weight (30%)
  if (timeSpent > 120) score += 30; // 2+ minutes
  else if (timeSpent > 60) score += 20; // 1+ minute
  else if (timeSpent > 30) score += 10; // 30+ seconds
  
  // Interaction weight (40%)
  const totalInteractions = rotationCount + zoomEvents;
  if (totalInteractions > 10) score += 40;
  else if (totalInteractions > 5) score += 25;
  else if (totalInteractions > 2) score += 15;
  
  // Customization weight (30%)
  if (customizationPath.length >= 3) score += 30; // Multiple customizations
  else if (customizationPath.length >= 2) score += 20; // Some customization
  else if (customizationPath.length >= 1) score += 10; // Basic customization
  
  // Determine engagement level
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Get lead value for e-commerce tracking
 */
function getLeadValue(engagementLevel: string): number {
  const valueMap = {
    'high': 50.00,   // High-engagement leads
    'medium': 25.00, // Medium-engagement leads
    'low': 10.00,    // Low-engagement leads
  };
  
  return valueMap[engagementLevel as keyof typeof valueMap] || 10.00;
}

/**
 * Get funnel stage number for progression tracking
 */
function getFunnelStage(step: ConversionFunnelStep['step']): number {
  const stageMap = {
    'page_view': 1,
    '3d_engagement': 2,
    'customization': 3,
    'lead_capture': 4,
  };
  
  return stageMap[step];
}

/**
 * Validate Google Analytics configuration
 */
export function validateGA4Config(): boolean {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  
  if (!gaId) {
    console.error('Missing NEXT_PUBLIC_GOOGLE_ANALYTICS_ID environment variable');
    return false;
  }
  
  if (!gaId.startsWith('G-')) {
    console.error('Invalid Google Analytics ID format. Expected G-XXXXXXXXXX');
    return false;
  }
  
  return true;
}

/**
 * Debug function for development environment
 */
export function debugGA4Event(eventName: string, parameters: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 GA4 Event:', eventName, parameters);
  }
}

/**
 * 3D Analytics Integration Class
 */
export interface AnalyticsIntegration {
  sessionId: string;
  trackRotation: (angle: number, duration: number) => void;
  trackZoom: (scale: number, direction: 'in' | 'out') => void;
  trackColorChange: (color: string, customizationPath: string[]) => void;
  trackImageUpload: (imageSize: number, imageType: string, customizationPath: string[]) => void;
  trackTextCustomization: (textLength: number, customizationPath: string[]) => void;
  trackEngagementDepth: () => void;
  trackPerformanceIssue: (fps: number, memoryUsage: number) => void;
  trackConversionFunnel: (step: ConversionFunnelStep['step'], metadata: Record<string, any>) => void;
  trackLeadConversion: (leadData: { leadId: string; engagementLevel: string; designId?: string; source: string }) => void;
  startSession: () => void;
  endSession: () => void;
}

class AnalyticsIntegrationImpl implements AnalyticsIntegration {
  sessionId: string;
  private rotationCount: number = 0;
  private zoomEvents: number = 0;
  private sessionStartTime: number = Date.now();
  private customizationPath: string[] = [];
  private lastActivityTime: number = Date.now();
  
  // Event batching and queue management
  private eventQueue: any[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds

  constructor() {
    this.sessionId = getSessionId();
    this.startSession();
    this.startBatchProcessor();
    
    // Handle page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
        this.endSession();
      });

      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.trackEngagementDepth();
          this.flushEvents();
        }
      });
    }
  }

  startSession(): void {
    this.sessionStartTime = Date.now();
    
    trackConversionFunnel('page_view', {
      session_start: true,
      timestamp: this.sessionStartTime,
    }, this.sessionId);

    debugGA4Event('session_start', { sessionId: this.sessionId });
  }

  endSession(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // Final engagement tracking
    this.trackEngagementDepth();
    
    trackEvent('session_end', {
      session_duration: sessionDuration,
      total_interactions: this.rotationCount + this.zoomEvents,
      customization_types: this.customizationPath.length,
    }, { sessionId: this.sessionId });

    debugGA4Event('session_end', { 
      sessionId: this.sessionId, 
      duration: sessionDuration,
      interactions: this.rotationCount + this.zoomEvents
    });
  }

  trackRotation(angle: number, duration: number): void {
    this.rotationCount++;
    this.lastActivityTime = Date.now();

    // Track first 3D engagement
    if (this.rotationCount === 1) {
      trackConversionFunnel('3d_engagement', {
        first_interaction: 'rotate',
        angle: Math.abs(angle),
      }, this.sessionId);
    }

    // Client-side GA4 tracking
    track3DEngagement('rotate', {
      rotation_angle: Math.abs(angle),
      rotation_duration: duration,
      rotation_speed: Math.abs(angle) / duration,
      total_rotations: this.rotationCount,
    }, this.sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId: this.sessionId,
      eventType: 'mug_rotate',
      eventData: {
        angle: Math.abs(angle),
        duration,
        speed: Math.abs(angle) / duration,
        total_rotations: this.rotationCount,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    debugGA4Event('3d_rotate', { 
      angle: Math.abs(angle), 
      duration, 
      count: this.rotationCount 
    });
  }

  trackZoom(scale: number, direction: 'in' | 'out'): void {
    this.zoomEvents++;
    this.lastActivityTime = Date.now();

    // Track first 3D engagement if this is the first interaction
    if (this.rotationCount === 0 && this.zoomEvents === 1) {
      trackConversionFunnel('3d_engagement', {
        first_interaction: 'zoom',
        zoom_direction: direction,
      }, this.sessionId);
    }

    // Client-side GA4 tracking
    track3DEngagement('zoom', {
      zoom_scale: scale,
      zoom_direction: direction,
      total_zooms: this.zoomEvents,
    }, this.sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId: this.sessionId,
      eventType: 'mug_rotate', // Using existing event type
      eventData: {
        interaction_type: 'zoom',
        scale,
        direction,
        total_zooms: this.zoomEvents,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    });

    debugGA4Event('3d_zoom', { 
      scale, 
      direction, 
      count: this.zoomEvents 
    });
  }

  trackColorChange(color: string, customizationPath: string[]): void {
    this.lastActivityTime = Date.now();
    
    // Add to customization path if not already there
    if (!this.customizationPath.includes('color')) {
      this.customizationPath.push('color');
    }

    // Track first customization
    if (this.customizationPath.length === 1) {
      trackConversionFunnel('customization', {
        first_customization: 'color',
        color_value: color,
      }, this.sessionId);
    }

    trackCustomization('color', color, customizationPath, this.sessionId);

    debugGA4Event('color_change', { 
      color, 
      customizationPath: this.customizationPath 
    });
  }

  trackImageUpload(imageSize: number, imageType: string, customizationPath: string[]): void {
    this.lastActivityTime = Date.now();
    
    // Add to customization path if not already there
    if (!this.customizationPath.includes('image')) {
      this.customizationPath.push('image');
    }

    // Track first customization
    if (this.customizationPath.length === 1) {
      trackConversionFunnel('customization', {
        first_customization: 'image',
        image_size: imageSize,
        image_type: imageType,
      }, this.sessionId);
    }

    trackCustomization('image', `${imageType}_${Math.round(imageSize / 1024)}kb`, customizationPath, this.sessionId);

    debugGA4Event('image_upload', { 
      imageSize, 
      imageType, 
      customizationPath: this.customizationPath 
    });
  }

  trackTextCustomization(textLength: number, customizationPath: string[]): void {
    this.lastActivityTime = Date.now();
    
    // Add to customization path if not already there
    if (!this.customizationPath.includes('text')) {
      this.customizationPath.push('text');
    }

    // Track first customization
    if (this.customizationPath.length === 1) {
      trackConversionFunnel('customization', {
        first_customization: 'text',
        text_length: textLength,
      }, this.sessionId);
    }

    trackCustomization('text', textLength.toString(), customizationPath, this.sessionId);

    debugGA4Event('text_customization', { 
      textLength, 
      customizationPath: this.customizationPath 
    });
  }

  trackEngagementDepth(): void {
    const timeSpent = (Date.now() - this.sessionStartTime) / 1000; // Convert to seconds
    const metrics = {
      rotationCount: this.rotationCount,
      zoomEvents: this.zoomEvents,
      timeSpent,
      customizationPath: this.customizationPath,
    };

    const engagementLevel = calculateEngagementDepth(metrics);
    
    trackEvent('engagement_depth', {
      engagement_level: engagementLevel,
      rotation_count: this.rotationCount,
      zoom_events: this.zoomEvents,
      time_spent: timeSpent,
      customization_types: this.customizationPath.length,
      customization_path: this.customizationPath.join(' -> '),
    }, { sessionId: this.sessionId });

    debugGA4Event('engagement_depth', { 
      level: engagementLevel, 
      metrics 
    });
  }

  trackPerformanceIssue(fps: number, memoryUsage: number): void {
    if (fps < 30) {
      trackEvent('performance_issue', {
        fps,
        memory_usage: memoryUsage,
        issue_type: fps < 15 ? 'severe_lag' : 'moderate_lag',
        session_duration: Date.now() - this.sessionStartTime,
      }, { sessionId: this.sessionId });

      debugGA4Event('performance_issue', { fps, memoryUsage });
    }
  }

  trackConversionFunnel(step: ConversionFunnelStep['step'], metadata: Record<string, any>): void {
    // Client-side GA4 tracking
    trackConversionFunnel(step, metadata, this.sessionId);
    
    // Server-side funnel tracking via API
    fetch('/api/analytics/funnel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        step,
        metadata,
      }),
    }).catch(error => {
      console.error('Failed to track conversion funnel server-side:', error);
    });
    
    debugGA4Event('conversion_funnel', { 
      step, 
      metadata, 
      sessionId: this.sessionId 
    });
  }

  trackLeadConversion(leadData: { leadId: string; engagementLevel: string; designId?: string; source: string }): void {
    // Client-side GA4 e-commerce tracking
    trackLeadConversion(leadData, this.sessionId);
    
    // Server-side conversion tracking via funnel API
    this.trackConversionFunnel('lead_capture', {
      leadId: leadData.leadId,
      engagementLevel: leadData.engagementLevel,
      designId: leadData.designId,
      source: leadData.source,
      conversionValue: this.getLeadValue(leadData.engagementLevel),
      customizationCount: this.customizationPath.length,
      sessionDuration: Date.now() - this.sessionStartTime,
    });
    
    debugGA4Event('lead_conversion', { 
      leadData, 
      sessionId: this.sessionId 
    });
  }

  private getLeadValue(engagementLevel: string): number {
    const valueMap = {
      'high': 50.00,   // High-engagement leads
      'medium': 25.00, // Medium-engagement leads
      'low': 10.00,    // Low-engagement leads
    };
    
    return valueMap[engagementLevel as keyof typeof valueMap] || 10.00;
  }

  private queueEvent(event: any): void {
    this.eventQueue.push(event);
    
    // Trigger immediate flush if batch is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  private startBatchProcessor(): void {
    if (typeof window === 'undefined') return;
    
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.BATCH_TIMEOUT);
  }

  private flushEvents(): void {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    // Send events to analytics API for database storage
    fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events: eventsToFlush,
      }),
    }).catch(error => {
      console.error('Failed to flush analytics events:', error);
      
      // Re-queue events for retry (with exponential backoff)
      this.eventQueue.unshift(...eventsToFlush);
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 100) {
        this.eventQueue = this.eventQueue.slice(-50); // Keep only latest 50 events
      }
    });

    debugGA4Event('events_flushed', { count: eventsToFlush.length });
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Flush remaining events
    this.flushEvents();
    
    // Clear sessions and queues
    this.eventQueue = [];
  }
}

// Singleton instance
let analyticsIntegration: AnalyticsIntegration | null = null;

export function getAnalyticsIntegration(): AnalyticsIntegration {
  if (!analyticsIntegration) {
    analyticsIntegration = new AnalyticsIntegrationImpl();
  }
  return analyticsIntegration as AnalyticsIntegration;
}
