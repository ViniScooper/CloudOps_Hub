const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_cloudops_hub_2026';
const MASTER_EMAIL = 'vviniciuslourenco@gmail.com';
// Hash bcrypt de 'CloudOps#Master2026!'
const MASTER_HASH = '$2b$10$Qf.og1E5jN/KInwQbmzBrOHDpBA7.nzPix.lKvccz7i.unnYyBbHO';

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
  if (!user && cleanEmail === MASTER_EMAIL) {
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
