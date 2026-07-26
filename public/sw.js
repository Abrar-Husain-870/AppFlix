const CACHE_NAME = 'appflix-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/browse',
  '/assets/app-logos/AppFlix_circular_Icon__light_-removebg-preview.png',
  '/assets/app-logos/AppFlix_Name_logo_dark_-without_background.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Exclude API requests, Supabase calls, and dev HMR
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api') || url.pathname.includes('/_next/webpack-hmr') || url.hostname.includes('supabase')) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
