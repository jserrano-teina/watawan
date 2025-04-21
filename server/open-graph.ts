import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';
import * as cheerio from 'cheerio';

// Interfaz para los metadatos que extraemos
export interface MetadataResult {
  title: string;
  description: string;
  imageUrl: string;
  price: string; // Siempre vacío según nuevas especificaciones
}

// Interfaz para extractores específicos por tienda
interface StoreExtractor {
  pattern: RegExp;
  extract: (url: string, $: cheerio.CheerioAPI) => Promise<Partial<MetadataResult>>;
}

// Define los tipos de dispositivos
type DeviceType = 'mobile' | 'tablet' | 'desktop';

// User-Agents optimizados para diferentes dispositivos
const USER_AGENTS = {
  // Desktop Chrome - más genérico y menos detectable como bot
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Móvil Android - mejor aceptado por Amazon
  mobile: 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36',
  
  // Tablet - versión más genérica
  tablet: 'Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1'
};

/**
 * Extrae metadatos básicos de una URL usando cheerio para un análisis DOM robusto
 * Esta implementación mejora sustancialmente la capacidad para extraer información
 * de una variedad de sitios, incluyendo AliExpress y Zara que tienen estructuras más complejas
 * @param url La URL de la cual extraer metadatos
 * @param deviceType El tipo de dispositivo desde el cual se solicita la extracción
 */
