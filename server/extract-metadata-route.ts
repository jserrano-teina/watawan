import { Request, Response } from 'express';

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
    const createResponseObject = (data: any) => {
      return {
        title: data.title || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        price: '' // Siempre vacío según la especificación
      };
    };
    
    // Importar el módulo de extracción de Amazon
    const { isAmazonUrl, extractAmazonMetadata } = await import('./amazon-extractor');
    const isAmazon = isAmazonUrl(url);
    
    console.log(`🔍 Extrayendo metadatos para: ${url} ${isAmazon ? '(Amazon)' : ''}`);
    
    // Para Amazon usamos nuestro extractor especializado
    if (isAmazon) {
      console.log(`🛒 Detectada URL de Amazon. Usando extractor especializado.`);
      
      try {
        // Obtener metadatos con nuestro extractor especializado
        console.log(`📊 Iniciando extracción con amazon-extractor...`);
        const amazonMetadata = await extractAmazonMetadata(url, req.headers['user-agent'] as string);
        
        // Verificar si obtuvimos datos
        if (amazonMetadata && (amazonMetadata.title || amazonMetadata.imageUrl)) {
          console.log(`✅ Extracción especializada exitosa:`);
          console.log(`   - Título: ${amazonMetadata.title ? amazonMetadata.title.substring(0, 30) + '...' : 'No disponible'}`);
          console.log(`   - Imagen: ${amazonMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
          
          // Si el título comienza con "Producto Amazon", significa que usamos el título genérico
          // En ese caso, intentamos con Puppeteer para obtener datos más precisos
          if (amazonMetadata.title && amazonMetadata.title.startsWith('Producto Amazon')) {
            console.log(`🤖 El título es genérico. Intentando con Puppeteer para obtener metadatos más precisos...`);
            
            try {
              const { extractAmazonMetadataWithPuppeteer } = await import('./puppeteer-extractor');
              const puppeteerMetadata = await extractAmazonMetadataWithPuppeteer(url);
              
              if (puppeteerMetadata && puppeteerMetadata.title && !puppeteerMetadata.title.startsWith('Producto Amazon')) {
                console.log(`✅ Extracción con Puppeteer exitosa:`);
                console.log(`   - Título: ${puppeteerMetadata.title.substring(0, 30)}...`);
                console.log(`   - Imagen: ${puppeteerMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
                
                return res.json(createResponseObject({
                  title: puppeteerMetadata.title,
                  description: puppeteerMetadata.description || '',
                  imageUrl: puppeteerMetadata.imageUrl || amazonMetadata.imageUrl || ''
                }));
              }
            } catch (puppeteerError) {
              console.error(`⚠️ Error con Puppeteer: ${puppeteerError}`);
              // Si falla Puppeteer, continuamos con los datos que teníamos de Amazon
            }
          }
          
          return res.json(createResponseObject({
            title: amazonMetadata.title || 'Producto Amazon',
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
              console.log(`✅ Extracción con Puppeteer exitosa:`);
              console.log(`   - Título: ${puppeteerMetadata.title ? puppeteerMetadata.title.substring(0, 30) + '...' : 'No disponible'}`);
              console.log(`   - Imagen: ${puppeteerMetadata.imageUrl ? 'Disponible' : 'No disponible'}`);
              
              return res.json(createResponseObject({
                title: puppeteerMetadata.title || 'Producto Amazon',
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
          
          return res.json(createResponseObject(combinedMetadata));
        }
      } catch (error: any) {
        console.log(`⚠️ Error en extracción especializada: ${error.message || 'desconocido'}. Intentando con Puppeteer...`);
        
        try {
          // Si falla el extractor especializado, intentar con Puppeteer
          const { extractAmazonMetadataWithPuppeteer } = await import('./puppeteer-extractor');
          const puppeteerMetadata = await extractAmazonMetadataWithPuppeteer(url);
          
          if (puppeteerMetadata && (puppeteerMetadata.title || puppeteerMetadata.imageUrl)) {
            console.log(`✅ Recuperación con Puppeteer exitosa después de fallo en el extractor principal`);
            return res.json(createResponseObject(puppeteerMetadata));
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
        
        return res.json(createResponseObject(genericMetadata));
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
          return res.json(createResponseObject(puppeteerMetadata));
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
      
      res.json(createResponseObject(metadata));
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