import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SharedList from "@/pages/SharedList";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import NotificationsPage from "./pages/NotificationsPage";
import ProfilePage from "./pages/profile-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { NetworkMonitor } from "@/components/NetworkMonitor";
import React, { useEffect } from "react";

/**
 * Router principal de la aplicación con rutas protegidas y públicas
 */
function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Home} />
      <ProtectedRoute path="/notifications" component={NotificationsPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/s/:id" component={SharedList} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Componente principal de la aplicación
 * Implementa el sistema de autenticación, monitoreo de red y enrutamiento
 */
function App() {
  // Configurar listeners globales para regenerar automáticamente sesiones
  useEffect(() => {
    // Refrescar sesión después de eventos de interacción del usuario
    // para prevenir expiración de sesión cuando la app está activa
    const sessionRefreshEvents = [
      'mousedown', 'keydown', 'touchstart', 'scroll',
      'visibilitychange', 'focus', 'storage'
    ];
    
    // Usar debounce para limitar la cantidad de peticiones
    let debounceTimer: number | null = null;
    
    const refreshSessionActivity = () => {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      
      debounceTimer = window.setTimeout(() => {
        // Solo enviar ping cuando el usuario está activo y la pestaña está visible
        if (document.visibilityState === 'visible') {
          fetch('/api/ping', { 
            method: 'GET',
            credentials: 'include'
          }).catch(() => {
            // Ignorar errores - esto es solo un ping para mantener la sesión
          });
        }
      }, 30000); // 30 segundos de debounce
    };
    
    // Registrar listeners para eventos que indican actividad del usuario
    sessionRefreshEvents.forEach(eventType => {
      window.addEventListener(eventType, refreshSessionActivity, { passive: true });
    });
    
    return () => {
      sessionRefreshEvents.forEach(eventType => {
        window.removeEventListener(eventType, refreshSessionActivity);
      });
      
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <NetworkMonitor />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
