import React, { useState, useEffect } from 'react';
import { Package, ImageIcon, ShoppingBag } from 'lucide-react';
import { sanitizeUrl } from '@/lib/sanitize';
import OptimizedImage from './OptimizedImage';
import * as SiIcons from 'react-icons/si';

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
  
  // Extraer el dominio de la URL
  const extractDomain = (url?: string): string | null => {
    if (!url) return null;
    
    try {
      // Asegurarse de que la URL tenga protocolo
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(fullUrl);
      
      // Obtener hostname y quitar www si existe
      let domain = urlObj.hostname.replace(/^www\./, '');
      
      // Simplificar los dominios más comunes para mejor mapeo
      if (domain.includes('amazon.')) return 'amazon.com';
      if (domain.includes('aliexpress.')) return 'aliexpress.com';
      if (domain.includes('ebay.')) return 'ebay.com';
      
      return domain;
    } catch (error) {
      // Si no es una URL válida, intentar extraer manualmente
      const domainMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/i);
      return domainMatch ? domainMatch[1] : null;
    }
  };
  
  // Verificar si el dominio debe usar un icono genérico (ShoppingBag)
  const shouldUseGenericIcon = (domain: string): boolean => {
    const genericDomains = [
      'pccomponentes.com',
      'fnac.es',
      'fnac.com',
      'elcorteingles.es',
      'carrefour.es',
      'alcampo.es',
      'lidl.es',
      'dia.es',
      'decathlon.es',
      'leroy.com',
      'leroymerlin.es',
      'coolmod.com',
      'ldlc.com',
      'asos.com',
      'zalando.es',
      'cortefiel.com',
      'mercadona.es',
      'alimerka.es',
      'conforama.es',
      'worten.es',
      'primark.com',
      'pullandbear.com',
      'bershka.com',
      'massimodutti.com',
      'stradivarius.com',
      'oysho.com',
      'corte.es',
      'eci.com'
    ];
    
    return genericDomains.some(genericDomain => 
      domain.includes(genericDomain.replace('.com', '').replace('.es', ''))
    );
  };

  // Mapear dominios a nombres de iconos de react-icons/si
  const getDomainIconName = (domain: string): string | null => {
    // Normalizar el dominio para las coincidencias
    domain = domain.toLowerCase();
    
    // Si el dominio está en la lista de dominios que deben usar icono genérico
    if (shouldUseGenericIcon(domain)) {
      return null;
    }
    
    const domainMappings: Record<string, string> = {
      // Marketplaces internacionales
      'amazon.com': 'SiAmazon',
      'amazon.es': 'SiAmazon',
      'ebay.com': 'SiEbay',
      'ebay.es': 'SiEbay',
      'aliexpress.com': 'SiAliexpress',
      'walmart.com': 'SiWalmart',
      'etsy.com': 'SiEtsy',
      
      // Tiendas de ropa
      'zara.com': 'SiZara',
      'nike.com': 'SiNike',
      'adidas.com': 'SiAdidas',
      'hm.com': 'SiHm',
      'mango.com': 'SiMango',
      
      // Tecnología
      'apple.com': 'SiApple',
      'microsoft.com': 'SiMicrosoft',
      'samsung.com': 'SiSamsung',
      'huawei.com': 'SiHuawei',
      'xiaomi.com': 'SiXiaomi',
      'mi.com': 'SiXiaomi',
      'oneplus.com': 'SiOneplus',
      'sony.com': 'SiSony',
      'lg.com': 'SiLg',
      
      // Gaming
      'playstation.com': 'SiPlaystation',
      'nintendo.com': 'SiNintendoswitch',
      'xbox.com': 'SiXbox',
      'steam.com': 'SiSteam',
      'steampowered.com': 'SiSteam',
      'epicgames.com': 'SiEpicgames',
      'gog.com': 'SiGog',
      'ubisoft.com': 'SiUbisoft',
      'ea.com': 'SiEa',
      
      // Tecnología globales
      'mediamarkt.es': 'SiMediamarkt',
      'ikea.com': 'SiIkea',
      
      // Otros sites populares
      'booking.com': 'SiBooking',
      'airbnb.com': 'SiAirbnb',
      'spotify.com': 'SiSpotify',
      'netflix.com': 'SiNetflix',
      'primevideo.com': 'SiAmazon',
      'disneyplus.com': 'SiDisney',
      'hbomax.com': 'SiHbo'
    };
    
    // Intentar coincidencia exacta primero
    if (domainMappings[domain]) {
      return domainMappings[domain];
    }
    
    // Si no hay coincidencia exacta, buscar coincidencias parciales
    for (const [key, value] of Object.entries(domainMappings)) {
      if (domain.includes(key.replace('.com', '').replace('.es', ''))) {
        return value;
      }
    }
    
    return null;
  };
  
  // Verificar si es un blob URL o una URL local (no una URL remota de una tienda)
  const isBlobOrLocalUrl = (): boolean => {
    if (!imageUrl) return false;
    
    const url = imageUrl;
    // Consideramos URLs locales seguras, pero igual verificamos que no tengan protocolos peligrosos
    const isSafe = !/^(?:javascript|vbscript|file):/i.test(url);
    
    // Verificar si es una URL relativa (/uploads/) o con origen del mismo dominio
    const isLocal = (
      url.startsWith('blob:') || 
      url.startsWith('data:image/') || // Solo permitimos data: URLs para imágenes
      url.startsWith('/') ||
      url.startsWith('http://localhost') ||
      (url.includes('/uploads/'))
    );
    
    // Si es una URL que incluye /uploads/ pero es relativa, considerarla local aunque venga desde otro origen
    if (url.includes('/uploads/')) {
      console.log('Es una URL local de uploads, considerándola segura', url);
      return isSafe;
    }
    
    return isSafe && isLocal;
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
  
  // Componente que muestra el logo de la tienda basado en el dominio
  const DomainLogo: React.FC<{ domain: string | null }> = ({ domain }) => {
    if (!domain) {
      return <ShoppingBag size={48} className="text-[#444444]" strokeWidth={1.5} />;
    }
    
    // Verificar si este dominio debe usar el icono de bolsa de compras genérico
    if (shouldUseGenericIcon(domain)) {
      return <ShoppingBag size={48} className="text-[#444444]" strokeWidth={1.5} />;
    }
    
    // Intentar obtener el nombre del icono de la tienda
    const iconName = getDomainIconName(domain);
    
    if (!iconName) {
      // Para dominios sin mapeo específico, usar el icono de bolsa de compras
      return <ShoppingBag size={48} className="text-[#444444]" strokeWidth={1.5} />;
    }
    
    // Si el icono existe en react-icons/si, mostrarlo
    // @ts-ignore - SiIcons es dinámico y TypeScript no puede inferir los tipos
    const Icon = SiIcons[iconName];
    
    if (Icon) {
      return <Icon size={60} className="text-gray-900" />;
    }
    
    // Fallback a un icono genérico
    return <ShoppingBag size={48} className="text-[#444444]" strokeWidth={1.5} />;
  };
  
  // Si es una tienda problemática, no hay URL o hubo un error, mostrar placeholder con logo
  if (shouldUseInitialsPlaceholder()) {
    // Extraer el dominio de la URL del producto
    const domain = extractDomain(purchaseLink);
    
    return (
      <div className={`relative flex flex-col items-center justify-center shadow-inner bg-gradient-to-b from-white to-gray-50 ${className}`}>
        <DomainLogo domain={domain} />
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
      
      {/* Mostrar placeholder con logo de la tienda si la imagen falla */}
      {imgState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50">
          <DomainLogo domain={extractDomain(purchaseLink)} />
        </div>
      )}
    </div>
  );
};

export default ProductImage;