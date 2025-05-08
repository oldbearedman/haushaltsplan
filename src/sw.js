// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkOnly, NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { BackgroundSyncPlugin } from 'workbox-background-sync';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// 0) Automatisch aktivieren und Clients übernehmen
self.skipWaiting();
self.addEventListener('activate', () => self.clients.claim());

// 1) Precache-Manifest (wird von Workbox injectiert)
precacheAndRoute(self.__WB_MANIFEST);

// 2) Background Sync für POST /api/tasks
const bgSyncPlugin = new BackgroundSyncPlugin('taskQueue', {
  maxRetentionTime: 24 * 60 // bis zu 24 Stunden retry
});
registerRoute(
  /\/api\/tasks/,
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

// 3) API-GET-Fallback (NetworkFirst)
registerRoute(
  /^\/api\/.*$/i,
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  }),
  'GET'
);

// 4) Bilder & Fonts: CacheFirst
registerRoute(
  /\.(?:png|jpg|jpeg|svg|woff2?)$/i,
  new CacheFirst({
    cacheName: 'asset-cache-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);

// 5) Alle übrigen GET-Requests: StaleWhileRevalidate
registerRoute(
  ({ request }) => request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'misc-cache-v1',
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }),
      new CacheableResponsePlugin({ statuses: [0, 200] })
    ]
  })
);
