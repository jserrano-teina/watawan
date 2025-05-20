/**
 * Extractor especializado para productos de AliExpress
 * Implementa estrategias avanzadas para obtener metadatos confiables de AliExpress
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';
import * as cheerio from 'cheerio';

// User-Agents rotatorios para evitar detección
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
];

// Referrers comunes para evadir detecciones
const REFERRERS = [
  'https://www.google.com/',
  'https://www.bing.com/',
  'https://www.google.es/',
  'https://duckduckgo.com/'
];

// Timeout para peticiones
const TIMEOUT = 8000;

/**
 * Verifica si una URL es de AliExpress
 */
export function isAliExpressUrl(url: string): boolean {
  return url.includes('aliexpress.com') || 
         url.includes('ae01.alicdn.com') || 
         url.includes('alicdn.com');
}

/**
 * Función segura para realizar peticiones HTTP con reintentos
 */
async function safeFetch(url: string, options: any = {}): Promise<NodeFetchResponse | null> {
  const MAX_RETRIES = 2;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT);
      
      const signal = options.signal || controller.signal;
      
      // Usar un User-Agent aleatorio para cada intento
      const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
      const randomReferrer = REFERRERS[Math.floor(Math.random() * REFERRERS.length)];
      
      const headers = {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': randomReferrer,
        ...(options.headers || {})
      };
      
      console.log(`[AliExtractor] Intento ${attempt + 1}/${MAX_RETRIES} para ${url}`);
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      } else {
        console.log(`[AliExtractor] Intento ${attempt + 1} falló con código: ${response.status}`);
      }
    } catch (error) {
      console.log(`[AliExtractor] Error en fetch para ${url} (intento ${attempt + 1}): ${error instanceof Error ? error.message : String(error)}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = Math.pow(2, attempt) * 500;
        console.log(`[AliExtractor] Esperando ${waitTime}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  return null;
}

/**
 * Decodifica entidades HTML en un texto
 */
function decodeHTMLEntities(text: string): string {
  if (!text) return '';
  
  const entities = [
    ['&amp;', '&'],
    ['&lt;', '<'],
    ['&gt;', '>'],
    ['&quot;', '"'],
    ['&apos;', "'"],
    ['&#x27;', "'"],
    ['&#x2F;', '/'],
    ['&#39;', "'"],
    ['&#47;', '/'],
    ['&nbsp;', ' ']
  ];
  
  let decodedText = text;
  for (const [entity, replacement] of entities) {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), replacement);
  }
  
  return decodedText.trim();
}

/**
 * Limpia un título de producto de AliExpress
 */
function cleanAliExpressTitle(title: string): string {
  if (!title) return '';
  
  // Eliminar "es.aliexpress.com" o cualquier variante del dominio
  title = title.replace(/(\w+\.)?aliexpress\.com/i, '').trim();
  
  // Eliminar "- comprar a precios bajos en la tienda en línea de..." y similares
  title = title.replace(/\s*-\s*comprar a precios bajos.*$/i, '')
               .replace(/\s*-\s*Buy from.*$/i, '')
               .replace(/\s*from.*on AliExpress/i, '')
               .replace(/\s*en AliExpress/i, '')
               .trim();
  
  // Eliminar información irrelevante
  title = title.replace(/\|\s*aliexpress/i, '')
               .replace(/\|\s*\d+\.\d+\$?/i, '')  // Precios
               .replace(/\s+\d+\.\d+\$?/i, '')    // Precios sin el pipe
               .replace(/\(\d+% de descuento\)/i, '')
               .replace(/\(\d+% off\)/i, '')
               .trim();
  
  // Eliminar el "| Aliexpress" del final si existe
  title = title.replace(/\s*\|\s*Aliexpress\s*$/i, '').trim();
  
  // Si después de la limpieza el título es muy corto o sigue siendo una URL, usar valor predeterminado
  if (title.length < 5 || title.includes('.com') || title.includes('http')) {
    return '';
  }
  
  return title;
}

/**
 * Extrae un ID de producto de AliExpress de una URL
 */
