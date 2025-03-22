import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import fetch from 'node-fetch';

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
    handler: async (url: string) => {
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
    handler: async (url: string) => {
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
  }
  // Más sitios pueden ser añadidos aquí
];

// Función específica para extraer imágenes de Amazon
async function extractAmazonImage(url: string): Promise<string | undefined> {
  try {
    let fullUrl = url;
    let productId;
    
    // Maneja las URLs cortas de Amazon (amzn.to, amzn.eu, etc)
    if (url.match(/amzn\.(to|eu)/i)) {
      debug(`Intentando resolver URL corta de Amazon: ${url}`);
      
      // Para enlaces cortos de Amazon, vamos a probar un método alternativo
      // Si el enlace es de formato amzn.eu/d/XXXX, intentamos extraer el código directamente
      const shortCodeMatch = url.match(/amzn\.(to|eu)\/d\/([A-Za-z0-9]+)/i);
      if (shortCodeMatch && shortCodeMatch[2]) {
        const shortCode = shortCodeMatch[2];
        debug(`Código corto extraído: ${shortCode}`);
        
        // Para enlaces de Amazon, podemos intentar generar directamente la URL de la imagen
        // sin tener que hacer una petición HTTP
        const possibleProductId = shortCode.toUpperCase();
        if (possibleProductId.length === 10 && /^[A-Z0-9]{10}$/.test(possibleProductId)) {
          debug(`Código parece ser un ASIN válido, probando directamente`);
          return `https://m.media-amazon.com/images/I/${possibleProductId}._AC_SL500_.jpg`;
        }
      }
      
      try {
        // Utilizamos GET en lugar de HEAD para asegurarnos de obtener la redirección
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // Timeout más largo para redirecciones
        
        debug(`Haciendo petición GET a URL corta: ${url}`);
        const response = await fetch(url, {
          method: 'GET',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,es;q=0.8'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.url && response.url !== url) {
          fullUrl = response.url; // Obtenemos la URL real después de redirecciones
          debug(`URL corta resuelta a: ${fullUrl}`);
          
          // Si podemos obtener el HTML, buscaremos la imagen directamente
          try {
            const html = await response.text();
            
            // Buscar tag de Open Graph para imagen
            const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            if (ogImageMatch && ogImageMatch[1]) {
              const imageUrl = ogImageMatch[1];
              debug(`Imagen OG encontrada directamente: ${imageUrl}`);
              return imageUrl;
            }
            
            // Buscar etiqueta de imagen de producto de Amazon
            const amazonImageMatch = html.match(/id="landingImage"[^>]*data-old-hires="([^"]+)"/i) || 
                                    html.match(/id="imgBlkFront"[^>]*data-a-dynamic-image="([^"]+)"/i);
            
            if (amazonImageMatch && amazonImageMatch[1]) {
              let imageUrl = amazonImageMatch[1];
              
              // Si es JSON (data-a-dynamic-image), extraer la primera URL
              if (imageUrl.startsWith('{')) {
                try {
                  const imageJson = JSON.parse(imageUrl);
                  const imageUrls = Object.keys(imageJson);
                  if (imageUrls.length > 0) {
                    imageUrl = imageUrls[0]; // Tomamos la primera URL
                    debug(`Imagen extraída de JSON: ${imageUrl}`);
                    return imageUrl;
                  }
                } catch (e) {
                  debug(`Error al parsear JSON de imagen: ${e}`);
                }
              } else {
                debug(`Imagen extraída directamente del HTML: ${imageUrl}`);
                return imageUrl;
              }
            }
          } catch (e) {
            debug(`Error al procesar HTML: ${e}`);
          }
        }
      } catch (error) {
        debug(`No se pudo resolver la URL corta de Amazon: ${error}`);
        // En caso de error, intentaremos usar nuestra lógica de fallback
      }
    }
    
    // Patrones comunes de IDs de productos de Amazon
    const patterns = [
      /\/dp\/([A-Z0-9]{10})/, // Patrón /dp/XXXXXXXXXX
      /\/product\/([A-Z0-9]{10})/, // Patrón /product/XXXXXXXXXX
      /\/([A-Z0-9]{10})(\?|\/|$)/, // Patrón general XXXXXXXXXX
      /gp\/product\/([A-Z0-9]{10})/, // Patrón gp/product/XXXXXXXXXX
      /Amazon\.[\w.]+\/.*?\/([A-Z0-9]{10})/ // Patrón general para dominios de Amazon
    ];
    
    // Intentamos cada patrón hasta encontrar coincidencia
    for (const pattern of patterns) {
      const match = fullUrl.match(pattern);
      if (match && match[1]) {
        productId = match[1];
        debug(`ID de producto extraído con patrón: ${productId}`);
        break;
      }
    }
    
    // Si no encontramos un ID, buscamos en los segmentos de la URL
    if (!productId) {
      debug(`No se pudo extraer el ID del producto con patrones regulares. URL: ${fullUrl}`);
      
      try {
        // Intentamos extraer el ASIN del path de la URL
        const pathSegments = new URL(fullUrl).pathname.split('/').filter(Boolean);
        for (const segment of pathSegments) {
          if (segment.length === 10 && /^[A-Z0-9]{10}$/.test(segment)) {
            productId = segment;
            debug(`ASIN encontrado en segmentos de URL: ${productId}`);
            break;
          }
        }
      } catch (e) {
        debug(`Error al procesar URL para segmentos: ${e}`);
      }
      
      if (!productId) {
        debug(`No se pudo encontrar un ID de producto en la URL: ${url}`);
        return undefined;
      }
    }
    
    debug(`ID de producto Amazon extraído: ${productId}`);
    
    // Verificamos si es un ASIN válido (10 caracteres alfanuméricos)
    if (productId.length !== 10 || !/^[A-Z0-9]{10}$/.test(productId)) {
      debug(`ID de producto no parece ser un ASIN válido: ${productId}`);
      return undefined;
    }
    
    // Intentamos varios formatos de URL para Amazon
    const imageFormats = [
      // Formato 1: URL directa de imagen de productos
      `https://m.media-amazon.com/images/I/71${productId.substring(0, 8)}._AC_SL1500_.jpg`,
      // Formato 2: URL de imagen en miniaturas
      `https://images-na.ssl-images-amazon.com/images/I/${productId}._SL500_.jpg`,
      // Formato 3: URL alternativa con formato diferente
      `https://m.media-amazon.com/images/I/${productId}._AC_SY300_.jpg`,
      // Formato 4: URL con ASIN directo (menos común)
      `https://images-eu.ssl-images-amazon.com/images/P/${productId}.jpg`,
      // Formato emergencia como último recurso
      `https://images-na.ssl-images-amazon.com/images/I/${productId}.jpg`
    ];
    
    debug(`Probando diferentes formatos de URL para ASIN: ${productId}`);
    
    // Si no podemos verificar directamente las imágenes (debido a CORS o restricciones),
    // simplemente devolvemos la primera URL con esperanza de que funcione
    const imageUrl = imageFormats[0];
    debug(`Usando URL de imagen: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error("Error al extraer imagen de Amazon:", error);
    return undefined;
  }
}

export async function getUrlMetadata(url: string): Promise<{ imageUrl: string | undefined }> {
  try {
    debug(`Procesando URL para extraer imagen: ${url}`);
    
    // Validar el formato de la URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      debug(`URL con formato inválido: ${url}`);
      return { imageUrl: undefined };
    }

    // Comprobar si tenemos un extractor específico para este sitio
    for (const site of SITE_PATTERNS) {
      if (url.match(site.pattern)) {
        debug(`Usando extractor específico para: ${url}`);
        const specificImage = await site.handler(url);
        if (specificImage) {
          debug(`Imagen extraída con handler específico: ${specificImage}`);
          // Validar URL de la imagen obtenida
          try {
            new URL(specificImage);
            return { imageUrl: specificImage };
          } catch (e) {
            debug(`URL de imagen inválida del handler específico: ${specificImage}`);
          }
        }
        break; // Si el handler específico no encuentra imagen, continuamos con el método genérico
      }
    }

    // Método genérico de extracción
    try {
      debug(`Usando método genérico para: ${url}`);
      // Obtener el contenido de la página
      // Usando AbortController para manejar timeout manualmente ya que fetch no tiene opción de timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // Incrementamos el timeout
      
      debug(`Haciendo petición GET a: ${url}`);
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      // Limpiar el timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        debug(`No se pudo obtener el contenido de ${url}. Código de estado: ${response.status}`);
        return { imageUrl: undefined };
      }

      const html = await response.text();
      debug(`Contenido obtenido para ${url} (${html.length} bytes), extrayendo metadata...`);
      
      // Búsqueda manual para extraer imágenes de etiquetas HTML comunes
      let manualImageUrl: string | undefined;
      
      // Buscar tag de Open Graph para imagen
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogImageMatch && ogImageMatch[1]) {
        manualImageUrl = ogImageMatch[1];
        debug(`Imagen OG encontrada: ${manualImageUrl}`);
      }
      
      // Buscar etiqueta de Twitter para imagen
      if (!manualImageUrl) {
        const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          manualImageUrl = twitterImageMatch[1];
          debug(`Imagen Twitter encontrada: ${manualImageUrl}`);
        }
      }
      
      // Buscar otras etiquetas comunes de imagen
      if (!manualImageUrl) {
        // Buscar etiqueta de imagen principal del producto (común en tiendas)
        const productImageMatch = html.match(/id=["']?(?:main-image|product-image|product-main-image|productImage|landingImage)["']?[^>]*(?:src|data-old-hires)=["']([^"']+)["']/i);
        if (productImageMatch && productImageMatch[1]) {
          manualImageUrl = productImageMatch[1];
          debug(`Imagen de producto encontrada: ${manualImageUrl}`);
        }
      }
      
      // Buscar imágenes específicas de Amazon
      if (!manualImageUrl && url.includes('amazon')) {
        // 1. Buscar imágenes en la propiedad data-a-dynamic-image (contiene un JSON)
        const dynamicImageMatch = html.match(/data-a-dynamic-image=["']({[^}]+})["']/i);
        if (dynamicImageMatch && dynamicImageMatch[1]) {
          try {
            const imageJson = JSON.parse(dynamicImageMatch[1]);
            const imageUrls = Object.keys(imageJson);
            if (imageUrls.length > 0) {
              // Ordenar por tamaño y tomar la más grande
              imageUrls.sort((a, b) => {
                const sizeA = (imageJson[a][0] || 0) * (imageJson[a][1] || 0);
                const sizeB = (imageJson[b][0] || 0) * (imageJson[b][1] || 0);
                return sizeB - sizeA;
              });
              manualImageUrl = imageUrls[0];
              debug(`Imagen extraída de data-a-dynamic-image: ${manualImageUrl}`);
            }
          } catch (e) {
            debug(`Error al parsear JSON de imagen: ${e}`);
          }
        }
        
        // 2. Buscar el ASIN directamente en el HTML y construir URL
        if (!manualImageUrl) {
          const asinMatch = html.match(/["']ASIN["']\s*[:=]\s*["']([A-Z0-9]{10})["']/i);
          if (asinMatch && asinMatch[1]) {
            const asin = asinMatch[1];
            manualImageUrl = `https://m.media-amazon.com/images/I/71${asin.substring(0, 8)}._AC_SL1500_.jpg`;
            debug(`Imagen construida desde ASIN encontrado en HTML: ${manualImageUrl}`);
          }
        }
      }
      
      // Si encontramos una imagen manualmente, la usamos
      if (manualImageUrl) {
        try {
          // Asegurarnos de que es una URL válida
          new URL(manualImageUrl);
          debug(`URL de imagen manual validada: ${manualImageUrl}`);
          return { imageUrl: manualImageUrl };
        } catch (e) {
          debug(`URL manual parece ser relativa: ${manualImageUrl}`);
          // Intentar resolver URL relativa
          try {
            const baseUrl = new URL(url);
            const absoluteImageUrl = new URL(manualImageUrl, baseUrl.origin).toString();
            debug(`URL relativa resuelta a: ${absoluteImageUrl}`);
            return { imageUrl: absoluteImageUrl };
          } catch (e) {
            debug(`No se pudo resolver URL relativa: ${manualImageUrl}`);
          }
        }
      }
      
      // Extraer metadata con metascraper como último recurso
      try {
        debug(`Usando metascraper para: ${url}`);
        const metadata = await scraper({ html, url });
        
        // Asegurarnos de que image es string o undefined
        const imageUrl = metadata.image ? String(metadata.image) : undefined;
        
        if (imageUrl) {
          debug(`Imagen extraída con metascraper: ${imageUrl}`);
          return { imageUrl };
        } else {
          debug(`Metascraper no encontró imagen para: ${url}`);
        }
      } catch (error) {
        debug(`Error en metascraper para ${url}: ${error}`);
      }
      
      // Si llegamos hasta aquí es que no encontramos imagen
      debug(`No se encontró ninguna imagen para ${url}`);
      return { imageUrl: undefined };
    } catch (error) {
      debug(`Error en el método genérico para ${url}: ${error}`);
      return { imageUrl: undefined };
    }
  } catch (error) {
    console.error(`Error al obtener metadata para ${url}:`, error);
    return { imageUrl: undefined };
  }
}