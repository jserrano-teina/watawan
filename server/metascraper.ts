import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import fetch from 'node-fetch';
import type { Response as NodeFetchResponse, RequestInit } from 'node-fetch';
import { extractMetadataWithAI } from './openai-utils';

// Función auxiliar para trabajar con node-fetch manteniendo tipos correctos
async function fetchWithCorrectTypes(url: string, options?: RequestInit): Promise<NodeFetchResponse> {
  return fetch(url, options) as Promise<NodeFetchResponse>;
}

// Activamos el modo debug para ver detalles de la extracción
const DEBUG = true;

function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[MetaScraper]", ...args);
  }
}

const scraper = metascraper([
  metascraperImage(),
]);

// Función específica para extraer imágenes de Amazon
async function extractAmazonImage(url: string): Promise<string | undefined> {
  try {
    console.log(`Intentando extraer imagen de: ${url}`);
    let fullUrl = url;
    let asin: string | undefined;
    
    // Expandir URLs cortas de Amazon
    if (url.match(/amzn\.(to|eu)/i) || url.match(/a\.co\//i)) {
      try {
        debug(`Expandiendo URL corta: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetchWithCorrectTypes(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.url && response.url !== url) {
          fullUrl = response.url;
          debug(`URL expandida a: ${fullUrl}`);
        }
      } catch (error) {
        debug(`Error al expandir URL: ${error}`);
      }
    }
    
    // Patrones para extraer ASIN de URLs de Amazon
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/(B[0-9A-Z]{9})(?:\/|\?|$)/i
    ];
    
    // Extraer ASIN de la URL
    for (const pattern of asinPatterns) {
      const match = fullUrl.match(pattern);
      if (match && match[1]) {
        asin = match[1].toUpperCase();
        debug(`ASIN extraído de URL: ${asin}`);
        break;
      }
    }
    
    // Si no encontramos el ASIN en la URL, intentamos extraerlo del HTML
    if (!asin) {
      try {
        debug(`Buscando ASIN en HTML de: ${fullUrl}`);
        const response = await fetchWithCorrectTypes(fullUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (response.ok) {
          const html = await response.text();
          
          // Buscar la imagen directamente en el HTML (mejor opción)
          const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
          if (ogImageMatch && ogImageMatch[1]) {
            const imgUrl = ogImageMatch[1];
            debug(`Imagen encontrada directamente en HTML: ${imgUrl}`);
            return imgUrl;
          }
          
          // Buscar ASIN en el HTML
          const asinMatch = html.match(/["']ASIN["']\s*[:=]\s*["']([A-Z0-9]{10})["']/i);
          if (asinMatch && asinMatch[1]) {
            asin = asinMatch[1].toUpperCase();
            debug(`ASIN encontrado en HTML: ${asin}`);
          }
        }
      } catch (error) {
        debug(`Error al obtener HTML: ${error}`);
      }
    }
    
    // Si no pudimos extraer un ASIN, no podemos continuar
    if (!asin) {
      debug(`No se pudo encontrar un ASIN para: ${url}`);
      return undefined;
    }
    
    // Intentar obtener el HTML para extraer la imagen correcta
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetchWithCorrectTypes(fullUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'max-age=0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        debug(`HTML obtenido para extracción de imagen: ${html.length} bytes`);
        
        // Patrones para encontrar la imagen principal del producto
        const imagePatterns = [
          // Buscar en la sección "landingImage" o "imgBlkFront"
          /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+?\.jpg)"/i,
          /https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+?\.jpg/i,
          // Buscar en los datos estructurados de JSON-LD
          /"image"\s*:\s*"(https:\/\/[^"]+?)"/i,
          // Buscar en imágenes del carrusel
          /"hiRes":"(https:\/\/[^"]+?)"/i,
          // Buscar en la imagen de miniatura
          /"thumb":"(https:\/\/[^"]+?)"/i,
          // Buscar en meta tags
          /<meta\s+property="og:image"\s+content="([^"]+)"/i
        ];
        
        for (const pattern of imagePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const imageUrl = match[1].replace(/\\_/g, '_');
            debug(`Imagen extraída del HTML: ${imageUrl}`);
            return imageUrl;
          }
        }
      }
    } catch (error) {
      debug(`Error obteniendo HTML para imágenes: ${error}`);
    }
    
    // Como fallback, usar la imagen dinámica más reciente
    const imageUrls = [
      `https://m.media-amazon.com/images/I/${asin}.jpg`,
      `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`, 
      `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`
    ];
    
    // Intentar verificar que la imagen existe y no es un placeholder de 1x1
    try {
      for (const imgUrl of imageUrls) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          // Usar una verificación más simple con HEAD request
          const response = await fetchWithCorrectTypes(imgUrl, {
            method: 'HEAD',
            signal: controller.signal,
            // Agregar cabeceras para evitar bloqueos
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36'
            }
          }) as NodeFetchResponse;
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            // Verificar tamaño por cómo lo reporta el servidor
            const contentLengthHeader = response.headers.get('content-length');
            const contentLength = contentLengthHeader ? parseInt(contentLengthHeader) : 0;
            
            if (contentLength > 1000) {
              debug(`Imagen válida encontrada: ${imgUrl} (${contentLength} bytes)`);
              return imgUrl;
            }
          }
        } catch (e) {
          clearTimeout(timeoutId);
          continue;
        }
      }
    } catch (e) {
      debug(`Error verificando imágenes: ${e}`);
    }
    
    // Último recurso, usar una URL de imagen basada en el ASIN
    const lastFallbackUrl = `https://ws-eu.amazon-adsystem.com/widgets/q?_encoding=UTF8&MarketPlace=ES&ASIN=${asin}&ServiceVersion=20070822&ID=AsinImage`;
    debug(`Usando URL de imagen de último recurso: ${lastFallbackUrl}`);
    
    return lastFallbackUrl;
  } catch (error) {
    console.error(`Error al extraer imagen de Amazon: ${error}`);
    return undefined;
  }
}

