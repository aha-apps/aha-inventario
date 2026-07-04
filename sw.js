// sw.js — Service Worker cache-first para AHA Inventario
var CACHE = 'aha-inventario-v1';
var ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'core/env.js',
  'core/db.js',
  'core/crypto.js',
  'core/ui.js',
  'core/theme.js',
  'core/brand-loader.js',
  'core/app.js',
  'core/search-palette.js',
  'core/file-store.js',
  'core/sync.js',
  'core/license.js',
  'core/feature-flags.js',
  'core/network.js',
  'main.js',
  'modules/inventario/module.js',
  'modules/inventario/module.html',
  'modules/categorias/module.js',
  'modules/categorias/module.html',
  'modules/movimientos/module.js',
  'modules/movimientos/module.html',
  'modules/alertas/module.js',
  'modules/alertas/module.html',
  'modules/reportes/module.js',
  'modules/reportes/module.html',
  'assets/css/tailwind.play.js',
  'assets/css/daisyui.min.css',
  'assets/css/bootstrap-icons.css',
  'assets/js/alpine.js',
  'assets/js/dexie.js',
  'assets/js/crypto-js.js',
  'assets/js/pako.js',
  'assets/js/chart.js',
  'assets/js/qrcode.min.js',
  'assets/js/jszip.js',
  'data/defaults/avatar.svg',
  'data/defaults/placeholder.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(function () { return caches.match('index.html'); })
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(function (r) { return r || fetch(req); })
  );
});
