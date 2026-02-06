import React, { createContext, useContext, ReactNode, useCallback, useMemo } from 'react';
import { useRateLimit, parseRateLimitError } from '../hooks/useRateLimit';
import { isGeminiRateLimited, getGeminiRateLimitRemaining } from '../services/geminiService';

interface RateLimitContextType {
  isRateLimited: boolean;
  service: string;
  remainingSeconds: number;
  setRateLimit: (service: string, retryAfterSeconds?: number) => void;
  clearRateLimit: () => void;
  handleApiError: (error: any) => boolean;
  checkBeforeCall: () => boolean;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const RateLimitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { rateLimitState, setRateLimit, clearRateLimit, getRemainingSeconds, isRateLimited } = useRateLimit();

  const handleApiError = useCallback((error: any): boolean => {
    const { isRateLimit, retryAfter, service } = parseRateLimitError(error);
    if (isRateLimit) {
      setRateLimit(service, retryAfter);
      return true;
    }
    return false;
  }, [setRateLimit]);

  const checkBeforeCall = useCallback((): boolean => {
    if (isRateLimited) return true;
    if (isGeminiRateLimited()) {
      const remaining = getGeminiRateLimitRemaining();
      if (remaining > 0) {
        setRateLimit('Gemini AI', remaining);
        return true;
      }
    }
    return false;
  }, [isRateLimited, setRateLimit]);

  const contextValue = useMemo(() => {
    const uiRemaining = getRemainingSeconds();
    const geminiRemaining = getGeminiRateLimitRemaining();
    
    const uiActive = isRateLimited && uiRemaining > 0;
    const geminiActive = isGeminiRateLimited() && geminiRemaining > 0;
    
    let effectiveService = '';
    let effectiveRemaining = 0;
    let effectiveIsLimited = false;

    if (uiActive && geminiActive) {
      effectiveIsLimited = true;
      effectiveRemaining = Math.max(uiRemaining, geminiRemaining);
      effectiveService = uiRemaining >= geminiRemaining 
        ? (rateLimitState?.service || 'Gemini AI') 
        : 'Gemini AI';
    } else if (uiActive) {
      effectiveIsLimited = true;
      effectiveRemaining = uiRemaining;
      effectiveService = rateLimitState?.service || 'API';
    } else if (geminiActive) {
      effectiveIsLimited = true;
      effectiveRemaining = geminiRemaining;
      effectiveService = 'Gemini AI';
    }

    return {
      isRateLimited: effectiveIsLimited,
      service: effectiveService,
      remainingSeconds: effectiveRemaining,
      setRateLimit,
      clearRateLimit,
      handleApiError,
      checkBeforeCall
    };
  }, [isRateLimited, rateLimitState, getRemainingSeconds, setRateLimit, clearRateLimit, handleApiError, checkBeforeCall]);

  return (
    <RateLimitContext.Provider value={contextValue}>
      {children}
    </RateLimitContext.Provider>
  );
};

export const useRateLimitContext = (): RateLimitContextType => {
  const context = useContext(RateLimitContext);
  if (!context) {
    throw new Error('useRateLimitContext must be used within a RateLimitProvider');
  }
  return context;
};
