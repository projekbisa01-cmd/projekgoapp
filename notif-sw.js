/*
 * ProjekGo – penerima notifikasi chat admin (7 Nov 2026)
 * Service worker KHUSUS notifikasi, terpisah dari sw.js (tidak menyimpan cache, tidak
 * mengatur halaman). Didaftarkan dengan scope /notif-chat/ supaya tidak mengganggu sw.js.
 * Tautan yang dibuka saat notifikasi diketuk selalu tetap (/?buka=chat), tidak diambil
 * dari isi pesan, jadi tidak bisa dipakai untuk mengarahkan ke situs lain.
 */
const IKON = 'https://i.ibb.co.com/hJ43nXyc/Whats-App-Image-2026-01-29-at-10-12-08.jpg';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let j = {};
  try { j = event.data ? event.data.json() : {}; } catch (e) { j = {}; }
  const d = (j && (j.data || j.notification)) || {};
  const judul = String(d.judul || d.title || 'ProjekGo').slice(0, 80);
  const isi = String(d.isi || d.body || 'Ada pesan baru dari admin').slice(0, 160);
  event.waitUntil((async () => {
    const semua = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Aplikasi sedang dibuka dan terlihat: tidak perlu notifikasi (aplikasi sudah memberi tahu sendiri)
    if (semua.some((c) => c.visibilityState === 'visible' && c.focused)) return;
    await self.registration.showNotification(judul, {
      body: isi,
      icon: IKON,
      badge: IKON,
      tag: 'chat-admin',
      renotify: true,
      vibrate: [120, 60, 120],
      data: { tautan: '/?buka=chat' }
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const semua = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ada = semua.find((c) => { try { return new URL(c.url).origin === self.location.origin; } catch (e) { return false; } });
    if (ada) {
      try { await ada.focus(); } catch (e) {}
      ada.postMessage({ jenis: 'pc-buka-chat' });
      return;
    }
    await self.clients.openWindow('/?buka=chat');
  })());
});
