// Minimal service worker so the page can be installed to the Home Screen.
// Network-only for data; no caching of API responses (they contain financial data).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
