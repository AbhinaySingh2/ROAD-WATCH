const CACHE_NAME = "roadwatch-cache-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  
  // Do NOT cache API endpoints or non-GET requests
  if (e.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") {
          return res;
        }
        const responseToCache = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return res;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page/route navigation fails and is not cached, return home or report page
          if (e.request.mode === "navigate") {
            return caches.match("/") || caches.match("/report");
          }
        });
      })
  );
});
