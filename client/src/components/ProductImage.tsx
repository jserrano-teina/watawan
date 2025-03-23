import React, { useState, useEffect } from 'react';

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
  
  // Generar un color consistente basado en el título del producto
  const getConsistentColor = (text: string): string => {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = Math.abs(hash) % 360;
    return `hsl(${color}, 70%, 60%)`;
  };
  
  // Obtener las iniciales del título para el placeholder
  const getInitials = (text: string): string => {
    return text
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };
  
  // Determinar si es una tienda problemática que sabemos que bloquea las imágenes
  const isProblematicStore = (): boolean => {
    const url = purchaseLink || imageUrl || '';
    return url.includes('zara.com') || url.includes('pccomponentes.com');
  };
  
  // Generar URL del placeholder basado en el título
  const getPlaceholderUrl = (): string => {
    const color = getConsistentColor(title);
    const initials = getInitials(title);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${encodeURIComponent(color.replace('#', ''))}&color=fff&size=200&bold=true`;
  };
  
  // Verificar si es una URL de Amazon (que sí funciona bien)
  const isAmazonUrl = (): boolean => {
    const url = purchaseLink || imageUrl || '';
    return url.includes('amazon.') || url.includes('amzn.') || url.includes('a.co/');
  };
  
  // Detectar si debemos usar un placeholder inmediatamente
  const shouldUseInitialsPlaceholder = (): boolean => {
    return isProblematicStore() || !imageUrl;
  };
  
  // Comprobar errores al cargar la imagen
  const handleImageError = () => {
    setImgState('error');
  };
  
  // Cuando la imagen carga correctamente
  const handleImageLoad = () => {
    setImgState('loaded');
  };
  
  // Si es una tienda problemática o no hay URL, usar un placeholder con iniciales
  if (shouldUseInitialsPlaceholder()) {
    const placeholderUrl = getPlaceholderUrl();
    
    return (
      <div className={`relative flex items-center justify-center bg-gray-100 rounded overflow-hidden ${className}`}>
        <img
          src={placeholderUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
          {title}
        </div>
      </div>
    );
  }
  
  // Para Amazon y otras tiendas que funcionan bien con las imágenes
  if (imgState === 'error' || !imageUrl) {
    const placeholderUrl = getPlaceholderUrl();
    
    return (
      <div className={`relative flex items-center justify-center bg-gray-100 rounded overflow-hidden ${className}`}>
        <img
          src={placeholderUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center truncate">
          {title}
        </div>
      </div>
    );
  }
  
  // Para otras tiendas, intentar cargar la imagen normalmente
  return (
    <div className={`relative ${className}`}>
      <img 
        src={imageUrl} 
        alt={title} 
        className="w-full h-full object-cover rounded"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      {imgState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};

export default ProductImage;