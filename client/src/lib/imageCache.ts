/**
 * Sistema centralizado de caché de imágenes y precarga
 * 
 * Este módulo proporciona funciones para:
 * 1. Mantener una caché global de imágenes precargadas
 * 2. Precargar imágenes críticas de la interfaz al iniciar la aplicación
 * 3. Proporcionar métodos de utilidad para trabajar con imágenes
 */

// Caché global de imágenes - accesible desde cualquier lugar de la aplicación
interface ImageCacheEntry {
  loaded: boolean;
  error: boolean;
  url: string;
  element?: HTMLImageElement;
  timestamp: number;
}

// Mapa global para almacenar las imágenes precargadas
const imageCache = new Map<string, ImageCacheEntry>();

// Lista de imágenes de interfaz críticas que deben precargarse al inicio
const CRITICAL_UI_IMAGES = [
  // Imágenes de UI para estados vacíos
  "/empty-state-gifts.png",
  "/empty-state-notifications.png",
  "/empty-state-wishlist.png",
  // Logo de la aplicación
  "/logo.png",
  // Imágenes de placeholder de tiendas
  "/store-logos/amazon.png",
  "/store-logos/generic.png",
  "/store-logos/aliexpress.png",
  "/store-logos/ebay.png",
  "/store-logos/zara.png",
  "/store-logos/pccomponentes.png",
  "/store-logos/nike.png",
  // Iconos PWA
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

/**
 * Precarga una imagen y la almacena en la caché global
 */
export function preloadImage(url: string): Promise<HTMLImageElement> {
  // Normalizar la URL
  const normalizedUrl = normalizeImageUrl(url);
  
  // Si la imagen ya está en la caché y está cargada, devolvemos la promesa resuelta
  if (imageCache.has(normalizedUrl) && imageCache.get(normalizedUrl)?.loaded) {
    console.log(`✅ Imagen ya en caché: ${normalizedUrl}`);
    return Promise.resolve(imageCache.get(normalizedUrl)!.element as HTMLImageElement);
  }
  
  // Agregar la entrada a la caché mientras se carga
  if (!imageCache.has(normalizedUrl)) {
    imageCache.set(normalizedUrl, {
      loaded: false,
      error: false,
      url: normalizedUrl,
      timestamp: Date.now()
    });
  }
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Actualizar la caché con la imagen cargada
      imageCache.set(normalizedUrl, {
        loaded: true,
        error: false,
        url: normalizedUrl,
        element: img,
        timestamp: Date.now()
      });
      resolve(img);
    };
    
    img.onerror = (error) => {
      // Marcar la imagen como fallida en la caché
      imageCache.set(normalizedUrl, {
        loaded: false,
        error: true,
        url: normalizedUrl,
        timestamp: Date.now()
      });
      console.error(`❌ Error al precargar imagen: ${normalizedUrl}`, error);
      reject(error);
    };
    
    // Comenzar la carga de la imagen
    img.src = normalizedUrl;
  });
}

/**
 * Precargar todas las imágenes de interfaz críticas
 */
export function preloadInterfaceImages(): Promise<HTMLImageElement[]> {
  console.log(`🖼️ Precargando ${CRITICAL_UI_IMAGES.length} imágenes de UI...`);
  
  const preloadPromises = CRITICAL_UI_IMAGES.map(url => 
    preloadImage(url)
      .catch(error => {
        console.error(`Error al precargar imagen UI (${url}):`, error);
        // Devolvemos una promesa resuelta para que Promise.all no falle
        return new Image();
      })
  );
  
  return Promise.all(preloadPromises);
}

/**
 * Verifica si una imagen está en la caché
 */
export function isImageCached(url: string): boolean {
  const normalizedUrl = normalizeImageUrl(url);
  return imageCache.has(normalizedUrl) && imageCache.get(normalizedUrl)?.loaded === true;
}

/**
 * Obtiene una imagen de la caché si existe
 */
export function getImageFromCache(url: string): HTMLImageElement | undefined {
  const normalizedUrl = normalizeImageUrl(url);
  const entry = imageCache.get(normalizedUrl);
  return entry?.loaded ? entry.element : undefined;
}

/**
 * Normaliza una URL de imagen para que sea consistente en la caché
 */
export function normalizeImageUrl(url: string): string {
  if (!url) return "";
  
  // Si es una URL absoluta externa, la devolvemos tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si es una URL relativa, la hacemos absoluta
  if (url.startsWith('/')) {
    return window.location.origin + url;
  }
  
  // Si no tiene / inicial, agregamos uno
  return window.location.origin + '/' + url;
}

/**
 * Limpia imágenes antiguas de la caché (imágenes que no se han usado en más de 1 hora)
 */
export function cleanImageCache(): void {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  let removedCount = 0;
  
  imageCache.forEach((entry, url) => {
    // No limpiamos imágenes críticas de UI
    if (CRITICAL_UI_IMAGES.some(criticalUrl => url.includes(criticalUrl))) {
      return;
    }
    
    // Eliminar imágenes que no se han usado en más de 1 hora
    if (now - entry.timestamp > ONE_HOUR) {
      imageCache.delete(url);
      removedCount++;
    }
  });
  
  if (removedCount > 0) {
    console.log(`🧹 Limpieza de caché: eliminadas ${removedCount} imágenes antiguas`);
  }
}

// Iniciar una limpieza periódica de la caché cada 15 minutos
setInterval(cleanImageCache, 15 * 60 * 1000);

export default {
  preloadImage,
  preloadInterfaceImages,
  isImageCached,
  getImageFromCache,
  normalizeImageUrl
};