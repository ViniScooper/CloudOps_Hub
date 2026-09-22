const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('./db');
const emailService = require('./emailService');

const REQUESTS_FILE = path.join(__dirname, '..', 'database', 'access_requests.json');
const USERS_FILE = path.join(__dirname, '..', 'database', 'users.json');

// Lê solicitações de acesso (JSON local e MySQL)
async function getAccessRequests() {
  let jsonRequests = [];
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      jsonRequests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Erro ao ler access_requests.json:', err.message);
  }

  try {
    const dbRequests = await db.query('SELECT * FROM access_requests ORDER BY requested_at DESC LIMIT 50');
    if (Array.isArray(dbRequests) && dbRequests.length > 0) {
      // Mescla priorizando o MySQL
      const ids = new Set(dbRequests.map(r => r.id));
      const combined = [...dbRequests];
      for (const jr of jsonRequests) {
        if (!ids.has(jr.id)) combined.push(jr);
      }
      return combined;
    }
  } catch {
    // Fallback para JSON
  }

  return jsonRequests;
}

// Salva lista atualizada no JSON
function saveRequestsToJson(requests) {
  try {
    const dir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao gravar access_requests.json:', err.message);
  }
}

// Aprova uma solicitação de acesso
async function approveRequest({ requestId, email, name }) {
  if (!requestId || !email) {
    throw new Error('ID da solicitação e e-mail são obrigatórios.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name ? name.trim() : cleanEmail.split('@')[0];

  // Gera senha temporária forte
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const tempPassword = `CloudOps#${randomSuffix}!`;
  const passwordHash = bcrypt.hashSync(tempPassword, 10);
  const userId = 'usr-' + Date.now();

  // 1. Persiste usuário no MySQL
  let savedToDb = false;
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

    // Insere ou atualiza senha
    await db.query(`
      INSERT INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'user')
      ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)
    `, [userId, cleanName, cleanEmail, passwordHash]);
    savedToDb = true;
  } catch (err) {
    console.warn('[UserManagement] Aviso ao salvar usuário no MySQL:', err.message);
  }

  // 2. Persiste em users.json (fallback de alta disponibilidade)
  try {
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

  // 3. Atualiza status da solicitação
  const allRequests = await getAccessRequests();
  const updatedRequests = allRequests.map(r => {
    if (r.id === requestId || r.email.toLowerCase() === cleanEmail) {
      return { ...r, status: 'approved', approvedAt: new Date().toISOString(), tempPasswordGiven: true };
    }
    return r;
  });
  saveRequestsToJson(updatedRequests);

  try {
    await db.query('UPDATE access_requests SET status = "approved" WHERE id = ? OR email = ?', [requestId, cleanEmail]);
  } catch {}

  // 4. Dispara e-mail de boas-vindas com as credenciais
  if (typeof emailService.sendWelcomeCredentialsEmail === 'function') {
    emailService.sendWelcomeCredentialsEmail({
      name: cleanName,
      email: cleanEmail,
      tempPassword
    }).catch(err => console.warn('[UserManagement] Falha ao enviar email de credenciais:', err.message));
  }

  // 5. Notifica o admin no WhatsApp que o usuário foi liberado
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const https = require('https');
  const alertText = encodeURIComponent(`✅ *CloudOps Hub - Acesso Aprovado!*\n\n👤 *Usuário:* ${cleanName}\n✉️ *E-mail:* ${cleanEmail}\n🔑 *Senha Gerada:* ${tempPassword}\n\nO usuário já pode logar em https://cloudops-hub-dun.vercel.app/`);
  https.get(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${alertText}&apikey=${apiKey}`).on('error', () => {});

  return {
    success: true,
    message: `Acesso aprovado com sucesso para ${cleanName}!`,
    user: {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      tempPassword
    }
  };
}

// Rejeita uma solicitação
async function rejectRequest({ requestId, reason }) {
  const allRequests = await getAccessRequests();
  const updatedRequests = allRequests.map(r => {
    if (r.id === requestId) {
      return { ...r, status: 'rejected', rejectionReason: reason || 'Não atende aos critérios no momento.' };
    }
    return r;
  });
  saveRequestsToJson(updatedRequests);

  try {
    await db.query('UPDATE access_requests SET status = "rejected" WHERE id = ?', [requestId]);
  } catch {}

  return { success: true, message: 'Solicitação rejeitada.' };
}

// Lista usuários cadastrados (sem expor hash)
async function listRegisteredUsers() {
  const users = [];

  // Master
  users.push({
    id: 'usr-master-01',
    name: 'Vinicius Lourenco (Master)',
    email: 'vviniciuslourenco@gmail.com',
    role: 'master',
    status: 'Ativo',
    createdAt: '2026-09-22T00:00:00.000Z'
  });

  try {
    const rows = await db.query('SELECT id, name, email, role, created_at FROM users WHERE email != "vviniciuslourenco@gmail.com"');
    if (Array.isArray(rows)) {
      for (const r of rows) {
        users.push({
          id: r.id,
          name: r.name,
          email: r.email,
          role: r.role || 'user',
          status: 'Ativo',
          createdAt: r.created_at
        });
      }
    }
  } catch {
    // Fallback JSON
    if (fs.existsSync(USERS_FILE)) {
      try {
        const jsonList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        for (const u of jsonList) {
          if (u.email !== 'vviniciuslourenco@gmail.com') {
            users.push({
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role || 'user',
              status: 'Ativo',
              createdAt: u.createdAt
            });
          }
        }
      } catch {}
    }
  }

  return users;
}

module.exports = {
  getAccessRequests,
  approveRequest,
  rejectRequest,
  listRegisteredUsers
};
