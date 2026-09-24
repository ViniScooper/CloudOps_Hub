const common = require('oci-common');
const os = require('oci-objectstorage');
const sharp = require('sharp');
const https = require('https');
const { runRemoteSsh } = require('../src/deployService');

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Falha HTTP ${res.statusCode} ao baixar: ${url}`));
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== INICIANDO OTIMIZAÇÃO GLOBAL DE IMAGENS DO CARDÁPIO ===\n');

  // 1. Inicializar cliente OCI
  const provider = new common.ConfigFileAuthenticationDetailsProvider();
  const client = new os.ObjectStorageClient({ authenticationDetailsProvider: provider });
  const namespace = 'gr88wz9mdro0';
  const bucketName = 'boteco-sivirino-fotos';

  // 2. Buscar pratos do banco MySQL
  console.log('1. Consultando pratos no MySQL (boteco_db)...');
  const sql = "SELECT id, nome, imagem FROM restaurante.prato WHERE imagem IS NOT NULL AND imagem != '';";
  const res = await runRemoteSsh(`docker exec boteco_db mysql -u root -pviniZIKA3103 -e "${sql}" 2>/dev/null`);

  if (!res.stdout) {
    console.error('Nenhum prato retornado pelo MySQL!');
    return;
  }

  const lines = res.stdout.split('\n').filter(l => l.trim().length > 0);
  const rows = lines.slice(1); // pula cabeçalho

  console.log(`Encontrados ${rows.length} itens com imagem cadastrada.\n`);

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;
  let optimizedCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const [id, nome, imagem] = row.split('\t');
    if (!imagem || !imagem.startsWith('http')) {
      console.log(`[PULADO] ID ${id} (${nome}): imagem local ou inválida (${imagem})`);
      skippedCount++;
      continue;
    }

    if (imagem.includes('opt-') && imagem.endsWith('.webp')) {
      console.log(`[JÁ OTIMIZADO] ID ${id} (${nome}): já está em WebP otimizado.`);
      skippedCount++;
      continue;
    }

    console.log(`\n-> Otimizando prato ID ${id} - "${nome}"...`);
    try {
      const startDownload = Date.now();
      const rawBuf = await fetchBuffer(imagem);
      const downloadMs = Date.now() - startDownload;
      const rawSize = rawBuf.length;
      totalOriginalBytes += rawSize;

      // Comprimir com sharp
      const startCompress = Date.now();
      const webpBuf = await sharp(rawBuf)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
      const compressMs = Date.now() - startCompress;
      const optSize = webpBuf.length;
      totalOptimizedBytes += optSize;

      // Gerar nome único
      const optKey = `opt-prato-${id}-${Date.now()}.webp`;

      // Upload para OCI Object Storage
      const putReq = {
        namespaceName: namespace,
        bucketName: bucketName,
        objectName: optKey,
        putObjectBody: webpBuf,
        contentType: 'image/webp'
      };
      await client.putObject(putReq);

      const newUrl = `https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/${namespace}/b/${bucketName}/o/${optKey}`;

      // Atualizar no banco MySQL
      const updateSql = `UPDATE restaurante.prato SET imagem = '${newUrl}' WHERE id = ${id};`;
      await runRemoteSsh(`docker exec boteco_db mysql -u root -pviniZIKA3103 -e "${updateSql}" 2>/dev/null`);

      const reductionPct = ((1 - optSize / rawSize) * 100).toFixed(1);
      console.log(`   [SUCESSO] ${nome}:`);
      console.log(`   - Original: ${(rawSize / 1024).toFixed(1)} KB (baixado em ${downloadMs}ms)`);
      console.log(`   - WebP Otimizado: ${(optSize / 1024).toFixed(1)} KB (comprimido em ${compressMs}ms)`);
      console.log(`   - Economia: ${reductionPct}% MENOR!`);
      console.log(`   - Nova URL: ${newUrl}`);

      optimizedCount++;
    } catch (err) {
      console.error(`   [ERRO] Falha ao otimizar prato ${id} (${nome}):`, err.message);
    }
  }

  console.log('\n==================================================');
  console.log('=== RELATÓRIO FINAL DE OTIMIZAÇÃO ===');
  console.log(`Pratos otimizados: ${optimizedCount}`);
  console.log(`Pratos pulados / já otimizados: ${skippedCount}`);
  console.log(`Tamanho Original Total: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Tamanho Otimizado Total: ${(totalOptimizedBytes / (1024 * 1024)).toFixed(2)} MB`);
  if (totalOriginalBytes > 0) {
    const totalReduction = ((1 - totalOptimizedBytes / totalOriginalBytes) * 100).toFixed(1);
    console.log(`REDUÇÃO TOTAL DE TRÁFEGO: ${totalReduction}% de economia!`);
  }
  console.log('==================================================\n');
}

main().catch(console.error);
