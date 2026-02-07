
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SplashPage from './components/SplashPage';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import UserSettingsModal from './components/UserSettingsModal';
import { AppHeader } from './components/AppHeader';
import { NavigationTabs } from './components/NavigationTabs';
import { ViewMode } from './types';
import { Loader2 } from 'lucide-react';
import { ProjectProvider } from './contexts/ProjectContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { UserSettingsProvider } from './contexts/UserSettingsContext';
import { InstallPrompt, OfflineIndicator, OnlineIndicator, UpdatePrompt } from './components/PWAPrompts';
import { RateLimitProvider, useRateLimitContext } from './contexts/RateLimitContext';
import { RateLimitBanner } from './components/RateLimitBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: false,
    },
  },
});

// Lazy load heavy feature components for PWA performance optimization
const RepoAnalyzer = lazy(() => import('./components/RepoAnalyzer'));
const ArticleToInfographic = lazy(() => import('./components/ArticleToInfographic'));
const ImageEditor = lazy(() => import('./components/ImageEditor'));
const Home = lazy(() => import('./components/Home'));
const DevStudio = lazy(() => import('./components/DevStudio'));

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.HOME);
  const [showIntro, setShowIntro] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleNavigate = useCallback((mode: ViewMode) => {
    setCurrentView(mode);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Navigation: Alt + 1-5
      if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case '1': handleNavigate(ViewMode.HOME); break;
          case '2': handleNavigate(ViewMode.REPO_ANALYZER); break;
          case '3': handleNavigate(ViewMode.ARTICLE_INFOGRAPHIC); break;
          case '4': handleNavigate(ViewMode.IMAGE_EDITOR); break;
          case '5': handleNavigate(ViewMode.DEV_STUDIO); break;
        }
      }

      // Help: Shift + ?
      if (e.shiftKey && e.key === '?') {
        setShowShortcuts(prev => !prev);
      }

      // Close Modals: Escape
      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNavigate]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  // Suspense Fallback
  const PageLoader = () => (
    <div className="h-[60vh] flex items-center justify-center">
       <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-500">
      {showIntro && <SplashPage onComplete={handleIntroComplete} />}
      
      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}

      <AppHeader 
        hasApiKey={true} 
        onNavigateHome={() => setCurrentView(ViewMode.HOME)} 
        onShowShortcuts={() => setShowShortcuts(true)} 
      />

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        <NavigationTabs currentView={currentView} onNavigate={handleNavigate} />

        <div className="flex-1">
            <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                {currentView === ViewMode.HOME && (
                    <Home onNavigate={handleNavigate} />
                )}
                {currentView === ViewMode.REPO_ANALYZER && (
                    <ErrorBoundary>
                    <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                        <RepoAnalyzer 
                            onNavigate={handleNavigate} 
                        />
                    </div>
                    </ErrorBoundary>
                )}
                {currentView === ViewMode.ARTICLE_INFOGRAPHIC && (
                    <ErrorBoundary>
                    <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                        <ArticleToInfographic />
                    </div>
                    </ErrorBoundary>
                )}
                {currentView === ViewMode.IMAGE_EDITOR && (
                    <ErrorBoundary>
                    <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                        <ImageEditor 
                            onNavigate={handleNavigate}
                        />
                    </div>
                    </ErrorBoundary>
                )}
                {currentView === ViewMode.DEV_STUDIO && (
                    <ErrorBoundary>
                    <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                        <DevStudio onNavigate={handleNavigate} />
                    </div>
                    </ErrorBoundary>
                )}
                </ErrorBoundary>
            </Suspense>
        </div>
      </main>

      <footer className="py-6 mt-auto border-t border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="text-xs font-mono text-slate-600">
            <span className="text-violet-500/70">link</span>:<span className="text-emerald-500/70">ink</span>$ Powered by Nano Banana Pro | Press <kbd className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-md text-slate-400">Shift + ?</kbd> for shortcuts
          </p>
        </div>
      </footer>
    </div>
  );
};

const GlobalRateLimitBanner: React.FC = () => {
  const { isRateLimited, service, remainingSeconds, clearRateLimit } = useRateLimitContext();
  
  if (!isRateLimited) return null;
  
  return (
    <RateLimitBanner
      service={service}
      remainingSeconds={remainingSeconds}
      onDismiss={clearRateLimit}
    />
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UserSettingsProvider>
          <ToastProvider>
          <RateLimitProvider>
            <ProjectProvider>
              <ErrorBoundary>
              <AppContent />
              </ErrorBoundary>
              <GlobalRateLimitBanner />
              <UserSettingsModal />
              <OfflineIndicator />
              <OnlineIndicator />
              <InstallPrompt />
              <UpdatePrompt />
            </ProjectProvider>
          </RateLimitProvider>
          </ToastProvider>
        </UserSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
