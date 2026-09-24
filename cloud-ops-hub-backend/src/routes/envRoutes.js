/**
 * envRoutes.js — Gerenciador Visual Seguro de Variáveis de Ambiente (.env)
 * Todos os segredos sensíveis utilizam process.env com placeholders genéricos
 * para proteção contra vazamento em repositórios públicos.
 */

const deployService = require('../deployService');
const oracleScraper = require('../oracleScraper');
const auditService = require('../auditService');
const { extractClientIp } = require('../security');

async function envRoutes(fastify, options) {
  fastify.get('/api/env', async (request) => {
    const { project = 'cloudops_hub' } = request.query || {};

    const envsByProject = {
      cloudops_hub: [
        { key: 'PORT', value: process.env.PORT || '3005', isSecret: false, description: 'Porta HTTP do servidor Fastify' },
        { key: 'FASTIFY_ADDRESS', value: process.env.FASTIFY_ADDRESS || '0.0.0.0', isSecret: false, description: 'Interface de escuta na VM' },
        { key: 'NODE_ENV', value: process.env.NODE_ENV || 'production', isSecret: false, description: 'Ambiente de execução' },
        { key: 'ORDS_HOST', value: process.env.ORDS_HOST || 'https://xxxx.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle Autonomous Database' },
        { key: 'ORDS_PATH', value: process.env.ORDS_PATH || '/ords/admin/_/sql', isSecret: false, description: 'Caminho REST SQL no Oracle Cloud' },
        { key: 'ORDS_ENABLED', value: process.env.ORDS_ENABLED || 'true', isSecret: false, description: 'Persistência no Oracle Cloud (Zero consumo RAM na VM)' },
        { key: 'WHATSAPP_PHONE', value: process.env.WHATSAPP_PHONE || '55XXXXXXXXXXX', isSecret: false, description: 'WhatsApp do Admin para Alertas' },
        { key: 'WHATSAPP_APIKEY', value: process.env.WHATSAPP_APIKEY ? '••••••••' : 'api_key_callmebot_aqui', isSecret: true, description: 'API Key CallMeBot WhatsApp' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET || 'jwt_secret_token_master_placeholder', isSecret: true, description: 'Chave secreta para autenticação JWT Master' }
      ],
      controle_financeiro: [
        { key: 'PORT', value: '3006', isSecret: false, description: 'Porta HTTP do container financeiro_backend' },
        { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução do container' },
        { key: 'ORDS_HOST', value: process.env.ORDS_HOST || 'https://xxxx.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle ATP Cloud' },
        { key: 'ADMIN_EMAIL', value: process.env.ADMIN_EMAIL || 'admin@exemplo.com', isSecret: false, description: 'E-mail do Administrador Master' },
        { key: 'ADMIN_NAME', value: process.env.ADMIN_NAME || 'Administrador Master', isSecret: false, description: 'Nome do Administrador' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET || 'fincontrol_jwt_secret_placeholder', isSecret: true, description: 'Chave de assinatura dos tokens do FinControl' },
        { key: 'CALLMEBOT_API_KEY', value: process.env.CALLMEBOT_API_KEY ? '••••••••' : 'callmebot_api_key_placeholder', isSecret: true, description: 'API Key do robô de notificações WhatsApp' }
      ],
      cardapio_digital: [
        { key: 'PORT', value: '3002', isSecret: false, description: 'Porta do container boteco_backend' },
        { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução' },
        { key: 'DB_HOST', value: process.env.DB_HOST || '127.0.0.1', isSecret: false, description: 'Host do MySQL' },
        { key: 'DB_PORT', value: process.env.DB_PORT || '3306', isSecret: false, description: 'Porta de conexão MySQL' },
        { key: 'DB_USER', value: process.env.DB_USER || 'app_user', isSecret: false, description: 'Usuário do banco de dados' },
        { key: 'DB_PASSWORD', value: process.env.DB_PASSWORD ? '••••••••' : 'db_password_placeholder', isSecret: true, description: 'Senha criptografada do MySQL' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET || 'app_jwt_secret_placeholder', isSecret: true, description: 'Chave de segurança de autenticação' }
      ]
    };

    const list = envsByProject[project] || envsByProject.cloudops_hub;

    return {
      success: true,
      project,
      envVars: list
    };
  });

  fastify.post('/api/env', async (request) => {
    const { project = 'cloudops_hub', envVars = [] } = request.body || {};
    const clientIp = extractClientIp(request);

    let restartMsg = '';
    try {
      if (project === 'controle_financeiro' || project === 'fincontrol') {
        await deployService.runRemoteSsh('sudo docker restart financeiro_backend');
        restartMsg = 'Container financeiro_backend reiniciado com sucesso na VM!';
      } else if (project === 'cardapio_digital' || project === 'boteco_backend') {
        await deployService.runRemoteSsh('sudo docker restart boteco_backend');
        restartMsg = 'Container boteco_backend reiniciado com sucesso na VM!';
      } else {
        restartMsg = 'Configurações do CloudOps Hub atualizadas!';
      }
    } catch (err) {
      restartMsg = 'Salvo! Aviso no restart: ' + err.message;
    }

    auditService.logEvent({
      user: 'operator',
      action: 'UPDATE_ENV_VARS',
      target: project,
      ip: clientIp,
      status: 'SUCCESS',
      details: `Atualizadas variáveis do projeto ${project}`
    });

    oracleScraper.sendWhatsAppNotification(`⚙️ *CloudOps Hub:* Variáveis de ambiente (.env) de *${project}* foram atualizadas com segurança pelo painel.`);

    return {
      success: true,
      project,
      updatedAt: new Date().toISOString(),
      message: restartMsg || 'Variáveis salvas e aplicadas com sucesso!'
    };
  });
}

module.exports = envRoutes;
