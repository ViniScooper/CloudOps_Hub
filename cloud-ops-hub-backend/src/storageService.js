const { runRemoteSsh } = require('./deployService');

const BUCKET_BASE_URL = 'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/';

async function listStorageObjects() {
  try {
    // 1. Consulta fotos reais cadastradas pelo cliente no banco MySQL
    const sql = "SELECT id, nome, categoria, imagem, preco, criado_em FROM restaurante.prato WHERE imagem IS NOT NULL AND imagem != '' ORDER BY id DESC;";
    const res = await runRemoteSsh(`docker exec boteco_db mysql -u root -pviniZIKA3103 -e "${sql}" 2>/dev/null`);

    const files = [];

    if (res.stdout) {
      const lines = res.stdout.split('\n').filter(l => l.trim().length > 0);
      // Pula o cabeçalho (id, nome, categoria...)
      const rows = lines.slice(1);

      for (const row of rows) {
        const cols = row.split('\t');
        if (cols.length >= 4) {
          const id = cols[0];
          const nome = cols[1];
          const categoria = cols[2] || 'Pratos';
          const imagem = cols[3];
          const preco = cols[4] || '0.00';
          const criadoEm = cols[5] || 'Recente';

          if (!imagem || imagem === 'NULL') continue;

          const fileName = imagem.includes('/o/') ? decodeURIComponent(imagem.split('/o/').pop()) : imagem;

          // Categorização amigável
          let cat = 'Pratos';
          const lowerCat = (categoria || '').toLowerCase();
          if (lowerCat.includes('bebida') || lowerCat.includes('cerveja') || lowerCat.includes('drink')) {
            cat = 'Bebidas';
          } else if (lowerCat.includes('sobremesa') || lowerCat.includes('doce')) {
            cat = 'Sobremesas';
          } else if (lowerCat.includes('banner')) {
            cat = 'Banners';
          } else if (lowerCat.includes('petisco') || lowerCat.includes('especialidade') || lowerCat.includes('espetinho') || lowerCat.includes('pizza') || lowerCat.includes('caldinho')) {
            cat = 'Pratos';
          }

          files.push({
            id: `img-${id}`,
            name: fileName,
            label: nome,
            category: cat,
            size: '500 KB',
            bytes: 512000,
            uploadedAt: criadoEm,
            dimensions: 'Original OCI',
            url: imagem,
            previewUrl: imagem,
            type: 'image',
            price: `R$ ${parseFloat(preco).toFixed(2)}`
          });
        }
      }
    }

    // 2. Consulta backups reais do MySQL salvos na VM
    try {
      const backupRes = await runRemoteSsh('ls -lh /home/ubuntu/backups/ 2>/dev/null || true');
      if (backupRes.stdout) {
        const bLines = backupRes.stdout.split('\n').filter(l => l.includes('.sql.gz'));
        for (const bLine of bLines) {
          const parts = bLine.trim().split(/\s+/);
          if (parts.length >= 9) {
            const bSize = parts[4];
            const bName = parts[8];
            files.push({
              id: `bkp-${bName}`,
              name: bName,
              label: `Backup MySQL: ${bName}`,
              category: 'Backups',
              size: bSize,
              bytes: 14000000,
              uploadedAt: 'Automático (Watchdog)',
              url: `${BUCKET_BASE_URL}${bName}`,
              previewUrl: '',
              type: 'archive'
            });
          }
        }
      }
    } catch {}

    return {
      success: true,
      bucket: 'boteco-sivirino-fotos',
      region: 'sa-saopaulo-1 (GRU)',
      total: files.length,
      files
    };
  } catch (err) {
    throw new Error(`Falha ao consultar fotos reais do storage: ${err.message}`);
  }
}

module.exports = {
  listStorageObjects,
  BUCKET_BASE_URL
};
