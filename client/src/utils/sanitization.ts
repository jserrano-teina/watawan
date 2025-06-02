/**
 * Utilidades de sanitización para el frontend
 * Protege contra XSS y validación de datos del usuario
 */

// Función para sanitizar texto de entrada del usuario
export function sanitizeText(text: string): string {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remover caracteres HTML básicos
    .replace(/javascript:/gi, '') // Remover URLs javascript:
    .replace(/data:/gi, '') // Remover URLs data:
    .slice(0, 1000); // Limitar longitud
}

// Función para validar URLs de forma segura
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsedUrl = new URL(url);
    // Solo permitir protocolos seguros
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// Función para sanitizar URLs
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Remover caracteres peligrosos
  const cleaned = url.trim().replace(/[<>"']/g, '');
  
  if (!isValidUrl(cleaned)) {
    return '';
  }
  
  return cleaned;
}

// Función para validar y sanitizar precios
export function sanitizePrice(price: string): string {
  if (!price) return '';
  
  // Solo permitir números, comas y puntos
  return price.replace(/[^0-9.,]/g, '').slice(0, 10);
}

// Función para sanitizar nombres de archivo
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_') // Reemplazar caracteres especiales
    .slice(0, 100); // Limitar longitud
}

// Función para validar tipos de archivo de imagen
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return validTypes.includes(file.type);
}

// Función para validar tamaño de archivo
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}