import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Configuración específica para forzar el modo oscuro y asegurar compatibilidad con PWA
document.documentElement.classList.add('dark');

// Optimizaciones para PWA en todos los dispositivos
const isInStandaloneMode = () => 
  window.matchMedia('(display-mode: standalone)').matches || 
  (window.navigator as any).standalone === true;

// Detectar si está en modo PWA y aplicar clases específicas
if (isInStandaloneMode()) {
  document.documentElement.classList.add('pwa-html-mode');
  document.body.classList.add('pwa-mode');
}

// Forzar tema oscuro en barras de sistema para todos los dispositivos
const metaThemeColor = document.querySelector('meta[name="theme-color"]') || 
  document.createElement('meta');
metaThemeColor.setAttribute('name', 'theme-color');
metaThemeColor.setAttribute('content', '#121212');
if (!document.querySelector('meta[name="theme-color"]')) {
  document.head.appendChild(metaThemeColor);
}

// Configuración específica para iOS
if (/iPhone|iPod|iPad/.test(navigator.userAgent)) {
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    metaViewport.setAttribute('content', 
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
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
