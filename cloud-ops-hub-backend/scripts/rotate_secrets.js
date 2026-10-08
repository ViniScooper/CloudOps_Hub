#!/usr/bin/env node
/**
 * rotate_secrets.js — Rotação de JWT_SECRET e MASTER_KEY (AES-256-GCM) com reencriptação.
 *
 * Uso:
 *   node scripts/rotate_secrets.js --generate
 *       Apenas imprime um JWT_SECRET e uma MASTER_KEY novos (não altera nada).
 *   node scripts/rotate_secrets.js --apply [--env-file .env] [--servers database/user_servers.json]
 *       Faz backup do .env, gera novos JWT_SECRET/MASTER_KEY, reencripta o arquivo de servidores
 *       (chaves SSH privadas) da chave antiga para a nova e grava o .env atualizado.
 *
 * Importante: rotacionar o JWT_SECRET invalida todas as sessões ativas (todos precisam logar de novo).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};

const newJwt = () => crypto.randomBytes(48).toString('base64url');
const newKey = () => crypto.randomBytes(32).toString('hex');

if (args.includes('--generate')) {
  console.log(`JWT_SECRET=${newJwt()}`);
  console.log(`MASTER_KEY=${newKey()}`);
  process.exit(0);
}

if (!args.includes('--apply')) {
  console.error('Use --generate ou --apply. Veja o cabeçalho do arquivo.');
  process.exit(1);
}

const envFile = path.resolve(root, opt('--env-file', '.env'));
const serversFile = path.resolve(root, opt('--servers', 'database/user_servers.json'));

const envText = fs.readFileSync(envFile, 'utf8');
const getVar = (k) => (envText.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1];
const oldKeyHex = getVar('MASTER_KEY');
if (!/^[0-9a-fA-F]{64}$/.test(oldKeyHex || '')) {
  console.error('MASTER_KEY atual inválida no .env; abortando.');
  process.exit(1);
}

const oldKey = Buffer.from(oldKeyHex, 'hex');
const newKeyHex = newKey();
const newKeyBuf = Buffer.from(newKeyHex, 'hex');

// 1) Reencripta ANTES de gravar o .env (se falhar, nada foi alterado)
let reencrypted = 0;
let serversOut = null;
if (fs.existsSync(serversFile)) {
  const list = JSON.parse(fs.readFileSync(serversFile, 'utf8'));
  serversOut = list.map((s) => {
    if (!s.encryptedKey || !s.iv || !s.tag) return s;
    const d = crypto.createDecipheriv('aes-256-gcm', oldKey, Buffer.from(s.iv, 'hex'));
    d.setAuthTag(Buffer.from(s.tag, 'hex'));
    const plain = d.update(s.encryptedKey, 'hex', 'utf8') + d.final('utf8');
    const iv = crypto.randomBytes(16);
    const c = crypto.createCipheriv('aes-256-gcm', newKeyBuf, iv);
    const enc = c.update(plain, 'utf8', 'hex') + c.final('hex');
    reencrypted++;
    return { ...s, encryptedKey: enc, iv: iv.toString('hex'), tag: c.getAuthTag().toString('hex') };
  });
}

// 2) Backups
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
fs.copyFileSync(envFile, `${envFile}.bak-${stamp}`);
if (serversOut) fs.copyFileSync(serversFile, `${serversFile}.bak-${stamp}`);

// 3) Grava
if (serversOut) fs.writeFileSync(serversFile, JSON.stringify(serversOut, null, 2), 'utf8');
const setVar = (text, k, v) =>
  new RegExp(`^${k}=`, 'm').test(text) ? text.replace(new RegExp(`^${k}=.*$`, 'm'), `${k}=${v}`) : `${text.replace(/\s*$/, '')}\n${k}=${v}\n`;
let out = setVar(envText, 'JWT_SECRET', newJwt());
out = setVar(out, 'MASTER_KEY', newKeyHex);
fs.writeFileSync(envFile, out, 'utf8');

console.log(`OK: JWT_SECRET e MASTER_KEY rotacionados. Servidores reencriptados: ${reencrypted}.`);
console.log(`Backups: ${envFile}.bak-${stamp}${serversOut ? ' e ' + serversFile + '.bak-' + stamp : ''}`);
console.log('Atenção: apague os backups após validar (eles contêm os segredos antigos) e atualize o .env do servidor de produção.');
