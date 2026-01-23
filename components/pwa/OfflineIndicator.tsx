import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  if (isOnline && wasOffline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
        <div className="flex items-center gap-2 px-4 py-2 bg-int-success/20 border border-int-success/40 rounded-full">
          <Wifi className="w-4 h-4 text-int-success" />
          <span className="text-sm font-medium text-int-success">Back online</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-2 px-4 py-2 bg-int-warning/20 border border-int-warning/40 rounded-full">
        <WifiOff className="w-4 h-4 text-int-warning animate-pulse" />
        <span className="text-sm font-medium text-int-warning">You're offline</span>
      </div>
    </div>
  );
};

export default OfflineIndicator;
