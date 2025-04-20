import React, { useState, useEffect } from 'react';
import { Package, ImageIcon } from 'lucide-react';
import { sanitizeUrl } from '@/lib/sanitize';
import OptimizedImage from './OptimizedImage';

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
    if (!imageUrl) return false;
    
    const url = imageUrl;
    // Consideramos URLs locales seguras, pero igual verificamos que no tengan protocolos peligrosos
    const isSafe = !/^(?:javascript|vbscript|file):/i.test(url);
    
    return isSafe && (
      url.startsWith('blob:') || 
      url.startsWith('data:image/') || // Solo permitimos data: URLs para imágenes
      url.startsWith('/') ||
      url.startsWith('http://localhost')
    );
  };
  
  // Detectar si debemos usar un placeholder inmediatamente
  const shouldUseInitialsPlaceholder = (): boolean => {
    // Si es un blob URL o URL local, NO usamos placeholder
    if (isBlobOrLocalUrl()) {
      console.log('Es una URL local o blob, mostrando imagen:', imageUrl);
      return false;
    }
    
    // Para tiendas problemáticas, sin URL o con errores, usamos placeholder
    const shouldUsePlaceholder = isProblematicStore() || !imageUrl || imgState === 'error';
    if (shouldUsePlaceholder) {
      console.log('Usando placeholder porque:', 
        isProblematicStore() ? 'es tienda problemática' : 
        !imageUrl ? 'no hay URL' : 
        'hubo error al cargar');
    }
    return shouldUsePlaceholder;
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
      // Sanitizar la URL antes de usarla
      const safeUrl = sanitizeUrl(imageUrl);
      if (safeUrl) {
        setImgSrc(safeUrl);
        setImgState('loading');
      } else {
        console.warn('URL de imagen no segura bloqueada:', imageUrl);
        setImgState('error');
        setImgSrc(undefined);
      }
    } else {
      setImgState('error');
      setImgSrc(undefined);
    }
  }, [imageUrl]);
  
  // Si es una tienda problemática, no hay URL o hubo un error, mostrar placeholder
  if (shouldUseInitialsPlaceholder()) {
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
        <div className="w-full h-full">
          <OptimizedImage 
            src={imgSrc} 
            alt={title} 
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      )}
      
      {/* Mostrar spinner durante la carga */}
      {imgState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#252525]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Mostrar placeholder si la imagen falla */}
      {imgState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <ImageIcon size={42} className="text-[#444444]" strokeWidth={1.5} />
        </div>
      )}
    </div>
  );
};

export default ProductImage;