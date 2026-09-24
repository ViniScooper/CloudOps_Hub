/**
 * deployRoutes.js — Rotas de CI/CD, GitFlow, Deploys e Rollbacks com Auditoria
 */

const deployService = require('../deployService');
const githubService = require('../githubService');
const oracleScraper = require('../oracleScraper');
const auditService = require('../auditService');
const { extractClientIp } = require('../security');

async function deployRoutes(fastify, options) {
  // Merge de Pull Request no GitHub
  fastify.post('/api/github/pull-request-merge', async (request, reply) => {
    const { sourceBranch = 'develop', targetBranch = 'main', title, token } = request.body || {};
    const clientIp = extractClientIp(request);

    try {
      const result = await githubService.processPullRequestAndMerge({
        sourceBranch,
        targetBranch,
        title,
        token
      });

      auditService.logEvent({
        user: 'developer',
        action: 'GITHUB_PR_MERGE',
        target: `${sourceBranch} -> ${targetBranch}`,
        ip: clientIp,
        status: 'SUCCESS',
        details: title || 'Merge realizado via GitHub API'
      });

      oracleScraper.sendWhatsAppNotification(`🔀 *CloudOps Hub:* Integração concluída!\n\nBranch *${sourceBranch}* mesclada na *${targetBranch}* com sucesso no GitHub.`);

      return result;
    } catch (err) {
      auditService.logEvent({
        user: 'developer',
        action: 'GITHUB_PR_MERGE',
        target: `${sourceBranch} -> ${targetBranch}`,
        ip: clientIp,
        status: 'FAILED',
        details: err.message
      });

      return reply.status(500).send({
        success: false,
        error: err.message,
        logs: [`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro: ${err.message}`]
      });
    }
  });

  // Deploy Real 1-Click via SSH
  fastify.post('/api/deploy', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const { project = 'app_service', branch = 'main' } = request.body || {};
    const clientIp = extractClientIp(request);

    try {
      const result = await deployService.executeDeploy({ project, branch });

      auditService.logEvent({
        user: 'deployer',
        action: 'DEPLOY_1CLICK',
        target: `${project}:${branch}`,
        ip: clientIp,
        status: 'SUCCESS',
        details: `Deploy concluído com sucesso`
      });

      return result;
    } catch (err) {
      auditService.logEvent({
        user: 'deployer',
        action: 'DEPLOY_1CLICK',
        target: `${project}:${branch}`,
        ip: clientIp,
        status: 'FAILED',
        details: err.message
      });

      return reply.status(500).send({
        success: false,
        project,
        branch,
        error: err.message,
        logs: [
          `[${new Date().toLocaleTimeString('pt-BR')}] ❌ Falha no Deploy Real SSH: ${err.message}`
        ]
      });
    }
  });

  // Rollback em 1-Clique (Desfazer Deploy de Emergência)
  fastify.post('/api/deploy/rollback', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute'
      }
    }
  }, async (request, reply) => {
    const { project = 'app_service' } = request.body || {};
    const clientIp = extractClientIp(request);

    try {
      const result = await deployService.executeRollback({ project });

      auditService.logEvent({
        user: 'operator',
        action: 'ROLLBACK_1CLICK',
        target: project,
        ip: clientIp,
        status: 'SUCCESS',
        details: `Rollback concluído`
      });

      return result;
    } catch (err) {
      auditService.logEvent({
        user: 'operator',
        action: 'ROLLBACK_1CLICK',
        target: project,
        ip: clientIp,
        status: 'FAILED',
        details: err.message
      });

      return reply.status(500).send({
        success: false,
        project,
        error: err.message,
        logs: [
          `[${new Date().toLocaleTimeString('pt-BR')}] ❌ Falha no Rollback SSH: ${err.message}`
        ]
      });
    }
  });

  // Histórico & Auditoria de Deploys
  fastify.get('/api/deploy/history', async () => {
    return {
      success: true,
      history: deployService.getDeployHistory()
    };
  });

  // Auto-Setup & Autenticação do Git na VM
  fastify.post('/api/git/setup-vm', async (request, reply) => {
    const { name, email, githubUser, githubToken } = request.body || {};
    const clientIp = extractClientIp(request);

    try {
      const result = await deployService.setupGitOnVm({ name, email, githubUser, githubToken });

      auditService.logEvent({
        user: email || 'admin',
        action: 'GIT_SETUP_VM',
        target: 'instance-bytedata',
        ip: clientIp,
        status: 'SUCCESS'
      });

      return result;
    } catch (err) {
      return reply.status(500).send({
        success: false,
        error: err.message,
        logs: [
          `[${new Date().toLocaleTimeString('pt-BR')}] ❌ Falha ao configurar Git na VM: ${err.message}`
        ]
      });
    }
  });

  fastify.get('/api/git/status-vm', async () => {
    return deployService.getGitVmStatus();
  });

  // Clonar & Subir Novo Projeto do GitHub na VM
  fastify.post('/api/projects/clone-and-launch', async (request, reply) => {
    const { repoUrl, projectName, branch = 'main', runMode = 'docker', port = '' } = request.body || {};
    const clientIp = extractClientIp(request);

    try {
      const result = await deployService.cloneAndLaunchProject({ repoUrl, projectName, branch, runMode, port });

      auditService.logEvent({
        user: 'developer',
        action: 'CLONE_AND_LAUNCH',
        target: projectName || repoUrl,
        ip: clientIp,
        status: 'SUCCESS',
        details: `Modo: ${runMode}`
      });

      return result;
    } catch (err) {
      auditService.logEvent({
        user: 'developer',
        action: 'CLONE_AND_LAUNCH',
        target: projectName || repoUrl,
        ip: clientIp,
        status: 'FAILED',
        details: err.message
      });

      return reply.status(500).send({
        success: false,
        error: err.message,
        logs: [
          `[${new Date().toLocaleTimeString('pt-BR')}] ❌ Falha ao clonar e lançar projeto: ${err.message}`
        ]
      });
    }
  });
}

module.exports = deployRoutes;
