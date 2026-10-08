const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

// Segredos obrigatórios via ambiente: sem fallback hardcoded (falha ao subir se ausentes/fracos)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32 || /super_secret_jwt_cloudops_hub/i.test(JWT_SECRET)) {
  throw new Error('JWT_SECRET ausente, curto (<32) ou igual ao valor padrão antigo. Defina um segredo forte no .env.');
}

// Usuário master vem do ambiente (MASTER_EMAIL + MASTER_PASSWORD_HASH em bcrypt); desativado se ausente
const MASTER_EMAIL = (process.env.MASTER_EMAIL || '').trim().toLowerCase();
const MASTER_HASH = process.env.MASTER_PASSWORD_HASH || '';

async function login(email, password) {
  if (!email || !password) {
    return { success: false, error: 'E-mail e senha são obrigatórios.' };
  }

  const cleanEmail = email.trim().toLowerCase();

  // 1. Tenta buscar no banco de dados MySQL
  let user = await db.getUserByEmail(cleanEmail);

  // 2. Se não encontrar no MySQL, busca no users.json local
  if (!user) {
    const fs = require('fs');
    const path = require('path');
    const USERS_FILE = path.join(__dirname, '..', 'database', 'users.json');
    if (fs.existsSync(USERS_FILE)) {
      try {
        const jsonList = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        user = jsonList.find(u => (u.email || '').toLowerCase() === cleanEmail);
      } catch {}
    }
  }

  // 3. Fallback master para o proprietário da infraestrutura
  if (!user && MASTER_EMAIL && MASTER_HASH && cleanEmail === MASTER_EMAIL) {
    user = {
      id: 'usr-master-01',
      name: 'Vinicius Lourenco (Master)',
      email: MASTER_EMAIL,
      password_hash: MASTER_HASH,
      role: 'admin'
    };
  }

  if (!user) {
    return { success: false, error: 'Credenciais inválidas.' };
  }

  // Compara senha usando bcrypt
  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    return { success: false, error: 'Credenciais inválidas.' };
  }

  // Gera token JWT válido por 7 dias
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  login,
  verifyToken
};
