import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Configuración específica para forzar el modo oscuro en Android
document.documentElement.classList.add('dark');
if (navigator.userAgent.includes('Android')) {
  // Forzar tema oscuro en la barra de navegación de Android
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#121212');
  } else {
    // Forzar modo oscuro incluso si el sistema está en modo claro
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = '#121212';
    document.head.appendChild(metaThemeColor);
  }
}

// Declaraciones globales
declare global {
  // Para la propiedad standalone en Navigator para Safari en iOS
  interface Navigator {
    standalone?: boolean;
  }
}

// Componente wrapper para notificar cuando la app está lista
function AppWithReadyNotification() {
  // La lógica de detección de PWA ahora se ha movido al hook useDomainDetection
  // para que pueda ser compartida en toda la aplicación y considerar
  // el tipo de dominio (app.watawan.com vs watawan.com)
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppWithReadyNotification />
  </React.StrictMode>
);
