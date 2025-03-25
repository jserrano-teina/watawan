import React, { useState, useEffect } from 'react';
import { Package } from 'lucide-react';

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
  const [imgState, setImgState] = useState<ImageState>(imageUrl ? 'loading' : 'error');
  const [imgSrc, setImgSrc] = useState<string | undefined>(imageUrl);
  
  // Generar un color consistente basado en el título del producto
  const getConsistentColor = (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash) % 360;
    return `hsl(${color}, 70%, 60%)`;
  };
  
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
    
    return isProblematicStore() || !imageUrl || imgState === 'error';
  };
  
  // Comprobar errores al cargar la imagen
  const handleImageError = () => {
    setImgState('error');
    setImgSrc(undefined);
  };
  
  // Cuando la imagen carga correctamente
  const handleImageLoad = () => {
    setImgState('loaded');
  };

  // Actualizar el estado cuando cambia la URL de la imagen
  useEffect(() => {
    if (imageUrl) {
      setImgSrc(imageUrl);
      setImgState('loading');
    } else {
      setImgState('error');
      setImgSrc(undefined);
    }
  }, [imageUrl]);
  
  // Si es una tienda problemática, no hay URL o hubo un error, mostrar placeholder
  if (shouldUseInitialsPlaceholder()) {
    return (
      <div className={`relative flex flex-col items-center justify-center bg-[#252525] shadow-inner ${className}`}>
        <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center">
          <Package size={36} className="text-gray-400" />
        </div>
      </div>
    );
  }
  
  // Para otras tiendas, intentar cargar la imagen normalmente
  return (
    <div className={`relative ${className}`}>
      {imgSrc && (
        <img 
          src={imgSrc} 
          alt={title} 
          className="w-full h-full object-cover scale-[0.95]"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
      
      {/* Mostrar spinner durante la carga */}
      {imgState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Mostrar placeholder si la imagen falla */}
      {imgState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#252525]">
          <div className="w-16 h-16 rounded-full bg-[#333] flex items-center justify-center">
            <Package size={36} className="text-gray-400" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImage;