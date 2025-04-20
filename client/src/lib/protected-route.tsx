import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

/**
 * Componente mejorado para rutas protegidas que requieren autenticación
 * 
 * Características:
 * - Muestra estado de carga con un spinner
 * - Retrasa la redirección para evitar parpadeos durante la verificación de sesión
 * - Proporciona transiciones suaves entre estados
 * - Maneja mejor las reconexiones después de pérdida de red
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Solo redirigir a login después de verificar que realmente no hay usuario
  // y ha pasado un tiempo suficiente para evitar parpadeos en la carga
  useEffect(() => {
    let redirectTimer: number;
    
    if (!isLoading && !user) {
      // Esperar un pequeño tiempo antes de redirigir
      // para dar oportunidad a la reconexión tras problemas de red
      redirectTimer = window.setTimeout(() => {
        setShouldRedirect(true);
      }, 300);  // 300ms de espera
    } else {
      setShouldRedirect(false);
    }
    
    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [user, isLoading]);

  return (
    <Route path={path}>
      {!isLoading && user ? (
        <Component />
      ) : shouldRedirect ? (
        <Redirect to="/login" />
      ) : (
        // Pantalla en blanco durante la carga - el splash screen en index.html se encargará de mostrar la animación
        <div className="flex flex-col items-center justify-center min-h-screen bg-background"></div>
      )}
    </Route>
  );
}