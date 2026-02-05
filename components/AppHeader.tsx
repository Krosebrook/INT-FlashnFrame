
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { PenTool, Keyboard, Github, Sun, Moon, Palette, Settings, LogIn, LogOut, User } from 'lucide-react';
import { ViewMode } from '../types';
import { useTheme, Theme } from '../contexts/ThemeContext';
import { useUserSettings } from '../contexts/UserSettingsContext';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

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
  const { openSettings, hasKey } = useUserSettings();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hasUserKeys = hasKey('geminiKey') || hasKey('githubToken');
  
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
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
                {user.profileImageUrl ? (
                  <img src={user.profileImageUrl} alt="" className="w-5 h-5 rounded-full" />
                ) : (
                  <User className="w-4 h-4 text-violet-400" />
                )}
                <span className="text-xs font-medium text-violet-300">
                  {user.firstName || user.email?.split('@')[0] || 'User'}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 md:p-2.5 rounded-xl bg-slate-900/50 border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/50 transition-all"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500 text-white font-medium hover:bg-violet-600 transition-all"
              disabled={isLoading}
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
          )}
          <button
            onClick={openSettings}
            className={`p-2 md:p-2.5 rounded-xl bg-slate-900/50 border text-slate-400 hover:text-white transition-all hover:shadow-neon-violet ${
              hasUserKeys ? 'border-emerald-500/50 text-emerald-400' : 'border-white/10 hover:border-violet-500/50'
            }`}
            title="API Keys & Settings"
            aria-label="API Keys & Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
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
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
};
