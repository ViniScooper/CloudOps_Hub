// ============================================================
// cloud-ops-hub-backend/src/db.js
// Conector de Dados: Oracle Autonomous Database (ORDS) + Storage Local
// Otimizado para baixo consumo de memória RAM na VM (Sem daemons MySQL locais)
// ============================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurações do Oracle Autonomous Database (ORDS)
const ORDS_HOST = process.env.ORDS_HOST || 'https://g442b32fb1cf117-bancodedadosfinancas.adb.sa-saopaulo-1.oraclecloudapps.com';
const ORDS_PATH = process.env.ORDS_PATH || '/ords/admin/_/sql';
const ORDS_AUTH = process.env.ORDS_AUTH || ''; // Base64 ou token se habilitado

// Diretório de dados local (Fallback seguro e de altíssima performance)
const DATA_DIR = path.join(__dirname, '..', 'database');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'access_requests.json');

/**
 * Executa uma requisição SQL remota no Oracle Autonomous Database via ORDS
 */
async function executeOracleSql(statementText, bindParams = {}) {
  if (!ORDS_AUTH && !process.env.ORDS_ENABLED) {
    // Sem credenciais ORDS ativas, delega para o storage local
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      const url = new URL(ORDS_PATH, ORDS_HOST);
      const postData = JSON.stringify({
        statementText,
        binds: bindParams
      });

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          ...(ORDS_AUTH ? { 'Authorization': `Basic ${ORDS_AUTH}` } : {})
        },
        timeout: 5000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const data = JSON.parse(body);
              resolve(data);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[Oracle ORDS] Conexão com ATP falhou, usando storage local:', err.message);
        resolve(null);
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    } catch (err) {
      resolve(null);
    }
  });
}

/**
 * Consulta genérica compatível (substitui queries MySQL)
 */
async function query(sql, params = []) {
  // 1. Tenta executar no Oracle Autonomous Database via ORDS
  if (ORDS_AUTH || process.env.ORDS_ENABLED) {
    const oracleResult = await executeOracleSql(sql, params);
    if (oracleResult && oracleResult.items) {
      return oracleResult.items;
    }
  }

  // 2. Fallback de dados para usuários e solicitações
  const sqlLower = sql.toLowerCase();
  if (sqlLower.includes('from users')) {
    if (fs.existsSync(USERS_FILE)) {
      try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return Array.isArray(users) ? users : [];
      } catch {
        return [];
      }
    }
  }

  if (sqlLower.includes('from access_requests')) {
    if (fs.existsSync(REQUESTS_FILE)) {
      try {
        const requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
        return Array.isArray(requests) ? requests : [];
      } catch {
        return [];
      }
    }
  }

  return [];
}

/**
 * Busca usuário por e-mail no Oracle Cloud ATP ou no users.json
 */
async function getUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Tenta no Oracle Autonomous Database
  try {
    const oracleRes = await executeOracleSql(
      'SELECT id, name, email, password_hash, role, created_at FROM users WHERE lower(email) = :email',
      { email: cleanEmail }
    );
    if (oracleRes && oracleRes.items && oracleRes.items.length > 0) {
      return oracleRes.items[0];
    }
  } catch {}

  // 2. Busca no users.json local
  if (fs.existsSync(USERS_FILE)) {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(users)) {
        const found = users.find(u => (u.email || '').toLowerCase() === cleanEmail);
        if (found) return found;
      }
    } catch (e) {
      console.warn('Erro ao ler users.json:', e.message);
    }
  }

  return null;
}

/**
 * Salva ou atualiza usuário no Oracle Cloud ATP e no users.json
 */
async function saveUser(user) {
  if (!user || !user.email) return false;
  const cleanEmail = user.email.trim().toLowerCase();

  // 1. Sincroniza com Oracle Autonomous Database via ORDS
  try {
    await executeOracleSql(
      `MERGE INTO users u USING (SELECT :id as id, :name as name, :email as email, :password_hash as password_hash, :role as role FROM dual) val
       ON (lower(u.email) = lower(val.email))
       WHEN MATCHED THEN UPDATE SET u.password_hash = val.password_hash, u.role = val.role
       WHEN NOT MATCHED THEN INSERT (id, name, email, password_hash, role) VALUES (val.id, val.name, val.email, val.password_hash, val.role)`,
      {
        id: user.id || 'usr-' + Date.now(),
        name: user.name,
        email: cleanEmail,
        password_hash: user.password_hash,
        role: user.role || 'viewer'
      }
    );
  } catch {}

  // 2. Salva no users.json local
  try {
    let users = [];
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || [];
    }
    const idx = users.findIndex(u => (u.email || '').toLowerCase() === cleanEmail);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...user, email: cleanEmail };
    } else {
      users.push({ ...user, email: cleanEmail });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar no users.json:', err.message);
    return false;
  }
}

module.exports = {
  query,
  getUserByEmail,
  saveUser,
  executeOracleSql
};
