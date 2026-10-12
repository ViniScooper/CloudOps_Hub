/**
 * storageHelper.js — Gerenciador de Armazenamento Seguro com Escrita Atômica
 * Protege arquivos de dados contra corrupção (race conditions, crashes no meio da escrita).
 * Utiliza o padrão write-to-temp + rename atômico do sistema operacional.
 */

const fs = require('fs');
const path = require('path');

/**
 * Lê um arquivo JSON de forma segura com fallback
 * @param {string} filePath
 * @param {any} defaultValue
 * @returns {any}
 */
function readJsonSafe(filePath, defaultValue = null) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn(`[storageHelper] Erro ao ler ${path.basename(filePath)}: ${err.message}. Usando valor padrão.`);
  }
  return defaultValue;
}

/**
 * Grava um arquivo JSON de forma 100% atômica:
 * 1. Escreve em um arquivo temporário com sufixo aleatório
 * 2. Faz fs.renameSync para o arquivo final (operação atômica garantida pelo SO)
 * Isso impede que falhas repentinas ou requisições concorrentes deixem o arquivo corrompido ou vazio.
 * 
 * @param {string} filePath
 * @param {any} data
 */
function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempFile = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;
  const content = JSON.stringify(data, null, 2);

  try {
    fs.writeFileSync(tempFile, content, 'utf8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (err) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
    console.error(`[storageHelper] Falha ao persistir atomicamente ${path.basename(filePath)}:`, err.message);
    throw err;
  }
}

module.exports = {
  readJsonSafe,
  writeJsonAtomic
};
