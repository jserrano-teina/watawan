/**
 * Genera un slug a partir de un texto
 * Elimina caracteres especiales, espacios, etc.
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Normaliza acentos
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos
    .replace(/[^\w\s-]/g, '') // Elimina caracteres especiales
    .replace(/\s+/g, '-') // Reemplaza espacios por guiones
    .replace(/-+/g, '-') // Elimina guiones duplicados
    .replace(/^-+|-+$/g, ''); // Elimina guiones del principio y final
}

/**
 * Crea una URL amigable para compartir una lista de deseos
 * Formato: watawan.com/user/[username] en producción
 * Formato: En desarrollo, no genera URL amigable para evitar 404
 */
export function buildFriendlyShareUrl(username: string): string {
  const userSlug = generateSlug(username);
  
  // Comprobar si estamos en entorno de desarrollo
  const isDevelopment = process.env.NODE_ENV === 'development' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('.replit.dev') ||
                       window.location.hostname.includes('.repl.co');
  
  if (isDevelopment) {
    // En desarrollo, devolver una cadena vacía para que se use el enlace legado
    // Esto hará que ShareModal use el formato /s/[shareableLink]
    return '';
  } else {
    // Para producción, mantener la URL original
    return `https://watawan.com/user/${userSlug}`;
  }
}