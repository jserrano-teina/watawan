import React, { useState, useEffect } from 'react';

type ImageState = 'loading' | 'loaded' | 'error';

interface ProductImageProps {
  imageUrl?: string;
  productId?: string;
  title: string;
  className?: string;
  purchaseLink?: string; // Añadido para extraer información adicional
}

/**
 * Componente mejorado para mostrar imágenes de productos con múltiples fallbacks
 * Soporta diversas tiendas online con protección anti-scraping
 */
const ProductImage: React.FC<ProductImageProps> = ({ 
  imageUrl, 
  productId, 
  title, 
  className = "w-full h-full object-cover",
  purchaseLink 
}) => {
  const [imgState, setImgState] = useState<ImageState>(imageUrl ? 'loading' : 'error');
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(imageUrl);
  const [urlIndex, setUrlIndex] = useState(0);
  
  // Extraer ID de producto de la URL de Amazon
  const getAmazonProductId = (url: string): string | null => {
    // Patrones comunes para URLs de Amazon
    const amazonPatterns = [
      /amazon\.com.*\/dp\/([A-Z0-9]{10})/i,
      /amazon\.es.*\/dp\/([A-Z0-9]{10})/i,
      /\/gp\/product\/([A-Z0-9]{10})/i,
      /\/dp\/([A-Z0-9]{10})/i,
      /\/([B][0-9A-Z]{9})(?:\/|\?|$)/i
    ];
    
    for (const pattern of amazonPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
    }
    
    return null;
  };
  
  // Extraer código de producto de Zara
  const getZaraProductCode = (url: string): string | null => {
    const productCodeMatch = url.match(/[p]([0-9]+)\.html/i);
    if (productCodeMatch && productCodeMatch[1]) {
      return productCodeMatch[1];
    }
    return null;
  };

  // Extraer slug de PCComponentes
  const getPCComponentesSlug = (url: string): string | null => {
    const slugMatch = url.match(/\/([^\/]+)(?:\?|$)/);
    if (slugMatch && slugMatch[1]) {
      return slugMatch[1];
    }
    return null;
  };
  
  // Determinar tipo de tienda
  const getStoreType = (url?: string): 'amazon' | 'zara' | 'pccomponentes' | 'other' => {
    if (!url) return 'other';
    
    if (url.includes('amazon.') || url.includes('amzn.') || url.includes('a.co/')) {
      return 'amazon';
    }
    
    if (url.includes('zara.com')) {
      return 'zara';
    }
    
    if (url.includes('pccomponentes.com')) {
      return 'pccomponentes';
    }
    
    return 'other';
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
  
  // Generar URLs alternativas para productos de Zara
  const getZaraImageUrls = (productCode: string): string[] => {
    if (productCode.length < 7) return [];
    
    const urls: string[] = [];
    
    // Extraer los componentes del código
    const productCategory = productCode.substring(0, 2);
    const productSubcategory = productCode.substring(2, 4);
    const specificCode = productCode.substring(4);
    
    // Patrones comunes para imágenes de Zara
    urls.push(
      // Patrón 1: Formato actual más común
      `https://static.zara.net/photos//2023/I/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productCode}_1_1_1.jpg`,
      
      // Patrón 2: Formato alternativo
      `https://static.zara.net/photos//2023/I/0/2/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productCode}_6_1_1.jpg`,
      
      // Patrón 3: Formato simple
      `https://static.zara.net/photos//items/images/product/${productCode}_1_1_1.jpg?ts=${Date.now()}`
    );
    
    // Alternar las temporadas
    const seasons = ['I', 'V'];
    const years = ['2023', '2024', '2022'];
    
    for (const year of years) {
      for (const season of seasons) {
        urls.push(`https://static.zara.net/photos//${year}/${season}/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productCode}_1_1_1.jpg`);
      }
    }
    
    // Agregar URLs con proxy para evitar CORS
    const proxiedUrls = urls.map(url => 
      `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(url)}`
    );
    
    return [...urls, ...proxiedUrls];
  };
  
  // Generar URLs alternativas para productos de PCComponentes
  const getPCComponentesImageUrls = (slug: string): string[] => {
    const urls: string[] = [];
    
    // Diferentes formatos conocidos para imágenes de PCComponentes
    urls.push(
      `https://img.pccomponentes.com/articles/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/45/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/43/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/42/${slug}.jpg`
    );
    
    // Agregar URLs con proxy para evitar CORS
    const proxiedUrls = urls.map(url => 
      `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(url)}`
    );
    
    return [...urls, ...proxiedUrls];
  };
  
  // Generar todas las URLs alternativas para intentar
  const generateImageUrls = (): string[] => {
    const urls: string[] = [];
    
    // Si tenemos una URL de imagen, intentamos con ella primero
    if (imageUrl) {
      urls.push(imageUrl);
      
      // También añadimos versión con proxy para evitar CORS si la URL parece externa
      if (imageUrl.startsWith('http')) {
        urls.push(`https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(imageUrl)}`);
      }
    }
    
    // Determinar el tipo de tienda y generar URLs específicas
    const storeType = getStoreType(purchaseLink || imageUrl);
    
    if (storeType === 'amazon') {
      const amazonUrl = purchaseLink || imageUrl;
      if (amazonUrl) {
        const asin = getAmazonProductId(amazonUrl);
        if (asin) {
          urls.push(...getAmazonImageUrls(asin));
        }
      }
      
      // Si tenemos un ID de producto directo (probablemente ASIN)
      if (productId && productId.length === 10) {
        urls.push(...getAmazonImageUrls(productId));
      }
    } 
    else if (storeType === 'zara') {
      const zaraUrl = purchaseLink || imageUrl;
      if (zaraUrl) {
        const productCode = getZaraProductCode(zaraUrl);
        if (productCode) {
          urls.push(...getZaraImageUrls(productCode));
        }
      }
    }
    else if (storeType === 'pccomponentes') {
      const pcUrl = purchaseLink || imageUrl;
      if (pcUrl) {
        const slug = getPCComponentesSlug(pcUrl);
        if (slug) {
          urls.push(...getPCComponentesImageUrls(slug));
        }
      }
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
  }, [imageUrl, productId, purchaseLink]);
  
  if (imgState === 'error' || !currentUrl) {
    // Icono de fallback cuando no hay imagen
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded ${className}`}>
        <div className="text-center p-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-gray-400 mx-auto mb-2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{title}</p>
        </div>
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