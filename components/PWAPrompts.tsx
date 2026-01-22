import React from 'react';
import { Download, Wifi, WifiOff, RefreshCw, X } from 'lucide-react';
import { useInstallPrompt, useOnlineStatus, useServiceWorker } from '../hooks/usePWA';

export const InstallPrompt: React.FC<{ onDismiss?: () => void }> = ({ onDismiss }) => {
  const { isInstallable, install } = useInstallPrompt();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-violet-500/30 rounded-xl p-4 shadow-xl backdrop-blur-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-violet-500/20 rounded-lg">
            <Download className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">Install Flash-n-Frame</h3>
            <p className="text-xs text-slate-400 mt-1">Add to your home screen for quick access and offline support</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={install}
                className="px-3 py-1.5 bg-violet-500 text-white text-xs font-medium rounded-lg hover:bg-violet-600 transition-colors"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-slate-400 text-xs hover:text-white transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/90 text-amber-950 rounded-full text-sm font-medium shadow-lg">
        <WifiOff className="w-4 h-4" />
        <span>You're offline</span>
      </div>
    </div>
  );
};

export const OnlineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showOnline, setShowOnline] = React.useState(false);
  const wasOffline = React.useRef(false);

  React.useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
    } else if (wasOffline.current) {
      setShowOnline(true);
      setTimeout(() => setShowOnline(false), 3000);
      wasOffline.current = false;
    }
  }, [isOnline]);

  if (!showOnline) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/90 text-emerald-950 rounded-full text-sm font-medium shadow-lg">
        <Wifi className="w-4 h-4" />
        <span>Back online</span>
      </div>
    </div>
  );
};

export const UpdatePrompt: React.FC = () => {
  const { updateAvailable, update } = useServiceWorker();
  const [dismissed, setDismissed] = React.useState(false);

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up">
      <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-4 shadow-xl backdrop-blur-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">Update Available</h3>
            <p className="text-xs text-slate-400 mt-1">A new version of Flash-n-Frame is ready</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={update}
                className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-slate-400 text-xs hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const ConnectionStatus: React.FC<{ showAlways?: boolean }> = ({ showAlways = false }) => {
  const isOnline = useOnlineStatus();

  if (!showAlways && isOnline) return null;

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
      isOnline 
        ? 'bg-emerald-500/10 text-emerald-400' 
        : 'bg-amber-500/10 text-amber-400'
    }`}>
      {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};
