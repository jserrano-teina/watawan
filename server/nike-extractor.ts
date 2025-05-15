/**
 * Extractor específico para productos de Nike
 * Optimizado para garantizar alta velocidad y precisión en la extracción
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';
import * as cheerio from 'cheerio';

// Tipos de datos
export interface NikeProductData {
  title?: string;
  imageUrl?: string;
  price?: string;
  currency?: string;
  extractionMethod?: string;
}

// User agents para simulación de navegador
const USER_AGENTS = {
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  modern: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
};

/**
 * Obtiene los datos de un producto Nike a partir de su URL
 * Utiliza múltiples estrategias para maximizar la probabilidad de éxito
 */
export async function extractNikeProductData(url: string): Promise<NikeProductData> {
  console.log(`🏃‍♂️ Extrayendo datos de Nike: ${url}`);
  
  // Extraer el identificador de producto de la URL
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 0);
  const productId = pathSegments[pathSegments.length - 1];
  
  const result: NikeProductData = {
    extractionMethod: 'nike-specialized'
  };

  // Primero intentamos extraer el título del nombre del producto en la URL
  try {
    // Extraer nombre del producto de la URL (penúltimo segmento)
    if (pathSegments.length >= 2) {
      const productPath = pathSegments[pathSegments.length - 2];
      const productName = productPath
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      result.title = `Nike ${productName}`;
    }
  } catch (error) {
    console.error(`⚠️ Error al extraer título de Nike desde URL: ${error}`);
  }
  
  // Obtener el HTML de la página con un timeout y manejo de errores adecuado
  let html: string | null = null;
  try {
    console.log(`🔄 Obteniendo HTML de Nike...`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos máximo
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENTS.desktop,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      html = await response.text();
      console.log(`✅ HTML de Nike obtenido: ${html.length} bytes`);
    } else {
      console.log(`❌ Error al obtener HTML de Nike: ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`⏱️ Timeout al obtener HTML de Nike`);
    } else {
      console.error(`❌ Error en fetch de Nike: ${error}`);
    }
  }
  
  // Si tenemos HTML, intentamos extraer datos mediante varios métodos
  if (html) {
    try {
      const $ = cheerio.load(html);
      
      // MÉTODO 1: Extraer datos de JSON-LD (datos estructurados)
      try {
        $('script[type="application/ld+json"]').each((_, element) => {
          try {
            const jsonText = $(element).html();
            if (jsonText) {
              const json = JSON.parse(jsonText);
              
              // Buscar datos en formato estándar schema.org
              if (json['@type'] === 'Product') {
                // Extraer título
                if (json.name && !result.title) {
                  result.title = json.name;
                }
                
                // Extraer imagen
                if (json.image) {
                  result.imageUrl = Array.isArray(json.image) ? json.image[0] : json.image;
                }
                
                // Extraer precio
                if (json.offers) {
                  const offers = Array.isArray(json.offers) ? json.offers[0] : json.offers;
                  if (offers.price) {
                    result.price = offers.price.toString();
                    result.currency = offers.priceCurrency || 'EUR';
                  }
                }
              }
            }
          } catch (e) {
            // Ignorar errores en JSON individual
          }
        });
      } catch (error) {
        console.log(`⚠️ Error al extraer JSON-LD de Nike: ${error}`);
      }
      
      // MÉTODO 2: Extraer imagen usando selectores específicos de Nike
      if (!result.imageUrl) {
        const imageSelectors = [
          'picture img.css-1fxh9so',
          '.product-card__hero-image img',
          'img[data-testid="hero-image"]',
          'img[data-testid="product-image"]',
          '.product-card__image-container img',
          '.pdp-image img',
          '.image-component img',
          'img[width][height][alt][src*="static.nike"]'
        ];
        
        for (const selector of imageSelectors) {
          const img = $(selector).first();
          if (img.length && img.attr('src')) {
            result.imageUrl = img.attr('src') as string;
            console.log(`✅ Imagen de Nike encontrada: ${result.imageUrl}`);
            break;
          }
        }
      }
      
      // MÉTODO 3: Extraer precio mediante selectores específicos
      if (!result.price) {
        const priceSelectors = [
          '[data-testid="product-price"]',
          '.product-price',
          '.css-17swkax',
          '.product-card__price',
          '.css-b9fpep',
          '.css-1sdvmio'
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = $(selector).first();
          if (priceElement.length) {
            // Limpiar el texto de precio
            let priceText = priceElement.text().trim();
            
            // Extraer números del precio
            const priceMatch = priceText.match(/[\d\.,]+/);
            if (priceMatch) {
              // Determinar moneda según texto
              const currency = priceText.includes('€') ? '€' : 
                               priceText.includes('$') ? '$' : 
                               priceText.includes('£') ? '£' : '€';
              
              result.price = `${priceMatch[0]} ${currency}`;
              console.log(`✅ Precio de Nike encontrado: ${result.price}`);
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error al procesar HTML de Nike: ${error}`);
    }
  }
  
  // MÉTODO 4: Generar enlaces de imágenes alternativos basados en patrones conocidos de Nike
  if (!result.imageUrl && productId) {
    try {
      // Patrones de URL de imágenes de Nike conocidos
      const imagePatterns = [
        `https://static.nike.com/a/images/t_PDP_1280_v1/f_auto,q_auto:eco/${productId}/`,
        `https://static.nike.com/a/images/t_PDP_864_v1/f_auto,q_auto:eco/${productId}/`
      ];
      
      // Intentar verificar qué patrones funcionan
      for (const pattern of imagePatterns) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const response = await fetch(pattern, {
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            result.imageUrl = pattern;
            console.log(`✅ Imagen alternativa de Nike encontrada: ${pattern}`);
            break;
          }
        } catch (e) {
          // Continuar con el siguiente patrón
        }
      }
    } catch (error) {
      console.log(`⚠️ Error al verificar patrones de imagen alternativos: ${error}`);
    }
  }
  
  // Si después de todo no tenemos precio, asignar valor por defecto
  if (!result.price) {
    result.price = "Consultar precio en Nike";
  }
  
  console.log(`📊 Resultados extracción Nike: Título=${result.title || 'No encontrado'}, Imagen=${result.imageUrl ? 'Encontrada' : 'No encontrada'}, Precio=${result.price || 'No encontrado'}`);
  
  return result;
}