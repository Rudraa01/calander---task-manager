const CACHE_NAME = 'taskcal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/styles.css',
  '/js/firebase-config.js',
  '/js/auth.js',
  '/js/calendar.js',
  '/js/tasks.js',
  '/js/dashboard.js',
  '/manifest.json',
  'https://cdn.tailwindcss.com/3.3.0',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.css',
  'https://cdn.jsdelivr.net/npm/fullcalendar@6.1.10/index.global.min.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
