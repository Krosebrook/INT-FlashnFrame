/**
 * Rate limit handling hook with countdown timer
 * Provides UI feedback when API rate limits are hit
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface RateLimitState {
  isLimited: boolean;
  retryAfter: number;
  service: string;
}

interface UseRateLimitReturn {
  rateLimitState: RateLimitState | null;
  setRateLimit: (service: string, retryAfterSeconds?: number) => void;
  clearRateLimit: () => void;
  getRemainingSeconds: () => number;
  isRateLimited: boolean;
}

const DEFAULT_RETRY_SECONDS = 60;

export function useRateLimit(): UseRateLimitReturn {
  const [rateLimitState, setRateLimitState] = useState<RateLimitState | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearRateLimit = useCallback(() => {
    setRateLimitState(null);
    setRemainingSeconds(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const setRateLimit = useCallback((service: string, retryAfterSeconds: number = DEFAULT_RETRY_SECONDS) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const endTime = Date.now() + retryAfterSeconds * 1000;
    
    setRateLimitState({
      isLimited: true,
      retryAfter: endTime,
      service
    });
    setRemainingSeconds(retryAfterSeconds);

    intervalRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      if (remaining <= 0) {
        clearRateLimit();
      } else {
        setRemainingSeconds(remaining);
      }
    }, 1000);
  }, [clearRateLimit]);

  const getRemainingSeconds = useCallback(() => {
    return remainingSeconds;
  }, [remainingSeconds]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    rateLimitState,
    setRateLimit,
    clearRateLimit,
    getRemainingSeconds,
    isRateLimited: rateLimitState?.isLimited ?? false
  };
}

export function parseRateLimitError(error: any): { isRateLimit: boolean; retryAfter: number; service: string } {
  const errorMsg = error?.message?.toLowerCase() || error?.toString()?.toLowerCase() || '';
  
  if (errorMsg.includes('rate limit') || errorMsg.includes('429') || errorMsg.includes('too many requests') || errorMsg.includes('quota')) {
    const retryMatch = errorMsg.match(/retry.?after[:\s]*(\d+)/i);
    const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;
    
    let service = 'API';
    if (errorMsg.includes('gemini') || errorMsg.includes('google')) {
      service = 'Gemini AI';
    } else if (errorMsg.includes('github')) {
      service = 'GitHub';
    } else if (errorMsg.includes('openai')) {
      service = 'OpenAI';
    }
    
    return { isRateLimit: true, retryAfter, service };
  }
  
  return { isRateLimit: false, retryAfter: 0, service: '' };
}
