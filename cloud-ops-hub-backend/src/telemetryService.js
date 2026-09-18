/**
 * CLOUDOPS HUB — TELEMETRY & SYSTEM MONITORING SERVICE
 * Captura, armazena e disponibiliza em tempo real logs de operações, erros 4xx/5xx e falhas
 * do Cardápio Digital, Painel Admin, Backends e serviços da Nuvem.
 */

const fs = require('fs');
const path = require('path');

const LOGS_FILE = path.join(__dirname, '..', 'database', 'telemetry_logs.json');
const MAX_LOGS = 500;

let inMemoryLogs = [];

function loadLogs() {
  try {
    if (fs.existsSync(LOGS_FILE)) {
      const raw = fs.readFileSync(LOGS_FILE, 'utf8');
      inMemoryLogs = JSON.parse(raw);
      if (!Array.isArray(inMemoryLogs)) inMemoryLogs = [];
    }
  } catch (err) {
    console.error('Erro ao ler telemetry_logs.json:', err.message);
    inMemoryLogs = [];
  }
}

function saveLogs() {
  try {
    const dir = path.dirname(LOGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOGS_FILE, JSON.stringify(inMemoryLogs.slice(0, MAX_LOGS), null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar telemetry_logs.json:', err.message);
  }
}

loadLogs();

function recordLog({
  level = 'INFO',
  source = 'Sistema',
  message = '',
  path = '',
  method = 'GET',
  statusCode = 200,
  details = null,
  ip = '127.0.0.1',
  userAgent = ''
}) {
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toLocaleString('pt-BR'),
    level: String(level).toUpperCase(),
    source,
    message: String(message),
    path,
    method: String(method).toUpperCase(),
    statusCode: Number(statusCode) || 200,
    details: details ? (typeof details === 'object' ? JSON.stringify(details, null, 2) : String(details)) : null,
    ip: ip.replace('::ffff:', ''),
    userAgent
  };

  inMemoryLogs.unshift(newLog);
  if (inMemoryLogs.length > MAX_LOGS) inMemoryLogs.pop();
  saveLogs();

  return newLog;
}

function getLogs({ level, source, search, limit = 100 } = {}) {
  let filtered = [...inMemoryLogs];

  if (level && level !== 'ALL') {
    filtered = filtered.filter(l => l.level === level.toUpperCase());
  }

  if (source && source !== 'ALL') {
    filtered = filtered.filter(l => l.source.toLowerCase().includes(source.toLowerCase()));
  }

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(l => 
      l.message.toLowerCase().includes(q) ||
      (l.path && l.path.toLowerCase().includes(q)) ||
      (l.details && l.details.toLowerCase().includes(q)) ||
      l.source.toLowerCase().includes(q)
    );
  }

  const metrics = {
    total: inMemoryLogs.length,
    errors: inMemoryLogs.filter(l => l.level === 'ERROR' || l.statusCode >= 500).length,
    warnings: inMemoryLogs.filter(l => l.level === 'WARN' || (l.statusCode >= 400 && l.statusCode < 500)).length,
    info: inMemoryLogs.filter(l => l.level === 'INFO' && l.statusCode < 400).length,
    recentCount: filtered.length
  };

  return {
    logs: filtered.slice(0, Number(limit) || 100),
    metrics
  };
}

function clearLogs() {
  inMemoryLogs = [];
  saveLogs();
  return { success: true, message: 'Todos os logs de telemetria foram limpos.' };
}

module.exports = {
  recordLog,
  getLogs,
  clearLogs
};
