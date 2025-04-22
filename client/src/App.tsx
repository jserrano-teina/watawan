import { Switch, Route, useLocation } from "wouter";
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
import UserProfilePublic from "./pages/UserProfilePublic";
import PublicHomePage from "./pages/PublicHomePage";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { NetworkMonitor } from "@/components/NetworkMonitor";
import ImagePreloader from "@/components/ImagePreloader";
import React, { useEffect } from "react";
import { useSafeArea } from "@/hooks/useSafeArea";
import { useDomainDetection } from "@/hooks/useDomainDetection";

/**
 * Router para el dominio app.watawan.com (o PWA)
 */
function AppRouter() {
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
 * Router para el dominio watawan.com (sitio público)
 */
function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={PublicHomePage} />
      <Route path="/user/:username" component={UserProfilePublic} />
      <Route path="/s/:id" component={SharedList} />
      <Route path="/shared/:id" component={SharedList} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Router principal que detecta el dominio y carga el router correspondiente
 */
function Router() {
  const { domainType } = useDomainDetection();
  const [location] = useLocation();
  
  // Lógica específica para desarrollo local
  // En desarrollo, usamos la ruta para determinar qué router mostrar
  if (window.location.hostname.includes('localhost') || window.location.hostname.includes('replit')) {
    if (location.startsWith('/user/')) {
      return <PublicRouter />;
    }
  }
  
  // En producción, usamos el dominio detectado
  return domainType === 'public' ? <PublicRouter /> : <AppRouter />;
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