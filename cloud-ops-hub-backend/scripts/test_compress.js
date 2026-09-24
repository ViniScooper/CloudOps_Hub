const sharp = require('sharp');
const https = require('https');

const testUrl = 'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/prato-1790116467827-345848637.jpg';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
  });
}

async function testCompress() {
  console.log('Baixando imagem original de teste (Pastel Crocante - 8.13 MB)...');
  const start = Date.now();
  const rawBuf = await fetchBuffer(testUrl);
  console.log(`Baixado em ${Date.now() - start}ms. Tamanho Original: ${(rawBuf.length / (1024 * 1024)).toFixed(2)} MB (${rawBuf.length} bytes)`);

  const compStart = Date.now();
  const webpBuf = await sharp(rawBuf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  const originalKb = (rawBuf.length / 1024).toFixed(1);
  const webpKb = (webpBuf.length / 1024).toFixed(1);
  const reduction = ((1 - webpBuf.length / rawBuf.length) * 100).toFixed(1);

  console.log(`Comprimido em ${Date.now() - compStart}ms!`);
  console.log(`De: ${originalKb} KB`);
  console.log(`Para: ${webpKb} KB`);
  console.log(`Redução: ${reduction}% MENOR!`);
}

testCompress().catch(console.error);
