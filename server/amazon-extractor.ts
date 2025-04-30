/**
 * Extractor especializado para productos de Amazon
 * Implementa múltiples estrategias para extraer metadatos de productos
 * cuando los métodos estándar fallan en entorno de producción
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';

// User-Agents optimizados para extraer datos de Amazon
const AMAZON_USER_AGENTS = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  amazon: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Amazon/1.0'
};

// Configuración de tiempo de espera para peticiones
const TIMEOUT = 5000;

// Base de datos local de productos conocidos
// Permite tener información fiable para productos populares sin depender de la extracción en tiempo real
interface KnownProduct {
  title: string;
  imageUrl: string;
}

// Base de datos local de productos de Amazon conocidos por ASIN
const PRODUCT_DATABASE: Record<string, KnownProduct> = {
  // Fire TV y Echo
  'B0CJKTWTVT': {
    title: "Amazon Fire TV Stick 4K (Última generación), Dispositivo de streaming compatible con Wi-Fi 6, Dolby Vision, Dolby Atmos y HDR10+",
    imageUrl: 'https://m.media-amazon.com/images/I/61FqKNVCixL._AC_SL1500_.jpg'
  },
  'B0BCGVCY9V': {
    title: "Fire TV Stick | Dispositivo de streaming HD con control por voz Alexa",
    imageUrl: 'https://m.media-amazon.com/images/I/51cO8Y2+KtL._AC_SL1000_.jpg'
  },
  'B09BPCZJ7B': {
    title: "Amazon Fire TV Stick 4K Max, Dispositivo de streaming, Compatible con Wi-Fi 6, Control por voz Alexa",
    imageUrl: 'https://m.media-amazon.com/images/I/41Y5jS-bsjL._AC_SL1000_.jpg'
  },
  'B085G5BHM9': {
    title: "Echo Dot (4.ª generación) | Altavoz inteligente con Alexa | Antracita",
    imageUrl: 'https://m.media-amazon.com/images/I/71JB6hM6Z6L._AC_SL1000_.jpg'
  },
  'B0BJ7XVCCP': {
    title: "Echo Dot (5.ª generación, modelo de 2022) | Altavoz inteligente con Alexa | Antracita",
    imageUrl: 'https://m.media-amazon.com/images/I/61xdkHaj-HL._AC_SL1000_.jpg'
  },
  
  // Apple
  'B07PZR3PVB': {
    title: "Apple AirPods (2nd Generation) MV7N2ZM/A - Auriculares (Inalámbrico, Dentro de oído, Binaural, Intraaural, Blanco)",
    imageUrl: 'https://m.media-amazon.com/images/I/71NTi82uBEL._AC_SL1500_.jpg'
  },
  'B0BDJH3V3Q': {
    title: "Apple AirPods Pro (2.ª generación) con Carcasa MagSafe",
    imageUrl: 'https://m.media-amazon.com/images/I/61SUj2aKoEL._AC_SL1500_.jpg'
  },
  'B0CHX1K2ZC': {
    title: "Apple iPhone 15 Pro Max (256 GB) - Titanio azul",
    imageUrl: 'https://m.media-amazon.com/images/I/81TMsn0JwDL._AC_SL1500_.jpg'
  },
  'B08L5WHFT9': {
    title: "Apple iPhone 12 Pro Max (128 GB) - Grafito",
    imageUrl: 'https://m.media-amazon.com/images/I/71IkeW1u1FL._AC_SL1500_.jpg'
  },
  'B0CHY5WLB7': {
    title: "Apple Watch Series 9 GPS 41mm Caja de Aluminio en Azul Medianoche - Correa Deportiva Medianoche",
    imageUrl: 'https://m.media-amazon.com/images/I/719LaBbothL._AC_SL1500_.jpg'
  },
  
  // Kindle
  'B09SWTMW3H': {
    title: "Kindle Paperwhite (16 GB) – Ahora con una pantalla de 6,8\" y luz cálida ajustable, con publicidad",
    imageUrl: 'https://m.media-amazon.com/images/I/514+qrRQ2dL._AC_SL1500_.jpg'
  },
  'B0B1LC7YPM': {
    title: "Nuevo Kindle (modelo 2022): El más ligero y compacto, ahora con pantalla de alta resolución de 300 ppp",
    imageUrl: 'https://m.media-amazon.com/images/I/61LL2V9m3bL._AC_SL1500_.jpg'
  },
  
  // Smartphones y wearables
  'B0CFVY3742': {
    title: "Samsung Galaxy S24 Ultra, Smartphone, Android, 512GB, Titanio Gris (Versión Española)",
    imageUrl: 'https://m.media-amazon.com/images/I/71LbcO5XT-L._AC_SL1500_.jpg'
  },
  'B09JL6J7F4': {
    title: "KUXIU Reloj Inteligente Hombre Mujer, 1.7'' Smartwatch con Llamadas Bluetooth, 112 Modos Deportivos, Pulsómetro, Monitor de Sueño, Oxímetro, IP68 Impermeable Reloj Deportivo para Android iOS",
    imageUrl: 'https://m.media-amazon.com/images/I/71MJbf+mMIL._AC_SL1500_.jpg'
  },
  'B09JQKBQSB': {
    title: "BIAOQINBO Reloj Inteligente Hombre Mujer, 1.85'' Smartwatch con Llamada Bluetooth, 112 Modos Deportivos, Pulsómetro, Monitor de Sueño, IP68 Impermeable Reloj Deportivo para Android iOS",
    imageUrl: 'https://m.media-amazon.com/images/I/71+D+JkPNDL._AC_SL1500_.jpg'
  },
  
  // Consolas de videojuegos
  'B0CHJF5LH6': {
    title: "Sony PlayStation 5 Slim Digital Edition - Consola de sobremesa, Almacenamiento SSD de 1TB, sin disco, Color Blanco",
    imageUrl: 'https://m.media-amazon.com/images/I/51cEQQDTR1L._AC_SL1500_.jpg'
  },
  'B0BBN3WZ66': {
    title: "Xbox Series X - Consola Xbox Series X - Standard Edition",
    imageUrl: 'https://m.media-amazon.com/images/I/61-QQsOZIKL._AC_SL1500_.jpg'
  }
};

// Tipos de funciones de fetching
type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  timeout?: number;
  redirect?: 'follow' | 'error' | 'manual';
  signal?: AbortSignal;
};

// Función segura para obtener datos con timeout
async function safeFetch(url: string, options: FetchOptions = {}): Promise<NodeFetchResponse | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || TIMEOUT);
    
    const signal = options.signal || controller.signal;
    
    const response = await fetch(url, {
      ...options,
      signal
    });
    
    clearTimeout(timeoutId);
    
    return response;
  } catch (error) {
    console.log(`[AmazonExtractor] Error en fetch para ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

// Extraer ASIN de una URL de Amazon
export function extractAsin(url: string): string | null {
  // Patrones para detectar ASIN en diferentes formatos de URL de Amazon
  const asinPatterns = [
    /\/dp\/([A-Z0-9]{10})(?:\/|\?|$)/i,
    /\/gp\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
    /\/product\/([A-Z0-9]{10})(?:\/|\?|$)/i,
    /\/(B[0-9A-Z]{9})(?:\/|\?|$)/i,
    /(?:\/|\?)ASIN=([A-Z0-9]{10})(?:\/|\?|&|$)/i
  ];
  
  for (const pattern of asinPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }
  
  return null;
}

// Expandir URLs cortas de Amazon (amzn.to, a.co)
export async function expandShortUrl(url: string): Promise<string> {
  if (!url.match(/amzn\.(to|eu)/i) && !url.match(/a\.co\//i)) {
    return url;
  }
  
  console.log(`[AmazonExtractor] Expandiendo URL corta: ${url}`);
  
  try {
    const response = await safeFetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': AMAZON_USER_AGENTS.desktop,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    
    if (response && response.url && response.url !== url) {
      console.log(`[AmazonExtractor] URL expandida a: ${response.url}`);
      return response.url;
    }
  } catch (error) {
    console.log(`[AmazonExtractor] Error expandiendo URL: ${error}`);
  }
  
  return url;
}

// Comprueba si la URL es de Amazon
export function isAmazonUrl(url: string): boolean {
  return !!url.match(/amazon\.(com|es|co\.uk|de|fr|it|co\.jp|ca|com\.mx|nl|se|pl|au|in)/i);
}

// Obtener información de un producto conocido si está en nuestra base de datos
export function getKnownProduct(asin: string): KnownProduct | null {
  return PRODUCT_DATABASE[asin] || null;
}

// Construir URL de imagen para un ASIN de Amazon
export function getAmazonImageFromAsin(asin: string): string {
  // Las URLs de Amazon requieren un ID de imagen antes del ASIN
  // Usamos un ID genérico "61JfGcU75ML" que funciona bien con varios productos
  return `https://m.media-amazon.com/images/I/61JfGcU75ML.${asin}._AC_SL1500_.jpg`;
}

// Generar título genérico basado en ASIN cuando no hay otra información
export function generateGenericTitle(asin: string): string {
  return `Producto Amazon (${asin})`;
}

// Extraer metadatos completos para una URL de Amazon
export async function extractAmazonMetadata(url: string, clientUserAgent?: string): Promise<{ 
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
}> {
  console.log(`[AmazonExtractor] Iniciando extracción para: ${url}`);
  
  try {
    // Paso 1: Expandir URL si es corta
    const expandedUrl = await expandShortUrl(url);
    
    // Paso 2: Extraer ASIN
    const asin = extractAsin(expandedUrl);
    console.log(`[AmazonExtractor] ASIN extraído: ${asin || 'no encontrado'}`);
    
    // Resultados iniciales
    const result: { 
      title?: string;
      imageUrl?: string;
      price?: string;
      description?: string;
    } = {};
    
    // Paso 3: Verificar si es un producto conocido en nuestra base de datos
    if (asin && PRODUCT_DATABASE[asin]) {
      console.log(`[AmazonExtractor] Producto encontrado en base de datos local: ${asin}`);
      const knownProduct = PRODUCT_DATABASE[asin];
      result.title = knownProduct.title;
      result.imageUrl = knownProduct.imageUrl;
    } 
    // Paso 4: Si no tenemos datos en nuestra base, intentar extraer de la página
    else if (asin) {
      try {
        // Intentar extraer información desde la URL usando diferentes User-Agents
        console.log(`[AmazonExtractor] Producto no en base de datos, intentando extracción directa`);
        
        // Configurar cabeceras con un User-Agent de escritorio para mejor compatibilidad
        const headers = {
          'User-Agent': AMAZON_USER_AGENTS.desktop,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Upgrade-Insecure-Requests': '1'
        };
        
        // Intentar obtener la página de Amazon
        const response = await safeFetch(expandedUrl, {
          method: 'GET',
          headers,
          timeout: 3000 // Timeout corto para no bloquear mucho tiempo
        });
        
        if (response && response.ok) {
          const html = await response.text();
          
          // Buscar el título del producto
          const titlePatterns = [
            /<span id="productTitle"[^>]*>([^<]+)<\/span>/i,
            /<h1[^>]*id="title"[^>]*>([^<]+)<\/h1>/i,
            /"productTitle":"([^"]+)"/i,
            /<title>([^<]+)<\/title>/
          ];
          
          for (const pattern of titlePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              result.title = match[1].trim();
              console.log(`[AmazonExtractor] Título extraído de HTML: ${result.title}`);
              break;
            }
          }
          
          // Buscar la imagen del producto
          const imagePatterns = [
            /\\"large\\":\\"(https:\/\/[^"\\]+)\\"/i,
            /"large":"(https:\/\/[^"]+)"/i,
            /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
            /<img[^>]*data-old-hires="([^"]+)"/i,
            /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/i
          ];
          
          for (const pattern of imagePatterns) {
            const match = html.match(pattern);
            if (match && match[1]) {
              result.imageUrl = match[1].replace(/\\/g, '');
              console.log(`[AmazonExtractor] Imagen extraída de HTML: ${result.imageUrl}`);
              break;
            }
          }
        }
      } catch (extractionError) {
        console.log(`[AmazonExtractor] Error en extracción directa: ${extractionError}`);
      }
      
      // Si después de intentar extraer aún no tenemos datos, usar fallbacks
      
      // Fallback para imagen
      if (!result.imageUrl) {
        result.imageUrl = getAmazonImageFromAsin(asin);
        console.log(`[AmazonExtractor] Usando URL de imagen generada como fallback: ${result.imageUrl}`);
      }
      
      // Fallback para título
      if (!result.title) {
        result.title = generateGenericTitle(asin);
        console.log(`[AmazonExtractor] Usando título genérico como fallback: ${result.title}`);
      }
    }
    
    console.log(`[AmazonExtractor] Extracción completada: ${result.title ? 'título ✓' : 'título ✗'} | ${result.imageUrl ? 'imagen ✓' : 'imagen ✗'}`);
    
    return result;
  } catch (error) {
    console.error(`[AmazonExtractor] Error en extracción: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}