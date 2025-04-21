import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';

// Interfaz para los metadatos que extraemos
export interface MetadataResult {
  title: string;
  description: string;
  imageUrl: string;
  price: string; // Siempre vacío según nuevas especificaciones
}

// Patrones de imágenes para tiendas específicas
interface StorePattern {
  pattern: RegExp;
  imageExtractor: (url: string, html: string) => Promise<string | null>;
}

/**
 * Extrae metadatos básicos de una URL usando múltiples métodos
 * Versión mejorada con estrategias de fallback para mejorar la cobertura
 */
export async function extractOpenGraphData(url: string): Promise<MetadataResult> {
  console.log(`🔍 Extrayendo metadatos para: ${url}`);
  
  const DEFAULT_RESULT: MetadataResult = {
    title: '',
    description: '',
    imageUrl: '',
    price: '' // Siempre vacío por especificación
  };
  
  try {
    // Configurar cabeceras para simular un navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Configurar un timeout razonable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Realizar la petición HTTP
    const response = await fetch(url, {
      method: 'GET',
      headers,
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`❌ Error al obtener la página: ${response.status} ${response.statusText}`);
      return getMetadataFromUrl(url); // Intentar extraer información básica de la URL
    }
    
    const html = await response.text();
    
    // Extraer metadatos
    const result = { ...DEFAULT_RESULT };
    
    // EXTRACCIÓN DEL TÍTULO - PRIORIDAD:
    // 1. Open Graph
    // 2. Meta title
    // 3. Title tag
    // 4. JSON-LD (Schema.org)
    // 5. H1 tag
    // 6. Extraer de la URL
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaTitleMatch = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const twitterTitleMatch = html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = ogTitleMatch[1].trim();
      console.log('✓ Título encontrado en Open Graph');
    } else if (twitterTitleMatch && twitterTitleMatch[1]) {
      result.title = twitterTitleMatch[1].trim();
      console.log('✓ Título encontrado en Twitter Card');
    } else if (metaTitleMatch && metaTitleMatch[1]) {
      result.title = metaTitleMatch[1].trim();
      console.log('✓ Título encontrado en meta title');
    } else if (titleTagMatch && titleTagMatch[1]) {
      result.title = titleTagMatch[1].trim();
      console.log('✓ Título encontrado en title tag');
    } else if (h1Match && h1Match[1]) {
      // Limpiar etiquetas HTML del H1
      result.title = h1Match[1].replace(/<[^>]*>/g, '').trim();
      console.log('✓ Título encontrado en H1');
    }
    
    // Si no encontramos un título, intentamos extraerlo de JSON-LD
    if (!result.title) {
      try {
        const schemaOrgPattern = new RegExp('<script[^>]*type=["\'](application/ld\\+json)["\'][^>]*>([\\s\\S]*?)</script>', 'i');
        const schemaOrgMatch = html.match(schemaOrgPattern);
        if (schemaOrgMatch && schemaOrgMatch[2]) {
          const jsonData = JSON.parse(schemaOrgMatch[2]);
          
          // Buscar título en Schema.org
          if (jsonData && jsonData.name) {
            result.title = jsonData.name;
            console.log('✓ Título encontrado en Schema.org JSON-LD');
          } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].name) {
            result.title = jsonData[0].name;
            console.log('✓ Título encontrado en Schema.org JSON-LD (array)');
          }
        }
      } catch (e) {
        console.log('Error al parsear JSON-LD:', e);
      }
    }
    
    // Descripción: Primero Open Graph, luego meta description
    const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const twitterDescMatch = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    if (ogDescriptionMatch && ogDescriptionMatch[1]) {
      result.description = ogDescriptionMatch[1].trim();
    } else if (twitterDescMatch && twitterDescMatch[1]) {
      result.description = twitterDescMatch[1].trim();
    } else if (metaDescriptionMatch && metaDescriptionMatch[1]) {
      result.description = metaDescriptionMatch[1].trim();
    }
    
    // EXTRACCIÓN DE IMAGEN - PRIORIDAD:
    // 1. Open Graph
    // 2. Twitter Card
    // 3. Meta image
    // 4. Patrones específicos para tiendas (Amazon, etc.)
    // 5. Imágenes destacadas en el HTML
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaImageMatch = html.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      result.imageUrl = ogImageMatch[1].trim();
      console.log('✓ Imagen encontrada en Open Graph');
    } else if (twitterImageMatch && twitterImageMatch[1]) {
      result.imageUrl = twitterImageMatch[1].trim();
      console.log('✓ Imagen encontrada en Twitter Card');
    } else if (metaImageMatch && metaImageMatch[1]) {
      result.imageUrl = metaImageMatch[1].trim();
      console.log('✓ Imagen encontrada en meta image');
    } else {
      // Comprobar patrones específicos para tiendas
      const urlLower = url.toLowerCase();
      
      // Amazon
      if (urlLower.includes('amazon.')) {
        const amazonImg = await extractAmazonImage(url, html);
        if (amazonImg) {
          result.imageUrl = amazonImg;
          console.log('✓ Imagen extraída de Amazon');
        }
      } 
      // Zara
      else if (urlLower.includes('zara.com')) {
        const zaraImg = await extractZaraImage(url, html);
        if (zaraImg) {
          result.imageUrl = zaraImg;
          console.log('✓ Imagen extraída de Zara');
        }
      }
      // AliExpress
      else if (urlLower.includes('aliexpress.')) {
        const aliImg = await extractGenericLargeImage(html);
        if (aliImg) {
          result.imageUrl = aliImg;
          console.log('✓ Imagen extraída de AliExpress');
        }
      }
      
      // Si aún no tenemos imagen, buscar imágenes destacadas en el HTML
      if (!result.imageUrl) {
        const largeImage = await extractGenericLargeImage(html);
        if (largeImage) {
          result.imageUrl = largeImage;
          console.log('✓ Imagen destacada encontrada en HTML');
        }
      }
    }
    
    // Asegurarse de que las URLs de imágenes sean absolutas
    if (result.imageUrl && !result.imageUrl.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        if (result.imageUrl.startsWith('//')) {
          result.imageUrl = urlObj.protocol + result.imageUrl;
        } else if (result.imageUrl.startsWith('/')) {
          result.imageUrl = urlObj.origin + result.imageUrl;
        } else {
          result.imageUrl = urlObj.origin + '/' + result.imageUrl;
        }
      } catch (e) {
        console.log('Error convirtiendo URL relativa a absoluta:', e);
      }
    }
    
    // Si no tenemos un título, intentar extraerlo de la URL
    if (!result.title) {
      const urlMetadata = getMetadataFromUrl(url);
      result.title = urlMetadata.title;
      console.log('✓ Título extraído de la URL');
      
      // Si tampoco tenemos descripción, usar la de la URL
      if (!result.description) {
        result.description = urlMetadata.description;
      }
    }
    
    // Ya no buscamos precio - el usuario lo introducirá manualmente
    // El precio siempre queda vacío
    result.price = '';
    
    // Limpiar el título de entidades HTML y caracteres no deseados
    if (result.title) {
      result.title = result.title
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z0-9]+;/g, ' ')
        .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
        .trim();
    }
    
    // Limpiar la descripción
    if (result.description) {
      result.description = result.description
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z0-9]+;/g, ' ')
        .replace(/[\r\n\t]+/g, ' ')
        .trim();
    }
    
    console.log('✅ Metadatos extraídos correctamente:', {
      title: result.title,
      description: result.description ? result.description.substring(0, 30) + '...' : '',
      imageUrl: result.imageUrl ? '(Imagen encontrada)' : '(Sin imagen)',
      price: '(Entrada manual por el usuario)'
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error al extraer metadatos:', error);
    // Intentar extraer información de la URL como último recurso
    return getMetadataFromUrl(url);
  }
}

