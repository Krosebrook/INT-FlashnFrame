import { useState, useCallback, useEffect, useRef } from 'react';
import { isGeminiRateLimited, getGeminiRateLimitRemaining, setGeminiRateLimit } from '../services/geminiService';

interface UseRateLimitReturn {
  isRateLimited: boolean;
  service: string;
  remainingSeconds: number;
  triggerRateLimit: (service: string, retryAfterSeconds?: number) => void;
  handleApiError: (error: any) => boolean;
  checkBeforeCall: () => boolean;
}

export function useRateLimit(): UseRateLimitReturn {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [service, setService] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncFromService = useCallback(() => {
    if (isGeminiRateLimited()) {
      const remaining = getGeminiRateLimitRemaining();
      if (remaining > 0) {
        setRemainingSeconds(remaining);
        return true;
      }
    }
    setRemainingSeconds(0);
    setService('');
    return false;
  }, []);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (!syncFromService()) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 1000);
  }, [syncFromService]);

  const triggerRateLimit = useCallback((svc: string, retryAfterSeconds: number = 15) => {
    setGeminiRateLimit(retryAfterSeconds);
    setService(svc);
    setRemainingSeconds(retryAfterSeconds);
    startPolling();
  }, [startPolling]);

  const handleApiError = useCallback((error: any): boolean => {
    const parsed = parseRateLimitError(error);
    if (parsed.isRateLimit) {
      triggerRateLimit(parsed.service, parsed.retryAfter);
      return true;
    }
    return false;
  }, [triggerRateLimit]);

  const checkBeforeCall = useCallback((): boolean => {
    if (isGeminiRateLimited()) {
      const remaining = getGeminiRateLimitRemaining();
      if (remaining > 0) {
        setService(s => s || 'Gemini AI');
        setRemainingSeconds(remaining);
        startPolling();
        return true;
      }
    }
    return false;
  }, [startPolling]);

  useEffect(() => {
    syncFromService();
    if (isGeminiRateLimited()) {
      setService('Gemini AI');
      startPolling();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [syncFromService, startPolling]);

  return {
    isRateLimited: remainingSeconds > 0,
    service,
    remainingSeconds,
    triggerRateLimit,
    handleApiError,
    checkBeforeCall
  };
}

export function parseRateLimitError(error: any): { isRateLimit: boolean; retryAfter: number; service: string } {
  const errorMsg = error?.message || error?.toString?.() || '';
  const lowerMsg = errorMsg.toLowerCase();

  const isNetworkError = lowerMsg.includes('failed to fetch') || lowerMsg.includes('networkerror') || lowerMsg.includes('net::err');
  if (isNetworkError) {
    return { isRateLimit: false, retryAfter: 0, service: '' };
  }

  const isRateLimit = lowerMsg.includes('rate limit') || lowerMsg.includes('429') ||
    lowerMsg.includes('too many requests') || lowerMsg.includes('quota') ||
    lowerMsg.includes('resource exhausted');

  if (isRateLimit) {
    const waitMatch = errorMsg.match(/wait\s+(\d+)\s*s/i);
    const retryMatch = errorMsg.match(/retry.?after[:\s]*(\d+)/i);
    const retryAfter = waitMatch ? parseInt(waitMatch[1], 10) :
                       retryMatch ? parseInt(retryMatch[1], 10) : 15;

    let svc = 'API';
    if (lowerMsg.includes('gemini') || lowerMsg.includes('google')) {
      svc = 'Gemini AI';
    } else if (lowerMsg.includes('github')) {
      svc = 'GitHub';
    } else if (lowerMsg.includes('openai')) {
      svc = 'OpenAI';
    }

    return { isRateLimit: true, retryAfter, service: svc };
  }

  return { isRateLimit: false, retryAfter: 0, service: '' };
}
