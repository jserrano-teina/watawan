/**
 * Script de prueba para depurar la extracción de metadatos de AliExpress
 */

import { extractAliExpressData, extractAliExpressProductId, buildImageUrl } from './aliexpress-special';

// URL de ejemplo de AliExpress
const testUrl = "https://es.aliexpress.com/item/1005006342357549.html";

async function testAliExpressExtraction() {
  console.log("Iniciando prueba de extracción de AliExpress");
  console.log(`URL de prueba: ${testUrl}`);

  // Paso 1: Extraer ID de producto
  const productId = extractAliExpressProductId(testUrl);
  console.log(`ID de producto extraído: ${productId || 'No se pudo extraer'}`);

  if (productId) {
    // Paso 2: Construir URL de imagen directamente
    const directImageUrl = buildImageUrl(productId);
    console.log(`URL de imagen construida: ${directImageUrl}`);
  }

  // Paso 3: Intentar extracción completa
  try {
    console.log("Iniciando extracción completa...");
    const result = await extractAliExpressData(testUrl);
    
    console.log("Resultado de la extracción:");
    console.log(`- Título: ${result.title || 'No extraído'}`);
    console.log(`- Imagen: ${result.imageUrl || 'No extraída'}`);
    console.log(`- Título válido: ${result.isTitleValid ? 'Sí' : 'No'}`);
    console.log(`- Imagen válida: ${result.isImageValid ? 'Sí' : 'No'}`);
    
    return result;
  } catch (error) {
    console.error("Error durante la extracción:", error);
  }
}

// Ejecutar la prueba
testAliExpressExtraction().then(() => {
  console.log("Prueba finalizada");
  process.exit(0);
}).catch(error => {
  console.error("Error en la prueba:", error);
  process.exit(1);
});