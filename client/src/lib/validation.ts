/**
 * Función para validar un formato de correo electrónico
 * Implementa una validación más completa que solo buscar un '@'
 */
export function validateEmail(email: string): boolean {
  // Expresión regular basada en el RFC 5322 para validar emails
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  // Comprobación básica primero
  if (!email || !email.trim()) {
    return false;
  }
  
  // Validación con regex
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Comprobación adicional: debe tener un dominio con al menos un punto
  const parts = email.split('@');
  if (parts.length !== 2) {
    return false;
  }
  
  const domain = parts[1];
  if (!domain.includes('.') || domain.endsWith('.')) {
    return false;
  }
  
  return true;
}

/**
 * Obtiene un mensaje de error adecuado para un email inválido
 */
export function getEmailErrorMessage(email: string): string {
  if (!email || !email.trim()) {
    return "El email es obligatorio";
  }
  
  if (!email.includes('@')) {
    return "Incluye un signo '@' en la dirección de correo electrónico";
  }
  
  const parts = email.split('@');
  if (parts.length !== 2) {
    return "El formato del email no es válido";
  }
  
  const domain = parts[1];
  if (!domain.includes('.')) {
    return "El dominio debe incluir al menos un punto (ejemplo@dominio.com)";
  }
  
  if (domain.endsWith('.')) {
    return "El dominio no puede terminar con un punto";
  }
  
  return "La dirección de correo electrónico no es válida";
}