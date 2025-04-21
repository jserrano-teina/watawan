#!/usr/bin/env node

const fetch = require("node-fetch");

async function testZaraExtraction() {
  const url = "https://www.zara.com/es/es/-c-a-m-i-s-a---p-o-l-o---1-0-0---l-i-n-o--p04337181.html";
  try {
    console.log("Probando extracción para:", url);
    const response = await fetch(`http://localhost:5000/api/extract-metadata?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const data = await response.json();
    console.log("Resultado:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
}

testZaraExtraction();
