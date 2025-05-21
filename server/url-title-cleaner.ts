/**
 * Limpiador de títulos extraídos que parecen URLs
 * Se enfoca en resolver el problema donde los metadatos extraídos contienen
 * el nombre de dominio de la tienda en lugar del nombre real del producto
 */

/**
 * Detecta si un título parece una URL o contiene patrones de dominio
 * @param title Título a analizar
 * @returns true si el título parece una URL o un dominio
 */
export function titleLooksLikeUrl(title: string): boolean {
  if (!title) return false;
  
  // Patrones comunes de URLs y dominios
  const urlPatterns = [
    /^https?:\/\//i,                // Comienza con http:// o https://
    /^www\./i,                      // Comienza con www.
    /^\s*\w+\.\w{2,}\s*$/i,         // Es sólo un dominio (ej: "amazon.com")
    /^es\.\w+\.com$/i,              // Formato "es.tienda.com"
    /^m\.\w+\.(com|es|net)$/i,      // Formato de mobile "m.tienda.com"
    /\.(com|es|net|org|shop)$/i,    // Termina con extensión común
    /\.(store|online|web)$/i,       // Termina con extensión de tienda
    /^tienda\s+online$/i,           // "tienda online" y similares
    /^shop\s+online$/i,             // "shop online" y similares
    /^official\s+store$/i,          // "official store" y similares
    /^tienda\s+oficial$/i           // "tienda oficial" y similares
  ];
  
  return urlPatterns.some(pattern => pattern.test(title.trim()));
}

/**
 * Limpia un título de producto eliminando sufijos y prefijos de tiendas/dominios
 * @param title Título a limpiar
 * @param url URL original (opcional, usado para análisis adicional)
 * @returns Título limpiado o cadena vacía si no se puede limpiar correctamente
 */
export function cleanUrlFromTitle(title: string, url?: string): string {
  if (!title) return '';
  
  // Si el título es muy corto, validamos más estrictamente
  if (title.length < 10 && titleLooksLikeUrl(title)) {
    return ''; // Demasiado corto y parece URL, mejor no usarlo
  }
  
  // Lista de patrones a limpiar del título
  const cleaningPatterns = [
    // Sufijos de dominio con diversos separadores
    /\s*[-–—]\s*[a-zA-Z0-9.]+\.(com|es|net|org|shop)$/i,
    /\s+en\s+[a-zA-Z0-9.]+\.(com|es|net|org|shop)$/i,
    /\s*\|\s*[a-zA-Z0-9.]+\.(com|es|net|org|shop)$/i,
    /\s*\(\s*[a-zA-Z0-9.]+\.(com|es|net|org|shop)\s*\)$/i,
    /\s*–\s*[a-zA-Z0-9.]+\.(com|es|net|org|shop)$/i,
    
    // Prefijos de dominio con diversos separadores
    /^[a-zA-Z0-9.]+\.(com|es|net|org|shop)\s*[-–—]\s*/i,
    /^[a-zA-Z0-9.]+\.(com|es|net|org|shop)\s*\|\s*/i,
    /^[a-zA-Z0-9.]+\.(com|es|net|org|shop)\s*:\s*/i,
    /^\(\s*[a-zA-Z0-9.]+\.(com|es|net|org|shop)\s*\)\s*/i,
    
    // Prefijos de tiendas/compras
    /^comprar\s+en\s+[a-zA-Z0-9.]+\s*[-:]\s*/i,
    /^comprar\s+online\s*[-:]\s*/i,
    /^tienda\s+online\s*[-:]\s*/i,
    /^shop\s+online\s*[-:]\s*/i,
    /^online\s+shop\s*[-:]\s*/i,
    
    // Sitios web específicos en diversos formatos
    /\s*[-–—]\s*\w+\s+Web\s*$/i,
    /\s*[-–—]\s*\w+\s+Store\s*$/i,
    /\s*[-–—]\s*\w+\s+Shop\s*$/i,
    /\s*[-–—]\s*\w+\s+Tienda\s*$/i,
    
    // Subtiendas dentro de marketplaces
    /^([^-|]+)\s*[-–—|]\s*\1\s+\w+\s*$/i,
  ];
  
  // Aplicar patrones de limpieza
  let cleanedTitle = title;
  for (const pattern of cleaningPatterns) {
    cleanedTitle = cleanedTitle.replace(pattern, '');
  }
  
  // Limpieza final de espacios y caracteres extraños
  cleanedTitle = cleanedTitle.trim()
    .replace(/\s+/g, ' ')                  // Espacios múltiples
    .replace(/^\s*[-–—:,|.]\s*/, '')       // Caracteres de puntuación al inicio
    .replace(/\s*[-–—:,|.]\s*$/, '')       // Caracteres de puntuación al final
    .trim();
  
  // Si después de la limpieza nos quedamos con algo demasiado corto o genérico, rechazarlo
  if (cleanedTitle.length < 5 || /^[a-zA-Z0-9.]+$/.test(cleanedTitle)) {
    return '';
  }
  
  // Si el título limpiado aún parece una URL, rechazarlo
  if (titleLooksLikeUrl(cleanedTitle)) {
    return '';
  }
  
  return cleanedTitle;
}

/**
 * Analiza un título y lo limpia si contiene referencias a URLs
 * @param title Título a analizar y limpiar
 * @param url URL original del producto (opcional)
 * @returns Objeto con el título limpio y un flag indicando si es válido
 */
export function validateAndCleanTitle(title: string, url?: string): { 
  title: string;
  isValid: boolean;
} {
  if (!title) {
    return { title: '', isValid: false };
  }
  
  // Si el título parece directamente una URL, intentar limpiarlo
  if (titleLooksLikeUrl(title)) {
    const cleanedTitle = cleanUrlFromTitle(title, url);
    return {
      title: cleanedTitle,
      isValid: cleanedTitle.length > 0
    };
  }
  
  // Incluso si no parece una URL completa, intentar eliminar sufijos/prefijos de tiendas
  const cleanedTitle = cleanUrlFromTitle(title, url);
  if (cleanedTitle && cleanedTitle !== title) {
    return {
      title: cleanedTitle,
      isValid: true
    };
  }
  
  // Si el título no necesitó limpieza, asumimos que es válido
  return {
    title,
    isValid: true
  };
}