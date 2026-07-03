const CACHE_NAME = 'projekgo-cache-v4'; // Versi dinaikkan
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// TAMBAHAN 1: Standar PWABuilder untuk menerima perintah update dari halaman
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

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

// 3. Fetch Event
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // --- TAMBAHAN 2: MENGABAIKAN REQUEST FIREBASE & API ---
  // Sangat penting agar data Realtime (onSnapshot) warung & menu tidak ngaco.
  // Biarkan SDK Firebase yang mengatur cache datanya sendiri.
  if (url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('firebase') || 
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('google.com')) {
    return; // Lepaskan dari cengkraman Service Worker (Bypass)
  }

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
  // STRATEGI 2: STALE-WHILE-REVALIDATE (Untuk file pendukung seperti gambar internal, manifest)
  else {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Hanya cache response yang valid (menghindari error cache gambar dari ImgBB yang strict CORS)
          if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 0)) {
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
