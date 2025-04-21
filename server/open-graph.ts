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

/**
 * Extrae metadatos básicos de una URL usando cheerio para un análisis DOM robusto
 * Esta implementación mejora sustancialmente la capacidad para extraer información
 * de una variedad de sitios, incluyendo AliExpress y Zara que tienen estructuras más complejas
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
    // Configurar cabeceras para simular un navegador real
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1'
    };

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
        const amazonImg = await extractAmazonImageWithCheerio(url, $);
        if (amazonImg) {
          result.imageUrl = amazonImg;
          console.log('✓ Imagen extraída de Amazon con cheerio');
        }
      } 
      // Zara
      else if (urlLower.includes('zara.com')) {
        const zaraData = await extractZaraImageWithCheerio(url, $);
        if (zaraData.image) {
          result.imageUrl = zaraData.image;
          console.log('✓ Imagen extraída de Zara con cheerio');
        }
        if (zaraData.title && !result.title) {
          result.title = zaraData.title;
          console.log('✓ Título extraído de Zara con cheerio');
        }
      }
      // AliExpress
      else if (urlLower.includes('aliexpress.')) {
        const aliImg = await extractAliExpressImageWithCheerio($);
        if (aliImg) {
          result.imageUrl = aliImg;
          console.log('✓ Imagen extraída de AliExpress con cheerio');
        }
      }
    }
    
    // Buscar imágenes destacadas en el HTML basadas en tamaño, clase, y posición
    if (!result.imageUrl) {
      const bestImg = await extractBestImageWithCheerio($, url);
      if (bestImg) {
        result.imageUrl = bestImg;
        console.log('✓ Imagen destacada encontrada en HTML con cheerio');
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
 */
async function extractAmazonImageWithCheerio(url: string, $: cheerio.CheerioAPI): Promise<string | null> {
  try {
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
        break;
      }
    }
    
    // Buscar ASIN en el HTML
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
    
    // Buscar la imagen directamente en el DOM
    // 1. Buscar en el visor de imágenes principal
    let imgUrl = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src');
    
    // 2. Buscar en data-old-hires (imagen de alta resolución)
    if (!imgUrl) {
      imgUrl = $('img[data-old-hires]').attr('data-old-hires');
    }
    
    // 3. Buscar en otros contenedores comunes
    if (!imgUrl) {
      imgUrl = $('.imgTagWrapper img').attr('src');
    }
    
    // 4. Buscar con selectores específicos de Amazon
    if (!imgUrl) {
      imgUrl = $('#main-image').attr('src') || 
               $('#imageBlock img').first().attr('src') ||
               $('.image-display-block img').first().attr('src');
    }
    
    // Si encontramos una imagen, la devolvemos
    if (imgUrl && imgUrl.includes('amazon') && imgUrl.includes('images')) {
      return imgUrl;
    }
    
    // Si tenemos un ASIN pero no pudimos extraer la imagen, usar un patrón URL conocido
    if (asin) {
      return `https://m.media-amazon.com/images/I/${asin}._SL500_.jpg`;
    }
    
    return null;
  } catch (e) {
    console.log('Error extrayendo imagen de Amazon con cheerio:', e);
    return null;
  }
}

/**
 * Extrae información de Zara usando cheerio
 * Zara utiliza diferentes estructuras dependiendo de la región y el tipo de producto
 */
