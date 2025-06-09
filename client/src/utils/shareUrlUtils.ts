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
 * Formato en producción: watawan.com/user/[username]
 * Formato en desarrollo: localhost:puerto/user/[username] (o la URL de desarrollo correspondiente)
 */
export function buildFriendlyShareUrl(username: string): string {
  const userSlug = generateSlug(username);
  
  // Solo considerar desarrollo si estamos en localhost
  const isDevelopment = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    // En desarrollo local, usar la URL actual del host
    return `${window.location.origin}/user/${userSlug}`;
  } else {
    // En todos los demás casos (incluyendo replit.app), usar watawan.com
    return `https://watawan.com/user/${userSlug}`;
  }
}