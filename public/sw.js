// Enhanced service worker: versioned cache, network-first for HTML, update messaging
const BUILD = '2025-08-23T1'; // bump this (or inject at build) each deploy to force update
const CACHE = 'brss-cache-' + BUILD;
// Derive base path from SW scope (works on GitHub Pages subpaths)
const BASE = (() => {
  try { return new URL(self.registration.scope).pathname; } catch { return '/'; }
})();
const APP_SHELL = [
  // Navigation requests will be handled network-first; we still pre-cache a fallback copy.
  `${BASE}`,
  `${BASE}index.html`,
  `${BASE}favicon.svg`,
  `${BASE}manifest.webmanifest`
];
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try { await cache.addAll(APP_SHELL); } catch {}
    // Activate immediately so page can trigger reload if desired
    self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
    // Inform controlled pages a new SW is active
    const clientsList = await self.clients.matchAll({ type: 'window' });
    for (const client of clientsList) {
      try { client.postMessage({ type: 'SW_ACTIVATED', build: BUILD }); } catch {}
    }
  })());
});

// Allow page to request immediate activation / skip waiting
self.addEventListener('message', (event) => {
  if (!event || !event.data) return;
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
// Escape helper for building regex from BASE
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // same origin only
  if (!url.pathname.startsWith(BASE)) return; // only within scope

  // Navigation / index.html: network-first with offline fallback
  if (req.mode === 'navigate' || url.pathname === BASE || url.pathname === BASE + 'index.html') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(`${BASE}index.html`, fresh.clone());
        return fresh;
      } catch {
        // fallback to cached index.html
        const cached = await caches.match(`${BASE}index.html`);
        if (cached) return cached;
        return new Response('<h1>Offline</h1>', { status: 503, headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  const biblesPathRe = new RegExp(`^${escapeRe(BASE)}bibles/`);
  if (biblesPathRe.test(url.pathname)) {
    // Network-first for dynamic Bible JSON
    event.respondWith((async () => {
      try {
        const res = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
        return res;
      } catch {
        const cached = await caches.match(req);
        if (cached) return cached;
        return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
      }
    })());
    return;
  }

  // Static assets: cache-first then network
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
});

// Prompt control (optional): nothing here; browsers will show the install prompt when eligible.
