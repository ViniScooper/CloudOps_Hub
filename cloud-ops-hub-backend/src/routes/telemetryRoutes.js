/**
 * telemetryRoutes.js — Rotas de Telemetria de Erros, Logs do Sistema e Simulação
 */

const telemetryService = require('../telemetryService');
const { extractClientIp } = require('../security');

async function telemetryRoutes(fastify, options) {
  fastify.post('/api/telemetry/log', async (request, reply) => {
    const logData = request.body || {};
    const clientIp = extractClientIp(request);
    const newLog = telemetryService.recordLog({
      ...logData,
      ip: clientIp
    });
    return { success: true, log: newLog };
  });

  fastify.get('/api/telemetry/logs', async (request) => {
    const { level, source, search, limit } = request.query || {};
    return telemetryService.getLogs({ level, source, search, limit });
  });

  fastify.delete('/api/telemetry/logs', async () => {
    return telemetryService.clearLogs();
  });

  fastify.post('/api/telemetry/clear', async () => {
    return telemetryService.clearLogs();
  });

  fastify.get('/api/telemetry/clear', async () => {
    return telemetryService.clearLogs();
  });

  fastify.post('/api/telemetry/simulate', async (request) => {
    const { type = 'error' } = request.body || {};
    const simulated = telemetryService.recordLog({
      level: type === 'critical' ? 'CRITICAL' : (type === 'warn' ? 'WARN' : 'ERROR'),
      source: 'Cardápio Digital (App)',
      message: type === 'critical' ? 'Falha de conexão com Gateway de Pagamento' : 'Erro 500: Falha ao carregar lista de complementos do prato #867',
      path: '/api/pratos/867/complementos',
      method: 'GET',
      statusCode: type === 'critical' ? 503 : 500,
      details: 'Error: Connection pool timeout (MySQL ETIMEDOUT ao consultar tabela prato_complementos)',
      ip: '189.34.12.75',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36'
    });
    return { success: true, log: simulated };
  });
}

module.exports = telemetryRoutes;
