import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Aseguramos que la app siempre use el tema oscuro
document.documentElement.classList.add('dark');

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
