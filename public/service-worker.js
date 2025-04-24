const CACHE_NAME = 'wishlist-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // Activación inmediata sin esperar a que se cierren las pestañas
  self.skipWaiting();
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Service Worker: Eliminando cache antiguo', name);
            return caches.delete(name);
          })
      );
    })
  );
  // Tomar control de clientes no controlados (pestañas/ventanas)
  self.clients.claim();
});

// Estrategia de caché: Network First, fallback a Cache
self.addEventListener('fetch', event => {
  // Solo cache peticiones GET
  if (event.request.method !== 'GET') return;
  
  // No cachear las peticiones a la API
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar la respuesta ya que se consume al leerla
        const responseClone = response.clone();
        
        // Abrir cache y guardar la respuesta
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseClone);
          });
          
        return response;
      })
      .catch(() => {
        // Si la red falla, intentar servir desde la caché
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Si el recurso no está en caché y es un HTML, devolver la página inicial
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/');
            }
            
            // Fallback para otros recursos
            return new Response('Error de conexión', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Sincronización en segundo plano
self.addEventListener('sync', event => {
  if (event.tag === 'sync-wishlist-items') {
    event.waitUntil(syncWishlistItems());
  }
});

// Función para sincronizar items de wishlist pendientes
async function syncWishlistItems() {
  const db = await openIndexedDB();
  const pendingItems = await db.getAll('pendingItems');
  
  for (const item of pendingItems) {
    try {
      const response = await fetch('/api/wishlist/' + item.wishlistId + '/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (response.ok) {
        await db.delete('pendingItems', item.id);
      }
    } catch (error) {
      console.error('Error sincronizando item:', error);
    }
  }
}

// Función simplificada para abrir IndexedDB
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('wishlistDB', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingItems')) {
        db.createObjectStore('pendingItems', { keyPath: 'id', autoIncrement: true });
      }
    };
    
    request.onsuccess = event => {
      const db = event.target.result;
      resolve({
        getAll: (storeName) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        },
        delete: (storeName, id) => {
          return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
        }
      });
    };
    
    request.onerror = () => reject(request.error);
  });
}