/**
 * Extrae metadatos básicos a partir de la URL
 * Usado como fallback cuando no se puede obtener información de la página
 */
function getMetadataFromUrl(url: string): MetadataResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./i, '');
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    
    let title = hostname;
    let description = `Enlace de ${hostname}`;
    
    // Si hay partes en la ruta, intentar extraer un título significativo
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      
      // Eliminar extensiones de archivo y convertir guiones en espacios
      let extractedTitle = lastPart
        .replace(/\.\w+$/, '') // Eliminar extensión (.html, .php, etc)
        .replace(/-|_/g, ' '); // Convertir guiones y guiones bajos en espacios
        
      // Buscar patrones de IDs y códigos al final para eliminarlos
      extractedTitle = extractedTitle.replace(/\b[a-z0-9]{5,}\b$/i, '');
      
      // Convertir a formato de título (primera letra de cada palabra en mayúscula)
      if (extractedTitle.length > 0) {
        title = extractedTitle
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();
      }
    }
    
    return {
      title,
      description,
      imageUrl: '',
      price: ''
    };
  } catch (e) {
    console.log('Error extrayendo metadatos de URL:', e);
    return {
      title: '',
      description: '',
      imageUrl: '',
      price: ''
    };
  }
}

/**
 * Extrae imagen de Amazon
 */
