const common = require('oci-common');
const os = require('oci-objectstorage');

async function test() {
  try {
    console.log('Criando provider a partir do ~/.oci/config...');
    const provider = new common.ConfigFileAuthenticationDetailsProvider();
    const client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
    
    console.log('Buscando namespace...');
    const ns = await client.getNamespace({});
    console.log('Namespace:', ns.value);

    console.log('Listando objetos no bucket boteco-sivirino-fotos...');
    const listReq = {
      namespaceName: ns.value,
      bucketName: 'boteco-sivirino-fotos',
      fields: 'name,size,timeCreated,md5'
    };
    const listRes = await client.listObjects(listReq);
    const objects = listRes.listObjects.objects || [];
    console.log(`Total de objetos encontrados: ${objects.length}`);
    
    let totalBytes = 0;
    for (const obj of objects) {
      totalBytes += obj.size || 0;
      const mb = ((obj.size || 0) / (1024 * 1024)).toFixed(2);
      console.log(`- ${obj.name}: ${mb} MB (${obj.size} bytes)`);
    }
    console.log(`Tamanho total: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  } catch (err) {
    console.error('Erro ao testar oci-sdk:', err);
  }
}

test();
