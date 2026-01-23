import { useState, useEffect, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
}

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdateAvailable: false,
    registration: null
  });

  useEffect(() => {
    if (!state.isSupported) return;

    const checkRegistration = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          setState(prev => ({ ...prev, isRegistered: true, registration }));

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setState(prev => ({ ...prev, isUpdateAvailable: true }));
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('SW registration check failed:', error);
      }
    };

    checkRegistration();

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, [state.isSupported]);

  const update = useCallback(async () => {
    if (!state.registration) return false;
    
    try {
      await state.registration.update();
      return true;
    } catch (error) {
      console.error('SW update failed:', error);
      return false;
    }
  }, [state.registration]);

  const skipWaiting = useCallback(() => {
    if (state.registration?.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [state.registration]);

  const unregister = useCallback(async () => {
    if (!state.registration) return false;
    
    try {
      const success = await state.registration.unregister();
      if (success) {
        setState(prev => ({ ...prev, isRegistered: false, registration: null }));
      }
      return success;
    } catch (error) {
      console.error('SW unregister failed:', error);
      return false;
    }
  }, [state.registration]);

  return {
    ...state,
    update,
    skipWaiting,
    unregister
  };
}

export default useServiceWorker;
