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
 * Sanitiza un objeto completo, recorriendo sus propiedades que sean strings
 * @param data - Objeto a sanitizar
 * @returns Una copia del objeto con todas sus propiedades string sanitizadas
 */
export function sanitizeObject<T extends Record<string, any>>(data: T): T {
  // Crear una copia del objeto
  const sanitized = { ...data };
  
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
  
  return sanitized;
}