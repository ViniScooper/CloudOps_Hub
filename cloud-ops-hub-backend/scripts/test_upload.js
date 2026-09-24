const common = require('oci-common');
const os = require('oci-objectstorage');
const sharp = require('sharp');
const https = require('https');

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

async function testUpload() {
  const provider = new common.ConfigFileAuthenticationDetailsProvider();
  const client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
  
  // Imagem de teste pequena
  const rawBuf = await fetchBuffer('https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/prato-1790116467827-345848637.jpg');
  const webpBuf = await sharp(rawBuf)
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 80, effort: 4 })
    .toBuffer();

  console.log(`Buffer WebP gerado: ${webpBuf.length} bytes`);

  const putReq = {
    namespaceName: 'gr88wz9mdro0',
    bucketName: 'boteco-sivirino-fotos',
    objectName: 'opt-teste-pastel.webp',
    putObjectBody: webpBuf,
    contentType: 'image/webp'
  };

  console.log('Enviando para o bucket boteco-sivirino-fotos...');
  await client.putObject(putReq);
  console.log('Upload concluído com sucesso!');
  console.log('URL pública:', 'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/opt-teste-pastel.webp');
}

testUpload().catch(console.error);
