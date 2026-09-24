/**
 * auditService.js — Trilha de Auditoria e Registro de Ações Críticas (Audit Trail)
 * Registra quem, quando, qual ação, IP de origem e status de operações no CloudOps Hub.
 */

const fs = require('fs');
const path = require('path');

const LOG_FILE = path.join(__dirname, '..', 'audit_trail.log');
const MAX_MEMORY_EVENTS = 200;
const memoryEvents = [];

/**
 * Registra um evento de auditoria
 * @param {Object} event
 * @param {string} event.user - Nome ou email do usuário (ou 'anonymous' / 'system')
 * @param {string} event.action - Ação realizada (ex: 'EXEC_COMMAND', 'DEPLOY', 'RESTART_CONTAINER')
 * @param {string} event.target - Alvo da ação (ex: 'boteco_backend', 'instance-bytedata')
 * @param {string} event.ip - Endereço IP do requisitante
 * @param {string} event.status - 'SUCCESS', 'FAILED', 'BLOCKED'
 * @param {string} [event.details] - Informações adicionais
 */
function logEvent({ user = 'system', action, target = '-', ip = '127.0.0.1', status = 'SUCCESS', details = '' }) {
  const entry = {
    id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    timestamp: new Date().toISOString(),
    user,
    action,
    target,
    ip,
    status,
    details: typeof details === 'string' ? details.slice(0, 500) : JSON.stringify(details).slice(0, 500)
  };

  // Mantém no buffer de memória
  memoryEvents.unshift(entry);
  if (memoryEvents.length > MAX_MEMORY_EVENTS) {
    memoryEvents.pop();
  }

  // Grava em arquivo de log de forma assíncrona/não bloqueante
  try {
    fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
      if (err) console.error('[AuditService] Erro ao gravar log em disco:', err.message);
    });
  } catch (err) {
    console.error('[AuditService] Falha ao persistir evento:', err.message);
  }

  return entry;
}

/**
 * Retorna os últimos eventos de auditoria
 */
function getRecentEvents(limit = 100) {
  return memoryEvents.slice(0, limit);
}

module.exports = {
  logEvent,
  getRecentEvents
};
