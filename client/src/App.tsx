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
import ImagePreloader from "@/components/ImagePreloader";
import React, { useEffect } from "react";
import { useSafeArea } from "@/hooks/useSafeArea";

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
      <Route path="/auth" component={LoginPage} />
      <Route path="/s/:id" component={SharedList} />
      <Route path="/shared/:id" component={SharedList} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Componente principal de la aplicación
 * Implementa el sistema de autenticación, monitoreo de red y enrutamiento
 */
function App() {
  // Inicializar el sistema de áreas seguras
  const safeArea = useSafeArea();
  
  // Iniciar el sistema de gestión de sesiones para mantener la conexión automáticamente
  useEffect(() => {
    // Registrar los valores de área segura
    console.log('Áreas seguras inicializadas:', safeArea);
    
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
  }, [safeArea]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Contenedor principal con clase app-container para PWA */}
        <div className="app-container">
          {/* Precarga imágenes al iniciar la aplicación */}
          <ImagePreloader />
          <Router />
          <NetworkMonitor />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;