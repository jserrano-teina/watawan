import { Request, Response } from 'express';
import { extractUniversalMetadata } from './universal-extractor';

/**
 * Controlador para la extracción de metadatos de productos
 * Utiliza el extractor universal estandarizado con estrategia en dos fases
 */
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
    
    // Usar el extractor universal estandarizado con estrategia en dos fases
    console.log(`🌟 Utilizando extractor universal estandarizado con estrategia en dos fases`);
    const result = await extractUniversalMetadata(url);
    
    console.log(`✅ Extracción completada: título=${!!result.title}, imagen=${!!result.imageUrl}, precio=${!!result.price}`);
    
    // Validar título e imagen antes de devolver la respuesta
    const isTitleInvalid = !result.title || 
                         result.title.length <= 2 || 
                         /^[A-Za-z]\s?[A-Za-z]$/.test(result.title) || 
                         result.title === "Amazon.com" ||
                         result.title === "Amazon.es" ||
                         result.title === "Producto" ||
                         result.title === "Producto Amazon" ||
                         result.title === "Hola," ||    // Título común de redirección de Zara
                         result.title.includes("Update your location") || // Mensaje de localización de Nike
                         result.title.includes("http") ||
                         result.title.includes("www.");
                         
    console.log(`📊 Validación de datos: Título ${!isTitleInvalid ? 'válido' : 'inválido'}, Imagen ${!!result.imageUrl ? 'válida' : 'inválida'}`);
    
    return res.json({
      title: result.title,
      description: result.description,
      imageUrl: result.imageUrl,
      price: result.price,
      isTitleValid: !isTitleInvalid,
      isImageValid: !!result.imageUrl,
      validationMessage: isTitleInvalid ? 
        `El título "${result.title || ''}" no es válido o es demasiado genérico. Por favor, introduce un título descriptivo.` : 
        "Extracción completada con éxito"
    });
  } catch (error) {
    console.error(`❌ Error general: ${error}`);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ 
      error: 'Error al procesar la URL',
      message: errorMessage,
      title: '',
      description: '',
      imageUrl: '',
      price: '',
      isTitleValid: false,
      isImageValid: false,
      validationMessage: 'Error al procesar la URL'
    });
  }
}