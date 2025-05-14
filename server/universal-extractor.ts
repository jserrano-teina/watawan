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
    
    // PLAN A: Extracción rápida (timeout de 2 segundos)
    const PLAN_A_TIMEOUT = 2000;
    
    const planAPromise = extractLightweight(url);
    const timeoutPromise = new Promise<Partial<ProductMetadata>>((resolve) => 
      setTimeout(() => {
        console.log(`⏱️ Timeout de Plan A (${PLAN_A_TIMEOUT}ms) alcanzado`);
        resolve({});
      }, PLAN_A_TIMEOUT)
    );
    
    const planAResult = await Promise.race([planAPromise, timeoutPromise]);
    
    // Verificar si Plan A logró extraer todos los datos necesarios
    if (isDataComplete(planAResult)) {
      const endTime = Date.now();
      console.log(`✅ Plan A exitoso en ${endTime - startTime}ms, datos completos extraídos`);
      return createResponseObject(planAResult);
    }
    
    console.log(`⚠️ Plan A incompleto, falta: ${getMissingFields(planAResult).join(', ')}`);
    
    // PLAN B: Extracción avanzada con navegador
    console.log(`🚀 Iniciando Plan B (Puppeteer + OpenAI)`);
    
    // Intentar primero con Puppeteer solo
    const puppeteerResult = await extractWithPuppeteer(url);
    
    // Combinar resultados de Plan A y Puppeteer
    const combinedResult = {
      ...planAResult,
      ...puppeteerResult
    };
    
    // Si aún faltan datos, usar OpenAI Vision como último recurso
    if (!isDataComplete(combinedResult)) {
      console.log(`🤖 Datos todavía incompletos, activando OpenAI Vision`);
      const visionResult = await extractWithOpenAIVision(url);
      
      // Fusionar todos los resultados, priorizando los métodos más específicos
      const finalResult = {
        ...visionResult,
        ...puppeteerResult,
        ...planAResult
      };
      
      return createResponseObject(finalResult);
    }
    
    return createResponseObject(combinedResult);
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
    
    // Importar Puppeteer de forma dinámica
    const puppeteer = await import('puppeteer');
    
    // Lanzar navegador en modo headless
    const browser = await puppeteer.default.launch({
      headless: true,
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
        '[property="og:image"]'
      ];
      
      for (const selector of imageSelectors) {
        const imgElement = document.querySelector(selector) as HTMLImageElement;
        if (imgElement) {
          // Intentar diferentes atributos
          data.imageUrl = imgElement.src || 
                         imgElement.getAttribute('data-src') || 
                         imgElement.getAttribute('data-lazy-src') ||
                         imgElement.getAttribute('data-zoom-image') || '';
          
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
    
    // Lanzar navegador
    const browser = await puppeteer.default.launch({
      headless: true,
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
      
      return {
        title: metadata.title,
        description: metadata.description,
        imageUrl: metadata.imageUrl,
        price: metadata.price
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