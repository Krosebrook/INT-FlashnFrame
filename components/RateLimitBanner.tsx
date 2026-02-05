/**
 * Rate limit banner component with countdown timer
 * Shows when API rate limits are hit
 */

import React from 'react';
import { Clock, AlertTriangle, X } from 'lucide-react';

interface RateLimitBannerProps {
  service: string;
  remainingSeconds: number;
  onDismiss?: () => void;
}

export const RateLimitBanner: React.FC<RateLimitBannerProps> = ({
  service,
  remainingSeconds,
  onDismiss
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300">
      <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl backdrop-blur-md shadow-lg">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-amber-200">
            {service} Rate Limited
          </span>
          <div className="flex items-center gap-1.5 text-xs text-amber-300/80">
            <Clock className="w-3 h-3" />
            <span>Ready in {formatTime(remainingSeconds)}</span>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 p-1 rounded-lg hover:bg-amber-500/20 text-amber-400 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
