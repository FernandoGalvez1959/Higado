const CACHE = "higado21-v10";
const FILES = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(FILES.map(f => fetch(f, { cache: "reload" }).then(r => { if (r && r.ok) return c.put(f, r); })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  let url;
  try { url = new URL(e.request.url); } catch (err) { return; }
  if (url.origin !== self.location.origin) return;
  const esPagina = e.request.mode === "navigate" || url.pathname.endsWith("/") || /\.(html|json)$/.test(url.pathname);
  if (esPagina) {
    // Primero la red (así las actualizaciones llegan a la primera); sin conexión, lo guardado.
    e.respondWith(
      fetch(url.href, { cache: "reload", credentials: "same-origin" })
        .then(r => {
          if (r && r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {}); }
          return r;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
    );
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
