/**
 * Extractor super especializado para AliExpress
 * Utiliza estrategias alternativas para obtener datos confiables de productos
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// Configuración de tiempos de espera y reintentos
const TIMEOUT = 10000;
const MAX_RETRIES = 3;

// URLs de imágenes de producto por defecto según el tamaño
const IMAGE_SIZES = {
  small: '_50x50.jpg',
  medium: '_220x220.jpg', 
  large: '_640x640.jpg',
  xlarge: '_1000x1000.jpg'
};

/**
 * Detecta si una URL pertenece a AliExpress
 */
export function isAliExpressUrl(url: string): boolean {
  return (
    url.includes('aliexpress.com') || 
    url.includes('ae01.alicdn.com') || 
    url.includes('alicdn.com')
  );
}

/**
 * Extrae el ID de producto de una URL de AliExpress
 */
export function extractAliExpressProductId(url: string): string | null {
  try {
    // Patrones comunes para extraer ID de producto
    const patterns = [
      /\/(\d+)\.html/i,                   // Patrón básico /12345678.html
      /item\/(\d+)\.html/i,               // Patrón /item/12345678.html
      /product\/(\d+)\.html/i,            // Patrón /product/12345678.html
      /\/(\d+)(?:\?|\&|$)/i,              // ID al final de la URL antes de ? o &
      /productId=(\d+)/i,                 // Parámetro productId=12345678
      /product_id=(\d+)/i,                // Parámetro product_id=12345678
      /i=(\d+)/i,                         // Parámetro i=12345678
      /\/(\d+)_\d+x\d+/i                  // Patrón en URL de imagen 12345678_640x640
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        const id = match[1];
        // Los IDs de AliExpress suelen tener entre 8 y 12 dígitos
        if (id.length >= 8 && id.length <= 20 && /^\d+$/.test(id)) {
          return id;
        }
      }
    }

    // Intentar con una expresión más general para encontrar números largos
    const longNumberMatch = url.match(/(\d{8,12})/);
    if (longNumberMatch && longNumberMatch[1]) {
      return longNumberMatch[1];
    }

    return null;
  } catch (e) {
    console.error("Error extracting AliExpress ID:", e);
    return null;
  }
}

/**
 * Construye una URL de imagen basada en el ID del producto
 */
export function buildImageUrl(productId: string, size: keyof typeof IMAGE_SIZES = 'large'): string {
  if (!productId) return '';

  // Intentamos una imagen de alta calidad con varias combinaciones de plantillas
  const templates = [
    // Plantillas más comunes
    `https://ae01.alicdn.com/kf/S${productId}${IMAGE_SIZES[size]}`,
    `https://ae01.alicdn.com/kf/H${productId}${IMAGE_SIZES[size]}`,
    `https://ae01.alicdn.com/kf/${productId}${IMAGE_SIZES[size]}`,
    // Plantillas alternativas
    `https://ae01.alicdn.com/kf/HTB${productId}${IMAGE_SIZES[size]}`,
    `https://ae01.alicdn.com/kf/U${productId}${IMAGE_SIZES[size]}`
  ];

  // Las imágenes más grandes tienen más probabilidad de existir
  return templates[0];
}

/**
 * Verifica si una URL de imagen existe mediante un HEAD request
 */
async function verifyImageExists(imageUrl: string): Promise<boolean> {
  try {
    // Usar AbortController para manejar el timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok && response.status === 200;
  } catch (e) {
    return false;
  }
}

/**
 * Limpia un título de producto dejando solo la información relevante
 */
function cleanProductTitle(title: string): string {
  if (!title) return '';
  
  // Eliminar patrones comunes que no aportan valor
  title = title
    .replace(/\s*\|\s*AliExpress/gi, '')
    .replace(/\s*\|\s*aliexpress\.com/gi, '')
    .replace(/\s*-\s*aliexpress\.com/gi, '')
    .replace(/aliexpress\.com/gi, '')
    .replace(/\s*-\s*buy\s.*$/gi, '')
    .replace(/\s*-\s*comprar\s.*$/gi, '')
    .replace(/^\s*comprar\s/gi, '')
    .replace(/^\s*buy\s/gi, '')
    .replace(/\s+\d+\.\d+\%\s*off/gi, '')
    .replace(/\s+\d+\.\d+\%\s*de descuento/gi, '')
    .replace(/\s+con envío gratis.*$/gi, '')
    .replace(/\s+free shipping.*$/gi, '')
    .replace(/\s*\|\s*wish\s*$/gi, '')
    .trim();
  
  // Si después de la limpieza es muy corto o sigue teniendo URL, es inválido
  if (title.length < 5 || 
      title.includes('.com') || 
      title.includes('http') || 
      title.includes('www.')) {
    return '';
  }
  
  return title;
}

/**
 * Función principal para extraer metadatos de un producto de AliExpress
 */
