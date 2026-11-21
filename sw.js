const CACHE_NAME = 'family-finance-auto-v1';
// 1. Мгновенная активация нового Service Worker без ожидания
self.addEventListener('install', (event) => {
self.skipWaiting();
});
// 2. Удаление всех старых кэшей и захват управления страницей
self.addEventListener('activate', (event) => {
event.waitUntil(
caches.keys().then((keys) => {
return Promise.all(
keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
);
}).then(() => self.clients.claim())
);
});
// 3. Стратегия Network-First для файлов приложения и Stale-While-Revalidate для библиотек
self.addEventListener('fetch', (event) => {
if (event.request.method !== 'GET') return;
const url = new URL(event.request.url);
// Не кэшируем запросы к Google API (синхронизация и авторизация)
if (url.hostname.includes('googleapis.com') || url.hostname.includes('accounts.google.com')) {
return;
}
// Для файлов вашего сайта (index.html, manifest.json) — ВСЕГДА сначала сеть в обход HTTP-кэша
if (url.origin === self.location.origin) {
event.respondWith(
fetch(event.request.url, { cache: 'no-cache' })
.then((networkResponse) => {
if (networkResponse && networkResponse.ok) {
const copy = networkResponse.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
}
return networkResponse;
})
.catch(() => {
// Если интернета нет — отдаем сохраненную офлайн-копию
return caches.match(event.request).then((cached) => {
return cached || caches.match('./index.html');
});
})
);
return;
}
// Для внешних скриптов (QR, PDF, OCR) — отдаем из кэша быстро, а в фоне обновляем
event.respondWith(
caches.match(event.request).then((cached) => {
const fetchPromise = fetch(event.request).then((networkResponse) => {
if (networkResponse && networkResponse.ok) {
const copy = networkResponse.clone();
caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
}
return networkResponse;
}).catch(() => cached);
return cached || fetchPromise;
})
);
});
