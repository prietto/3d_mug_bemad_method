/**
 * Analytics Engine for 3D Interaction Tracking
 * Handles event processing, batching, and correlation with business intelligence
 */

import { AnalyticsEvent, ConversionFunnelStep } from '@/lib/types';
import { 
  trackEvent, 
  track3DEngagement, 
  trackCustomization,
  trackConversionFunnel,
  debugGA4Event,
  calculateEngagementDepth,
  EngagementMetrics
} from './analytics';

export interface AnalyticsEngine {
  // Core tracking methods
  trackRotation: (angle: number, duration: number, sessionId: string) => void;
  trackZoom: (scale: number, direction: 'in' | 'out', sessionId: string) => void;
  trackColorChange: (color: string, customizationPath: string[], sessionId: string) => void;
  trackImageUpload: (imageSize: number, imageType: string, customizationPath: string[], sessionId: string) => void;
  trackTextCustomization: (textLength: number, customizationPath: string[], sessionId: string) => void;
  trackEngagementDepth: (metrics: EngagementMetrics, sessionId: string) => void;
  trackUserJourney: (step: ConversionFunnelStep['step'], metadata: Record<string, any>, sessionId: string) => void;
  
  // Batch processing
  flushEvents: () => Promise<void>;
  
  // Session management
  startSession: (sessionId: string) => void;
  endSession: (sessionId: string) => void;
  
  // Performance monitoring
  trackPerformanceMetric: (fps: number, memoryUsage: number, sessionId: string) => void;
}

interface EventBatch {
  events: AnalyticsEvent[];
  sessionId: string;
  timestamp: number;
}

interface SessionData {
  sessionId: string;
  startTime: number;
  rotationCount: number;
  zoomEvents: number;
  customizationPath: string[];
  engagementStartTime: number;
  lastActivityTime: number;
}

class AnalyticsEngineImpl implements AnalyticsEngine {
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private sessions: Map<string, SessionData> = new Map();
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_TIMEOUT = 5000; // 5 seconds
  private readonly ACTIVITY_TIMEOUT = 30000; // 30 seconds

