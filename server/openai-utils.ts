import OpenAI from "openai";

// El modelo más nuevo de OpenAI es "gpt-4o" que fue lanzado el 13 de mayo de 2024.
// No cambiar a menos que el usuario lo solicite explícitamente.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Utiliza OpenAI para extraer metadatos estructurados de HTML
 * @param html El contenido HTML de la página
 * @param url La URL de la página
 * @returns Objeto con el título, descripción, precio e imagen del producto
 */
export async function extractMetadataWithAI(
  html: string,
  url: string
): Promise<{
  title?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
}> {
  try {
    // Reducir el HTML a un tamaño manejable para no exceder los límites de tokens
    const reducedHtml = reduceHtmlSize(html);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "Eres un experto en extracción de datos de páginas web de comercio electrónico. " +
            "Tu tarea es extraer el título del producto, la descripción, el precio (con el símbolo de moneda) y la URL de la imagen principal " +
            "del HTML proporcionado.\n\n" +
            "IMPORTANTE para el título:\n" +
            "- Debe ser específico y descriptivo del producto real\n" +
            "- NO extraigas texto genérico como 'Producto', 'Artículo', o solo el nombre de la tienda\n" +
            "- Asegúrate de que el título contiene características específicas (marca, modelo, tipo de producto)\n" +
            "- Si no encuentras un título específico, mejor NO incluirlo en la respuesta\n\n" +
            "Responde solo con JSON válido en el formato especificado sin explicaciones adicionales. " +
            "Si no puedes encontrar alguno de los campos, omítelo del JSON.",
        },
        {
          role: "user",
          content: `URL: ${url}\n\nHTML: ${reducedHtml}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Procesar la respuesta
    const content = response.choices[0].message.content;
    const result = content ? JSON.parse(content) : {};
    
    // Normalizar los resultados
    const metadata: {
      title?: string;
      description?: string;
      price?: string;
      imageUrl?: string;
    } = {};
    
    if (result.title) metadata.title = result.title;
    if (result.description) metadata.description = result.description;
    if (result.price) metadata.price = result.price;
    if (result.imageUrl || result.image) metadata.imageUrl = result.imageUrl || result.image;
    
    return metadata;
  } catch (error) {
    console.error("Error al extraer metadatos con IA:", error);
    return {};
  }
}

/**
 * Verifica si el título y la imagen del producto son válidos usando OpenAI
 * @param title El título extraído del producto
 * @param imageUrl La URL de la imagen extraída
 * @returns Un objeto con flags indicando si el título y la imagen son válidos
 */
export async function validateProductData(
  title?: string,
  imageUrl?: string
): Promise<{
  isTitleValid: boolean;
  isImageValid: boolean;
  message: string;
}> {
  console.log(`🔍 VALIDANDO CON OPENAI - Título: "${title || 'No disponible'}", ImageUrl: ${imageUrl ? 'Disponible' : 'No disponible'}`);
  
  try {
    if (!title && !imageUrl) {
      console.log(`⚠️ No hay datos para validar, devolviendo inválido por defecto`);
      return {
        isTitleValid: false,
        isImageValid: false,
        message: "No se proporcionaron datos para validar",
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en validación de metadatos de productos. Tu tarea es determinar si " +
            "el título y la URL de imagen proporcionados son válidos para un producto real. " +
            "Sé extremadamente estricto en tus evaluaciones.\n\n" +
            "Un título válido DEBE SER descriptivo y específico del producto. Títulos inválidos incluyen:\n" +
            "- Cualquier texto genérico como 'Producto', 'Artículo', 'Item'\n" +
            "- Cualquier título que solo contenga el nombre de una tienda o sitio web (ej: 'Amazon.com', 'Zara', 'El Corte Inglés')\n" +
            "- Títulos que combinan nombre de tienda y la palabra 'producto' (ej: 'Producto de Amazon', 'Artículo de Zara')\n" +
            "- Títulos muy cortos (menos de 10 caracteres)\n" +
            "- Títulos que contienen una URL o parte de una URL\n" +
            "- Cadenas de texto sin sentido como iniciales, letras sueltas, códigos de producto aislados\n" +
            "- Títulos que obviamente no describen un producto real (ej: 'Página no encontrada', 'Añadir al carrito', 'Detalles')\n" +
            "- Títulos que solo contienen categorías genéricas (ej: 'Ropa', 'Electrónica', 'Hogar')\n" +
            "- Cualquier texto que parezca ser un placeholder o texto de relleno\n\n" +
            "Un título VÁLIDO debe contener información específica del producto como marca, modelo, tipo de producto, o características principales.\n\n" +
            "Una imagen válida debe ser una URL que parezca mostrar un producto real (no un placeholder o una imagen genérica).\n\n" +
            "Responde con un JSON que contenga:\n" +
            "- isTitleValid: boolean (true solo si estás 100% seguro de que el título es válido)\n" +
            "- isImageValid: boolean\n" +
            "- message: string (razón específica si algo es inválido)\n\n" +
            "Ante la duda, marca como inválido.",
        },
        {
          role: "user",
          content: `Valida los siguientes datos de producto:\n\nTítulo: ${title || "No proporcionado"}\n\nURL de imagen: ${imageUrl || "No proporcionada"}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    // Procesar la respuesta
    const content = response.choices[0].message.content;
    console.log(`📊 Respuesta raw de OpenAI: ${content}`);
    const result = content ? JSON.parse(content) : {};
    
    console.log(`📊 Respuesta parseada:`, result);
    
    // Valores por defecto
    let isTitleValid = false;
    let isImageValid = false;
    let message = "No pudimos validar los datos del producto";
    
    // Verificar y normalizar los resultados
    if (typeof result.isTitleValid === 'boolean') {
      isTitleValid = result.isTitleValid;
    }
    
    if (typeof result.isImageValid === 'boolean') {
      isImageValid = result.isImageValid;
    }
    
    if (result.message && typeof result.message === 'string') {
      message = result.message;
    }
    
    console.log(`⚡ Resultado final de validación: Título ${isTitleValid ? 'VÁLIDO' : 'INVÁLIDO'}, Imagen ${isImageValid ? 'VÁLIDA' : 'INVÁLIDA'}, Mensaje: ${message}`);
    
    return {
      isTitleValid: isTitleValid,
      isImageValid: isImageValid,
      message: message
    };
  } catch (error) {
    console.error("Error al validar datos de producto con IA:", error);
    return {
      isTitleValid: false, // Por defecto, asumimos que NO es válido en caso de error
      isImageValid: false, // Es más seguro asumir que los datos no son válidos
      message: "Error durante la validación, asumiendo datos no válidos por precaución"
    };
  }
}

