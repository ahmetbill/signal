/* SİNYAL — çevrimdışı önbellek.
   Önce önbellekten açılır (metroda internet yokken de çalışır), arka planda
   güncel sürüm indirilir; değişiklikler bir sonraki açılışta görünür. */
const CACHE = 'sinyal-v1';
const FILES = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './js/core.js', './js/r1.js', './js/app.js', './js/touch.js',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true });
    const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || (req.mode === 'navigate' ? c.match('./index.html') : Response.error());
  }));
});
