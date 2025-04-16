const fetch = require('node-fetch');
const fs = require('fs');

async function downloadAmazonPage() {
  try {
    // Estos headers simulan un navegador real con cookies y todas las opciones necesarias
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Referer': 'https://www.google.com/',
      'Upgrade-Insecure-Requests': '1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
      'Cookie': 'i18n-prefs=EUR; sp-cdn="L5Z9:ES"; session-id=142-6744403-4801341; session-id-time=2082787201l'
    };

    console.log('Descargando la página de Amazon...');
    const response = await fetch('https://www.amazon.es/Hercules-DJMonitor-32-Monitores-activos/dp/B07JH148DF/', { 
      headers,
      // Importante: sigue las redirecciones
      redirect: 'follow',
      // Timeout más largo para asegurar que carga completamente
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const pageContent = await response.text();
    console.log(`Página descargada: ${pageContent.length} bytes`);
    
    // Guardar la página completa
    fs.writeFileSync('amazon_hercules_complete.html', pageContent);
    
    // Buscar específicamente el precio 63,42
    const priceMatches = pageContent.match(/63[\.,]42/g);
    if (priceMatches) {
      console.log('¡Encontrado precio 63,42!');
      
      // Buscar el contexto alrededor del precio
      const index = pageContent.indexOf('63,42');
      if (index !== -1) {
        const start = Math.max(0, index - 500);
        const end = Math.min(pageContent.length, index + 500);
        const context = pageContent.substring(start, end);
        
        // Guardar solo el contexto relevante
        fs.writeFileSync('amazon_hercules_price_context.html', context);
        console.log('Contexto alrededor del precio guardado en amazon_hercules_price_context.html');
      }
    } else {
      console.log('No se encontró el precio 63,42 en la página');
    }
    
    // Buscar patrones de precio en el HTML
    const pricePatterns = [
      // Datos JSON en atributos de elementos
      /"priceAmount":([0-9.]+)/g,
      /"price":["']?([0-9.,]+)["']?/g,
      // Scripts con datos de precio
      /priceValue.*?([0-9.,]+)/g,
      // Elementos HTML con precio
      /a-offscreen["']>([^<]+)</g,
      // Formato de descuento
      /-[0-9]+%.*?([0-9.,]+)/g
    ];
    
    console.log('Buscando patrones de precio:');
    for (const pattern of pricePatterns) {
      const matches = pageContent.matchAll(pattern);
      for (const match of matches) {
        console.log(`- Patrón ${pattern}: ${match[0]} -> ${match[1]}`);
      }
    }
    
    // Buscar scripts que contengan precios
    const scriptTags = pageContent.match(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi);
    if (scriptTags) {
      console.log(`Encontrados ${scriptTags.length} scripts`);
      
      for (let i = 0; i < Math.min(scriptTags.length, 20); i++) {
        const script = scriptTags[i];
        if (script.includes('price') || script.includes('Price') || script.includes('63,42')) {
          console.log(`\nScript relevante #${i}:`);
          // Limitamos a 200 caracteres para no inundar la consola
          console.log(script.substring(0, 200) + '...');
          
          if (script.includes('63,42')) {
            console.log('¡ESTE SCRIPT CONTIENE EL PRECIO CORRECTO!');
            fs.writeFileSync(`amazon_script_with_price_${i}.js`, script);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

downloadAmazonPage();
