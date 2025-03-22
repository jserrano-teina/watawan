import metascraper from 'metascraper';
import metascraperImage from 'metascraper-image';
import fetch from 'node-fetch';

const scraper = metascraper([
  metascraperImage(),
]);

export async function getUrlMetadata(url: string): Promise<{ imageUrl: string | undefined }> {
  try {
    // Validar el formato de la URL
    const urlRegex = /^(http|https):\/\/[^ "]+$/;
    if (!urlRegex.test(url)) {
      return { imageUrl: undefined };
    }

    // Obtener el contenido de la página
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

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
    console.error(`Error al obtener metadata para ${url}:`, error);
    return { imageUrl: undefined };
  }
}