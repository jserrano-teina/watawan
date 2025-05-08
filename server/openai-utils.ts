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
            "Tu tarea es extraer cualquier texto que pueda funcionar como título del producto, la descripción, y la URL de la imagen " +
            "del HTML proporcionado.\n\n" +
            "Para el título del producto:\n" +
            "- Extrae CUALQUIER texto que pueda identificar mínimamente el producto\n" +
            "- Es mejor incluir un título imperfecto que no incluir ninguno\n" +
            "- Acepta títulos simples, cortos o incluso con poca información\n" +
            "- Es válido incluir el nombre de la tienda si aparece junto al nombre del producto\n" +
            "- Si hay varias opciones, elige la que tenga más información sobre el producto\n" +
            "- SOLO evita textos que son claramente mensajes de error o URLs completas\n\n" +
            "Para la imagen:\n" +
            "- Extrae cualquier URL de imagen que parezca mostrar el producto\n\n" +
            "Responde solo con JSON válido en el formato especificado. Si no encuentras un campo con total certeza, proporciona la mejor alternativa posible, incluso si no es perfecta.",
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
    // Incluso en caso de error, intentamos devolver algo útil basado en la URL
    const parts = url.split('/');
    let guessedTitle = parts[parts.length - 1] || parts[parts.length - 2] || '';
    
    // Limpiar el título adivinado
    guessedTitle = guessedTitle
      .replace(/-/g, ' ')
      .replace(/\+/g, ' ')
      .replace(/\.(html|htm|php|aspx|jsp)$/, '')
      .replace(/[0-9a-f]{32}/, '') // Remover posibles hashes
      .trim();
      
    if (guessedTitle && guessedTitle.length > 3) {
      // Convertir primera letra de cada palabra a mayúscula para mejor presentación
      guessedTitle = guessedTitle.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`⚠️ Usando título inferido de la URL: "${guessedTitle}"`);
      return { title: guessedTitle };
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

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "Eres un experto en validación de metadatos de productos que trabaja con una filosofía extremadamente inclusiva. " +
            "Tu tarea es determinar si el título y la URL de imagen proporcionados tienen alguna posibilidad de referirse a un producto real. " +
            "ASUMIR QUE SI por defecto.\n\n" +
            "IMPORTANTE: Casi TODOS los títulos deben considerarse VÁLIDOS, incluyendo:\n" +
            "- Títulos que incluyen el nombre de tiendas (como 'Amazon', 'Zara', etc.)\n" +
            "- Títulos cortos (incluso de 2-3 palabras si tienen algún sentido)\n" +
            "- Títulos con poca información pero que puedan referirse a un producto\n" +
            "- Títulos que contienen alguna palabra descriptiva, incluso si es genérica\n" +
            "- Títulos con errores ortográficos o gramaticales\n" +
            "- Títulos en cualquier idioma\n" +
            "- Títulos incompletos pero que tengan suficiente información para orientar al usuario\n\n" +
            "SOLAMENTE debes marcar como INVÁLIDOS los siguientes casos:\n" +
            "- Texto que es 100% un mensaje de error (ej: exactamente 'Error 404', 'Página no encontrada')\n" +
            "- Una URL completa (que empiece con http:// o https://)\n" +
            "- Letras o números completamente aleatorios sin sentido\n" +
            "- Solo la palabra 'Producto' o 'Artículo' sin ninguna otra información\n\n" +
            "La imagen siempre debe considerarse válida a menos que sea obviamente un icono de error.\n\n" +
            "Responde con un JSON simple que contenga:\n" +
            "- isTitleValid: boolean (debe ser true en casi todos los casos)\n" +
            "- isImageValid: boolean (debe ser true en casi todos los casos)\n" +
            "- message: string (en blanco si es válido, o una explicación mínima si es inválido)\n\n" +
            "EN CASO DE DUDA, SIEMPRE VALIDA EL TÍTULO. Es mejor aceptar un título malo que rechazar uno bueno.",
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
      isTitleValid: true, // En caso de error, asumimos que ES válido para no bloquear flujo
      isImageValid: true, // Asumimos imagen válida también
      message: "Error durante la validación, asumiendo datos válidos para continuar"
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