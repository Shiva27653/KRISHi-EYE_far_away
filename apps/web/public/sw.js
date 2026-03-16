const CACHE_NAME = 'krish-eye-v2'; // Version bump
const DYNAMIC_CACHE = 'krish-eye-dynamic-v2';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Guardrail: Non-GET requests are ALWAYS NetworkOnly
  if (request.method !== 'GET') return;

  // Guardrail: Do NOT cache Auth, Session, or Socket paths
  if (
    url.pathname.startsWith('/auth') ||
    url.pathname.includes('socket.io') ||
    url.pathname.startsWith('/api/sessions')
  ) {
    return;
  }

  // Strategy: CacheFirst for Static Assets
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|woff2|woff|ttf|otf)$/) ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((fetchRes) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // Strategy: Stale-While-Revalidate for Selective APIs
  // Targeted: Advisor queries, Help, About, and Telemetry summaries
  if (
    url.pathname.startsWith('/rag/') ||
    url.pathname.startsWith('/help') ||
    url.pathname.startsWith('/about') ||
    (url.pathname.startsWith('/telemetry') && request.method === 'GET')
  ) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });

          if (cachedResponse) {
            // Clone the response to add a header indicating it's from cache
            const newHeaders = new Headers(cachedResponse.headers);
            newHeaders.set('X-PWA-Cache', 'HIT');
            newHeaders.set('X-PWA-Cached-At', new Date().toISOString());
            
            const responseClone = new Response(cachedResponse.body, {
              status: cachedResponse.status,
              statusText: cachedResponse.statusText,
              headers: newHeaders
            });
            return responseClone;
          }
          
          return fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy: NetworkOnly for Navigation with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'New update from KRISHi-EYE',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: data.url || '/'
      },
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open App', icon: '/icon-192.png' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'KRISHi-EYE', options)
    );
  } catch (err) {
    console.error('Push error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
