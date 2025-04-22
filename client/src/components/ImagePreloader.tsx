import React, { useEffect, useState } from 'react';
import { preloadInterfaceImages } from '@/lib/imageCache';

/**
 * Componente que se encarga de precargar todas las imágenes estáticas
 * de la interfaz al iniciar la aplicación
 * 
 * No tiene renderizado visual, solo funcionalidad
 */
const ImagePreloader: React.FC = () => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!imagesLoaded) {
      console.log('🔄 Iniciando precarga de imágenes desde ImagePreloader...');
      
      preloadInterfaceImages()
        .then(() => {
          console.log('✅ Precarga de imágenes completada con éxito');
          setImagesLoaded(true);
        })
        .catch(err => {
          console.error('❌ Error en precarga de imágenes:', err);
          // Marcar como completado incluso con errores para no reintentar
          setImagesLoaded(true);
        });
    }
  }, [imagesLoaded]);

  // Este componente no renderiza nada visible
  return null;
};

export default ImagePreloader;