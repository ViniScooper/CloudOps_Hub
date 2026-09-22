const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.resolve(__dirname, '../database/render_config.json');

// Carrega ou salva configuração do Render
function getRenderConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[RenderService] Erro ao ler render_config.json:', e.message);
  }

  return {
    apiKey: process.env.RENDER_API_KEY || '',
    serviceId: process.env.RENDER_SERVICE_ID || '',
    serviceName: 'cloudops-backend',
    antiSleepEnabled: false,
    antiSleepUrl: '',
    antiSleepIntervalMin: 10
  };
}

function saveRenderConfig(newConfig) {
  const current = getRenderConfig();
  const merged = { ...current, ...newConfig };
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

// Helper de requisição à API oficial do Render (v1)
async function renderFetch(endpoint, options = {}, userApiKey = '') {
  const config = getRenderConfig();
  const apiKey = userApiKey || config.apiKey;

  if (!apiKey) {
    throw new Error('Chave de API do Render não configurada. Informe sua Render API Key nas configurações.');
  }

  const url = `https://api.render.com/v1${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    let errText = '';
    try {
      const json = await response.json();
      errText = json.message || json.error || JSON.stringify(json);
    } catch {
      errText = await response.text();
    }
    throw new Error(`Render API [${response.status}]: ${errText}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  return await response.json();
}

// Testa a chave do usuário consultando o proprietário da conta
async function testToken(apiKey) {
  try {
    const owners = await renderFetch('/owners?limit=5', {}, apiKey);
    if (Array.isArray(owners) && owners.length > 0) {
      const ownerObj = owners[0]?.owner || owners[0];
      return {
        valid: true,
        user: {
          id: ownerObj.id,
          name: ownerObj.name || ownerObj.email,
          email: ownerObj.email,
          type: ownerObj.type
        }
      };
    }
    return { valid: true, user: { name: 'Usuário Render' } };
  } catch (err) {
    return {
      valid: false,
      error: err.message
    };
  }
}

// Lista os serviços do usuário (Web Services, Static Sites, etc.)
async function getServices(limit = 20, userApiKey = '') {
  try {
    const services = await renderFetch(`/services?limit=${limit}`, {}, userApiKey);
    if (!Array.isArray(services)) return [];

    return services.map(s => {
      const item = s.service || s;
      const details = item.serviceDetails || {};
      return {
        id: item.id,
        name: item.name,
        type: item.type, // web_service, static_site, etc.
        repo: item.repo,
        branch: item.branch,
        autoDeploy: item.autoDeploy,
        updatedAt: item.updatedAt,
        createdAt: item.createdAt,
        status: item.suspended === 'suspended' ? 'suspended' : 'active',
        url: details.url || (item.slug ? `https://${item.slug}.onrender.com` : null),
        env: details.env || 'node',
        region: details.region || 'oregon',
        plan: details.plan || 'starter'
      };
    });
  } catch (err) {
    console.error('[RenderService] Erro ao buscar serviços:', err.message);
    throw err;
  }
}

// Lista o histórico de deploys de um serviço
async function getServiceDeploys(serviceId, limit = 10, userApiKey = '') {
  const config = getRenderConfig();
  const sId = serviceId || config.serviceId;

  if (!sId) {
    return { deploys: [], error: 'Nenhum Service ID especificado ou configurado.' };
  }

  try {
    const rawDeploys = await renderFetch(`/services/${sId}/deploys?limit=${limit}`, {}, userApiKey);
    const deploys = (Array.isArray(rawDeploys) ? rawDeploys : []).map(d => {
      const dep = d.deploy || d;
      return {
        id: dep.id,
        status: dep.status, // created, build_in_progress, live, deactivated, build_failed, canceled
        createdAt: dep.createdAt,
        updatedAt: dep.updatedAt,
        finishedAt: dep.finishedAt,
        commit: dep.commit ? {
          id: dep.commit.id ? dep.commit.id.slice(0, 7) : '',
          message: dep.commit.message || 'Deploy manual',
          createdAt: dep.commit.createdAt
        } : null,
        trigger: dep.trigger || 'manual'
      };
    });

    return {
      serviceId: sId,
      deploys,
      latestDeploy: deploys[0] || null
    };
  } catch (err) {
    console.error('[RenderService] Erro ao buscar deploys:', err.message);
    return { serviceId: sId, deploys: [], error: err.message };
  }
}

// Dispara um novo deploy do serviço com opção de limpar cache
async function triggerDeploy(serviceId, clearCache = false, userApiKey = '') {
  const config = getRenderConfig();
  const sId = serviceId || config.serviceId;

  if (!sId) {
    throw new Error('Service ID do Render é obrigatório para disparar deploy.');
  }

  const payload = {
    clearCache: clearCache ? 'clear' : 'do_not_clear'
  };

  const result = await renderFetch(`/services/${sId}/deploys`, {
    method: 'POST',
    body: JSON.stringify(payload)
  }, userApiKey);

  return {
    success: true,
    deployId: result.id || (result.deploy && result.deploy.id),
    status: result.status || 'created',
    message: 'Deploy iniciado no Render com sucesso!'
  };
}

// Reinicia o serviço no Render
async function restartService(serviceId, userApiKey = '') {
  const config = getRenderConfig();
  const sId = serviceId || config.serviceId;

  if (!sId) {
    throw new Error('Service ID do Render é obrigatório para reiniciar.');
  }

  await renderFetch(`/services/${sId}/restart`, {
    method: 'POST'
  }, userApiKey);

  return {
    success: true,
    message: 'Comando de reinicialização enviado com sucesso para o Render.'
  };
}

module.exports = {
  getRenderConfig,
  saveRenderConfig,
  testToken,
  getServices,
  getServiceDeploys,
  triggerDeploy,
  restartService
};
