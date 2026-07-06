/* ====================================================================
   SIGN ON — Service Worker
   Caches the app shell so it loads instantly with zero network,
   fully offline, after the first successful visit.
   ==================================================================== */

const CACHE_NAME = 'signon-app-v3';

// Every file that makes up the app shell.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json'
];

// On install: pre-cache the app shell and activate immediately.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// On activate: clean up any old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// On fetch: cache-first strategy — serve from cache, fall back to
// network, and fall back further to the cached index.html for any
// navigation request (keeps the app usable if fully offline).
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Cache a copy of successful same-origin responses for next time.
          if (response && response.status === 200 && event.request.method === 'GET'){
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate'){
            return caches.match('./index.html');
          }
        });
    })
  );
});
