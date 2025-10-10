// Client-Side Rate Limiter Hook
// Story 8.3: Layer 1 (Session-based) Rate Limiting

import { useState, useEffect, useCallback } from 'react';
import { RATE_LIMITS, getUTCDateKey } from '../rateLimiter';

const STORAGE_KEY = 'ai_generation_limit';

interface RateLimitData {
  count: number;
  date: string; // YYYY-MM-DD UTC
}

interface UseRateLimiterReturn {
  sessionUsed: number;
  sessionLimit: number;
  canGenerate: boolean;
  remaining: number;
  incrementCount: () => number;
  getRemaining: () => number;
  reset: () => void;
}

/**
 * Client-side rate limiter hook (Layer 1)
 * Manages session-based generation count with daily reset
 * Stores data in localStorage
 * Can be disabled via NEXT_PUBLIC_DISABLE_RATE_LIMIT environment variable
 */
export function useRateLimiter(): UseRateLimiterReturn {
  const [sessionUsed, setSessionUsed] = useState(0);
  const [canGenerate, setCanGenerate] = useState(true);

  // Check if rate limiting is disabled
  const rateLimitDisabled = process.env.NEXT_PUBLIC_DISABLE_RATE_LIMIT === 'true';

  // Load from localStorage on mount
  useEffect(() => {
    // If rate limiting is disabled, always allow generation
    if (rateLimitDisabled) {
      setSessionUsed(0);
      setCanGenerate(true);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: RateLimitData = JSON.parse(stored);
        const today = getUTCDateKey();

        if (data.date === today) {
          // Same day - restore count
          setSessionUsed(data.count);
          setCanGenerate(data.count < RATE_LIMITS.SESSION_LIMIT);
        } else {
          // New day - reset
          const freshData: RateLimitData = { count: 0, date: today };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
          setSessionUsed(0);
          setCanGenerate(true);
        }
      } else {
        // First time - initialize
        const freshData: RateLimitData = { count: 0, date: getUTCDateKey() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
      }
    } catch (error) {
      // Handle localStorage errors (private browsing, quota exceeded, etc.)
      console.warn('Failed to load rate limit from localStorage:', error);
      setSessionUsed(0);
      setCanGenerate(true);
    }
  }, [rateLimitDisabled]);

  /**
   * Increment the session count
   * Returns the new count
   */
  const incrementCount = useCallback((): number => {
    // If rate limiting is disabled, don't increment
    if (rateLimitDisabled) {
      return 0;
    }

    try {
      const today = getUTCDateKey();
      const newCount = sessionUsed + 1;

      const data: RateLimitData = {
        count: newCount,
        date: today
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSessionUsed(newCount);
      setCanGenerate(newCount < RATE_LIMITS.SESSION_LIMIT);

      return newCount;
    } catch (error) {
      console.warn('Failed to save rate limit to localStorage:', error);
      return sessionUsed;
    }
  }, [sessionUsed, rateLimitDisabled]);

  /**
   * Get remaining generations in session
   */
  const getRemaining = useCallback((): number => {
    return Math.max(0, RATE_LIMITS.SESSION_LIMIT - sessionUsed);
  }, [sessionUsed]);

  /**
   * Reset the counter (useful for testing)
   */
  const reset = useCallback((): void => {
    try {
      const data: RateLimitData = { count: 0, date: getUTCDateKey() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setSessionUsed(0);
      setCanGenerate(true);
    } catch (error) {
      console.warn('Failed to reset rate limit:', error);
    }
  }, []);

  return {
    sessionUsed,
    sessionLimit: RATE_LIMITS.SESSION_LIMIT,
    canGenerate,
    remaining: getRemaining(),
    incrementCount,
    getRemaining,
    reset
  };
}
