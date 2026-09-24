/**
 * authRoutes.js — Rotas de Autenticação, Usuários, Solicitações de Acesso e Auditoria
 */

const authService = require('../authService');
const emailService = require('../emailService');
const userManagementService = require('../userManagementService');
const auditService = require('../auditService');
const { extractClientIp } = require('../security');

async function authRoutes(fastify, options) {
  // Solicitação de Acesso / Cadastro de Novos Usuários
  fastify.post('/api/auth/request-access', async (request, reply) => {
    const { name, email, note } = request.body || {};
    const clientIp = extractClientIp(request);

    if (!name || !email) {
      return reply.code(400).send({ success: false, error: 'Nome e e-mail são obrigatórios.' });
    }

    auditService.logEvent({
      user: email,
      action: 'REQUEST_ACCESS',
      target: 'system',
      ip: clientIp,
      status: 'SUCCESS',
      details: `Solicitação de acesso por ${name}`
    });

    await emailService.sendAccessRequestEmail({
      name: name.trim(),
      email: email.trim(),
      note: note ? note.trim() : ''
    });

    return {
      success: true,
      message: 'Solicitação enviada ao administrador! Aguarde as instruções de acesso por e-mail.'
    };
  });

  // Rota de Login Master Seguro (com Rate Limit estrito: 5 req/min por IP)
  fastify.post('/api/auth/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body || {};
    const clientIp = extractClientIp(request);

    const res = await authService.login(email, password);

    auditService.logEvent({
      user: email || 'anonymous',
      action: 'AUTH_LOGIN',
      target: 'cloudops-hub',
      ip: clientIp,
      status: res.success ? 'SUCCESS' : 'FAILED',
      details: res.success ? 'Login realizado com sucesso' : (res.error || 'Credenciais inválidas')
    });

    if (!res.success) {
      return reply.code(401).send(res);
    }
    return res;
  });

  // Validação de Sessão / Token do Usuário
  fastify.get('/api/auth/me', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({ success: false, error: 'Token não fornecido.' });
    }
    const token = authHeader.split(' ')[1];
    const user = authService.verifyToken(token);
    if (!user) {
      return reply.code(401).send({ success: false, error: 'Token inválido ou expirado.' });
    }
    return { success: true, user };
  });

  // Gerenciamento Administrativo de Solicitações de Acesso
  fastify.get('/api/admin/requests', async (request, reply) => {
    const list = await userManagementService.getPendingRequests();
    return { success: true, requests: list };
  });

  fastify.post('/api/admin/approve-request', async (request, reply) => {
    const { id } = request.body || {};
    const clientIp = extractClientIp(request);
    const result = await userManagementService.approveRequest(id);

    auditService.logEvent({
      user: 'admin',
      action: 'APPROVE_USER_REQUEST',
      target: `request_${id}`,
      ip: clientIp,
      status: result.success ? 'SUCCESS' : 'FAILED',
      details: result.message || result.error
    });

    return result;
  });

  fastify.post('/api/admin/reject-request', async (request, reply) => {
    const { id } = request.body || {};
    const clientIp = extractClientIp(request);
    const result = await userManagementService.rejectRequest(id);

    auditService.logEvent({
      user: 'admin',
      action: 'REJECT_USER_REQUEST',
      target: `request_${id}`,
      ip: clientIp,
      status: result.success ? 'SUCCESS' : 'FAILED'
    });

    return result;
  });

  fastify.get('/api/admin/users', async () => {
    const users = await userManagementService.getAllUsers();
    return { success: true, users };
  });

  // Trilha de Auditoria (Audit Trail)
  fastify.get('/api/admin/audit-trail', async () => {
    const events = auditService.getRecentEvents(100);
    return { success: true, events, total: events.length };
  });
}

module.exports = authRoutes;
