import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases CSS utilizando clsx y tailwind-merge
 * @param inputs Clases CSS a combinar
 * @returns Clases combinadas
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extrae el dominio base de una URL (sin protocolo ni www)
 * @param url La URL de la que se quiere extraer el dominio
 * @returns El dominio base (ej: amazon.com, aliexpress.com, etc.)
 */
export function extractDomainFromUrl(url: string): string {
  try {
    // Intentar crear un objeto URL
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Quitar el www. si existe
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    // Si hay un error al parsear la URL, intentar extraer el dominio con regex
    try {
      const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i;
      const match = url.match(domainRegex);
      
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      console.error('Error al extraer dominio con regex:', e);
    }
    
    // Si todo falla, devolver la URL original
    return url;
  }
}

/**
 * Formatea una fecha relativa (ej: "hace 3 días")
 * @param date La fecha a formatear
 * @returns Cadena con la fecha relativa formateada
 */
export function formatRelativeDate(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) {
    return 'Justo ahora';
  } else if (diffMins < 60) {
    return `Hace ${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
  } else if (diffHours < 24) {
    return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  } else if (diffDays < 30) {
    return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  } else {
    // Formatear la fecha en formato dd/mm/yyyy
    const day = targetDate.getDate().toString().padStart(2, '0');
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const year = targetDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  }
}

/**
 * Trunca un texto a un número máximo de caracteres
 * @param text El texto a truncar
 * @param maxLength Longitud máxima del texto
 * @returns El texto truncado con "..." si excede la longitud máxima
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}