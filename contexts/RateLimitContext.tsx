/**
 * Global rate limit context for managing API rate limit state
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useRateLimit, parseRateLimitError } from '../hooks/useRateLimit';

interface RateLimitContextType {
  isRateLimited: boolean;
  service: string;
  remainingSeconds: number;
  setRateLimit: (service: string, retryAfterSeconds?: number) => void;
  clearRateLimit: () => void;
  handleApiError: (error: any) => boolean;
}

const RateLimitContext = createContext<RateLimitContextType | undefined>(undefined);

export const RateLimitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { rateLimitState, setRateLimit, clearRateLimit, getRemainingSeconds, isRateLimited } = useRateLimit();

  const handleApiError = (error: any): boolean => {
    const { isRateLimit, retryAfter, service } = parseRateLimitError(error);
    if (isRateLimit) {
      setRateLimit(service, retryAfter);
      return true;
    }
    return false;
  };

  return (
    <RateLimitContext.Provider
      value={{
        isRateLimited,
        service: rateLimitState?.service || '',
        remainingSeconds: getRemainingSeconds(),
        setRateLimit,
        clearRateLimit,
        handleApiError
      }}
    >
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
