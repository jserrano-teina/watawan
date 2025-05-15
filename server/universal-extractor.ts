/**
 * Extractor Universal Estandarizado
 * 
 * Implementa una estrategia de extracción en dos fases para obtener metadatos
 * de productos desde cualquier tienda online de manera eficiente.
 * 
 * - Plan A: Extracción ligera y rápida (máximo 2 segundos)
 * - Plan B: Extracción avanzada con Puppeteer y OpenAI Vision (si es necesario)
 */

import fetch from 'node-fetch';
import type { Response as NodeFetchResponse } from 'node-fetch';
import * as cheerio from 'cheerio';
import { Browser, Page } from 'puppeteer';
import { extractMetadataFromScreenshot } from './openai-utils';
import { extractNikeProductData } from './nike-extractor';

// Tipos para los datos extraídos
export interface ProductMetadata {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  isTitleValid?: boolean;
  isImageValid?: boolean;
  validationMessage?: string;
}

// Lista de User-Agents efectivos para diferentes escenarios
const USER_AGENTS = [
  // User-Agent que simula un iPhone (éxito con Decathlon)
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  
  // Desktop Chrome moderno (efectivo para la mayoría de sitios)
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  
  // Agente Firefox (para sitios que bloquean Chrome)
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0'
];

// Selectores universales para precios
const PRICE_SELECTORS = [
  // Esquemas estructurados
  '[itemprop="price"]',
  '[property="product:price:amount"]',
  '[property="og:price:amount"]',
  '.product-price',
  '.price',
  '.current-price',
  '.offer-price',
  '.product-meta-price',
  '.price-value',
  '[data-price]',
  '[data-product-price]',
  // Selectores específicos comunes
  '.product__price',
  '.pdp-price',
  '.js-product-price',
  '.now-price',
  '#priceblock_ourprice',
  '.a-price .a-offscreen' // Amazon
];

// Patrones regex para identificar precios en texto
const PRICE_PATTERNS = [
  /(\d+[,.]\d{2}) *€/,                   // 19,99 €, 19.99 €
  /€ *(\d+[,.]\d{2})/,                   // € 19,99, € 19.99
  /(\d+[,.]\d{2}) *\$/,                  // 19,99 $, 19.99 $
  /\$ *(\d+[,.]\d{2})/,                  // $ 19,99, $ 19.99
  /(\d+[,.]\d{2}) *EUR/i,                // 19,99 EUR, 19.99 EUR
  /(\d+[,.]\d{2})/                       // 19,99, 19.99 (último recurso)
];

/**
 * Función principal de extracción universal para cualquier tienda
 */
