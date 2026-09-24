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

  // 1. Lê solicitações do CloudOps Hub no JSON local
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

  // 2. Lê solicitações do CloudOps Hub no MySQL se disponível
  try {
    const dbRequests = await db.query('SELECT * FROM access_requests ORDER BY requested_at DESC LIMIT 50');
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
    // Fallback caso tabela não exista no MySQL
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

// Aprova uma solicitação de acesso no CloudOps Hub
async function approveRequest({ requestId, email, name }) {
  if (!requestId || !email) {
    throw new Error('ID da solicitação e e-mail são obrigatórios.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name ? name.trim() : cleanEmail.split('@')[0];

  // Gera senha temporária forte para o CloudOps Hub
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const tempPassword = `CloudOps#${randomSuffix}!`;
  const passwordHash = bcrypt.hashSync(tempPassword, 10);
  const userId = 'usr-' + Date.now();

  // 1. Salva usuário no MySQL (se disponível)
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.query(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'user')
      ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)
    `, [userId, cleanName, cleanEmail, passwordHash]);
  } catch (err) {
    console.warn('[UserManagement] Aviso ao salvar usuário no MySQL:', err.message);
  }

  // 2. Salva usuário no users.json local
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let usersList = [];
    if (fs.existsSync(USERS_FILE)) {
      try { usersList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')); } catch {}
    }
    usersList = usersList.filter(u => u.email !== cleanEmail);
    usersList.push({
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'user',
      createdAt: new Date().toISOString()
    });
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersList, null, 2), 'utf8');
  } catch (err) {
    console.error('[UserManagement] Erro ao salvar users.json:', err.message);
  }

  // 3. Atualiza status no access_requests.json do CloudOps Hub
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

    await db.query('UPDATE access_requests SET status = "approved" WHERE id = ? OR email = ?', [requestId, cleanEmail]);
  } catch (err) {
    console.warn('[UserManagement] Erro ao atualizar status da requisição:', err.message);
  }

  // 4. Dispara e-mail de boas-vindas se configurado
  if (typeof emailService.sendWelcomeCredentialsEmail === 'function') {
    emailService.sendWelcomeCredentialsEmail({
      name: cleanName,
      email: cleanEmail,
      tempPassword
    }).catch(err => console.warn('[UserManagement] Falha ao enviar email:', err.message));
  }

  // 5. Notifica o administrador Master no WhatsApp via CallMeBot
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
async function rejectRequest({ requestId, reason }) {
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const hubReqs = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
      const updated = hubReqs.map(r => {
        if (r.id === requestId) {
          return { ...r, status: 'rejected', rejectionReason: reason || 'Recusado pelo administrador' };
        }
        return r;
      });
      saveRequestsToJson(updated);
    }
    await db.query('UPDATE access_requests SET status = "rejected" WHERE id = ?', [requestId]);
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

  // 2. Usuários do MySQL
  try {
    const rows = await db.query('SELECT id, name, email, role, created_at FROM users WHERE email != "vviniciuslourenco@gmail.com"');
    if (Array.isArray(rows)) {
      for (const r of rows) {
        if (!seenEmails.has(r.email.toLowerCase())) {
          seenEmails.add(r.email.toLowerCase());
          users.push({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role || 'user',
            status: 'Ativo',
            system: 'CloudOps Hub',
            createdAt: r.created_at
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
        if (!seenEmails.has((u.email || '').toLowerCase())) {
          seenEmails.add((u.email || '').toLowerCase());
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
  approveRequest,
  rejectRequest,
  listRegisteredUsers
};
