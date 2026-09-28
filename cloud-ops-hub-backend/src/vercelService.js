const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(__dirname, '../database/vercel_config.json');

// Carrega ou salva configuração localmente
function getVercelConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[VercelService] Erro ao ler vercel_config.json:', e.message);
  }

  return {
    token: process.env.VERCEL_TOKEN || '',
    projectName: process.env.VERCEL_PROJECT_NAME || '',
    teamId: process.env.VERCEL_TEAM_ID || '',
    deployHookUrl: process.env.VERCEL_DEPLOY_HOOK_URL || '',
    productionDomain: process.env.VERCEL_DOMAIN || ''
  };
}

function saveVercelConfig(newConfig) {
  const current = getVercelConfig();
  const merged = { ...current, ...newConfig };
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

// Helper de requisição à API oficial da Vercel
async function vercelFetch(endpoint, options = {}, userToken = '') {
  const config = getVercelConfig();
  const token = userToken || config.token;

  if (!token) {
    throw new Error('Token da Vercel não configurado. Por favor, informe seu token no topo da página.');
  }

  let url = `https://api.vercel.com${endpoint}`;
  if (config.teamId && !url.includes('teamId=')) {
    url += (url.includes('?') ? '&' : '?') + `teamId=${config.teamId}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let errText = '';
    try {
      const json = await response.json();
      errText = json.error?.message || JSON.stringify(json);
    } catch {
      errText = await response.text();
    }
    throw new Error(`Vercel API [${response.status}]: ${errText}`);
  }

  return await response.json();
}

// Testa o token do usuário e retorna os dados do perfil
async function testToken(token) {
  try {
    const user = await vercelFetch('/v2/user', {}, token);
    return {
      valid: true,
      user: {
        username: user.user?.username || user.username,
        email: user.user?.email || user.email,
        name: user.user?.name || user.name
      }
    };
  } catch (err) {
    return {
      valid: false,
      error: err.message
    };
  }
}

// Lista os últimos deployments do projeto
async function getDeployments(limit = 10, userToken = '', projectName = '') {
  const config = getVercelConfig();
  const token = userToken || config.token;
  const targetProject = projectName || config.projectName;

  if (!token) {
    return {
      configured: false,
      projectName: targetProject,
      productionDomain: config.productionDomain,
      deployments: [],
      message: 'Token de acesso da Vercel ainda não configurado.'
    };
  }

  try {
    const data = await vercelFetch(
      `/v6/deployments?app=${encodeURIComponent(targetProject)}&limit=${limit}`,
      {},
      token
    );

    const deployments = (data.deployments || []).map(d => ({
      id: d.uid || d.id,
      name: d.name,
      url: d.url ? `https://${d.url}` : '',
      state: d.state || d.status || 'READY', // READY, BUILDING, ERROR, CANCELED
      target: d.target || (d.meta?.githubCommitRef === 'main' ? 'production' : 'preview'),
      createdAt: d.created || d.createdAt,
      buildingAt: d.buildingAt,
      readyAt: d.ready,
      creator: {
        username: d.creator?.username || 'DevOps',
        email: d.creator?.email || ''
      },
      meta: {
        branch: d.meta?.githubCommitRef || d.meta?.branch || 'main',
        commitMessage: d.meta?.githubCommitMessage || 'Atualização no repositório',
        commitSha: d.meta?.githubCommitSha || d.meta?.commit || '',
        commitAuthor: d.meta?.githubCommitAuthorName || 'DevOps'
      }
    }));

    return {
      configured: true,
      projectName: targetProject,
      productionDomain: config.productionDomain,
      total: deployments.length,
      latest: deployments[0] || null,
      deployments
    };
  } catch (err) {
    return {
      configured: true,
      error: err.message,
      projectName: targetProject,
      productionDomain: config.productionDomain,
      deployments: []
    };
  }
}

// Dispara um novo deploy (Redeploy) na Vercel
async function triggerRedeploy(optionsOrId = '', userTokenArg = '', projectNameArg = '') {
  const config = getVercelConfig();
  
  let deploymentId = '';
  let userToken = userTokenArg;
  let projectName = projectNameArg;

  if (typeof optionsOrId === 'object' && optionsOrId !== null) {
    deploymentId = optionsOrId.deploymentId || '';
    userToken = optionsOrId.userToken || userToken || '';
    projectName = optionsOrId.projectName || optionsOrId.project || projectName || '';
  } else {
    deploymentId = optionsOrId || '';
  }

  const token = userToken || config.token;
  const targetProject = projectName || config.projectName;

  // Se houver Deploy Hook configurado e o projeto for o mesmo da configuração padrão
  if (config.deployHookUrl && (!projectName || projectName === config.projectName)) {
    try {
      const hookRes = await fetch(config.deployHookUrl, { method: 'POST' });
      if (hookRes.ok) {
        const hookData = await hookRes.json().catch(() => ({}));
        return {
          success: true,
          method: 'deploy_hook',
          message: `🚀 Redeploy disparado com sucesso via Vercel Deploy Hook para ${targetProject}!`,
          data: hookData
        };
      }
    } catch (e) {
      console.warn('[VercelService] Falha no deploy hook, tentando via API direta:', e.message);
    }
  }

  if (!token) {
    throw new Error('Token da Vercel não configurado para executar o redeploy.');
  }

  // Se passou o ID do deployment específico para recompilar
  if (deploymentId) {
    try {
      const res = await vercelFetch(
        `/v13/deployments?forceNew=1`,
        {
          method: 'POST',
          body: JSON.stringify({
            name: targetProject,
            deploymentId: deploymentId
          })
        },
        token
      );
      return {
        success: true,
        method: 'redeploy_api',
        message: `🚀 Redeploy de ${targetProject} disparado com sucesso na Vercel!`,
        deployment: res
      };
    } catch (apiErr) {
      console.warn('[VercelService] Erro ao recompilar por ID, tentando pelo projeto:', apiErr.message);
    }
  }

  // Fallback: Busca o último deployment (preferencialmente bem-sucedido) do projeto e dispara o redeploy dele
  const current = await getDeployments(5, token, targetProject);
  const targetDep = current.deployments?.find(d => d.state === 'READY') || current.latest;
  const targetId = targetDep?.id;

  if (!targetId) {
    throw new Error(`Nenhum deployment prévio encontrado no projeto "${targetProject}" para recompilar.`);
  }

  const res = await vercelFetch(
    `/v13/deployments?forceNew=1`,
    {
      method: 'POST',
      body: JSON.stringify({
        name: targetProject,
        deploymentId: targetId
      })
    },
    token
  );

  return {
    success: true,
    method: 'redeploy_api',
    message: `🚀 Redeploy da versão de produção de ${targetProject} iniciado com sucesso na Vercel!`,
    deployment: res
  };
}

module.exports = {
  getVercelConfig,
  saveVercelConfig,
  testToken,
  getDeployments,
  triggerRedeploy
};
