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
  const [imgState, setImgState] = useState<ImageState>(imageUrl ? 'loading' : 'error');
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(imageUrl);
  const [urlIndex, setUrlIndex] = useState(0);
  
  // Extraer ID de producto de la URL
  const getProductIdFromUrl = (url: string): string | null => {
    // Patrones comunes para URLs de Amazon
    const amazonPatterns = [
      /amazon\.com.*\/dp\/([A-Z0-9]{10})/i,
      /amazon\.es.*\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/dp\/([A-Z0-9]{10})/i,
      /\/([A-Z0-9]{10})(?:\/|\?|$)/
    ];
    
    for (const pattern of amazonPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    
    return null;
  };
  
  // Verificar si una URL es de Amazon
  const isAmazonUrl = (url?: string): boolean => {
    if (!url) return false;
    return (
      url.includes('amazon.com') || 
      url.includes('amazon.es') || 
      url.includes('amzn.') || 
      url.includes('a.co/')
    );
  };
  
  // Generar URLs alternativas para productos de Amazon
  const getAmazonImageUrls = (asin: string): string[] => {
    if (asin.length !== 10) return [];
    
    const urls: string[] = [];
    
    // Añadir los formatos más comunes para imágenes de Amazon
    urls.push(
      // Formato P directo (funciona para la mayoría de los casos)
      `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`,
      
      // Formatos I con variantes de prefijos (61, 71, 81)
      `https://m.media-amazon.com/images/I/61${asin.substring(0, 8)}._AC_SL1500_.jpg`,
      `https://m.media-amazon.com/images/I/71${asin.substring(0, 8)}._AC_SL1500_.jpg`, 
      `https://m.media-amazon.com/images/I/81${asin.substring(0, 8)}._AC_SL1500_.jpg`,
      
      // Con proxy para evitar CORS
      `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(`https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`)}`
    );
    
    return urls;
  };
  
  // Generar todas las URLs alternativas para intentar
  const generateImageUrls = (): string[] => {
    const urls: string[] = [];
    
    // Si tenemos una URL de imagen, siempre la intentamos primero
    if (imageUrl) {
      urls.push(imageUrl);
      
      // Si es una URL de Amazon, extraemos el ID y generamos alternativas
      if (isAmazonUrl(imageUrl)) {
        const extractedId = getProductIdFromUrl(imageUrl);
        if (extractedId) {
          urls.push(...getAmazonImageUrls(extractedId));
        }
      }
    }
    
    // Si nos proporcionaron un ID de producto directamente
    if (productId && productId.length === 10) {
      urls.push(...getAmazonImageUrls(productId));
    }
    
    // Eliminar duplicados manualmente
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
      console.log(`Intentando alternativa ${nextIndex}: ${nextUrl}`);
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
  
  if (imgState === 'error' || !currentUrl) {
    // Icono de fallback cuando no hay imagen
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-gray-400"
        >
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
          <line x1="7" y1="7" x2="7.01" y2="7"></line>
        </svg>
      </div>
    );
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