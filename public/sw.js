// Service Worker — Carnet de Collection Agrumes
// v2 — stratégie corrigée :
//   - /api/* : jamais mis en cache (données auth/sync dynamiques)
//   - Navigation HTML : Network-First (toujours la version déployée la plus récente)
//   - Assets statiques (JS/CSS/images) : Cache-First avec mise à jour en arrière-plan
const CACHE = 'agrumes-v2'; // ← incrémenté pour forcer l'invalidation du cache v1
const ASSETS = [];          // pré-cache désactivé — tout se peuple à la demande

self.addEventListener('install', e => {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  // ── /api/* : jamais de cache — toujours réseau ───────────────────────────────
  if (url.pathname.startsWith('/api/')) return; // laisse passer sans interception

  // ── Requêtes de navigation (HTML) : Network-First ───────────────────────────
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            const clone = res.clone(); // clone synchronously before any async op
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(e.request);
          return cached || new Response('Hors ligne — rechargez lorsque vous avez une connexion.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        })
    );
    return;
  }

  // ── Assets statiques (JS/CSS/images) : Cache-First avec màj en arrière-plan ─
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request);
      const networkFetch = fetch(e.request).then(res => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }).catch(() => null);

      if (cached) {
        networkFetch; // mise à jour silencieuse
        return cached;
      }
      return networkFetch || new Response('Ressource indisponible hors ligne.', {
        status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
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
