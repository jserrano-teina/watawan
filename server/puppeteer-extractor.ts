/**
 * Extractor de metadatos de productos usando Puppeteer
 * Utiliza un navegador headless para obtener información de productos,
 * especialmente útil para sitios con protecciones anti-scraping
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { extractAsin } from './amazon-extractor';
import { getKnownProduct } from './amazon-extractor';

// Cache para evitar iniciar múltiples instancias del navegador
let browserInstance: Browser | null = null;

// Timeout para cerrar el navegador después de un período de inactividad
let browserCloseTimeout: NodeJS.Timeout | null = null;

/**
 * Función para obtener o crear una instancia de navegador
 */
async function getBrowser(): Promise<Browser> {
  if (browserInstance) {
    // Si ya tenemos una instancia, cancelar el timeout de cierre
    if (browserCloseTimeout) {
      clearTimeout(browserCloseTimeout);
      browserCloseTimeout = null;
    }
    return browserInstance;
  }

  console.log('[PuppeteerExtractor] Iniciando navegador headless...');
  
  // Configuración para entornos como Replit
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
    headless: true
  });
  
  browserInstance = browser;
  console.log('[PuppeteerExtractor] Navegador iniciado correctamente');
  
  return browser;
}

/**
 * Programa el cierre del navegador después de un período de inactividad
 */
function scheduleBrowserClose() {
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
  }
  
  // Cerrar después de 5 minutos de inactividad
  browserCloseTimeout = setTimeout(async () => {
    if (browserInstance) {
      console.log('[PuppeteerExtractor] Cerrando navegador por inactividad');
      await browserInstance.close();
      browserInstance = null;
    }
  }, 5 * 60 * 1000);
}

/**
 * Extrae metadatos de un producto de Amazon usando Puppeteer
 */
