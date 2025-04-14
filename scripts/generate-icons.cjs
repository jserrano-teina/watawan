const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Directorio de iconos
const ICONS_DIR = path.join(__dirname, '../client/public/icons');
const SOURCE_SVG = path.join(ICONS_DIR, 'logo.svg');

// Asegúrate de que existe el directorio de iconos
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

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

// Genera los iconos de la aplicación
async function generateAppIcons() {
  if (!fs.existsSync(SOURCE_SVG)) {
    console.error('❌ Error: No se encontró el archivo logo.svg en la carpeta de iconos.');
    return;
  }

  const sizes = [
    { size: 72, name: 'icon-72x72.png' },
    { size: 96, name: 'icon-96x96.png' },
    { size: 128, name: 'icon-128x128.png' },
    { size: 144, name: 'icon-144x144.png' },
    { size: 152, name: 'icon-152x152.png' },
    { size: 192, name: 'icon-192x192.png' },
    { size: 384, name: 'icon-384x384.png' },
    { size: 512, name: 'icon-512x512.png' },
  ];

  console.log('🔄 Generando iconos de la aplicación...');
  
  for (const { size, name } of sizes) {
    await convertSvgToPng(
      SOURCE_SVG,
      path.join(ICONS_DIR, name),
      size
    );
  }
}

// Genera los iconos Apple Touch
async function generateAppleTouchIcons() {
  const sizes = [
    { size: 152, name: 'apple-touch-icon-152x152.png' },
    { size: 167, name: 'apple-touch-icon-167x167.png' },
    { size: 180, name: 'apple-touch-icon-180x180.png' },
    { size: 1024, name: 'apple-touch-icon-1024x1024.png' },
  ];

  console.log('🔄 Generando Apple Touch Icons...');
  
  for (const { size, name } of sizes) {
    await convertSvgToPng(
      SOURCE_SVG,
      path.join(ICONS_DIR, name),
      size
    );
  }
  
  // Crear el archivo apple-touch-icon.png por defecto
  await convertSvgToPng(
    SOURCE_SVG,
    path.join(ICONS_DIR, 'apple-touch-icon.png'),
    180
  );
}

// Función principal que ejecuta todo el proceso
async function main() {
  console.log('🚀 Iniciando generación de iconos para PWA...');
  
  try {
    await generateAppIcons();
    await generateAppleTouchIcons();
    
    console.log('✅ Generación de iconos completada con éxito.');
  } catch (error) {
    console.error('❌ Error durante la generación de iconos:', error);
  }
}

// Ejecuta el script
main();