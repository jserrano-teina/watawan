import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Declaración para la propiedad standalone en Navigator para Safari en iOS
declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

// Componente wrapper para notificar cuando la app está lista
function AppWithReadyNotification() {
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    // Esperar hasta que la aplicación esté lista para ocultar el splash screen
    // Este temporizador es lo suficientemente largo para permitir que se cargue la autenticación
    const timer = setTimeout(() => {
      if (!appInitialized) {
        console.log("Temporizador de inicialización completado, mostrando la aplicación");
        setAppInitialized(true);
        
        // Esperar para asegurarnos de que la aplicación está lista antes de ocultar splash
        setTimeout(() => {
          // Notificar que la app está cargada para ocultar el splash screen
          const readyEvent = new Event('appReady');
          window.dispatchEvent(readyEvent);
        }, 100); // Pequeño delay para prevenir problemas de timing
      }
    }, 3000); // 3 segundos para asegurar que la autenticación haya tenido tiempo
    
    // Mejorada detección de PWA que incluye iOS en pantalla completa
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                 (window.navigator.standalone === true) || 
                 document.referrer.includes('ios-app://');
    
    if (isPWA) {
      console.log('📱 Ejecutando en modo PWA/aplicación instalada');
      
      // Aplicar clase PWA al cuerpo del documento para estilos específicos
      document.body.classList.add('pwa-mode');
      document.documentElement.classList.add('pwa-html-mode');
      
      // Prevenir comportamientos no deseados específicos de iOS
      document.addEventListener('touchmove', function(e) {
        // Permitir scroll en elementos con scroll establecido explícitamente
        const target = e.target as HTMLElement;
        const isScrollable = 
          target.closest('.overflow-auto') || 
          target.closest('.overflow-y-auto') || 
          target.closest('.overflow-scroll') ||
          target.closest('.scrollable-content');
          
        // Si estamos en la parte superior y no es un elemento scrollable, prevenir rebote
        if (!isScrollable && window.pageYOffset === 0 && e.touches[0].clientY > 0) {
          e.preventDefault();
        }
      }, { passive: false });
      
      // Asegurar que los eventos de touch funcionen correctamente 
      document.addEventListener('gesturestart', function(e) {
        e.preventDefault(); // Prevenir zoom con gesto de pellizco
      }, { passive: false });
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [appInitialized]);
  
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithReadyNotification />
  </React.StrictMode>
);
