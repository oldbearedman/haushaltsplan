// workbox-config.cjs
module.exports = {
  // Ordner, in dem Vite ausgibt
  globDirectory: 'dist/',
  // Quelle deines eigenen Service Workers
  swSrc: 'src/sw.js',
  // Ziel für den generierten Service Worker
  swDest: 'dist/sw.js',
  // Welche Dateien precached werden sollen
  globPatterns: [
    '**/*.{html,js,css,png,svg,json,woff2}'
  ]
};
