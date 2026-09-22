const { runRemoteSsh } = require('./deployService');

// Executa backup do banco MySQL (container boteco_db)
async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_restaurante_${timestamp}.sql.gz`;
  const backupDir = '/home/ubuntu/backups';

  // Cria diretório se não existir, gera dump e compacta em gzip em tempo real
  const cmd = `mkdir -p ${backupDir} && docker exec boteco_db mysqldump -u root -pviniZIKA3103 --single-transaction --quick restaurante 2>/dev/null | gzip -9 > ${backupDir}/${filename} && ls -lh ${backupDir}/${filename}`;

  const res = await runRemoteSsh(cmd);

  if (res.code !== 0 && !res.stdout) {
    throw new Error(res.stderr || 'Falha ao executar dump do MySQL no container boteco_db');
  }

  // Remove backups com mais de 7 dias para economizar disco na VM
  runRemoteSsh(`find ${backupDir} -type f -name "*.sql.gz" -mtime +7 -delete`).catch(() => {});

  const fileInfo = (res.stdout || '').split('\n').pop().trim();

  return {
    success: true,
    filename,
    path: `${backupDir}/${filename}`,
    details: fileInfo,
    timestamp: new Date().toISOString()
  };
}

// Lista os backups existentes na VM
async function listBackups() {
  const backupDir = '/home/ubuntu/backups';
  const cmd = `mkdir -p ${backupDir} && ls -lh --time-style=+"%Y-%m-%d %H:%M:%S" ${backupDir}/*.sql.gz 2>/dev/null || true`;

  const res = await runRemoteSsh(cmd);
  if (!res.stdout || res.stdout.includes('cannot access')) {
    return [];
  }

  const list = [];
  const lines = res.stdout.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('total')) continue;
    // Formato: -rw-rw-r-- 1 ubuntu ubuntu 45K 2026-09-22 17:30:00 /home/ubuntu/backups/backup_restaurante_...
    const parts = trimmed.split(/\s+/);
    if (parts.length >= 8) {
      const size = parts[4];
      const date = `${parts[5]} ${parts[6]}`;
      const fullPath = parts.slice(7).join(' ');
      const name = fullPath.split('/').pop();
      list.unshift({
        name,
        size,
        date,
        path: fullPath
      });
    }
  }

  return list;
}

module.exports = {
  createBackup,
  listBackups
};
