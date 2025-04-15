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
  // Iniciar el sistema de gestión de sesiones para mantener la conexión automáticamente
  useEffect(() => {
    // Importar el gestor de sesiones de forma dinámica para no bloquear el renderizado
    import('./lib/sessionManager').then(({ startSessionManager, stopSessionManager }) => {
      console.log('Iniciando sistema de gestión de sesiones');
      startSessionManager();
      
      // Detener el gestor cuando el componente se desmonte
      return () => {
        console.log('Deteniendo sistema de gestión de sesiones');
        stopSessionManager();
      };
    }).catch(error => {
      console.error('Error al iniciar el gestor de sesiones:', error);
    });
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
