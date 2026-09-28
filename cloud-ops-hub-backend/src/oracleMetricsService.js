const https = require('https');
const fs = require('fs');
const path = require('path');
const { runRemoteSsh } = require('./deployService');

const ORDS_HOST = process.env.ORDS_HOST || 'G31AC88BC331093-CLOUDOPSHUB.adb.sa-saopaulo-1.oraclecloudapps.com';
const ORDS_PATH = process.env.ORDS_PATH || '/ords/admin/_/sql';
const ORDS_AUTH = process.env.ORDS_AUTH || 'QURNSU46Q2xvdWRPcHMjRGIyMDI2IVNlYw==';

const LOCAL_METRICS_FILE = path.join(__dirname, '..', 'database', 'metrics_history.json');

// Executa SQL diretamente via ORDS REST no Oracle ATP
function executeSql(sqlQuery) {
  return new Promise((resolve, reject) => {
    let hostname = ORDS_HOST.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
    const data = Buffer.from(sqlQuery, 'utf8');

    const options = {
      hostname,
      port: 443,
      path: ORDS_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Content-Length': data.length,
        'Authorization': `Basic ${ORDS_AUTH}`
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: body, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout ao conectar com Oracle ATP'));
    });

    req.write(data);
    req.end();
  });
}

// Cria tabela no Oracle ATP se não existir
async function initMetricsTable() {
  const createSql = `
  CREATE TABLE CLOUDOPS_METRICS_HISTORY (
    ID NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RECORDED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CPU_PERCENT NUMBER(5,2),
    RAM_USED_MB NUMBER(8,2),
    RAM_TOTAL_MB NUMBER(8,2),
    RAM_PERCENT NUMBER(5,2),
    DISK_PERCENT NUMBER(5,2),
    CONTAINERS_ONLINE NUMBER(4)
  )
  `;
  try {
    await executeSql(createSql);
    console.log('[OracleMetrics] Tabela CLOUDOPS_METRICS_HISTORY criada ou já existente.');
  } catch (e) {
    // Ignora se já existir
  }
}

// Fallback local se o banco estiver inacessível
function loadLocalMetrics() {
  try {
    if (fs.existsSync(LOCAL_METRICS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_METRICS_FILE, 'utf8'));
    }
  } catch (e) {}
  return [];
}

function saveLocalMetrics(records) {
  try {
    const dir = path.dirname(LOCAL_METRICS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_METRICS_FILE, JSON.stringify(records.slice(0, 300), null, 2), 'utf8');
  } catch (e) {}
}

// Coleta métricas atuais da VM e salva no Oracle ATP
async function collectAndRecordMetrics() {
  try {
    const res = await runRemoteSsh(
      `top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' ; free -m | grep Mem | awk '{print $2, $3}' ; df -h / | tail -1 | awk '{print $5}' ; docker ps -q | wc -l`
    );
    const out = (res.stdout || '').trim().split('\n');

    const cpu = parseFloat(out[0]) || 0;
    const [ramTotStr, ramUsedStr] = (out[1] || '956 300').split(' ');
    const ramTotal = parseInt(ramTotStr, 10) || 956;
    const ramUsed = parseInt(ramUsedStr, 10) || 300;
    const ramPct = Math.round((ramUsed / ramTotal) * 100);
    const diskPct = parseFloat((out[2] || '35%').replace('%', '')) || 35;
    const containers = parseInt(out[3], 10) || 0;

    const record = {
      recordedAt: new Date().toISOString(),
      cpuPercent: Number(cpu.toFixed(1)),
      ramUsedMb: ramUsed,
      ramTotalMb: ramTotal,
      ramPercent: ramPct,
      diskPercent: diskPct,
      containersOnline: containers
    };

    // 1. Salva no Oracle ATP (Always Free)
    try {
      const sqlInsert = `
      INSERT INTO CLOUDOPS_METRICS_HISTORY 
      (CPU_PERCENT, RAM_USED_MB, RAM_TOTAL_MB, RAM_PERCENT, DISK_PERCENT, CONTAINERS_ONLINE) 
      VALUES (${record.cpuPercent}, ${record.ramUsedMb}, ${record.ramTotalMb}, ${record.ramPercent}, ${record.diskPercent}, ${record.containersOnline})
      `;
      await executeSql(sqlInsert);
    } catch (dbErr) {
      console.warn('[OracleMetrics] Fallback para arquivo local:', dbErr.message);
    }

    // 2. Salva em cache local rápido
    const localList = loadLocalMetrics();
    localList.unshift(record);
    saveLocalMetrics(localList);

    return record;
  } catch (err) {
    console.error('[OracleMetrics] Erro ao coletar métricas:', err.message);
    return null;
  }
}

// Busca histórico dos últimos N registros / 24h
async function getMetricsHistory(limit = 48) {
  try {
    const sql = `
    SELECT TO_CHAR(RECORDED_AT, 'YYYY-MM-DD"T"HH24:MI:SS') as RECORDED_AT,
           CPU_PERCENT, RAM_USED_MB, RAM_TOTAL_MB, RAM_PERCENT, DISK_PERCENT, CONTAINERS_ONLINE
    FROM CLOUDOPS_METRICS_HISTORY
    ORDER BY RECORDED_AT DESC
    FETCH FIRST ${Number(limit)} ROWS ONLY
    `;
    const res = await executeSql(sql);

    if (res && res.items && res.items[0]?.resultSet?.items?.length > 0) {
      const rows = res.items[0].resultSet.items;
      return rows.reverse().map(r => ({
        recordedAt: r.recorded_at,
        time: (r.recorded_at || '').split('T')[1]?.slice(0, 5) || '--:--',
        cpuPercent: Number(r.cpu_percent || 0),
        ramUsedMb: Number(r.ram_used_mb || 0),
        ramTotalMb: Number(r.ram_total_mb || 0),
        ramPercent: Number(r.ram_percent || 0),
        diskPercent: Number(r.disk_percent || 0),
        containersOnline: Number(r.containers_online || 0)
      }));
    }
  } catch (e) {
    console.warn('[OracleMetrics] Usando cache local para histórico:', e.message);
  }

  // Fallback para cache local
  const local = loadLocalMetrics();
  return local.slice(0, limit).reverse().map(r => ({
    ...r,
    time: (r.recordedAt || '').split('T')[1]?.slice(0, 5) || '--:--'
  }));
}

// Inicia coleta periódica automática (a cada 10 minutos)
let metricsInterval = null;
function startMetricsCollector(intervalMinutes = 10) {
  if (metricsInterval) clearInterval(metricsInterval);
  initMetricsTable().catch(() => {});
  // Coleta inicial após 5s
  setTimeout(collectAndRecordMetrics, 5000);
  metricsInterval = setInterval(collectAndRecordMetrics, intervalMinutes * 60 * 1000);
  console.log(`[OracleMetrics] Coleta de métricas históricas ativa (a cada ${intervalMinutes} min no Oracle ATP).`);
}

module.exports = {
  initMetricsTable,
  collectAndRecordMetrics,
  getMetricsHistory,
  startMetricsCollector,
  executeSql
};
