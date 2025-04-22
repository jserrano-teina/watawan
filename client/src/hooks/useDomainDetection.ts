import { useState, useEffect } from 'react';

/**
 * Tipo de dominio: 'app' (app.watawan.com) o 'public' (watawan.com)
 */
export type DomainType = 'app' | 'public' | 'other';

/**
 * Hook para detectar el tipo de dominio actual y determinar si debe cargar como PWA
 */
export function useDomainDetection() {
  const [domainType, setDomainType] = useState<DomainType>('other');
  const [isPWAEnabled, setIsPWAEnabled] = useState(false);

  useEffect(() => {
    // Obtener el hostname actual
    const hostname = window.location.hostname;
    
    if (hostname === 'app.watawan.com') {
      setDomainType('app');
      setIsPWAEnabled(true);
    } else if (hostname === 'watawan.com') {
      setDomainType('public');
      setIsPWAEnabled(false);
    } else if (hostname.includes('localhost') || hostname.includes('replit')) {
      // En desarrollo, usamos una regla basada en la ruta
      if (window.location.pathname.startsWith('/user/')) {
        setDomainType('public');
        setIsPWAEnabled(false);
      } else {
        setDomainType('app');
        setIsPWAEnabled(true);
      }
    } else {
      // Por defecto, tratamos como la app
      setDomainType('app');
      setIsPWAEnabled(true);
    }

    // Registrar el tipo de dominio detectado para depuración
    console.log(`Dominio detectado: ${domainType}, PWA habilitada: ${isPWAEnabled}`);
  }, []);

  return { domainType, isPWAEnabled };
}