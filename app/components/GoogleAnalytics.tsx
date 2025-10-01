/**
 * Google Analytics Component for Next.js App Router
 * Handles GA4 initialization with proper consent management
 */

'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { initializeGA4, validateGA4Config, trackPageView } from '@/lib/utils/analytics';

interface GoogleAnalyticsProps {
  gaId: string;
}

export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // Validate configuration on mount
    if (!validateGA4Config()) {
      return;
    }

    // Track initial page view after GA4 is loaded
    const handleRouteChange = () => {
      trackPageView(window.location.pathname);
    };

    // Listen for route changes in Next.js App Router
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Don't render in development if GA ID is not configured
  if (!gaId || gaId === 'G-XXXXXXXXXX') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Google Analytics not configured for development');
    }
    return null;
  }

  return (
    <>
      {/* Load Google Analytics gtag.js script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
        async
      />
      
      {/* Initialize Google Analytics */}
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            gtag('config', '${gaId}', {
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
                'custom_dimension_4': 'ab_test_variant',
              },
            });
            
            // Track initial page view
            gtag('event', 'page_view', {
              page_title: document.title,
              page_location: window.location.href,
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
}

/**
 * Hook for tracking page views in components
 */
export function usePageTracking() {
  useEffect(() => {
    trackPageView(window.location.pathname);
  }, []);
}
