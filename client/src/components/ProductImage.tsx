import React, { useState, useEffect } from 'react';

// Función para extraer el dominio base de una URL
function extractDomainFromUrl(url: string): string {
  try {
    // Intentar crear un objeto URL
    const urlObj = new URL(url);
    let hostname = urlObj.hostname;
    
    // Quitar el www. si existe
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    // Si hay un error al parsear la URL, intentar extraer el dominio con regex
    try {
      const domainRegex = /^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i;
      const match = url.match(domainRegex);
      
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      console.error('Error al extraer dominio con regex:', e);
    }
    
    // Si todo falla, devolver la URL original
    return url;
  }
}

interface ProductImageProps {
  imageUrl?: string;
  purchaseLink: string;
  className?: string;
  alt: string;
}

/**
 * Componente que muestra la imagen de un producto o un logo de la tienda si no hay imagen
 */
const ProductImage: React.FC<ProductImageProps> = ({ 
  imageUrl, 
  purchaseLink, 
  className = '', 
  alt 
}) => {
  const [error, setError] = useState(false);
  const [storeLogo, setStoreLogo] = useState<string | null>(null);
  
  // Extraer el dominio de la tienda para mostrar el logo si la imagen falla
  useEffect(() => {
    const domain = extractDomainFromUrl(purchaseLink);
    const logo = getStoreLogo(domain);
    setStoreLogo(logo);
  }, [purchaseLink]);
  
  // Manejador de error para cuando la imagen no carga
  const handleError = () => {
    console.log(`Error cargando imagen: ${imageUrl}`);
    setError(true);
  };
  
  // Manejador para reintentar cargar la imagen
  const resetError = () => {
    if (error && imageUrl) {
      setError(false);
    }
  };
  
  // Si hay un error o no hay imagen, mostrar el logo de la tienda
  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 ${className}`}>
        {storeLogo ? (
          <img 
            src={storeLogo} 
            alt={`Logo de ${extractDomainFromUrl(purchaseLink)}`}
            className="max-w-[60%] max-h-[60%] object-contain opacity-50"
          />
        ) : (
          <div className="text-gray-600 text-xl">Sin imagen</div>
        )}
      </div>
    );
  }
  
  return (
    <img 
      src={imageUrl} 
      alt={alt}
      className={className}
      onError={handleError}
      onClick={resetError}
      loading="lazy"
    />
  );
};

/**
 * Obtiene el logo de una tienda basado en su dominio
 */
function getStoreLogo(domain: string): string | null {
  // Mapa de dominios y sus logos (extraído del listado anterior)
  const storeLogos: Record<string, string> = {
    'amazon': '/store-logos/amazon.svg',
    'amazon.com': '/store-logos/amazon.svg',
    'amazon.es': '/store-logos/amazon.svg',
    'aliexpress': '/store-logos/aliexpress.svg',
    'aliexpress.com': '/store-logos/aliexpress.svg',
    'ebay': '/store-logos/ebay.svg',
    'ebay.com': '/store-logos/ebay.svg',
    'ebay.es': '/store-logos/ebay.svg',
    'walmart': '/store-logos/walmart.svg',
    'walmart.com': '/store-logos/walmart.svg',
    'target': '/store-logos/target.svg',
    'target.com': '/store-logos/target.svg',
    'bestbuy': '/store-logos/bestbuy.svg',
    'bestbuy.com': '/store-logos/bestbuy.svg',
    'ikea': '/store-logos/ikea.svg',
    'ikea.com': '/store-logos/ikea.svg',
    'homedepot': '/store-logos/homedepot.svg',
    'homedepot.com': '/store-logos/homedepot.svg',
    'etsy': '/store-logos/etsy.svg',
    'etsy.com': '/store-logos/etsy.svg',
    'apple': '/store-logos/apple.svg',
    'apple.com': '/store-logos/apple.svg',
    'microsoft': '/store-logos/microsoft.svg',
    'microsoft.com': '/store-logos/microsoft.svg',
    'steam': '/store-logos/steam.svg',
    'steampowered.com': '/store-logos/steam.svg',
    'nintendo': '/store-logos/nintendo.svg',
    'nintendo.com': '/store-logos/nintendo.svg',
    'playstation': '/store-logos/playstation.svg',
    'playstation.com': '/store-logos/playstation.svg',
    'xbox': '/store-logos/xbox.svg',
    'xbox.com': '/store-logos/xbox.svg',
    'zalando': '/store-logos/zalando.svg',
    'zalando.es': '/store-logos/zalando.svg',
    'zara': '/store-logos/zara.svg',
    'zara.com': '/store-logos/zara.svg',
    'hm': '/store-logos/hm.svg',
    'hm.com': '/store-logos/hm.svg',
    'nike': '/store-logos/nike.svg',
    'nike.com': '/store-logos/nike.svg',
    'adidas': '/store-logos/adidas.svg',
    'adidas.com': '/store-logos/adidas.svg',
    'pccomponentes': '/store-logos/pccomponentes.svg',
    'pccomponentes.com': '/store-logos/pccomponentes.svg',
    'elcorteingles': '/store-logos/elcorteingles.svg',
    'elcorteingles.es': '/store-logos/elcorteingles.svg',
    'fnac': '/store-logos/fnac.svg',
    'fnac.es': '/store-logos/fnac.svg',
    'carrefour': '/store-logos/carrefour.svg',
    'carrefour.es': '/store-logos/carrefour.svg',
    'mediamarkt': '/store-logos/mediamarkt.svg',
    'mediamarkt.es': '/store-logos/mediamarkt.svg',
    'decathlon': '/store-logos/decathlon.svg',
    'decathlon.es': '/store-logos/decathlon.svg',
    'wallapop': '/store-logos/wallapop.svg',
    'wallapop.com': '/store-logos/wallapop.svg',
    'vinted': '/store-logos/vinted.svg',
    'vinted.es': '/store-logos/vinted.svg',
  };
  
  // Intentar encontrar el logo por el dominio exacto
  if (storeLogos[domain]) {
    return storeLogos[domain];
  }
  
  // Intentar encontrar por dominio parcial
  for (const [storeDomain, logoPath] of Object.entries(storeLogos)) {
    if (domain.includes(storeDomain)) {
      return logoPath;
    }
  }
  
  // Si no se encuentra, devolver null
  return null;
}

export default ProductImage;