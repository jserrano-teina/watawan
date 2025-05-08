import { Request, Response } from 'express';
import { validateProductData } from './openai-utils';

// Esta función contiene la implementación actualizada del endpoint /extract-metadata
// que utiliza Puppeteer para mejorar la extracción de metadatos
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
    
    // Función para crear un objeto de respuesta consistente siempre con la misma estructura
    const createResponseObject = async (data: any) => {
      // Si tenemos título o imagen, validamos con IA
      if (data.title || data.imageUrl) {
        try {
          console.log(`🧠 Validando calidad de datos con IA...`);
          console.log(`📊 Datos a validar - Título: "${data.title || 'No disponible'}", Imagen: ${data.imageUrl ? 'Disponible' : 'No disponible'}`);
          
          // Validación manual más permisiva para casos específicos
          let isTitleInvalid = false;
          if (data.title) {
            // Detectar SOLO títulos extremadamente genéricos o incorrectos
            if (data.title.length <= 1 || // Solo títulos de 1 caracter o menos
                /^[A-Za-z]\s*$/.test(data.title) || // Solo una letra
                data.title === "Amazon.com" ||
                data.title === "Amazon.es" ||
                data.title === "Producto" || // Solo la palabra "Producto" sin más
                data.title.includes("http://") ||
                data.title.includes("https://") ||
                data.title.includes("www.")) {
              isTitleInvalid = true;
              console.log(`⚠️ Detectado título inválido de forma explícita: "${data.title}"`);
            }
          }
          
          // Validación con OpenAI (ahora es más permisiva según los cambios en openai-utils.ts)
          const validation = await validateProductData(data.title, data.imageUrl);
          
          // Lógica de validación ajustada para ser más permisiva
          if (isTitleInvalid) {
            // Solo invalidamos si la validación manual detectó algo claramente incorrecto
            validation.isTitleValid = false;
            validation.message = `El título "${data.title}" es demasiado genérico o contiene una URL. Por favor, introduce un título descriptivo.`;
            console.log(`⚠️ Título rechazado por validación manual: "${data.title}"`);
          } else {
            // Aceptamos el resultado de la validación de OpenAI (que ahora es más permisiva)
            console.log(`✅ Título pasó validación manual. Resultado OpenAI: ${validation.isTitleValid ? 'VÁLIDO' : 'INVÁLIDO'}: "${data.title}"`);
          }
          
          console.log(`✅ Validación MANUAL: Título ${validation.isTitleValid ? 'válido' : 'inválido'}, Imagen ${validation.isImageValid ? 'válida' : 'inválida'}`);
          console.log(`📝 Mensaje: ${validation.message}`);
          
          return {
            title: data.title || '',
            description: data.description || '',
            imageUrl: data.imageUrl || '',
            price: '', // Siempre vacío según la especificación
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
            price: '', // Siempre vacío según la especificación
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
        price: '', // Siempre vacío según la especificación
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
        // Primero intentar con Puppeteer para una mejor extracción
        console.log(`🤖 Usando Puppeteer para sitio no-Amazon...`);
        const { extractMetadataWithPuppeteer } = await import('./puppeteer-extractor');
        const puppeteerMetadata = await extractMetadataWithPuppeteer(url);
        
        if (puppeteerMetadata && (puppeteerMetadata.title || puppeteerMetadata.imageUrl)) {
          console.log(`✅ Extracción con Puppeteer exitosa para sitio no-Amazon`);
          return res.json(await createResponseObject(puppeteerMetadata));
        } else {
          console.log(`⚠️ Puppeteer no obtuvo datos completos para sitio no-Amazon. Usando métodos alternativos...`);
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
      price: ''
    });
  }
}