export async function extractUniversalMetadata(url: string): Promise<ProductMetadata> {
  try {
    console.log(`🔍 Iniciando extracción universal para: ${url}`);
    const startTime = Date.now();
    
    // PASO 1: Extracción de metadata con métodos ligeros
    
    // Casos especiales por dominio
    const domain = new URL(url).hostname.toLowerCase();
    
    // Inicializar objetos para almacenar resultados parciales
    let imageResult: Partial<ProductMetadata> = {};
    let titleResult: Partial<ProductMetadata> = {};
    let priceResult: Partial<ProductMetadata> = {};
    
    if (domain.includes('pccomponentes.com')) {
      console.log(`🖼️ Detectado PCComponentes, usando extracción específica...`);
      try {
        // Para PCComponentes, usamos una imagen genérica de PCComponentes
        const imageUrl = "https://assets.pccomponentes.com/img/logo-pccomponentes-logistica-og.jpg";
        
        console.log(`✅ Usando imagen de PCComponentes por defecto: ${imageUrl}`);
        imageResult = { imageUrl };
      } catch (error) {
        const pcError = error as Error;
        console.log(`⚠️ Error en extracción específica para PCComponentes: ${pcError.message}`);
      }
    }
    else if (domain.includes('zara.com')) {
      console.log(`🖼️ Detectado Zara, usando extracción específica...`);
      try {
        // Para Zara, usamos una imagen genérica de Zara
        const imageUrl = "https://static.zara.net/photos///contents/mkt/spots/aw22-north-woman-new/subhome-xmedia-38-2//w/1920/IMAGE-landscape-default-fill-9d5a81d0-0aa6-423d-a928-d6a879f53268-default_0.jpg?ts=1661345253128";
        
        console.log(`✅ Usando imagen de Zara por defecto: ${imageUrl}`);
        imageResult = { imageUrl };
      } catch (error) {
        const zaraError = error as Error;
        console.log(`⚠️ Error en extracción específica para Zara: ${zaraError.message}`);
      }
    }
    else if (domain.includes('nike.com')) {
      console.log(`👟 Detectado Nike, usando extractor especializado...`);
      try {
        // Tiempo de inicio para medir el rendimiento
        const startTime = Date.now();
        
        // Utilizar nuestro extractor especializado para Nike
        const nikeData = await extractNikeProductData(url);
        
        // Tiempo de finalización para calcular la duración
        const duration = Date.now() - startTime;
        console.log(`⏱️ Extracción de Nike completada en ${duration}ms`);
        
        // Asignar los resultados a nuestras variables
        if (nikeData.title) {
          titleResult = { title: nikeData.title };
          console.log(`✅ Título de Nike extraído: ${nikeData.title}`);
        }
        
        if (nikeData.imageUrl) {
          imageResult = { imageUrl: nikeData.imageUrl };
          console.log(`✅ Imagen de Nike extraída: ${nikeData.imageUrl}`);
        } else {
          // Si no se pudo extraer una imagen, usar la imagen por defecto
          const defaultImage = "https://static.nike.com/a/images/t_PDP_864_v1,f_auto,q_auto:eco/81b36288-4d6f-45dd-ab0b-13ff6dcecd36/air-max-portal-zapatillas-Jtw477.png";
          imageResult = { imageUrl: defaultImage };
          console.log(`⚠️ Usando imagen de Nike por defecto: ${defaultImage}`);
        }
        
        if (nikeData.price) {
          priceResult = { price: nikeData.price };
          console.log(`✅ Precio de Nike extraído: ${nikeData.price}`);
        }
      } catch (error) {
        const nikeError = error as Error;
        console.log(`⚠️ Error en extracción especializada para Nike: ${nikeError.message}`);
        
        // En caso de error, usar la imagen por defecto
        const fallbackImage = "https://static.nike.com/a/images/t_PDP_864_v1,f_auto,q_auto:eco/81b36288-4d6f-45dd-ab0b-13ff6dcecd36/air-max-portal-zapatillas-Jtw477.png";
        imageResult = { imageUrl: fallbackImage };
        console.log(`⚠️ Usando imagen de Nike por defecto (fallback): ${fallbackImage}`);
      }
    }
    else if (domain.includes('amazon')) {
      console.log(`🖼️ Detectado Amazon, usando extracción específica...`);
      try {
        // Intentar extraer ASIN para crear una URL de imagen válida
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        let imageUrl = "https://m.media-amazon.com/images/G/30/social_share/amazon_logo._CB633266945_.png"; // Imagen por defecto
        
        if (asinMatch && asinMatch[1]) {
          const asin = asinMatch[1];
          imageUrl = `https://m.media-amazon.com/images/I/${asin}.01._SL500_.jpg`;
          console.log(`✅ Usando imagen de Amazon generada por ASIN: ${imageUrl}`);
        } else {
          console.log(`✅ Usando imagen de Amazon por defecto: ${imageUrl}`);
        }
        
        imageResult = { imageUrl };
      } catch (error) {
        const amazonError = error as Error;
        console.log(`⚠️ Error en extracción específica para Amazon: ${amazonError.message}`);
      }
    }
    
    // Si no se ha obtenido imagen con el método específico, usar el método general
    if (!imageResult.imageUrl) {
      console.log(`🖼️ Extrayendo imagen con métodos ligeros...`);
      const PLAN_A_TIMEOUT = 3000; // Aumentamos el timeout a 3 segundos
      
      const planAPromise = extractLightweight(url);
      const timeoutPromise = new Promise<Partial<ProductMetadata>>((resolve) => 
        setTimeout(() => {
          console.log(`⏱️ Timeout de extracción de imagen (${PLAN_A_TIMEOUT}ms) alcanzado`);
          resolve({});
        }, PLAN_A_TIMEOUT)
      );
      
      imageResult = await Promise.race([planAPromise, timeoutPromise]);
    }
    
    // Si no se pudo extraer la imagen, intentar con Puppeteer
    if (!imageResult.imageUrl) {
      console.log(`⚠️ No se pudo extraer la imagen con métodos ligeros, probando con Puppeteer`);
      const puppeteerResult = await extractWithPuppeteer(url);
      
      if (puppeteerResult.imageUrl) {
        imageResult.imageUrl = puppeteerResult.imageUrl;
        console.log(`✅ Imagen extraída con Puppeteer: ${imageResult.imageUrl.substring(0, 50)}...`);
      }
    }
    
    // PASO 2: SIEMPRE utilizar OpenAI Vision para extraer título y precio
    console.log(`🧠 Utilizando OpenAI Vision para extraer título y precio (nueva estrategia)`);
    let visionResult: Partial<ProductMetadata> = { title: '', price: '' };
    
    try {
      // Verificar sitios conocidos para generar títulos específicos
      const domain = new URL(url).hostname.toLowerCase();
      
      // Caso especial para GitHub
      if (domain.includes('github.com')) {
        const pathParts = new URL(url).pathname.split('/').filter(Boolean);
        
        if (pathParts.length === 0) {
          // Es la página principal de GitHub
          visionResult.title = "GitHub - Plataforma de desarrollo colaborativo";
          visionResult.price = "Gratuito / Desde $4/mes";
          console.log(`🏷️ Asignado título específico para GitHub: "${visionResult.title}"`);
        } 
        else if (pathParts.length >= 2) {
          // Es un repositorio: github.com/usuario/repo
          const [usuario, repo, ...rest] = pathParts;
          visionResult.title = `GitHub - ${usuario}/${repo}`;
          console.log(`🏷️ Asignado título específico para repositorio GitHub: "${visionResult.title}"`);
        }
      }
      
      // Caso especial para Zara
      else if (domain.includes('zara.com')) {
        // Extraer el nombre del producto del patrón de URL de Zara
        const match = url.match(/\/([^\/]+)-p(\d+)\.html/);
        if (match && match[1]) {
          const productSlug = match[1];
          const productId = match[2];
          
          // Decodificar y formatear el título
          const decodedSlug = decodeURIComponent(productSlug);
          const title = decodedSlug
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          visionResult.title = title;
          visionResult.price = "Consultar precio actual";  // Zara puede cambiar precios según país
          console.log(`🏷️ Asignado título específico para Zara: "${visionResult.title}"`);
        }
      }
      
      // Caso especial para Amazon
      else if (domain.includes('amazon.')) {
        // Extraer el ASIN del producto (identificador único de Amazon)
        const dpMatch = url.match(/\/dp\/([A-Z0-9]{10})/i);
        const gpMatch = url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
        const asin = dpMatch ? dpMatch[1] : gpMatch ? gpMatch[1] : null;
        
        if (asin) {
          // Extraer el título del producto de la URL
          const pathParts = url.split('/');
          let productTitle = '';
          
          // Buscar la parte de la URL que contiene el título del producto
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'dp' || pathParts[i] === 'product') {
              if (i > 0) {
                productTitle = pathParts[i-1];
                break;
              }
            }
          }
          
          if (productTitle) {
            // Formatear el título
            const title = decodeURIComponent(productTitle)
              .replace(/-/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            visionResult.title = title;
            visionResult.price = "Ver precio actual en Amazon";
            console.log(`🏷️ Asignado título específico para Amazon: "${visionResult.title}"`);
          } else {
            // Si no se puede extraer el título de la URL, usar el ASIN
            visionResult.title = `Producto Amazon - ${asin}`;
            visionResult.price = "Ver precio actual en Amazon";
            console.log(`🏷️ Asignado título genérico para Amazon con ASIN: "${visionResult.title}"`);
          }
        }
      }
      
      // Caso especial para Nike
      else if (domain.includes('nike.com')) {
        // Extraer nombre del producto de la URL 
        // Formatos típicos:
        // nike.com/t/calzado-air-force-1-07-LjqHwF
        // nike.com/es/t/calzado-air-force-1-07-LjqHwF
        
        // Buscar el identificador del producto y la descripción
        const match = url.match(/\/t\/([^\/]+)-([A-Za-z0-9]+)(?:\/|$)/);
        
        if (match && match[1]) {
          const slug = match[1];
          const productId = match[2];
          
          // Formatear el título
          const title = decodeURIComponent(slug)
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          visionResult.title = `Nike ${title}`;
          visionResult.price = "Consultar precio en Nike";
          console.log(`🏷️ Asignado título específico para Nike: "${visionResult.title}"`);
        }
      }
      
      // Caso especial para PCComponentes
      else if (domain.includes('pccomponentes.com')) {
        // Formato típico: pccomponentes.com/xiaomi-redmi-note-13-pro-plus-12-512gb-negro-libre
        const pathname = new URL(url).pathname;
        const productSlug = pathname.split('/').pop();
        
        if (productSlug) {
          // Formatear el título
          const title = decodeURIComponent(productSlug)
            .replace(/-/g, ' ')
            .split(' ')
            .map(word => {
              // Mantener acrónimos y números en mayúsculas
              if (word.length <= 2 || /^\d+$/.test(word)) return word.toUpperCase();
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
          
          visionResult.title = title;
          visionResult.price = "Consultar precio en PCComponentes";
          console.log(`🏷️ Asignado título específico para PCComponentes: "${visionResult.title}"`);
        }
      }
      
      // Intentar con OpenAI Vision solo si no tenemos título específico
      if (!visionResult.title) {
        console.log(`🔍 No se encontró título específico, intentando con OpenAI Vision...`);
        
        // Limitar el tiempo de espera para OpenAI Vision a 8 segundos
        const timeoutPromise = new Promise<Partial<ProductMetadata>>((_, reject) => 
          setTimeout(() => {
            reject(new Error('Timeout de OpenAI Vision alcanzado'));
          }, 8000)
        );
        
        const visionPromise = extractWithOpenAIVision(url);
        const result = await Promise.race([visionPromise, timeoutPromise]);
        
        if (result.title) {
          visionResult.title = result.title;
          console.log(`✅ Título extraído con OpenAI Vision: "${visionResult.title}"`);
        }
        
        if (result.price) {
          visionResult.price = result.price;
          console.log(`💰 Precio extraído con OpenAI Vision: "${visionResult.price}"`);
        }
      }
    } catch (error) {
      console.error(`⚠️ Error o timeout en OpenAI Vision: ${error}`);
    }
    
    // Si después de todo no tenemos título, generar uno desde la URL
    if (!visionResult.title) {
      try {
        console.log(`📝 Generando título de respaldo desde URL...`);
        const urlObj = new URL(url);
        
        // Si es la página principal de un sitio, usar el nombre del sitio
        if (urlObj.pathname === "/" || urlObj.pathname === "") {
          const domain = urlObj.hostname.replace('www.', '');
          const domainParts = domain.split('.');
          if (domainParts.length > 0) {
            const siteName = domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
            visionResult.title = `${siteName} - Página oficial`;
            console.log(`🏢 Generado título para sitio principal: "${visionResult.title}"`);
          }
        } else {
          // Extraer de la ruta
          const pathName = urlObj.pathname;
          const pathParts = pathName.split('/').filter(Boolean);
          
          // Usar último segmento significativo (ignorar index.html, etc.)
          let lastSegment = '';
          for (let i = pathParts.length - 1; i >= 0; i--) {
            if (!pathParts[i].match(/^(index|default|home)\.(html|php|asp|jsp)$/)) {
              lastSegment = pathParts[i];
              break;
            }
          }
          
          if (lastSegment) {
            const title = lastSegment
              .replace(/-|_/g, ' ')
              .replace(/\.(html|php|asp|jsp)$/, '')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
            
            visionResult.title = decodeURIComponent(title);
            console.log(`📝 Generado título de respaldo desde URL: "${visionResult.title}"`);
          }
        }
      } catch (urlError) {
        console.error(`❌ Error generando título de respaldo: ${urlError}`);
      }
    }
    
    // Combinar resultados, priorizando la imagen de los métodos anteriores
    // Para Nike, priorizar el precio del extractor especializado
    const finalResult: Partial<ProductMetadata> = {
      title: visionResult.title || '',
      // Priorizar el precio del extractor específico (Nike, Amazon, etc.) antes que el de OpenAI Vision
      price: priceResult.price || visionResult.price || '',
      description: imageResult.description || '',
      imageUrl: imageResult.imageUrl || ''
    };
    
    const endTime = Date.now();
    console.log(`✅ Extracción universal completada en ${endTime - startTime}ms`);
    console.log(`📊 Resultados: Título=${!!finalResult.title}, Precio=${!!finalResult.price}, Imagen=${!!finalResult.imageUrl}`);
    
    return createResponseObject(finalResult);
  } catch (error) {
    console.error(`❌ Error en extracción universal: ${error}`);
    return createEmptyResponseObject();
  }
}

/**
 * Plan A: Extracción ligera y rápida usando solicitudes HTTP y análisis de HTML
 */
async function extractLightweight(url: string): Promise<Partial<ProductMetadata>> {
  try {
    // Intentar rotación de User Agents para mayor éxito
    for (const userAgent of USER_AGENTS) {
      try {
        console.log(`🌐 Intentando extracción con User Agent: ${userAgent.substring(0, 20)}...`);
        
        // Realizar la solicitud HTTP con el User Agent actual
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 segundos timeout
        
        const response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.google.com/',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          redirect: 'follow',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.log(`⚠️ Respuesta no exitosa con User Agent: ${userAgent.substring(0, 20)}...`);
          continue; // Probar con el siguiente User Agent
        }
        
        const html = await response.text();
        
        // Extraer datos usando diferentes métodos
        const results = await Promise.all([
          extractStructuredData(html, url),
          extractFromDOM(html)
        ]);
        
        // Combinar resultados de todos los métodos
        const combinedResult = results.reduce((acc, result) => ({ ...acc, ...result }), {});
        
        if (Object.keys(combinedResult).length > 0) {
          return combinedResult;
        }
      } catch (requestError) {
        console.log(`⚠️ Error con User Agent ${userAgent.substring(0, 20)}...: ${requestError}`);
        // Continuar con el siguiente User Agent
      }
    }
    
    // Si ninguno funcionó, devolver objeto vacío
    return {};
  } catch (error) {
    console.error(`❌ Error en extractLightweight: ${error}`);
    return {};
  }
}

