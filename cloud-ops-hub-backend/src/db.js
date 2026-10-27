// ============================================================
// cloud-ops-hub-backend/src/db.js
// Conector de Dados Oficial: Oracle Autonomous Database (ORDS REST)
// Criptografia nativa em repouso (TDE) + Guardião Anti-Sono automático
// ============================================================

const fs = require('fs');
const path = require('path');
const https = require('https');

// Configurações do Oracle Autonomous Database (ORDS)
const ORDS_HOST = process.env.ORDS_HOST || 'https://g31ac88bc331093-cloudopshub.adb.sa-saopaulo-1.oraclecloudapps.com';
const ORDS_PATH = process.env.ORDS_PATH || '/ords/admin/_/sql';
const ORDS_AUTH = process.env.ORDS_AUTH || 'QURNSU46Q2xvdWRPcHMjRGIyMDI2IVNlYw=='; // ADMIN:CloudOps#Db2026!Sec

// Diretório de dados local (Fallback seguro caso ocorra indisponibilidade de rede)
const DATA_DIR = path.join(__dirname, '..', 'database');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'access_requests.json');

/**
 * Executa uma instrução SQL no Oracle Autonomous Database via ORDS REST API
 */
async function executeOracleSql(sqlText) {
  return new Promise((resolve) => {
    try {
      const url = new URL(ORDS_PATH, ORDS_HOST);
      const postData = Buffer.from(sqlText, 'utf8');

      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/sql',
          'Content-Length': postData.length,
          ...(ORDS_AUTH ? { 'Authorization': `Basic ${ORDS_AUTH}` } : {})
        },
        timeout: 8000
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const data = JSON.parse(body);
              if (data && data.items && data.items.length > 0 && data.items[0].resultSet) {
                resolve(data.items[0].resultSet.items || []);
              } else {
                resolve(data.items || []);
              }
            } else {
              console.warn('[Oracle ATP] Resposta HTTP', res.statusCode, body.substring(0, 150));
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => {
        console.warn('[Oracle ATP] Erro de rede:', err.message);
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
 * Busca usuário por e-mail no Oracle Autonomous Database
 */
async function getUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase().replace(/'/g, "''");

  // 1. Consulta no Oracle Autonomous Database
  try {
    const rows = await executeOracleSql(
      `SELECT id, name, email, password_hash, role, created_at FROM CLOUDOPS_USERS WHERE LOWER(email) = '${cleanEmail}'`
    );
    if (rows && rows.length > 0) {
      return {
        id: rows[0].id || rows[0].ID,
        name: rows[0].name || rows[0].NAME,
        email: (rows[0].email || rows[0].EMAIL).toLowerCase(),
        password_hash: rows[0].password_hash || rows[0].PASSWORD_HASH,
        role: rows[0].role || rows[0].ROLE,
        created_at: rows[0].created_at || rows[0].CREATED_AT
      };
    }
  } catch (err) {
    console.warn('[Oracle ATP] Falha ao consultar usuário:', err.message);
  }

  // 2. Fallback de contingência no users.json local
  if (fs.existsSync(USERS_FILE)) {
    try {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      if (Array.isArray(users)) {
        const found = users.find(u => (u.email || '').toLowerCase() === email.trim().toLowerCase());
        if (found) return found;
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Salva ou atualiza usuário no Oracle Autonomous Database (MERGE INTO)
 */
async function saveUser(user) {
  if (!user || !user.email) return false;
  const cleanEmail = user.email.trim().toLowerCase().replace(/'/g, "''");
  const cleanName = (user.name || '').replace(/'/g, "''");
  const cleanHash = (user.password_hash || '').replace(/'/g, "''");
  const cleanRole = (user.role || 'user').replace(/'/g, "''");
  const userId = (user.id || 'usr-' + Date.now()).replace(/'/g, "''");

  // 1. Sincroniza no Oracle ATP
  try {
    const sql = `
      MERGE INTO CLOUDOPS_USERS tgt
      USING (SELECT '${userId}' as id, '${cleanName}' as name, '${cleanEmail}' as email, '${cleanHash}' as password_hash, '${cleanRole}' as role FROM DUAL) src
      ON (LOWER(tgt.email) = LOWER(src.email))
      WHEN MATCHED THEN
        UPDATE SET tgt.name = src.name, tgt.password_hash = src.password_hash, tgt.role = src.role
      WHEN NOT MATCHED THEN
        INSERT (id, name, email, password_hash, role) VALUES (src.id, src.name, src.email, src.password_hash, src.role);
    `;
    await executeOracleSql(sql);
  } catch (err) {
    console.warn('[Oracle ATP] Falha no saveUser:', err.message);
  }

  // 2. Atualiza cache local
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
    return false;
  }
}

/**
 * Consulta genérica para auditoria e listagem de usuários
 */
async function query(sql) {
  const sqlLower = (sql || '').toLowerCase();
  if (sqlLower.includes('from users') || sqlLower.includes('from cloudops_users')) {
    try {
      const rows = await executeOracleSql('SELECT id, name, email, role, created_at FROM CLOUDOPS_USERS ORDER BY created_at DESC');
      if (rows && rows.length > 0) {
        return rows.map(r => ({
          id: r.id || r.ID,
          name: r.name || r.NAME,
          email: r.email || r.EMAIL,
          role: r.role || r.ROLE,
          createdAt: r.created_at || r.CREATED_AT
        }));
      }
    } catch {}

    if (fs.existsSync(USERS_FILE)) {
      try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        return Array.isArray(users) ? users : [];
      } catch {
        return [];
      }
    }
  }

  return [];
}

/**
 * Guardião Anti-Sono: Executa um ping leve no Oracle ATP para impedir hibernação de 7 dias
 */
async function keepAliveOracleAtp() {
  try {
    console.log('[Guardião Anti-Sono] Enviando ping para o Oracle Autonomous Database...');
    const res = await executeOracleSql('SELECT 1 AS KEEP_ALIVE FROM DUAL;');
    if (res) {
      console.log('✅ [Guardião Anti-Sono] Oracle Autonomous Database ativo e online! Próximo ping agendado.');
      return true;
    }
  } catch (err) {
    console.warn('[Guardião Anti-Sono] Alerta de ping:', err.message);
  }
  return false;
}

// Inicia o Guardião Anti-Sono imediatamente e a cada 12 horas (43.200.000 ms)
setTimeout(keepAliveOracleAtp, 5000);
setInterval(keepAliveOracleAtp, 12 * 60 * 60 * 1000);

module.exports = {
  query,
  getUserByEmail,
  saveUser,
  executeOracleSql,
  keepAliveOracleAtp
};
