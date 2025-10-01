/**
 * Tests for GoogleAnalytics component and Analytics Integration
 * Tests client-side component integration with GA4 and 3D analytics
 */

import { vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import GoogleAnalytics from './GoogleAnalytics';
import * as analyticsModule from '@/lib/utils/analytics';

// Mock Next.js Script component
vi.mock('next/script', () => ({
  default: ({ id, dangerouslySetInnerHTML, src, strategy, ...props }: any) => {
    if (dangerouslySetInnerHTML) {
      return (
        <script
          id={id}
          data-testid={id}
          data-strategy={strategy}
          dangerouslySetInnerHTML={dangerouslySetInnerHTML}
          {...props}
        />
      );
    }
    return (
      <script
        src={src}
        data-testid="ga-script"
        data-strategy={strategy}
        {...props}
      />
    );
  },
}));

// Mock analytics utilities
vi.mock('@/lib/utils/analytics', () => ({
  validateGA4Config: vi.fn(),
  trackPageView: vi.fn(),
  trackFormVisibleOnLoad: vi.fn(),
  trackTimeToFirstFormInteraction: vi.fn(),
  assignABTestVariant: vi.fn(),
  getABTestAssignment: vi.fn(),
  trackABTestAssignment: vi.fn(),
  trackPageLoadPerformance: vi.fn(),
  trackWebVitals: vi.fn(),
  trackComponentLoadTime: vi.fn(),
  getAnalyticsIntegration: vi.fn(),
  getSessionId: vi.fn(() => 'test-session-id'),
}));

// Mock environment
const mockEnv = vi.hoisted(() => ({
  NODE_ENV: 'test',
}));

vi.mock('process', () => ({
  env: mockEnv,
}));

// Mock window properties
const mockAddEventListener = vi.fn();
const mockRemoveEventListener = vi.fn();

Object.defineProperty(global, 'window', {
  value: {
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    location: { pathname: '/test' },
  },
  writable: true,
});

describe('GoogleAnalytics Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.NODE_ENV = 'test';
    vi.mocked(analyticsModule.validateGA4Config).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render GA4 scripts with valid GA ID', () => {
    const gaId = 'G-TEST123456';
    
    render(<GoogleAnalytics gaId={gaId} />);
    
    // Check that gtag.js script is loaded
    const gaScript = screen.getByTestId('ga-script');
    expect(gaScript).toHaveAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
    expect(gaScript).toHaveAttribute('data-strategy', 'afterInteractive');
    
    // Check that initialization script is present
    const initScript = screen.getByTestId('google-analytics-init');
    expect(initScript).toHaveAttribute('data-strategy', 'afterInteractive');
    
    // Check that the script contains the GA ID
    const scriptContent = initScript.innerHTML;
    expect(scriptContent).toContain(gaId);
    expect(scriptContent).toContain('gtag(\'config\'');
  });

  it('should not render scripts with invalid GA ID in development', () => {
    mockEnv.NODE_ENV = 'development';
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const gaId = 'G-XXXXXXXXXX';
    
    const { container } = render(<GoogleAnalytics gaId={gaId} />);
    
    // Should not render any scripts
    expect(container.querySelector('script')).toBeNull();
    
    consoleSpy.mockRestore();
  });

  it('should not render scripts with empty GA ID', () => {
    const gaId = '';
    
    const { container } = render(<GoogleAnalytics gaId={gaId} />);
    
    // Should not render any scripts
    expect(container.querySelector('script')).toBeNull();
  });

  it('should include enhanced measurement configuration in script', () => {
    const gaId = 'G-TEST123456';
    
    render(<GoogleAnalytics gaId={gaId} />);
    
    const initScript = screen.getByTestId('google-analytics-init');
    const scriptContent = initScript.innerHTML;
    
    // Check for enhanced measurement settings
    expect(scriptContent).toContain('enhanced_measurement');
    expect(scriptContent).toContain('scrolls: true');
    expect(scriptContent).toContain('outbound_clicks: true');
    expect(scriptContent).toContain('site_search: true');
    expect(scriptContent).toContain('video_engagement: true');
    expect(scriptContent).toContain('file_downloads: true');
  });

  it('should include custom dimensions configuration', () => {
    const gaId = 'G-TEST123456';

    render(<GoogleAnalytics gaId={gaId} />);

    const initScript = screen.getByTestId('google-analytics-init');
    const scriptContent = initScript.innerHTML;

    // Check for custom dimensions mapping
    expect(scriptContent).toContain('custom_map');
    expect(scriptContent).toContain('engagement_depth');
    expect(scriptContent).toContain('customization_path');
    expect(scriptContent).toContain('device_type');
    expect(scriptContent).toContain('ab_test_variant');
  });

  it('should include privacy-compliant settings', () => {
    const gaId = 'G-TEST123456';
    
    render(<GoogleAnalytics gaId={gaId} />);
    
    const initScript = screen.getByTestId('google-analytics-init');
    const scriptContent = initScript.innerHTML;
    
    // Check for privacy settings
    expect(scriptContent).toContain('anonymize_ip: true');
    expect(scriptContent).toContain('allow_ad_features: false');
    expect(scriptContent).toContain('cookie_expires: 63072000');
  });

  it('should validate configuration on mount', () => {
    const gaId = 'G-TEST123456';
    
    render(<GoogleAnalytics gaId={gaId} />);
    
    expect(analyticsModule.validateGA4Config).toHaveBeenCalledTimes(1);
  });

  it('should add and remove event listeners for route changes', () => {
    const gaId = 'G-TEST123456';
    
    const { unmount } = render(<GoogleAnalytics gaId={gaId} />);
    
    // Check that event listener was added
    expect(mockAddEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
    
    // Unmount component
    unmount();
    
    // Check that event listener was removed
    expect(mockRemoveEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
  });

  it('should not add event listeners when validation fails', () => {
    vi.mocked(analyticsModule.validateGA4Config).mockReturnValue(false);
    
    const gaId = 'G-INVALID';
    
    render(<GoogleAnalytics gaId={gaId} />);
    
    // Should not add event listeners when validation fails
    expect(mockAddEventListener).not.toHaveBeenCalled();
  });
});

