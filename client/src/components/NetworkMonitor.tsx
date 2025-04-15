import { useEffect, useState } from 'react';
import { AlertCircle, WifiOff } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

/**
 * Componente que monitorea el estado de la conexión a Internet y muestra
 * notificaciones al usuario cuando hay problemas de conectividad.
 * 
 * Características:
 * - Detecta cambios en la conectividad de red
 * - Muestra una notificación cuando se pierde la conexión
 * - Refresca automáticamente los datos cuando se recupera la conexión
 * - Se oculta automáticamente cuando se recupera la conectividad
 */
export function NetworkMonitor() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineWarning, setShowOfflineWarning] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  useEffect(() => {
    // Gestionar cambios en estado de conexión
    const handleOnline = () => {
      setIsOnline(true);
      setReconnecting(true);
      
      // Refrescar datos automáticamente al recuperar conexión
      console.log('Conexión recuperada, refrescando datos...');
      queryClient.invalidateQueries();
      
      // Ocultar el mensaje de reconectando después de un tiempo
      setTimeout(() => {
        setReconnecting(false);
        setShowOfflineWarning(false);
      }, 2000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineWarning(true);
    };

    // Registrar listeners para eventos de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Limpiar listeners al desmontar
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // No mostrar nada si estamos online y no reconectando
  if (isOnline && !reconnecting && !showOfflineWarning) return null;

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg max-w-[90%] w-auto
          transition-all duration-300 transform pointer-events-auto
          ${isOnline && reconnecting 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}
        `}
      >
        {isOnline && reconnecting ? (
          <>
            <AlertCircle className="w-5 h-5" />
            <span>Conexión recuperada. Actualizando datos...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5" />
            <span>Sin conexión a Internet. Algunas funciones pueden no estar disponibles.</span>
          </>
        )}
      </div>
    </div>
  );
}