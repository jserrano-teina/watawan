/**
 * Extractor de metadatos de productos usando Puppeteer
 * Utiliza un navegador headless para obtener información de productos,
 * especialmente útil para sitios con protecciones anti-scraping
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { extractAsin } from './amazon-extractor';
import { getKnownProduct } from './amazon-extractor';
import { extractMetadataFromScreenshot } from './openai-utils';

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
  
  // Configuración avanzada para evadir detección en entornos como Replit
  console.log('[PuppeteerExtractor] Intentando iniciar Chromium desde: /nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium');
  
  // Lista rotativa de User-Agents para evitar detección
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
  ];
  
  // Elegir un User-Agent aleatorio
  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  console.log(`[PuppeteerExtractor] Usando User-Agent: ${randomUserAgent}`);
  
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--hide-scrollbars',
      '--mute-audio',
      '--disable-infobars',
      '--disable-breakpad',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      `--user-agent=${randomUserAgent}`,
      '--disable-blink-features=AutomationControlled' // Oculta que es automatizado
    ],
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium'
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
  
  let retryCount = 0;
  const maxRetries = 3;
  
  // Lista de user agents modernos y comunes
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  ];
  
  // URLs alternativas (Amazon regional) para intentar si falla la original
  const alternativeUrls = asin ? [
    `https://www.amazon.es/dp/${asin}`,
    `https://www.amazon.com/dp/${asin}`,
    `https://www.amazon.co.uk/dp/${asin}`,
    `https://www.amazon.de/dp/${asin}`
  ] : [];
  
  // Función para hacer clic en elementos que podrían interferir
  async function dismissPopups(page: Page): Promise<void> {
    try {
      // Aceptar cookies si aparece el diálogo
      const cookieSelectors = [
        '#sp-cc-accept', 
        '#a-autoid-0', 
        'input[data-action-type="DISMISS"]',
        '#accept-amazon-cookie-button'
      ];
      
      for (const selector of cookieSelectors) {
        const buttonExists = await page.$(selector);
        if (buttonExists) {
          console.log(`[PuppeteerExtractor] Haciendo clic en botón de cookies: ${selector}`);
          await page.click(selector).catch(() => {});
          // Esperar a que desaparezca el diálogo
          await new Promise(resolve => setTimeout(resolve, 500));
          break;
        }
      }
      
      // Cerrar otros posibles popups
      const closeButtons = await page.$$('button[data-action="close"], .a-button-close, .a-icon-close');
      for (const button of closeButtons) {
        await button.click().catch(() => {});
      }
    } catch (e) {
      // Ignorar errores al intentar cerrar popups
      console.log('[PuppeteerExtractor] Error al intentar cerrar popups:', e);
    }
  }
  
  while (retryCount < maxRetries) {
    try {
      const browser = await getBrowser();
      const page = await browser.newPage();
      
      // Configurar un timeout razonable
      page.setDefaultNavigationTimeout(30000);
      
      // Usar un user agent aleatorio
      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(randomUserAgent);
      
      // Configurar cabeceras avanzadas para parecer más un navegador real
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
      });
      
      // Configurar para emular un navegador real
      await page.evaluateOnNewDocument(() => {
        // Ocultar que estamos usando Puppeteer/Headless
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        
        // Simular plugins de navegador
        Object.defineProperty(navigator, 'plugins', {
          get: () => [
            { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' }, 
            { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' }, 
            { name: 'Native Client', filename: 'internal-nacl-plugin' }
          ]
        });
        
        // Fingerprinting prevention
        Object.defineProperty(navigator, 'languages', {
          get: () => ['es-ES', 'es', 'en-US', 'en']
        });
      });
      
      // Ahora permitimos más recursos para asegurar que la página carga completamente
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        // Filtrar solicitudes para mejorar el rendimiento sin bloquear recursos cruciales
        const url = request.url();
        const resourceType = request.resourceType();
        
        // Bloquear analytics, ads, etc
        if (
          url.includes('google-analytics') || 
          url.includes('googleads') || 
          url.includes('/ads/') || 
          url.includes('analytics')
        ) {
          request.abort();
          return;
        }
        
        // Permitir todas las imágenes de productos pero bloquear otras imágenes menos importantes
        if (resourceType === 'image') {
          if (url.includes('/images/I/') || url.includes('product-image')) {
            request.continue();
          } else {
            request.abort();
          }
          return;
        }
        
        // Permitir la mayoría de recursos necesarios para el renderizado adecuado
        request.continue();
      });
      
      // Determinar URL a usar en este intento
      let currentUrl = url;
      if (retryCount > 0 && asin && alternativeUrls.length > 0) {
        // Usar URL alternativa en reintentos
        currentUrl = alternativeUrls[(retryCount - 1) % alternativeUrls.length];
        console.log(`[PuppeteerExtractor] Reintento ${retryCount} usando URL alternativa: ${currentUrl}`);
      }
      
      console.log(`[PuppeteerExtractor] Navegando a: ${currentUrl} (User-Agent: ${randomUserAgent.substring(0, 50)}...)`);
      await page.goto(currentUrl, { waitUntil: 'networkidle2' });
      
      // Intentar cerrar popups y aceptar cookies
      await dismissPopups(page);
      
      // Scroll para cargar imágenes y contenido lazy
      await page.evaluate(() => {
        window.scrollTo(0, 300);
        return new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
      });
      
      // Esperar un poco más para que cargue el contenido dinámico
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Intentar cerrar popups nuevamente después del scroll
      await dismissPopups(page);
      
      // Extraer los datos
      const result = await extractProductDataFromPage(page, currentUrl);
      
      // Si no tenemos título o imagen, es posible que necesitemos reintentar
      if ((!result.title || !result.imageUrl) && retryCount < maxRetries - 1) {
        console.log(`[PuppeteerExtractor] Datos incompletos en intento ${retryCount + 1}, reintentando...`);
        await page.close();
        retryCount++;
        continue;
      }
      
      console.log(`[PuppeteerExtractor] Extracción completada en intento ${retryCount + 1}: ${result.title ? '✓' : '✗'}`);
      
      // Si tenemos el ASIN pero no tenemos una imagen válida, intentar crear una URL de imagen directo
      if (asin && !result.imageUrl) {
        result.imageUrl = `https://m.media-amazon.com/images/I/${asin}.01._SL500_.jpg`;
        console.log(`[PuppeteerExtractor] Usando URL de imagen generada por ASIN: ${result.imageUrl}`);
      }
      
      // Cerrar la página para liberar recursos
      await page.close();
      
      // Programar el cierre del navegador después de un período de inactividad
      scheduleBrowserClose();
      
      return result;
    } catch (error) {
      console.error(`[PuppeteerExtractor] Error en intento ${retryCount + 1}: ${error instanceof Error ? error.message : String(error)}`);
      retryCount++;
      
      if (retryCount >= maxRetries) {
        // Si tenemos el ASIN pero hemos agotado los reintentos, proporcionar al menos la imagen generada
        if (asin) {
          const imageUrl = `https://m.media-amazon.com/images/I/${asin}.01._SL500_.jpg`;
          console.log(`[PuppeteerExtractor] Fallback a imagen generada por ASIN después de reintentos: ${imageUrl}`);
          
          // Programar el cierre del navegador
          scheduleBrowserClose();
          
          return {
            title: asin ? `Producto Amazon (${asin})` : undefined,
            imageUrl: imageUrl
          };
        }
        
        // Programar el cierre del navegador en caso de error
        scheduleBrowserClose();
        
        // Retornar un objeto vacío si no tenemos nada
        return {};
      }
      
      // Esperar un poco antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Si llegamos aquí es porque agotamos todos los reintentos sin éxito
  return {};
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
 * Extrae metadatos de un producto utilizando AI Vision con captura de pantalla
 * Esta función toma una captura de la página y la envía a OpenAI para análisis
 */