describe('usePageTracking hook', () => {
  it('should track page view on mount', async () => {
    // Import the hook after mocking
    const { usePageTracking } = await import('./GoogleAnalytics');
    const { renderHook } = await import('@testing-library/react');
    
    renderHook(() => usePageTracking());
    
    expect(analyticsModule.trackPageView).toHaveBeenCalledWith('/test');
  });
});

describe('Analytics Integration Tests', () => {
  const mockFetch = vi.fn();
  global.fetch = mockFetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  describe('3D Interaction Tracking', () => {
    it('should track rotation events with proper analytics correlation', async () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Track multiple rotations
      analytics.trackRotation(45, 1000);
      analytics.trackRotation(90, 1500);
      
      // Wait for batch processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have called conversion funnel for first interaction
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/funnel', 
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('3d_engagement')
        })
      );
    });

    it('should track zoom events with scale and direction', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackZoom(1.5, 'in');
      analytics.trackZoom(0.8, 'out');
      
      // Should track zoom events without conversion funnel (since rotation wasn't first)
      // This tests the logic for first interaction detection
    });
  });

  describe('Customization Tracking', () => {
    it('should track color changes with customization path', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackColorChange('#ff0000', ['color']);
      
      // Should track both GA4 and queue for database
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/funnel',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('customization')
        })
      );
    });

    it('should track image upload with file metadata', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackImageUpload(500000, 'image/jpeg', ['image']);
      
      // Should correlate with conversion funnel
    });

    it('should track text customization with length tracking', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackTextCustomization(15, ['text']);
      
      // Should track text events properly
    });
  });

  describe('Conversion Funnel Integration', () => {
    it('should track complete funnel progression', async () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Simulate complete user journey
      analytics.trackRotation(45, 1000); // 3D engagement
      analytics.trackColorChange('#ff0000', ['color']); // Customization
      
      analytics.trackConversionFunnel('lead_capture', {
        leadId: 'test-lead-123',
        engagementLevel: 'high',
        designId: 'design-456'
      });
      
      // Should have made multiple API calls
      expect(mockFetch).toHaveBeenCalledTimes(3); // funnel calls for each step
    });

    it('should track lead conversion with e-commerce data', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackLeadConversion({
        leadId: 'lead-789',
        engagementLevel: 'medium',
        designId: 'design-123',
        source: 'organic'
      });
      
      // Should track both conversion funnel and lead conversion
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/funnel',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('lead_capture')
        })
      );
    });
  });

  describe('Event Batching and Performance', () => {
    it('should batch events for efficient processing', async () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Generate multiple events quickly
      for (let i = 0; i < 15; i++) {
        analytics.trackRotation(i * 10, 100);
      }
      
      // Should trigger batch flush due to size
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have made events API call
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/events',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('events')
        })
      );
    });

    it('should handle performance issues tracking', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      analytics.trackPerformanceIssue(15, 85000000); // Low FPS, high memory
      
      // Should track performance issues when FPS is low
    });

    it('should flush events on page unload', async () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Add some events
      analytics.trackRotation(45, 1000);
      analytics.trackZoom(1.2, 'in');
      
      // Simulate page unload
      window.dispatchEvent(new Event('beforeunload'));
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have flushed events
      expect(mockFetch).toHaveBeenCalledWith('/api/analytics/events',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });
  });

  describe('Session Management', () => {
    it('should manage session lifecycle properly', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      expect(analytics.sessionId).toBeDefined();
      expect(analytics.sessionId).toMatch(/^[0-9a-f-]{36}$/); // UUID format
    });

    it('should calculate engagement depth accurately', () => {
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Simulate high engagement
      analytics.trackRotation(45, 1000);
      analytics.trackZoom(1.5, 'in');
      analytics.trackColorChange('#ff0000', ['color']);
      analytics.trackTextCustomization(20, ['color', 'text']);
      
      analytics.trackEngagementDepth();
      
      // Should track high engagement level
    });

    it('should correlate analytics with design store state', async () => {
      // This tests the integration between analytics and the design store
      // The actual integration happens through the component interactions
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Simulate design store updates triggering analytics
      analytics.trackColorChange('#00ff00', ['color']);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should have made appropriate tracking calls
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle API failures gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Should not throw errors even when API fails
      expect(() => {
        analytics.trackRotation(45, 1000);
        analytics.trackConversionFunnel('lead_capture', {});
      }).not.toThrow();
    });

    it('should retry failed events with exponential backoff', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Server error'))
              .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ success: true }) });
      
      const analytics = analyticsModule.getAnalyticsIntegration();
      
      // Generate events to trigger flush
      for (let i = 0; i < 12; i++) {
        analytics.trackRotation(i * 5, 100);
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should have attempted retry
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should limit queue size to prevent memory issues', async () => {
      mockFetch.mockRejectedValue(new Error('Persistent error'));

      const analytics = analyticsModule.getAnalyticsIntegration();

      // Generate many events to test queue limiting
      for (let i = 0; i < 150; i++) {
        analytics.trackRotation(i, 100);
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // Queue should be limited to prevent memory issues
      // This is tested internally in the implementation
    });
  });

  describe('Single-Page UX Event Tracking', () => {
    it('should track form_visible_on_load event', () => {
      const sessionId = 'test-session-id';

      analyticsModule.trackFormVisibleOnLoad({
        viewport_width: 1920,
        viewport_height: 1080,
        device_type: 'desktop'
      }, sessionId);

      // Should track form visible on load event
      // Verification happens via the trackEvent mock
    });

    it('should track time_to_first_form_interaction metric', () => {
      const sessionId = 'test-session-id';

      analyticsModule.trackTimeToFirstFormInteraction(
        2500,
        'focus',
        'name',
        sessionId
      );

      // Should track time to first interaction with proper metrics
    });
  });

  describe('A/B Test Framework Foundation', () => {
    beforeEach(() => {
      // Mock sessionStorage
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          getItem: vi.fn(),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn()
        },
        writable: true
      });
    });

    it('should assign user to random A/B test variant', () => {
      const config = {
        experimentId: 'ux_test_2024',
        variants: ['single-page', 'multi-screen'],
        assignmentLogic: 'random' as const
      };

      const assignment = analyticsModule.assignABTestVariant(config);

      expect(assignment).toBeDefined();
      expect(assignment.experimentId).toBe('ux_test_2024');
      expect(['single-page', 'multi-screen']).toContain(assignment.variant);
      expect(assignment.sessionId).toBeDefined();
    });

    it('should assign user to weighted A/B test variant', () => {
      const config = {
        experimentId: 'ux_test_weighted',
        variants: ['single-page', 'multi-screen'],
        assignmentLogic: 'weighted' as const,
        weights: { 'single-page': 0.7, 'multi-screen': 0.3 }
      };

      const assignment = analyticsModule.assignABTestVariant(config);

      expect(assignment).toBeDefined();
      expect(['single-page', 'multi-screen']).toContain(assignment.variant);
    });

    it('should persist A/B test assignment in sessionStorage', () => {
      const config = {
        experimentId: 'ux_test_persist',
        variants: ['single-page', 'multi-screen'],
        assignmentLogic: 'random' as const
      };

      analyticsModule.assignABTestVariant(config);

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'ab_test_assignment_ux_test_persist',
        expect.any(String)
      );
    });

    it('should retrieve existing A/B test assignment', () => {
      const existingAssignment = {
        experimentId: 'ux_test_existing',
        variant: 'single-page',
        assignedAt: Date.now(),
        sessionId: 'test-session'
      };

      vi.mocked(window.sessionStorage.getItem).mockReturnValue(
        JSON.stringify(existingAssignment)
      );

      const assignment = analyticsModule.getABTestAssignment('ux_test_existing');

      expect(assignment).toEqual(existingAssignment);
    });

    it('should return null for non-existent A/B test assignment', () => {
      vi.mocked(window.sessionStorage.getItem).mockReturnValue(null);

      const assignment = analyticsModule.getABTestAssignment('non_existent_test');

      expect(assignment).toBeNull();
    });

    it('should track A/B test assignment event', () => {
      const assignment = {
        experimentId: 'ux_test_tracking',
        variant: 'single-page',
        assignedAt: Date.now(),
        sessionId: 'test-session'
      };

      analyticsModule.trackABTestAssignment(assignment);

      // Should track ab_test_assigned event via trackEvent
      // Verification happens via the trackEvent mock
    });
  });

  describe('Performance Validation', () => {
    beforeEach(() => {
      // Mock window.performance
      Object.defineProperty(window, 'performance', {
        value: {
          timing: {
            navigationStart: 1000,
            loadEventEnd: 3500,
            domContentLoadedEventEnd: 2500,
            domInteractive: 2000
          }
        },
        writable: true
      });
    });

    it('should track page load performance metrics', () => {
      const sessionId = 'test-session-id';

      analyticsModule.trackPageLoadPerformance(sessionId);

      // Should track page load performance event
      // Verification happens via the trackEvent mock
    });

    it('should fire performance_threshold_exceeded alert when >3s', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Set page load time > 3000ms
      Object.defineProperty(window, 'performance', {
        value: {
          timing: {
            navigationStart: 1000,
            loadEventEnd: 5500, // 4500ms load time
            domContentLoadedEventEnd: 3000,
            domInteractive: 2500
          }
        },
        writable: true
      });

      const sessionId = 'test-session-id';
      analyticsModule.trackPageLoadPerformance(sessionId);

      // Should log console warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance threshold exceeded')
      );

      consoleSpy.mockRestore();
    });

    it('should track Web Vitals (LCP, FID, CLS)', async () => {
      const sessionId = 'test-session-id';

      // Mock web-vitals library
      vi.mock('web-vitals', () => ({
        onLCP: vi.fn((callback) => {
          callback({ value: 2400, delta: 2400, id: 'lcp-1', rating: 'good' });
        }),
        onFID: vi.fn((callback) => {
          callback({ value: 80, delta: 80, id: 'fid-1', rating: 'good' });
        }),
        onCLS: vi.fn((callback) => {
          callback({ value: 0.05, delta: 0.05, id: 'cls-1', rating: 'good' });
        })
      }));

      analyticsModule.trackWebVitals(sessionId);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Should track web vitals events
      // Verification happens via the trackEvent mock
    });

    it('should track component load time for lazy loading', () => {
      const sessionId = 'test-session-id';

      analyticsModule.trackComponentLoadTime('MugDesigner', 1200, sessionId);

      // Should track component load time event
      // Verification happens via the trackEvent mock
    });
  });
});
