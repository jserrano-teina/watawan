/**
 * Sistema global de caché y precarga de imágenes para la aplicación.
 * Este módulo se encarga de:
 * 1. Mantener un caché global de imágenes ya cargadas
 * 2. Precargar imágenes importantes de la interfaz al inicio de la aplicación
 * 3. Proporcionar métodos para normalizar URLs y gestionar la caché
 */

// Tipos de imágenes que queremos precargar
export enum ImageType {
  INTERFACE = 'interface',
  PRODUCT = 'product',
  LOGO = 'logo'
}

// Caché global para almacenar las imágenes ya cargadas
export const imageCache: Record<string, boolean> = {};

/**
 * Normaliza una URL de imagen para garantizar que sea absoluta
 * si es una imagen del sistema de archivos
 */
export function normalizeImageUrl(url: string): string {
  // Si es una URL vacía, devolverla tal cual
  if (!url) return url;
  
  // Si ya es una URL absoluta, devolverla tal cual
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Si es una URL de uploads, convertirla a absoluta usando el origen actual
  if (url.includes('/uploads/')) {
    // Asegurarnos de que empieza con / si no lo tiene
    const pathUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${window.location.origin}${pathUrl}`;
    return absoluteUrl;
  }
  
  // Si es una imagen estática de la interfaz (/images/), asegurarnos de que sea absoluta
  if (url.includes('/images/')) {
    const pathUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${window.location.origin}${pathUrl}`;
    return absoluteUrl;
  }
  
  // Para otros tipos de URLs, devolverlas sin cambios
  return url;
}

/**
 * Verifica si una imagen ya está en caché
 */
export function isImageCached(url: string): boolean {
  return !!imageCache[url];
}

/**
 * Marca una imagen como cargada en la caché
 */
export function addImageToCache(url: string): void {
  imageCache[url] = true;
}

/**
 * Precarga una imagen y la almacena en caché
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Normalizar URL
    const normalizedUrl = normalizeImageUrl(url);
    
    // Si ya está en caché, no hacer nada
    if (imageCache[url]) {
      resolve();
      return;
    }
    
    // Crear objeto imagen para precargar
    const img = new Image();
    img.src = normalizedUrl;
    
    img.onload = () => {
      // Marcar como cargada en el caché global
      imageCache[url] = true;
      console.log(`✓ Imagen precargada: ${url}`);
      resolve();
    };
    
    img.onerror = (error) => {
      console.error(`✗ Error al precargar imagen: ${url}`, error);
      reject(error);
    };
  });
}

// Lista de imágenes estáticas de la interfaz que queremos precargar al inicio
const INTERFACE_IMAGES = [
  '/images/empty_list.png',
  '/images/notification_bell.png',
  '/images/eyes.png', 
  '/images/error.png',
  '/images/wishlist_icon.png',
  '/images/logo.png'
];

/**
 * Precarga todas las imágenes estáticas de la interfaz
 */
export async function preloadInterfaceImages(): Promise<void> {
  console.log('Precargando imágenes de interfaz...');
  
  try {
    await Promise.all(INTERFACE_IMAGES.map(url => 
      preloadImage(url).catch(err => 
        console.warn(`No se pudo precargar: ${url}`, err)
      )
    ));
    console.log('✓ Todas las imágenes de interfaz han sido precargadas');
  } catch (error) {
    console.error('Error al precargar imágenes de interfaz:', error);
  }
}