import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';

// Interfaz para los metadatos que extraemos
export interface MetadataResult {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
}

/**
 * Extrae metadatos básicos de una URL utilizando Open Graph
 * Esta es una versión inicial simplificada para reemplazar el sistema de scraping anterior
 */
export async function extractOpenGraphData(url: string): Promise<MetadataResult> {
  console.log(`🔍 Extrayendo metadatos Open Graph para: ${url}`);
  
  const DEFAULT_RESULT: MetadataResult = {
    title: '',
    description: '',
    imageUrl: '',
    price: ''
  };
  
  try {
    // Configurar cabeceras para simular un navegador
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Configurar un timeout razonable
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
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
      return DEFAULT_RESULT;
    }
    
    const html = await response.text();
    
    // Extraer metadatos Open Graph
    const result = { ...DEFAULT_RESULT };
    
    // Título: Primero Open Graph, luego meta title, finalmente title tag
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaTitleMatch = html.match(/<meta[^>]*name=["']title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const titleTagMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    
    if (ogTitleMatch && ogTitleMatch[1]) {
      result.title = ogTitleMatch[1].trim();
    } else if (metaTitleMatch && metaTitleMatch[1]) {
      result.title = metaTitleMatch[1].trim();
    } else if (titleTagMatch && titleTagMatch[1]) {
      result.title = titleTagMatch[1].trim();
    }
    
    // Descripción: Primero Open Graph, luego meta description
    const ogDescriptionMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaDescriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    if (ogDescriptionMatch && ogDescriptionMatch[1]) {
      result.description = ogDescriptionMatch[1].trim();
    } else if (metaDescriptionMatch && metaDescriptionMatch[1]) {
      result.description = metaDescriptionMatch[1].trim();
    }
    
    // Imagen: Primero Open Graph, luego meta image
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    const metaImageMatch = html.match(/<meta[^>]*name=["']image["'][^>]*content=["']([^"']+)["'][^>]*>/i);
    
    if (ogImageMatch && ogImageMatch[1]) {
      result.imageUrl = ogImageMatch[1].trim();
    } else if (metaImageMatch && metaImageMatch[1]) {
      result.imageUrl = metaImageMatch[1].trim();
    }
    
    // Precio: Buscamos en datos estructurados
    // Método 1: Schema.org Product - Usamos una expresión regular compatible con las versiones anteriores de ES
    const schemaOrgPattern = new RegExp('<script[^>]*type=["\'](application/ld\\+json)["\'][^>]*>([\\s\\S]*?)</script>', 'i');
    const schemaOrgMatch = html.match(schemaOrgPattern);
    if (schemaOrgMatch && schemaOrgMatch[2]) { // El contenido JSON está en el segundo grupo de captura
      try {
        const jsonData = JSON.parse(schemaOrgMatch[2]);
        
        // Buscar precio en formato JSON-LD
        if (jsonData && jsonData['@type'] === 'Product' && jsonData.offers && jsonData.offers.price) {
          result.price = jsonData.offers.price.toString();
        } else if (Array.isArray(jsonData) && jsonData[0] && jsonData[0]['@type'] === 'Product') {
          // A veces viene como array
          if (jsonData[0].offers && jsonData[0].offers.price) {
            result.price = jsonData[0].offers.price.toString();
          }
        }
      } catch (e) {
        console.log('Error al parsear datos estructurados:', e);
      }
    }
    
    // Si el título contiene entidades HTML, las limpiamos
    if (result.title) {
      result.title = result.title
        .replace(/&nbsp;/g, ' ')
        .replace(/&[a-z0-9]+;/g, ' ')
        .trim();
    }
    
    console.log('✅ Metadatos Open Graph extraídos correctamente:', {
      title: result.title,
      description: result.description ? result.description.substring(0, 30) + '...' : '',
      imageUrl: result.imageUrl ? '(Imagen encontrada)' : '(Sin imagen)',
      price: result.price || '(Sin precio)'
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error al extraer metadatos Open Graph:', error);
    return DEFAULT_RESULT;
  }
}