export async function extractAmazonMetadataWithPuppeteer(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
}> {
  // Primero verificamos si tenemos el producto en nuestra base de datos local
  const asin = extractAsin(url);
  if (asin) {
    const knownProduct = getKnownProduct(asin);
    if (knownProduct) {
      console.log(`[PuppeteerExtractor] Producto encontrado en base de datos local: ${asin}`);
      return {
        title: knownProduct.title,
        imageUrl: knownProduct.imageUrl
      };
    }
  }

  console.log(`[PuppeteerExtractor] Extrayendo metadatos para: ${url}`);
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Configurar un timeout razonable
    page.setDefaultNavigationTimeout(30000);
    
    // Imitar un navegador normal
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    // Configurar cabeceras adicionales
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });
    
    // Interceptar y bloquear recursos que no necesitamos para acelerar el proceso
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (
        resourceType === 'image' || 
        resourceType === 'stylesheet' || 
        resourceType === 'font' ||
        resourceType === 'media'
      ) {
        // Permitir imágenes solo si contienen la URL del producto principal
        if (resourceType === 'image' && request.url().includes('/images/I/')) {
          request.continue();
        } else {
          request.abort();
        }
      } else {
        request.continue();
      }
    });
    
    console.log(`[PuppeteerExtractor] Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Esperar un poco para que cargue el contenido dinámico
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extraer los datos
    const result = await extractProductDataFromPage(page, url);
    
    console.log(`[PuppeteerExtractor] Extracción completada: ${result.title ? '✓' : '✗'}`);
    
    // Cerrar la página para liberar recursos
    await page.close();
    
    // Programar el cierre del navegador después de un período de inactividad
    scheduleBrowserClose();
    
    return result;
  } catch (error) {
    console.error(`[PuppeteerExtractor] Error: ${error instanceof Error ? error.message : String(error)}`);
    // Programar el cierre del navegador en caso de error
    scheduleBrowserClose();
    
    // Retornar un objeto vacío en caso de error
    return {};
  }
}

/**
 * Extrae los datos de producto de la página actual
 */
async function extractProductDataFromPage(page: Page, url: string): Promise<{
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
}> {
  const result: {
    title?: string;
    imageUrl?: string;
    price?: string;
    description?: string;
  } = {};

  // Detectar el tipo de sitio
  if (url.includes('amazon')) {
    // Extraer título - múltiples selectores para mayor robustez
    const titleResult = await page.evaluate(() => {
      const selectors = [
        '#productTitle',
        '#title',
        '.product-title-word-break',
        '.a-size-large.product-title-word-break'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      
      // Si no encontramos el título con los selectores, intentar con el título de la página
      const title = document.title;
      if (title) {
        // Limpiar el título de la página (quitar "Amazon.com: " o similar)
        return title.split(':').slice(1).join(':').trim() || title;
      }
      
      return undefined;
    });
    
    result.title = titleResult;
    
    if (result.title) {
      console.log(`[PuppeteerExtractor] Título extraído: ${result.title}`);
    }
    
    // Extraer imagen - múltiples selectores para mayor robustez
    const imageUrlResult = await page.evaluate(() => {
      // Lista de selectores para encontrar la imagen principal
      const imageSelectors = [
        '#landingImage',
        '#imgBlkFront',
        '#ebooksImgBlkFront',
        'img.a-dynamic-image',
        '#main-image',
        '#imgTagWrapperId img'
      ];
      
      for (const selector of imageSelectors) {
        const img = document.querySelector(selector) as HTMLImageElement;
        if (img && img.src) {
          // Para imágenes con data-old-hires o data-a-dynamic-image
          const hiResUrl = img.getAttribute('data-old-hires') || 
                          img.getAttribute('data-a-dynamic-image');
          
          if (hiResUrl) {
            // Si es un JSON string (formato de data-a-dynamic-image)
            if (hiResUrl.startsWith('{')) {
              try {
                const parsed = JSON.parse(hiResUrl);
                const urls = Object.keys(parsed);
                if (urls.length > 0) {
                  return urls[0]; // Primer URL, generalmente la de mayor resolución
                }
              } catch (e) {
                // Si hay error de parseo, usar src normal
              }
            } else {
              return hiResUrl; // Usar data-old-hires directamente
            }
          }
          
          return img.src; // Fallback a src normal
        }
      }
      
      // Si no encontramos con los selectores específicos, buscar cualquier imagen relevante
      const images = Array.from(document.querySelectorAll('img'));
      const productImage = images.find(img => 
        img.src && 
        img.src.includes('/images/I/') && 
        img.width > 200 &&
        img.height > 200
      );
      
      return productImage ? productImage.src : undefined;
    });
    
    result.imageUrl = imageUrlResult;
    
    if (result.imageUrl) {
      console.log(`[PuppeteerExtractor] Imagen extraída: ${result.imageUrl}`);
    }
    
    // Extraer precio (opcional)
    const priceResult = await page.evaluate(() => {
      const priceSelectors = [
        '.a-price .a-offscreen',
        '#priceblock_ourprice',
        '#priceblock_dealprice',
        '.a-price',
        '.a-color-price'
      ];
      
      for (const selector of priceSelectors) {
        const element = document.querySelector(selector);
        if (element && element.textContent) {
          return element.textContent.trim();
        }
      }
      
      return undefined;
    });
    
    result.price = priceResult;
  }
  
  return result;
}

/**
 * Extrae metadatos de cualquier URL utilizando Puppeteer
 * Función general que puede ser extendida para otros sitios
 */
export async function extractMetadataWithPuppeteer(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
}> {
  if (url.includes('amazon')) {
    return extractAmazonMetadataWithPuppeteer(url);
  }
  
  // Implementación general para otros sitios
  // (similar a la de Amazon pero con selectores más genéricos)
  
  console.log(`[PuppeteerExtractor] Extrayendo metadatos genéricos para: ${url}`);
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Configuraciones similares a las de Amazon
    page.setDefaultNavigationTimeout(30000);
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15');
    
    console.log(`[PuppeteerExtractor] Navegando a: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    
    // Esperar para que cargue el contenido
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extraer metadatos generales
    const result = await page.evaluate(() => {
      const data: {
        title?: string;
        imageUrl?: string;
        description?: string;
      } = {};
      
      // Título: primero meta tags, luego h1, luego title
      const metaTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                        document.querySelector('meta[name="twitter:title"]')?.getAttribute('content');
      
      const h1Title = document.querySelector('h1')?.textContent?.trim();
      const pageTitle = document.title;
      
      data.title = metaTitle || h1Title || pageTitle || '';
      
      // Imagen: primero meta tags, luego imágenes grandes
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
      const twitterImage = document.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
      
      if (ogImage) {
        data.imageUrl = ogImage;
      } else if (twitterImage) {
        data.imageUrl = twitterImage;
      } else {
        // Si no hay imagen en meta tags, buscar la imagen más grande en la página
        const images = Array.from(document.querySelectorAll('img'));
        let bestImage: HTMLImageElement | null = null;
        let bestImageArea = 0;
        
        for (const img of images) {
          // Ignorar logos e iconos que suelen ser pequeños
          if (img.width > 100 && img.height > 100) {
            const area = img.width * img.height;
            if (area > bestImageArea) {
              bestImageArea = area;
              bestImage = img;
            }
          }
        }
        
        if (bestImage) {
          data.imageUrl = bestImage.src;
        }
      }
      
      // Descripción
      const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content');
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content');
      
      data.description = ogDescription || metaDescription || '';
      
      return data;
    });
    
    console.log(`[PuppeteerExtractor] Extracción genérica completada: ${result.title ? '✓' : '✗'}`);
    
    // Cerrar la página
    await page.close();
    
    // Programar el cierre del navegador
    scheduleBrowserClose();
    
    return result;
  } catch (error) {
    console.error(`[PuppeteerExtractor] Error en extracción genérica: ${error instanceof Error ? error.message : String(error)}`);
    scheduleBrowserClose();
    return {};
  }
}

/**
 * Cierra explícitamente el navegador, útil para shutdown limpio de la aplicación
 */
export async function closePuppeteerBrowser() {
  if (browserCloseTimeout) {
    clearTimeout(browserCloseTimeout);
    browserCloseTimeout = null;
  }
  
  if (browserInstance) {
    console.log('[PuppeteerExtractor] Cerrando navegador explícitamente');
    await browserInstance.close();
    browserInstance = null;
  }
}