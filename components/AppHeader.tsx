
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { PenTool, CreditCard, Keyboard, Github, Sun, Moon, Palette } from 'lucide-react';
import { ViewMode } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';

interface AppHeaderProps {
  hasApiKey: boolean;
  onNavigateHome: () => void;
  onShowShortcuts: () => void;
}

const THEMES: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'solarized', icon: Palette, label: 'Solarized' },
];

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  hasApiKey, 
  onNavigateHome, 
  onShowShortcuts 
}) => {
  const { theme, setTheme } = useTheme();
  
  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.value === theme);
    const nextIndex = (currentIndex + 1) % THEMES.length;
    setTheme(THEMES[nextIndex].value);
  };

  const ThemeIcon = THEMES.find(t => t.value === theme)?.icon || Moon;

  return (
    <header className="sticky top-4 z-50 mx-auto w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-[1400px]">
      <div className="glass-panel rounded-2xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center backdrop-blur-md">
        <button 
          onClick={onNavigateHome}
          className="flex items-center gap-3 md:gap-4 group transition-opacity hover:opacity-80"
          aria-label="Go to Home"
        >
          <div className="relative flex h-9 w-9 md:h-11 md:w-11 items-center justify-center rounded-xl bg-slate-900/50 border border-white/10 shadow-inner group-hover:border-violet-500/50 transition-colors">
             <PenTool className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div className="text-left">
            <h1 className="text-lg md:text-xl font-extrabold text-white tracking-tight font-sans flex items-center gap-2">
              Flash-n-Frame <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-mono text-slate-400 border border-white/5 hidden sm:inline-block">Studio</span>
            </h1>
            <p className="text-xs font-mono text-slate-400 tracking-wider uppercase hidden sm:block">Visual Intelligence Platform</p>
          </div>
        </button>
        <div className="flex items-center gap-4">
          {hasApiKey && (
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-widest cursor-help" title="API Key Active">
                  <CreditCard className="w-3 h-3" /> Paid Tier
              </div>
          )}
          <button
            onClick={cycleTheme}
            className="p-2 md:p-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 transition-all hover:shadow-neon-violet"
            title={`Theme: ${theme} (click to cycle)`}
            aria-label="Toggle Theme"
          >
            <ThemeIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={onShowShortcuts}
            className="p-2 md:p-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 transition-all hover:shadow-neon-violet"
            title="Keyboard Shortcuts (Shift + ?)"
            aria-label="Keyboard Shortcuts"
          >
            <Keyboard className="w-5 h-5" />
          </button>
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noreferrer" 
            className="p-2 md:p-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-white hover:border-violet-500/50 transition-all hover:shadow-neon-violet"
            aria-label="View on GitHub"
          >
            <Github className="w-5 h-5" />
          </a>
        </div>
      </div>
    </header>
  );
};