function extractProductId(url: string): string | null {
  // Patrones comunes para IDs de producto en URLs de AliExpress
  const patterns = [
    /\/item\/(\d+)\.html/i,
    /\/product\/(\d+)\.html/i,
    /\/(\d+)\.html/i,
    /product_id=(\d+)/i,
    /productId=(\d+)/i,
    /product\/(\d+)/i
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Construye una URL de imagen de producto basada en el ID
 */
function getImageUrlFromProductId(productId: string): string {
  // AliExpress usa este patrón para muchas de sus imágenes de producto
  return `https://ae01.alicdn.com/kf/S${productId}_640x640.jpg`;
}

/**
 * Extrae metadatos detallados de un producto de AliExpress
 */
export async function extractAliExpressMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  description?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[AliExtractor] Iniciando extracción para: ${url}`);
  
  const result: {
    title?: string;
    imageUrl?: string;
    description?: string;
    isTitleValid?: boolean;
    isImageValid?: boolean;
  } = {};
  
  try {
    // Paso 1: Intentar extraer el ID del producto
    const productId = extractProductId(url);
    console.log(`[AliExtractor] ID extraído: ${productId || 'no encontrado'}`);
    
    // Paso 2: Obtener la página del producto
    const response = await safeFetch(url);
    if (!response) {
      console.log('[AliExtractor] No se pudo obtener la página del producto');
      
      // Si tenemos ID de producto, intentar construir una URL de imagen
      if (productId) {
        result.imageUrl = getImageUrlFromProductId(productId);
        result.isImageValid = true;
      }
      
      return result;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Paso 3: Extraer título del producto
    // Método 1: De la etiqueta <title>
    let title = $('title').text();
    
    // Método 2: De metadatos OpenGraph
    if (!title || title.includes('aliexpress.com')) {
      title = $('meta[property="og:title"]').attr('content') || 
              $('meta[name="title"]').attr('content') || 
              title;
    }
    
    // Método 3: De elementos DOM específicos de AliExpress
    if (!title || title.includes('aliexpress.com')) {
      title = $('.product-title').text() || 
              $('.product-info-title').text() || 
              $('h1.Title--title--2rJqG').text() || 
              $('h1').first().text();
    }
    
    // Método 4: Buscar en scripts JSON
    if (!title || title.includes('aliexpress.com')) {
      $('script:not([src])').each((_, element) => {
        const script = $(element).html() || '';
        
        if (script.includes('"subject"') || script.includes('"title"')) {
          const subjectMatch = script.match(/"subject"\s*:\s*"([^"]+)"/i);
          const titleMatch = script.match(/"title"\s*:\s*"([^"]+)"/i);
          
          if (subjectMatch && subjectMatch[1]) {
            title = decodeHTMLEntities(subjectMatch[1]);
            return false; // Romper el bucle
          } else if (titleMatch && titleMatch[1]) {
            title = decodeHTMLEntities(titleMatch[1]);
            return false; // Romper el bucle
          }
        }
      });
    }
    
    // Limpiar y validar el título
    if (title) {
      title = cleanAliExpressTitle(title);
      if (title) {
        result.title = title;
        result.isTitleValid = true;
        console.log(`[AliExtractor] Título extraído: ${title}`);
      }
    }
    
    // Paso 4: Extraer la imagen principal del producto
    // Método 1: De metadatos OpenGraph
    let imageUrl = $('meta[property="og:image"]').attr('content') || 
                   $('meta[property="og:image:url"]').attr('content');
    
    // Método 2: De los elementos DOM específicos de AliExpress
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('logo')) {
      imageUrl = $('.magnifier-image').attr('src') || 
                 $('.product-image img').attr('src') || 
                 $('.gallery-preview-panel img').first().attr('src');
    }
    
    // Método 3: Buscar en scripts JSON
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('logo')) {
      $('script:not([src])').each((_, element) => {
        const script = $(element).html() || '';
        
        if (script.includes('imageUrl') || script.includes('image_url') || script.includes('imageModule')) {
          const imgMatch = script.match(/"imageUrl"\s*:\s*"([^"]+)"/i) || 
                          script.match(/"image_url"\s*:\s*"([^"]+)"/i) || 
                          script.match(/"mainImage"\s*:\s*"([^"]+)"/i);
          
          if (imgMatch && imgMatch[1]) {
            imageUrl = imgMatch[1];
            return false; // Romper el bucle
          }
        }
      });
    }
    
    // Método 4: Buscar imágenes con dominio de AliExpress
    if (!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('logo')) {
      $('img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || '';
        
        if (src && src.includes('alicdn.com') && 
            !src.includes('icon') && !src.includes('logo') && !src.includes('placeholder')) {
          imageUrl = src;
          return false; // Romper el bucle
        }
      });
    }
    
    // Método 5: Fallback a ID del producto si todo lo demás falla
    if ((!imageUrl || imageUrl.includes('placeholder') || imageUrl.includes('logo')) && productId) {
      imageUrl = getImageUrlFromProductId(productId);
    }
    
    // Validar y guardar la URL de la imagen
    if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('logo')) {
      // Si la URL no comienza con http, agregar el prefijo necesario
      if (!imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('//') ? `https:${imageUrl}` : `https://${imageUrl}`;
      }
      
      result.imageUrl = imageUrl;
      result.isImageValid = true;
      console.log(`[AliExtractor] Imagen extraída: ${imageUrl}`);
    }
    
    // Paso 5: Extraer descripción si está disponible
    const description = $('meta[property="og:description"]').attr('content') || 
                        $('meta[name="description"]').attr('content');
    
    if (description && !description.includes('aliexpress.com') && description.length > 10) {
      result.description = description;
    }
    
    return result;
  } catch (error) {
    console.log(`[AliExtractor] Error en la extracción: ${error instanceof Error ? error.message : String(error)}`);
    return result;
  }
}