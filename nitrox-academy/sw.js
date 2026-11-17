// Nitrox Academy moved to /academy/subjects/nitrox/. This replaces the old workbox service
// worker so that returning visitors (whose browser still has the old one installed and
// serving the app from its offline cache) actually get the new redirect page instead of the
// stale cached app: it takes over immediately, wipes every cache this origin's worker owns,
// unregisters itself, and reloads any open tab so it falls through to a normal network
// request. After that, no service worker controls this path at all.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then((clients) => clients.forEach((client) => client.navigate(client.url))),
  );
});
