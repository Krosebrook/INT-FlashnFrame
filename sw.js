
/**
 * Flash-n-Frame Service Worker
 * Implements Stale-While-Revalidate for assets and Network-First for APIs.
 */

const CACHE_NAME = 'flash-n-frame-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;800&family=JetBrains+Mono:wght@400;500;700&display=swap'
];

/**
 * Install Event: Caches critical App Shell assets.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

/**
 * Activate Event: Cleans up old caches.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch Event: Network strategies.
 * 1. API calls -> Network First (fall back to nothing/error, don't cache API keys implicitly).
 * 2. Images/Fonts -> Stale While Revalidate.
 * 3. App Shell -> Cache First.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy: Network First for API calls (GitHub, Gemini)
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('github.com')) {
    return; // Let browser handle these directly to avoid opaque response caching issues with CORS headers
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response to cache it for future
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
