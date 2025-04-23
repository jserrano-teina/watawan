import { useState, useEffect } from 'react';

/**
 * Posibles tipos de dominio en la aplicación
 */
export type DomainType = 'app' | 'public' | 'other';

/**
 * Hook para detectar en qué dominio se está ejecutando la aplicación
 * - 'app': app.watawan.com - PWA completa con autenticación
 * - 'public': watawan.com - Sitio público, no PWA
 * - 'other': Cualquier otro dominio, comportamiento predeterminado (similar a 'app')
 */
export function useDomainDetection(): {
  domainType: DomainType;
  isPwa: boolean;
  hostname: string;
  isReady: boolean;
} {
  const [domainData, setDomainData] = useState<{
    domainType: DomainType;
    isPwa: boolean;
    hostname: string;
    isReady: boolean;
  }>({
    domainType: 'other',
    isPwa: false,
    hostname: '',
    isReady: false
  });

  useEffect(() => {
    // Determinar el tipo de dominio
    const hostname = window.location.hostname;
    let domainType: DomainType = 'other';

    if (hostname === 'watawan.com') {
      domainType = 'public';
    } else if (hostname === 'app.watawan.com') {
      domainType = 'app';
    } else if (hostname.includes('localhost') || /(\d+\.){3}\d+/.test(hostname)) {
      // En desarrollo local, usamos la ruta para determinar el modo
      // /app/* será tratado como dominio 'app'
      // /user/* será tratado como dominio 'public'
      const pathname = window.location.pathname;
      if (pathname.startsWith('/app/')) {
        domainType = 'app';
      } else if (pathname.startsWith('/user/')) {
        domainType = 'public';
      } else {
        // Por defecto en desarrollo usaremos el modo app
        domainType = 'app';
      }
    } else if (hostname.includes('.replit.app')) {
      // En el entorno de Replit, usamos la ruta para determinar el modo
      const pathname = window.location.pathname;
      if (pathname.startsWith('/app/')) {
        domainType = 'app';
      } else if (pathname.startsWith('/user/')) {
        domainType = 'public';
      } else {
        // Por defecto en Replit usaremos el modo app
        domainType = 'app';
      }
    }

    // Detectar si es una PWA
    const isPwa = (
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true || 
      document.referrer.includes('ios-app://')
    );

    // Actualizar el estado
    setDomainData({
      domainType,
      isPwa,
      hostname,
      isReady: true
    });

    // Aplicar la clase PWA solo si estamos en el dominio 'app' o en otro dominio (pero no en 'public')
    if (isPwa && domainType !== 'public') {
      console.log('📱 Ejecutando en modo PWA/aplicación instalada');
      document.body.classList.add('pwa-mode');
      document.documentElement.classList.add('pwa-html-mode');
    } else {
      // Asegurarse de quitar las clases PWA si no aplican
      document.body.classList.remove('pwa-mode');
      document.documentElement.classList.remove('pwa-html-mode');
    }

  }, []);

  return domainData;
}