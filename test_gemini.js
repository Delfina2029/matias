const https = require('https');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/GEMINI_API_KEY="?([^"\s]+)"?/);
const apiKey = keyMatch[1];

const payload = JSON.stringify({
  contents: [{ parts: [{ text: 'Hola, di test' }] }]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

console.log('Probando Gemini con la clave...');

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (d) => data += d);
  res.on('end', () => {
    console.log('Status code:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();
