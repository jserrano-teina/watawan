/**
 * Sanitiza una entrada de texto para prevenir ataques XSS
 * @param input Texto a sanitizar
 * @returns Texto sanitizado
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Convertir entidades HTML
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitiza una URL para prevenir ataques XSS y asegurar que es una URL válida
 * @param url URL a sanitizar
 * @returns URL sanitizada o # si no es válida
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#';
  
  try {
    // Intentar crear un objeto URL para validar
    const urlObj = new URL(url);
    
    // Verificar que el protocolo es http o https
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
      console.warn(`URL sanitizada: protocolo no permitido (${urlObj.protocol})`);
      return '#';
    }
    
    // Lista de dominios bloqueados
    const blockedDomains = ['javascript.com', 'eval.com', 'localhost.evil'];
    
    // Verificar que el dominio no está en la lista de bloqueados
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      console.warn(`URL sanitizada: dominio bloqueado (${urlObj.hostname})`);
      return '#';
    }
    
    // Si todo está correcto, devolver la URL normalizada
    return urlObj.toString();
  } catch (error) {
    // Si la URL no es válida, intentar añadir el protocolo https:// y volver a intentarlo
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return sanitizeUrl(`https://${url}`);
    }
    
    console.warn(`URL sanitizada: URL inválida (${error})`);
    return '#';
  }
}

/**
 * Sanitiza HTML para mostrar de forma segura contenido HTML
 * @param html HTML a sanitizar
 * @returns HTML sanitizado
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  
  // Eliminar scripts y atributos peligrosos
  return html
    // Eliminar etiquetas script
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Eliminar eventos inline (onclick, onload, etc.)
    .replace(/\s+on\w+\s*=\s*("[^"]*"|'[^']*'|[^>\s]+)/gi, '')
    // Eliminar atributos javascript: en URLs
    .replace(/javascript\s*:/gi, 'removed:')
    // Eliminar atributos data: en URLs para evitar inyección de datos
    .replace(/data\s*:/gi, 'removed:')
    // Eliminar comentarios HTML que podrían contener código malicioso
    .replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Sanitiza un objeto recursivamente para prevenir ataques XSS
 * @param obj Objeto a sanitizar
 * @returns Objeto sanitizado
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      sanitized[key] = value;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (typeof item === 'string') {
          return sanitizeInput(item);
        } else if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item);
        }
        return item;
      });
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}