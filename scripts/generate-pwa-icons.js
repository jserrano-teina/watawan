import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas
const ICONS_DIR = path.join(__dirname, '../client/public/icons');

// Función para convertir SVG a PNG
async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Convertido: ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`Error al convertir ${svgPath}:`, error);
  }
}

// Generar iconos de la aplicación
async function generateAppIcons() {
  const sizes = [192, 512];
  const svgPath = path.join(ICONS_DIR, 'icon.svg');
  
  for (const size of sizes) {
    const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
    await convertSvgToPng(svgPath, outputPath, size);
  }
}

// Generar iconos para accesos directos
async function generateShortcutIcons() {
  const shortcuts = ['add', 'share'];
  const size = 192;
  
  for (const shortcut of shortcuts) {
    const svgPath = path.join(ICONS_DIR, `${shortcut}.svg`);
    const outputPath = path.join(ICONS_DIR, `${shortcut}-${size}x${size}.png`);
    await convertSvgToPng(svgPath, outputPath, size);
  }
}

// Ejecutar la generación de iconos
async function main() {
  try {
    console.log('Generando iconos para PWA...');
    await generateAppIcons();
    await generateShortcutIcons();
    console.log('Iconos generados correctamente');
  } catch (error) {
    console.error('Error al generar iconos:', error);
  }
}

main();