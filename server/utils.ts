import { nanoid } from 'nanoid';

/**
 * Genera un slug a partir de una cadena de texto
 * Reemplaza espacios por guiones, elimina caracteres especiales y convierte todo a minúsculas
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
 * Genera un ID único para enlaces compartibles
 */
export function generateShareableId(length: number = 10): string {
  return nanoid(length);
}

/**
 * Crea una URL amigable para compartir una lista de deseos
 * Formato: watawan.com/user/[username]
 */
export function buildFriendlyShareUrl(username: string): string {
  const userSlug = generateSlug(username);
  return `https://watawan.com/user/${userSlug}`;
}