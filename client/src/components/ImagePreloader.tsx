import { useEffect, useState } from 'react';
import { preloadInterfaceImages } from '../lib/imageCache';

/**
 * Componente que se encarga de precargar imágenes estáticas de la interfaz
 * al iniciar la aplicación. No renderiza nada visible.
 */
const ImagePreloader: React.FC = () => {
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  
  useEffect(() => {
    // Solo ejecutar una vez al montar el componente
    if (!imagesPreloaded) {
      console.log('🖼️ Precargando imágenes estáticas de la interfaz...');
      
      // Precargar todas las imágenes de la interfaz
      preloadInterfaceImages()
        .then(() => {
          setImagesPreloaded(true);
          console.log('✅ Imágenes de interfaz precargadas correctamente');
        })
        .catch(error => {
          console.error('❌ Error al precargar imágenes:', error);
          // Marcamos como precargado incluso con errores para no intentarlo de nuevo
          setImagesPreloaded(true);
        });
    }
  }, [imagesPreloaded]);
  
  // Este componente no renderiza nada visible
  return null;
};

export default ImagePreloader;