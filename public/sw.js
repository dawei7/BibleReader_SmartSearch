// Simple service worker for offline-first caching of app shell and Bible assets
const CACHE = 'brss-cache-v1';
// Derive base path from SW scope (works on GitHub Pages subpaths)
const BASE = (() => {
  try { return new URL(self.registration.scope).pathname; } catch { return '/'; }
})();
const APP_SHELL = [
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}favicon.svg`,
  `${BASE}manifest.webmanifest`
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(APP_SHELL); } catch {}
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});
// Escape helper for building regex from BASE
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Only handle same-origin
  if (url.origin !== location.origin) return;
  // Only handle requests within our scope/base path
  if (!url.pathname.startsWith(BASE)) return;
  // Network-first for bibles JSON to keep fresh; cache-first for app shell
  const biblesPathRe = new RegExp(`^${escapeRe(BASE)}bibles/`);
  if (biblesPathRe.test(url.pathname)) {
    event.respondWith((async () => {
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw new Error('offline');
      }
    })());
  } else {
    event.respondWith((async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      try {
        const res = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        return new Response('', { status: 408 });
      }
    })());
  }
});

// Prompt control (optional): nothing here; browsers will show the install prompt when eligible.
