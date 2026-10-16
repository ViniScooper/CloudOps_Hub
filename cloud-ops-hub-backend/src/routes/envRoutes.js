/**
 * envRoutes.js — Gerenciador Visual Seguro de Variáveis de Ambiente & OCI Vault
 * 
 * Arquitetura de Segurança:
 * - Leitura e gravação via secretProvider (OCI Vault / AES-256-GCM).
 * - Zero .env em texto puro no disco da VM.
 * - Injeção direta em memória RAM nos containers e serviços.
 */

const deployService = require('../deployService');
const oracleScraper = require('../oracleScraper');
const auditService = require('../auditService');
const secretProvider = require('../secretProvider');
const { extractClientIp } = require('../security');

async function envRoutes(fastify, options) {
  fastify.get('/api/env', async (request) => {
    const { project = 'cloudops_hub' } = request.query || {};

    // Base de templates por projeto
    const baseTemplates = {
      cloudops_hub: [
        { key: 'PORT', value: process.env.PORT || '3005', isSecret: false, description: 'Porta HTTP do servidor Fastify' },
        { key: 'FASTIFY_ADDRESS', value: process.env.FASTIFY_ADDRESS || '0.0.0.0', isSecret: false, description: 'Interface de escuta na VM' },
        { key: 'NODE_ENV', value: process.env.NODE_ENV || 'production', isSecret: false, description: 'Ambiente de execução' },
        { key: 'ORDS_HOST', value: process.env.ORDS_HOST || 'https://xxxx.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle Autonomous Database' },
        { key: 'ORDS_PATH', value: process.env.ORDS_PATH || '/ords/admin/_/sql', isSecret: false, description: 'Caminho REST SQL no Oracle Cloud' },
        { key: 'ORDS_ENABLED', value: process.env.ORDS_ENABLED || 'true', isSecret: false, description: 'Persistência no Oracle Cloud (Zero consumo RAM na VM)' },
        { key: 'WHATSAPP_PHONE', value: process.env.WHATSAPP_PHONE || '55XXXXXXXXXXX', isSecret: false, description: 'WhatsApp do Admin para Alertas' },
        { key: 'WHATSAPP_APIKEY', value: process.env.WHATSAPP_APIKEY ? '••••••••' : 'api_key_callmebot_aqui', isSecret: true, description: 'API Key CallMeBot WhatsApp' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET ? '••••••••' : 'jwt_secret_token_master_placeholder', isSecret: true, description: 'Chave secreta para autenticação JWT Master' }
      ],
      controle_financeiro: [
        { key: 'PORT', value: '3006', isSecret: false, description: 'Porta HTTP do container financeiro_backend' },
        { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução do container' },
        { key: 'ORDS_HOST', value: process.env.ORDS_HOST || 'https://xxxx.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle ATP Cloud' },
        { key: 'ADMIN_EMAIL', value: process.env.ADMIN_EMAIL || 'admin@exemplo.com', isSecret: false, description: 'E-mail do Administrador Master' },
        { key: 'ADMIN_NAME', value: process.env.ADMIN_NAME || 'Administrador Master', isSecret: false, description: 'Nome do Administrador' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET ? '••••••••' : 'fincontrol_jwt_secret_placeholder', isSecret: true, description: 'Chave de assinatura dos tokens do FinControl' },
        { key: 'CALLMEBOT_API_KEY', value: process.env.CALLMEBOT_API_KEY ? '••••••••' : 'callmebot_api_key_placeholder', isSecret: true, description: 'API Key do robô de notificações WhatsApp' }
      ],
      cardapio_digital: [
        { key: 'PORT', value: '3002', isSecret: false, description: 'Porta do container boteco_backend' },
        { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução' },
        { key: 'DB_HOST', value: process.env.DB_HOST || '127.0.0.1', isSecret: false, description: 'Host do MySQL' },
        { key: 'DB_PORT', value: process.env.DB_PORT || '3306', isSecret: false, description: 'Porta de conexão MySQL' },
        { key: 'DB_USER', value: process.env.DB_USER || 'app_user', isSecret: false, description: 'Usuário do banco de dados' },
        { key: 'DB_PASSWORD', value: process.env.DB_PASSWORD ? '••••••••' : 'db_password_placeholder', isSecret: true, description: 'Senha criptografada do MySQL' },
        { key: 'JWT_SECRET', value: process.env.JWT_SECRET ? '••••••••' : 'app_jwt_secret_placeholder', isSecret: true, description: 'Chave de segurança de autenticação' }
      ],
      auto_apply_bot: [
        { key: 'CANDIDATE_NAME', value: 'José Vinicius Lourenço', isSecret: false, description: 'Nome do candidato nos formulários ATS' },
        { key: 'CANDIDATE_EMAIL', value: 'vviniciuslourenco@gmail.com', isSecret: false, description: 'E-mail para contato e recrutadores' },
        { key: 'PORTFOLIO_URL', value: 'https://portfolio-dusky-phi-38.vercel.app/', isSecret: false, description: 'URL do Portfólio oficial' },
        { key: 'LINKEDIN_URL', value: 'https://www.linkedin.com/in/jose-vinicius-louren%C3%A7o-1a6b9014a/', isSecret: false, description: 'LinkedIn do candidato' },
        { key: 'AUTO_APPLY_MODE', value: 'true', isSecret: false, description: 'Modo automático ativo 24/7' },
        { key: 'GROQ_API_KEY', value: process.env.GROQ_API_KEY ? '••••••••' : 'gsk_placeholder', isSecret: true, description: 'Chave Groq Cloud para IA de varredura' },
        { key: 'GEMINI_API_KEY', value: process.env.GEMINI_API_KEY ? '••••••••' : 'AIzaSy_placeholder', isSecret: true, description: 'Chave Gemini AI Studio' }
      ]
    };

    const templateList = baseTemplates[project] || baseTemplates.cloudops_hub;

    // Busca segredos salvos no OCI Vault ou no arquivo encriptado local
    let savedSecrets = {};
    try {
      savedSecrets = await secretProvider.getSecrets(project);
    } catch (_) {}

    // Mescla valores salvos mantendo a máscara de exibição para secrets
    const list = templateList.map(item => {
      if (savedSecrets[item.key] !== undefined) {
        return {
          ...item,
          value: item.isSecret ? '••••••••' : savedSecrets[item.key]
        };
      }
      return item;
    });

    const status = secretProvider.getProviderStatus();

    return {
      success: true,
      project,
      envVars: list,
      security: {
        provider: status.activeProvider,
        ociVaultAvailable: status.ociAvailable,
        mode: status.securityLevel
      }
    };
  });

  fastify.post('/api/env', async (request) => {
    const { project = 'cloudops_hub', envVars = [] } = request.body || {};
    const clientIp = extractClientIp(request);

    // Converte lista em dicionário chave/valor
    const secretsMap = {};
    for (const item of envVars) {
      if (item && item.key) {
        // Se o valor for a máscara '••••••••', busca o valor anterior existente para não sobrescrever com asteriscos
        if (item.value === '••••••••') {
          const prev = await secretProvider.getSecrets(project);
          secretsMap[item.key] = prev[item.key] || '';
        } else {
          secretsMap[item.key] = item.value;
        }
      }
    }

    // Salva com criptografia (OCI Vault ou AES-256-GCM local)
    const saveResult = await secretProvider.saveSecrets(project, secretsMap);

    let restartMsg = '';
    try {
      if (project === 'controle_financeiro' || project === 'fincontrol') {
        await deployService.runRemoteSsh('sudo docker restart financeiro_backend');
        restartMsg = 'Container financeiro_backend reiniciado com sucesso com segredos em memória!';
      } else if (project === 'cardapio_digital' || project === 'boteco_backend') {
        await deployService.runRemoteSsh('sudo docker restart boteco_backend');
        restartMsg = 'Container boteco_backend reiniciado com sucesso com segredos em memória!';
      } else {
        restartMsg = 'Configurações salvas e encriptadas no cofre!';
      }
    } catch (err) {
      restartMsg = 'Salvo no cofre! Aviso no restart: ' + err.message;
    }

    auditService.logEvent({
      user: 'operator',
      action: 'UPDATE_ENCRYPTED_SECRETS',
      target: project,
      ip: clientIp,
      status: 'SUCCESS',
      details: `Atualizados segredos com ${saveResult.storage} para ${project}`
    });

    oracleScraper.sendWhatsAppNotification(`🔐 *CloudOps Hub:* Segredos de *${project}* foram encriptados e atualizados via ${saveResult.storage}.`);

    return {
      success: true,
      project,
      storage: saveResult.storage,
      updatedAt: new Date().toISOString(),
      message: restartMsg || 'Segredos salvos com sucesso!'
    };
  });
}

module.exports = envRoutes;