  constructor() {
    // Start batch processing
    this.startBatchProcessor();
    
    // Handle page unload to flush remaining events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushEvents();
      });
    }
  }

  startSession(sessionId: string): void {
    const sessionData: SessionData = {
      sessionId,
      startTime: Date.now(),
      rotationCount: 0,
      zoomEvents: 0,
      customizationPath: [],
      engagementStartTime: Date.now(),
      lastActivityTime: Date.now(),
    };
    
    this.sessions.set(sessionId, sessionData);
    
    // Track session start
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'page_view',
      eventData: {
        event_category: '3d_session',
        event_action: 'session_start',
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('session_start', { sessionId, timestamp: Date.now() });
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      const sessionDuration = Date.now() - session.startTime;
      const metrics: EngagementMetrics = {
        rotationCount: session.rotationCount,
        zoomEvents: session.zoomEvents,
        timeSpent: sessionDuration / 1000, // Convert to seconds
        customizationPath: session.customizationPath,
      };

      // Track final engagement depth
      this.trackEngagementDepth(metrics, sessionId);
      
      // Queue session end event
      this.queueEvent({
        id: crypto.randomUUID(),
        sessionId,
        eventType: 'page_view',
        eventData: {
          event_category: '3d_session',
          event_action: 'session_end',
          session_duration: sessionDuration,
          engagement_metrics: metrics,
          timestamp: Date.now(),
        },
        timestamp: new Date(),
        userAgent: navigator.userAgent,
      });

      this.sessions.delete(sessionId);
      debugGA4Event('session_end', { sessionId, sessionDuration, metrics });
    }
  }

  trackRotation(angle: number, duration: number, sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.rotationCount++;
      session.lastActivityTime = Date.now();
    }

    // Track in Google Analytics
    track3DEngagement('rotate', {
      rotation_angle: Math.abs(angle),
      rotation_duration: duration,
      rotation_speed: Math.abs(angle) / duration,
    }, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'mug_rotate',
      eventData: {
        angle: Math.abs(angle),
        duration,
        speed: Math.abs(angle) / duration,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('mug_rotate', { angle, duration, sessionId });
  }

  trackZoom(scale: number, direction: 'in' | 'out', sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      session.zoomEvents++;
      session.lastActivityTime = Date.now();
    }

    // Track in Google Analytics
    track3DEngagement('zoom', {
      zoom_scale: scale,
      zoom_direction: direction,
    }, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'mug_rotate', // Using existing event type for zoom
      eventData: {
        interaction_type: 'zoom',
        scale,
        direction,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('mug_zoom', { scale, direction, sessionId });
  }

  trackColorChange(color: string, customizationPath: string[], sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      if (!session.customizationPath.includes('color')) {
        session.customizationPath.push('color');
      }
      session.lastActivityTime = Date.now();
    }

    // Track in Google Analytics
    trackCustomization('color', color, customizationPath, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'color_change',
      eventData: {
        color,
        customization_path: customizationPath,
        customization_step: customizationPath.length,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('color_change', { color, customizationPath, sessionId });
  }

  trackImageUpload(imageSize: number, imageType: string, customizationPath: string[], sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      if (!session.customizationPath.includes('image')) {
        session.customizationPath.push('image');
      }
      session.lastActivityTime = Date.now();
    }

    // Track in Google Analytics
    trackCustomization('image', `${imageType}_${Math.round(imageSize / 1024)}kb`, customizationPath, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'image_upload',
      eventData: {
        image_size: imageSize,
        image_type: imageType,
        customization_path: customizationPath,
        customization_step: customizationPath.length,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('image_upload', { imageSize, imageType, customizationPath, sessionId });
  }

  trackTextCustomization(textLength: number, customizationPath: string[], sessionId: string): void {
    const session = this.sessions.get(sessionId);
    
    if (session) {
      if (!session.customizationPath.includes('text')) {
        session.customizationPath.push('text');
      }
      session.lastActivityTime = Date.now();
    }

    // Track in Google Analytics
    trackCustomization('text', textLength.toString(), customizationPath, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: 'text_add',
      eventData: {
        text_length: textLength,
        customization_path: customizationPath,
        customization_step: customizationPath.length,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('text_customization', { textLength, customizationPath, sessionId });
  }

  trackEngagementDepth(metrics: EngagementMetrics, sessionId: string): void {
    const engagementLevel = calculateEngagementDepth(metrics);
    
    // Track in Google Analytics
    trackEvent('engagement_depth', {
      engagement_level: engagementLevel,
      rotation_count: metrics.rotationCount,
      zoom_events: metrics.zoomEvents,
      time_spent: metrics.timeSpent,
      customization_types: metrics.customizationPath.length,
      customization_path: metrics.customizationPath.join(' -> '),
    }, { sessionId });

    debugGA4Event('engagement_depth', { engagementLevel, metrics, sessionId });
  }

  trackUserJourney(step: ConversionFunnelStep['step'], metadata: Record<string, any>, sessionId: string): void {
    // Track in Google Analytics
    trackConversionFunnel(step, metadata, sessionId);

    // Queue for database storage
    this.queueEvent({
      id: crypto.randomUUID(),
      sessionId,
      eventType: step === 'page_view' ? 'page_view' : 'mug_rotate', // Map to existing types
      eventData: {
        funnel_step: step,
        funnel_metadata: metadata,
        timestamp: Date.now(),
      },
      timestamp: new Date(),
      userAgent: navigator.userAgent,
    });

    debugGA4Event('user_journey', { step, metadata, sessionId });
  }

  trackPerformanceMetric(fps: number, memoryUsage: number, sessionId: string): void {
    // Track performance issues in GA4
    if (fps < 30) {
      trackEvent('performance_issue', {
        fps,
        memory_usage: memoryUsage,
        issue_type: fps < 15 ? 'severe_lag' : 'moderate_lag',
      }, { sessionId });

      debugGA4Event('performance_issue', { fps, memoryUsage, sessionId });
    }

    // Periodically track performance metrics (every 10 seconds)
    const now = Date.now();
    const session = this.sessions.get(sessionId);
    
    if (session && now - session.lastActivityTime > 10000) {
      trackEvent('performance_metric', {
        fps,
        memory_usage: memoryUsage,
        session_duration: now - session.startTime,
      }, { sessionId });
      
      session.lastActivityTime = now;
    }
  }

  private queueEvent(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    
    // Trigger immediate flush if batch is full
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.BATCH_TIMEOUT);
  }

  async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send events to analytics API
      const response = await fetch('/api/analytics/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events: eventsToFlush,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analytics API error: ${response.status}`);
      }

      debugGA4Event('events_flushed', { count: eventsToFlush.length });
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      
      // Re-queue events for retry (with exponential backoff)
      this.eventQueue.unshift(...eventsToFlush);
      
      // Limit queue size to prevent memory issues
      if (this.eventQueue.length > 100) {
        this.eventQueue = this.eventQueue.slice(-50); // Keep only latest 50 events
      }
    }
  }

  // Cleanup method
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Flush remaining events
    this.flushEvents();
    
    // Clear sessions
    this.sessions.clear();
  }
}

// Singleton instance
let analyticsEngineInstance: AnalyticsEngine | null = null;

export function getAnalyticsEngine(): AnalyticsEngine {
  if (!analyticsEngineInstance) {
    analyticsEngineInstance = new AnalyticsEngineImpl();
  }
  return analyticsEngineInstance;
}

// React hook for easy access in components
export function useAnalytics() {
  return getAnalyticsEngine();
}
