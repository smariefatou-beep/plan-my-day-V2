// Bump this version string whenever index.html changes meaningfully — it's
// what forces installed devices to fetch the new version instead of
// serving a stale cached copy forever.
const CACHE_NAME = 'plan-the-day-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to get the latest version while online, and
// only fall back to the cache if the network is unreachable (offline use).
// The previous cache-first strategy served a stale copy instantly on every
// load and only refreshed in the background — meaning a device that had
// ever visited the app could keep running old code indefinitely, no matter
// how many times the app itself was updated and redeployed.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Same-origin files are revalidated with the server on every load ('no-cache'), so the
  // browser's HTTP cache (GitHub Pages: max-age=600) can't serve a 10-minute-old page
  // right after a deploy.
  const sameOrigin = new URL(event.request.url).origin === self.location.origin;
  const request = sameOrigin ? fetch(event.request.url, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(event.request);
  event.respondWith(
    request.then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
      }
      return networkResponse;
    }).catch(() => caches.match(event.request))
  );
});
