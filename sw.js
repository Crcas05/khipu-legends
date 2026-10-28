// Service Worker: guarda el juego en el dispositivo para que funcione sin internet.
// Cuando cambies archivos del juego, sube el número de VERSION para que los
// celulares descarguen la versión nueva.

const VERSION = "kl-v5";
const CACHE_JUEGO = `juego-${VERSION}`;
const CACHE_PYTHON = "python-314.0.7"; // Pyodide: solo se descarga una vez

const ARCHIVOS = [
  "./",
  "index.html",
  "css/estilos.css",
  "js/app.js",
  "js/python.js",
  "js/python-worker.js",
  "js/tuki.js",
  "js/arte.js",
  "js/sonido.js",
  "misiones/caral-01.json",
  "manifest.webmanifest",
  "img/icono.svg",
  "img/icono-192.png",
  "img/icono-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_JUEGO).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(
        nombres
          .filter((n) => n !== CACHE_JUEGO && n !== CACHE_PYTHON)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // Los juegos nuevos (/chaski/ y /selva/) siempre se cargan frescos desde internet
  if (url.pathname.includes("/chaski/") || url.pathname.includes("/selva/")) return;

  // Python (Pyodide): primero lo guardado; si no está, se descarga y se guarda.
  if (url.hostname === "cdn.jsdelivr.net" && url.pathname.startsWith("/pyodide/")) {
    e.respondWith(
      caches.open(CACHE_PYTHON).then(async (cache) => {
        const guardado = await cache.match(e.request);
        if (guardado) return guardado;
        const respuesta = await fetch(e.request);
        if (respuesta.ok) cache.put(e.request, respuesta.clone());
        return respuesta;
      })
    );
    return;
  }

  // Archivos del juego: primero internet (para ver cambios nuevos);
  // si no hay conexión, lo guardado.
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(e.request)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            caches.open(CACHE_JUEGO).then((c) => c.put(e.request, copia));
          }
          return respuesta;
        })
        .catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
  }
});
