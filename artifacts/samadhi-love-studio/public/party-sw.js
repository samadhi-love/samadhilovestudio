const CACHE = "samadhi-party-shell-v3";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/party-offline.html",
          "/party-offline.js",
          "/party-runtime.js",
        ]),
      ),
  );
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) => key.startsWith("samadhi-party-shell-") && key !== CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const shell = [
    "/party-offline.html",
    "/party-offline.js",
    "/party-runtime.js",
  ].includes(url.pathname);
  if (shell)
    event.respondWith(
      fetch(event.request).catch(() => caches.match(url.pathname)),
    );
  else if (event.request.mode === "navigate" && url.pathname === "/party")
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/party-offline.html")),
    );
});
