const CACHE_PREFIX = 'sophis-central-';
const CACHE_NAME = 'sophis-central-shell-v11';
const APP_SHELL = ['/index.html', '/manifest.webmanifest'];

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
    // Vite emits content-hashed production assets, so cache-first is safe.
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
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Keep the shell install resilient if an optional manifest is unavailable.
    await Promise.allSettled(APP_SHELL.map(async (path) => {
      const response = await fetch(path, { cache: 'reload' });
      if (response.ok && response.type === 'basic') {
        await cache.put(path, response);
      }
    }));
    await self.skipWaiting();
  })());
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

  // Never intercept cross-origin, non-GET, API, or authentication requests.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.includes('/auth/')) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        // Always ask the deployment for the current app shell first. Do not
        // replace a slow but reachable deployment with a stale cached document.
        const response = await fetch(request, { cache: 'no-store' });
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
        }
        return response;
      } catch {
        // The cached shell is an offline fallback only, never the normal refresh path.
        const cachedShell = await caches.match('/index.html');
        if (cachedShell) return cachedShell;
        return Response.error();
      }
    })());
    return;
  }

  if (!isPublicStaticAsset(request, url)) return;

  event.respondWith((async () => {
    const isBrandAsset = PUBLIC_ASSET_PATHS.has(url.pathname);
    const cached = await caches.match(request);

    // Brand assets are checked against the deployment so updated icons/logos
    // are not trapped behind an old cache entry.
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

    // Content-hashed build assets are immutable; a new deployment references
    // new filenames and therefore cannot accidentally reuse old code.
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
  })());
});
