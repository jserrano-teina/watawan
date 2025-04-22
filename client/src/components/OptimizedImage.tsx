import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: string | number;
  height?: string | number;
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
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
  objectFit = "cover",
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
    
    // Manejar URL absolutas y relativas
    let imageSrc = src;
    
    // Si es una URL relativa que empieza con /uploads, asegurar que se carga correctamente
    if (src && src.startsWith('/uploads/') && !src.startsWith('http')) {
      // Usamos la URL actual como base para URLs relativas
      const currentOrigin = window.location.origin;
      imageSrc = `${currentOrigin}${src}`;
      console.log('Convirtiendo URL relativa a absoluta:', imageSrc);
    }
    
    const img = new Image();
    img.src = imageSrc;
    
    img.onload = () => {
      // Marcar como cargada en el caché global
      imageCache[src] = true;
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      console.error('Error al cargar imagen:', imageSrc);
      if (onError) onError();
    };
    
    // Cleanup function
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);
  
  return (
    <div 
      className={`${className} ${!isLoaded ? 'animate-pulse bg-[#1e1e1e]' : ''}`} 
      style={{ width, height }}
    >
      {isLoaded && (
        <img 
          src={src && src.startsWith('/uploads/') && !src.startsWith('http') 
            ? `${window.location.origin}${src}` // URL absoluta para imágenes locales
            : src
          } 
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