const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const https = require('https');
const db = require('./db');
const emailService = require('./emailService');

const REQUESTS_FILE = path.join(__dirname, '..', 'database', 'access_requests.json');
const USERS_FILE = path.join(__dirname, '..', 'database', 'users.json');

// Caminhos do FinControl (Gestão Financeira)
function getFinControlPaths() {
  const possiblePaths = [
    '/home/ubuntu/controle_financeiro_backend/data',
    '/home/ubuntu/controle-financeiro/backend/data',
    'C:\\Users\\vini\\Documents\\A_FINANCEIRO_CONTROLE\\backend\\data',
    path.join(__dirname, '..', '..', '..', 'A_FINANCEIRO_CONTROLE', 'backend', 'data')
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return {
        requestsFile: path.join(p, 'access_requests.json'),
        usersFile: path.join(p, 'finance_users.json'),
        dir: p
      };
    }
  }

  return {
    requestsFile: '/home/ubuntu/controle_financeiro_backend/data/access_requests.json',
    usersFile: '/home/ubuntu/controle_financeiro_backend/data/finance_users.json',
    dir: '/home/ubuntu/controle_financeiro_backend/data'
  };
}

// Lê solicitações de acesso (CloudOps Hub + FinControl unificados)
async function getAccessRequests() {
  let combined = [];
  const seenIds = new Set();
  const seenEmails = new Set();

  // 1. Lê solicitações do CloudOps Hub (JSON local)
  try {
    if (fs.existsSync(REQUESTS_FILE)) {
      const jsonRequests = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
      if (Array.isArray(jsonRequests)) {
        for (const r of jsonRequests) {
          if (!seenIds.has(r.id)) {
            seenIds.add(r.id);
            seenEmails.add((r.email || '').toLowerCase());
            combined.push({
              ...r,
              project: 'CloudOps Hub',
              note: r.note || 'Solicitação para o painel CloudOps'
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler access_requests.json do Hub:', err.message);
  }

  // 2. Lê solicitações do CloudOps Hub no MySQL se disponível
  try {
    const dbRequests = await db.query('SELECT * FROM access_requests ORDER BY requested_at DESC LIMIT 50');
    if (Array.isArray(dbRequests) && dbRequests.length > 0) {
      for (const r of dbRequests) {
        if (!seenIds.has(r.id)) {
          seenIds.add(r.id);
          seenEmails.add((r.email || '').toLowerCase());
          combined.push({
            ...r,
            project: 'CloudOps Hub',
            note: r.note || 'Solicitação para o painel CloudOps'
          });
        }
      }
    }
  } catch {
    // Fallback silencioso
  }

  // 3. Lê solicitações do FinControl (Gestão Financeira)
  try {
    const finPaths = getFinControlPaths();
    if (fs.existsSync(finPaths.requestsFile)) {
      const finRequests = JSON.parse(fs.readFileSync(finPaths.requestsFile, 'utf8'));
      if (Array.isArray(finRequests)) {
        for (const fr of finRequests) {
          if (!seenIds.has(fr.id)) {
            seenIds.add(fr.id);
            combined.push({
              id: fr.id,
              name: fr.name || fr.email.split('@')[0],
              email: fr.email,
              whatsapp: fr.whatsapp || '',
              note: `📱 WhatsApp: ${fr.whatsapp || 'N/I'}${fr.salario ? ` • Salário: R$ ${fr.salario}` : ''} • 🏷️ FinControl`,
              status: fr.status || 'pending',
              requested_at: fr.requestedAt || fr.requested_at || new Date().toISOString(),
              requestedAt: fr.requestedAt || fr.requested_at || new Date().toISOString(),
              approvedAt: fr.updatedAt || fr.approvedAt,
              project: 'FinControl',
              tempPassword: fr.tempPassword
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Erro ao ler solicitações do FinControl:', err.message);
  }

  // Ordena por data decrescente (mais recentes no topo)
  combined.sort((a, b) => {
    const da = new Date(a.requested_at || a.requestedAt || 0).getTime();
    const db = new Date(b.requested_at || b.requestedAt || 0).getTime();
    return db - da;
  });

  return combined;
}

// Salva lista atualizada no JSON do Hub
function saveRequestsToJson(requests) {
  try {
    const dir = path.dirname(REQUESTS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao gravar access_requests.json:', err.message);
  }
}

// Aprova uma solicitação de acesso (seja do Hub ou do FinControl)
async function approveRequest({ requestId, email, name }) {
  if (!requestId || !email) {
    throw new Error('ID da solicitação e e-mail são obrigatórios.');
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name ? name.trim() : cleanEmail.split('@')[0];
  const finPaths = getFinControlPaths();

  // Gera senha temporária forte
  const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
  const tempPassword = `FinControl#${randomSuffix}!`;
  const passwordHash = bcrypt.hashSync(tempPassword, 10);
  const userId = 'usr-' + Date.now();

  let isFinControl = false;

  // 1. Verifica se a solicitação pertence ao FinControl
  try {
    if (fs.existsSync(finPaths.requestsFile)) {
      const finReqs = JSON.parse(fs.readFileSync(finPaths.requestsFile, 'utf8'));
      if (Array.isArray(finReqs)) {
        const foundIdx = finReqs.findIndex(r => r.id === requestId || (r.email && r.email.toLowerCase() === cleanEmail));
        if (foundIdx !== -1) {
          isFinControl = true;
          finReqs[foundIdx].status = 'approved';
          finReqs[foundIdx].tempPassword = tempPassword;
          finReqs[foundIdx].updatedAt = new Date().toISOString();
          fs.writeFileSync(finPaths.requestsFile, JSON.stringify(finReqs, null, 2), 'utf8');

          // Cadastra o usuário no banco local do FinControl
          let finUsers = {};
          if (fs.existsSync(finPaths.usersFile)) {
            try { finUsers = JSON.parse(fs.readFileSync(finPaths.usersFile, 'utf8')); } catch {}
          }

          if (!finUsers[cleanEmail]) {
            finUsers[cleanEmail] = {
              name: cleanName,
              email: cleanEmail,
              password: tempPassword,
              status: 'active',
              createdAt: new Date().toISOString(),
              perfil: {
                nome: cleanName,
                email: cleanEmail,
                senha: tempPassword,
                senhaTemporaria: true,
                rendaLiquida: finReqs[foundIdx].salario || 0,
                rendaExtraMes: 0,
                whatsappPhone: finReqs[foundIdx].whatsapp || '',
                meta: 'Controle de gastos pessoais'
              },
              dividaItau: {},
              parcelas: [],
              gastosFixos: [],
              despesasVariaveis: [],
              metas: []
            };
          } else {
            finUsers[cleanEmail].password = tempPassword;
            if (finUsers[cleanEmail].perfil) {
              finUsers[cleanEmail].perfil.senha = tempPassword;
              finUsers[cleanEmail].perfil.senhaTemporaria = true;
            }
          }
          fs.writeFileSync(finPaths.usersFile, JSON.stringify(finUsers, null, 2), 'utf8');
        }
      }
    }
  } catch (err) {
    console.warn('[UserManagement] Erro ao atualizar FinControl:', err.message);
  }

  // 2. Se for do CloudOps Hub, salva no MySQL e no users.json
  if (!isFinControl) {
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

    // Atualiza status no JSON do Hub
    try {
      if (fs.existsSync(REQUESTS_FILE)) {
        const hubReqs = JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf8'));
        const updated = hubReqs.map(r => {
          if (r.id === requestId || r.email.toLowerCase() === cleanEmail) {
            return { ...r, status: 'approved', approvedAt: new Date().toISOString(), tempPasswordGiven: true };
          }
          return r;
        });
        saveRequestsToJson(updated);
      }
      await db.query('UPDATE access_requests SET status = "approved" WHERE id = ? OR email = ?', [requestId, cleanEmail]);
    } catch {}
  }

  // 3. Dispara e-mail se configurado
  if (typeof emailService.sendWelcomeCredentialsEmail === 'function') {
    emailService.sendWelcomeCredentialsEmail({
      name: cleanName,
      email: cleanEmail,
      tempPassword
    }).catch(err => console.warn('[UserManagement] Falha ao enviar email:', err.message));
  }

  // 4. Notifica o admin no WhatsApp com link correspondente
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const appUrl = isFinControl ? 'https://controle-financeiro-mauve-two.vercel.app/' : 'https://cloudops-hub-dun.vercel.app/';
  const systemName = isFinControl ? 'FinControl (Gestão Financeira)' : 'CloudOps Hub';

  const alertText = encodeURIComponent(
    `✅ *${systemName} - Acesso Aprovado!*\n\n` +
    `👤 *Usuário:* ${cleanName}\n` +
    `✉️ *E-mail:* ${cleanEmail}\n` +
    `🔑 *Senha Temporária:* ${tempPassword}\n\n` +
    `🔗 *Link do Sistema:* ${appUrl}\n\n` +
    `_Envie a senha para o solicitante acessar agora._`
  );
  https.get(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${alertText}&apikey=${apiKey}`).on('error', () => {});

  return {
    success: true,
    message: `Acesso aprovado com sucesso para ${cleanName} no ${systemName}!`,
    user: {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      tempPassword,
      appUrl,
      systemName
    }
  };
}

// Rejeita uma solicitação
async function rejectRequest({ requestId, reason }) {
  const finPaths = getFinControlPaths();

  // FinControl
  try {
    if (fs.existsSync(finPaths.requestsFile)) {
      const finReqs = JSON.parse(fs.readFileSync(finPaths.requestsFile, 'utf8'));
      const fIdx = finReqs.findIndex(r => r.id === requestId);
      if (fIdx !== -1) {
        finReqs[fIdx].status = 'rejected';
        finReqs[fIdx].updatedAt = new Date().toISOString();
        fs.writeFileSync(finPaths.requestsFile, JSON.stringify(finReqs, null, 2), 'utf8');
      }
    }
  } catch {}

  // Hub
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
  } catch {}

  return { success: true, message: 'Solicitação rejeitada.' };
}

// Lista usuários cadastrados (sem expor hash)
async function listRegisteredUsers() {
  const users = [];
  const seenEmails = new Set();

  // Master
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

  // 1. Usuários do MySQL
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

  // 2. Usuários do users.json do Hub
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

  // 3. Usuários do FinControl (Gestão Financeira)
  try {
    const finPaths = getFinControlPaths();
    if (fs.existsSync(finPaths.usersFile)) {
      const finUsers = JSON.parse(fs.readFileSync(finPaths.usersFile, 'utf8'));
      for (const [email, user] of Object.entries(finUsers)) {
        const cleanEmail = email.toLowerCase();
        if (!seenEmails.has(cleanEmail)) {
          seenEmails.add(cleanEmail);
          users.push({
            id: `usr-fin-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
            name: user.name || user.perfil?.nome || cleanEmail.split('@')[0],
            email: cleanEmail,
            role: 'FinControl User',
            status: user.status === 'blocked' ? 'Bloqueado' : 'Ativo',
            system: 'FinControl',
            createdAt: user.createdAt || '2026-09-23T00:00:00.000Z'
          });
        }
      }
    }
  } catch (err) {
    console.error('Erro ao listar usuários do FinControl:', err.message);
  }

  return users;
}

module.exports = {
  getAccessRequests,
  approveRequest,
  rejectRequest,
  listRegisteredUsers
};
