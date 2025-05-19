/**
 * Implementación de extracción multi-regional para productos de Amazon
 * Diseñado para funcionar tanto en desarrollo como en producción
 */

import fetch, { Response as NodeFetchResponse } from 'node-fetch';
import { cleanAmazonTitle, decodeHTMLEntities } from './amazon-extractor';

// Función segura para obtener datos con múltiples reintentos
async function safeFetch(url: string, options: any = {}): Promise<NodeFetchResponse | null> {
  // Número máximo de intentos
  const MAX_RETRIES = 2;
  const TIMEOUT = 5000;
  
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
        console.log(`[AmazonMultiRegional] Intento ${attempt + 1} falló con código: ${response.status}`);
      }
    } catch (error) {
      console.log(`[AmazonMultiRegional] Error en fetch para ${url} (intento ${attempt + 1}): ${error instanceof Error ? error.message : String(error)}`);
      
      if (attempt < MAX_RETRIES - 1) {
        const waitTime = Math.pow(2, attempt) * 500;
        console.log(`[AmazonMultiRegional] Esperando ${waitTime}ms antes del siguiente intento...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  return null;
}

// Función mejorada para extraer datos de Amazon usando múltiples dominios regionales
export async function getMultiRegionalAmazonData(asin: string): Promise<{ 
  title?: string;
  imageUrl?: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
} | null> {
  const domains = ['amazon.es', 'amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.it'];
  const result: { 
    title?: string;
    imageUrl?: string;
    isTitleValid?: boolean;
    isImageValid?: boolean;
  } = {};
  
  // User-Agents rotatorios para evitar bloqueos
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36 Edg/123.0.0.0'
  ];
  
  // Referrers para simular tráfico desde motores de búsqueda
  const referrers = [
    'https://www.google.com/',
    'https://www.bing.com/',
    'https://www.google.es/',
    'https://duckduckgo.com/'
  ];
  
  for (const domain of domains) {
    console.log(`[AmazonMultiRegional] Intentando obtener datos de ${domain} para ASIN ${asin}`);
    const url = `https://www.${domain}/dp/${asin}`;
    
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    const randomReferrer = referrers[Math.floor(Math.random() * referrers.length)];
    
    try {
      // Configurar cabeceras para evadir anti-bot
      const headers = {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'DNT': '1',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Referer': randomReferrer
      };
      
      const response = await safeFetch(url, {
        method: 'GET',
        headers,
        timeout: 5000
      });
      
      if (response && response.ok) {
        const html = await response.text();
        
        // Patrones específicos para títulos en diferentes formatos de página
        const titlePatterns = [
          /<span id="productTitle"[^>]*>([^<]+)<\/span>/i,
          /<h1[^>]*id="title"[^>]*>([^<]+)<\/h1>/i,
          /"productTitle":"([^"]+)"/i,
          /"title":"([^"]+)"/i,
          /<title>([^<|:]+)(?:\:|<)/i,
          /id="productTitle"[^>]*>[\s\n]*([^<]+)[\s\n]*<\/span>/i,
          /class="a-size-large [^"]*product-title-word-break[^"]*">[\s\n]*([^<]+)[\s\n]*<\/span>/i,
          /<h1 class="a-text-normal">([^<]+)<\/h1>/i,
          /<span[^>]*class="[^"]*a-text-normal[^"]*"[^>]*>([^<]+)<\/span>/i,
          /<title>Amazon\.com\s*:\s*([^<]+)<\/title>/i
        ];
        
        // Buscar título
        for (const pattern of titlePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const possibleTitle = decodeHTMLEntities(match[1].trim());
            // Verificar que el título no es genérico o inválido
            if (possibleTitle && 
                possibleTitle.length > 5 && 
                !possibleTitle.includes('Amazon.com') && 
                !possibleTitle.includes('404') && 
                !possibleTitle.includes('not found') &&
                !possibleTitle.includes('no encontrado')) {
              result.title = cleanAmazonTitle(possibleTitle, asin);
              result.isTitleValid = true;
              console.log(`[AmazonMultiRegional] Título válido encontrado en ${domain}: ${result.title}`);
              break;
            }
          }
        }
        
        // Patrones para imágenes (expandidos)
        const imagePatterns = [
          /\\"large\\":\\"(https:\/\/[^"\\]+)\\"/i,
          /"large":"(https:\/\/[^"]+)"/i,
          /<img[^>]*id="landingImage"[^>]*src="([^"]+)"/i,
          /<img[^>]*data-old-hires="([^"]+)"/i,
          /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+\.jpg)"/i,
          /\\"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"\\]+\.jpg)\\"/i,
          /data-a-dynamic-image="{\&quot;(https:\/\/[^"]+)"/i,
          /id="imgTagWrapperId"[\s\S]*?<img[\s\S]*?src="([^"]+)"/i,
          /id="imgBlkFront"[\s\S]*?src="([^"]+)"/i,
          /id="main-image"[\s\S]*?src="([^"]+)"/i,
          /class="a-dynamic-image"[\s\S]*?src="([^"]+)"/i,
          /data-old-hires="(https:\/\/images-[^"]+\.jpg)"/i,
          /data-a-image-name="[^"]*"[\s\S]*?src="([^"]+\.jpg)"/i
        ];
        
        // Buscar imagen
        for (const pattern of imagePatterns) {
          const match = html.match(pattern);
          if (match && match[1]) {
            const possibleImage = match[1].replace(/\\/g, '');
            
            // Verificar que la imagen es válida (contiene el ASIN o es una imagen de Amazon)
            if (possibleImage && 
                (possibleImage.includes('amazon') || possibleImage.includes('cloudfront')) && 
                !possibleImage.includes('placeholder') && 
                (possibleImage.toLowerCase().includes('.jpg') || 
                 possibleImage.toLowerCase().includes('.png'))) {
              
              // Eliminar los parámetros de URL que limitan el tamaño
              result.imageUrl = possibleImage
                .replace(/\._[A-Z0-9_]+_\./, '.') // Eliminar modificadores de tamaño
                .replace(/&pf_rd_[^&]+/g, '')    // Eliminar parámetros de tracking
                .replace(/\?.*$/, '');           // Eliminar query string
              
              result.isImageValid = true;
              console.log(`[AmazonMultiRegional] Imagen válida encontrada en ${domain}: ${result.imageUrl}`);
              break;
            }
          }
        }
        
        // Si encontramos tanto título como imagen, podemos terminar
        if (result.title && result.imageUrl) {
          return result;
        }
      }
    } catch (error) {
      console.log(`[AmazonMultiRegional] Error obteniendo datos de ${domain}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    // Esperar un tiempo aleatorio entre intentos para evadir detección
    const waitTime = 200 + Math.floor(Math.random() * 300);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Si no tenemos ambos datos, retornar null
  if (!result.title || !result.imageUrl) {
    return null;
  }
  
  return result;
}