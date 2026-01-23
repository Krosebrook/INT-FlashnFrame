import React from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss }) => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPrompt();

  if (isInstalled) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      onDismiss?.();
    }
  };

  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-card-teal p-4 rounded-xl z-50 animate-slide-up">
        <button 
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
        
        <div className="flex items-start gap-3">
          <div className="p-2 bg-int-primary/20 rounded-lg">
            <Smartphone className="w-5 h-5 text-int-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm">Install Flash-n-Frame</h3>
            <p className="text-xs text-slate-400 mt-1">
              Tap the share button <span className="inline-block">⎋</span> then "Add to Home Screen"
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 glass-card-teal p-4 rounded-xl z-50 animate-slide-up">
      <button 
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
      >
        <X className="w-4 h-4 text-slate-400" />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="p-2 bg-int-primary/20 rounded-lg">
          <Download className="w-5 h-5 text-int-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">Install Flash-n-Frame</h3>
          <p className="text-xs text-slate-400 mt-1 mb-3">
            Install for faster access and offline support
          </p>
          <button
            onClick={handleInstall}
            className="w-full py-2 px-4 bg-int-primary hover:bg-int-primary/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
