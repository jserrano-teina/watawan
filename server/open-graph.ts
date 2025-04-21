import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';

// Interfaz para los metadatos que extraemos
export interface MetadataResult {
  title: string;
  description: string;
  imageUrl: string;
  price: string; // Siempre vacío según nuevas especificaciones
}

/**
 * Extrae metadatos básicos de una URL utilizando Open Graph
 * Versión actualizada conforme a nuevas especificaciones: 
 * - Solo completar automáticamente imagen y título
 * - Nunca completar el precio (será ingresado por el usuario)
 * - Usar exclusivamente Open Graph para la extracción
 */
export async function extractOpenGraphData(url: string): Promise<MetadataResult> {
  console.log(`🔍 Extrayendo metadatos Open Graph para: ${url}`);
  
  const DEFAULT_RESULT: MetadataResult = {
    title: '',
    description: '',
    imageUrl: '',
    price: '' // Siempre vacío por especificación
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
    
    // Ya no buscamos precio - el usuario lo introducirá manualmente
    // El precio siempre queda vacío
    result.price = '';
    
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
      price: '(Entrada manual por el usuario)'
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error al extraer metadatos Open Graph:', error);
    return DEFAULT_RESULT;
  }
}