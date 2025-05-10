import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SharedList from "@/pages/SharedList";
import UserWishlist from "@/pages/UserWishlist";
import PublicHomePage from "@/pages/PublicHomePage";
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
import { useDomainDetection } from "@/hooks/useDomainDetection";
import PWAWrapper from "@/components/PWAWrapper";

/**
 * Router principal de la aplicación con rutas protegidas y públicas
 * Incluye lógica para manejar diferentes dominios (app.watawan.com y watawan.com)
 */
function Router() {
  const { domainType, isReady } = useDomainDetection();
  
  // Si no está listo, mostramos una pantalla de carga
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Router específico para el dominio público (watawan.com)
  if (domainType === 'public') {
    return (
      <Switch>
        <Route path="/" component={PublicHomePage} />
        <Route path="/user/:username" component={UserWishlist} />
        {/* Mantener compatibilidad con rutas antiguas */}
        <Route path="/s/:id" component={SharedList} />
        <Route path="/shared/:id" component={SharedList} />
        <Route component={NotFound} />
      </Switch>
    );
  }
  
  // Router para app.watawan.com y cualquier otro dominio
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
        {/* Envolvemos toda la aplicación con PWAWrapper para solucionar problemas de layout */}
        <PWAWrapper>
          <div className="app-container">
            {/* Precarga imágenes al iniciar la aplicación */}
            <ImagePreloader />
            <Router />
            <NetworkMonitor />
            <Toaster />
          </div>
        </PWAWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;