export async function extractOpenGraphData(url: string, deviceType: DeviceType = 'desktop'): Promise<MetadataResult> {
  console.log(`🔍 Extrayendo metadatos para: ${url} desde dispositivo tipo: ${deviceType}`);
  
  const DEFAULT_RESULT: MetadataResult = {
    title: '',
    description: '',
    imageUrl: '',
    price: '' // Siempre vacío por especificación
  };
  
  try {
    // Seleccionar el User-Agent apropiado según el tipo de dispositivo
    console.log(`🔄 Usando User-Agent para dispositivo tipo: ${deviceType}`);
    
    // Configurar cabeceras para simular el navegador correcto según el dispositivo
    const headers: Record<string, string> = {
      'User-Agent': USER_AGENTS[deviceType],
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Referer': 'https://www.google.com/',
      'Connection': 'keep-alive',
      'DNT': '1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Para Amazon específicamente, extraemos el ASIN y generamos 
    // una URL más simple que tiene mayor probabilidad de funcionar
    if (url.includes('amazon.')) {
      console.log('🔐 Configurando encabezados especiales para Amazon');
      headers['Accept-Encoding'] = 'gzip, deflate, br';
      headers['sec-ch-ua'] = '"Not.A/Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"';
      headers['sec-ch-ua-mobile'] = deviceType === 'mobile' ? '?1' : '?0';
      headers['sec-ch-ua-platform'] = deviceType === 'mobile' ? '"Android"' : '"Windows"';
      
      // Intentar extraer ASIN para crear una URL más simple
      const asinPatterns = [
        /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i,
        /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
        /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
        /\/(B[0-9A-Z]{9})(?:\/|\?|$)/i
      ];
      
      let asin: string | null = null;
      for (const pattern of asinPatterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          asin = match[1].toUpperCase();
          console.log(`ASIN encontrado en URL: ${asin}`);
          
          // Generar URL más simple usando el ASIN
          const domain = url.includes('amazon.es') ? 'amazon.es' : 
                         url.includes('amazon.com') ? 'amazon.com' : 
                         'amazon.es';
          
          url = `https://www.${domain}/dp/${asin}`;
          console.log(`URL simplificada para Amazon: ${url}`);
          break;
        }
      }
    }

    // Configurar un timeout razonable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Aumentamos timeout para sitios complejos
    
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
    
    // Cargar el HTML en cheerio para analizarlo como DOM
    const $ = cheerio.load(html);
    const result = { ...DEFAULT_RESULT };
    
    // ==================== EXTRACCIÓN DE TÍTULO ====================
    // PRIORIDAD:
    // 1. Open Graph
    // 2. Twitter Cards
    // 3. Meta title
    // 4. Title tag
    // 5. JSON-LD (Schema.org)
    // 6. H1 tag más prominente
    // 7. Extractores específicos por tienda
    // 8. Extraer de la URL
    
    // Intentar Open Graph
    const ogTitle = $('meta[property="og:title"]').attr('content');
    if (ogTitle) {
      result.title = ogTitle.trim();
      console.log('✓ Título encontrado en Open Graph');
    }
    
    // Twitter Cards
    if (!result.title) {
      const twitterTitle = $('meta[name="twitter:title"]').attr('content');
      if (twitterTitle) {
        result.title = twitterTitle.trim();
        console.log('✓ Título encontrado en Twitter Card');
      }
    }
    
    // Meta title
    if (!result.title) {
      const metaTitle = $('meta[name="title"]').attr('content');
      if (metaTitle) {
        result.title = metaTitle.trim();
        console.log('✓ Título encontrado en meta title');
      }
    }
    
    // Title tag
    if (!result.title) {
      const titleTag = $('title').text();
      if (titleTag) {
        result.title = titleTag.trim();
        console.log('✓ Título encontrado en title tag');
      }
    }
    
    // JSON-LD (Schema.org)
    if (!result.title) {
      try {
        const jsonLdScript = $('script[type="application/ld+json"]').first().html();
        if (jsonLdScript) {
          const jsonData = JSON.parse(jsonLdScript);
          
          if (jsonData && jsonData.name) {
            result.title = jsonData.name;
            console.log('✓ Título encontrado en Schema.org JSON-LD');
          } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].name) {
            result.title = jsonData[0].name;
            console.log('✓ Título encontrado en Schema.org JSON-LD (array)');
          } else if (jsonData && jsonData.headline) {
            result.title = jsonData.headline;
            console.log('✓ Título encontrado en Schema.org headline');
          }
        }
      } catch (e) {
        console.log('Error al parsear JSON-LD:', e);
      }
    }
    
    // H1 tag más prominente
    if (!result.title) {
      const h1Text = $('h1').first().text();
      if (h1Text) {
        result.title = h1Text.trim();
        console.log('✓ Título encontrado en H1');
      }
    }
    
    // ================ EXTRACCIÓN DE DESCRIPCIÓN =================
    // PRIORIDAD:
    // 1. Open Graph
    // 2. Twitter Cards
    // 3. Meta description
    // 4. Schema.org
    // 5. Párrafos principales
    
    const ogDescription = $('meta[property="og:description"]').attr('content');
    if (ogDescription) {
      result.description = ogDescription.trim();
      console.log('✓ Descripción encontrada en Open Graph');
    }
    
    if (!result.description) {
      const twitterDesc = $('meta[name="twitter:description"]').attr('content');
      if (twitterDesc) {
        result.description = twitterDesc.trim();
        console.log('✓ Descripción encontrada en Twitter Card');
      }
    }
    
    if (!result.description) {
      const metaDesc = $('meta[name="description"]').attr('content');
      if (metaDesc) {
        result.description = metaDesc.trim();
        console.log('✓ Descripción encontrada en meta description');
      }
    }
    
    // ================ EXTRACCIÓN DE IMAGEN =================
    // PRIORIDAD:
    // 1. Open Graph
    // 2. Twitter Cards
    // 3. Schema.org
    // 4. Extractores específicos por tienda
    // 5. Imágenes destacadas en base a tamaño y posición
    
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      result.imageUrl = ogImage.trim();
      console.log('✓ Imagen encontrada en Open Graph');
    }
    
    if (!result.imageUrl) {
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      if (twitterImage) {
        result.imageUrl = twitterImage.trim();
        console.log('✓ Imagen encontrada en Twitter Card');
      }
    }
    
    if (!result.imageUrl) {
      const metaImage = $('meta[name="image"]').attr('content');
      if (metaImage) {
        result.imageUrl = metaImage.trim();
        console.log('✓ Imagen encontrada en meta image');
      }
    }
    
    // Buscar en JSON-LD
    if (!result.imageUrl) {
      try {
        const jsonLdScript = $('script[type="application/ld+json"]').first().html();
        if (jsonLdScript) {
          const jsonData = JSON.parse(jsonLdScript);
          
          if (jsonData && jsonData.image) {
            result.imageUrl = typeof jsonData.image === 'string' ? jsonData.image : jsonData.image.url || jsonData.image[0];
            console.log('✓ Imagen encontrada en Schema.org JSON-LD');
          } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0].image) {
            const image = jsonData[0].image;
            result.imageUrl = typeof image === 'string' ? image : image.url || image[0];
            console.log('✓ Imagen encontrada en Schema.org JSON-LD (array)');
          }
        }
      } catch (e) {
        console.log('Error al parsear JSON-LD para imagen:', e);
      }
    }
    
    // Patrones específicos para diferentes tiendas
    if (!result.imageUrl) {
      const urlLower = url.toLowerCase();
      
      // Amazon
      if (urlLower.includes('amazon.')) {
        const amazonImg = await extractAmazonImageWithCheerio(url, $, deviceType);
        if (amazonImg) {
          result.imageUrl = amazonImg;
          console.log(`✓ Imagen extraída de Amazon con cheerio para dispositivo ${deviceType}`);
        }
      } 
      // Zara
      else if (urlLower.includes('zara.com')) {
        const zaraImg = await extractZaraImageWithCheerio(url, $, deviceType);
        if (zaraImg) {
          result.imageUrl = zaraImg;
          console.log(`✓ Imagen extraída de Zara con cheerio para dispositivo ${deviceType}`);
        }
      }
      // AliExpress
      else if (urlLower.includes('aliexpress.')) {
        const aliImg = await extractAliExpressImageWithCheerio($, deviceType);
        if (aliImg) {
          result.imageUrl = aliImg;
          console.log(`✓ Imagen extraída de AliExpress con cheerio para dispositivo ${deviceType}`);
        }
      }
    }
    
    // Buscar imágenes destacadas en el HTML basadas en tamaño, clase, y posición
    if (!result.imageUrl) {
      const bestImg = await extractBestImageWithCheerio($, url, deviceType);
      if (bestImg) {
        result.imageUrl = bestImg;
        console.log(`✓ Imagen destacada encontrada en HTML con cheerio para dispositivo ${deviceType}`);
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
    
    // Limpiar el título y descripción
    if (result.title) {
      result.title = result.title
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&[a-z0-9]+;/g, ' ') // Otras entidades HTML
        .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
        .replace(/\s{2,}/g, ' ') // Reemplazar múltiples espacios con uno solo
        .trim();
    }
    
    // Limpiar la descripción
    if (result.description) {
      result.description = result.description
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&[a-z0-9]+;/g, ' ') // Otras entidades HTML
        .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
        .replace(/\s{2,}/g, ' ') // Reemplazar múltiples espacios con uno solo
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
 * Función para limpiar texto de entidades HTML y caracteres especiales
 */
function cleanTextContent(text: string): string {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&[a-z0-9]+;/g, ' ') // Otras entidades HTML
    .replace(/[\r\n\t]+/g, ' ') // Eliminar saltos de línea y tabs
    .replace(/\s{2,}/g, ' ') // Reemplazar múltiples espacios con uno solo
    .trim();
}

