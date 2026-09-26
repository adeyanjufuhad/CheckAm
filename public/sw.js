// CheckAm service worker.
//  1. Offline: the scam rules run in the browser, so the app keeps working with
//     no data. Network first (so deploys show up), cache as fallback.
//  2. Share target: when the installed app receives a share from WhatsApp etc.,
//     the POST is caught here, so the message never reaches the server.

const CACHE = 'checkam-shell-v3';
const SHELL = [
  '/',
  '/css/styles.css',
  '/js/app.js',
  '/js/ui-strings.js',
  '/js/ocr.js',
  '/js/engine/analyze.js',
  '/js/engine/copy.js',
  '/js/engine/domains.js',
  '/js/engine/links.js',
  '/js/engine/rules.js',
  '/js/engine/sources.js',
  '/favicon.svg',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('checkam-shell-') && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith(receiveShare(request));
    return;
  }
  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) return;

  event.respondWith((async () => {
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        const copy = response.clone();
        const key = request.mode === 'navigate' ? '/' : request;
        caches.open(CACHE).then((c) => c.put(key, copy));
      }
      return response;
    } catch {
      const cached = await caches.match(request.mode === 'navigate' ? '/' : request, { ignoreSearch: request.mode === 'navigate' });
      return cached || Response.error();
    }
  })());
});

async function receiveShare(request) {
  try {
    const form = await request.formData();
    const text = ['title', 'text', 'url']
      .map((k) => form.get(k))
      .filter((v) => typeof v === 'string' && v.trim())
      .join('\n');
    const image = form.getAll('image').find((f) => f && typeof f === 'object' && f.size > 0);
    const cache = await caches.open('checkam-share');
    await cache.put('/_share/text', new Response(text));
    if (image) await cache.put('/_share/image', new Response(image, { headers: { 'Content-Type': image.type || 'image/png' } }));
    else await cache.delete('/_share/image');
    return Response.redirect('/?shared=1', 303);
  } catch {
    return Response.redirect('/?shared=failed', 303);
  }
}
