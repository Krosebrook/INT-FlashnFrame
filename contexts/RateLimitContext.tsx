import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { useRateLimit } from '../hooks/useRateLimit';

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
  const { isRateLimited, service, remainingSeconds, triggerRateLimit, handleApiError, checkBeforeCall } = useRateLimit();

  const contextValue = useMemo(() => ({
    isRateLimited,
    service,
    remainingSeconds,
    setRateLimit: triggerRateLimit,
    clearRateLimit: () => {},
    handleApiError,
    checkBeforeCall
  }), [isRateLimited, service, remainingSeconds, triggerRateLimit, handleApiError, checkBeforeCall]);

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
