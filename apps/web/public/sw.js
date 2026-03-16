const CACHE_NAME = 'krish-eye-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico',
];

// Extend with Next.js static assets pattern in fetch if needed, 
// but for install we cache the shells.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
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
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
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

  // Guardrail: Only GET requests are considered for caching
  if (request.method !== 'GET') return;

  // Guardrail: Do NOT cache API, Auth, Advisor, Telemetry, or Session routes
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.startsWith('/auth') ||
    url.pathname.startsWith('/rag') ||
    url.pathname.startsWith('/telemetry') ||
    url.pathname.startsWith('/v1')
  ) {
    return;
  }

  // Strategy: CacheFirst for Static Assets (_next/static, images, fonts)
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

  // Strategy: NetworkOnly for everything else (HTML documents, etc.) 
  // with Offline Fallback for Navigation failures
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline');
      })
    );
    return;
  }
});
