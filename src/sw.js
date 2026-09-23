// Service worker. The build writes it to dist/sw.js with the cache version stamped in (see vite.config.js).
//
// The app page is network-first: when online you always get the latest release,
// and with no signal (or a connection slower than NETWORK_TIMEOUT_MS) you get the
// last copy that loaded. Icons and the manifest are cache-first.

const CACHE = "gym-__CACHE_VERSION__";
const PAGE = "./index.html";
const ASSETS = [
  PAGE,
  "./manifest.webmanifest",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-1024.png",
];
const NETWORK_TIMEOUT_MS = 4000;

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((url) => new Request(url, { cache: "reload" }))))
      .catch(() => {}),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(request.mode === "navigate" ? pageNetworkFirst(request) : assetCacheFirst(request));
});

// It's a single-page app, so every navigation is the app page, cached under PAGE.
async function pageNetworkFirst(request) {
  const cache = await caches.open(CACHE);
  // "no-cache" revalidates with the server instead of trusting the HTTP cache.
  const network = fetch(request.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => {
    if (res.ok) cache.put(PAGE, res.clone());
    return res;
  });
  network.catch(() => {});
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(reject, NETWORK_TIMEOUT_MS);
  });
  try {
    return await Promise.race([network, timeout]);
  } catch {
    return (await cache.match(PAGE)) || network;
  } finally {
    clearTimeout(timer);
  }
}

async function assetCacheFirst(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) {
    const cache = await caches.open(CACHE);
    cache.put(request, res.clone());
  }
  return res;
}
