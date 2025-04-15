/**
 * Módulo para gestionar tokens CSRF en el lado del cliente
 * 
 * Este módulo almacena un token CSRF que se obtiene del servidor en las respuestas
 * y lo incluye en las peticiones modificadoras (POST, PUT, DELETE, etc.) para 
 * proteger contra ataques CSRF.
 */

// Nombre del header que se recibe del servidor y se envía en las peticiones
export const CSRF_HEADER = "X-CSRF-Token";

// Almacenamiento del token actual
let currentToken: string | null = null;

/**
 * Obtiene el token CSRF actual, o null si no hay uno
 */
export function getToken(): string | null {
  return currentToken;
}

/**
 * Actualiza el token CSRF almacenado a partir de los headers de una respuesta
 * @param headers Headers de una respuesta de fetch
 */
export function updateTokenFromResponse(headers: Headers): void {
  const token = headers.get(CSRF_HEADER);
  if (token) {
    if (token !== currentToken) {
      console.log(`Token CSRF actualizado`);
    }
    currentToken = token;
  }
}

/**
 * Añade el token CSRF a los headers de una petición si está disponible
 * @param headers Headers existentes de una petición
 * @returns Headers actualizados con el token CSRF si está disponible
 */
export function addTokenToHeaders(headers: Record<string, string> = {}): Record<string, string> {
  if (currentToken) {
    return {
      ...headers,
      [CSRF_HEADER]: currentToken
    };
  }
  return headers;
}