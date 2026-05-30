const CACHE_NAME = 'projekgo-mitra-v2';
const urlsToCache = [
  './',
  './index.html'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Memaksa Service Worker langsung aktif
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim()); // Langsung mengambil alih kontrol halaman
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
