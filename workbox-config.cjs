// workbox-config.cjs
module.exports = {
  globDirectory: 'dist/',
  swDest: 'dist/sw.js',
  globPatterns: [
    '**/*.{html,js,css,png,svg,json,woff2}'
  ],
  skipWaiting: true,
  clientsClaim: true,
  runtimeCaching: [
    {
      urlPattern: /^\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache-v1',
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|woff2?)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'asset-cache-v1',
        expiration: { maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] }
      }
    },
    {
      urlPattern: ({request}) => request.method === 'GET',
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'misc-cache-v1',
        expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] }
      }
    }
  ]
};
