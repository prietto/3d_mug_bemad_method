/**
 * Enhanced Analytics Integration Hook
 * Integrates with existing design store and 3D components
 */

'use client';

import { useEffect, useRef } from 'react';
import { useDesignStore } from '@/app/components/3d/store/designStore';
import { getAnalyticsEngine } from '@/lib/utils/analyticsEngine';
import { trackConversionFunnel } from '@/lib/utils/analytics';

// Generate or retrieve session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return 'server-session';
  
  let sessionId = sessionStorage.getItem('analytics-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics-session-id', sessionId);
  }
  return sessionId;
}

export function useAnalyticsIntegration() {
  const sessionId = useRef(getSessionId());
  const analyticsEngine = getAnalyticsEngine();
  const hasStartedSession = useRef(false);
  const lastRotationTime = useRef(0);
  const rotationCount = useRef(0);
  const zoomCount = useRef(0);
  
  // Subscribe to design store changes
  const {
    currentDesign,
    engagement,
    interaction,
    camera,
    performance
  } = useDesignStore();

  // Initialize analytics session
  useEffect(() => {
    if (!hasStartedSession.current) {
      hasStartedSession.current = true;
      analyticsEngine.startSession(sessionId.current);
      
      // Track initial page view
      trackConversionFunnel('page_view', {
        timestamp: Date.now(),
        user_agent: navigator.userAgent,
        page_path: window.location.pathname,
      }, sessionId.current);
      
      // Send to funnel API
      fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          step: 'page_view',
          metadata: {
            timestamp: Date.now(),
            user_agent: navigator.userAgent,
            page_path: window.location.pathname,
          },
        }),
      }).catch(console.error);
    }

    return () => {
      analyticsEngine.endSession(sessionId.current);
    };
  }, [analyticsEngine]);

  // Track 3D engagement (camera/interaction changes)
  useEffect(() => {
    const now = Date.now();
    
    // Track rotation events (throttled to avoid spam)
    if (interaction.isDragging && now - lastRotationTime.current > 500) {
      lastRotationTime.current = now;
      rotationCount.current++;
      
      analyticsEngine.trackRotation(15, 500, sessionId.current); // Approximate values
      
      // First meaningful 3D interaction - track funnel progression
      if (rotationCount.current === 1) {
        trackConversionFunnel('3d_engagement', {
          interaction_type: 'rotation',
          timestamp: now,
        }, sessionId.current);
        
        // Send to funnel API
        fetch('/api/analytics/funnel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId.current,
            step: '3d_engagement',
            metadata: {
              interaction_type: 'rotation',
              timestamp: now,
            },
          }),
        }).catch(console.error);
      }
    }

    // Track zoom events
    if (interaction.isZooming) {
      zoomCount.current++;
      const cameraDistance = Math.sqrt(
        camera.position[0] ** 2 + camera.position[1] ** 2 + camera.position[2] ** 2
      );
      
      analyticsEngine.trackZoom(cameraDistance, 'in', sessionId.current);
    }

  }, [interaction, camera, analyticsEngine]);

  // Track customization events
  useEffect(() => {
    const customizationPath: string[] = [];
    
    if (engagement.hasChangedColor) customizationPath.push('color');
    if (engagement.hasUploadedImage) customizationPath.push('image');
    if (engagement.hasCustomizedText) customizationPath.push('text');

    // Track customization funnel step
    if (customizationPath.length > 0 && !hasTrackedCustomization.current) {
      hasTrackedCustomization.current = true;
      
      trackConversionFunnel('customization', {
        customization_types: customizationPath,
        customization_count: customizationPath.length,
        timestamp: Date.now(),
      }, sessionId.current);
      
      // Send to funnel API
      fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          step: 'customization',
          metadata: {
            customization_types: customizationPath,
            customization_count: customizationPath.length,
            timestamp: Date.now(),
          },
        }),
      }).catch(console.error);
    }

  }, [engagement, analyticsEngine]);

  // Track individual customization changes
  useEffect(() => {
    if (engagement.hasChangedColor) {
      const customizationPath = getCustomizationPath();
      analyticsEngine.trackColorChange(
        currentDesign.mugColor, 
        customizationPath, 
        sessionId.current
      );
    }
  }, [currentDesign.mugColor, engagement.hasChangedColor, analyticsEngine]);

  useEffect(() => {
    if (engagement.hasUploadedImage && currentDesign.uploadedImageUrl) {
      const customizationPath = getCustomizationPath();
      analyticsEngine.trackImageUpload(
        50000, // Approximate image size
        'image/jpeg', // Approximate type
        customizationPath, 
        sessionId.current
      );
    }
  }, [currentDesign.uploadedImageUrl, engagement.hasUploadedImage, analyticsEngine]);

  useEffect(() => {
    if (engagement.hasCustomizedText && currentDesign.customText) {
      const customizationPath = getCustomizationPath();
      analyticsEngine.trackTextCustomization(
        currentDesign.customText.length,
        customizationPath, 
        sessionId.current
      );
    }
  }, [currentDesign.customText, engagement.hasCustomizedText, analyticsEngine]);

  // Track performance metrics
  useEffect(() => {
    if (performance.fps > 0) {
      analyticsEngine.trackPerformanceMetric(
        performance.fps,
        performance.memoryUsage,
        sessionId.current
      );
    }
  }, [performance.fps, performance.memoryUsage, analyticsEngine]);

  // Helper function to get current customization path
  const getCustomizationPath = (): string[] => {
    const path: string[] = [];
    if (engagement.hasChangedColor) path.push('color');
    if (engagement.hasUploadedImage) path.push('image');
    if (engagement.hasCustomizedText) path.push('text');
    return path;
  };

  // Return analytics utilities for manual tracking
  return {
    sessionId: sessionId.current,
    trackLeadCapture: (leadId: string, metadata: Record<string, any>) => {
      // Track conversion funnel completion
      trackConversionFunnel('lead_capture', {
        lead_id: leadId,
        engagement_level: engagement.engagementScore > 70 ? 'high' : 
                         engagement.engagementScore > 40 ? 'medium' : 'low',
        design_id: currentDesign.id,
        ...metadata,
      }, sessionId.current);
      
      // Send to funnel API
      fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId.current,
          step: 'lead_capture',
          leadId,
          metadata: {
            lead_id: leadId,
            engagement_level: engagement.engagementScore > 70 ? 'high' : 
                             engagement.engagementScore > 40 ? 'medium' : 'low',
            design_id: currentDesign.id,
            ...metadata,
          },
        }),
      }).catch(console.error);
    },
    analyticsEngine,
  };
}

// Keep track of customization tracking
const hasTrackedCustomization = { current: false };
