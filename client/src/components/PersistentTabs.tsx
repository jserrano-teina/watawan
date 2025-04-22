import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Home from '@/pages/Home';
import NotificationsPage from '@/pages/NotificationsPage';
import ProfilePage from '@/pages/profile-page';
import { preloadInterfaceImages } from '@/lib/imageCache';

/**
 * Componente que mantiene las pestañas principales montadas en el DOM
 * para evitar la recarga de imágenes y estados al cambiar entre ellas.
 * 
 * Todas las pestañas existen en el DOM, pero solo una es visible a la vez.
 */
const PersistentTabs: React.FC = () => {
  // Obtener la ubicación actual
  const [location] = useLocation();
  // Estado que controla qué pestaña es visible
  const [activeTab, setActiveTab] = useState<string>('/');
  // Estado que rastrea si todas las imágenes ya han sido precargadas
  const [imagesPreloaded, setImagesPreloaded] = useState(false);

  // Efecto para precargar todas las imágenes de la interfaz
  useEffect(() => {
    if (!imagesPreloaded) {
      console.log('🖼️ Precargando todas las imágenes de la interfaz desde PersistentTabs...');
      preloadInterfaceImages()
        .then(() => {
          console.log('✅ Precarga de imágenes completada con éxito');
          setImagesPreloaded(true);
        })
        .catch(err => {
          console.error('❌ Error en precarga de imágenes:', err);
          // Marcar como completado incluso con errores para no intentarlo de nuevo
          setImagesPreloaded(true);
        });
    }
  }, [imagesPreloaded]);

  // Actualizar la pestaña activa cuando cambia la ubicación
  useEffect(() => {
    // Solo actualizar si es una de las pestañas principales
    if (['/notifications', '/profile', '/'].includes(location)) {
      setActiveTab(location);
    }
  }, [location]);

  // Determinar si una pestaña debe estar visible
  const isTabVisible = (tabPath: string): boolean => {
    return activeTab === tabPath;
  };

  return (
    <>
      {/* Home - Pestaña de Mis Deseos */}
      <div 
        style={{ 
          display: isTabVisible('/') ? 'block' : 'none',
          height: '100%',
          width: '100%',
          position: isTabVisible('/') ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          opacity: isTabVisible('/') ? 1 : 0,
          pointerEvents: isTabVisible('/') ? 'auto' : 'none',
          zIndex: isTabVisible('/') ? 10 : -1
        }}
      >
        <Home />
      </div>

      {/* Pestaña de Notificaciones */}
      <div 
        style={{ 
          display: isTabVisible('/notifications') ? 'block' : 'none',
          height: '100%',
          width: '100%',
          position: isTabVisible('/notifications') ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          opacity: isTabVisible('/notifications') ? 1 : 0,
          pointerEvents: isTabVisible('/notifications') ? 'auto' : 'none',
          zIndex: isTabVisible('/notifications') ? 10 : -1
        }}
      >
        <NotificationsPage />
      </div>

      {/* Pestaña de Perfil */}
      <div 
        style={{ 
          display: isTabVisible('/profile') ? 'block' : 'none',
          height: '100%',
          width: '100%',
          position: isTabVisible('/profile') ? 'relative' : 'absolute',
          top: 0,
          left: 0,
          opacity: isTabVisible('/profile') ? 1 : 0,
          pointerEvents: isTabVisible('/profile') ? 'auto' : 'none',
          zIndex: isTabVisible('/profile') ? 10 : -1
        }}
      >
        <ProfilePage />
      </div>
    </>
  );
};

export default PersistentTabs;