const CACHE_NAME = 'sacred-sound-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/audio/aarti.mp3',
  '/audio/chalisa.mp3',
  '/audio/sai.mp3',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - caches all static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching assets');
        return cache.addAll(ASSETS);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    })
  );
});

// Fetch event - serve from cache first, fall back to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cacheResponse => {
        // Return cached response if found
        if (cacheResponse) {
          return cacheResponse;
        }
        
        // Otherwise try fetching from network
        return fetch(event.request)
          .then(networkResponse => {
            // Don't cache CORS or opaque responses
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
              return networkResponse;
            }
            
            // Clone the response to store in cache and return to browser
            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
              
            return networkResponse;
          });
      })
      .catch(() => {
        // Fallback for image requests
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
          return caches.match('/icons/icon-192x192.png');
        }
        
        // Return a basic offline page for HTML
        if (event.request.headers.get('Accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});