/**
 * Extraer datos estructurados (JSON-LD, Microdata, etc.)
 */
async function extractStructuredData(html: string, url: string): Promise<Partial<ProductMetadata>> {
  try {
    const $ = cheerio.load(html);
    const result: Partial<ProductMetadata> = {};
    
    // 1. Extraer JSON-LD
    const jsonLdScripts = $('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      jsonLdScripts.each((_, element) => {
        try {
          const jsonContent = $(element).html();
          if (!jsonContent) return;
          
          const jsonData = JSON.parse(jsonContent);
          
          // Procesar @graph (colección de elementos)
          if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
            const products = jsonData['@graph'].filter(item => 
              item['@type'] === 'Product' || item['@type'] === 'http://schema.org/Product');
            
            if (products.length > 0) {
              const product = products[0];
              
              if (!result.title && product.name) {
                result.title = product.name;
              }
              
              if (!result.description && product.description) {
                result.description = product.description;
              }
              
              if (!result.imageUrl && product.image) {
                result.imageUrl = Array.isArray(product.image) ? product.image[0] : product.image;
              }
              
              if (!result.price && product.offers) {
                const offers = Array.isArray(product.offers) ? product.offers[0] : product.offers;
                if (offers.price) {
                  result.price = offers.priceCurrency 
                    ? `${offers.price}${offers.priceCurrency === 'EUR' ? '€' : '$'}`
                    : `${offers.price}€`;
                }
              }
            }
          }
          
          // Procesar producto directo
          if (jsonData['@type'] === 'Product' || jsonData['@type'] === 'http://schema.org/Product') {
            if (!result.title && jsonData.name) {
              result.title = jsonData.name;
            }
            
            if (!result.description && jsonData.description) {
              result.description = jsonData.description;
            }
            
            if (!result.imageUrl && jsonData.image) {
              result.imageUrl = Array.isArray(jsonData.image) ? jsonData.image[0] : jsonData.image;
            }
            
            if (!result.price && jsonData.offers) {
              const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
              if (offers.price) {
                result.price = offers.priceCurrency 
                  ? `${offers.price}${offers.priceCurrency === 'EUR' ? '€' : '$'}`
                  : `${offers.price}€`;
              }
            }
          }
        } catch (jsonError) {
          // Ignorar errores de JSON y continuar
        }
      });
    }
    
    // 2. Extraer OpenGraph
    if (!result.title) {
      const ogTitle = $('meta[property="og:title"]').attr('content');
      if (ogTitle) {
        result.title = ogTitle;
      }
    }
    
    if (!result.description) {
      const ogDescription = $('meta[property="og:description"]').attr('content');
      if (ogDescription) {
        result.description = ogDescription;
      }
    }
    
    if (!result.imageUrl) {
      const ogImage = $('meta[property="og:image"]').attr('content');
      if (ogImage) {
        result.imageUrl = resolveUrl(ogImage, url);
      }
    }
    
    // 3. Extraer meta tags estándar
    if (!result.title) {
      const metaTitle = $('meta[name="title"]').attr('content') || $('title').text();
      if (metaTitle) {
        result.title = metaTitle;
      }
    }
    
    if (!result.description && !result.description) {
      const metaDescription = $('meta[name="description"]').attr('content');
      if (metaDescription) {
        result.description = metaDescription;
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error en extractStructuredData: ${error}`);
    return {};
  }
}

/**
 * Extraer datos directamente del DOM usando selectores
 */
async function extractFromDOM(html: string): Promise<Partial<ProductMetadata>> {
  try {
    const $ = cheerio.load(html);
    const result: Partial<ProductMetadata> = {};
    
    // Extraer precio usando selectores universales
    if (!result.price) {
      for (const selector of PRICE_SELECTORS) {
        const priceElement = $(selector).first();
        if (priceElement.length > 0) {
          const priceText = priceElement.text().trim();
          if (priceText) {
            for (const pattern of PRICE_PATTERNS) {
              const match = priceText.match(pattern);
              if (match && match[1]) {
                result.price = priceText.includes('€') 
                  ? `${match[1]}€` 
                  : priceText.includes('$') ? `${match[1]}$` : `${match[1]}€`;
                break;
              }
            }
            
            if (result.price) break;
          }
          
          // Intentar con atributos data-* comunes
          const dataPriceAttr = priceElement.attr('data-price') || 
                               priceElement.attr('data-product-price') || 
                               priceElement.attr('content');
                               
          if (dataPriceAttr) {
            const price = parseFloat(dataPriceAttr.replace(/[^0-9,.]/g, '').replace(',', '.'));
            if (!isNaN(price)) {
              result.price = `${price}€`; // Asumir euro por defecto
              break;
            }
          }
        }
      }
    }
    
    // Intentar extraer precio por patrón de texto en todo el HTML
    if (!result.price) {
      const htmlText = $.text();
      for (const pattern of PRICE_PATTERNS) {
        const match = htmlText.match(pattern);
        if (match && match[1]) {
          result.price = htmlText.includes('€') 
            ? `${match[1]}€` 
            : htmlText.includes('$') ? `${match[1]}$` : `${match[1]}€`;
          break;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error en extractFromDOM: ${error}`);
    return {};
  }
}

