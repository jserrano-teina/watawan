import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon } from 'lucide-react';

type ImageState = 'loading' | 'loaded' | 'error';

interface ProductImageProps {
  imageUrl?: string;
  productId?: string;
  title: string;
  className?: string;
  purchaseLink?: string;
}

/**
 * Componente mejorado para mostrar imágenes de productos con fallbacks
 * basados en iniciales y colores para sitios problemáticos
 */
const ProductImage: React.FC<ProductImageProps> = ({ 
  imageUrl, 
  productId, 
  title, 
  className = "w-full h-full object-cover",
  purchaseLink 
}) => {
  const [imgState, setImgState] = useState<ImageState>('loading');
  const [imgSrc, setImgSrc] = useState<string | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<number | null>(null);
  
  // Determinar si es una tienda problemática que sabemos que bloquea las imágenes
  const isProblematicStore = (): boolean => {
    const url = purchaseLink || '';
    return url.includes('zara.com') || 
           url.includes('pccomponentes.com') || 
           url.includes('nike.com');
  };
  
  // Verificar si es un blob URL o una URL local (no una URL remota de una tienda)
  const isBlobOrLocalUrl = (): boolean => {
    return !!imageUrl && (
      imageUrl.startsWith('blob:') || 
      imageUrl.startsWith('data:') || 
      imageUrl.startsWith('/') ||
      imageUrl.startsWith('http://localhost')
    );
  };
  
  // Detectar si debemos usar un placeholder inmediatamente
  const shouldUseInitialsPlaceholder = (): boolean => {
    // Si es un blob URL o URL local, NO usamos placeholder
    if (isBlobOrLocalUrl()) {
      return false;
    }
    
    return isProblematicStore() || !imageUrl;
  };
  
  // Comprobar errores al cargar la imagen
  const handleImageError = () => {
    console.log(`Error cargando imagen: ${imageUrl}`);
    setImgState('error');
  };
  
  // Cuando la imagen carga correctamente
  const handleImageLoad = () => {
    console.log(`Imagen cargada correctamente: ${imageUrl}`);
    setImgState('loaded');

    // Limpiar cualquier temporizador pendiente
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Limpiar recursos cuando el componente se desmonta
  useEffect(() => {
    return () => {
      // Limpiar cualquier temporizador pendiente
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Actualizar el estado cuando cambia la URL de la imagen
  useEffect(() => {
    // Reiniciar el estado cuando cambia la URL
    setImgState('loading');
    
    // Limpiar cualquier temporizador pendiente
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Si no hay URL o es una tienda problemática, mostrar error directamente
    if (!imageUrl || isProblematicStore()) {
      setImgSrc(undefined);
      setImgState('error');
      return;
    }
    
    // Si hay una imagen válida, configurar un temporizador de seguridad
    // para evitar que se quede cargando infinitamente
    setImgSrc(imageUrl);
    
    // Agregar un tiempo de espera máximo para evitar carga infinita
    timeoutRef.current = window.setTimeout(() => {
      // Si después de 5 segundos sigue en estado de carga, forzar error
      if (imgState === 'loading') {
        console.log('Tiempo de espera agotado para carga de imagen');
        setImgState('error');
      }
    }, 5000);
    
    // Verificar si la imagen ya está en caché del navegador
    if (imgRef.current && imgRef.current.complete) {
      handleImageLoad();
    }
  }, [imageUrl, isProblematicStore]);
  
  // Si es una tienda problemática, no hay URL o hubo un error, mostrar placeholder
  if (shouldUseInitialsPlaceholder() || imgState === 'error') {
    return (
      <div className={`relative flex flex-col items-center justify-center shadow-inner ${className}`}>
        <ImageIcon size={42} className="text-[#444444]" strokeWidth={1.5} />
      </div>
    );
  }
  
  // Para otras tiendas, intentar cargar la imagen normalmente
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {imgSrc && (
        <img 
          ref={imgRef}
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          crossOrigin="anonymous"
        />
      )}
      
      {/* Mostrar spinner durante la carga */}
      {imgState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default ProductImage;