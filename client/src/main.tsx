import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Declaraciones globales
declare global {
  // Para la propiedad standalone en Navigator para Safari en iOS
  interface Navigator {
    standalone?: boolean;
  }
}

// Renderización directa de la app para evitar problemas con la PWA
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
