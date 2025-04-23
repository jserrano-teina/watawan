/**
 * Genera un slug a partir de un texto
 * Elimina caracteres especiales, espacios, etc.
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Crea una URL amigable para compartir una lista de deseos
 * Formato: watawan.com/user/[username]
 */
export function buildFriendlyShareUrl(username: string): string {
  if (!username) return '';
  
  const userSlug = generateSlug(username);
  return `https://watawan.com/user/${userSlug}`;
}