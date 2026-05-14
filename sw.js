const CACHE = 'plan-classe-v3';
const FILES = ['plan de classe.html', 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Stratégie : réseau en premier, cache en fallback (offline uniquement).
// On ne cache QUE :
//   - méthode GET (cache.put rejette les autres méthodes)
//   - même origine (évite de cacher api.github.com et autres → checkForUpdate
//     resterait bloqué sur l'ancienne réponse en offline)
//   - schémas http(s) (évite chrome-extension://, data:, blob:, etc.)
//   - réponses OK (status 2xx) (évite de cacher les erreurs 4xx/5xx)
self.addEventListener('fetch', e => {
  const req = e.request;
  let cacheable = false;
  try {
    const url = new URL(req.url);
    cacheable = req.method === 'GET'
      && url.origin === self.location.origin
      && (url.protocol === 'http:' || url.protocol === 'https:');
  } catch (_) { /* URL invalide → pas cacheable */ }

  e.respondWith(
    fetch(req)
      .then(response => {
        if (cacheable && response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(req))
  );
});
