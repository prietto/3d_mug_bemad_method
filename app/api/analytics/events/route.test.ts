/**
 * Tests for Analytics Events API Route
 * Tests server-side analytics event processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { AnalyticsEvent } from '@/lib/types';

// Mock fetch for GA4 Measurement Protocol
global.fetch = vi.fn();

// Mock environment variables
const mockEnv = vi.hoisted(() => ({
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: 'G-TEST123456',
  GA4_API_SECRET: 'test-api-secret',
  NODE_ENV: 'test',
}));

vi.mock('process', () => ({
  env: mockEnv,
}));

describe('Analytics Events API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: () => Promise.resolve(body),
    } as NextRequest;
  };

  const createValidEvent = (): AnalyticsEvent => ({
    id: 'test-event-1',
    sessionId: 'test-session-123',
    eventType: 'mug_rotate',
    eventData: {
      angle: 45,
      duration: 1000,
    },
    timestamp: new Date(),
    userAgent: 'Mozilla/5.0 (Test Browser)',
  });

  describe('POST /api/analytics/events', () => {
    it('should process valid analytics events', async () => {
      const events = [createValidEvent()];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
      expect(data.errors).toBeUndefined();
    });

    it('should handle multiple valid events', async () => {
      const events = [
        createValidEvent(),
        {
          ...createValidEvent(),
          id: 'test-event-2',
          eventType: 'color_change' as const,
          eventData: { color: 'blue' },
        },
        {
          ...createValidEvent(),
          id: 'test-event-3',
          eventType: 'text_add' as const,
          eventData: { textLength: 10 },
        },
      ];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(3);
    });

    it('should reject empty events array', async () => {
      const request = createMockRequest({ events: [] });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid events array');
    });

    it('should reject invalid events array', async () => {
      const request = createMockRequest({ events: 'not-an-array' });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid events array');
    });

    it('should filter out invalid events and process valid ones', async () => {
      const events = [
        createValidEvent(),
        {
          // Missing required fields
          id: 'invalid-event',
          eventData: {},
        },
        {
          ...createValidEvent(),
          id: 'test-event-2',
        },
      ];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(2); // Only 2 valid events
      expect(data.errors).toContain('1 events failed to process');
    });

    it('should reject request with no valid events', async () => {
      const events = [
        {
          // Missing all required fields
          eventData: {},
        },
        {
          // Missing sessionId and eventType
          id: 'incomplete-event',
        },
      ];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('No valid events found');
    });

    it('should send events to GA4 Measurement Protocol', async () => {
      const events = [createValidEvent()];
      const request = createMockRequest({ events });

      await POST(request);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://www.google-analytics.com/mp/collect'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('3d_interaction'), // Mapped event name
        })
      );
    });

    it('should handle GA4 configuration missing gracefully', async () => {
      mockEnv.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID = '';
      mockEnv.GA4_API_SECRET = '';

      const events = [createValidEvent()];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should not call fetch when GA4 is not configured
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle GA4 Measurement Protocol errors gracefully', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 400,
      } as Response);

      const events = [createValidEvent()];
      const request = createMockRequest({ events });

      const response = await POST(request);
      const data = await response.json();

      // Should still succeed even if GA4 fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.processed).toBe(1);
    });

    it('should handle malformed JSON request', async () => {
      const request = {
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
    });

    it('should map event types correctly to GA4', async () => {
      const events = [
        { ...createValidEvent(), eventType: 'page_view' as const },
        { ...createValidEvent(), id: 'event-2', eventType: 'mug_rotate' as const },
        { ...createValidEvent(), id: 'event-3', eventType: 'color_change' as const },
        { ...createValidEvent(), id: 'event-4', eventType: 'image_upload' as const },
        { ...createValidEvent(), id: 'event-5', eventType: 'text_add' as const },
        { ...createValidEvent(), id: 'event-6', eventType: 'lead_capture' as const },
      ];
      const request = createMockRequest({ events });

      await POST(request);

      // Check that fetch was called with the correct GA4 event names
      const fetchCalls = vi.mocked(fetch).mock.calls;
      expect(fetchCalls.length).toBeGreaterThan(0);
      
      const requestBody = JSON.parse(fetchCalls[0][1]?.body as string);
      const eventNames = requestBody.events.map((e: any) => e.name);
      
      expect(eventNames).toContain('page_view');
      expect(eventNames).toContain('3d_interaction');
      expect(eventNames).toContain('customization');
      expect(eventNames).toContain('conversion');
    });

    it('should group events by session ID for GA4', async () => {
      const events = [
        { ...createValidEvent(), sessionId: 'session-1' },
        { ...createValidEvent(), id: 'event-2', sessionId: 'session-1' },
        { ...createValidEvent(), id: 'event-3', sessionId: 'session-2' },
      ];
      const request = createMockRequest({ events });

      await POST(request);

      // Should make 2 fetch calls (one per session)
      expect(fetch).toHaveBeenCalledTimes(2);
      
      // Verify session grouping
      const fetchCalls = vi.mocked(fetch).mock.calls;
      const bodies = fetchCalls.map(call => JSON.parse(call[1]?.body as string));
      
      expect(bodies.some(body => body.client_id === 'session-1' && body.events.length === 2)).toBe(true);
      expect(bodies.some(body => body.client_id === 'session-2' && body.events.length === 1)).toBe(true);
    });
  });
});
