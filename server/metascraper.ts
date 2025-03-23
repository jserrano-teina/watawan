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
        
        const response = await fetch(url, {
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
        const response = await fetch(fullUrl, {
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
    
    // Si no pudimos extraer un ASIN, no podemos generar la imagen
    if (!asin) {
      debug(`No se pudo encontrar un ASIN para: ${url}`);
      return undefined;
    }
    
    // Generar URL de imagen usando el ASIN
    const imageUrl = `https://images-na.ssl-images-amazon.com/images/P/${asin}.jpg`;
    debug(`URL de imagen generada: ${imageUrl}`);
    
    return imageUrl;
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

export async function getUrlMetadata(url: string): Promise<{ imageUrl: string | undefined }> {
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
        return { imageUrl: undefined };
      }
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      debug(`Haciendo petición GET a: ${url}`);
      const response = await fetch(url, {
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
        return { imageUrl: undefined };
      }

      const html = await response.text();
      debug(`Contenido obtenido para ${url} (${html.length} bytes)`);
      
      // Buscar etiqueta OG:Image
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogImageMatch && ogImageMatch[1]) {
        const imageUrl = ogImageMatch[1];
        debug(`Imagen OG encontrada: ${imageUrl}`);
        return { imageUrl };
      }
      
      // Usar metascraper como último recurso
      const metadata = await scraper({ html, url });
      if (metadata.image) {
        const imageUrl = String(metadata.image);
        debug(`Imagen extraída con metascraper: ${imageUrl}`);
        return { imageUrl };
      }
      
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