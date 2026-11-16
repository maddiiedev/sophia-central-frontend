const CACHE_PREFIX = 'sophis-central-';
const CACHE_NAME = 'sophis-central-shell-v3';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/sophis-central-pwa-icon.svg',
  '/sophis-central-favicon.ico',
  '/sophis-central-favicon.png',
  '/sophia-central-logo.png'
];

const PUBLIC_ASSET_PATHS = new Set([
  '/manifest.webmanifest',
  '/sophis-central-pwa-icon.svg',
  '/sophis-central-favicon.ico',
  '/sophis-central-favicon.png',
  '/sophia-central-logo.png'
]);

function isPublicStaticAsset(request, url) {
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    return url.pathname.startsWith('/assets/');
  }

  if (request.destination === 'image') {
    return url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/images/') ||
      PUBLIC_ASSET_PATHS.has(url.pathname);
  }

  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache cross-origin, non-GET, API, or authentication requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(async () => (await caches.match('/index.html')) || (await caches.match('/')))
    );
    return;
  }

  // Only cache versioned app bundles and explicitly public static assets.
  // User uploads, API responses, and other potentially private images are network-only.
  if (!isPublicStaticAsset(request, url)) return;

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      } catch {
        return Response.error();
      }
    })
  );
});
