import React, { useState, useEffect } from 'react';
import { 
  normalizeImageUrl, 
  isImageCached, 
  addImageToCache 
} from '../lib/imageCache';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // Si es true, se carga con prioridad (útil para imágenes "above the fold")
}

/**
 * Componente de imagen optimizado que precarga y almacena en caché imágenes
 * para evitar parpadeos al navegar entre tabs
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({ 
  src, 
  alt, 
  className = "", 
  width,
  height,
  objectFit = "cover",
  onLoad,
  onError,
  priority = false
}) => {
  // Verificar si la imagen ya está en caché
  const [isLoaded, setIsLoaded] = useState(isImageCached(src));

  // Precargar la imagen cuando el componente se monte
  useEffect(() => {
    // Si ya está en caché, no hacer nada
    if (isImageCached(src)) {
      setIsLoaded(true);
      return;
    }
    
    // Normalizar la URL para asegurar que funciona en todos los dispositivos
    const normalizedUrl = normalizeImageUrl(src);
    
    // Si es una imagen prioritaria, cargarla con alta prioridad
    if (priority) {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = normalizedUrl;
        // @ts-ignore - TypeScript no reconoce fetchPriority
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      } catch (error) {
        console.warn('Error al precargar imagen prioritaria:', error);
      }
    }
    
    // Crear nueva imagen para precarga
    const img = new Image();
    img.src = normalizedUrl;
    
    img.onload = () => {
      // Marcar como cargada en el caché global
      addImageToCache(src);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      console.error('Error al cargar imagen:', normalizedUrl, 'URL original:', src);
      if (onError) onError();
    };
    
    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError, priority]);
  
  return (
    <div 
      className={`${className} ${!isLoaded ? 'animate-pulse bg-[#1e1e1e]' : ''}`} 
      style={{ width, height }}
    >
      {isLoaded && (
        <img 
          src={normalizeImageUrl(src)} 
          alt={alt} 
          className={className}
          style={{ width: '100%', height: '100%', objectFit }}
          onLoad={() => {
            if (onLoad) onLoad();
          }}
          onError={() => {
            if (onError) onError();
          }}
        />
      )}
    </div>
  );
};

export default OptimizedImage;