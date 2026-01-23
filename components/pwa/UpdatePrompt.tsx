import React from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useServiceWorker } from '../../hooks/useServiceWorker';

interface UpdatePromptProps {
  onDismiss?: () => void;
}

export const UpdatePrompt: React.FC<UpdatePromptProps> = ({ onDismiss }) => {
  const { isUpdateAvailable, skipWaiting } = useServiceWorker();

  if (!isUpdateAvailable) return null;

  const handleUpdate = () => {
    skipWaiting();
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-card-purple p-4 rounded-xl z-50 animate-slide-up">
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-int-glow-purple/20 rounded-lg">
          <RefreshCw className="w-5 h-5 text-int-glow-purple" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">Update Available</h3>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            A new version is ready. Refresh to get the latest features.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleUpdate}
              className="flex-1 py-2 px-4 bg-int-glow-purple hover:bg-int-glow-purple/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Refresh Now
            </button>
            <button
              onClick={onDismiss}
              className="py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdatePrompt;
