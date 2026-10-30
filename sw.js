// Service worker: lưu app vào bộ nhớ đệm để mở được khi không có mạng.
// Đổi số phiên bản mỗi khi cập nhật app để điện thoại tải bản mới.
const CACHE = 'sc-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons.js',
  './fonts/fonts.css',
  './fonts/be-vietnam-pro-400-latin-ext.woff2',
  './fonts/be-vietnam-pro-400-latin.woff2',
  './fonts/be-vietnam-pro-400-vietnamese.woff2',
  './fonts/be-vietnam-pro-500-latin-ext.woff2',
  './fonts/be-vietnam-pro-500-latin.woff2',
  './fonts/be-vietnam-pro-500-vietnamese.woff2',
  './fonts/be-vietnam-pro-600-latin-ext.woff2',
  './fonts/be-vietnam-pro-600-latin.woff2',
  './fonts/be-vietnam-pro-600-vietnamese.woff2',
  './fonts/newsreader-400-latin-ext.woff2',
  './fonts/newsreader-400-latin.woff2',
  './fonts/newsreader-400-vietnamese.woff2'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

// Ưu tiên mạng (để luôn có bản mới), mất mạng thì dùng bản đã lưu.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});

// Bấm vào thông báo nhắc nhở thì mở app.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(list => {
      if (list.length) return list[0].focus();
      return self.clients.openWindow('./');
    })
  );
});
