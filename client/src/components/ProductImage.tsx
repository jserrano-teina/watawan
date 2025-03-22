import React, { useState, useEffect } from 'react';

type ImageState = 'loading' | 'loaded' | 'error';

interface ProductImageProps {
  imageUrl?: string;
  productId?: string;
  title: string;
  className?: string;
}

/**
 * Componente para mostrar imágenes de productos con fallbacks
 * Si la imagen principal falla, intenta con diferentes formatos de URLs
 */
const ProductImage: React.FC<ProductImageProps> = ({ 
  imageUrl, 
  productId, 
  title, 
  className = "w-full h-full object-cover" 
}) => {
  const [imgState, setImgState] = useState<ImageState>('loading');
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(imageUrl);
  const [urlIndex, setUrlIndex] = useState(0);
  
  // Extraer ASIN/ID de producto si no se proporciona directamente
  useEffect(() => {
    if (!productId && imageUrl) {
      // Intentar extraer ASIN/ID de la URL de la imagen
      const asinMatch = imageUrl.match(/\/([A-Z0-9]{10})(\.|_)/);
      if (asinMatch && asinMatch[1]) {
        const extractedId = asinMatch[1];
        console.log(`ID de producto extraído de URL de imagen: ${extractedId}`);
      }
    }
  }, [imageUrl, productId]);
  
  // Fallbacks de imágenes para Amazon (si tenemos un ID de producto)
  const getNextImageUrl = (): string | undefined => {
    if (!imageUrl) return undefined;
    
    // Si es error y tenemos productId, intentamos con formatos alternativos
    if (productId && productId.length === 10) {
      const alternativeFormats = [
        // Original
        imageUrl,
        // Variante 1: Formato común de Amazon
        `https://m.media-amazon.com/images/I/71${productId.substring(0, 8)}._AC_SL1500_.jpg`,
        // Variante 2: Formato alternativo
        `https://images-na.ssl-images-amazon.com/images/I/${productId}._SL500_.jpg`,
        // Variante 3: Formato más simple
        `https://images-na.ssl-images-amazon.com/images/I/${productId}.jpg`,
        // Variante 4: Usar el proxy de imágenes
        imageUrl.startsWith('https://m.media-amazon.com') 
          ? `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(imageUrl)}`
          : undefined
      ].filter(Boolean);
      
      if (urlIndex < alternativeFormats.length) {
        return alternativeFormats[urlIndex];
      }
    }
    
    // Si no es Amazon o ya probamos todas las alternativas
    return undefined;
  };
  
  // Cuando falla la carga de imagen, intentar con la siguiente URL
  const handleError = () => {
    const nextIndex = urlIndex + 1;
    setUrlIndex(nextIndex);
    
    const nextUrl = getNextImageUrl();
    if (nextUrl) {
      console.log(`Intentando formato alternativo ${nextIndex}: ${nextUrl}`);
      setCurrentUrl(nextUrl);
    } else {
      setImgState('error');
    }
  };
  
  // Restablecer el estado si cambia la URL de la imagen
  useEffect(() => {
    setCurrentUrl(imageUrl);
    setUrlIndex(0);
    setImgState(imageUrl ? 'loading' : 'error');
  }, [imageUrl]);
  
  if (!currentUrl || imgState === 'error') {
    return <i className="fas fa-gift text-neutral-400 text-4xl"></i>;
  }
  
  return (
    <img 
      src={currentUrl} 
      alt={title} 
      className={className}
      onLoad={() => setImgState('loaded')}
      onError={handleError}
    />
  );
};

export default ProductImage;