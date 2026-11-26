// Écrit au build par vite.config.ts (D206). Ne pas modifier à la main.
const CACHE = "visualiseur-coeur-26-nov-12-13-ec07895";
const FICHIERS = ["./","./icone.svg","./manifest.webmanifest","./assets/index-D6AnGll4.css","./assets/index-DTrmWBYU.js","./assets/contraction.worker-BHm8l0lA.js","./assets/jonctions.worker-rannNxD7.js"];
const PREFIXE = 'visualiseur-coeur-';
const CARNET = new URL('./essai-carnet/', self.location).href;

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((noms) => Promise.all(noms.filter((n) => n.startsWith(PREFIXE) && n !== CACHE).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || e.request.url.startsWith(CARNET)) return;
  // Une ouverture de page (même avec ?vtd=…) reçoit la page gardée ; le reste, le fichier gardé s'il existe.
  // ignoreVary : un serveur qui répond « Vary: Origin » ferait refuser la copie aux scripts chargés en « crossorigin ».
  const cle = e.request.mode === 'navigate' ? './' : e.request;
  e.respondWith(caches.open(CACHE).then((c) => c.match(cle, { ignoreSearch: true, ignoreVary: true })).then((garde) => garde ?? fetch(e.request)));
});
