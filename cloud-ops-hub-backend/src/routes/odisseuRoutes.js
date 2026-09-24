/**
 * odisseuRoutes.js — Rotas do Copiloto Odisseu AI (RAG, Chat e Base de Conhecimento)
 */

const odisseuAgent = require('../odisseuAgent');

async function odisseuRoutes(fastify, options) {
  fastify.post('/api/odisseu/chat', async (request, reply) => {
    const { message, chatHistory = [], provider = 'groq', apiKey = '', model = '', serverConnected = false, serverName = '', serverIp = '' } = request.body || {};

    if (!message || typeof message !== 'string') {
      return reply.status(400).send({ error: 'Mensagem do usuário é obrigatória.' });
    }

    try {
      const result = await odisseuAgent.askOdisseu({
        message,
        chatHistory,
        provider,
        apiKey,
        model,
        serverConnected,
        serverName,
        serverIp
      });
      return result;
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: err.message
      });
    }
  });

  fastify.post('/api/odisseu/test-key', async (request, reply) => {
    const { provider = 'groq', apiKey = '', model = '' } = request.body || {};

    try {
      const result = await odisseuAgent.testApiKey({ provider, apiKey, model });
      return result;
    } catch (err) {
      return reply.status(500).send({
        valid: false,
        error: err.message
      });
    }
  });

  fastify.get('/api/odisseu/knowledge', async (request, reply) => {
    try {
      const stats = odisseuAgent.ragKnowledgeBase.getKnowledgeStats();
      return { success: true, ...stats };
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post('/api/odisseu/knowledge/reindex', async (request, reply) => {
    try {
      const stats = odisseuAgent.ragKnowledgeBase.reindex();
      return { success: true, message: 'Base de conhecimento re-indexada com sucesso!', ...stats };
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });
}

module.exports = odisseuRoutes;
