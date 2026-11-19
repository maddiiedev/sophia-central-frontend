const CACHE_PREFIX = 'sophis-central-';
const CACHE_NAME = 'sophis-central-shell-v10';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/sophis-central-icon.svg',
  '/sophis-central-pwa-icon.svg',
  '/apple-touch-icon.png',
  '/sophis-central-favicon.png',
  '/sophis-central-favicon-32.png',
  '/sophis-central-favicon-48.png',
  '/sophis-central-favicon.ico',
  '/sophis-central-192.png',
  '/sophis-central-512.png',
  '/sophis-central-maskable-512.png',
  '/sophia-central-mark.png',
  '/sophia-central-logo.png'
];

const PUBLIC_ASSET_PATHS = new Set([
  '/manifest.webmanifest',
  '/sophis-central-icon.svg',
  '/sophis-central-pwa-icon.svg',
  '/apple-touch-icon.png',
  '/sophis-central-favicon.png',
  '/sophis-central-favicon-32.png',
  '/sophis-central-favicon-48.png',
  '/sophis-central-favicon.ico',
  '/sophis-central-192.png',
  '/sophis-central-512.png',
  '/sophis-central-maskable-512.png',
  '/sophia-central-mark.png',
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
    event.respondWith((async () => {
      const cachedShell = await caches.match('/index.html') || await caches.match('/');
      let timeoutId;

      // Prefer the deployed HTML when the network is healthy, but don't leave
      // a reload blocked indefinitely by a sleeping or unstable origin.
      const networkRequest = fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
        }
        return response;
      });

      try {
        return await Promise.race([
          networkRequest,
          new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Navigation network timeout')), 2500);
          })
        ]);
      } catch {
        if (cachedShell) return cachedShell;
        return await networkRequest;
      } finally {
        clearTimeout(timeoutId);
      }
    })());
    return;
  }

  if (!isPublicStaticAsset(request, url)) return;

  event.respondWith(
    (async () => {
      const isBrandAsset = PUBLIC_ASSET_PATHS.has(url.pathname);
      const cached = await caches.match(request);

      // Prefer current deployed brand assets so installed devices can refresh icons.
      if (isBrandAsset) {
        try {
          const response = await fetch(request, { cache: 'no-cache' });
          if (response.ok && response.type === 'basic') {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        } catch {
          return cached || Response.error();
        }
      }

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
    })()
  );
})