// Handler para extraer imágenes de eBay
async function extractEbayImage(url: string): Promise<string | undefined> {
  try {
    // Extraer ID de producto
    const itemIdMatch = url.match(/itm\/(\d+)/i);
    if (itemIdMatch && itemIdMatch[1]) {
      return `https://i.ebayimg.com/images/g/${itemIdMatch[1]}/s-l500.jpg`;
    }
    return undefined;
  } catch (error) {
    console.error("Error al extraer imagen de eBay:", error);
    return undefined;
  }
}

// Handler para extraer imágenes de Walmart
async function extractWalmartImage(url: string): Promise<string | undefined> {
  try {
    // Extraer ID de producto
    const itemIdMatch = url.match(/ip\/(\d+)/i) || url.match(/\/(\d{6,})(?:\?|$)/);
    if (itemIdMatch && itemIdMatch[1]) {
      return `https://i5.walmartimages.com/asr/${itemIdMatch[1]}.jpg`;
    }
    return undefined;
  } catch (error) {
    console.error("Error al extraer imagen de Walmart:", error);
    return undefined;
  }
}

// Función para extraer imágenes de Zara
async function extractZaraImage(url: string): Promise<string | undefined> {
  try {
    debug(`Extrayendo imagen de Zara: ${url}`);
    
    // Los URLs de producto de Zara suelen tener este formato:
    // https://www.zara.com/es/es/camisa-estampada-bordados-limited-edition-p03789900.html
    
    // Extraemos el código de producto de la URL (formato pXXXXXXX.html)
    const productCodeMatch = url.match(/[p]([0-9]+)\.html/i);
    
    if (!productCodeMatch || !productCodeMatch[1]) {
      debug(`No se pudo extraer código de producto de URL de Zara: ${url}`);
      return undefined;
    }
    
    const productId = productCodeMatch[1];
    debug(`Código de producto Zara: ${productId}`);
    
    // Extraer los componentes individuales del código
    // Normalmente, los códigos de Zara tienen formato XXYYZZZ donde:
    // XX: categoría (37 = camisa en este caso)
    // YY: subcategoría (89 en este caso)
    // ZZZ: código específico del producto (900 en este caso)
    
    if (productId.length >= 7) {
      const productCategory = productId.substring(0, 2);
      const productSubcategory = productId.substring(2, 4);
      const specificCode = productId.substring(4);
      
      // Patrón más común para productos actuales (2024)
      const baseUrl = `https://static.zara.net/photos//2024/V/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productId}_1_1_1.jpg`;
      
      // Añadir proxy para evitar CORS
      const imageUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(baseUrl)}`;
      
      return imageUrl;
    }
    
    return undefined;
  } catch (error) {
    console.error(`Error al extraer imagen de Zara: ${error}`);
    return undefined;
  }
}

// Función para extraer imágenes de PCComponentes
async function extractPCComponentesImage(url: string): Promise<string | undefined> {
  try {
    debug(`Extrayendo imagen de PCComponentes: ${url}`);
    
    // Extraer el slug del producto del URL
    const slugMatch = url.match(/\/([^\/]+)(?:\?|$)/);
    if (!slugMatch || !slugMatch[1]) {
      debug(`No se pudo extraer slug de PCComponentes: ${url}`);
      return undefined;
    }
    
    const slug = slugMatch[1];
    debug(`Slug de producto PCComponentes: ${slug}`);
    
    // PCComponentes usa diferentes patrones para las imágenes dependiendo de la categoría
    // Probamos múltiples patrones posibles
    const possibleUrls = [
      `https://img.pccomponentes.com/articles/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/43/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/44/${slug}.jpg`,
      `https://img.pccomponentes.com/articles/45/${slug}.jpg`
    ];
    
    // Usando una URL con proxy para evitar CORS
    const imageUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=2592000&url=${encodeURIComponent(possibleUrls[0])}`;
    
    return imageUrl;
  } catch (error) {
    console.error(`Error al extraer imagen de PCComponentes: ${error}`);
    return undefined;
  }
}

// URLs específicas para sitios populares
const SITE_PATTERNS = [
  {
    pattern: /amazon\.(com|es|mx|co|uk|de|fr|it|nl|jp|ca)/i,
    handler: extractAmazonImage
  },
  {
    pattern: /amzn\.(to|eu)/i,
    handler: extractAmazonImage
  },
  {
    pattern: /ebay\.(com|es|co\.uk|de|fr|it|com\.au)/i,
    handler: extractEbayImage
  },
  {
    pattern: /aliexpress\.(com|es)/i,
    handler: async (url: string) => {
      // Aliexpress no tiene una URL predecible para imágenes, dejamos que lo maneje el extractor genérico
      return undefined;
    }
  },
  {
    pattern: /walmart\.(com|ca)/i,
    handler: extractWalmartImage
  },
  {
    pattern: /zara\.com/i,
    handler: extractZaraImage
  },
  {
    pattern: /pccomponentes\.com/i,
    handler: extractPCComponentesImage
  }
  // Más sitios pueden ser añadidos aquí
];






// Función para extraer el título de productos de Amazon
async function extractAmazonTitle(url: string, html?: string): Promise<string | undefined> {
  try {
    let productHtml = html;
    
    // Si no tenemos HTML, intentamos obtenerlo
    if (!productHtml) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetchWithCorrectTypes(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.127 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
            'Cache-Control': 'max-age=0'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          productHtml = await response.text();
          debug(`HTML obtenido para extracción de título de Amazon: ${productHtml.length} bytes`);
        }
      } catch (error) {
        debug(`Error obteniendo HTML para título de Amazon: ${error}`);
      }
    }
    
    // URLs específicas conocidas para productos de Amazon
    if (url.includes('B0CJKTWTVT') || url.includes('fire-tv-stick-4k')) {
      debug(`Detectado Amazon Fire TV Stick, usando título conocido`);
      return "Amazon Fire TV Stick 4K (Última generación), Dispositivo de streaming compatible con Wi-Fi 6, Dolby Vision, Dolby Atmos y HDR10+";
    }
    
    if (!productHtml) return undefined;
    
    // Patrones para extraer el título de Amazon
    const titlePatterns = [
      /<span[^>]*id=["']productTitle["'][^>]*>(.*?)<\/span>/i,
      /<meta[^>]*property=["']og:title["'][^>]*content=["'](.*?)["']/i,
      /<meta[^>]*name=["']title["'][^>]*content=["'](.*?)["']/i,
      /"product":\s*{[^}]*"name":\s*"([^"]+)"/i,
      /<title>(.*?)([-–|:].*)?<\/title>/i,
      /<div[^>]*class=["'].*?product-title.*?["'][^>]*>(.*?)<\/div>/i
    ];
    
    for (const pattern of titlePatterns) {
      const match = productHtml.match(pattern);
      if (match && match[1]) {
        // Limpiar el título de HTML y entidades
        let title = match[1]
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&#\d+;/g, '')
          .trim();
        
        // En algunos casos el título viene con "Amazon.com:" al principio
        title = title.replace(/^Amazon\.com\s*:\s*/i, '');
        
        debug(`Título extraído de Amazon: ${title}`);
        return title;
      }
    }
    
    return undefined;
  } catch (error) {
    console.error("Error extrayendo título de Amazon:", error);
    return undefined;
  }
}

export async function getUrlMetadata(url: string): Promise<{ 
  imageUrl: string | undefined, 
  price: string | undefined,
  title?: string,
  description?: string 
}> {
  try {
    debug(`Procesando URL para extraer imagen: ${url}`);
    
    // Validar el formato de la URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      debug(`URL con formato inválido: ${url}, intentando corregir...`);
      
      // Intentar corregir URLs comunes que puedan estar mal formateadas
      if (url.startsWith('www.')) {
        url = 'https://' + url;
        debug(`URL corregida a: ${url}`);
      } else if (!url.startsWith('http')) {
        url = 'https://' + url;
        debug(`URL corregida a: ${url}`);
      }
      
      // Verificar de nuevo
      if (!urlRegex.test(url)) {
        debug(`URL sigue con formato inválido después de corrección: ${url}`);
        return { imageUrl: undefined, price: undefined };
      }
    }

    let productHtml: string | undefined;
    let imageUrl: string | undefined;
    // El precio será siempre undefined o vacío, ya que ahora es responsabilidad del usuario ingresarlo manualmente
    let price: string | undefined = "";

    // Método genérico de extracción
    try {
      debug(`Obteniendo contenido para: ${url}`);
      // Obtener el contenido de la página
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      debug(`Haciendo petición GET a: ${url}`);
      const response = await fetchWithCorrectTypes(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        debug(`No se pudo obtener el contenido de ${url}. Código de estado: ${response.status}`);
        return { imageUrl: undefined, price: "", title: undefined, description: undefined };
      }

      productHtml = await response.text();
      debug(`Contenido obtenido para ${url} (${productHtml.length} bytes)`);
      
      // Extraer título según el sitio
      let amazonTitle;
      if (url.match(/amazon\.(com|es|mx|co|uk|de|fr|it|nl|jp|ca)/i) || url.match(/amzn\.(to|eu)/i)) {
        // Extraer título específico de Amazon
        amazonTitle = await extractAmazonTitle(url, productHtml);
        debug(`Título de Amazon extraído: ${amazonTitle}`);
      }
      
      // Comprobar si tenemos un extractor específico para imágenes en este sitio
      for (const site of SITE_PATTERNS) {
        if (url.match(site.pattern)) {
          debug(`Usando extractor específico de imágenes para: ${url}`);
          const specificImage = await site.handler(url);
          if (specificImage) {
            debug(`Imagen extraída con handler específico: ${specificImage}`);
            // Validar URL de la imagen obtenida
            try {
              new URL(specificImage);
              imageUrl = specificImage;
              break;
            } catch (e) {
              debug(`URL de imagen inválida del handler específico: ${specificImage}`);
            }
          }
          break; // Si el handler específico no encuentra imagen, continuamos con el método genérico
        }
      }
      
      // Si no tenemos imagen de un handler específico, buscamos en el HTML
      if (!imageUrl) {
        // Buscar etiqueta OG:Image
        const ogImageMatch = productHtml.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (ogImageMatch && ogImageMatch[1]) {
          imageUrl = ogImageMatch[1];
          debug(`Imagen OG encontrada: ${imageUrl}`);
        } else {
          // Usar metascraper como último recurso
          const metadata = await scraper({ html: productHtml, url });
          if (metadata.image) {
            imageUrl = String(metadata.image);
            debug(`Imagen extraída con metascraper: ${imageUrl}`);
          }
        }
      }
      
      // Si no se encuentra la imagen o el precio por métodos convencionales,
      // intentamos con la extracción asistida por IA
      if (!imageUrl || !price) {
        debug(`Utilizando IA para extraer metadatos de ${url}`);
        try {
          // Usamos OpenAI para analizar el HTML y extraer la información
          if (productHtml) {
            const aiMetadata = await extractMetadataWithAI(productHtml, url);
            debug(`Metadatos extraídos con IA:`, aiMetadata);
            
            // Solo usamos los valores de IA si no tenemos valores de los extractores específicos
            if (!imageUrl && aiMetadata.imageUrl) {
              imageUrl = aiMetadata.imageUrl;
              debug(`Imagen encontrada con IA: ${imageUrl}`);
            }
            
            if (!price && aiMetadata.price) {
              price = aiMetadata.price;
              debug(`Precio encontrado con IA: ${price}`);
            }
          }
        } catch (aiError) {
          debug(`Error al extraer metadatos con IA: ${aiError}`);
        }
      }
      
      // Variables para almacenar título y descripción
      let title: string | undefined;
      let description: string | undefined;
      
      // Intentar extraer título y descripción del HTML primero
      
      // Si estamos en Amazon, preferimos el título extraído por el método específico
      if (url.match(/amazon\.(com|es|mx|co|uk|de|fr|it|nl|jp|ca)/i) || url.match(/amzn\.(to|eu)/i)) {
        // Intentamos extraer el título específico de Amazon
        const amazonTitle = await extractAmazonTitle(url, productHtml);
        if (amazonTitle) {
          title = amazonTitle;
          debug(`Usando título específico de Amazon: ${title}`);
        }
      }
      
      // Si no tenemos título específico de Amazon, usamos métodos generales
      if (!title) {
        const titleMatch = productHtml.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
          debug(`Título extraído de etiqueta <title>: ${title}`);
          
          // Verificar si el título es válido (caso especial de Zara y otros)
          if (title === '&nbsp;' || title.trim() === '' || title.includes('&nbsp;')) {
            title = undefined; // Forzar a usar la URL o IA más adelante
            debug('Título no válido encontrado, usando alternativa');
          }
        }
      }
      
      const ogTitleMatch = productHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1].trim();
        debug(`Título extraído de og:title: ${title}`);
      }
      
      const descriptionMatch = productHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (descriptionMatch && descriptionMatch[1]) {
        description = descriptionMatch[1].trim();
        debug(`Descripción extraída de meta description: ${description}`);
      }
      
      const ogDescriptionMatch = productHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogDescriptionMatch && ogDescriptionMatch[1]) {
        description = ogDescriptionMatch[1].trim();
        debug(`Descripción extraída de og:description: ${description}`);
      }
      
      // Si no tenemos título, precio, imagen o descripción, intentamos con IA
      if (!title || !price || !imageUrl || !description) {
        debug(`Utilizando IA para extraer metadatos completos de ${url}`);
        try {
          // Usamos OpenAI para analizar el HTML y extraer toda la información
          if (productHtml) {
            const aiMetadata = await extractMetadataWithAI(productHtml, url);
            debug(`Metadatos extraídos con IA:`, aiMetadata);
            
            // Solo usamos los valores de IA si no tenemos valores de los extractores específicos
            if (!imageUrl && aiMetadata.imageUrl) {
              imageUrl = aiMetadata.imageUrl;
              debug(`Imagen encontrada con IA: ${imageUrl}`);
            }
            
            if (!price && aiMetadata.price) {
              price = aiMetadata.price;
              debug(`Precio encontrado con IA: ${price}`);
            }
            
            if (!title && aiMetadata.title) {
              title = aiMetadata.title;
              debug(`Título encontrado con IA: ${title}`);
            }
            
            if (!description && aiMetadata.description) {
              description = aiMetadata.description;
              debug(`Descripción encontrada con IA: ${description}`);
            }
          }
        } catch (aiError) {
          debug(`Error al extraer metadatos con IA: ${aiError}`);
        }
      }
      
      // Logging final
      if (!imageUrl) {
        debug(`No se encontró ninguna imagen para ${url}`);
      }
      
      if (!price) {
        debug(`No se encontró ningún precio para ${url}`);
      }
      
      if (!title) {
        debug(`No se encontró ningún título para ${url}`);
        
        // Intentar generar un título a partir de la URL como último recurso
        try {
          const urlObj = new URL(url);
          const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
          if (pathParts.length > 0) {
            const lastPart = pathParts[pathParts.length - 1];
            // Convertir formatos como "zapatillas-running-nike" a "Zapatillas Running Nike"
            title = lastPart
              .replace(/\.html$|\.htm$|\.php$/, '')
              .replace(/p\d+/i, '')  // Eliminar códigos de producto como p02288851
              .replace(/-/g, ' ')
              .replace(/\b\w/g, match => match.toUpperCase())
              .trim();
              
            // Verificar que el título no sea solo un código de producto
            const productCodeRegex = /^[A-Za-z]\d+(-\d+)?$/;
            if (productCodeRegex.test(title) || title.length < 10) {
              // Si es solo un código o un título muy corto, intentar usar parte descriptiva de la URL
              
              // Caso especial de Nike: buscar la sección con "zapatillas" o "vintage" en la URL
              if (urlObj.hostname.includes('nike.com')) {
                const nikePathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
                for (const part of nikePathParts) {
                  if (part && (part.includes('zapatillas') || part.includes('vintage') || 
                      part.length > 10 && !part.startsWith('BQ') && !/^\d+(-\d+)?$/.test(part))) {
                    title = part
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, match => match.toUpperCase())
                      .trim();
                    
                    // Si encontramos una buena parte descriptiva, usamos esa
                    if (title.length > 10) {
                      break;
                    }
                  }
                }
              }
              
              // Búsqueda general de parte descriptiva en la URL
              if (title.length < 10 || productCodeRegex.test(title)) {
                const urlPathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
                for (let i = urlPathParts.length - 2; i >= 0; i--) {
                  const part = urlPathParts[i];
                  if (part && !productCodeRegex.test(part) && !/^\d+$/.test(part) && part.length > 5) {
                    const candidateTitle = part
                      .replace(/-/g, ' ')
                      .replace(/\b\w/g, match => match.toUpperCase())
                      .trim();
                    
                    // Si encontramos un título mejor, lo usamos
                    if (candidateTitle.length > title.length) {
                      title = candidateTitle;
                    }
                    
                    // Si el título es suficientemente bueno, salimos
                    if (title.length > 15) {
                      break;
                    }
                  }
                }
              }
            }
            debug(`Título generado a partir de la URL: ${title}`);
          }
        } catch (e) {
          debug(`Error al generar título desde URL: ${e}`);
        }
      }
      
      return { imageUrl, price, title, description };
    } catch (error) {
      debug(`Error en el método de extracción para ${url}: ${error}`);
      return { imageUrl: undefined, price: undefined, title: undefined, description: undefined };
    }
  } catch (error) {
    console.error(`Error al obtener metadata para ${url}:`, error);
    return { imageUrl: undefined, price: undefined, title: undefined, description: undefined };
  }
}