/**
 * Extrae metadatos de un producto a partir de una imagen capturada por Puppeteer
 * @param screenshotBase64 La captura de pantalla en formato base64
 * @param url La URL de la página
 * @returns Objeto con el título, descripción, precio e imagen del producto
 */
export async function extractMetadataFromScreenshot(
  screenshotBase64: string,
  url: string
): Promise<{
  title?: string;
  price?: string;
  confidence: number;
}> {
  try {
    console.log('🧠 Analizando captura de pantalla con OpenAI Vision...');
    console.log(`🔍 Tamaño de la imagen base64: ${screenshotBase64.length} caracteres`);
    
    // Comprobar que la API key de OpenAI está disponible
    console.log(`🔑 API Key de OpenAI disponible: ${!!process.env.OPENAI_API_KEY ? 'Sí' : 'No'}`);
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY no está disponible en el entorno');
      return { confidence: 0 };
    }
    
    console.log('🚀 Enviando solicitud a OpenAI Vision...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "Eres un experto en análisis de capturas de pantalla de páginas de productos de e-commerce. " +
            "Tu tarea es extraer con precisión el título exacto del producto y su precio a partir de la imagen proporcionada.\n\n" +
            "REGLAS IMPORTANTES:\n" +
            "1. El título debe ser completo, específico y descriptivo del producto real\n" +
            "2. Incluye marca, modelo y características clave en el título\n" +
            "3. El precio debe incluir el símbolo de la moneda (€, $, etc.)\n" +
            "4. Evalúa tu nivel de confianza en la extracción (0.0 a 1.0)\n" +
            "5. Si no puedes identificar con certeza algún dato, déjalo vacío\n\n" +
            "Responde solo con JSON válido en el formato especificado sin explicaciones adicionales."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analiza esta captura de pantalla de un producto de e-commerce de ${url}. Extrae el título exacto y el precio del producto mostrado:`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${screenshotBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }).catch(err => {
      console.error(`❌ Error en la llamada a OpenAI: ${err.message}`);
      console.error(`❌ Detalles del error: ${JSON.stringify(err)}`);
      throw err;
    });
    
    console.log('✅ Respuesta recibida de OpenAI Vision');

    // Procesar la respuesta
    const content = response.choices[0].message.content;
    console.log(`📄 Contenido de la respuesta: ${content}`);
    
    const result = content ? JSON.parse(content) : {};
    
    console.log(`🔍 OpenAI Vision extrajo: Título="${result.title || 'No detectado'}", Precio="${result.price || 'No detectado'}", Confianza=${result.confidence || 0}`);
    
    // Normalizar los resultados
    const metadata: {
      title?: string;
      price?: string;
      confidence: number;
    } = {
      confidence: result.confidence || 0
    };
    
    if (result.title) metadata.title = result.title;
    if (result.price) metadata.price = result.price;
    
    return metadata;
  } catch (error) {
    console.error("Error al extraer metadatos con Vision AI:", error);
    return { confidence: 0 };
  }
}

/**
 * Reduce el tamaño del HTML para no exceder los límites de tokens de la API
 * Se enfoca en mantener las partes más relevantes para la extracción de metadatos
 */
function reduceHtmlSize(html: string): string {
  // Extraemos las secciones más importantes para metadatos
  let reducedHtml = "";
  
  // Extraer la sección <head> donde suelen estar los metadatos
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch && headMatch[1]) {
    reducedHtml += headMatch[1];
  }
  
  // Extraer las secciones que suelen contener información de productos
  const productPatterns = [
    /<div[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<section[^>]*class="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/section>/gi,
    /<div[^>]*id="[^"]*product[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*price[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*gallery[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<div[^>]*class="[^"]*image[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<main[^>]*>([\s\S]*?)<\/main>/gi,
  ];
  
  for (const pattern of productPatterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      if (match[1]) {
        reducedHtml += match[1];
        // Limitar el tamaño para no exceder el límite de tokens
        if (reducedHtml.length > 15000) break;
      }
    }
    // Limitar el tamaño total
    if (reducedHtml.length > 15000) break;
  }
  
  // Si después de extraer secciones relevantes el HTML es muy pequeño,
  // añadir algo del <body> original hasta un límite razonable
  if (reducedHtml.length < 5000) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch && bodyMatch[1]) {
      // Añadir solo una parte del body para no exceder el límite
      const bodyContent = bodyMatch[1].slice(0, 10000);
      reducedHtml += bodyContent;
    }
  }
  
  // Asegurar que no excedemos el límite de tokens (aproximadamente 15,000 caracteres)
  return reducedHtml.slice(0, 15000);
}