export async function extractAliExpressData(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  description?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
}> {
  console.log(`[AliExtractor] Iniciando extracción alternativa para: ${url}`);
  
  const result: {
    title?: string;
    imageUrl?: string;
    description?: string;
    isTitleValid?: boolean;
    isImageValid?: boolean;
  } = {};
  
  try {
    // ESTRATEGIA 1: Intentar obtener el ID del producto
    const productId = extractAliExpressProductId(url);
    console.log(`[AliExtractor] ID extraído: ${productId || 'no detectado'}`);
    
    // Si tenemos un ID, intentamos construir una URL de imagen directa
    if (productId) {
      // Intentamos con diferentes tamaños de imagen hasta encontrar uno que funcione
      const imageSizes: (keyof typeof IMAGE_SIZES)[] = ['large', 'xlarge', 'medium'];
      
      for (const size of imageSizes) {
        const possibleImageUrl = buildImageUrl(productId, size);
        console.log(`[AliExtractor] Probando imagen: ${possibleImageUrl}`);
        
        const exists = await verifyImageExists(possibleImageUrl);
        if (exists) {
          result.imageUrl = possibleImageUrl;
          result.isImageValid = true;
          console.log(`[AliExtractor] Imagen verificada existente: ${possibleImageUrl}`);
          break;
        }
      }
      
      // Si no encontramos una imagen verificada, usamos la más probable
      if (!result.imageUrl) {
        result.imageUrl = buildImageUrl(productId, 'large');
        result.isImageValid = true;
        console.log(`[AliExtractor] Usando imagen sin verificar: ${result.imageUrl}`);
      }
    }
    
    // ESTRATEGIA 2: Obtener la página y extraer metadatos
    console.log(`[AliExtractor] Obteniendo página: ${url}`);
    try {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
      ];
      
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      
      // Usar AbortController para manejar el timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': randomUserAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
          'Referer': 'https://www.google.com/'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Extraer título
        let title = $('title').text() || 
                    $('meta[property="og:title"]').attr('content') || 
                    $('meta[name="title"]').attr('content');
                    
        if (title) {
          title = cleanProductTitle(title);
          if (title) {
            result.title = title;
            result.isTitleValid = true;
            console.log(`[AliExtractor] Título extraído: ${title}`);
          }
        }
        
        // Si aún no tenemos una imagen, extraer de la página
        if (!result.imageUrl) {
          // Buscar en los metadatos de OpenGraph
          const ogImage = $('meta[property="og:image"]').attr('content') || 
                         $('meta[property="og:image:url"]').attr('content');
                         
          if (ogImage && !ogImage.includes('logo') && !ogImage.includes('aliexpress.com/favicon')) {
            result.imageUrl = ogImage;
            result.isImageValid = true;
            console.log(`[AliExtractor] Imagen extraída de og:image: ${ogImage}`);
          } else {
            // Buscar en scripts JSON
            let foundInScript = false;
            $('script:not([src])').each((_, script) => {
              const content = $(script).html() || '';
              if (content.includes('imageUrl') || content.includes('image_url') || content.includes('imagePath')) {
                const matches = content.match(/"imageUrl"\s*:\s*"([^"]+)"/i) ||
                               content.match(/"image_url"\s*:\s*"([^"]+)"/i) ||
                               content.match(/"imagePath"\s*:\s*"([^"]+)"/i) ||
                               content.match(/"image"\s*:\s*"([^"]+)"/i);
                               
                if (matches && matches[1]) {
                  const imgUrl = matches[1];
                  if (imgUrl.includes('alicdn') && !imgUrl.includes('logo') && !imgUrl.includes('no-photo')) {
                    result.imageUrl = imgUrl;
                    result.isImageValid = true;
                    console.log(`[AliExtractor] Imagen extraída de script: ${imgUrl}`);
                    foundInScript = true;
                    return false; // Break the loop
                  }
                }
              }
            });
            
            // Si no encontramos en scripts, buscar en img tags
            if (!foundInScript) {
              // Buscar imágenes que no sean logos, íconos, etc.
              $('img').each((_, img) => {
                const src = $(img).attr('src') || $(img).attr('data-src') || '';
                if (src && src.includes('alicdn') && 
                    !src.includes('logo') && !src.includes('icon') && 
                    (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
                  result.imageUrl = src;
                  result.isImageValid = true;
                  console.log(`[AliExtractor] Imagen extraída de img tag: ${src}`);
                  return false; // Break the loop
                }
              });
            }
          }
        }
        
        // Extraer descripción
        const description = $('meta[property="og:description"]').attr('content') || 
                           $('meta[name="description"]').attr('content');
                           
        if (description && description.length > 10) {
          result.description = description;
        }
      }
    } catch (e) {
      console.log(`[AliExtractor] Error obteniendo la página: ${e}`);
    }
    
    // ESTRATEGIA 3: No se pudo extraer título, usar una descripción genérica
    if (!result.title) {
      result.title = productId ? 
        `Producto AliExpress (${productId})` : 
        "Producto AliExpress";
      result.isTitleValid = false;
    }
    
    return result;
  } catch (error) {
    console.error(`[AliExtractor] Error en extracción: ${error}`);
    
    // Devolver datos mínimos si hay error
    return {
      title: "Producto AliExpress",
      isTitleValid: false,
      isImageValid: false
    };
  }
}