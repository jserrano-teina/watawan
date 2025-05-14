import { Request, Response } from 'express';
import { extractUniversalMetadata } from './universal-extractor';

// Esta función contiene la implementación actualizada del endpoint /extract-metadata
// que utiliza un extractor universal estandarizado
export async function handleExtractMetadataRequest(req: Request, res: Response) {
  const url = req.query.url as string;
  
  if (!url) {
    return res.status(400).json({ message: "URL parameter is required" });
  }
  
  try {
    console.log(`📋 Extrayendo metadatos de URL: ${url}`);
    
    // Registrar información del dispositivo para diagnóstico
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const deviceType = userAgent.includes('Mobile') ? 'móvil' : 
                     (userAgent.includes('Tablet') ? 'tablet' : 'desktop');
    
    console.log(`📱 Dispositivo solicitante: ${deviceType} - User-Agent: ${userAgent.substring(0, 50)}...`);
    
    // Usar el nuevo extractor universal estandarizado
    console.log(`🌟 Utilizando extractor universal estandarizado con estrategia en dos fases`);
    const result = await extractUniversalMetadata(url);
    
    console.log(`✅ Extracción completada con extractor universal: título=${!!result.title}, imagen=${!!result.imageUrl}, precio=${!!result.price}`);
    
    return res.json(result);
    
    // Función para crear un objeto de respuesta consistente siempre con la misma estructura
    const createResponseObject = async (data: any) => {
      // Si tenemos título o imagen, validamos con IA
      if (data.title || data.imageUrl) {
        try {
          console.log(`🧠 Validando calidad de datos con IA...`);
          console.log(`📊 Datos a validar - Título: "${data.title || 'No disponible'}", Imagen: ${data.imageUrl ? 'Disponible' : 'No disponible'}`);
          
          // IMPORTANTE: Forzar validación más estricta para casos específicos
          let isTitleInvalid = false;
          if (data.title) {
            // Detectar títulos muy cortos o genéricos
            if (data.title.length <= 2 || 
                /^[A-Za-z]\s?[A-Za-z]$/.test(data.title) || // Patrón tipo "R P"
                data.title === "Amazon.com" ||
                data.title === "Amazon.es" ||
                data.title === "Producto" ||
                data.title === "Producto Amazon" ||
                data.title.includes("http") ||
                data.title.includes("www.")) {
              isTitleInvalid = true;
              console.log(`⚠️ Detectado título inválido de forma explícita: "${data.title}"`);
            }
          }
          
          // DESACTIVAR TEMPORALMENTE LA VALIDACIÓN DE OPENAI PARA DEPURACIÓN
          // const validation = await validateProductData(data.title, data.imageUrl);
          
          // Crear una validación manual en su lugar
          const validation = {
            isTitleValid: !isTitleInvalid && !!data.title && data.title.length > 2,
            isImageValid: !!data.imageUrl,
            message: isTitleInvalid 
              ? `El título "${data.title}" no es válido o es demasiado genérico. Por favor, introduce un título descriptivo.`
              : "Todo parece correcto"
          };
          
          console.log(`✅ Validación MANUAL: Título ${validation.isTitleValid ? 'válido' : 'inválido'}, Imagen ${validation.isImageValid ? 'válida' : 'inválida'}`);
          console.log(`📝 Mensaje: ${validation.message}`);
          
          return {
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            price: data.price || '', // Ahora devolvemos el precio extraído
            isTitleValid: validation.isTitleValid,
            isImageValid: validation.isImageValid,
            validationMessage: validation.message
          };
        } catch (error) {
          console.error(`❌ Error en validación IA: ${error}`);
          // En caso de error, asumimos válidos por defecto para no bloquear el flujo
          return {
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            price: data.price || '', // Ahora devolvemos el precio extraído
            isTitleValid: true,
            isImageValid: true,
            validationMessage: ''
          };
        }
      }
      
      // Si no hay datos para validar, devolvemos todo como inválido
      return {
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        price: data.price || '', // Ahora devolvemos el precio extraído
        isTitleValid: false,
        isImageValid: false,
        validationMessage: 'No se pudieron extraer datos suficientes para validar'
      };
    };
    
    // Importar el módulo de extracción de Amazon
    const { isAmazonUrl, extractAmazonMetadata } = await import('./amazon-extractor');
    const isAmazon = isAmazonUrl(url);
    
    console.log(`🔍 Extrayendo metadatos para: ${url} ${isAmazon ? '(Amazon)' : ''}`);
    
    // Para Amazon usamos nuestro extractor especializado
    if (isAmazon) {
      const { cleanAmazonTitle, extractAsin } = await import('./amazon-extractor');
      console.log(`🛒 Detectada URL de Amazon. Usando extractor especializado.`);
      
      try {
        // Obtener metadatos con nuestro extractor especializado
        console.log(`📊 Iniciando extracción con amazon-extractor...`);
        const amazonMetadata = await extractAmazonMetadata(url, req.headers['user-agent'] as string);
        
        // Extraer ASIN para usarlo en caso necesario
        const asin = extractAsin(url);
        
        // Verificar si obtuvimos datos
        if (amazonMetadata && (amazonMetadata.title || amazonMetadata.imageUrl)) {
          console.log(`✅ Extracción especializada exitosa:`);
          console.log(`   - Título: ${amazonMetadata.title ? amazonMetadata.title.substring(0, 30) + '...' : 'No disponible'}`);
          console.log(`   - Imagen: ${amazonMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
          
          // Si el título comienza con "Producto Amazon", significa que usamos el título genérico
          // o está mal formateado, así que intentamos con Puppeteer para obtener datos más precisos
          if (!amazonMetadata.title || 
              amazonMetadata.title.startsWith('Producto Amazon') ||
              /https?:\s*[A-Z0-9]{10}/i.test(amazonMetadata.title)) {
            
            console.log(`🤖 El título es genérico o malformado. Intentando con Puppeteer para obtener metadatos más precisos...`);
            
            try {
              const { extractAmazonMetadataWithPuppeteer } = await import('./puppeteer-extractor');
              const puppeteerMetadata = await extractAmazonMetadataWithPuppeteer(url);
              
              if (puppeteerMetadata && puppeteerMetadata.title && 
                  !puppeteerMetadata.title.startsWith('Producto Amazon') &&
                  !/https?:\s*[A-Z0-9]{10}/i.test(puppeteerMetadata.title)) {
                
                // Limpiar el título para asegurar que no tiene problemas de formato
                const cleanedTitle = cleanAmazonTitle(puppeteerMetadata.title || '', asin || undefined);
                
                console.log(`✅ Extracción con Puppeteer exitosa:`);
                console.log(`   - Título: ${cleanedTitle.substring(0, 30)}...`);
                console.log(`   - Imagen: ${puppeteerMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
                
                return res.json(await createResponseObject({
                  title: cleanedTitle,
                  description: puppeteerMetadata.description || '',
                  imageUrl: puppeteerMetadata.imageUrl || amazonMetadata.imageUrl || ''
                }));
              }
            } catch (puppeteerError) {
              console.error(`⚠️ Error con Puppeteer: ${puppeteerError}`);
              // Si falla Puppeteer, continuamos con los datos que teníamos de Amazon
            }
          }
          
          // Limpiar el título antes de devolverlo
          const cleanedTitle = cleanAmazonTitle(amazonMetadata.title || '', asin || undefined);
          
          return res.json(await createResponseObject({
            title: cleanedTitle || 'Producto Amazon',
            description: amazonMetadata.description || '',
            imageUrl: amazonMetadata.imageUrl || ''
          }));
        } else {
          console.log(`⚠️ La extracción especializada no obtuvo todos los datos. Intentando con Puppeteer.`);
          
          try {
            // Usar Puppeteer como método alternativo
            const { extractAmazonMetadataWithPuppeteer } = await import('./puppeteer-extractor');
            const puppeteerMetadata = await extractAmazonMetadataWithPuppeteer(url);
            
            if (puppeteerMetadata && (puppeteerMetadata.title || puppeteerMetadata.imageUrl)) {
              // Limpiar el título usando nuestra función especializada
              const cleanedTitle = cleanAmazonTitle(puppeteerMetadata.title || '', asin || undefined);
              
              console.log(`✅ Extracción con Puppeteer exitosa:`);
              console.log(`   - Título: ${cleanedTitle ? cleanedTitle.substring(0, 30) + '...' : 'No disponible'}`);
              console.log(`   - Imagen: ${puppeteerMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
              
              return res.json(await createResponseObject({
                title: cleanedTitle || 'Producto Amazon',
                description: puppeteerMetadata.description || '',
                imageUrl: puppeteerMetadata.imageUrl || ''
              }));
            } else {
              // Si Puppeteer no obtiene datos, usar metascraper como último recurso
              console.log(`⚠️ Puppeteer no obtuvo datos. Intentando con metascraper como fallback...`);
            }
          } catch (puppeteerError) {
            console.error(`❌ Error en Puppeteer: ${puppeteerError}`);
            console.log(`⚠️ Usando métodos alternativos después de fallo en Puppeteer...`);
          }
          
          // Si Puppeteer falla o no obtiene datos, usar los métodos de respaldo tradicionales
          // Importar el extractor genérico como respaldo
          const { getUrlMetadata } = await import('./metascraper');
          const backupMetadata = await getUrlMetadata(url, req.headers['user-agent'] as string);
          
          // Combinar los resultados dando prioridad al extractor especializado
          const combinedMetadata = {
            title: amazonMetadata.title || backupMetadata.title || 'Producto Amazon',
            description: amazonMetadata.description || backupMetadata.description || '',
            imageUrl: amazonMetadata.imageUrl || backupMetadata.imageUrl || ''
          };
          
          return res.json(await createResponseObject(combinedMetadata));
        }
      } catch (error: any) {
        console.log(`⚠️ Error en extracción especializada: ${error.message || 'desconocido'}. Intentando con Puppeteer...`);
        
        try {
          // Si falla el extractor especializado, intentar con Puppeteer
          const { extractAmazonMetadataWithPuppeteer } = await import('./puppeteer-extractor');
          const puppeteerMetadata = await extractAmazonMetadataWithPuppeteer(url);
          
          if (puppeteerMetadata && (puppeteerMetadata.title || puppeteerMetadata.imageUrl)) {
            // Limpiar el título si es necesario
            if (puppeteerMetadata.title) {
              const { extractAsin } = await import('./amazon-extractor');
              const extractedAsin = extractAsin(url);
              const cleanedTitle = cleanAmazonTitle(puppeteerMetadata.title, extractedAsin || undefined);
              puppeteerMetadata.title = cleanedTitle;
            }
            
            console.log(`✅ Recuperación con Puppeteer exitosa después de fallo en el extractor principal`);
            return res.json(await createResponseObject(puppeteerMetadata));
          } else {
            console.log(`⚠️ Puppeteer tampoco obtuvo datos. Usando método genérico.`);
          }
        } catch (puppeteerError) {
          console.error(`❌ Error también en Puppeteer: ${puppeteerError}`);
          console.log(`⚠️ Todos los extractores especializados fallaron. Usando método genérico.`);
        }
        
        // Si todo lo anterior falla, usar el método genérico como último recurso
        const { getUrlMetadata } = await import('./metascraper');
        const genericMetadata = await getUrlMetadata(url, req.headers['user-agent'] as string);
        
        return res.json(await createResponseObject(genericMetadata));
      }
    } else {
      // Para otros sitios no-Amazon
      try {
        // Primero intentar con nuestra nueva función de captura de pantalla + OpenAI Vision
        console.log(`🤖 Usando captura de pantalla + OpenAI Vision para sitio no-Amazon...`);
        console.log(`🌐 URL a procesar: ${url}`);
        const { extractMetadataWithScreenshot } = await import('./puppeteer-extractor');
        
        // Verificar si estamos tratando con una tienda que sabemos que tiene bloqueos fuertes
        const isDecathlon = url.includes('decathlon');
        const isElCorteIngles = url.includes('elcorteingles');
        const isZara = url.includes('zara.com');
        const isDifficultSite = isDecathlon || isElCorteIngles || isZara;
        
        // Para sitios conocidos por bloquear, intentamos primero extracción simple de metadatos
        if (isDifficultSite) {
          try {
            console.log(`🛡️ Detectado sitio con protección anti-scraping fuerte (${isDecathlon ? 'Decathlon' : isElCorteIngles ? 'El Corte Inglés' : 'Zara'}). Usando extracción básica...`);
            
            // Primero intentar con el método genérico que toma los metadatos OpenGraph
            // Este método funciona más frecuentemente con sitios que bloquean scraping
            const { getUrlMetadata } = await import('./metascraper');
            const basicMetadata = await getUrlMetadata(url, 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1');
            
            if (basicMetadata.title && basicMetadata.title.length > 5) {
              console.log(`✅ Extracción básica exitosa para sitio con protección: ${basicMetadata.title}`);
              return res.json(await createResponseObject(basicMetadata));
            }
            
            console.log(`⚠️ Extracción básica no produjo resultados. Intentando método alternativo...`);
          } catch (basicError) {
            console.error(`❌ Error en extracción básica: ${basicError}`);
          }
        }
        
        // Si no es un sitio difícil o la extracción básica falló, intentar con método avanzado
        try {
          console.log(`🚀 Iniciando extractMetadataWithScreenshot para ${url}`);
          const screenshotMetadata = await extractMetadataWithScreenshot(url);
          console.log(`📊 Resultados de extractMetadataWithScreenshot: ${JSON.stringify(screenshotMetadata)}`);
          
          if (screenshotMetadata && screenshotMetadata.title) {
            console.log(`✅ Extracción con captura de pantalla + OpenAI Vision exitosa para sitio no-Amazon`);
            return res.json(await createResponseObject({
              title: screenshotMetadata.title,
              imageUrl: screenshotMetadata.imageUrl || '',
              price: screenshotMetadata.price || '', // Devolver el precio si existe
              description: ''
            }));
          } else {
            console.log(`⚠️ La captura de pantalla + OpenAI Vision no obtuvo datos completos. Intentando con Puppeteer tradicional...`);
          }
        } catch (visionError) {
          console.error(`❌ Error al extraer con Vision AI: ${visionError instanceof Error ? visionError.message : String(visionError)}`);
          console.error(`❌ Stack trace: ${visionError instanceof Error ? visionError.stack : 'No disponible'}`);
          console.log(`⚠️ Continuando con métodos alternativos de extracción...`);
          
          // Intentar con el método tradicional de Puppeteer como fallback
          const { extractMetadataWithPuppeteer } = await import('./puppeteer-extractor');
          const puppeteerMetadata = await extractMetadataWithPuppeteer(url);
          
          if (puppeteerMetadata && (puppeteerMetadata.title || puppeteerMetadata.imageUrl)) {
            console.log(`✅ Extracción con Puppeteer tradicional exitosa para sitio no-Amazon`);
            return res.json(await createResponseObject(puppeteerMetadata));
          } else {
            console.log(`⚠️ Puppeteer tradicional tampoco obtuvo datos completos. Usando métodos alternativos...`);
          }
        }
      } catch (puppeteerError) {
        console.error(`❌ Error en Puppeteer para sitio no-Amazon: ${puppeteerError}`);
        console.log(`⚠️ Usando métodos alternativos después de fallo en Puppeteer...`);
      }
      
      // Si Puppeteer falla o no obtiene datos, continuar con el flujo normal para sitios no-Amazon
      const { extractOpenGraphData } = await import('./open-graph');
      
      // Crear una promesa con timeout para evitar bloqueos
      const fetchWithTimeout = async (ms: number): Promise<any> => {
        return Promise.race([
          extractOpenGraphData(url, req.headers['user-agent'] as string), // Usar el UA original del cliente
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout obteniendo metadatos')), ms)
          )
        ]);
      };
      
      // Dar un máximo de 5 segundos para la extracción
      let metadata;
      try {
        metadata = await fetchWithTimeout(5000);
        
        console.log(`✅ Metadatos extraídos con éxito: ${metadata.title ? 'título ✓' : 'título ✗'}, ${metadata.imageUrl ? 'imagen ✓' : 'imagen ✗'}`);
      } catch (timeoutError) {
        console.log(`⚠️ Timeout en la extracción OpenGraph. Usando metascraper como fallback...`);
        
        // Si hay timeout, usar metascraper como alternativa
        const { getUrlMetadata } = await import('./metascraper');
        metadata = await getUrlMetadata(url, req.headers['user-agent'] as string);
      }
      
      res.json(await createResponseObject(metadata));
    }
  } catch (error) {
    console.error(`❌ Error extrayendo metadatos: ${error}`);
    
    // En caso de error, devolver un objeto vacío con la estructura correcta
    res.json({
      title: '',
      description: '',
      imageUrl: '',
      price: '', // Mantenemos vacío en caso de error
      isTitleValid: false,
      isImageValid: false,
      validationMessage: 'Error al procesar la URL'
    });
  }
}