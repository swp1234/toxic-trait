const CACHE_NAME = 'toxic-trait-v1';
const ASSETS = [
  '/toxic-trait/',
  '/toxic-trait/index.html',
  '/toxic-trait/css/style.css',
  '/toxic-trait/js/app.js',
  '/toxic-trait/js/i18n.js',
  '/toxic-trait/js/locales/ko.json',
  '/toxic-trait/js/locales/en.json',
  '/toxic-trait/js/locales/ja.json',
  '/toxic-trait/js/locales/zh.json',
  '/toxic-trait/js/locales/hi.json',
  '/toxic-trait/js/locales/ru.json',
  '/toxic-trait/js/locales/es.json',
  '/toxic-trait/js/locales/pt.json',
  '/toxic-trait/js/locales/id.json',
  '/toxic-trait/js/locales/tr.json',
  '/toxic-trait/js/locales/de.json',
  '/toxic-trait/js/locales/fr.json',
  '/toxic-trait/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
