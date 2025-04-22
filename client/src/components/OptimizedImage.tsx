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
  
  // Función auxiliar para normalizar URLs de imágenes
  const normalizeImageUrl = (url: string): string => {
    // Si es una URL vacía, devolverla tal cual
    if (!url) return url;
    
    // Si ya es una URL absoluta, devolverla tal cual
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Si es una URL de uploads, convertirla a absoluta usando el origen actual
    if (url.includes('/uploads/')) {
      // Asegurarnos de que empieza con / si no lo tiene
      const pathUrl = url.startsWith('/') ? url : `/${url}`;
      const absoluteUrl = `${window.location.origin}${pathUrl}`;
      console.log('Convirtiendo URL relativa a absoluta:', absoluteUrl);
      return absoluteUrl;
    }
    
    // Para otros tipos de URLs, devolverlas sin cambios
    return url;
  };

  // Precargar la imagen cuando el componente se monte
  useEffect(() => {
    // Si ya está en caché, no hacer nada
    if (imageCache[src]) {
      setIsLoaded(true);
      return;
    }
    
    // Normalizar la URL para asegurar que funciona en todos los dispositivos
    const imageSrc = normalizeImageUrl(src);
    
    // Crear nueva imagen para precarga
    const img = new Image();
    img.src = imageSrc;
    
    img.onload = () => {
      // Marcar como cargada en el caché global (usamos la URL original como clave)
      imageCache[src] = true;
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    
    img.onerror = () => {
      console.error('Error al cargar imagen:', imageSrc, 'URL original:', src);
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