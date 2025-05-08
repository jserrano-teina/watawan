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
            "- Debe ser ESPECÍFICO y DESCRIPTIVO del producto real\n" +
            "- NO extraigas texto genérico como 'Producto', 'Artículo', 'Item', o solo el nombre de la tienda\n" +
            "- NO extraigas títulos que combinan nombre de tienda y 'producto' (ej: 'Producto de Amazon', 'Artículo de Zara')\n" +
            "- NO extraigas títulos muy cortos (menos de 15 caracteres) o excesivamente simples\n" +
            "- NO extraigas títulos que contienen URLs o códigos\n" +
            "- Asegúrate de que el título contiene características específicas (marca, modelo, tipo de producto)\n" +
            "- Si no encuentras un título específico y descriptivo, es mejor NO incluirlo en la respuesta\n" +
            "- Es preferible omitir un título a extraer uno genérico o poco descriptivo\n\n" +
            "Responde solo con JSON válido en el formato especificado sin explicaciones adicionales. " +
            "Si no puedes encontrar alguno de los campos con la calidad requerida, omítelo del JSON.",
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
    
    // Registramos diagnóstico detallado del error para solucionar problemas
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`🔴 [DIAGNÓSTICO DETALLADO] Error en extracción de metadatos con OpenAI: ${errorMsg}`);
    
    // Información sobre posibles problemas de cuota o clave API
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || 
        errorMsg.includes('exceeded') || errorMsg.includes('billing') ||
        errorMsg.includes('key') || errorMsg.includes('API key')) {
      console.log(`⚠️ [ALERTA] Posible problema con la API key o límites de cuota de OpenAI`);
    }
    
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
    
    // Si el título existe pero está vacío o sólo tiene espacios, marcarlo como inválido de inmediato
    if (title !== undefined && title.trim() === '') {
      console.log(`⚠️ [DIAGNÓSTICO] Título vacío o solo con espacios, marcando como inválido sin consultar a OpenAI`);
      return {
        isTitleValid: false,
        isImageValid: imageUrl ? true : false,
        message: "El título está vacío",
      };
    }
    
    console.log(`🧠 [DIAGNÓSTICO] Preparando consulta a OpenAI para validación...`);
    

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en validación de metadatos de productos. Tu tarea es determinar si " +
            "el título y la URL de imagen proporcionados son válidos para un producto real. " +
            "Sé MODERADAMENTE ESTRICTO en tus evaluaciones.\n\n" +
            "Un título válido debe ser razonablemente descriptivo del producto. Títulos inválidos incluyen SOLAMENTE:\n" +
            "- Texto extremadamente genérico como 'Producto' o 'Artículo' sin ninguna otra descripción\n" +
            "- Títulos que SOLO contienen el nombre de una tienda sin información del producto (ej: solo 'Amazon.com')\n" +
            "- Títulos con texto de interfaz como 'Añadir al carrito', 'Detalles', 'Ver producto'\n" +
            "- Títulos que consisten exclusivamente en URLs o códigos\n" +
            "- Texto sin sentido como letras aleatorias\n" +
            "- Mensajes de error como 'Página no encontrada'\n\n" +
            "IMPORTANTE: Los siguientes tipos de títulos DEBEN considerarse VÁLIDOS:\n" +
            "- Títulos cortos pero descriptivos (incluso menores a 15 caracteres) si identifican el producto\n" +
            "- Títulos que contienen el nombre de la tienda seguido de descripción del producto\n" +
            "- Títulos simples pero específicos (ej: 'Reloj Tommy Hilfiger', 'Zapatillas Nike Air')\n" +
            "- Títulos que no indican todos los detalles pero son suficientes para identificar el producto\n\n" +
            "Una imagen válida debe ser una URL que parezca mostrar un producto real (no un placeholder o una imagen genérica).\n\n" +
            "Responde con un JSON que contenga:\n" +
            "- isTitleValid: boolean (true si el título permite identificar un producto concreto)\n" +
            "- isImageValid: boolean\n" +
            "- message: string (razón específica si algo es inválido)\n\n" +
            "IMPORTANTE: En caso de duda, marca el título como válido si permite al usuario identificar el producto.",
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
    
    // Registramos diagnóstico detallado del error para solucionar problemas
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(`🔴 [DIAGNÓSTICO DETALLADO] Error en validación OpenAI: ${errorMsg}`);
    
    // Información sobre posibles problemas de cuota o clave API
    if (errorMsg.includes('quota') || errorMsg.includes('rate limit') || 
        errorMsg.includes('exceeded') || errorMsg.includes('billing') ||
        errorMsg.includes('key') || errorMsg.includes('API key')) {
      console.log(`⚠️ [ALERTA] Posible problema con la API key o límites de cuota de OpenAI`);
    }
    
    // Si hay un error de API, asumimos que los datos son válidos para no bloquear el flujo
    return {
      isTitleValid: true, // En caso de error de API, asumimos que es válido
      isImageValid: true, // En caso de error de API, asumimos que es válida
      message: "Error durante la validación, asumiendo datos válidos para no bloquear el flujo"
    };
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