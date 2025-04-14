import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Componente wrapper para notificar cuando la app está lista
function AppWithReadyNotification() {
  useEffect(() => {
    // Notificar que la app está cargada para ocultar el splash screen
    const readyEvent = new Event('appReady');
    window.dispatchEvent(readyEvent);
    
    // Establecer algunos comportamientos para PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      // La app está corriendo en modo standalone (como PWA instalada)
      document.body.classList.add('pwa-mode');
      
      // Prevenir pulldown refresh en iOS
      document.body.addEventListener('touchmove', function(e) {
        if (window.pageYOffset === 0 && e.touches[0].clientY > 0) {
          e.preventDefault();
        }
      }, { passive: false });
    }
  }, []);
  
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithReadyNotification />
  </React.StrictMode>
);
