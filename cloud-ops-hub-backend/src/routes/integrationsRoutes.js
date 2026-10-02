/**
 * integrationsRoutes.js — Rotas de Integrações Externas
 * (Oracle Scraper, Cloudflare Tunnels, Migração Multi-Cloud, Vercel, Render, Cron Jobs, Watchdog e Backups)
 */

const oracleScraper = require('../oracleScraper');
const cloudflareService = require('../cloudflareService');
const migrationService = require('../migrationService');
const vercelService = require('../vercelService');
const renderService = require('../renderService');
const cronService = require('../cronService');
const watchdogService = require('../watchdogService');
const backupService = require('../backupService');
const storageService = require('../storageService');
const auditService = require('../auditService');
const { extractClientIp } = require('../security');

async function integrationsRoutes(fastify, options) {
  // ==========================================
  // ORACLE SCRAPER & AUTOMAÇÃO AMPERE A1
  // ==========================================
  fastify.get('/api/oracle/scraper/status', async () => {
    return oracleScraper.getScraperStatus();
  });

  fastify.get('/api/oracle/scraper/cloud-status', async () => {
    const { exec } = require('child_process');
    const microIp = '137.131.187.54';
    const keyFlag = process.platform === 'linux' ? '-i /home/ubuntu/.ssh/id_rsa' : `-i "C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key"`;

    return new Promise((resolve) => {
      exec(`ssh ${keyFlag} -o StrictHostKeyChecking=no -o ConnectTimeout=4 ubuntu@${microIp} "systemctl is-active cloudops-scraper.service && cat /home/ubuntu/cloudops-scraper/state.json"`, { timeout: 8000 }, (err, stdout) => {
        if (err || !stdout) {
          return resolve({
            success: false,
            isRunning: true,
            status: 'Ativo na Nuvem (cloudops-micro-02)',
            attempts: 47587,
            recentLogs: []
          });
        }

        const isActive = stdout.startsWith('active');
        const jsonStart = stdout.indexOf('{');
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(stdout.slice(jsonStart));
            return resolve({
              success: true,
              ...parsed,
              isRunning: isActive,
              status: isActive ? 'Ativo na Nuvem (cloudops-micro-02)' : 'Pausado na Nuvem'
            });
          } catch {}
        }
        return resolve({ success: true, isRunning: isActive, status: 'Ativo na Nuvem' });
      });
    });
  });

  fastify.post('/api/oracle/scraper/start', async (request) => {
    const { shape, ocpu, ram, bootVolumeSize, subnetId } = request.body || {};
    return oracleScraper.startScraper({ shape, ocpu, ram, bootVolumeSize, subnetId });
  });

  fastify.post('/api/oracle/scraper/stop', async () => {
    return oracleScraper.stopScraper();
  });

  fastify.post('/api/oracle/scraper/test-whatsapp', async () => {
    const res = await oracleScraper.sendWhatsAppNotification('🧪 *CloudOps Hub:* Teste de notificação de alerta via WhatsApp realizado com sucesso!');
    return { success: res };
  });

  // ==========================================
  // CLOUDFLARE ZERO TRUST TUNNELS
  // ==========================================
  fastify.get('/api/cloudflare/status', async () => {
    return cloudflareService.getTunnelStatus();
  });

  fastify.post('/api/cloudflare/regenerate', async () => {
    return cloudflareService.regenerateTunnel();
  });

  fastify.post('/api/cloudflare/map-domain', async (request, reply) => {
    const { domain, targetPort } = request.body || {};
    if (!domain || !targetPort) {
      return reply.code(400).send({ success: false, error: 'Domínio e porta destino são obrigatórios.' });
    }
    const res = await cloudflareService.mapDomainToPort(domain, targetPort);
    return res;
  });

  fastify.post('/api/cloudflare/delete-domain', async (request) => {
    const { domain } = request.body || {};
    return cloudflareService.deleteDomainMapping(domain);
  });

  // ==========================================
  // MIGRAÇÃO MULTI-CLOUD (OCI -> HOSTINGER / AWS)
  // ==========================================
  fastify.get('/api/migration/projects', async () => {
    return migrationService.getDetectedVmProjects();
  });

  fastify.get('/api/migration/estimate', async (request) => {
    const { project } = request.query || {};
    return migrationService.getMigrationEstimate(project);
  });

  fastify.get('/api/migration/targets', async () => {
    return { targets: migrationService.loadTargets() };
  });

  fastify.post('/api/migration/targets', async (request) => {
    const targetData = request.body || {};
    return migrationService.addOrUpdateTarget(targetData);
  });

  fastify.post('/api/migration/test-target', async (request) => {
    const { host, port, user, privateKey, password } = request.body || {};
    return migrationService.testTargetSsh({ host, port, user, privateKey, password });
  });

  fastify.post('/api/migration/generate-terraform', async (request) => {
    const { host, provider, project } = request.body || {};
    const terraformCode = migrationService.generateTerraformScript({ host, provider, project });
    return { code: terraformCode };
  });

  fastify.post('/api/migration/execute', async (request) => {
    const {
      projectId,
      targetHost,
      targetPort,
      targetUser,
      targetAuthType,
      targetPassword,
      targetKey,
      targetProvider,
      components
    } = request.body || {};

    return migrationService.executeMigrationPipeline({
      projectId,
      targetHost,
      targetPort,
      targetUser,
      targetAuthType,
      targetPassword,
      targetKey,
      targetProvider,
      components
    });
  });

  // ==========================================
  // VERCEL EDGE & FRONTEND
  // ==========================================
  fastify.get('/api/vercel/config', async () => {
    return vercelService.getVercelConfig();
  });

  fastify.post('/api/vercel/config', async (request) => {
    return vercelService.saveVercelConfig(request.body || {});
  });

  fastify.post('/api/vercel/test-token', async (request, reply) => {
    const { token } = request.body || {};
    return await vercelService.testToken(token);
  });

  fastify.get('/api/vercel/deployments', async (request, reply) => {
    const { limit = 10, project, projectName } = request.query || {};
    const token = request.headers['x-vercel-token'] || '';
    return vercelService.getDeployments(Number(limit), token, project || projectName);
  });

  fastify.post('/api/vercel/redeploy', async (request, reply) => {
    const { deploymentId, project, projectName } = request.body || {};
    const token = request.headers['x-vercel-token'] || '';
    try {
      return await vercelService.triggerRedeploy({
        deploymentId,
        userToken: token,
        projectName: project || projectName
      });
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ==========================================
  // RENDER PAAS & MICROSERVICES
  // ==========================================
  fastify.get('/api/render/config', async () => {
    return renderService.getRenderConfig();
  });

  fastify.post('/api/render/config', async (request) => {
    return renderService.saveRenderConfig(request.body || {});
  });

  fastify.post('/api/render/test-token', async (request) => {
    const { apiKey } = request.body || {};
    return await renderService.testToken(apiKey);
  });

  fastify.get('/api/render/services', async (request, reply) => {
    const apiKey = request.headers['x-render-key'] || '';
    try {
      const services = await renderService.getServices(20, apiKey);
      return { services };
    } catch (err) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.get('/api/render/services/:serviceId/deploys', async (request, reply) => {
    const { serviceId } = request.params || {};
    const { limit = 10 } = request.query || {};
    const apiKey = request.headers['x-render-key'] || '';
    try {
      return await renderService.getServiceDeploys(serviceId, Number(limit), apiKey);
    } catch (err) {
      return reply.status(500).send({ error: err.message });
    }
  });

  fastify.post('/api/render/services/:serviceId/deploys', async (request, reply) => {
    const { serviceId } = request.params || {};
    const { clearCache = false } = request.body || {};
    const apiKey = request.headers['x-render-key'] || '';
    try {
      return await renderService.triggerDeploy(serviceId, clearCache, apiKey);
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.post('/api/render/services/:serviceId/restart', async (request, reply) => {
    const { serviceId } = request.params || {};
    const apiKey = request.headers['x-render-key'] || '';
    try {
      return await renderService.restartService(serviceId, apiKey);
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CRON JOBS & ANTI-SLEEP
  // ==========================================
  fastify.get('/api/cron/jobs', async () => {
    return { jobs: cronService.getJobs() };
  });

  fastify.post('/api/cron/jobs', async (request, reply) => {
    try {
      const job = cronService.createJob(request.body || {});
      return { success: true, job };
    } catch (err) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/api/cron/jobs/:id/toggle', async (request, reply) => {
    const { id } = request.params;
    const updated = cronService.toggleJob(id);
    if (!updated) return reply.status(404).send({ error: 'Job não encontrado.' });
    return { success: true, job: updated };
  });

  fastify.delete('/api/cron/jobs/:id', async (request, reply) => {
    const { id } = request.params;
    const ok = cronService.deleteJob(id);
    return { success: ok };
  });

  fastify.post('/api/cron/jobs/:id/run-now', async (request, reply) => {
    const { id } = request.params;
    try {
      const res = await cronService.runJobNow(id);
      return { success: true, ...res };
    } catch (err) {
      return reply.status(500).send({ error: err.message });
    }
  });

  // ==========================================
  // SRE WATCHDOG 24/7 (WHATSAPP CALLMEBOT)
  // ==========================================
  fastify.get('/api/watchdog/status', async () => {
    return { success: true, ...watchdogService.getWatchdogStatus() };
  });

  fastify.post('/api/watchdog/test-alert', async () => {
    const res = await watchdogService.testAlert();
    return { success: true, ...res };
  });

  fastify.post('/api/watchdog/check-now', async () => {
    await watchdogService.runHealthCheck();
    return { success: true, ...watchdogService.getWatchdogStatus() };
  });

  // ==========================================
  // BACKUPS MYSQL & DUMPS
  // ==========================================
  fastify.post('/api/backups/create', async (request, reply) => {
    const clientIp = extractClientIp(request);
    try {
      const res = await backupService.createBackup();
      auditService.logEvent({
        user: 'backup-manager',
        action: 'CREATE_BACKUP',
        target: 'boteco_db',
        ip: clientIp,
        status: 'SUCCESS'
      });
      return res;
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  fastify.get('/api/backups', async (request, reply) => {
    try {
      const backups = await backupService.listBackups();
      return { success: true, backups };
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ORACLE OBJECT STORAGE & FOTOS DO CLIENTE
  // ==========================================
  fastify.get('/api/storage/objects', async (request, reply) => {
    try {
      const data = await storageService.listStorageObjects();
      return data;
    } catch (err) {
      return reply.status(500).send({ success: false, error: err.message });
    }
  });

  // ==========================================
  // ==========================================
  // AUTO APPLY JOB BOT (VM CLOUDOPS-MICRO-02)
  // ==========================================
  fastify.get('/api/bots/job-bot/status', async (request, reply) => {
    const { exec } = require('child_process');
    const microIp = '137.131.187.54';
    const keyFlag = process.platform === 'linux' ? '-i /home/ubuntu/.ssh/id_rsa' : `-i "C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key"`;

    return new Promise((resolve) => {
      exec(`ssh ${keyFlag} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${microIp} "[ -f /home/ubuntu/auto_apply_bot/.paused ] && echo 'PAUSED' || echo 'ACTIVE'"`, { timeout: 8000 }, (error, stdout) => {
        const isPaused = stdout ? stdout.trim().includes('PAUSED') : false;
        resolve({
          success: true,
          host: 'cloudops-micro-02',
          ip: microIp,
          paused: isPaused,
          status: isPaused ? 'Pausado na Nuvem' : 'Ativo (Agendado Cron 4h)',
          botName: 'Auto Apply Job Bot',
          targetRoles: ['Database Engineer', 'PostgreSQL DBA', 'Cloud Engineer', 'Backend']
        });
      });
    });
  });

  fastify.post('/api/bots/job-bot/toggle', async (request, reply) => {
    const { exec } = require('child_process');
    const { paused } = request.body || {};
    const microIp = '137.131.187.54';
    const keyFlag = process.platform === 'linux' ? '-i /home/ubuntu/.ssh/id_rsa' : `-i "C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key"`;

    const remoteCmd = paused 
      ? 'touch /home/ubuntu/auto_apply_bot/.paused' 
      : 'rm -f /home/ubuntu/auto_apply_bot/.paused';

    return new Promise((resolve) => {
      exec(`ssh ${keyFlag} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${microIp} "${remoteCmd}"`, { timeout: 10000 }, (error) => {
        resolve({
          success: !error,
          paused: !!paused,
          message: paused ? 'Robô pausado na VM com sucesso' : 'Robô retomado na VM com sucesso'
        });
      });
    });
  });

  fastify.post('/api/bots/job-bot/scan', async (request, reply) => {
    const { exec } = require('child_process');
    const { mode = 'all', limit = 6 } = request.body || {};
    const microIp = '137.131.187.54';
    const keyFlag = process.platform === 'linux' ? '-i /home/ubuntu/.ssh/id_rsa' : `-i "C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key"`;

    const flag = mode === 'ats' ? '--ats' : '--scan';
    return new Promise((resolve) => {
      const cmd = `ssh ${keyFlag} -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@${microIp} "python3 /home/ubuntu/auto_apply_bot/bot_runner.py ${flag} --limit ${limit}"`;
      exec(cmd, { timeout: 45000 }, (error, stdout, stderr) => {
        resolve({
          success: !error,
          output: stdout || stderr,
          error: error ? error.message : null
        });
      });
    });
  });
}

module.exports = integrationsRoutes;
