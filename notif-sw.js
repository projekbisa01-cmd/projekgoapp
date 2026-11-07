/*
 * ProjekGo – penerima notifikasi chat (admin & rider)  (7 Nov 2026, tahap 3)
 * Service worker KHUSUS notifikasi, terpisah dari sw.js (tidak menyimpan cache, tidak
 * mengatur halaman). Didaftarkan dengan scope /notif-chat/ supaya tidak mengganggu sw.js.
 * Tautan yang dibuka saat notifikasi diketuk selalu alamat aplikasi sendiri:
 *   chat admin -> /?buka=chat
 *   chat rider -> /?buka=rider&k=<kode order>   (kode dicek: huruf & angka saja)
 * jadi tidak bisa dipakai untuk mengarahkan ke situs lain.
 */
const IKON = 'https://i.ibb.co.com/hJ43nXyc/Whats-App-Image-2026-01-29-at-10-12-08.jpg';
const KODE = /^[A-Za-z0-9]{12,32}$/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let j = {};
  try { j = event.data ? event.data.json() : {}; } catch (e) { j = {}; }
  const d = (j && (j.data || j.notification)) || {};
  const k = KODE.test(String(d.k || '')) ? String(d.k) : '';
  const judul = String(d.judul || d.title || 'ProjekGo').slice(0, 80);
  const isi = String(d.isi || d.body || (k ? 'Ada pesan baru dari rider' : 'Ada pesan baru dari admin')).slice(0, 160);
  event.waitUntil((async () => {
    const semua = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    // Aplikasi sedang dibuka dan terlihat: tidak perlu notifikasi (aplikasi sudah memberi tahu sendiri)
    if (semua.some((c) => c.visibilityState === 'visible' && c.focused)) return;
    await self.registration.showNotification(judul, {
      body: isi,
      icon: IKON,
      badge: IKON,
      tag: k ? 'chat-rider' : 'chat-admin',
      renotify: true,
      vibrate: [120, 60, 120],
      data: { tautan: k ? '/?buka=rider&k=' + k : '/?buka=chat', k }
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const k = KODE.test(String(data.k || '')) ? String(data.k) : '';
  const tautan = k ? '/?buka=rider&k=' + k : '/?buka=chat';
  event.waitUntil((async () => {
    const semua = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const ada = semua.find((c) => { try { return new URL(c.url).origin === self.location.origin; } catch (e) { return false; } });
    if (ada) {
      try { await ada.focus(); } catch (e) {}
      ada.postMessage(k ? { jenis: 'pc-buka-rider', k } : { jenis: 'pc-buka-chat' });
      return;
    }
    await self.clients.openWindow(tautan);
  })());
});
