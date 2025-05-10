import React, { useEffect, useState } from 'react';
// pwa-fixes.css ya se importa en main.tsx, no es necesario importarlo aquí nuevamente

interface PWAWrapperProps {
  children: React.ReactNode;
}

/**
 * PWAWrapper: Componente que detecta si la aplicación está en modo PWA standalone
 * y aplica las clases CSS necesarias para corregir problemas de layout en iOS y Android.
 * Esta versión mejorada tiene mejor soporte para iOS y maneja con mayor precisión
 * los problemas de scroll, modales y navegación fija.
 */
const PWAWrapper: React.FC<PWAWrapperProps> = ({ children }) => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Detectamos si estamos en modo PWA (standalone o fullscreen)
    const checkPWAMode = () => {
      // Verificamos todas las formas posibles en que podría ser una PWA
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true;
      
      setIsPWA(isStandalone);
      
      // Aplicamos clases a html y body si estamos en modo PWA
      if (isStandalone) {
        document.documentElement.classList.add('standalone-mode', 'pwa-html-mode');
        document.body.classList.add('pwa-mode');
        
        // Manejador de scroll mejorado que solo previene el bouncing cuando es necesario
        const preventBounce = (e: TouchEvent) => {
          // Verificamos si el elemento donde ocurrió el evento es scrollable
          const element = e.target as HTMLElement;
          const scrollableParent = element.closest('.page-content, .modal-content, .scrollable');
          
          // Si no estamos en un elemento scrollable, prevenimos el comportamiento por defecto
          if (!scrollableParent) {
            e.preventDefault();
          }
        };
        
        // Agregamos el event listener con passive: false para poder llamar a preventDefault
        document.addEventListener('touchmove', preventBounce, { passive: false });
        
        // Devolvemos una función de limpieza para remover el event listener
        return () => {
          document.removeEventListener('touchmove', preventBounce);
        };
      } else {
        // Si no estamos en modo PWA, removemos las clases
        document.documentElement.classList.remove('standalone-mode', 'pwa-html-mode');
        document.body.classList.remove('pwa-mode');
      }
    };
    
    // Ejecutamos la verificación inicial
    const cleanup = checkPWAMode();
    
    // Actualizamos cuando cambia el modo de visualización
    const mediaQueryStandalone = window.matchMedia('(display-mode: standalone)');
    const mediaQueryFullscreen = window.matchMedia('(display-mode: fullscreen)');
    
    // Función unificada para manejar cambios en el modo de visualización
    const handleDisplayModeChange = () => {
      if (cleanup) cleanup();
      checkPWAMode();
    };
    
    // Agregamos los event listeners
    mediaQueryStandalone.addEventListener('change', handleDisplayModeChange);
    mediaQueryFullscreen.addEventListener('change', handleDisplayModeChange);
    
    // Devolvemos una función de limpieza
    return () => {
      if (cleanup) cleanup();
      mediaQueryStandalone.removeEventListener('change', handleDisplayModeChange);
      mediaQueryFullscreen.removeEventListener('change', handleDisplayModeChange);
    };
  }, []);
  
  return (
    // No es necesaria una clase especial aquí, ya que los estilos se aplican a nivel de html y body
    <>{children}</>
  );
};

export default PWAWrapper;