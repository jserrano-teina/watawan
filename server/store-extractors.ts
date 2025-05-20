/**
 * Extractores especializados para tiendas problemáticas
 * Implementa soluciones específicas para tiendas como Miravia, AliExpress, Decathlon y Carrefour
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';
import * as cheerio from 'cheerio';

// Constantes
const TIMEOUT = 5000;
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
];

// Obtener un User-Agent aleatorio
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Función segura para hacer fetch
async function safeFetch(url: string, options: any = {}): Promise<NodeFetchResponse | null> {
  const MAX_RETRIES = 2;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT);
      
      const signal = options.signal || controller.signal;
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      } else {
        console.log(`[StoreExtractor] Intento ${attempt + 1} falló con código: ${response.status}`);
      }
    } catch (error) {
      console.log(`[StoreExtractor] Error en fetch para ${url} (intento ${attempt + 1}): ${error instanceof Error ? error.message : String(error)}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = Math.pow(2, attempt) * 500;
        console.log(`[StoreExtractor] Esperando ${waitTime}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  return null;
}

// Función para verificar si una URL es de Miravia
export function isMiraviaUrl(url: string): boolean {
  return /miravia\.(es|com)/i.test(url);
}

// Función para verificar si una URL es de AliExpress
export function isAliExpressUrl(url: string): boolean {
  return /aliexpress\.(com|es)/i.test(url);
}

// Función para verificar si una URL es de Decathlon
export function isDecathlonUrl(url: string): boolean {
  return /decathlon\.(es|com|fr)/i.test(url);
}

// Función para verificar si una URL es de Carrefour
export function isCarrefourUrl(url: string): boolean {
  return /carrefour\.(es|com|fr)/i.test(url);
}

// Extractor específico para Carrefour
export async function extractCarrefourMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[StoreExtractor] Iniciando extracción para Carrefour: ${url}`);
  
  try {
    // Configurar cabeceras para evitar bloqueos
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await safeFetch(url, { headers, timeout: TIMEOUT });
    
    if (!response) {
      console.log(`[StoreExtractor] No se pudo obtener respuesta de Carrefour`);
      return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extraer título
    let title = '';
    
    // Patrones específicos para títulos en Carrefour
    const titleSelectors = [
      'h1.product-card__title', // Selector principal para título de producto
      'h1.product-details-title',
      'h1.product-header__name',
      '.card-product-detail__title',
      'meta[property="og:title"]', // Meta tag de Open Graph
      'meta[name="twitter:title"]', // Meta tag de Twitter
      'h1[itemprop="name"]',
      'title' // Título de la página como último recurso
    ];
    
    for (const selector of titleSelectors) {
      if (!title) {
        if (selector === 'meta[property="og:title"]' || selector === 'meta[name="twitter:title"]') {
          title = $(selector).attr('content') || '';
        } else if (selector === 'title') {
          const pageTitle = $(selector).text();
          // Limpiar del título la parte de "Carrefour" o el nombre del sitio
          title = pageTitle.split('|')[0].trim();
          if (!title || title.toLowerCase().includes('carrefour')) {
            title = pageTitle.split('-')[0].trim();
          }
        } else {
          title = $(selector).text().trim();
        }
        
        if (title) {
          console.log(`[StoreExtractor] Título extraído de Carrefour con selector ${selector}: ${title}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos título, intentar con datos estructurados JSON-LD
    if (!title) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          // A veces hay múltiples bloques JSON-LD, intentamos parsear cada uno
          const jsonBlocks = jsonLd.split('</script><script type="application/ld+json">');
          
          for (const block of jsonBlocks) {
            try {
              const ldData = JSON.parse(block);
              if (ldData && ldData.name) {
                title = ldData.name;
                console.log(`[StoreExtractor] Título extraído de Carrefour con JSON-LD: ${title}`);
                break;
              } else if (ldData && ldData["@graph"]) {
                // Buscar en el grafo
                const product = ldData["@graph"].find((item: any) => 
                  item["@type"] === "Product" || item["@type"] === "ItemPage" || item["@type"] === "WebPage");
                
                if (product && product.name) {
                  title = product.name;
                  console.log(`[StoreExtractor] Título extraído de Carrefour con JSON-LD @graph: ${title}`);
                  break;
                }
              }
            } catch (e) {
              // Continuar con el siguiente bloque si este falla
            }
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD: ${e}`);
        }
      }
    }
    
    // Verificar que el título no es el dominio
    if (title.toLowerCase().includes('carrefour') && title.length < 15) {
      title = '';
    }
    
    // Extraer imagen
    let imageUrl = '';
    
    // Patrones específicos para imágenes en Carrefour
    const imageSelectors = [
      '.product-card__image img',
      '.product-image-container img',
      '.card-product-image img',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img[itemprop="image"]',
      '.product-detail__main-img'
    ];
    
    for (const selector of imageSelectors) {
      if (!imageUrl) {
        if (selector === 'meta[property="og:image"]' || selector === 'meta[name="twitter:image"]') {
          imageUrl = $(selector).attr('content') || '';
        } else {
          // Buscar en varios atributos donde podría estar la URL de la imagen
          const img = $(selector);
          imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('srcset')?.split(' ')[0] || '';
        }
        
        if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
          console.log(`[StoreExtractor] Imagen extraída de Carrefour con selector ${selector}: ${imageUrl}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos imagen, buscar en datos estructurados JSON-LD
    if (!imageUrl) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          // A veces hay múltiples bloques JSON-LD, intentamos parsear cada uno
          const jsonBlocks = jsonLd.split('</script><script type="application/ld+json">');
          
          for (const block of jsonBlocks) {
            try {
              const ldData = JSON.parse(block);
              if (ldData && ldData.image) {
                // La imagen puede ser una string o un objeto con url
                if (typeof ldData.image === 'string') {
                  imageUrl = ldData.image;
                } else if (typeof ldData.image === 'object' && ldData.image.url) {
                  imageUrl = ldData.image.url;
                } else if (Array.isArray(ldData.image) && ldData.image.length > 0) {
                  imageUrl = typeof ldData.image[0] === 'string' ? ldData.image[0] : ldData.image[0].url;
                }
                
                if (imageUrl) {
                  console.log(`[StoreExtractor] Imagen extraída de Carrefour con JSON-LD: ${imageUrl}`);
                  break;
                }
              } else if (ldData && ldData["@graph"]) {
                // Buscar en el grafo
                const product = ldData["@graph"].find((item: any) => 
                  item["@type"] === "Product" || item["@type"] === "ItemPage" || item["@type"] === "WebPage");
                
                if (product && product.image) {
                  if (typeof product.image === 'string') {
                    imageUrl = product.image;
                  } else if (typeof product.image === 'object' && product.image.url) {
                    imageUrl = product.image.url;
                  } else if (Array.isArray(product.image) && product.image.length > 0) {
                    imageUrl = typeof product.image[0] === 'string' ? product.image[0] : product.image[0].url;
                  }
                  
                  if (imageUrl) {
                    console.log(`[StoreExtractor] Imagen extraída de Carrefour con JSON-LD @graph: ${imageUrl}`);
                    break;
                  }
                }
              }
            } catch (e) {
              // Continuar con el siguiente bloque si este falla
            }
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD para imagen: ${e}`);
        }
      }
    }
    
    // Buscar imágenes que contengan palabras clave específicas de Carrefour
    if (!imageUrl) {
      const allImages = $('img').toArray()
        .map(img => {
          const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src') || '';
          const width = parseInt($(img).attr('width') || '0');
          const height = parseInt($(img).attr('height') || '0');
          return { src, width, height, area: width * height };
        })
        .filter(img => 
          img.src && 
          img.area > 10000 && // Filtrar imágenes pequeñas
          !img.src.includes('placeholder') && 
          !img.src.includes('logo') && 
          (img.src.includes('product') || img.src.includes('img') || img.src.endsWith('.jpg') || img.src.endsWith('.png'))
        )
        .sort((a, b) => b.area - a.area); // Ordenar por tamaño, más grande primero
      
      if (allImages.length > 0) {
        imageUrl = allImages[0].src;
        console.log(`[StoreExtractor] Imagen extraída de Carrefour mediante búsqueda por tamaño: ${imageUrl}`);
      }
    }
    
    // Añadir protocolo si es necesario
    if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    // Si la URL es relativa, convertirla en absoluta
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        if (imageUrl.startsWith('/')) {
          imageUrl = urlObj.origin + imageUrl;
        } else {
          imageUrl = urlObj.origin + '/' + imageUrl;
        }
      } catch (e) {
        console.log(`[StoreExtractor] Error al convertir URL relativa: ${e}`);
      }
    }
    
    return {
      title,
      imageUrl,
      isTitleValid: !!title && title.length > 5 && !title.toLowerCase().includes('carrefour.es'),
      isImageValid: !!imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')
    };
  } catch (error) {
    console.log(`[StoreExtractor] Error extrayendo metadatos de Carrefour: ${error}`);
    return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
  }
}

// Extractor específico para Decathlon
export async function extractDecathlonMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[StoreExtractor] Iniciando extracción para Decathlon: ${url}`);
  
  try {
    // Configurar cabeceras para evitar bloqueos
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await safeFetch(url, { headers, timeout: TIMEOUT });
    
    if (!response) {
      console.log(`[StoreExtractor] No se pudo obtener respuesta de Decathlon`);
      return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extraer título
    let title = '';
    
    // Patrones específicos para títulos en Decathlon
    const titleSelectors = [
      'h1.title--product', // Selector principal para título de producto
      'h1.pdp-title',
      '.name-product',
      '.product-detail-name',
      'meta[property="og:title"]', // Meta tag de Open Graph
      'meta[name="twitter:title"]', // Meta tag de Twitter
      'h1[itemprop="name"]',
      'title' // Título de la página como último recurso
    ];
    
    for (const selector of titleSelectors) {
      if (!title) {
        if (selector === 'meta[property="og:title"]' || selector === 'meta[name="twitter:title"]') {
          title = $(selector).attr('content') || '';
        } else if (selector === 'title') {
          const pageTitle = $(selector).text();
          // Limpiar del título la parte de "Decathlon" o el nombre del sitio
          title = pageTitle.split('|')[0].trim();
          if (!title) {
            title = pageTitle.split('-')[0].trim();
          }
        } else {
          title = $(selector).text().trim();
        }
        
        if (title) {
          console.log(`[StoreExtractor] Título extraído de Decathlon con selector ${selector}: ${title}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos título, intentar con datos estructurados JSON-LD
    if (!title) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          // A veces hay múltiples bloques JSON-LD, intentamos parsear cada uno
          const jsonBlocks = jsonLd.split('</script><script type="application/ld+json">');
          
          for (const block of jsonBlocks) {
            try {
              const ldData = JSON.parse(block);
              if (ldData && ldData.name) {
                title = ldData.name;
                console.log(`[StoreExtractor] Título extraído de Decathlon con JSON-LD: ${title}`);
                break;
              } else if (ldData && ldData["@graph"]) {
                // Buscar en el grafo
                const product = ldData["@graph"].find((item: any) => 
                  item["@type"] === "Product" || item["@type"] === "SportingGood" || item["@type"] === "Product");
                
                if (product && product.name) {
                  title = product.name;
                  console.log(`[StoreExtractor] Título extraído de Decathlon con JSON-LD @graph: ${title}`);
                  break;
                }
              }
            } catch (e) {
              // Continuar con el siguiente bloque si este falla
            }
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD: ${e}`);
        }
      }
    }
    
    // Verificar que el título no es el dominio
    if (title.toLowerCase().includes('decathlon') && title.length < 15) {
      title = '';
    }
    
    // Extraer imagen
    let imageUrl = '';
    
    // Patrones específicos para imágenes en Decathlon
    const imageSelectors = [
      'img.item-image',
      '.product-image img',
      'img.main-image',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img[itemprop="image"]',
      'img.pdp__image--main',
      '.js-swiper-slide-product img'
    ];
    
    for (const selector of imageSelectors) {
      if (!imageUrl) {
        if (selector === 'meta[property="og:image"]' || selector === 'meta[name="twitter:image"]') {
          imageUrl = $(selector).attr('content') || '';
        } else {
          // Buscar en varios atributos donde podría estar la URL de la imagen
          const img = $(selector);
          imageUrl = img.attr('src') || img.attr('data-src') || img.attr('data-lazy-src') || img.attr('srcset')?.split(' ')[0] || '';
        }
        
        if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
          console.log(`[StoreExtractor] Imagen extraída de Decathlon con selector ${selector}: ${imageUrl}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos imagen, buscar en datos estructurados JSON-LD
    if (!imageUrl) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          // A veces hay múltiples bloques JSON-LD, intentamos parsear cada uno
          const jsonBlocks = jsonLd.split('</script><script type="application/ld+json">');
          
          for (const block of jsonBlocks) {
            try {
              const ldData = JSON.parse(block);
              if (ldData && ldData.image) {
                // La imagen puede ser una string o un objeto con url
                if (typeof ldData.image === 'string') {
                  imageUrl = ldData.image;
                } else if (typeof ldData.image === 'object' && ldData.image.url) {
                  imageUrl = ldData.image.url;
                } else if (Array.isArray(ldData.image) && ldData.image.length > 0) {
                  imageUrl = typeof ldData.image[0] === 'string' ? ldData.image[0] : ldData.image[0].url;
                }
                
                if (imageUrl) {
                  console.log(`[StoreExtractor] Imagen extraída de Decathlon con JSON-LD: ${imageUrl}`);
                  break;
                }
              } else if (ldData && ldData["@graph"]) {
                // Buscar en el grafo
                const product = ldData["@graph"].find((item: any) => 
                  item["@type"] === "Product" || item["@type"] === "SportingGood" || item["@type"] === "Product");
                
                if (product && product.image) {
                  if (typeof product.image === 'string') {
                    imageUrl = product.image;
                  } else if (typeof product.image === 'object' && product.image.url) {
                    imageUrl = product.image.url;
                  } else if (Array.isArray(product.image) && product.image.length > 0) {
                    imageUrl = typeof product.image[0] === 'string' ? product.image[0] : product.image[0].url;
                  }
                  
                  if (imageUrl) {
                    console.log(`[StoreExtractor] Imagen extraída de Decathlon con JSON-LD @graph: ${imageUrl}`);
                    break;
                  }
                }
              }
            } catch (e) {
              // Continuar con el siguiente bloque si este falla
            }
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD para imagen: ${e}`);
        }
      }
    }
    
    // Buscar imágenes que contengan palabras clave específicas de Decathlon
    if (!imageUrl) {
      const allImages = $('img').toArray()
        .map(img => {
          const src = $(img).attr('src') || $(img).attr('data-src') || $(img).attr('data-lazy-src') || '';
          const width = parseInt($(img).attr('width') || '0');
          const height = parseInt($(img).attr('height') || '0');
          return { src, width, height, area: width * height };
        })
        .filter(img => 
          img.src && 
          img.area > 10000 && // Filtrar imágenes pequeñas
          !img.src.includes('placeholder') && 
          !img.src.includes('logo') && 
          (img.src.includes('product') || img.src.includes('img') || img.src.endsWith('.jpg') || img.src.endsWith('.png'))
        )
        .sort((a, b) => b.area - a.area); // Ordenar por tamaño, más grande primero
      
      if (allImages.length > 0) {
        imageUrl = allImages[0].src;
        console.log(`[StoreExtractor] Imagen extraída de Decathlon mediante búsqueda por tamaño: ${imageUrl}`);
      }
    }
    
    // Añadir protocolo si es necesario
    if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    // Si la URL es relativa, convertirla en absoluta
    if (imageUrl && !imageUrl.startsWith('http')) {
      try {
        const urlObj = new URL(url);
        if (imageUrl.startsWith('/')) {
          imageUrl = urlObj.origin + imageUrl;
        } else {
          imageUrl = urlObj.origin + '/' + imageUrl;
        }
      } catch (e) {
        console.log(`[StoreExtractor] Error al convertir URL relativa: ${e}`);
      }
    }
    
    return {
      title,
      imageUrl,
      isTitleValid: !!title && title.length > 5 && !title.toLowerCase().includes('decathlon.es'),
      isImageValid: !!imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')
    };
  } catch (error) {
    console.log(`[StoreExtractor] Error extrayendo metadatos de Decathlon: ${error}`);
    return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
  }
}

// Extractor específico para Miravia
export async function extractMiraviaMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[StoreExtractor] Iniciando extracción para Miravia: ${url}`);
  
  try {
    // Configurar cabeceras para evitar bloqueos
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await safeFetch(url, { headers, timeout: TIMEOUT });
    
    if (!response) {
      console.log(`[StoreExtractor] No se pudo obtener respuesta de Miravia`);
      return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extraer título
    let title = '';
    
    // Patrones específicos para títulos en Miravia
    const titleSelectors = [
      'h1.product-name', // Selector principal para título de producto
      'h1.product-title',
      '.ProductName',
      '.product-detail-name',
      'meta[property="og:title"]', // Meta tag de Open Graph
      'meta[name="twitter:title"]', // Meta tag de Twitter
      'title' // Título de la página como último recurso
    ];
    
    for (const selector of titleSelectors) {
      if (!title) {
        if (selector === 'meta[property="og:title"]' || selector === 'meta[name="twitter:title"]') {
          title = $(selector).attr('content') || '';
        } else if (selector === 'title') {
          title = $(selector).text().split('|')[0].trim();
        } else {
          title = $(selector).text().trim();
        }
        
        if (title) {
          console.log(`[StoreExtractor] Título extraído de Miravia con selector ${selector}: ${title}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos título, intentar con datos estructurados JSON-LD
    if (!title) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          const ldData = JSON.parse(jsonLd);
          if (ldData && (ldData.name || (ldData['@graph'] && ldData['@graph'][0] && ldData['@graph'][0].name))) {
            title = ldData.name || ldData['@graph'][0].name;
            console.log(`[StoreExtractor] Título extraído de Miravia con JSON-LD: ${title}`);
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD: ${e}`);
        }
      }
    }
    
    // Verificar que el título no es el dominio
    if (title.toLowerCase().includes('miravia') && title.length < 15) {
      title = '';
    }
    
    // Extraer imagen
    let imageUrl = '';
    
    // Patrones específicos para imágenes en Miravia
    const imageSelectors = [
      '.product-image img',
      '.product-gallery__image',
      '#productGallery img',
      '.product-image-main img',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img.main-product-image'
    ];
    
    for (const selector of imageSelectors) {
      if (!imageUrl) {
        if (selector === 'meta[property="og:image"]' || selector === 'meta[name="twitter:image"]') {
          imageUrl = $(selector).attr('content') || '';
        } else {
          imageUrl = $(selector).attr('src') || $(selector).attr('data-src') || '';
        }
        
        if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
          console.log(`[StoreExtractor] Imagen extraída de Miravia con selector ${selector}: ${imageUrl}`);
          break;
        }
      }
    }
    
    // Si aún no tenemos imagen, buscar en datos estructurados JSON-LD
    if (!imageUrl) {
      const jsonLd = $('script[type="application/ld+json"]').text();
      if (jsonLd) {
        try {
          const ldData = JSON.parse(jsonLd);
          if (ldData && (ldData.image || (ldData['@graph'] && ldData['@graph'][0] && ldData['@graph'][0].image))) {
            const imageData = ldData.image || ldData['@graph'][0].image;
            if (typeof imageData === 'string') {
              imageUrl = imageData;
            } else if (Array.isArray(imageData) && imageData.length > 0) {
              imageUrl = imageData[0].url || imageData[0];
            } else if (imageData && imageData.url) {
              imageUrl = imageData.url;
            }
            console.log(`[StoreExtractor] Imagen extraída de Miravia con JSON-LD: ${imageUrl}`);
          }
        } catch (e) {
          console.log(`[StoreExtractor] Error parseando JSON-LD: ${e}`);
        }
      }
    }
    
    // Extraer mejor imagen de la página como último recurso
    if (!imageUrl) {
      const allImages = $('img').toArray()
        .map(img => $(img).attr('src') || $(img).attr('data-src') || '')
        .filter(Boolean)
        .filter((src): src is string => !!src && !src.includes('placeholder') && !src.includes('logo') && (src.includes('.jpg') || src.includes('.png')))
        .sort((a, b) => b.length - a.length); // Imágenes con URLs más largas suelen ser de mejor calidad
      
      if (allImages.length > 0) {
        imageUrl = allImages[0];
        console.log(`[StoreExtractor] Imagen extraída de Miravia con selector genérico: ${imageUrl}`);
      }
    }
    
    // Añadir protocolo si es necesario
    if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    return {
      title,
      imageUrl,
      isTitleValid: !!title && title.length > 5 && !title.toLowerCase().includes('miravia.es'),
      isImageValid: !!imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')
    };
  } catch (error) {
    console.log(`[StoreExtractor] Error extrayendo metadatos de Miravia: ${error}`);
    return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
  }
}

// Extractor específico para AliExpress
export async function extractAliExpressMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[StoreExtractor] Iniciando extracción para AliExpress: ${url}`);
  
  try {
    // Configurar cabeceras para evitar bloqueos
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
      'DNT': '1'
    };
    
    const response = await safeFetch(url, { headers, timeout: TIMEOUT });
    
    if (!response) {
      console.log(`[StoreExtractor] No se pudo obtener respuesta de AliExpress`);
      return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extraer título
    let title = '';
    
    // Patrones específicos para títulos en AliExpress
    const titleSelectors = [
      '.product-title-text',
      '.product-title',
      'h1.product-name',
      'h1[data-pl="product-title"]',
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title'
    ];
    
    for (const selector of titleSelectors) {
      if (!title) {
        if (selector === 'meta[property="og:title"]' || selector === 'meta[name="twitter:title"]') {
          title = $(selector).attr('content') || '';
        } else if (selector === 'title') {
          title = $(selector).text().split('|')[0].trim();
        } else {
          title = $(selector).text().trim();
        }
        
        if (title) {
          console.log(`[StoreExtractor] Título extraído de AliExpress con selector ${selector}: ${title}`);
          break;
        }
      }
    }
    
    // Extraer valor de window.runParams si está disponible (método específico para AliExpress)
    if (!title) {
      const scripts = $('script').toArray();
      
      for (const script of scripts) {
        const scriptContent = $(script).html() || '';
        
        if (scriptContent.includes('window.runParams')) {
          const titleMatch = scriptContent.match(/\"subject\":\s*\"([^\"]+)\"/);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
            console.log(`[StoreExtractor] Título extraído de AliExpress desde window.runParams: ${title}`);
            break;
          }
        }
      }
    }
    
    // Verificar que el título no es el dominio
    if (title.toLowerCase().includes('aliexpress') && title.length < 15) {
      title = '';
    }
    
    // Extraer imagen
    let imageUrl = '';
    
    // Patrones específicos para imágenes en AliExpress
    const imageSelectors = [
      '.magnifier-image',
      'img.magnifier',
      '.product-image img',
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'img.poster',
      'img#poster',
      '.pdp-gallery img'
    ];
    
    for (const selector of imageSelectors) {
      if (!imageUrl) {
        if (selector === 'meta[property="og:image"]' || selector === 'meta[name="twitter:image"]') {
          imageUrl = $(selector).attr('content') || '';
        } else {
          imageUrl = $(selector).attr('src') || $(selector).attr('data-src') || '';
        }
        
        if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo') && (imageUrl.includes('ae01.alicdn.com') || imageUrl.includes('aliexpress'))) {
          console.log(`[StoreExtractor] Imagen extraída de AliExpress con selector ${selector}: ${imageUrl}`);
          break;
        }
      }
    }
    
    // Buscar imagen en scripts (método específico para AliExpress)
    if (!imageUrl) {
      const scripts = $('script').toArray();
      
      for (const script of scripts) {
        const scriptContent = $(script).html() || '';
        
        if (scriptContent.includes('window.runParams') || scriptContent.includes('imageModule')) {
          // Buscar en la estructura imageModule que contiene imágenes
          const imageMatch = scriptContent.match(/\"imagePathList\":\s*\[\s*\"([^\"]+)\"/);
          if (imageMatch && imageMatch[1]) {
            imageUrl = imageMatch[1].trim();
            console.log(`[StoreExtractor] Imagen extraída de AliExpress desde window.runParams: ${imageUrl}`);
            break;
          }
          
          // También buscar en formato JSON
          const jsonMatch = scriptContent.match(/"imageUrl":\s*"([^"]+)"/);
          if (jsonMatch && jsonMatch[1]) {
            imageUrl = jsonMatch[1].trim();
            console.log(`[StoreExtractor] Imagen extraída de AliExpress desde JSON en script: ${imageUrl}`);
            break;
          }
        }
      }
    }
    
    // Extraer imagen de cualquier parte de la página que coincida con el CDN de AliExpress
    if (!imageUrl) {
      const cdnRegex = /https:\/\/ae01\.alicdn\.com\/kf\/[^"']+\.(jpg|png)/i;
      const cdnMatch = html.match(cdnRegex);
      
      if (cdnMatch && cdnMatch[0]) {
        imageUrl = cdnMatch[0];
        console.log(`[StoreExtractor] Imagen extraída de AliExpress mediante regex de CDN: ${imageUrl}`);
      }
    }
    
    // Añadir protocolo si es necesario
    if (imageUrl && imageUrl.startsWith('//')) {
      imageUrl = 'https:' + imageUrl;
    }
    
    // Verificar si la imagen es realmente de AliExpress
    const isAliExpressImage = imageUrl.includes('ae01.alicdn.com') || imageUrl.includes('aliexpress');
    
    return {
      title,
      imageUrl,
      isTitleValid: !!title && title.length > 5 && !title.toLowerCase().includes('aliexpress.com'),
      isImageValid: !!imageUrl && isAliExpressImage && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')
    };
  } catch (error) {
    console.log(`[StoreExtractor] Error extrayendo metadatos de AliExpress: ${error}`);
    return { title: '', imageUrl: '', isTitleValid: false, isImageValid: false };
  }
}