const fs = require('fs');
const path = require('path');
const { encrypt, decrypt } = require('./crypto');
const db = require('./db');

const SERVERS_FILE = path.join(__dirname, '..', 'database', 'user_servers.json');

// Lê servidores salvos em JSON
function loadServersJson() {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      const data = fs.readFileSync(SERVERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler user_servers.json:', err.message);
  }
  return [];
}

// Salva servidores em JSON
function saveServersJson(list) {
  try {
    const dir = path.dirname(SERVERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar user_servers.json:', err.message);
  }
}

// Adiciona um novo servidor com chave SSH criptografada em AES-256
async function addServer({ userId, name, ip, port = 22, user = 'ubuntu', privateKey, provider = 'VPS / Nuvem Própria' }) {
  if (!userId || !ip || !privateKey) {
    throw new Error('Usuário, IP e chave SSH são obrigatórios.');
  }

  const cleanIp = ip.trim();
  const cleanUser = user.trim();
  const cleanName = name ? name.trim() : `Servidor (${cleanIp})`;
  const serverId = 'srv-' + Date.now();

  // Criptografa a chave privada com AES-256-GCM
  const encryptedPayload = encrypt(privateKey.trim());

  const serverRecord = {
    id: serverId,
    userId,
    name: cleanName,
    ip: cleanIp,
    port: parseInt(port, 10) || 22,
    user: cleanUser,
    provider,
    status: 'Conectado',
    encryptedKey: encryptedPayload.encrypted,
    iv: encryptedPayload.iv,
    tag: encryptedPayload.tag,
    createdAt: new Date().toISOString()
  };

  // 1. Tenta salvar no MySQL
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_servers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(100) NOT NULL,
        ip VARCHAR(45) NOT NULL,
        port INT DEFAULT 22,
        user VARCHAR(50) DEFAULT 'ubuntu',
        provider VARCHAR(100) DEFAULT 'VPS',
        encrypted_key TEXT NOT NULL,
        iv VARCHAR(64) NOT NULL,
        tag VARCHAR(64) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      INSERT INTO user_servers (id, user_id, name, ip, port, user, provider, encrypted_key, iv, tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [serverId, userId, cleanName, cleanIp, parseInt(port, 10) || 22, cleanUser, provider, encryptedPayload.encrypted, encryptedPayload.iv, encryptedPayload.tag]);
  } catch (err) {
    console.warn('[UserServerService] Aviso ao persistir no MySQL (usando JSON):', err.message);
  }

  // 2. Persiste no arquivo JSON
  const list = loadServersJson();
  list.push(serverRecord);
  saveServersJson(list);

  // Retorna dados seguros sem a chave criptografada
  return {
    id: serverId,
    name: cleanName,
    ip: cleanIp,
    port: parseInt(port, 10) || 22,
    user: cleanUser,
    provider,
    status: 'Conectado',
    createdAt: serverRecord.createdAt
  };
}

// Lista os servidores do usuário autenticado (nunca expõe a chave privada)
async function listUserServers(userId) {
  if (!userId) return [];

  // Tenta buscar no MySQL
  try {
    const rows = await db.query('SELECT id, name, ip, port, user, provider, created_at FROM user_servers WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map(r => ({
        id: r.id,
        name: r.name,
        ip: r.ip,
        port: r.port,
        user: r.user,
        provider: r.provider,
        status: 'Healthy',
        createdAt: r.created_at
      }));
    }
  } catch {}

  // Fallback para JSON
  const list = loadServersJson();
  return list.filter(s => s.userId === userId).map(s => ({
    id: s.id,
    name: s.name,
    ip: s.ip,
    port: s.port,
    user: s.user,
    provider: s.provider,
    status: 'Healthy',
    createdAt: s.createdAt
  }));
}

// Remove um servidor do usuário
async function deleteUserServer(userId, serverId) {
  try {
    await db.query('DELETE FROM user_servers WHERE id = ? AND user_id = ?', [serverId, userId]);
  } catch {}

  const list = loadServersJson();
  const updated = list.filter(s => !(s.id === serverId && s.userId === userId));
  saveServersJson(updated);

  return { success: true };
}

// Descriptografa a chave para operações SSH internas do backend
function getDecryptedServerKey(serverId, userId) {
  const list = loadServersJson();
  const found = list.find(s => s.id === serverId && (userId ? s.userId === userId : true));
  if (!found || !found.encryptedKey) return null;

  try {
    return decrypt(found.encryptedKey, found.iv, found.tag);
  } catch (err) {
    console.error('Falha ao descriptografar chave SSH do servidor:', err.message);
    return null;
  }
}

module.exports = {
  addServer,
  listUserServers,
  deleteUserServer,
  getDecryptedServerKey
};
