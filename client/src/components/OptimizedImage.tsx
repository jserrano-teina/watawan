import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  onLoad?: () => void;
  onError?: () => void;
}

// Caché global para almacenar las imágenes precargadas
const imageCache: Record<string, boolean> = {};

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
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(imageCache[src] || false);
  
  // Precargar la imagen cuando el componente se monte
  useEffect(() => {
    // Si ya está en caché, no hacer nada
    if (imageCache[src]) {
      setIsLoaded(true);
      return;
    }
    
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      // Marcar como cargada en el caché global
      imageCache[src] = true;
      setIsLoaded(true);
    };
    
    // Cleanup function
    return () => {
      img.onload = null;
    };
  }, [src]);
  
  return (
    <div 
      className={`${className} ${!isLoaded ? 'animate-pulse bg-[#1e1e1e]' : ''}`} 
      style={{ width, height }}
    >
      {isLoaded && (
        <img 
          src={src} 
          alt={alt} 
          className={className}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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