// Mode hors ligne : les fichiers de l'application sont gardés sur l'appareil.
// Changer VERSION à chaque mise en ligne, sinon les appareils gardent l'ancienne version.
const VERSION = 'carnet-coeur-7';
const FICHIERS = [
  './', './index.html', './styles.css', './icone.svg', './manifest.webmanifest',
  './src/app.js', './src/store.js', './src/modele.js', './src/courbe.js', './src/dates.js', './src/photos.js', './src/alimentation.js', './src/sel-aliments.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((noms) => Promise.all(noms.filter((n) => n !== VERSION).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((garde) => garde ?? fetch(e.request)));
});
