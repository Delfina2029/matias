const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY="?([^"\s]+)"?/);

if (!keyMatch) {
  console.error('No se encontró GEMINI_API_KEY en el archivo .env');
  process.exit(1);
}

const apiKey = keyMatch[1];
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log('Consultando modelos para la clave:', apiKey.substring(0, 8) + '...');

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log('Modelos disponibles:');
        json.models.forEach(m => console.log(`- ${m.name}`));
      } else {
        console.error('Respuesta inesperada:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.error('Error al parsear JSON:', e.message);
      console.log('Data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error de red:', err.message);
});
