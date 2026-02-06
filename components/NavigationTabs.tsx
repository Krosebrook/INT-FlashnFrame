
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Home as HomeIcon } from 'lucide-react';
import { ViewMode } from '../types';

interface NavigationTabsProps {
  currentView: ViewMode;
  onNavigate: (mode: ViewMode) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ currentView, onNavigate }) => {
  if (currentView === ViewMode.HOME) return null;

  return (
    <nav aria-label="Main navigation" role="navigation" className="flex justify-center mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 sticky top-24 z-40">
      <div className="glass-panel p-1 md:p-1.5 rounded-full flex relative shadow-2xl backdrop-blur-md" role="tablist" aria-label="Feature tabs">
        <button
          onClick={() => onNavigate(ViewMode.HOME)}
          className="relative flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono text-slate-500 hover:text-slate-300 hover:bg-white/5"
          title="Home (Alt+1)"
          aria-label="Navigate to Home"
          role="tab"
          aria-selected={currentView === ViewMode.HOME}
        >
          <HomeIcon className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-white/10 my-auto mx-1"></div>
        <button
          onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
          className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
            currentView === ViewMode.REPO_ANALYZER
              ? 'text-white bg-white/10 shadow-glass-inset border border-white/10'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="GitFlow (Alt+2)"
          aria-label="GitFlow - GitHub repository analyzer"
          role="tab"
          aria-selected={currentView === ViewMode.REPO_ANALYZER}
        >
          <img src="/images/icon-cloud.png" alt="" className="w-5 h-5 object-contain" />
          <span className="hidden sm:inline">GitFlow</span>
        </button>
        <button
          onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
          className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
            currentView === ViewMode.ARTICLE_INFOGRAPHIC
              ? 'text-emerald-100 bg-emerald-500/10 shadow-glass-inset border border-emerald-500/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="SiteSketch (Alt+3)"
          aria-label="SiteSketch - Article to infographic converter"
          role="tab"
          aria-selected={currentView === ViewMode.ARTICLE_INFOGRAPHIC}
        >
          <img src="/images/icon-analytics.png" alt="" className="w-5 h-5 object-contain" />
          <span className="hidden sm:inline">SiteSketch</span>
        </button>
        <button
          onClick={() => onNavigate(ViewMode.IMAGE_EDITOR)}
          className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
            currentView === ViewMode.IMAGE_EDITOR
              ? 'text-pink-100 bg-pink-500/10 shadow-glass-inset border border-pink-500/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="RealityEngine (Alt+4)"
          aria-label="RealityEngine - AI image style transfer"
          role="tab"
          aria-selected={currentView === ViewMode.IMAGE_EDITOR}
        >
          <img src="/images/icon-creative.png" alt="" className="w-5 h-5 object-contain" />
          <span className="hidden sm:inline">RealityEngine</span>
        </button>
        <button
          onClick={() => onNavigate(ViewMode.DEV_STUDIO)}
          className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
            currentView === ViewMode.DEV_STUDIO
              ? 'text-cyan-100 bg-cyan-500/10 shadow-glass-inset border border-cyan-500/20'
              : 'text-slate-500 hover:text-slate-300'
          }`}
          title="DevStudio (Alt+5)"
          aria-label="DevStudio - Interactive code exploration"
          role="tab"
          aria-selected={currentView === ViewMode.DEV_STUDIO}
        >
          <img src="/images/icon-projects.png" alt="" className="w-5 h-5 object-contain" />
          <span className="hidden sm:inline">DevStudio</span>
        </button>
      </div>
    </nav>
  );
};
