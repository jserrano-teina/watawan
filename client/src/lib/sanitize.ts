/**
 * Sanitiza texto de entrada para prevenir ataques XSS
 * @param input - Texto a sanitizar
 * @returns Texto sanitizado seguro para mostrar
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return '';
  
  // Reemplaza caracteres HTML especiales con entidades
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitiza una URL para prevenir ataques XSS vía javascript: URLs
 * @param url - URL a sanitizar
 * @returns URL sanitizada segura para usar en links
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Eliminar espacios en blanco
  const trimmedUrl = url.trim();
  
  // Permitir explícitamente URLs de blob para imágenes subidas por el usuario
  if (trimmedUrl.startsWith('blob:')) {
    console.log('Permitiendo URL de blob:', trimmedUrl);
    return trimmedUrl;
  }
  
  // Permitir URLs de data para imágenes (pero solo las que realmente son imágenes)
  if (trimmedUrl.startsWith('data:image/')) {
    console.log('Permitiendo URL de data image:', trimmedUrl.substring(0, 30) + '...');
    return trimmedUrl;
  }
  
  // Verificar si la URL es segura (no permite javascript:, vbscript:, etc)
  const urlPattern = /^(?:(?:https?|ftp):\/\/|www\.|\/)[^\s/$.?#].[^\s]*$/i;
  const isValid = urlPattern.test(trimmedUrl);
  
  // Si no es una URL válida o empieza con un protocolo peligroso, devolver vacío
  if (!isValid || /^(?:javascript|vbscript|file):/i.test(trimmedUrl)) {
    console.warn('URL insegura detectada y bloqueada:', trimmedUrl);
    return '';
  }
  
  // Asegurar que la URL tiene un protocolo
  if (trimmedUrl.startsWith('www.')) {
    return `https://${trimmedUrl}`;
  }
  
  return trimmedUrl;
}

/**
 * Sanitiza un objeto completo, recorriendo sus propiedades que sean strings
 * @param data - Objeto a sanitizar
 * @returns Una copia del objeto con todas sus propiedades string sanitizadas
 */
export function sanitizeObject<T extends Record<string, any>>(data: T): T {
  // Crear una copia del objeto como any para poder modificarlo
  const sanitized = { ...data } as Record<string, any>;
  
  // Recorrer todas las propiedades del objeto
  Object.keys(sanitized).forEach(key => {
    const value = sanitized[key];
    
    // Si es un string, sanitizarlo
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } 
    // Si es un objeto anidado, procesarlo recursivamente
    else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    }
    // Si es un array, procesar cada elemento
    else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeInput(item) 
          : (typeof item === 'object' && item !== null)
            ? sanitizeObject(item)
            : item
      );
    }
  });
  
  // Devolver el objeto ya sanitizado, convertido de nuevo al tipo original
  return sanitized as T;
}