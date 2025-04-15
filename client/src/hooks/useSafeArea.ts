import { useState, useEffect } from 'react';

/**
 * Hook para obtener y gestionar los valores de área segura del dispositivo
 * Especialmente útil para dispositivos iOS con el home indicator o Android con la barra de navegación
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    // Función para actualizar los valores de área segura
    const updateSafeArea = () => {
      // Valores por defecto conservadores basados en dispositivos comunes
      let bottomInset = 16; // Valor base para todos los dispositivos
      
      // Detectar iOS con home indicator (iPhone X y posterior)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      const hasHomeIndicator = isIOS && window.innerHeight >= 812; // iPhone X y posterior tienen altura >= 812px
      
      if (hasHomeIndicator) {
        bottomInset = 34; // Ajuste específico para el home indicator de iOS
      }
      
      // Obtener valores de CSS env() si están disponibles
      const envTop = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-top') || '0', 10);
      const envRight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-right') || '0', 10);
      const envBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-bottom') || '0', 10);
      const envLeft = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--safe-area-inset-left') || '0', 10);
      
      // Usar valores env() si están disponibles, de lo contrario usar valores heurísticos
      setSafeArea({
        top: envTop || 0,
        right: envRight || 0,
        bottom: envBottom || bottomInset,
        left: envLeft || 0
      });
      
      // Actualizar variables CSS personalizadas para usar en toda la aplicación
      document.documentElement.style.setProperty('--safe-area-inset-top', `${envTop || 0}px`);
      document.documentElement.style.setProperty('--safe-area-inset-right', `${envRight || 0}px`);
      document.documentElement.style.setProperty('--safe-area-inset-bottom', `${envBottom || bottomInset}px`);
      document.documentElement.style.setProperty('--safe-area-inset-left', `${envLeft || 0}px`);
    };
    
    // Inicializar las variables CSS
    document.documentElement.style.setProperty('--safe-area-inset-top', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-right', '0px');
    document.documentElement.style.setProperty('--safe-area-inset-bottom', '16px');
    document.documentElement.style.setProperty('--safe-area-inset-left', '0px');
    
    // Actualizar valores al montar y cuando cambie la orientación
    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);
    
    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

/**
 * Función de utilidad para generar clases CSS con espaciado de seguridad
 */
export function getSafeAreaClass(position: 'top' | 'right' | 'bottom' | 'left' | 'all' = 'bottom'): string {
  switch (position) {
    case 'top':
      return 'safe-area-top';
    case 'right':
      return 'safe-area-right';
    case 'bottom':
      return 'safe-area-bottom';
    case 'left':
      return 'safe-area-left';
    case 'all':
      return 'safe-area-all';
    default:
      return 'safe-area-bottom';
  }
}