async function extractAmazonImage(url: string, html: string): Promise<string | null> {
  try {
    // Patrones para extraer ASIN
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/(B[0-9A-Z]{9})(?:\/|\?|$)/i
    ];
    
    let asin = null;
    
    // Buscar ASIN en la URL
    for (const pattern of asinPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        asin = match[1].toUpperCase();
        console.log(`ASIN extraído de URL: ${asin}`);
        break;
      }
    }
    
    // Si no encontramos ASIN en la URL, buscarlo en el HTML
    if (!asin) {
      const asinMatch = html.match(/["']ASIN["']\s*[:=]\s*["']([A-Z0-9]{10})["']/i);
      if (asinMatch && asinMatch[1]) {
        asin = asinMatch[1].toUpperCase();
        console.log(`ASIN encontrado en HTML: ${asin}`);
      }
    }
    
    if (!asin) {
      return null;
    }
    
    // Buscar la imagen en el HTML primero
    const imgPatterns = [
      /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+?\.jpg)"/i,
      /https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+?\.jpg/i,
      /"hiRes":"(https:\/\/[^"]+?)"/i,
    ];
    
    for (const pattern of imgPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    // Si no encontramos la imagen en el HTML, generarla a partir del ASIN
    return `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`;
  } catch (e) {
    console.log('Error extrayendo imagen de Amazon:', e);
    return null;
  }
}

/**
 * Extrae imagen de Zara
 */
async function extractZaraImage(url: string, html: string): Promise<string | null> {
  try {
    // Buscar en el HTML primero
    const imgMatch = html.match(/"image":\s*\[\s*"([^"]+?)"/i);
    if (imgMatch && imgMatch[1]) {
      return imgMatch[1];
    }
    
    // Buscar el código de producto
    const productCodeMatch = url.match(/[p]([0-9]+)\.html/i);
    if (!productCodeMatch || !productCodeMatch[1]) {
      return null;
    }
    
    const productId = productCodeMatch[1];
    
    if (productId.length >= 7) {
      const productCategory = productId.substring(0, 2);
      const productSubcategory = productId.substring(2, 4);
      const specificCode = productId.substring(4);
      
      // Patrón para productos actuales
      return `https://static.zara.net/photos//2024/V/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productId}_1_1_1.jpg`;
    }
    
    return null;
  } catch (e) {
    console.log('Error extrayendo imagen de Zara:', e);
    return null;
  }
}

/**
 * Busca imágenes grandes en el HTML
 * Útil para sitios que no especifican metadatos
 */
async function extractGenericLargeImage(html: string): Promise<string | null> {
  try {
    // Buscar imágenes con atributos que sugieren que son las principales
    const imgPatterns = [
      /<img[^>]*?class="[^"]*?(main|primary|product)[^"]*?"[^>]*?src="([^"]+)"/i,
      /<img[^>]*?id="[^"]*?(main|primary|product)[^"]*?"[^>]*?src="([^"]+)"/i,
      /<img[^>]*?(main|primary|product|gallery)[^>]*?src="([^"]+)"/i,
      /<img[^>]*?src="([^"]+)"[^>]*?(main|primary|product|gallery)/i,
      /<img[^>]*?data-src="([^"]+)"[^>]*?(main|primary|product|gallery)/i,
      /<img[^>]*?data-lazy-src="([^"]+)"[^>]*?(main|primary|product|gallery)/i
    ];
    
    for (const pattern of imgPatterns) {
      const match = html.match(pattern);
      if (match) {
        // El grupo de captura para la URL puede ser diferente según el patrón
        const imgSrc = match[2] || match[1];
        if (imgSrc && !imgSrc.includes('blank.') && !imgSrc.includes('placeholder') && !imgSrc.includes('loading')) {
          return imgSrc;
        }
      }
    }
    
    // Buscar cualquier imagen que parezca grande basada en dimensiones en atributos
    const dimensionPattern = /<img[^>]*?(width|height|w|h)=["']?(\d+)["']?[^>]*?src=["']([^"']+)["']/gi;
    let match;
    let bestImage = null;
    let largestDimension = 0;
    
    while ((match = dimensionPattern.exec(html)) !== null) {
      const dimension = parseInt(match[2], 10);
      const src = match[3];
      
      if (dimension > largestDimension && dimension > 200 && 
          !src.includes('blank.') && !src.includes('placeholder') && !src.includes('loading')) {
        largestDimension = dimension;
        bestImage = src;
      }
    }
    
    if (bestImage) {
      return bestImage;
    }
    
    // Como último recurso, extraer todas las imágenes y elegir la primera "grande" que encontremos
    const allImagesPattern = /<img[^>]*?src=["']([^"']+)["'][^>]*?>/gi;
    const images = [];
    
    while ((match = allImagesPattern.exec(html)) !== null) {
      const src = match[1];
      // Filtrar imágenes claramente pequeñas (iconos, etc) y placeholders
      if (!src.includes('blank.') && !src.includes('placeholder') && !src.includes('loading') &&
          !src.includes('icon') && !src.includes('logo') && src.match(/\.(jpg|jpeg|png)(\?|$)/i)) {
        images.push(src);
      }
    }
    
    // Devolver la primera imagen razonable de la página
    if (images.length > 0) {
      return images[0];
    }
    
    return null;
  } catch (e) {
    console.log('Error extrayendo imagen genérica:', e);
    return null;
  }
}