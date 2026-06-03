const CACHE_NAME = 'projekgo-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event (Menyimpan aset penting)
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// 2. Activate Event (Membersihkan cache versi lama agar tidak memakan memori)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event (Pola: Stale-while-revalidate dengan Offline Fallback)
self.addEventListener('fetch', (event) => {
  // Hanya proses metode GET, abaikan POST dll (karena untuk simpan data ke Firebase)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Selalu coba ambil dari internet (network) untuk update di latar belakang
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika internet mati (offline) dan user membuka halaman (HTML), arahkan ke index.html yang ada di cache
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });

      // Segera tampilkan dari cache jika ada (agar cepat), jika belum ada tunggu hasil dari internet
      return cachedResponse || fetchPromise;
    })
  );
});
