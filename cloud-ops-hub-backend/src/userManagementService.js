const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const https = require('https');
const db = require('./db');
const emailService = require('./emailService');

const REQUESTS_FILE = path.join(__dirname, '..', 'database', 'access_requests.json');
const USERS_FILE = path.join(__dirname, '..', 'database', 'users.json');

// Lê solicitações de acesso exclusivas do CloudOps Hub
async function getAccessRequests() {
  const requests = [];
  const seenIds = new Set();
  const seenEmails = new Set();

  // 1. Lê solicitações do CloudOps Hub no storage local
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const jsonRequests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
      if (Array.isArray(jsonRequests)) {
        for (const r of jsonRequests) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            if (r.email) seenEmails.add(r.email.toLowerCase());
            requests.push({
              id: r.id,
              name: r.name,
              email: r.email,
              note: r.note || 'Solicitação de acesso ao CloudOps Hub',
              status: r.status || 'pending',
              requested_at: r.requested_at || r.requestedAt || new Date().toISOString(),
              requestedAt: r.requestedAt || r.requested_at || new Date().toISOString(),
              approvedAt: r.approvedAt,
              project: 'CloudOps Hub'
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler access_requests.json:', err.message);
  }

  // 2. Consulta no Oracle Autonomous Database (se habilitado)
  try {
    const dbRequests = await db.query('SELECT id, name, email, note, status, requested_at FROM access_requests ORDER BY requested_at DESC');
    if (Array.isArray(dbRequests) && dbRequests.length > 0) {
      for (const r of dbRequests) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          if (r.email) seenEmails.add(r.email.toLowerCase());
          requests.push({
            id: r.id,
            name: r.name,
            email: r.email,
            note: r.note || 'Solicitação de acesso ao CloudOps Hub',
            status: r.status || 'pending',
            requested_at: r.requested_at || new Date().toISOString(),
            requestedAt: r.requested_at || new Date().toISOString(),
            project: 'CloudOps Hub'
          });
        }
      }
    }
  } catch {
    // Fallback silencioso para storage local
  }

  // Ordena por data decrescente (mais recentes no topo)
  requests.sort((a, b) => {
    const da = new Date(a.requested_at || a.requestedAt || 0).getTime();
    const dbTime = new Date(b.requested_at || b.requestedAt || 0).getTime();
    return dbTime - da;
  });

  return requests;
}

// Salva lista atualizada no JSON do CloudOps Hub
function saveRequestsToJson(requests) {
  try {
    const dir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao gravar access_requests.json:', err.message);
  }
}

