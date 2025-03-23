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
  const [extractedProductId, setExtractedProductId] = useState<string | undefined>(productId);
  
  // Extraer ASIN/ID de producto si no se proporciona directamente
  useEffect(() => {
    if (!extractedProductId) {
      // Primero intentamos usar el prop productId
      if (productId && productId.length === 10 && /^[A-Z0-9]{10}$/.test(productId)) {
        setExtractedProductId(productId);
        return;
      }
      
      // Si no tenemos productId, intentamos extraerlo de la URL de imagen
      if (imageUrl) {
        // Patrones para extraer ASIN de URLs de imagen de Amazon
        const patterns = [
          /\/images\/I\/([A-Z0-9]{10})(\.|_)/, // Patrón común en URLs de imagen de Amazon
          /\/images\/P\/([A-Z0-9]{10})(\.|_)/, // Otro patrón de Amazon
          /\/([A-Z0-9]{10})(\.|_)/ // Patrón más general
        ];
        
        for (const pattern of patterns) {
          const match = imageUrl.match(pattern);
          if (match && match[1]) {
            const extractedId = match[1];
            console.log(`ID de producto extraído de URL de imagen: ${extractedId}`);
            setExtractedProductId(extractedId);
            return;
          }
        }
      }
    }
  }, [imageUrl, productId, extractedProductId]);
  
  // Generar diferentes formatos de URL para intentar
  const generateImageUrls = (): string[] => {
    const urls: string[] = [];
    
    // Siempre empezamos con la URL original si existe
    if (imageUrl) {
      urls.push(imageUrl);
    }
    
    // Si tenemos un ASIN/ID de producto, generamos URLs alternativas
    if (extractedProductId && extractedProductId.length === 10) {
      
      // Formatos comunes de Amazon
      urls.push(
        // Formato más común
        `https://m.media-amazon.com/images/I/${extractedProductId}._AC_SL1500_.jpg`,
        
        // Formato alternativo
        `https://images-na.ssl-images-amazon.com/images/I/${extractedProductId}._SL500_.jpg`,
        
        // Formato más simple
        `https://images-na.ssl-images-amazon.com/images/I/${extractedProductId}.jpg`,
        
        // Formato con tamaño específico
        `https://images-na.ssl-images-amazon.com/images/I/${extractedProductId}._AC_UL600_SR600,400_.jpg`,
        
        // Formato alternativo P
        `https://images-eu.ssl-images-amazon.com/images/P/${extractedProductId}.jpg`
      );
      
      // Si la URL original es de Amazon, intentamos con un proxy para evitar CORS
      if (imageUrl && (
        imageUrl.includes('amazon.com') || 
        imageUrl.includes('media-amazon') || 
        imageUrl.includes('images-amazon')
      )) {
        urls.push(
          `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(imageUrl)}`
        );
      }
    }
    
    // Eliminar duplicados usando Array.filter
    return urls.filter((url, index) => urls.indexOf(url) === index);
  };
  
  // Obtener la siguiente URL para intentar
  const getNextImageUrl = (): string | undefined => {
    const urls = generateImageUrls();
    return urlIndex < urls.length ? urls[urlIndex] : undefined;
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
  
  // Restablecer el estado si cambia la URL de la imagen o el productId
  useEffect(() => {
    setCurrentUrl(imageUrl);
    setUrlIndex(0);
    setImgState(imageUrl ? 'loading' : 'error');
  }, [imageUrl, productId]);
  
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