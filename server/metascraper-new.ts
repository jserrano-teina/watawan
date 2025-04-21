import fetch from 'node-fetch';
import type { Response as NodeFetchResponse, RequestInit } from 'node-fetch';

// Función auxiliar para trabajar con node-fetch manteniendo tipos correctos
async function fetchWithCorrectTypes(url: string, options?: RequestInit): Promise<NodeFetchResponse> {
  return fetch(url, options) as Promise<NodeFetchResponse>;
}

// Activamos el modo debug para ver detalles de la extracción
const DEBUG = true;

function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[MetaScraper]", ...args);
  }
}

// Lista de User-Agents efectivos para diferentes escenarios
const USER_AGENTS = {
  // Desktop Chrome - muy efectivo para la mayoría de sitios
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  
  // Simulamos un navegador desktop más actualizado
  modernDesktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  
  // User-Agent que simula un iPhone pero desde Safari (más confiable)
  modernMobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  
  // User-Agent genérico que funciona bien con la mayoría de sitios
  generic: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// Función para obtener un User-Agent aleatorio
function getRandomUserAgent(): string {
  const agents = Object.values(USER_AGENTS);
  const randomIndex = Math.floor(Math.random() * agents.length);
  return agents[randomIndex];
}

/**
 * Extrae metadatos de una URL utilizando Open Graph tags
 * 
 * Este enfoque optimizado se basa exclusivamente en Open Graph tags que son
 * ampliamente utilizados en sitios de comercio electrónico. Esto proporciona:
 * 1. Mayor estandarización: usamos un estándar web establecido
 * 2. Mejor robustez: no dependemos de la estructura DOM específica de cada sitio
 * 3. Mejor rendimiento: proceso de extracción más rápido y directo
 * 
 * @param url - URL del producto
 * @returns Metadatos extraídos (imagen, título, descripción)
 */
export async function getUrlMetadata(url: string): Promise<{ 
  imageUrl: string | undefined, 
  price: string | undefined,
  title?: string,
  description?: string 
}> {
  try {
    debug(`Procesando URL para extraer metadatos con Open Graph: ${url}`);
    
    // Establecemos User-Agent para el proceso
    const userAgent = getRandomUserAgent();
    debug(`Usando User-Agent: ${userAgent}`);
    
    // Registrar inicio para analizar tiempos
    const startTime = Date.now();
    
    // Validar el formato de la URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      debug(`URL con formato inválido: ${url}, intentando corregir...`);
      
      // Intentar corregir URLs comunes que puedan estar mal formateadas
      if (url.startsWith('www.')) {
        url = 'https://' + url;
        debug(`URL corregida a: ${url}`);
      } else if (!url.startsWith('http')) {
        url = 'https://' + url;
        debug(`URL corregida a: ${url}`);
      }
      
      // Verificar de nuevo
      if (!urlRegex.test(url)) {
        debug(`URL sigue con formato inválido después de corrección: ${url}`);
        return { imageUrl: undefined, price: undefined };
      }
    }

    // Obtener el HTML de la página
    try {
      debug(`Obteniendo contenido para: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      debug(`Haciendo petición GET a: ${url}`);
      const response = await fetchWithCorrectTypes(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'DNT': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        debug(`No se pudo obtener el contenido de ${url}. Código de estado: ${response.status}`);
        return { imageUrl: undefined, price: undefined, title: undefined, description: undefined };
      }

      const html = await response.text();
      debug(`Contenido obtenido para ${url} (${html.length} bytes)`);
      
      // Variables para almacenar los metadatos
      let imageUrl: string | undefined;
      let title: string | undefined;
      let description: string | undefined;
      
      // Extraer datos usando etiquetas Open Graph
      
      // 1. Imagen - Open Graph
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogImageMatch && ogImageMatch[1]) {
        imageUrl = ogImageMatch[1];
        debug(`Imagen OG encontrada: ${imageUrl}`);
      }
      
      // 2. Título - Open Graph
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1].trim();
        debug(`Título OG encontrado: ${title}`);
      }
      
      // 3. Descripción - Open Graph
      const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
      if (ogDescriptionMatch && ogDescriptionMatch[1]) {
        description = ogDescriptionMatch[1].trim();
        debug(`Descripción OG encontrada: ${description}`);
      }
      
      // Fallback a metadatos estándar si no encontramos datos en OG
      
      // Fallback para título
      if (!title) {
        const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          const rawTitle = titleMatch[1].trim();
          // Verificar si el título es válido
          if (rawTitle !== '&nbsp;' && rawTitle.trim() !== '' && !rawTitle.includes('&nbsp;')) {
            title = rawTitle;
            debug(`Título extraído de etiqueta <title>: ${title}`);
          }
        }
      }
      
      // Fallback para descripción
      if (!description) {
        const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
        if (descriptionMatch && descriptionMatch[1]) {
          description = descriptionMatch[1].trim();
          debug(`Descripción extraída de meta description: ${description}`);
        }
      }
      
      // Calcular tiempo transcurrido
      const endTime = Date.now();
      const timeElapsed = (endTime - startTime) / 1000;
      debug(`Tiempo de extracción: ${timeElapsed.toFixed(2)} segundos`);
      
      // Retornar los datos extraídos
      // Nota: price siempre será undefined con este nuevo enfoque
      return { 
        imageUrl, 
        price: undefined, 
        title, 
        description 
      };
    } catch (error) {
      debug(`Error al extraer metadatos: ${error}`);
      return { 
        imageUrl: undefined, 
        price: undefined, 
        title: undefined, 
        description: undefined 
      };
    }
  } catch (error) {
    debug(`Error en getUrlMetadata: ${error}`);
    return { 
      imageUrl: undefined, 
      price: undefined, 
      title: undefined, 
      description: undefined 
    };
  }
}