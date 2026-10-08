const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const OLD_DEFAULT_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const RAW_KEY = process.env.MASTER_KEY || '';
if (!/^[0-9a-fA-F]{64}$/.test(RAW_KEY) || RAW_KEY.toLowerCase() === OLD_DEFAULT_KEY) {
  throw new Error('MASTER_KEY ausente, inválida (precisa de 64 hex) ou igual ao valor padrão antigo. Gere com: node scripts/rotate_secrets.js --generate');
}
const MASTER_KEY = Buffer.from(RAW_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, MASTER_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag
  };
}

function decrypt(encrypted, ivHex, tagHex) {
  const decipher = crypto.createDecipheriv(ALGORITHM, MASTER_KEY, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };
