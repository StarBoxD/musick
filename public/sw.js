const CACHE_NAME = "vybe-static-v4";

// Yalnızca güvenli statik varlıklar ön-önbelleğe (pre-cache) alınır
const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .catch(() => {
        // Precache hatası service worker kurulumunu engellememeli
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // 1. Farklı origin isteklerini (Audius audio akışı, harici API'ler) service worker dışında bırak
  if (url.origin !== self.location.origin) return;

  // 2. Gizlilik ve Güvenlik: /dashboard, /api, /auth, /login ve kullanıcıya özel hiçbir sayfayı cache'e alma
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/login") ||
    url.pathname === "/dashboard" ||
    url.pathname.startsWith("/dashboard/")
  ) {
    return;
  }

  // 3. Kullanıcı oturumu gerektiren veya HTML navigasyon isteklerini doğrudan ağa bırak
  // Farklı hesapla giriş ve çıkış senaryolarında önceki kullanıcıya ait HTML asla gösterilmez
  if (event.request.mode === "navigate") {
    return;
  }

  // 4. Yalnızca güvenli, derlenmiş statik varlıkları önbellekle (JS, CSS, ikonlar)
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          // event.waitUntil ile yazmanın tamamlanması güvenceye alınır
          event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache))
          );
          return networkResponse;
        });
      })
    );
  }
});
