/**
 * Conversion Funnel Tracking API Route
 * Handles funnel progression analysis and e-commerce tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConversionFunnelStep } from '@/lib/types';

export interface ConversionFunnelRequest {
  sessionId: string;
  step: ConversionFunnelStep['step'];
  metadata: Record<string, any>;
  userId?: string;
  leadId?: string;
}

export interface ConversionFunnelResponse {
  success: boolean;
  funnelData?: {
    currentStep: ConversionFunnelStep['step'];
    completedSteps: ConversionFunnelStep['step'][];
    progressPercentage: number;
    timeInFunnel: number;
  };
  error?: string;
}

interface FunnelSession {
  sessionId: string;
  userId?: string;
  leadId?: string;
  steps: ConversionFunnelStep[];
  startTime: number;
  lastActivity: number;
}

// In-memory session storage (in production, use Redis or database)
const funnelSessions = new Map<string, FunnelSession>();

export async function POST(request: NextRequest) {
  try {
    const body: ConversionFunnelRequest = await request.json();
    const { sessionId, step, metadata, userId, leadId } = body;

    // Validate request
    if (!sessionId || !step) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: sessionId, step' },
        { status: 400 }
      );
    }

    const validSteps: ConversionFunnelStep['step'][] = [
      'page_view', '3d_engagement', 'customization', 'lead_capture'
    ];

    if (!validSteps.includes(step)) {
      return NextResponse.json(
        { success: false, error: 'Invalid funnel step' },
        { status: 400 }
      );
    }

    // Get or create funnel session
    let session = funnelSessions.get(sessionId);
    const now = Date.now();

    if (!session) {
      session = {
        sessionId,
        userId,
        leadId,
        steps: [],
        startTime: now,
        lastActivity: now,
      };
      funnelSessions.set(sessionId, session);
    }

    // Update session data
    if (userId) session.userId = userId;
    if (leadId) session.leadId = leadId;
    session.lastActivity = now;

    // Add new step if it's progression (don't duplicate same step)
    const lastStep = session.steps[session.steps.length - 1];
    if (!lastStep || lastStep.step !== step) {
      const funnelStep: ConversionFunnelStep = {
        step,
        timestamp: new Date(now),
        metadata,
        previousStep: lastStep?.step,
      };
      
      session.steps.push(funnelStep);

      // Track conversion events in Google Analytics
      await trackFunnelStepInGA4(session, funnelStep);
      
      // Track lead conversion with e-commerce data
      if (step === 'lead_capture' && leadId) {
        await trackLeadConversionInGA4(session, leadId, metadata);
      }
    }

    // Calculate funnel progress
    const stepSet = new Set(session.steps.map(s => s.step));
    const completedSteps = Array.from(stepSet);
    const progressPercentage = (completedSteps.length / validSteps.length) * 100;
    const timeInFunnel = now - session.startTime;

    const funnelData = {
      currentStep: step,
      completedSteps,
      progressPercentage,
      timeInFunnel,
    };

    return NextResponse.json({
      success: true,
      funnelData,
    });

  } catch (error) {
    console.error('Conversion funnel API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Missing sessionId parameter' },
        { status: 400 }
      );
    }

    const session = funnelSessions.get(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const stepSet2 = new Set(session.steps.map(s => s.step));
    const completedSteps = Array.from(stepSet2);
    const progressPercentage = (completedSteps.length / 4) * 100; // 4 total steps
    const timeInFunnel = Date.now() - session.startTime;

    const funnelData = {
      currentStep: session.steps[session.steps.length - 1]?.step || 'page_view',
      completedSteps,
      progressPercentage,
      timeInFunnel,
    };

    return NextResponse.json({
      success: true,
      funnelData,
    });

  } catch (error) {
    console.error('Conversion funnel GET API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Track funnel step progression in Google Analytics 4
 */
async function trackFunnelStepInGA4(
  session: FunnelSession, 
  step: ConversionFunnelStep
): Promise<void> {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!gaId || !apiSecret) {
    return;
  }

  try {
    const payload = {
      client_id: session.sessionId,
      user_id: session.userId,
      events: [{
        name: 'conversion_funnel_step',
        params: {
          funnel_step: step.step,
          funnel_stage: getFunnelStageNumber(step.step),
          previous_step: step.previousStep || null,
          time_since_start: Date.now() - session.startTime,
          session_step_count: session.steps.length,
          ...step.metadata,
        },
      }],
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('GA4 funnel tracking error:', response.status);
    }

  } catch (error) {
    console.error('GA4 funnel tracking error:', error);
  }
}

/**
 * Track lead conversion with e-commerce data in GA4
 */
async function trackLeadConversionInGA4(
  session: FunnelSession,
  leadId: string,
  metadata: Record<string, any>
): Promise<void> {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!gaId || !apiSecret) {
    return;
  }

  try {
    const engagementLevel = metadata.engagementLevel || 'medium';
    const leadValue = getLeadValue(engagementLevel);

    const payload = {
      client_id: session.sessionId,
      user_id: session.userId,
      events: [
        // Conversion event
        {
          name: 'conversion',
          params: {
            transaction_id: leadId,
            value: leadValue,
            currency: 'USD',
            item_category: 'lead_capture',
            engagement_level: engagementLevel,
            design_id: metadata.designId,
            traffic_source: metadata.source || 'direct',
            funnel_duration: Date.now() - session.startTime,
          },
        },
        // Purchase event for e-commerce tracking
        {
          name: 'purchase',
          params: {
            transaction_id: leadId,
            value: leadValue,
            currency: 'USD',
            items: [{
              item_id: metadata.designId || leadId,
              item_name: 'Custom Mug Lead',
              item_category: 'lead_capture',
              item_variant: engagementLevel,
              quantity: 1,
              price: leadValue,
            }],
          },
        },
      ],
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${gaId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('GA4 e-commerce tracking error:', response.status);
    }

  } catch (error) {
    console.error('GA4 e-commerce tracking error:', error);
  }
}

/**
 * Get funnel stage number for progression tracking
 */
function getFunnelStageNumber(step: ConversionFunnelStep['step']): number {
  const stageMap = {
    'page_view': 1,
    '3d_engagement': 2,
    'customization': 3,
    'lead_capture': 4,
  };
  
  return stageMap[step];
}

/**
 * Calculate lead value for e-commerce tracking
 */
function getLeadValue(engagementLevel: string): number {
  const valueMap = {
    'high': 50.00,   // High-engagement leads
    'medium': 25.00, // Medium-engagement leads
    'low': 10.00,    // Low-engagement leads
  };
  
  return valueMap[engagementLevel as keyof typeof valueMap] || 25.00;
}

// Cleanup old sessions periodically (run every hour)
const HOUR_IN_MS = 60 * 60 * 1000;

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    
    funnelSessions.forEach((session, sessionId) => {
      if (now - session.lastActivity > HOUR_IN_MS) {
        funnelSessions.delete(sessionId);
      }
    });
  }, HOUR_IN_MS);
}
