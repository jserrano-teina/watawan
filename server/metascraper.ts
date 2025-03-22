import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import fetch from 'node-fetch';

const scraper = metascraper([
  metascraperImage(),
]);

// URLs específicas para sitios populares
const SITE_PATTERNS = [
  {
    pattern: /amazon\.(com|es|mx|co|uk|de|fr|it|nl|jp|ca)/i,
    handler: extractAmazonImage
  },
  // Podemos añadir más sitios específicos aquí
];

// Función específica para extraer imágenes de Amazon
async function extractAmazonImage(url: string): Promise<string | undefined> {
  try {
    // Maneja las URLs cortas de Amazon (amzn.to, amzn.eu, etc)
    if (url.match(/amzn\.(to|eu)/i)) {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        if (response.url) {
          url = response.url; // Obtenemos la URL real después de redirecciones
        }
      } catch (error) {
        console.warn("No se pudo resolver la URL corta de Amazon:", error);
      }
    }

    // Intenta extraer el ID del producto de la URL
    const productIdMatch = url.match(/\/([A-Z0-9]{10})(\?|\/|$)/);
    if (!productIdMatch) {
      return undefined;
    }

    const productId = productIdMatch[1];
    
    // URL de imagen básica de Amazon (imagen mediana)
    return `https://m.media-amazon.com/images/I/${productId}._AC_SL500_.jpg`;
  } catch (error) {
    console.error("Error al extraer imagen de Amazon:", error);
    return undefined;
  }
}

export async function getUrlMetadata(url: string): Promise<{ imageUrl: string | undefined }> {
  try {
    // Validar el formato de la URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      return { imageUrl: undefined };
    }

    // Comprobar si tenemos un extractor específico para este sitio
    for (const site of SITE_PATTERNS) {
      if (url.match(site.pattern)) {
        const specificImage = await site.handler(url);
        if (specificImage) {
          return { imageUrl: specificImage };
        }
        break; // Si el handler específico no encuentra imagen, continuamos con el método genérico
      }
    }

    // Método genérico de extracción
    try {
      // Obtener el contenido de la página
      // Usando AbortController para manejar timeout manualmente ya que fetch no tiene opción de timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });
      
      // Limpiar el timeout
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`No se pudo obtener el contenido de ${url}. Código de estado: ${response.status}`);
        return { imageUrl: undefined };
      }

      const html = await response.text();
      
      // Extraer metadata
      const metadata = await scraper({ html, url });
      
      // Asegurarnos de que image es string o undefined
      const imageUrl = metadata.image ? String(metadata.image) : undefined;
      
      return { imageUrl };
    } catch (error) {
      console.warn(`Error en el método genérico para ${url}:`, error);
      return { imageUrl: undefined };
    }
  } catch (error) {
    console.error(`Error al obtener metadata para ${url}:`, error);
    return { imageUrl: undefined };
  }
}