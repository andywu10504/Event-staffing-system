const CACHE_NAME = 'roster-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  // 圖示（若存在）
  './icons/icon-192.png',
  './icons/icon-512.png',
  // CDN 資源一般無法預存快取，但可在 runtime cache
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // 優先回應快取，取不到再抓網路
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // 只快取 GET 且同源的請求
        if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      }).catch(() => {
        // 簡單離線處理：若請求 HTML，回 index（讓 SPA 可離線開啟）
        if (req.headers.get('accept')?.includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
