import { useState, useEffect } from 'react';

/**
 * Tipo de dominio: 'app' (app.watawan.com) o 'public' (watawan.com)
 */
export type DomainType = 'app' | 'public' | 'other';

/**
 * Hook para detectar el tipo de dominio actual y determinar si debe cargar como PWA
 */
export function useDomainDetection() {
  const [domainType, setDomainType] = useState<DomainType>('app'); // Por defecto, asumimos que es la app
  const [isPwa, setIsPwa] = useState(false);

  useEffect(() => {
    // Verificar si la app se está ejecutando como PWA instalada
    const checkIfPwa = () => {
      return window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true || // Para iOS
        window.location.href.includes('?pwa=true'); // Parámetro de desarrollo
    };

    // Detectar el tipo de dominio
    const detectDomain = () => {
      const hostname = window.location.hostname;
      
      // En entorno de desarrollo, todo es considerado como la app a menos
      // que esté en una ruta específica para el sitio público
      if (hostname.includes('localhost') || hostname.includes('replit')) {
        // En desarrollo, consideraremos todo como app a menos que se fuerce con un parámetro
        const searchParams = new URLSearchParams(window.location.search);
        const forceDomain = searchParams.get('domain');
        
        if (forceDomain === 'public') {
          return 'public';
        }
        
        return 'app';
      }
      
      // En producción, detectamos por el subdominio
      if (hostname.startsWith('app.')) {
        return 'app';
      } else if (hostname === 'watawan.com' || hostname.endsWith('.watawan.com')) {
        return 'public';
      }
      
      return 'other';
    };
    
    // Establecer el tipo de dominio
    const domain = detectDomain();
    setDomainType(domain);
    
    // Verificar si es PWA
    setIsPwa(checkIfPwa());
    
    // En desarrollo, mostrar información en la consola
    console.log(`[Domain Detection] Domain type: ${domain}, Is PWA: ${checkIfPwa()}`);
    
  }, []);

  return { domainType, isPwa };
}