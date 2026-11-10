// XOXO — My Bunny : mode hors connexion
// Tous les fichiers essentiels du jeu sont enregistrés lors de la première visite.
const CACHE_NAME = 'xoxo-bunny-offline-v2';

const APP_FILES = [
  './',
  './index.html',
  './offline.html',
  './manifest.json',
  './icon.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('xoxo-bunny-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Le jeu s'ouvre immédiatement depuis le cache, même sans Internet.
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Les fichiers supplémentaires chargés pendant le jeu sont aussi conservés.
          if (networkResponse && networkResponse.ok && new URL(event.request.url).origin === self.location.origin) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Si l'utilisateur navigue vers une page sans connexion,
          // on renvoie le jeu ou la page de secours.
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html').then((response) => response || caches.match('./offline.html'));
          }
          return caches.match('./offline.html');
        });
    })
  );
});
