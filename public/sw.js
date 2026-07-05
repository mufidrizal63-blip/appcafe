const CACHE_NAME = 'appcafe-pwa-cache-v1';

// Install event: cache basic assets (optional, we can just keep it empty to bypass caching overhead)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: minimal fetch listener is required by PWA standards to trigger the install prompt
self.addEventListener('fetch', (event) => {
  // We don't intercept fetches and cache them because Next.js handles its own routing and caching.
  // Just let the network handle it.
  event.respondWith(fetch(event.request));
});