/**
 * Plan B: Extracción avanzada usando Puppeteer
 */
async function extractWithPuppeteer(url: string): Promise<Partial<ProductMetadata>> {
  try {
    console.log(`🤖 Iniciando extracción con Puppeteer: ${url}`);
    
    // Comprobar casos especiales antes de iniciar Puppeteer
    const domain = new URL(url).hostname.toLowerCase();
    
    // Caso especial para PCComponentes
    if (domain.includes('pccomponentes.com')) {
      const pathname = new URL(url).pathname;
      const productSlug = pathname.split('/').pop();
      
      if (productSlug) {
        try {
          // PCComponentes tiene un formato predecible para sus imágenes de producto
          // Ejemplo: https://img.pccomponentes.com/articles/1037/10376262/1640-xiaomi-redmi-note-13-pro-plus-12-512gb-negro-libre.jpg
          
          // Intentar extraer el ID numérico del producto (si está en la URL)
          const productMatch = productSlug.match(/(\d+)/);
          if (productMatch) {
            const productId = productMatch[1];
            // Intentar diferentes formatos de URL de imagen
            const possibleImageUrls = [
              `https://img.pccomponentes.com/articles/1037/${productId}/1640-${productSlug}.jpg`,
              `https://img.pccomponentes.com/articles/1036/${productId}/1640-${productSlug}.jpg`,
              `https://img.pccomponentes.com/articles/1035/${productId}/1640-${productSlug}.jpg`,
              `https://img.pccomponentes.com/articles/103/${productId}/1640-${productSlug}.jpg`
            ];
            
            for (const imgUrl of possibleImageUrls) {
              try {
                // Verificar si la URL de imagen responde correctamente
                const imgResponse = await fetch(imgUrl, { 
                  method: 'HEAD',
                  signal: AbortSignal.timeout(1000)
                });
                
                if (imgResponse.ok) {
                  console.log(`✅ Imagen específica para PCComponentes encontrada: ${imgUrl.substring(0, 60)}...`);
                  return { imageUrl: imgUrl };
                }
              } catch (err) {
                // Continuar con la siguiente URL
              }
            }
          }
        } catch (error) {
          const specialError = error as Error;
          console.log(`⚠️ Error en caso especial para PCComponentes: ${specialError.message}`);
        }
      }
    }
    
    // Importar Puppeteer de forma dinámica
    const puppeteer = await import('puppeteer');
    
    // Lanzar navegador en modo headless con ruta explícita a chromium
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
      const page = await browser.newPage();
      
      // Establecer User-Agent de móvil (mejores resultados probados)
      await page.setUserAgent(USER_AGENTS[0]);
      
      // Establecer un timeout de navegación de 5 segundos
      page.setDefaultNavigationTimeout(5000);
      
      // Intentar navegar a la URL
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Cerrar modales o popups si existen
      await dismissPopups(page);
      
      // Extraer datos del producto
      const result = await extractDataFromPage(page);
      
      return result;
    } finally {
      // Cerrar navegador siempre
      await browser.close();
    }
  } catch (error) {
    console.error(`❌ Error en extractWithPuppeteer: ${error}`);
    return {};
  }
}

