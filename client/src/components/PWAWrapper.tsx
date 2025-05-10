import React, { useEffect, useState } from 'react';
import '../pwa-fixes.css'; // Importamos las correcciones específicas para PWA

interface PWAWrapperProps {
  children: React.ReactNode;
}

/**
 * PWAWrapper: Componente que detecta si la aplicación está en modo PWA standalone
 * y aplica las clases CSS necesarias para corregir problemas de layout en iOS y Android
 */
const PWAWrapper: React.FC<PWAWrapperProps> = ({ children }) => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    // Detectamos si estamos en modo PWA (standalone o fullscreen)
    const checkPWAMode = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                           window.matchMedia('(display-mode: fullscreen)').matches ||
                           (window.navigator as any).standalone === true;
      
      setIsPWA(isStandalone);
      
      // Aplicamos clases a html y body si estamos en modo PWA
      if (isStandalone) {
        document.documentElement.classList.add('standalone-mode');
        document.body.classList.add('pwa-mode');
        
        // Evitamos que el documento pueda hacer bounce (especialmente importante para iOS)
        document.addEventListener('touchmove', (e) => {
          // Permitimos scroll solo en elementos con clase .scrollable
          if (!(e.target as HTMLElement).closest('.page-content, .modal-content')) {
            e.preventDefault();
          }
        }, { passive: false });
      } else {
        document.documentElement.classList.remove('standalone-mode');
        document.body.classList.remove('pwa-mode');
      }
    };
    
    checkPWAMode();
    
    // Actualizamos cuando cambia el modo de visualización
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkPWAMode);
    
    return () => {
      mediaQuery.removeEventListener('change', checkPWAMode);
    };
  }, []);
  
  return (
    <div className={isPWA ? 'pwa-container' : ''}>
      {children}
    </div>
  );
};

export default PWAWrapper;