const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const s3 = new S3Client({
  region: 'sa-saopaulo-1',
  endpoint: 'https://compat.objectstorage.sa-saopaulo-1.oraclecloud.com',
  credentials: {
    accessKeyId: '7f0368e0766684b28d9031d0caaa56c542aaee3a',
    secretAccessKey: 'yQ+YqrRLhMhJrpsx0zruFxQ+QYvDZIOO9AZA1PZKPf8='
  },
  forcePathStyle: true
});

async function main() {
  console.log('Testando endpoint compat.objectstorage.sa-saopaulo-1.oraclecloud.com...');
  try {
    const res = await s3.send(new ListObjectsV2Command({ Bucket: 'boteco-sivirino-fotos' }));
    console.log('Sucesso! Objetos:', res.Contents?.length || 0);
    (res.Contents || []).forEach(o => {
      console.log(`- ${o.Key}: ${(o.Size / (1024 * 1024)).toFixed(2)} MB`);
    });
  } catch (err) {
    console.error('Erro ao listar:', err);
  }
}

main();
