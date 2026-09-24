require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');
const websocket = require('@fastify/websocket');

// Serviços de Inicialização
const cronService = require('./cronService');
const watchdogService = require('./watchdogService');

// Módulos de Rotas
const authRoutes = require('./routes/authRoutes');
const serverRoutes = require('./routes/serverRoutes');
const dockerRoutes = require('./routes/dockerRoutes');
const deployRoutes = require('./routes/deployRoutes');
const envRoutes = require('./routes/envRoutes');
const odisseuRoutes = require('./routes/odisseuRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const integrationsRoutes = require('./routes/integrationsRoutes');

async function buildServer() {
  // 1. CORS
  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // 2. Rate Limiting Global (120 reqs/min por IP)
  await fastify.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1', 'localhost']
  });

  // 3. WebSockets em Tempo Real (Logs de Docker e Terminal)
  await fastify.register(websocket, {
    options: { maxPayload: 1048576 } // 1MB payload
  });

  // 4. Verificação de Saúde
  fastify.get('/api/health', async () => ({
    status: 'ok',
    version: '2.0.0-modular',
    uptime: process.uptime(),
    time: new Date().toISOString()
  }));

  // 5. Registro Modular de Rotas
  await fastify.register(authRoutes);
  await fastify.register(serverRoutes);
  await fastify.register(dockerRoutes);
  await fastify.register(deployRoutes);
  await fastify.register(envRoutes);
  await fastify.register(odisseuRoutes);
  await fastify.register(telemetryRoutes);
  await fastify.register(integrationsRoutes);

  return fastify;
}

const start = async () => {
  try {
    const app = await buildServer();

    // Inicia agendador de Cron / Anti-Sleep
    cronService.initCronScheduler();

    // Inicia Watchdog de Monitoramento Proativo de RAM e Containers (a cada 3 min)
    watchdogService.startWatchdog(3);

    const port = process.env.PORT || 3005;
    await app.listen({ port: Number(port), host: '0.0.0.0' });
    console.log(`🚀 [CloudOps Hub] Backend Modular & Seguro ativo na porta ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
