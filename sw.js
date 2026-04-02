// Service Worker — Carnet de Collection Agrumes
// Stratégie : Cache-First pour les assets statiques, Network-First pour les données
const CACHE = 'agrumes-v1';
const ASSETS = ['./'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Ne gérer que les requêtes GET du même origine
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);

      // Cache-first : retourner le cache immédiatement, mettre à jour en arrière-plan
      if (cached) {
        networkFetch; // mise à jour silencieuse
        return cached;
      }
      // Pas de cache : attendre le réseau
      return networkFetch || new Response('Hors ligne — rechargez lorsque vous avez une connexion.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    })
  );
});

// Réception des notifications push
self.addEventListener('push', e => {
  if (!e.data) return;
  let data;
  try { data = e.data.json(); } catch { data = { title: 'Agrumes', body: e.data.text() }; }
  e.waitUntil(
    self.registration.showNotification(data.title || 'Carnet Agrumes', {
      body: data.body || '',
      icon: './icon.svg',
      badge: './icon.svg',
      tag: data.tag || 'agrumes',
      data: data.url ? { url: data.url } : {}
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || './';
  e.waitUntil(clients.openWindow(url));
});
