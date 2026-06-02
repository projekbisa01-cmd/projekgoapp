const CACHE_NAME = 'admin-projekgo-v1';

// Daftar file awal yang wajib disimpan saat instalasi
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://i.ibb.co.com/jvsG9cZD/PROJEKITA-10.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache admin');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika file ada di cache, gunakan itu. Jika tidak, ambil dari internet.
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  // Membersihkan cache lama jika ada update
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
