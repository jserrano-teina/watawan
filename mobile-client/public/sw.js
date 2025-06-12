// Service Worker para WataWan Mobile con Web Share Target
const CACHE_NAME = 'watawan-mobile-v1';
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/styles/mobile.css',
  '/manifest.json'
];

// Instalación del service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Intercepción de requests
self.addEventListener('fetch', (event) => {
  // Manejar share target
  if (event.request.url.includes('/share')) {
    event.respondWith(handleSharedContent(event.request));
    return;
  }

  // Cache-first strategy para otros recursos
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});

// Manejo de contenido compartido
async function handleSharedContent(request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title');
  const text = url.searchParams.get('text');
  const sharedUrl = url.searchParams.get('url');

  // Almacenar datos compartidos en localStorage
  const sharedData = {
    title: title || '',
    text: text || '',
    url: sharedUrl || '',
    timestamp: Date.now()
  };

  // Abrir la app y pasar los datos
  const redirectUrl = `/#/add-item?shared=${encodeURIComponent(JSON.stringify(sharedData))}`;
  
  return Response.redirect(redirectUrl, 302);
}