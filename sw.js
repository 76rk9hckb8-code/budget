const CACHE_NAME = 'family-finance-auto-v2';
self.addEventListener('install', (event) => {
self.skipWaiting();
});
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((keys) => {
return Promise.all(
keys.map((key) => caches.delete(key))
);
}).then(() => self.clients.claim())
);
});
self.addEventListener('fetch', (event) => {
if (event.request.method !== 'GET') return;
const url = new URL(event.request.url);
if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) {
return;
}
if (url.origin === self.location.origin) {
event.respondWith(
fetch(event.request, { cache: 'no-store' })
.then((networkResponse) => {
if (networkResponse && networkResponse.ok) {
const copy = networkResponse.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
}
return networkResponse;
})
.catch(() => caches.match(event.request))
);
return;
}
event.respondWith(
caches.match(event.request).then((cached) => {
return cached || fetch(event.request);
})
);
});