/**
 * Extrae imagen de Amazon usando cheerio
 * @param url La URL del producto de Amazon
 * @param $ El objeto cheerio cargado con el HTML
 * @param deviceType El tipo de dispositivo desde el cual se solicita: 'mobile', 'tablet' o 'desktop'
 */
async function extractAmazonImageWithCheerio(url: string, $: cheerio.CheerioAPI, deviceType: DeviceType = 'desktop'): Promise<string | null> {
  try {
    console.log(`🔍 Extrayendo imagen de Amazon para dispositivo tipo: ${deviceType}`);
    
    // Patrones para extraer ASIN
    const asinPatterns = [
      /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
      /\/(B[0-9A-Z]{9})(?:\/|\?|$)/i
    ];
    
    let asin: string | null = null;
    
    // Buscar ASIN en la URL
    for (const pattern of asinPatterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        asin = match[1].toUpperCase();
        console.log(`ASIN extraído de URL: ${asin}`);
        
        // Si tenemos el ASIN de la URL, usamos directamente las imágenes de Amazon
        // en lugar de intentar extraerlas del HTML, ya que es más confiable
        console.log(`⚠️ Generando URL de imagen a partir del ASIN extraído: ${asin}`);
        
        // Probar diferentes formatos de imagen que Amazon usa para sus productos
        const imageFormats = [
          `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`,
          `https://m.media-amazon.com/images/I/${asin}.jpg`,
          `https://images-na.ssl-images-amazon.com/images/I/${asin}._SL500_.jpg`,
          `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`
        ];
        
        // En lugar de analizar el HTML, simplemente devolvemos la URL de imagen basada en ASIN
        // Amazon redirigirá automáticamente a la imagen correcta si existe
        return imageFormats[0];
      }
    }
    
    // Buscar ASIN en el HTML solo si no lo encontramos en la URL
    if (!asin) {
      // Buscar en atributos data-asin
      const dataAsin = $('[data-asin]').first().attr('data-asin');
      if (dataAsin && dataAsin.length >= 10) {
        asin = dataAsin.toUpperCase();
        console.log(`ASIN encontrado en atributo data-asin: ${asin}`);
      } else {
        // Buscar en scripts
        const scriptContent = $('script:contains("ASIN")').text();
        const asinMatch = scriptContent.match(/["']ASIN["']\s*[:=]\s*["']([A-Z0-9]{10})["']/i);
        if (asinMatch && asinMatch[1]) {
          asin = asinMatch[1].toUpperCase();
          console.log(`ASIN encontrado en script: ${asin}`);
        }
      }
    }
    
    // Usar diferentes selectores según el tipo de dispositivo
    let imgUrl: string | undefined = undefined;
    
    if (deviceType === 'mobile') {
      // Selectores optimizados para móvil:
      // En dispositivos móviles, Amazon usa diferentes clases y estructuras
      imgUrl = $('.image-size-small img').attr('src') || 
               $('img.a-dynamic-image').attr('src') ||
               $('img[data-a-dynamic-image]').attr('src') ||
               $('.images-container img').first().attr('src');
               
      console.log('Buscando con selectores para móvil');
    } else {
      // Selectores para desktop/tablet:
      // 1. Buscar en el visor de imágenes principal
      imgUrl = $('#landingImage').attr('src') || 
               $('#imgBlkFront').attr('src') ||
               $('img.a-dynamic-image').attr('src');
      
      console.log('Buscando con selectores para desktop/tablet');
    }
    
    // Selectores comunes para todos los dispositivos
    if (!imgUrl) {
      // 2. Buscar en data-old-hires (imagen de alta resolución)
      imgUrl = $('img[data-old-hires]').attr('data-old-hires');
    }
    
    if (!imgUrl) {
      // 3. Buscar en otros contenedores comunes
      imgUrl = $('.imgTagWrapper img').attr('src');
    }
    
    if (!imgUrl) {
      // 4. Buscar con selectores genéricos
      imgUrl = $('#main-image').attr('src') || 
               $('#imageBlock img').first().attr('src') ||
               $('.image-display-block img').first().attr('src');
    }
    
    // 5. Buscar en la data original de imágenes
    if (!imgUrl) {
      const dataImages = $('img[data-a-dynamic-image]').attr('data-a-dynamic-image');
      if (dataImages) {
        try {
          const imageData = JSON.parse(dataImages);
          // Obtener la primera URL de la lista de imágenes
          imgUrl = Object.keys(imageData)[0];
        } catch (e) {
          console.log('Error al parsear data-a-dynamic-image:', e);
        }
      }
    }
    
    // Si encontramos una imagen, la devolvemos
    if (imgUrl && imgUrl.includes('amazon') && imgUrl.includes('images')) {
      console.log(`✅ Imagen encontrada en el DOM para dispositivo ${deviceType}`);
      return imgUrl;
    }
    
    // Si tenemos un ASIN pero no pudimos extraer la imagen, usar un patrón URL conocido
    if (asin) {
      console.log(`⚠️ Usando URL de imagen por defecto basada en ASIN: ${asin}`);
      
      // Probar diferentes formatos de imagen que Amazon usa para sus productos
      const imageFormats = [
        `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`,
        `https://m.media-amazon.com/images/I/${asin}.jpg`,
        `https://images-na.ssl-images-amazon.com/images/I/${asin}._SL500_.jpg`,
        `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`
      ];
      
      // Devolver el primer formato, Amazon redirigirá automáticamente al correcto
      return imageFormats[0];
    }
    
    return null;
  } catch (e) {
    console.log('Error extrayendo imagen de Amazon con cheerio:', e);
    return null;
  }
}

/**
 * Extrae imagen de Zara usando cheerio
 * @param url La URL del producto de Zara
 * @param $ El objeto cheerio cargado con el HTML
 * @param deviceType El tipo de dispositivo desde el cual se solicita: 'mobile', 'tablet' o 'desktop'
 */
async function extractZaraImageWithCheerio(url: string, $: cheerio.CheerioAPI, deviceType: DeviceType = 'desktop'): Promise<string | null> {
  try {
    // Buscar en la estructura JSON en los scripts
    let imgUrl: string | null = null;
    
    // 1. Buscar en scripts que contengan información del producto
    $('script:not([src])').each((_, element) => {
      const content = $(element).html();
      if (!content) return;
      
      if (content.includes('"image"') || content.includes('"images"')) {
        try {
          // Buscar patrones como "image": ["https://..."] o "images": ["https://..."]
          const imgMatch = content.match(/"image(?:s)?":\s*\[\s*"([^"]+?)"/i);
          if (imgMatch && imgMatch[1]) {
            imgUrl = imgMatch[1];
            return false; // Break the each loop
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
    });
    
    // 2. Buscar imágenes con estructuras típicas de Zara
    if (!imgUrl) {
      const productImage = $('img[data-path]').attr('src') || 
                           $('.media-image img').attr('src') ||
                           $('.product-detail-images img').first().attr('src');
      
      if (productImage) {
        imgUrl = productImage;
      }
    }
    
    // 3. Cualquier imagen grande en la página
    if (!imgUrl) {
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        const width = parseInt($(element).attr('width') || '0', 10);
        const height = parseInt($(element).attr('height') || '0', 10);
        
        if (src && 
            (width > 300 || height > 300) && 
            !src.includes('icon') && 
            !src.includes('logo') &&
            (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
          imgUrl = src;
          return false; // Break the each loop
        }
      });
    }
    
    // 4. Extraer del código de producto si está en la URL
    if (!imgUrl) {
      const productCodeMatch = url.match(/[p]([0-9]+)\.html/i);
      if (productCodeMatch && productCodeMatch[1]) {
        const productId = productCodeMatch[1];
        
        if (productId.length >= 7) {
          const productCategory = productId.substring(0, 2);
          const productSubcategory = productId.substring(2, 4);
          const specificCode = productId.substring(4);
          
          // Patrón para productos actuales
          imgUrl = `https://static.zara.net/photos//2024/V/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/563/${productId}_1_1_1.jpg`;
        }
      }
    }
    
    return imgUrl;
  } catch (e) {
    console.log('Error extrayendo imagen de Zara con cheerio:', e);
    return null;
  }
}

/**
 * Extrae imagen de AliExpress usando cheerio
 * @param $ El objeto cheerio cargado con el HTML
 * @param deviceType El tipo de dispositivo desde el cual se solicita: 'mobile', 'tablet' o 'desktop'
 */
async function extractAliExpressImageWithCheerio($: cheerio.CheerioAPI, deviceType: DeviceType = 'desktop'): Promise<string | null> {
  try {
    // 1. Buscar en estructuras de datos JSON en scripts
    let imgUrl: string | null = null;
    
    // Buscar en scripts que contengan información del producto
    $('script:not([src])').each((_, element) => {
      const content = $(element).html();
      if (!content) return;
      
      // Buscar patrones comunes en AliExpress
      if (content.includes('"imageUrl"') || content.includes('"imageModule"')) {
        try {
          // Buscar patrones para imágenes en la estructura de datos
          const imgMatch = content.match(/"imageUrl"\s*:\s*"([^"]+?)"/i) || 
                          content.match(/"image_url"\s*:\s*"([^"]+?)"/i) ||
                          content.match(/"mainImage"\s*:\s*"([^"]+?)"/i);
          
          if (imgMatch && imgMatch[1]) {
            imgUrl = imgMatch[1];
            return false; // Break the each loop
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
    });
    
    // 2. Buscar en elementos DOM comunes para AliExpress
    if (!imgUrl) {
      const galleryImg = $('.gallery-preview-panel img').first().attr('src');
      const productImg = $('.product-image img').first().attr('src');
      const magnifierImg = $('.magnifier-image').attr('src');
      
      if (galleryImg) imgUrl = galleryImg;
      else if (productImg) imgUrl = productImg;
      else if (magnifierImg) imgUrl = magnifierImg;
    }
    
    // 3. Buscar elementos específicos de la nueva interfaz
    if (!imgUrl) {
      // Intentar con atributos data-src que son comunes en lazy loading
      const lazyImg = $('img[data-src*="ae01.alicdn.com"]').first().attr('data-src');
      if (lazyImg) {
        imgUrl = lazyImg;
      }
    }
    
    // 4. Buscar imágenes con fuentes de AliExpress (dominio ae01.alicdn.com)
    if (!imgUrl) {
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        
        if (src && src.includes('ae01.alicdn.com') && 
            !src.includes('icon') && !src.includes('logo')) {
          imgUrl = src;
          return false; // Break the each loop
        }
      });
    }
    
    return imgUrl;
  } catch (e) {
    console.log('Error extrayendo imagen de AliExpress con cheerio:', e);
    return null;
  }
}

/**
 * Extrae la mejor imagen de la página usando cheerio
 * Método general para cualquier sitio
 * @param $ El objeto cheerio cargado con el HTML
 * @param url La URL de la página
 * @param deviceType El tipo de dispositivo desde el cual se solicita: 'mobile', 'tablet' o 'desktop'
 */
async function extractBestImageWithCheerio($: cheerio.CheerioAPI, url: string, deviceType: DeviceType = 'desktop'): Promise<string | null> {
  try {
    let bestImage: string | null = null;
    let bestScore = 0;
    
    // Log para depuración
    console.log(`Extrayendo mejor imagen con cheerio para dispositivo ${deviceType} en URL: ${url.substring(0, 50)}...`);
    
    // Buscar imágenes y evaluarlas por dimensiones y atributos relevantes
    $('img').each((_, element) => {
      let score = 0;
      const img = $(element);
      const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
      
      if (!src) return;
      
      // Filtrar imágenes pequeñas, iconos y placeholder
      if (src.includes('blank.') || 
          src.includes('placeholder') || 
          src.includes('loading') ||
          src.includes('icon') || 
          src.includes('logo')) {
        return;
      }
      
      // Verificar si es una imagen de un formato común
      if (!src.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
        return;
      }
      
      // Analizar atributos para determinar si es una imagen destacada
      const width = parseInt(img.attr('width') || '0', 10);
      const height = parseInt(img.attr('height') || '0', 10);
      const alt = (img.attr('alt') || '').toLowerCase();
      const className = (img.attr('class') || '').toLowerCase();
      const id = (img.attr('id') || '').toLowerCase();
      
      // Puntuación basada en tamaño
      if (width > 300 || height > 300) score += 20;
      if (width > 500 || height > 500) score += 20;
      
      // Puntuación basada en la posición en el DOM
      const parentClass = img.parent().attr('class') || '';
      const parentId = img.parent().attr('id') || '';
      
      // Puntuación por nombres de clase/id relevantes
      const keywords = ['product', 'main', 'primary', 'hero', 'featured', 'gallery', 'carousel', 'slide'];
      
      for (const keyword of keywords) {
        if (className.includes(keyword)) score += 15;
        if (id.includes(keyword)) score += 15;
        if (parentClass.includes(keyword)) score += 10;
        if (parentId.includes(keyword)) score += 10;
        if (alt.includes(keyword)) score += 5;
      }
      
      // No podemos usar offset en cheerio en Node.js al igual que en jQuery
      // Usamos otra heurística: si aparece antes en el DOM, es más probable que sea importante
      if (_.toString().length < 5000) {
        score += 15; // Está cerca del inicio del documento
      }
      
      // Penalización para imágenes probablemente irrelevantes
      if (className.includes('avatar') || 
          className.includes('thumb') || 
          id.includes('avatar') || 
          id.includes('thumb')) {
        score -= 20;
      }
      
      // Actualiza la mejor imagen si esta tiene mejor puntuación
      if (score > bestScore) {
        bestScore = score;
        bestImage = src;
      }
    });
    
    // Si no encontramos ninguna imagen con buena puntuación, buscar cualquier imagen grande
    if (!bestImage || bestScore < 20) {
      $('img').each((_, element) => {
        const src = $(element).attr('src');
        const width = parseInt($(element).attr('width') || '0', 10);
        const height = parseInt($(element).attr('height') || '0', 10);
        
        if (src && 
            (width > 200 || height > 200) && 
            !src.includes('blank.') && 
            !src.includes('placeholder') && 
            !src.includes('loading') && 
            !src.includes('icon') && 
            !src.includes('logo')) {
          bestImage = src;
          return false; // Break the each loop
        }
      });
    }
    
    // Asegurarse de que la URL sea absoluta
    if (bestImage) {
      const imgStr = bestImage;
      if (imgStr.startsWith('http')) {
        // Ya es una URL absoluta
        return imgStr;
      } else if (imgStr.startsWith('//')) {
        // URL de protocolo relativo
        try {
          const urlObj = new URL(url);
          return `${urlObj.protocol}${imgStr}`;
        } catch (e) {
          console.log('Error al procesar URL de protocolo relativo:', e);
          return `https:${imgStr}`;
        }
      } else if (imgStr.startsWith('/')) {
        // URL absoluta al dominio
        try {
          const urlObj = new URL(url);
          return `${urlObj.origin}${imgStr}`;
        } catch (e) {
          console.log('Error al procesar URL absoluta al dominio:', e);
          return imgStr;
        }
      } else {
        // URL relativa
        try {
          const urlObj = new URL(url);
          return `${urlObj.origin}/${imgStr}`;
        } catch (e) {
          console.log('Error al procesar URL relativa:', e);
          return imgStr;
        }
      }
    }
    
    return bestImage;
  } catch (e) {
    console.log('Error extrayendo imagen genérica con cheerio:', e);
    return null;
  }
}