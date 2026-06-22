const CACHE_NAME = 'projekgo-cache-v3'; // Naikkan versi cache agar cache lama di-reset
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install Event (Menyimpan aset penting)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Memaksa service worker baru untuk langsung aktif
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
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Memastikan SW langsung mengontrol halaman
  );
});

// 3. Fetch Event (Pola: Network-First untuk HTML, Stale-while-revalidate untuk aset lain)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // STRATEGI 1: NETWORK-FIRST (Khusus untuk file HTML / Navigasi Aplikasi)
  // Agar aplikasi selalu mengecek update terbaru di server terlebih dahulu
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Jika sukses ambil versi terbaru dari internet, simpan ke cache lalu tampilkan
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Jika HP offline/tanpa internet, baru ambil dari memori cache
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
  } 
  // STRATEGI 2: STALE-WHILE-REVALIDATE (Untuk file pendukung seperti gambar, manifest)
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {}); // Abaikan error fetch di latar belakang

        // Segera tampilkan dari cache jika ada, sambil memperbarui di latar belakang
        return cachedResponse || fetchPromise;
      })
    );
  }
});