// Cria uma nova solicitação de acesso e persiste em disco e banco
async function createAccessRequest({ name, email, note, clientIp }) {
  if (!name || !email) {
    throw new Error('Nome e e-mail são obrigatórios.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const cleanNote = note ? note.trim() : 'Solicitação de acesso ao CloudOps Hub';

  let requests = [];
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      requests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')) || [];
    }
  } catch {}

  const existingIdx = requests.findIndex(r => (r.email || '').toLowerCase() === cleanEmail);
  const now = new Date().toISOString();
  let item;

  if (existingIdx >= 0) {
    item = {
      ...requests[existingIdx],
      name: cleanName,
      note: cleanNote,
      status: 'pending',
      requested_at: now,
      requestedAt: now,
      ip: clientIp || requests[existingIdx].ip || '127.0.0.1'
    };
    requests[existingIdx] = item;
  } else {
    item = {
      id: 'req-' + Date.now(),
      name: cleanName,
      email: cleanEmail,
      note: cleanNote,
      status: 'pending',
      requested_at: now,
      requestedAt: now,
      ip: clientIp || '127.0.0.1',
      project: 'CloudOps Hub'
    };
    requests.unshift(item);
  }

  saveRequestsToJson(requests);

  // Tenta sincronizar com Oracle ATP
  try {
    await db.executeOracleSql(
      `MERGE INTO access_requests r USING (SELECT :id as id, :name as name, :email as email, :note as note, :status as status FROM dual) val
       ON (lower(r.email) = lower(val.email))
       WHEN MATCHED THEN UPDATE SET r.name = val.name, r.note = val.note, r.status = val.status, r.requested_at = CURRENT_TIMESTAMP
       WHEN NOT MATCHED THEN INSERT (id, name, email, note, status, requested_at) VALUES (val.id, val.name, val.email, val.note, val.status, CURRENT_TIMESTAMP)`,
      { id: item.id, name: cleanName, email: cleanEmail, note: cleanNote, status: 'pending' }
    );
  } catch {}

  // Notifica o administrador Master no WhatsApp via CallMeBot
  try {
    const phone = process.env.WHATSAPP_PHONE || '558195126839';
    const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
    const alertText = encodeURIComponent(
      `🔔 *CloudOps Hub - Nova Solicitação de Acesso!*\n\n` +
      `👤 *Nome:* ${cleanName}\n` +
      `✉️ *E-mail:* ${cleanEmail}\n` +
      `📝 *Nota:* ${cleanNote}\n\n` +
      `🔗 *Acesse para Aprovar:* https://cloudops-hub-dun.vercel.app/`
    );
    https.get(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${alertText}&apikey=${apiKey}`).on('error', () => {});
  } catch {}

  return item;
}

// Aprova uma solicitação de acesso no CloudOps Hub
async function approveRequest(param) {
  let requestId = typeof param === 'string' ? param : (param?.requestId || param?.id);
  let email = typeof param === 'object' ? param?.email : null;
  let name = typeof param === 'object' ? param?.name : null;

  if (!requestId && !email) {
    throw new Error('ID da solicitação ou e-mail são obrigatórios.');
  }

  // Se não passou email ou nome, busca no access_requests.json
  const allReqs = await getAccessRequests();
  const existing = allReqs.find(r => r.id === requestId || (email && r.email && r.email.toLowerCase() === email.toLowerCase()));
  if (existing) {
    if (!requestId) requestId = existing.id;
    if (!email) email = existing.email;
    if (!name) name = existing.name;
  }

  if (!email) {
    throw new Error('E-mail da solicitação não encontrado.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name ? name.trim() : cleanEmail.split('@')[0];

  // Gera senha temporária forte para o CloudOps Hub
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const tempPassword = `CloudOps#${randomSuffix}!`;
  const passwordHash = bcrypt.hashSync(tempPassword, 10);
  const userId = 'usr-' + Date.now();

  // 1. Salva usuário via conector Oracle ATP / Local
  try {
    await db.saveUser({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'user'
    });
  } catch (err) {
    console.warn('[UserManagement] Aviso ao salvar usuário via db connector:', err.message);
  }

  // 2. Atualiza status no access_requests.json do CloudOps Hub
  try {
    let hubReqs = [];
    if (fs.existsSync(REQUESTS_FILE)) {
      try { hubReqs = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8')); } catch {}
    }
    const updated = hubReqs.map(r => {
      if (r.id === requestId || (r.email && r.email.toLowerCase() === cleanEmail)) {
        return { ...r, status: 'approved', approvedAt: new Date().toISOString(), tempPasswordGiven: true };
      }
      return r;
    });
    saveRequestsToJson(updated);

    // Tenta atualizar no Oracle se houver tabela remota
    db.executeOracleSql('UPDATE access_requests SET status = :status WHERE id = :id', { status: 'approved', id: requestId }).catch(() => {});
  } catch (err) {
    console.warn('[UserManagement] Erro ao atualizar status da requisição:', err.message);
  }

  // 3. Dispara e-mail de boas-vindas se configurado
  if (typeof emailService.sendWelcomeCredentialsEmail === 'function') {
    emailService.sendWelcomeCredentialsEmail({
      name: cleanName,
      email: cleanEmail,
      tempPassword
    }).catch(err => console.warn('[UserManagement] Falha ao enviar email:', err.message));
  }

  // 4. Notifica o administrador Master no WhatsApp via CallMeBot
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const appUrl = 'https://cloudops-hub-dun.vercel.app/';

  const alertText = encodeURIComponent(
    `✅ *CloudOps Hub - Acesso Aprovado!*\n\n` +
    `👤 *Usuário:* ${cleanName}\n` +
    `✉️ *E-mail:* ${cleanEmail}\n` +
    `🔑 *Senha Temporária:* ${tempPassword}\n\n` +
    `🔗 *Link do Console:* ${appUrl}\n\n` +
    `_O usuário já pode fazer login no CloudOps Hub._`
  );
  https.get(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${alertText}&apikey=${apiKey}`).on('error', () => {});

  return {
    success: true,
    message: `Acesso aprovado com sucesso para ${cleanName} no CloudOps Hub!`,
    user: {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      tempPassword,
      appUrl
    }
  };
}

// Rejeita uma solicitação no CloudOps Hub
async function rejectRequest(param) {
  const requestId = typeof param === 'string' ? param : (param?.requestId || param?.id);
  const reason = (typeof param === 'object' && param?.reason) ? param.reason : 'Recusado pelo administrador';

  if (!requestId) {
    return { success: false, error: 'ID da solicitação é obrigatório.' };
  }

  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const hubReqs = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
      const updated = hubReqs.map(r => {
        if (r.id === requestId) {
          return { ...r, status: 'rejected', rejectionReason: reason };
        }
        return r;
      });
      saveRequestsToJson(updated);
    }
    db.executeOracleSql('UPDATE access_requests SET status = :status WHERE id = :id', { status: 'rejected', id: requestId }).catch(() => {});
  } catch (err) {
    console.warn('[UserManagement] Erro ao rejeitar solicitação:', err.message);
  }

  return { success: true, message: 'Solicitação rejeitada com sucesso.' };
}

// Lista usuários cadastrados no CloudOps Hub (sem expor hash de senha)
async function listRegisteredUsers() {
  const users = [];
  const seenEmails = new Set();

  // 1. Usuário Master padrão do CloudOps Hub
  users.push({
    id: 'usr-master-01',
    name: 'Vinicius Lourenco (Master)',
    email: 'vviniciuslourenco@gmail.com',
    role: 'master',
    status: 'Ativo',
    system: 'CloudOps Hub',
    createdAt: '2026-09-22T00:00:00.000Z'
  });
  seenEmails.add('vviniciuslourenco@gmail.com');

  // 2. Consulta usuários no Oracle Autonomous Database ou no conector
  try {
    const rows = await db.query('SELECT id, name, email, role, created_at FROM users');
    if (Array.isArray(rows)) {
      for (const r of rows) {
        const email = (r.email || '').toLowerCase();
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email);
          users.push({
            id: r.id || 'usr-' + Date.now(),
            name: r.name || email.split('@')[0],
            email: r.email,
            role: r.role || 'user',
            status: 'Ativo',
            system: 'CloudOps Hub (Oracle Cloud)',
            createdAt: r.created_at || r.createdAt || new Date().toISOString()
          });
        }
      }
    }
  } catch {}

  // 3. Usuários do users.json do Hub
  if (fs.existsSync(USERS_FILE)) {
    try {
      const jsonList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      for (const u of jsonList) {
        const email = (u.email || '').toLowerCase();
        if (email && !seenEmails.has(email)) {
          seenEmails.add(email);
          users.push({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role || 'user',
            status: 'Ativo',
            system: 'CloudOps Hub',
            createdAt: u.createdAt
          });
        }
      }
    } catch {}
  }

  return users;
}

module.exports = {
  getAccessRequests,
  getPendingRequests: getAccessRequests,
  createAccessRequest,
  approveRequest,
  rejectRequest,
  listRegisteredUsers,
  getAllUsers: listRegisteredUsers
};
