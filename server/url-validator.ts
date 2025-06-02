/**
 * Utilidades para validar y sanitizar URLs de forma segura
 * Previene ataques de redirección maliciosa y URLs peligrosas
 */

/**
 * Valida que una URL sea segura para procesar
 * @param url La URL a validar
 * @returns true si la URL es segura, false en caso contrario
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Solo permitir protocolos HTTP y HTTPS
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    // Verificar que no sea una IP local o privada
    const hostname = urlObj.hostname.toLowerCase();
    
    // Bloquear direcciones IP locales comunes
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^192\.168\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^0\./,
      /^::1$/,
      /^fe80:/i
    ];
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitiza una URL eliminando parámetros potencialmente peligrosos
 * @param url La URL a sanitizar
 * @returns La URL sanitizada o null si es inválida
 */
export function sanitizeUrl(url: string): string | null {
  if (!isValidUrl(url)) {
    return null;
  }
  
  try {
    const urlObj = new URL(url);
    
    // Eliminar parámetros de tracking comunes que pueden usarse para ataques
    const dangerousParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', '_ga', '_gl', 'mc_eid', 'mc_cid'
    ];
    
    dangerousParams.forEach(param => {
      urlObj.searchParams.delete(param);
    });
    
    return urlObj.toString();
  } catch (error) {
    return null;
  }
}