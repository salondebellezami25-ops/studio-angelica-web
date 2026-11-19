// Service worker mínimo: permite instalar la app. No guarda caché, así siempre se ve la versión publicada.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