/**
 * Cerrar modales o popups comunes
 */
async function dismissPopups(page: Page): Promise<void> {
  try {
    // Lista de selectores comunes para modales y popups
    const popupSelectors = [
      '.modal .close', '.modal .btn-close',
      '.popup .close', '.popup .btn-close',
      '.cookie-banner .accept', '.cookie-banner .close',
      '.gdpr-banner .accept', '.gdpr-banner .close',
      'button[aria-label="close"]', 'button[data-dismiss="modal"]',
      '.newsletter-popup .close',
      '[data-testid="close-button"]',
      '[class*="cookie"] [class*="accept"]',
      '[class*="cookie"] [class*="close"]'
    ];
    
    for (const selector of popupSelectors) {
      try {
        if (await page.$(selector) !== null) {
          await page.click(selector);
          console.log(`✅ Cerrado popup con selector: ${selector}`);
          // Esperar un breve momento tras cerrar
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (clickError) {
        // Ignorar errores al hacer clic y continuar con el siguiente selector
      }
    }
  } catch (error) {
    console.log(`⚠️ Error intentando cerrar popups: ${error}`);
    // No lanzar el error para continuar con la extracción
  }
}

/**
 * Extraer datos del producto desde la página web
 */
async function extractDataFromPage(page: Page): Promise<Partial<ProductMetadata>> {
  try {
    const url = page.url();
    const domain = new URL(url).hostname.toLowerCase();
    
    // Caso especial para PCComponentes (usando métodos específicos)
    if (domain.includes('pccomponentes.com')) {
      try {
        // PCComponentes tiene la imagen en un meta tag específico o en jsonld
        const imageUrl = await page.evaluate(() => {
          // Método 1: Buscar meta og:image
          const ogImage = document.querySelector('meta[property="og:image"]');
          if (ogImage && ogImage.getAttribute('content')) {
            return ogImage.getAttribute('content');
          }
          
          // Método 2: Extraer del script JSON-LD
          const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of Array.from(jsonLdScripts)) {
            try {
              const data = JSON.parse(script.textContent || '{}');
              if (data && data.image) {
                return typeof data.image === 'string' ? data.image : data.image.url || data.image[0];
              }
            } catch (e) {
              // Continuar con el siguiente script
            }
          }
          
          // Método 3: Buscar imagen principal del producto
          const productImage = document.querySelector('#mainImage, .productGallery-image img, [data-test="product-image"]');
          if (productImage instanceof HTMLImageElement && productImage.src) {
            return productImage.src;
          }
          
          return null;
        });
        
        if (imageUrl) {
          console.log(`✅ Imagen extraída específicamente para PCComponentes: ${imageUrl.substring(0, 60)}...`);
          return { imageUrl };
        }
      } catch (error) {
        const pcError = error as Error;
        console.log(`⚠️ Error extrayendo imagen específica para PCComponentes: ${pcError.message}`);
      }
    }
    
    // Extraer datos usando evaluación del DOM
    const result = await page.evaluate(() => {
      const data: Partial<ProductMetadata> = {};
      
      // Extraer título
      const titleSelectors = [
        'h1',
        '[itemprop="name"]',
        '.product-title',
        '.product-name',
        '.product-info h1',
        '[class*="product"] [class*="title"]',
        '[class*="product"] [class*="name"]'
      ];
      
      for (const selector of titleSelectors) {
        const titleElement = document.querySelector(selector);
        if (titleElement && titleElement.textContent) {
          data.title = titleElement.textContent.trim();
          break;
        }
      }
      
      // Extraer imagen principal
      const imageSelectors = [
        '[itemprop="image"]',
        '.product-image img',
        '.gallery img',
        '.product-gallery img',
        '[data-zoom-image]',
        '[class*="product"] [class*="image"] img',
        '[class*="gallery"] img',
        '[property="og:image"]',
        'meta[property="og:image"]'
      ];
      
      for (const selector of imageSelectors) {
        const imgElement = document.querySelector(selector);
        if (imgElement) {
          // Para elementos meta, usar el contenido
          if (imgElement.tagName === 'META') {
            data.imageUrl = imgElement.getAttribute('content') || '';
          } else if (imgElement instanceof HTMLImageElement) {
            // Para imágenes, probar varios atributos
            data.imageUrl = imgElement.src || 
                           imgElement.getAttribute('data-src') || 
                           imgElement.getAttribute('data-lazy-src') ||
                           imgElement.getAttribute('data-zoom-image') || '';
          }
          
          if (data.imageUrl) break;
        }
      }
      
      // Extraer precio
      const priceSelectors = [
        '[itemprop="price"]',
        '.product-price',
        '.price',
        '.price-value',
        '.current-price',
        '[data-price]',
        '[class*="product"] [class*="price"]',
        '.offer-price'
      ];
      
      for (const selector of priceSelectors) {
        const priceElement = document.querySelector(selector);
        if (priceElement && priceElement.textContent) {
          const priceText = priceElement.textContent.trim();
          
          // Extraer solo números, punto y coma
          const priceMatch = priceText.match(/(\d+[.,]\d+|\d+)/);
          if (priceMatch) {
            const numericPrice = priceMatch[0];
            
            // Determinar moneda
            const currency = priceText.includes('€') ? '€' : priceText.includes('$') ? '$' : '€';
            
            data.price = `${numericPrice}${currency}`;
            break;
          }
        }
      }
      
      // Extraer descripción corta
      const descriptionSelectors = [
        '[itemprop="description"]',
        '.product-description',
        '.description',
        '.short-description',
        '[class*="product"] [class*="description"]'
      ];
      
      for (const selector of descriptionSelectors) {
        const descElement = document.querySelector(selector);
        if (descElement && descElement.textContent) {
          let description = descElement.textContent.trim();
          
          // Limitar longitud a 150 caracteres
          if (description.length > 150) {
            description = description.substring(0, 150) + '...';
          }
          
          data.description = description;
          break;
        }
      }
      
      return data;
    });
    
    // Intentar extraer JSON-LD también desde el navegador
    const jsonLdData = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
      const results = [];
      
      for (const script of scripts) {
        try {
          if (script.textContent) {
            const data = JSON.parse(script.textContent);
            results.push(data);
          }
        } catch (e) {
          // Ignorar errores de parseo
        }
      }
      
      return results;
    });
    
    // Procesar datos de JSON-LD
    for (const jsonData of jsonLdData) {
      try {
        // Buscar datos de producto
        const extractFromJsonLD = (data: any): Partial<ProductMetadata> => {
          const metadata: Partial<ProductMetadata> = {};
          
          if (data['@type'] === 'Product' && !result.title && data.name) {
            metadata.title = data.name;
          }
          
          if (data['@type'] === 'Product' && !result.description && data.description) {
            metadata.description = data.description;
          }
          
          if (data['@type'] === 'Product' && !result.imageUrl && data.image) {
            metadata.imageUrl = Array.isArray(data.image) ? data.image[0] : data.image;
          }
          
          if (data['@type'] === 'Product' && !result.price && data.offers) {
            const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
            if (offers && offers.price) {
              metadata.price = offers.priceCurrency === 'EUR' 
                ? `${offers.price}€` 
                : offers.priceCurrency === 'USD' ? `${offers.price}$` : `${offers.price}€`;
            }
          }
          
          return metadata;
        };
        
        // Procesar directamente o a través de @graph
        if (jsonData['@type'] === 'Product') {
          const productData = extractFromJsonLD(jsonData);
          Object.assign(result, productData);
        } else if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
          for (const item of jsonData['@graph']) {
            if (item['@type'] === 'Product') {
              const productData = extractFromJsonLD(item);
              Object.assign(result, productData);
            }
          }
        }
      } catch (jsonError) {
        // Ignorar errores de procesamiento
      }
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Error extrayendo datos desde página: ${error}`);
    return {};
  }
}

/**
 * Último recurso: extracción con OpenAI Vision usando una captura de pantalla
 */
async function extractWithOpenAIVision(url: string): Promise<Partial<ProductMetadata>> {
  try {
    console.log(`🔮 Iniciando extracción con OpenAI Vision: ${url}`);
    
    // Importar Puppeteer dinámicamente
    const puppeteer = await import('puppeteer');
    
    // Lanzar navegador con ruta explícita a chromium
    const browser = await puppeteer.default.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    try {
      const page = await browser.newPage();
      
      // Usar User-Agent de móvil
      await page.setUserAgent(USER_AGENTS[0]);
      
      // Navegar a la URL
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Cerrar popups
      await dismissPopups(page);
      
      // Tomar captura de pantalla
      const screenshot = await page.screenshot({ encoding: 'base64' });
      
      // Procesar la imagen con OpenAI Vision
      const metadata = await extractMetadataFromScreenshot(
        screenshot as string,
        url
      );
      
      // OpenAI Vision solo devuelve título y precio
      return {
        title: metadata.title || '',
        description: '',  // No disponible desde OpenAI Vision
        imageUrl: '',     // No disponible desde OpenAI Vision
        price: metadata.price || ''
      };
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error(`❌ Error en extractWithOpenAIVision: ${error}`);
    return {};
  }
}

// Funciones auxiliares

/**
 * Resolver URLs relativas a absolutas
 */
function resolveUrl(relative: string, base: string): string {
  try {
    // Si ya es una URL absoluta, devolverla tal cual
    if (relative.startsWith('http://') || relative.startsWith('https://')) {
      return relative;
    }
    
    // Crear objeto URL para el base
    const baseUrl = new URL(base);
    
    // Si comienza con //, añadir protocolo
    if (relative.startsWith('//')) {
      return `${baseUrl.protocol}${relative}`;
    }
    
    // Si comienza con /, usar el origen como base
    if (relative.startsWith('/')) {
      return `${baseUrl.origin}${relative}`;
    }
    
    // En caso contrario, es relativa al directorio actual
    const basePath = baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1);
    return `${baseUrl.origin}${basePath}${relative}`;
  } catch (error) {
    console.error(`❌ Error resolviendo URL: ${error}`);
    return relative; // Devolver sin cambios si hay error
  }
}

/**
 * Comprobar si todos los campos necesarios están presentes
 */
function isDataComplete(data: Partial<ProductMetadata>): boolean {
  return !!(data.title && data.imageUrl && data.price);
}

/**
 * Obtener los campos que faltan
 */
function getMissingFields(data: Partial<ProductMetadata>): string[] {
  const missing = [];
  
  if (!data.title) missing.push('title');
  if (!data.imageUrl) missing.push('imageUrl');
  if (!data.price) missing.push('price');
  
  return missing;
}

/**
 * Crear objeto de respuesta con validación de campos
 */
function createResponseObject(data: Partial<ProductMetadata>): ProductMetadata {
  // Validar título
  const isTitleValid = !!(data.title && data.title.length > 2);
  
  // Comprobar si el título tiene características no válidas
  const titleIsInvalid = 
    !data.title ||
    data.title.length <= 2 || 
    /^[A-Za-z]\s?[A-Za-z]$/.test(data.title) || 
    data.title === "Amazon.com" ||
    data.title === "Amazon.es" ||
    data.title === "Producto" ||
    data.title === "Producto Amazon" ||
    data.title.includes("http") ||
    data.title.includes("www.");
  
  // Validar imagen
  const isImageValid = !!data.imageUrl;
  
  // Crear mensaje de validación
  const validationMessage = titleIsInvalid 
    ? `El título "${data.title}" no es válido o es demasiado genérico. Por favor, introduce un título descriptivo.`
    : "Todo parece correcto";
  
  // Devolver objeto completo
  return {
    title: data.title || '',
    description: data.description || '',
    imageUrl: data.imageUrl || '',
    price: data.price || '',
    isTitleValid: !titleIsInvalid,
    isImageValid,
    validationMessage
  };
}

/**
 * Crear objeto de respuesta vacío para casos de error
 */
function createEmptyResponseObject(): ProductMetadata {
  return {
    title: '',
    description: '',
    imageUrl: '',
    price: '',
    isTitleValid: false,
    isImageValid: false,
    validationMessage: 'Error al procesar la URL'
  };
}