async function extractZaraImageWithCheerio(url: string, $: cheerio.CheerioAPI): Promise<{image: string | null, title: string | null}> {
  try {
    // Resultados
    let imgUrl: string | null = null;
    let productTitle: string | null = null;
    
    console.log('🔍 Analizando página de Zara...');
    
    // ESTRATEGIA 1: Extraer el título del producto
    // Buscar título del producto en la estructura HTML
    const h1Title = $('h1.product-detail-info__header-name').text().trim() || 
                    $('h1.product-name').text().trim() ||
                    $('span.product-name').text().trim() ||
                    $('h1').first().text().trim();
    
    if (h1Title) {
      // Limpiar el título (a veces Zara usa el carácter \u0020 entre letras)
      productTitle = h1Title.replace(/\s+/g, ' ').trim();
      console.log(`✓ Título extraído de HTML: ${productTitle}`);
    }
    
    // ESTRATEGIA 2: Extraer datos de la aplicación React de Zara
    // Zara suele almacenar sus datos en un objeto llamado __INITIAL_STATE__ o PRELOADED_STATE
    $('script:not([src])').each((_, element) => {
      const content = $(element).html() || '';
      
      // Buscar el estado inicial de la aplicación React
      if (content.indexOf('__INITIAL_STATE__') >= 0 || content.indexOf('PRELOADED_STATE') >= 0) {
        try {
          // Extraer el JSON del estado (usamos [\s\S] en lugar de /s para compatibilidad)
          const stateMatch = content.match(/(__INITIAL_STATE__|PRELOADED_STATE)\s*=\s*({[\s\S]+?});/);
          
          if (stateMatch && stateMatch[2]) {
            try {
              // Intentar parsear el JSON
              const state = JSON.parse(stateMatch[2]);
              
              // Extraer el título del producto si no lo tenemos ya
              if (!productTitle && state.product && state.product.detail && state.product.detail.name) {
                productTitle = state.product.detail.name;
                console.log(`✓ Título extraído del estado React: ${productTitle}`);
              }
              
              // Extraer el título del producto (estructura alternativa)
              if (!productTitle && state.productData && state.productData.name) {
                productTitle = state.productData.name;
                console.log(`✓ Título extraído del estado React (productData): ${productTitle}`);
              }
              
              // Extraer el título del producto (otra estructura)
              if (!productTitle && state.detail && state.detail.product && state.detail.product.name) {
                productTitle = state.detail.product.name;
                console.log(`✓ Título extraído del estado React (detail): ${productTitle}`);
              }
              
              // Buscar la información de la imagen en varias estructuras posibles
              if (state.product && state.product.detail && state.product.detail.colors) {
                const colors = state.product.detail.colors;
                // Buscar la primera imagen disponible
                for (const color of colors) {
                  if (color.xmedia && color.xmedia.length > 0) {
                    const xmedia = color.xmedia[0];
                    if (xmedia.path) {
                      // Construir la URL de la imagen
                      imgUrl = `https://static.zara.net/photos/${xmedia.path}/w/1920/${xmedia.name}.jpg`;
                      console.log('✓ Imagen extraída del estado React (xmedia)');
                      return false; // Break the each loop
                    }
                  }
                }
              }
              
              // Otra estructura común para imágenes
              if (!imgUrl && state.productData && state.productData.images) {
                const images = state.productData.images;
                if (images && images.length > 0) {
                  if (images[0].url) {
                    imgUrl = images[0].url;
                  } else if (images[0].path) {
                    imgUrl = `https://static.zara.net/photos/${images[0].path}/w/1920/${images[0].name}.jpg`;
                  }
                  console.log('✓ Imagen extraída del estado React (productData)');
                  return false; // Break the each loop
                }
              }
            } catch (e) {
              console.log('Error al parsear JSON del estado:', e);
            }
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
      
      // Buscar datos en formato JSON en otros scripts
      if (content.indexOf('"image"') >= 0 || content.indexOf('"images"') >= 0 || content.indexOf('"media"') >= 0) {
        try {
          // Intentar encontrar patrones de datos JSON dentro del script
          // Patrón para array de imágenes
          const imgMatch = content.match(/"image(?:s)?":\s*\[\s*"([^"]+?)"/i) || 
                           content.match(/"media":\s*\[\s*{[^}]*"url":\s*"([^"]+?)"/i);
                           
          if (imgMatch && imgMatch[1]) {
            imgUrl = imgMatch[1];
            console.log('✓ Imagen extraída de datos JSON en script');
            return false; // Break the each loop
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
      
      // Buscar el título en otros scripts con datos JSON
      if (!productTitle && content.indexOf('"name"') >= 0) {
        try {
          const nameMatch = content.match(/"name"\s*:\s*"([^"]+?)"/i);
          if (nameMatch && nameMatch[1]) {
            productTitle = nameMatch[1].replace(/\\u0020/g, ' ').replace(/\s+/g, ' ').trim();
            console.log(`✓ Título extraído de datos JSON: ${productTitle}`);
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
    });
    
    // Si no tenemos título aún, buscar en los metadatos
    if (!productTitle) {
      productTitle = $('meta[property="og:title"]').attr('content') || 
                     $('meta[name="twitter:title"]').attr('content') ||
                     $('meta[name="title"]').attr('content') ||
                     $('title').text().split('|')[0].trim();
      
      if (productTitle) {
        // Limpiar el título
        productTitle = productTitle.replace(/\s+/g, ' ').trim();
        console.log(`✓ Título extraído de metadatos: ${productTitle}`);
      }
    }
    
    // ESTRATEGIA 3: Buscar imágenes en nodos específicos comunes de Zara
    if (!imgUrl) {
      // Nodos de imágenes específicos de Zara
      const zaraSelectors = [
        '.product-detail-slide img',
        '.main-image img',
        'img.image-main',
        'img.main-product-image',
        'img[data-path]', 
        '.media-image img', 
        '.product-detail-images img',
        '.product-images img', 
        '.product-image-item img',
        '.product-image img',
        'picture source',
        '.product__image img',
        '.image-item img',
        '.product-media img'
      ];
      
      for (const selector of zaraSelectors) {
        const img = $(selector).first();
        const src = img.attr('src') || img.attr('srcset')?.split(' ')[0] || img.attr('data-src');
        
        if (src && src.indexOf('icon') === -1 && src.indexOf('logo') === -1) {
          imgUrl = src;
          console.log(`✓ Imagen extraída de selector CSS: ${selector}`);
          break;
        }
      }
    }
    
    // ESTRATEGIA 4: Reconstruir URLs a partir del ID del producto
    // Las URLs de Zara siguen ciertos patrones predecibles
    if (!imgUrl) {
      // Diferentes patrones de URL que podemos encontrar
      const patterns = [
        // Patrón moderno: /p12345678.html
        /[\/p]([0-9]{7,10})(?:\.html|\?v1=|$)/i,
        // Patrón alternativo: /-p123/
        /\/-p([0-9]{7,10})(?:\/|$)/i,
        // Patrón antiguo: /product/123/
        /\/product\/([0-9]{7,10})(?:\/|$)/i
      ];
      
      let productId = null;
      
      // Buscar el ID del producto en la URL
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          productId = match[1];
          console.log(`✓ ID de producto extraído de URL: ${productId}`);
          break;
        }
      }
      
      // Buscar el ID en el HTML si no está en la URL
      if (!productId) {
        const metaProductId = $('meta[property="product:id"]').attr('content') || 
                              $('meta[name="productId"]').attr('content');
        if (metaProductId) {
          productId = metaProductId;
          console.log(`✓ ID de producto extraído de meta tags: ${productId}`);
        }
      }
      
      // Buscar en atributos data-
      if (!productId) {
        const dataAttr = $('[data-productid]').attr('data-productid') || 
                         $('[data-item-id]').attr('data-item-id');
        if (dataAttr) {
          productId = dataAttr;
          console.log(`✓ ID de producto extraído de atributo data-: ${productId}`);
        }
      }
      
      // Reconstruir la URL de la imagen a partir del ID del producto
      if (productId && productId.length >= 7) {
        // Zara organiza sus imágenes según temporada, categoría y producto
        // Pueden tener diferentes formatos de ID de producto (numérico o alfanumérico)
        
        // Para IDs alfanuméricos, necesitamos otro enfoque
        // Patrón 2024, versión primavera/verano
        const currentYear = new Date().getFullYear();
        // Para mayor compatibilidad, probamos con diferentes temporadas
        const seasons = [
          `${currentYear}/V`, // Primavera/Verano actual
          `${currentYear}/I`, // Otoño/Invierno actual
          `${currentYear-1}/I`, // Otoño/Invierno anterior
          `${currentYear-1}/V`, // Primavera/Verano anterior
        ];
        
        // Extraer categorías del ID (los primeros dígitos indican categoría)
        const productCategory = productId.substring(0, 2);
        const productSubcategory = productId.substring(2, 4);
        const specificCode = productId.substring(4);
        
        // Construir posibles URLs para múltiples formatos y temporadas
        let possibleUrls: string[] = [];
        
        for (const season of seasons) {
          // Añadir diferentes formatos para cada temporada
          possibleUrls = [
            ...possibleUrls,
            // Formatos específicos por categoría (más probable)
            `https://static.zara.net/photos//${season}/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/1000/${productId}_1_1_1.jpg`,
            `https://static.zara.net/photos//${season}/0/1/p/${productCategory}${productSubcategory}/${specificCode}/2/w/750/${productId}_1_1_1.jpg`,
            // Formatos genéricos
            `https://static.zara.net/photos//${season}/0/1/p/${productId}/2/w/1000/${productId}_1_1_1.jpg`,
            `https://static.zara.net/photos//${season}/0/1/p/${productId}_1_1_1.jpg`,
          ];
        }
        
        // Retornar la primera URL posible (no podemos verificar cuál existe sin hacer múltiples peticiones)
        imgUrl = possibleUrls[0];
        console.log('✓ Imagen reconstruida a partir del ID de producto');
      }
    }
    
    // Verificar si la URL de la imagen necesita el esquema añadido
    if (imgUrl && imgUrl.indexOf('//') === 0) {
      imgUrl = 'https:' + imgUrl;
    }
    
    // Si no tenemos título, crear uno a partir de la URL
    if (!productTitle) {
      // Extraer el nombre del producto de la URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1].split('.')[0];
      
      // Convertir formato URL a título legible
      if (lastPart) {
        productTitle = lastPart
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase()) // Capitalizar primera letra de cada palabra
          .replace(/([a-z])([A-Z])/g, '$1 $2'); // Añadir espacio entre camelCase
        
        console.log(`✓ Título generado a partir de URL: ${productTitle}`);
      }
    }
    
    // Limpieza adicional del título para casos de ZARA
    if (productTitle) {
      // Corregir títulos con espaciado incorrecto (C A M I S A P O L O ... -> CAMISA POLO ...)
      if (/^([A-Z]\s)+[A-Z]$/.test(productTitle) || /^([A-Z]\s?){5,}$/.test(productTitle)) {
        productTitle = productTitle.replace(/\s+/g, '').replace(/([A-Z](?=[A-Z][a-z])|[A-Z](?=[A-Z]$))/g, '$1 ').trim();
      }
      
      // Remover códigos de producto o referencias
      productTitle = productTitle
        .replace(/REF\.\s*\d+\/\d+\/\d+/i, '')
        .replace(/\d{7,}/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
    }
    
    return { image: imgUrl, title: productTitle };
  } catch (e) {
    console.log('Error extrayendo información de Zara con cheerio:', e);
    return { image: null, title: null };
  }
}

/**
 * Extrae imagen de AliExpress usando cheerio
 * AliExpress utiliza diferentes estructuras según la región y versión del sitio
 */
async function extractAliExpressImageWithCheerio($: cheerio.CheerioAPI): Promise<string | null> {
  try {
    // Resultado
    let imgUrl: string | null = null;
    
    console.log('🔍 Analizando página de AliExpress...');
    
    // ESTRATEGIA 1: Buscar en variables globales y scripts de datos
    // AliExpress suele almacenar datos de productos en variables JS globales
    $('script:not([src])').each((_, element) => {
      const content = $(element).html() || '';
      
      // Buscar patrones específicos de la aplicación de AliExpress
      if (content.includes('window.runParams') || 
          content.includes('data:') || 
          content.includes('imageModule')) {
        try {
          // Patrones específicos de imágenes en AliExpress
          // 1. Patrón para el módulo de imágenes principal
          let imgMatch = content.match(/imageModule['"]\s*:.*?['"](https:\/\/.*?(?:\.jpg|\.png|\.jpeg))['"](?:[\s,}]|$)/i);
          if (imgMatch && imgMatch[1]) {
            imgUrl = imgMatch[1];
            console.log('✓ Imagen extraída del módulo de imágenes principal');
            return false; // Break the each loop
          }
          
          // 2. Patrón para la gallería de imágenes
          imgMatch = content.match(/imagePathList['"]?\s*:\s*\[\s*['"]([^'"]+?)['"](?:\s*,|\s*\])/i);
          if (imgMatch && imgMatch[1]) {
            // A menudo estas URLs son relativas o necesitan el dominio
            const extractedUrl = imgMatch[1];
            // Comprobar si es una URL de protocolo relativo
            if (extractedUrl.indexOf('//') === 0) {
              imgUrl = 'https:' + extractedUrl;
            } else {
              imgUrl = extractedUrl;
            }
            console.log('✓ Imagen extraída de la galería de imágenes');
            return false;
          }
          
          // 3. Patrón para datos estructurados en JSON
          // Buscar un bloque JSON y analizarlo
          const jsonBlocks = content.match(/({(?:(?:"(?:\\.|[^"\\])*"|[^{}])|({(?:(?:"(?:\\.|[^"\\])*"|[^{}])|({[^{}]*})|.)*}))*})/g);
          if (jsonBlocks) {
            for (const jsonBlock of jsonBlocks) {
              try {
                if (jsonBlock.includes('image') || jsonBlock.includes('url')) {
                  const jsonData = JSON.parse(jsonBlock);
                  
                  // Buscar en varias estructuras de datos posibles
                  if (jsonData.imageUrl) {
                    imgUrl = jsonData.imageUrl;
                    console.log('✓ Imagen extraída de JSON (imageUrl)');
                    return false;
                  } else if (jsonData.image_url) {
                    imgUrl = jsonData.image_url;
                    console.log('✓ Imagen extraída de JSON (image_url)');
                    return false;
                  } else if (jsonData.mainImage) {
                    imgUrl = jsonData.mainImage;
                    console.log('✓ Imagen extraída de JSON (mainImage)');
                    return false;
                  } else if (jsonData.images && jsonData.images.length > 0) {
                    imgUrl = jsonData.images[0];
                    console.log('✓ Imagen extraída de JSON (images array)');
                    return false;
                  } else if (jsonData.imageModule && jsonData.imageModule.imagePathList && jsonData.imageModule.imagePathList.length > 0) {
                    imgUrl = jsonData.imageModule.imagePathList[0];
                    console.log('✓ Imagen extraída de JSON (imageModule)');
                    return false;
                  }
                }
              } catch (e) {
                // Continue con el siguiente bloque JSON
              }
            }
          }
          
          // 4. Búsqueda directa de URLs de imágenes de AliExpress
          const urlMatches = content.match(/https:\/\/ae01\.alicdn\.com\/kf\/[^"']+?(?:\.jpg|\.png|\.jpeg)/g);
          if (urlMatches && urlMatches.length > 0) {
            // Filtrar y seleccionar la mejor imagen (normalmente las más grandes)
            const validImages = urlMatches.filter(url => 
              !url.includes('50x50') && 
              !url.includes('32x32') && 
              !url.includes('16x16') && 
              !url.includes('thumbnail') &&
              !url.includes('icon')
            );
            
            if (validImages.length > 0) {
              // Preferir imágenes con resoluciones altas
              const highResImage = validImages.find(url => 
                url.includes('1000x1000') || 
                url.includes('800x800') || 
                url.includes('640x640')
              );
              
              imgUrl = highResImage || validImages[0];
              console.log('✓ Imagen extraída de URL directa en script');
              return false;
            }
          }
        } catch (e) {
          // Continuar con la siguiente iteración
        }
      }
    });
    
    // ESTRATEGIA 2: Buscar en elementos específicos del DOM
    if (!imgUrl) {
      // Selectores específicos de AliExpress (diferentes versiones del sitio)
      const aliexpressSelectors = [
        // Nueva versión del sitio
        '.img-view-item img',
        '.images-view-item img', 
        '.product-main-image img',
        // Versión clásica
        '.magnifier-image',
        '.gallery-preview-panel img',
        // Versiones móviles y responsive
        '.product-image img',
        '.product-gallery img',
        // Otros selectores comunes
        '.detail-gallery-image',
        '.pdp-image',
        '[data-role="product-image"] img'
      ];
      
      for (const selector of aliexpressSelectors) {
        const img = $(selector).first();
        let src = img.attr('src') || 
                 img.attr('data-src') || 
                 img.attr('data-lazy-src') || 
                 img.attr('data-lazy') ||
                 img.attr('data-image');
        
        if (src) {
          // Asegurarse de que la URL tenga el protocolo
          if (src.indexOf('//') === 0) {
            src = 'https:' + src;
          }
          
          if (src.indexOf('alicdn') >= 0 && src.indexOf('icon') === -1 && src.indexOf('logo') === -1) {
            imgUrl = src;
            console.log(`✓ Imagen extraída de selector CSS: ${selector}`);
            break;
          }
        }
      }
    }
    
    // ESTRATEGIA 3: Buscar imágenes con el dominio de AliExpress
    if (!imgUrl) {
      // Buscar cualquier imagen del dominio ae01.alicdn.com que parezca ser de producto
      $('img').each((_, element) => {
        const img = $(element);
        const src = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
        
        if (src) {
          // Comprobar si es una imagen de AliExpress y no es un icono
          if (src.indexOf('ae01.alicdn.com') >= 0 && 
              src.indexOf('icon') === -1 && 
              src.indexOf('logo') === -1 && 
              src.indexOf('16x16') === -1 && 
              src.indexOf('32x32') === -1) {
            
            // Verificar si es una imagen de tamaño razonable
            const width = parseInt(img.attr('width') || '0', 10);
            const height = parseInt(img.attr('height') || '0', 10);
            
            // Si tiene dimensiones y son razonables
            if ((width === 0 && height === 0) || (width > 100 || height > 100)) {
              imgUrl = src.indexOf('//') === 0 ? 'https:' + src : src;
              console.log('✓ Imagen de AliExpress encontrada en DOM general');
              return false; // Break the each loop
            }
          }
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
 */
async function extractBestImageWithCheerio($: cheerio.CheerioAPI, url: string): Promise<string | null> {
  try {
    let bestImage: string | null = null;
    let bestScore = 0;
    
    // Buscar imágenes y evaluarlas por dimensiones y atributos relevantes
    $('img').each((_, element) => {
      let score = 0;
      const img = $(element);
      const src: string | undefined = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src');
      
      if (!src) return;
      
      // Filtrar imágenes pequeñas, iconos y placeholder
      if (src.indexOf('blank.') >= 0 || 
          src.indexOf('placeholder') >= 0 || 
          src.indexOf('loading') >= 0 ||
          src.indexOf('icon') >= 0 || 
          src.indexOf('logo') >= 0) {
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
        if (className.indexOf(keyword) >= 0) score += 15;
        if (id.indexOf(keyword) >= 0) score += 15;
        if (parentClass.indexOf(keyword) >= 0) score += 10;
        if (parentId.indexOf(keyword) >= 0) score += 10;
        if (alt.indexOf(keyword) >= 0) score += 5;
      }
      
      // No podemos usar offset en cheerio en Node.js al igual que en jQuery
      // Usamos otra heurística: si aparece antes en el DOM, es más probable que sea importante
      if (_.toString().length < 5000) {
        score += 15; // Está cerca del inicio del documento
      }
      
      // Penalización para imágenes probablemente irrelevantes
      if (className.indexOf('avatar') >= 0 || 
          className.indexOf('thumb') >= 0 || 
          id.indexOf('avatar') >= 0 || 
          id.indexOf('thumb') >= 0) {
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
        const src: string | undefined = $(element).attr('src');
        const width = parseInt($(element).attr('width') || '0', 10);
        const height = parseInt($(element).attr('height') || '0', 10);
        
        if (src && 
            (width > 200 || height > 200) && 
            src.indexOf('blank.') === -1 && 
            src.indexOf('placeholder') === -1 && 
            src.indexOf('loading') === -1 && 
            src.indexOf('icon') === -1 && 
            src.indexOf('logo') === -1) {
          bestImage = src;
          return false; // Break the each loop
        }
      });
    }
    
    // Asegurarse de que la URL sea absoluta
    if (bestImage) {
      try {
        // Es necesario convertir las rutas relativas a absolutas
        const makeAbsoluteUrl = (relativeUrl: string): string => {
          try {
            if (relativeUrl.indexOf('http') === 0) {
              // Ya es absoluta
              return relativeUrl;
            }
            
            const baseUrl = new URL(url);
            
            if (relativeUrl.indexOf('//') === 0) {
              // URL protocolo-relativa
              return baseUrl.protocol + relativeUrl;
            } else if (relativeUrl.indexOf('/') === 0) {
              // URL absoluta al dominio
              return baseUrl.origin + relativeUrl;
            } else {
              // URL relativa
              return baseUrl.origin + '/' + relativeUrl;
            }
          } catch (err) {
            console.log('Error al convertir URL relativa a absoluta:', err);
            return relativeUrl;
          }
        };
        
        return makeAbsoluteUrl(bestImage);
      } catch (e) {
        console.log('Error convirtiendo URL relativa a absoluta:', e);
        return bestImage; // Devolver la URL tal cual
      }
    }
    
    return bestImage;
  } catch (e) {
    console.log('Error extrayendo imagen genérica con cheerio:', e);
    return null;
  }
}