export async function extractMetadataWithScreenshot(url: string): Promise<{
  title?: string;
  imageUrl?: string;
  price?: string;
  description?: string;
}> {
  console.log(`[PuppeteerExtractor] Extrayendo metadatos con screenshot para: ${url}`);
  
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    
    // Configurar la página para evitar detección como bot
    await page.evaluateOnNewDocument(() => {
      // Ocultar WebDriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Modificar la propiedad plugins para que parezca un navegador normal
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Modificar idiomas
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-ES', 'es', 'en-US', 'en'],
      });
    });
    
    // Configuración avanzada para la página
    page.setDefaultNavigationTimeout(45000); // Aumentar timeout para sitios lentos
    
    // Lista de User-Agents móviles que suelen pasar más desapercibidos
    const mobileUserAgents = [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/96.0.4664.36 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 12; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.50 Mobile Safari/537.36',
      'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36'
    ];
    
    // Elegir un User-Agent móvil aleatorio
    const randomMobileUserAgent = mobileUserAgents[Math.floor(Math.random() * mobileUserAgents.length)];
    await page.setUserAgent(randomMobileUserAgent);
    console.log(`[PuppeteerExtractor] Usando User-Agent móvil: ${randomMobileUserAgent}`);
    
    // Configuración para la vista móvil
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    
    // Añadir encabezados HTTP que parecen más un navegador móvil real
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'sec-ch-ua-mobile': '?1',
      'sec-ch-ua-platform': '"Android"',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/',
      'Cache-Control': 'no-cache',
    });
    
    // Simular comportamiento humano con pausas aleatorias
    const randomPause = () => new Promise(resolve => 
      setTimeout(resolve, 500 + Math.floor(Math.random() * 1000))
    );
    
    // Navegar directamente a la URL como smartphone
    console.log(`[PuppeteerExtractor] Navegando a: ${url} como dispositivo móvil`);
    
    try {
      // Usar modo incógnito para evitar cookies anteriores
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 20000 
      });
      
      // Esperar carga adicional
      await randomPause();
      
      // Ejecutar scrolls aleatorios para parecer humano
      await page.evaluate(() => {
        const maxScrolls = 2 + Math.floor(Math.random() * 3);
        let currentScroll = 0;
        
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            window.scrollBy(0, 100 + Math.floor(Math.random() * 400));
            currentScroll++;
            
            if (currentScroll >= maxScrolls) {
              clearInterval(interval);
              // Volver arriba para la captura
              window.scrollTo(0, 200);
              resolve(true);
            }
          }, 500 + Math.floor(Math.random() * 500));
        });
      });
      
      await randomPause();
    } catch (navError) {
      console.log(`[PuppeteerExtractor] Error de navegación, intentando con modo simplificado: ${navError}`);
      
      try {
        // Si falla, intentar con opciones más simples
        await page.goto(url, { timeout: 25000 });
      } catch (retryError) {
        throw new Error(`No se pudo acceder a la página después de múltiples intentos: ${retryError}`);
      }
    }
    
    // Intentar manejar diálogos de cookies/popups
    try {
      // Lista ampliada de selectores para botones de cookies/aceptar en UIs móviles
      const consentSelectors = [
        // Selectores generales
        'button[id*="accept"], button[id*="consent"], button[id*="cookie"], button[id*="agree"]',
        'a[id*="accept"], a[id*="consent"], a[id*="cookie"], a[id*="agree"]',
        // Textos comunes
        'button:has-text("Accept"), button:has-text("Aceptar"), button:has-text("Acepto")',
        'button:has-text("cookies"), button:has-text("Cookies"), button:has-text("Continue"), button:has-text("OK")',
        // Específicos de móvil para varios sitios
        '.cookie-consent-banner button',
        '.cookie-banner button',
        '#consent_prompt_submit',
        '#onetrust-accept-btn-handler',
        '.js-accept-cookies',
        '.js-cookie-accept',
        // Decathlon móvil específico
        '.cookie-banner__buttons button',
        '#decathlon-cookie-banner button',
        '.cookieConsent button',
        '.didomi-button',
        '.didomi-continue-button'
      ];
      
      for (const selector of consentSelectors) {
        try {
          const buttons = await page.$$(selector);
          if (buttons.length > 0) {
            console.log(`[PuppeteerExtractor] Encontrados ${buttons.length} botones con selector ${selector}`);
            for (const button of buttons) {
              await button.click().catch(() => {});
              await randomPause();
            }
          }
        } catch (e) {
          // Continuar con el siguiente selector
        }
      }
    } catch (e) {
      // Ignorar errores al manejar cookies
    }
    
    // Esperar a que el contenido se estabilice
    await randomPause();
    
    // Tomar captura de pantalla
    console.log(`[PuppeteerExtractor] Tomando captura de pantalla...`);
    const screenshotBuffer = await page.screenshot({ 
      type: 'jpeg',
      quality: 85,
      fullPage: false
    });
    
    // Convertir el buffer a base64
    let screenshotBase64 = '';
    if (Buffer.isBuffer(screenshotBuffer)) {
      screenshotBase64 = screenshotBuffer.toString('base64');
      const sizeKB = Math.round(screenshotBase64.length / 1024);
      console.log(`[PuppeteerExtractor] Captura realizada: ${sizeKB} KB`);
    } else {
      console.error('[PuppeteerExtractor] Error: No se pudo obtener captura válida');
      throw new Error('Captura de pantalla inválida');
    }
    
    // Extraer el título y precio utilizando OpenAI Vision
    const visionResult = await extractMetadataFromScreenshot(screenshotBase64, url);
    
    // Extraer también la imagen y otros datos mediante métodos tradicionales
    let imageUrl: string | undefined;
    
    // Extraer imagen
    try {
      // Buscar la imagen principal del producto
      imageUrl = await page.evaluate(() => {
        // Lista de selectores para encontrar la imagen principal
        const imageSelectors = [
          // Selectores genéricos
          'img.product-image-main',
          'img.product-image',
          'img.main-image',
          '.product-image img',
          '.gallery img',
          '.product-gallery img',
          // Selectores específicos por tienda
          // Amazon
          '#landingImage',
          '#imgBlkFront',
          // Otros
          '.product-detail-image',
          '.product-hero-image img',
          // Genérico de imágenes grandes
          'img[width][height]'
        ];
        
        // Buscar por selectores específicos primero
        for (const selector of imageSelectors) {
          const img = document.querySelector(selector) as HTMLImageElement;
          if (img && img.src && !img.src.includes('placeholder') && !img.src.includes('loading')) {
            return img.src;
          }
        }
        
        // Si no encontramos nada, buscar la imagen más grande visible
        const images = Array.from(document.querySelectorAll('img'));
        let bestImage: HTMLImageElement | null = null;
        let bestImageArea = 0;
        
        for (const img of images) {
          // Verificar si la imagen es visible y lo suficientemente grande
          const rect = img.getBoundingClientRect();
          if (rect.width > 100 && rect.height > 100 && rect.top >= 0 && rect.left >= 0) {
            const area = rect.width * rect.height;
            if (area > bestImageArea) {
              bestImageArea = area;
              bestImage = img;
            }
          }
        }
        
        return bestImage?.src;
      });
    } catch (error) {
      console.error(`[PuppeteerExtractor] Error al extraer imagen: ${error}`);
    }
    
    // Cerrar la página
    await page.close();
    
    // Programar el cierre del navegador después de un período de inactividad
    scheduleBrowserClose();
    
    // Extraer también metadatos usando el DOM directamente como respaldo
    let domTitle: string | undefined;
    let domPrice: string | undefined;
    
    try {
      // Extraer texto directamente del DOM
      const domData = await page.evaluate(() => {
        // Función para limpiar texto
        const cleanText = (text: string) => text.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim();
        
        // Buscar título
        const titleSelectors = [
          // Meta tags
          'meta[property="og:title"]',
          'meta[name="twitter:title"]',
          'meta[name="title"]',
          // Encabezados y elementos de producto
          'h1',
          '.product-title',
          '.product-name',
          '.item-title',
          '.product-detail-name',
          '.product-name-title',
          '#productTitle',
          '[data-testid="product-title"]',
          '[data-testid="product-name"]',
          '[itemprop="name"]',
          '.product-heading-title',
          '.page-title',
          // Zara móvil
          '.product-detail-info__name',
          // Decathlon móvil
          '.title--product',
          '.svelte-product-title'
        ];
        
        let title = '';
        for (const selector of titleSelectors) {
          let element = null;
          if (selector.startsWith('meta')) {
            element = document.querySelector(selector);
            if (element && element.getAttribute('content')) {
              title = element.getAttribute('content') || '';
              break;
            }
          } else {
            element = document.querySelector(selector);
            if (element && element.textContent) {
              title = element.textContent;
              break;
            }
          }
        }
        
        // Buscar precio
        const priceSelectors = [
          // Meta tags
          'meta[property="product:price:amount"]',
          'meta[property="og:price:amount"]',
          // Elementos de precio
          '.price',
          '.product-price',
          '.price-container',
          '.current-price',
          '[data-price]',
          '[itemprop="price"]',
          '.price__current',
          '.price-tag',
          '.product-detail-info__price',
          // Decathlon móvil
          '.product-summary-price',
          '.svelte-price-tag',
          '.svelte-product-price',
          // Generales
          '[class*="price"]'
        ];
        
        let price = '';
        for (const selector of priceSelectors) {
          let element = null;
          if (selector.startsWith('meta')) {
            element = document.querySelector(selector);
            if (element && element.getAttribute('content')) {
              price = element.getAttribute('content') || '';
              break;
            }
          } else {
            element = document.querySelector(selector);
            if (element && element.textContent) {
              price = element.textContent;
              break;
            }
          }
        }
        
        return {
          title: cleanText(title),
          price: cleanText(price)
        };
      });
      
      if (domData.title) domTitle = domData.title;
      if (domData.price) domPrice = domData.price;
      
      console.log(`[PuppeteerExtractor] Datos extraídos del DOM: Título="${domData.title}", Precio="${domData.price}"`);
    } catch (domError) {
      console.error('[PuppeteerExtractor] Error al extraer datos del DOM:', domError);
    }
    
    // Seleccionar los mejores datos disponibles
    const result: {
      title?: string;
      imageUrl?: string;
      price?: string;
      description?: string;
    } = {};
    
    // Priorizar resultados de Vision AI si tienen alta confianza, sino usar DOM
    if (visionResult && visionResult.title && visionResult.confidence > 0.5) {
      result.title = visionResult.title;
    } else if (domTitle && domTitle.length > 5) {
      result.title = domTitle;
    }
    
    // Priorizar precio de Vision AI, sino usar DOM
    if (visionResult && visionResult.price) {
      result.price = visionResult.price;
    } else if (domPrice) {
      result.price = domPrice;
    }
    
    // Usar la URL de imagen encontrada
    if (imageUrl) {
      // Convertir URL relativa a absoluta si es necesario
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.origin}${imageUrl}`;
      }
      result.imageUrl = imageUrl;
    }
    
    console.log(`[PuppeteerExtractor] Resultado final de extracción: Título="${result.title || 'No encontrado'}", Precio="${result.price || 'No encontrado'}", Imagen=${result.imageUrl ? 'Sí' : 'No'}`);
    
    return result;
  } catch (error) {
    console.error(`[PuppeteerExtractor] Error al extraer con screenshot: ${error instanceof Error ? error.message : String(error)}`);
    // Programar el cierre del navegador
    scheduleBrowserClose();
    return {};
  }
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