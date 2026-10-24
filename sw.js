const CACHE_VERSION = 'v2026-10-23-1'; // МЕНЯТЬ ПРИ КАЖДОМ ДЕПЛОЕ
const CACHE_NAME = `dorozhnik-${CACHE_VERSION}`;
const PRECACHE = ['/', '/index.html', '/assets/css/styles.css', '/assets/js/app.js', '/favicon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k.startsWith('dorozhnik-') && k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    e.respondWith(staleWhileRevalidate(request));
    return;
  }

  if (/\.(css|js|png|jpg|jpeg|webp|avif|svg|woff2?|ttf|ico)$/i.test(url.pathname)) {
    e.respondWith(cacheFirst(request));
    return;
  }
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone());
    return res;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}