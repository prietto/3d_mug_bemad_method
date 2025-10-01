/**
 * Tests for Google Analytics 4 Integration
 * Tests client-side analytics tracking functionality
 */

import { vi, beforeEach, afterEach } from 'vitest';
import {
  initializeGA4,
  trackPageView,
  trackEvent,
  track3DEngagement,
  trackCustomization,
  trackConversionFunnel,
  trackLeadConversion,
  calculateEngagementDepth,
  validateGA4Config,
  debugGA4Event,
} from './analytics';

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-TEST123456',
  NODE_ENV: 'test',
}));

vi.mock('process', () => ({
  env: mockEnv,
}));

// Mock window.gtag and dataLayer
const mockGtag = vi.fn();
const mockDataLayer: any[] = [];

Object.defineProperty(global, 'window', {
  value: {
    gtag: mockGtag,
    dataLayer: mockDataLayer,
    location: {
      href: 'https://test.com',
      pathname: '/test',
    },
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    title: 'Test Page',
  },
  writable: true,
});

describe('Google Analytics 4 Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataLayer.length = 0;
    mockEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = 'G-TEST123456';
    mockEnv.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeGA4', () => {
    it('should initialize GA4 with proper configuration', () => {
      initializeGA4();
      
      expect(mockGtag).toHaveBeenCalledWith('js', expect.any(Date));
      expect(mockGtag).toHaveBeenCalledWith('config', 'G-TEST123456', {
        enhanced_measurement: {
          scrolls: true,
          outbound_clicks: true,
          site_search: true,
          video_engagement: true,
          file_downloads: true,
        },
        send_page_view: true,
        anonymize_ip: true,
        allow_ad_features: false,
        cookie_expires: 63072000,
        custom_map: {
          'custom_dimension_1': 'engagement_depth',
          'custom_dimension_2': 'customization_path',
          'custom_dimension_3': 'device_type',
        },
      });
    });

    it('should handle missing GA ID gracefully', () => {
      mockEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = '';
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      initializeGA4();
      
      expect(consoleSpy).toHaveBeenCalledWith('Google Analytics ID not found in environment variables');
      expect(mockGtag).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('trackPageView', () => {
    it('should track page view with correct parameters', () => {
      trackPageView('/test-page', 'Test Page Title', { custom_param: 'value' });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Test Page Title',
        page_location: 'https://test.com',
        page_path: '/test-page',
        custom_param: 'value',
      });
    });

    it('should use document title when title is not provided', () => {
      trackPageView('/test-page');
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        page_title: 'Test Page',
        page_location: 'https://test.com',
        page_path: '/test-page',
      });
    });

    it('should handle server-side rendering gracefully', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(() => trackPageView('/test')).not.toThrow();
      
      global.window = originalWindow;
    });
  });

  describe('trackEvent', () => {
    it('should track custom events with parameters', () => {
      const sessionId = 'test-session-123';
      const userId = 'test-user-456';
      
      trackEvent('custom_event', { param1: 'value1' }, { sessionId, userId, engagementTime: 5000 });
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'custom_event', {
        param1: 'value1',
        session_id: sessionId,
        user_id: userId,
        engagement_time_msec: 5000,
        event_time: expect.any(Number),
      });
    });

    it('should handle missing gtag gracefully', () => {
      global.window.gtag = undefined as any;
      
      expect(() => trackEvent('test_event')).not.toThrow();
    });
  });

  describe('track3DEngagement', () => {
    it('should track 3D engagement events', () => {
      const sessionId = 'test-session';
      
      track3DEngagement('rotate', { angle: 45, duration: 1000 }, sessionId);
      
      expect(mockGtag).toHaveBeenCalledWith('event', '3d_engagement', {
        engagement_type: 'rotate',
        angle: 45,
        duration: 1000,
        session_id: sessionId,
        event_time: expect.any(Number),
      });
    });
  });

  describe('trackCustomization', () => {
    it('should track customization events with path', () => {
      const customizationPath = ['color', 'image', 'text'];
      const sessionId = 'test-session';
      
      trackCustomization('color', 'blue', customizationPath, sessionId);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'customization', {
        customization_type: 'color',
        customization_value: 'blue',
        customization_path: 'color -> image -> text',
        customization_step: 3,
        session_id: sessionId,
        event_time: expect.any(Number),
      });
    });
  });

  describe('trackConversionFunnel', () => {
    it('should track conversion funnel progression', () => {
      const sessionId = 'test-session';
      
      trackConversionFunnel('3d_engagement', { interaction_type: 'rotate' }, sessionId);
      
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion_funnel', {
        funnel_step: '3d_engagement',
        funnel_stage: 2,
        interaction_type: 'rotate',
        session_id: sessionId,
        event_time: expect.any(Number),
      });
    });
  });

  describe('trackLeadConversion', () => {
    it('should track lead conversion with e-commerce data', () => {
      const leadData = {
        leadId: 'lead-123',
        engagementLevel: 'high',
        designId: 'design-456',
        source: 'organic',
      };
      const sessionId = 'test-session';
      
      trackLeadConversion(leadData, sessionId);
      
      // Should track conversion event
      expect(mockGtag).toHaveBeenCalledWith('event', 'conversion', {
        transaction_id: 'lead-123',
        value: 50.00,
        currency: 'USD',
        item_category: 'lead_capture',
        engagement_level: 'high',
        design_id: 'design-456',
        traffic_source: 'organic',
        session_id: sessionId,
        event_time: expect.any(Number),
      });
      
      // Should track purchase event
      expect(mockGtag).toHaveBeenCalledWith('event', 'purchase', {
        transaction_id: 'lead-123',
        value: 50.00,
        currency: 'USD',
        items: [{
          item_id: 'design-456',
          item_name: 'Custom Mug Lead',
          item_category: 'lead_capture',
          quantity: 1,
          price: 50.00,
        }],
        session_id: sessionId,
        event_time: expect.any(Number),
      });
    });
  });

  describe('calculateEngagementDepth', () => {
    it('should calculate high engagement correctly', () => {
      const metrics = {
        rotationCount: 15,
        zoomEvents: 8,
        timeSpent: 180, // 3 minutes
        customizationPath: ['color', 'image', 'text'],
      };
      
      const result = calculateEngagementDepth(metrics);
      expect(result).toBe('high');
    });

    it('should calculate medium engagement correctly', () => {
      const metrics = {
        rotationCount: 6,
        zoomEvents: 3,
        timeSpent: 90, // 1.5 minutes
        customizationPath: ['color', 'text'],
      };
      
      const result = calculateEngagementDepth(metrics);
      expect(result).toBe('medium');
    });

    it('should calculate low engagement correctly', () => {
      const metrics = {
        rotationCount: 2,
        zoomEvents: 1,
        timeSpent: 20, // 20 seconds
        customizationPath: ['color'],
      };
      
      const result = calculateEngagementDepth(metrics);
      expect(result).toBe('low');
    });
  });

  describe('validateGA4Config', () => {
    it('should validate correct GA4 configuration', () => {
      const result = validateGA4Config();
      expect(result).toBe(true);
    });

    it('should return false for missing GA ID', () => {
      mockEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = '';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = validateGA4Config();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Missing NEXT_PUBLIC_GOOGLE_ANALYTICS_ID environment variable');
      
      consoleSpy.mockRestore();
    });

    it('should return false for invalid GA ID format', () => {
      mockEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = 'INVALID-ID';
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = validateGA4Config();
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Invalid Google Analytics ID format. Expected G-XXXXXXXXXX');
      
      consoleSpy.mockRestore();
    });
  });

  describe('debugGA4Event', () => {
    it('should log events in development mode', () => {
      mockEnv.NODE_ENV = 'development';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      debugGA4Event('test_event', { param: 'value' });
      
      expect(consoleSpy).toHaveBeenCalledWith('📊 GA4 Event:', 'test_event', { param: 'value' });
      
      consoleSpy.mockRestore();
    });

    it('should not log events in production mode', () => {
      mockEnv.NODE_ENV = 'production';
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      debugGA4Event('test_event', { param: 'value' });
      
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
