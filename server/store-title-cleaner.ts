/**
 * Módulo especializado para limpiar títulos de productos de tiendas online
 * Elimina menciones de nombres de dominio, sufijos/prefijos comunes, etc.
 */

/**
 * Limpia títulos de productos eliminando nombres de dominio y elementos comunes
 * que no son relevantes para el título del producto
 */
export function cleanStoreDomainFromTitle(title: string, sourceUrl: string): string {
  if (!title) return title;
  
  // Extraer la información del dominio
  let domain = '';
  try {
    const urlObj = new URL(sourceUrl);
    domain = urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    console.log('Error extrayendo dominio de URL:', e);
  }
  
  // Limpieza general para todos los títulos
  let cleanedTitle = title
    // Eliminar el dominio completo y variaciones con subdominios
    .replace(new RegExp(`\\s*[-|:]?\\s*${domain}\\s*$`, 'i'), '')
    // Eliminar patrones de subdominios comunes (es., en., eu., etc.)
    .replace(/\s*[-|:]?\s*\w+\.[a-z]+\.(com|es|net|org|co\.uk|de|fr|it|mx)\s*$/i, '')
    // Eliminar cualquier otra variante de dominio de tienda
    .replace(/\s*[-|:]?\s*\w+\.(com|es|net|org|co\.uk|de|fr|it|mx)\s*$/i, '')
    // Eliminar inicio común "Comprar en" o "Buy from" 
    .replace(/^(Comprar en|Buy from|Shop at|Kaufen bei)\s+/i, '')
    // Eliminar separadores comunes seguidos del dominio
    .replace(/\s*(\||–|-|:|at)\s+[\w-]+\.(com|es|net|org|co\.uk|de|fr|it|mx)\s*$/i, '')
    // Eliminar separadores comunes al inicio
    .replace(/^(\||–|-|:|at)\s+/i, '');
  
  // Limpieza específica para stores comunes que no están ya cubiertos en otras partes
  
  // Zara y otras del grupo Inditex
  if (domain.includes('zara.') || domain.includes('bershka.') || 
      domain.includes('pullandbear.') || domain.includes('massimodutti.') ||
      domain.includes('stradivarius.') || domain.includes('oysho.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*ZARA(\s+\w+)?\s*$/i, '')
      .replace(/\s*[-|]?\s*Bershka(\s+\w+)?\s*$/i, '')
      .replace(/\s*[-|]?\s*Pull\s*&\s*Bear(\s+\w+)?\s*$/i, '')
      .replace(/\s*[-|]?\s*Massimo\s*Dutti(\s+\w+)?\s*$/i, '')
      .replace(/\s*[-|]?\s*Stradivarius(\s+\w+)?\s*$/i, '')
      .replace(/\s*[-|]?\s*Oysho(\s+\w+)?\s*$/i, '');
  }
  
  // El Corte Inglés
  if (domain.includes('elcorteingles.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*El\s*Corte\s*Ingl[ée]s\s*$/i, '')
      .replace(/\s*[-|]?\s*ECI\s*$/i, '');
  }
  
  // Miravia (Aliexpress)
  if (domain.includes('miravia.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*Miravia\s*$/i, '')
      .replace(/\s*[-|]?\s*Miravia\.es\s*$/i, '')
      .replace(/\s*[-|]?\s*es\.Miravia\.com\s*$/i, '');
  }
  
  // Decathlon
  if (domain.includes('decathlon.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*Decathlon\s*$/i, '')
      .replace(/\s*[-|]?\s*Decathlon\.es\s*$/i, '')
      .replace(/\s*[-|]?\s*Decathlon\.(com|fr|co\.uk|de|it|mx)\s*$/i, '');
  }
  
  // MediaMarkt
  if (domain.includes('mediamarkt.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*MediaMarkt\s*$/i, '')
      .replace(/\s*[-|]?\s*Media\s*Markt\s*$/i, '');
  }
  
  // PC Componentes
  if (domain.includes('pccomponentes.')) {
    cleanedTitle = cleanedTitle
      .replace(/\s*[-|]?\s*PCComponentes\s*$/i, '')
      .replace(/\s*[-|]?\s*PC\s*Componentes\s*$/i, '');
  }
  
  // General: Limpiar cualquier otra tienda conocida
  cleanedTitle = cleanedTitle
    // Nike
    .replace(/\s*[-|]?\s*Nike\s*$/i, '')
    // Carrefour
    .replace(/\s*[-|]?\s*Carrefour\s*$/i, '')
    // Ikea
    .replace(/\s*[-|]?\s*IKEA\s*$/i, '')
    // Leroy Merlin
    .replace(/\s*[-|]?\s*Leroy\s*Merlin\s*$/i, '')
    // Mercadona
    .replace(/\s*[-|]?\s*Mercadona\s*$/i, '')
    // Adidas
    .replace(/\s*[-|]?\s*Adidas\s*$/i, '')
    // Amazon (por si acaso no está cubierto en otras partes)
    .replace(/\s*[-|]?\s*Amazon\s*$/i, '')
    // Walmart
    .replace(/\s*[-|]?\s*Walmart\s*$/i, '')
    // eBay
    .replace(/\s*[-|]?\s*eBay\s*$/i, '')
    // AliExpress (por si acaso no está cubierto en otras partes)
    .replace(/\s*[-|]?\s*AliExpress\s*$/i, '')
    // Cualquier otra referencia a compra, precio, etc.
    .replace(/\s*[-|]?\s*Comprar Online\s*$/i, '')
    .replace(/\s*[-|]?\s*Comprar\s*$/i, '')
    .replace(/\s*[-|]?\s*Buy Now\s*$/i, '')
    .replace(/\s*[-|]?\s*Buy Online\s*$/i, '')
    .replace(/\s*[-|]?\s*al mejor precio\s*$/i, '')
    .replace(/\s*[-|]?\s*Best Price\s*$/i, '');
  
  // General: Limpiar cualquier URL que haya quedado
  cleanedTitle = cleanedTitle
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/www\.\S+/gi, '');
  
  // Limpiar espacios en blanco
  cleanedTitle = cleanedTitle.trim();
  
  // Si después de todas las limpiezas el título queda muy corto, devolver el original
  if (cleanedTitle.length < 3) {
    return title.trim();
  }
  
  return cleanedTitle;
}