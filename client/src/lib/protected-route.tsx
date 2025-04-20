import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

/**
 * Componente mejorado para rutas protegidas que requieren autenticación
 * 
 * Características:
 * - Usa el splash screen para la carga (sin estados de carga adicionales)
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
        // Estado de carga con mismo fondo que la aplicación y spinner centrado
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </Route>
  );
}