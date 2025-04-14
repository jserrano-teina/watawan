const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorio de iconos
const ICONS_DIR = path.join(__dirname, '../client/public/icons');

// Convierte SVG a PNG con el tamaño especificado
async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Generado: ${outputPath}`);
  } catch (error) {
    console.error(`Error al generar ${outputPath}:`, error);
  }
}

async function generateShortcutIcons() {
  const shortcuts = [
    { 
      source: path.join(ICONS_DIR, 'add-icon.svg'),
      target: path.join(ICONS_DIR, 'add-192x192.png'),
      size: 192
    },
    { 
      source: path.join(ICONS_DIR, 'share-icon.svg'),
      target: path.join(ICONS_DIR, 'share-192x192.png'),
      size: 192
    }
  ];

  console.log('🔄 Generando iconos para accesos directos...');
  
  for (const { source, target, size } of shortcuts) {
    if (!fs.existsSync(source)) {
      console.error(`❌ Error: No se encontró el archivo ${source}`);
      continue;
    }
    await convertSvgToPng(source, target, size);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando generación de iconos para accesos directos...');
  
  try {
    await generateShortcutIcons();
    console.log('✅ Generación de iconos completada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la generación de iconos:', error);
  }
}

// Ejecutar
main();