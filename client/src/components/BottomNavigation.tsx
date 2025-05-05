import React, { useCallback, useEffect } from 'react';
import { User, Bell, Home } from 'lucide-react';
import { useLocation } from 'wouter';
import { useNotifications } from '@/hooks/useNotifications';
import { invalidateAllAppQueries } from '@/lib/queryClient';

interface BottomNavigationProps {
  onAddWishClick?: () => void;
}

const BottomNavigation: React.FC<BottomNavigationProps> = () => {
  const [location, setLocation] = useLocation();
  const { unreadCount, isLoading, forceRefresh } = useNotifications();
  
  // Efecto para actualizar los datos cuando el usuario vuelve a la aplicación
  // después de que la pestaña ha estado inactiva
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Usuario volvió a la aplicación - actualizando datos...');
        forceRefresh();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forceRefresh]);
  
  // Método mejorado para navegar entre tabs con actualización de datos
  const navigateTo = useCallback((path: string) => {
    // Refrescamos todos los datos antes de cambiar de ubicación para garantizar
    // que siempre se muestren los datos más actualizados
    console.log(`Cambiando a ${path} - actualizando datos...`);
    
    // Forzar actualización de todas las consultas relevantes
    invalidateAllAppQueries();
    
    // Navegamos a la nueva ubicación
    setLocation(path);
  }, [setLocation]);
  
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] shadow-lg" style={{ 
      zIndex: 999,
      paddingBottom: 'env(safe-area-inset-bottom, 16px)',
    }}>
      <div className="flex justify-around items-center h-16 max-w-[500px] mx-auto">
        <button 
          onClick={() => navigateTo('/')}
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/') ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs mt-1">Mis deseos</span>
        </button>
        
        <button 
          onClick={() => navigateTo('/notifications')}
          className={`flex flex-col items-center justify-center w-full h-full relative ${isActive('/notifications') ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
        >
          <Bell className="h-5 w-5" />
          <span className="text-xs mt-1">Notificaciones</span>
          
          {!isLoading && unreadCount > 0 && (
            <span className="absolute top-1 right-1/3 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        
        <button 
          onClick={() => navigateTo('/profile')}
          className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile') ? 'text-primary' : 'text-gray-400 hover:text-white/80'} transition-colors`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs mt-1">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavigation;