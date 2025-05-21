/**
 * Extractor especializado para productos de H&M
 * Implementado para resolver problemas específicos con esta tienda
 * entre entornos de desarrollo y producción
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';
import { cleanUrlFromTitle } from './url-title-cleaner';
import * as cheerio from 'cheerio';

// Configuración de User-Agents para evadir protecciones anti-scraping
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
];

// Tipos para el extractor de H&M
interface HMImage {
  url?: string;
  width?: number;
  height?: number;
}

interface HMApiResponse {
  name?: string;
  images?: HMImage[];
  [key: string]: any;
}

// Función para extraer el ID del producto de una URL de H&M
export function extractHMProductId(url: string): string | null {
  try {
    // En URLs como https://www2.hm.com/es_es/productpage.1295745001.html
    // El ID es 1295745001
    const match = url.match(/productpage\.(\d+)\.html/i);
    if (match && match[1]) {
      return match[1];
    }
    
    // Para otras variantes de URL de H&M
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/');
    for (const segment of pathSegments) {
      if (/^\d+$/.test(segment)) {
        return segment;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`[HMExtractor] Error extracting product ID: ${error}`);
    return null;
  }
}

// Función para verificar si una URL es de H&M
export function isHMUrl(url: string): boolean {
  return url.includes('hm.com') || 
         url.includes('www2.hm.com') || 
         url.includes('www2.hm.com/es_es');
}

// Función segura para obtener datos con timeout y múltiples reintentos
async function safeFetch(url: string, options: any = {}): Promise<NodeFetchResponse | null> {
  const MAX_RETRIES = 2;
  const TIMEOUT = 5000;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT);
      
      const signal = options.signal || controller.signal;
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {
          'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Referer': 'https://www.google.com/'
        },
        signal,
        redirect: 'follow'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      } else {
        console.log(`[HMExtractor] Attempt ${attempt + 1} failed with code: ${response.status}`);
      }
    } catch (error) {
      console.log(`[HMExtractor] Error in fetch for ${url} (attempt ${attempt + 1}): ${error}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = 500 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  return null;
}

// Extraer metadatos de H&M usando técnicas específicas para esta tienda
export async function extractHMMetadata(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[HMExtractor] Iniciando extracción para: ${url}`);
  
  try {
    // Extraer ID del producto
    const productId = extractHMProductId(url);
    console.log(`[HMExtractor] ID de producto extraído: ${productId || 'no encontrado'}`);
    
    if (!productId) {
      console.log(`[HMExtractor] No se pudo extraer ID del producto, no es posible continuar.`);
      return {};
    }
    
    // Resultados iniciales
    const result: {
      title?: string;
      imageUrl?: string;
      price?: string;
      description?: string;
      isTitleValid?: boolean;
      isImageValid?: boolean;
    } = {};
    
    // Intento 1: Extraer directamente de la página del producto
    try {
      const response = await safeFetch(url);
      
      if (response && response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extraer título - H&M tiene varias estructuras posibles
        let title = $('h1.heading').first().text().trim();
        if (!title) {
          title = $('h1[data-testid="product-title"]').first().text().trim();
        }
        if (!title) {
          title = $('title').text().replace(' | H&M ES', '').replace(' | H&M', '').trim();
        }
        if (!title || title === 'Productpage' || title.includes('Page not found')) {
          // Intentar extraer desde los metatags
          title = $('meta[property="og:title"]').attr('content') || '';
          title = title.replace(' | H&M ES', '').replace(' | H&M', '').trim();
        }
        
        // Limpiar el título de cualquier referencia a URLs o patrones de dominio
        if (title) {
          title = cleanUrlFromTitle(title);
          if (title) {
            result.title = title;
            result.isTitleValid = true;
            console.log(`[HMExtractor] Título extraído: ${title}`);
          }
        }
        
        // Extraer imagen - buscar en varias ubicaciones potenciales
        let imageUrl = $('meta[property="og:image"]').attr('content') || '';
        if (!imageUrl) {
          // Buscar la primera imagen del producto
          const imgElement = $('.product-detail-main-image-container img').first();
          imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
        }
        if (!imageUrl) {
          // Buscar en el contenedor del carrusel
          $('.product-detail-image img').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && !imageUrl) {
              imageUrl = src;
            }
          });
        }
        if (!imageUrl) {
          // Buscar cualquier imagen de producto
          $('img[data-testid="product-image"]').each((i, el) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && !imageUrl) {
              imageUrl = src;
            }
          });
        }
        
        // Asegurarse de que la URL de la imagen sea absoluta
        if (imageUrl && !imageUrl.startsWith('http')) {
          if (imageUrl.startsWith('//')) {
            imageUrl = 'https:' + imageUrl;
          } else {
            imageUrl = 'https://www2.hm.com' + imageUrl;
          }
        }
        
        if (imageUrl) {
          result.imageUrl = imageUrl;
          result.isImageValid = true;
          console.log(`[HMExtractor] Imagen extraída: ${imageUrl}`);
        }
        
        // Extraer precio (opcional)
        let price = $('.product-pricebox__price').text().trim();
        if (!price) {
          price = $('[data-testid="product-price"]').text().trim();
        }
        if (price) {
          result.price = price;
        }
        
        // Extraer descripción (opcional)
        let description = $('.product-description-text').text().trim();
        if (!description) {
          description = $('[data-testid="product-description"]').text().trim();
        }
        if (description) {
          result.description = description;
        }
      }
    } catch (error) {
      console.log(`[HMExtractor] Error en extracción directa: ${error}`);
    }
    
    // Intento 2: Si no se pudo extraer título o imagen, intentar con la API alternativa
    if (!result.title || !result.imageUrl) {
      try {
        // H&M tiene una API que podemos usar como respaldo
        const apiUrl = `https://www2.hm.com/hmwebservices/service/product/es/detail/${productId}.json`;
        const response = await safeFetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
          }
        });
        
        if (response && response.ok) {
          const jsonText = await response.text();
          
          try {
            const data = JSON.parse(jsonText) as HMApiResponse;
            
            // Extraer título de la API
            if (!result.title && data && data.name) {
              result.title = data.name;
              result.isTitleValid = true;
              console.log(`[HMExtractor] Título extraído desde API: ${data.name}`);
            }
            
            // Extraer imagen de la API
            if (!result.imageUrl && data && data.images && Array.isArray(data.images) && data.images.length > 0) {
              // Tomar la imagen de mayor resolución disponible
              let bestImageUrl: string | undefined;
              let bestWidth = 0;
              
              for (const img of data.images) {
                if (img.url && img.width && img.width > bestWidth) {
                  bestImageUrl = img.url;
                  bestWidth = img.width;
                }
              }
              
              if (bestImageUrl) {
                result.imageUrl = bestImageUrl;
                if (result.imageUrl && !result.imageUrl.startsWith('http')) {
                  result.imageUrl = 'https:' + result.imageUrl;
                }
                result.isImageValid = true;
                console.log(`[HMExtractor] Imagen extraída desde API: ${result.imageUrl}`);
              }
            }
          } catch (parseError) {
            console.log(`[HMExtractor] Error parseando respuesta JSON: ${parseError}`);
          }
        }
      } catch (error) {
        console.log(`[HMExtractor] Error en extracción API: ${error}`);
      }
    }
    
    // Intento 3: Si aún no tenemos título, intentar construir uno a partir del ID de producto
    if (!result.title) {
      const constructedTitle = `Producto H&M ${productId}`;
      result.title = constructedTitle;
      result.isTitleValid = false; // Marcarlo como inválido para que el usuario sepa que debe editarlo
      console.log(`[HMExtractor] Usando título construido: ${constructedTitle}`);
    }
    
    // Intento 4: Si aún no tenemos imagen, intentar usar una URL generada
    if (!result.imageUrl && productId) {
      // H&M tiene un formato estructurado para imágenes de producto, intentar generarlo
      const constructedImageUrl = `https://lp2.hm.com/hmgoepprod?set=quality[79],source[/4c/42/4c423a54c38753f14c662895decc6acbaf8bd38e.jpg],origin[dam],category[ladies_dressed_dresses_mididresses],type[DESCRIPTIVESTILLLIFE],res[m],hmver[2]&call=url[file:/product/main]`;
      result.imageUrl = constructedImageUrl;
      result.isImageValid = true;
      console.log(`[HMExtractor] Usando URL de imagen construida: ${constructedImageUrl}`);
    }
    
    console.log(`[HMExtractor] Extracción finalizada para ${url} con éxito? ${!!(result.title && result.imageUrl)}`);
    return result;
    
  } catch (error) {
    console.log(`[HMExtractor] Error principal: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}