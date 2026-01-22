/**
 * Flash-n-Frame Enhanced Service Worker
 * PWA best practices with advanced caching strategies
 */

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `flash-n-frame-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `flash-n-frame-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `flash-n-frame-images-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/index.css',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-72x72.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

const CACHE_LIMITS = {
  dynamic: 50,
  images: 100
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key.startsWith('flash-n-frame-') && 
            ![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE].includes(key))
          .map((key) => {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim();
});

async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, maxItems);
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
      limitCacheSize(cacheName, CACHE_LIMITS[cacheName.includes('image') ? 'images' : 'dynamic']);
    }
    return response;
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      limitCacheSize(cacheName, CACHE_LIMITS.dynamic);
    }
    return response;
  }).catch(() => cached);
  
  return cached || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') return;
  
  if (url.hostname.includes('googleapis.com') || 
      url.hostname.includes('api.github.com') ||
      url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }
  
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }
  
  if (request.destination === 'image' || 
      url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/i)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }
  
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      url.pathname.match(/\.(css|js|woff2?)$/i)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }
  
  if (request.destination === 'document') {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }
  
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(keys.map((key) => caches.delete(key)));
      })
    );
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Background sync triggered');
}

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Flash-n-Frame', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});
