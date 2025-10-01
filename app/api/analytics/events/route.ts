/**
 * Analytics Events API Route
 * Handles batch processing of analytics events from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsEvent } from '@/lib/types';

export interface AnalyticsEventsRequest {
  events: AnalyticsEvent[];
}

export interface AnalyticsEventsResponse {
  success: boolean;
  processed: number;
  errors?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyticsEventsRequest = await request.json();
    const { events } = body;

    // Validate request
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid events array' },
        { status: 400 }
      );
    }

    // Validate event structure
    const validEvents = events.filter(event => 
      event.id && 
      event.sessionId && 
      event.eventType && 
      event.timestamp
    );

    if (validEvents.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid events found' },
        { status: 400 }
      );
    }

    // Process events (in production, you would save to database)
    const processed = await processAnalyticsEvents(validEvents);
    
    // Send to Google Analytics Measurement Protocol (server-side tracking)
    await sendToGA4MeasurementProtocol(validEvents);

    return NextResponse.json({
      success: true,
      processed: processed.length,
      errors: processed.length !== validEvents.length 
        ? [`${validEvents.length - processed.length} events failed to process`]
        : undefined
    });

  } catch (error) {
    console.error('Analytics events API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process analytics events (placeholder for database storage)
 */
async function processAnalyticsEvents(events: AnalyticsEvent[]): Promise<AnalyticsEvent[]> {
  // In a real implementation, you would:
  // 1. Save events to Supabase analytics_events table
  // 2. Update lead records with engagement data
  // 3. Trigger real-time analytics updates
  
  // For now, we'll just log the events and return them as processed
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Processing ${events.length} analytics events:`);
    events.forEach(event => {
      console.log(`  - ${event.eventType}: ${event.sessionId} (${event.id})`);
    });
  }

  // Simulate async processing
  await new Promise(resolve => setTimeout(resolve, 10));
  
  return events;
}

/**
 * Send events to Google Analytics 4 Measurement Protocol
 */
async function sendToGA4MeasurementProtocol(events: AnalyticsEvent[]): Promise<void> {
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  if (!gaId || !apiSecret) {
    console.warn('GA4 Measurement Protocol not configured');
    return;
  }

  try {
    // Convert AnalyticsEvent to GA4 Measurement Protocol format
    const ga4Events = events.map(event => ({
      name: mapEventTypeToGA4(event.eventType),
      params: {
        session_id: event.sessionId,
        event_time: Math.floor(event.timestamp.getTime() / 1000),
        user_agent: event.userAgent,
        ...event.eventData,
      },
    }));

    // Group events by session for batch sending
    const sessionGroups = groupEventsBySession(ga4Events);

    // Send each session group to GA4
    const sendPromises: Promise<void>[] = [];
    
    sessionGroups.forEach((sessionEvents, sessionId) => {
      const sendPromise = (async () => {
        const payload = {
          client_id: sessionId,
          events: sessionEvents,
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
          console.error(`GA4 Measurement Protocol error for session ${sessionId}:`, response.status);
        }
      })();
      
      sendPromises.push(sendPromise);
    });

    // Wait for all requests to complete
    await Promise.all(sendPromises);

    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Sent ${events.length} events to GA4 Measurement Protocol`);
    }

  } catch (error) {
    console.error('GA4 Measurement Protocol error:', error);
  }
}

/**
 * Map internal event types to GA4 event names
 */
function mapEventTypeToGA4(eventType: AnalyticsEvent['eventType']): string {
  const mapping = {
    'page_view': 'page_view',
    'mug_rotate': '3d_interaction',
    'color_change': 'customization',
    'image_upload': 'customization',
    'text_add': 'customization',
    'lead_capture': 'conversion',
  };

  return mapping[eventType] || 'custom_event';
}

/**
 * Group events by session ID for batch processing
 */
function groupEventsBySession(events: any[]): Map<string, any[]> {
  const groups = new Map<string, any[]>();

  events.forEach(event => {
    const sessionId = event.params.session_id;
    if (!groups.has(sessionId)) {
      groups.set(sessionId, []);
    }
    groups.get(sessionId)!.push(event);
  });

  return groups;
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map<string, number>();

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const lastRequest = rateLimitMap.get(clientId) || 0;
  
  // Allow one request per second per client
  if (now - lastRequest < 1000) {
    return false;
  }
  
  rateLimitMap.set(clientId, now);
  return true;
}
