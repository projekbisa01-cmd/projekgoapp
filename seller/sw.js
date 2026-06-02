const CACHE_NAME = 'seller-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
];

// Proses Instalasi & Caching
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Proses Aktivasi (Membersihkan cache lama jika ada update)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Menghapus cache penjual yang lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Proses Fetch (Agar bisa dibuka saat offline/jaringan lambat)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
