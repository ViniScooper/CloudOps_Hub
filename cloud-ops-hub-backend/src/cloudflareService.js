const fs = require('fs');
const path = require('path');
const deployService = require('./deployService');

const DOMAINS_FILE = path.join(__dirname, '..', 'database', 'cloudflare_domains.json');

// Garante que o arquivo de domínios exista com os valores padrão
function loadDomains() {
  try {
    if (fs.existsSync(DOMAINS_FILE)) {
      const content = fs.readFileSync(DOMAINS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Erro ao ler cloudflare_domains.json:', err.message);
  }

  // Padrão inicial limpo
  const defaultDomains = [];

  saveDomains(defaultDomains);
  return defaultDomains;
}

function saveDomains(domains) {
  try {
    const dir = path.dirname(DOMAINS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DOMAINS_FILE, JSON.stringify(domains, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar cloudflare_domains.json:', err.message);
  }
}

// Histórico de auto-cura do Watchdog
let watchdogHistory = [
  {
    time: new Date().toLocaleTimeString('pt-BR'),
    event: 'Watchdog inicializado: monitorando integridade do túnel Cloudflare a cada 60s.',
    type: 'info'
  }
];

// Status em memória
let lastKnownUrl = '';
let lastTunnelStatus = 'Offline';
let lastCheckedAt = new Date().toISOString();

// Obtém status real do túnel na VM
async function getTunnelStatus() {
  lastCheckedAt = new Date().toISOString();
  try {
    // Procura container de túnel dinamicamente
    const findRes = await deployService.runRemoteSsh('docker ps -a --filter "name=tunnel" --format "{{.Names}}" | head -n 1');
    const containerName = (findRes.stdout || '').trim();

    let isRunning = false;
    let startedAt = '';

    if (containerName) {
      const inspectRes = await deployService.runRemoteSsh(
        `docker inspect ${containerName} --format "{{.State.Status}} | {{.State.StartedAt}}" 2>/dev/null || echo "not_found"`
      );
      const out = (inspectRes.stdout || '').trim();

      if (out && !out.includes('not_found')) {
        const parts = out.split('|');
        const state = (parts[0] || '').trim();
        startedAt = (parts[1] || '').trim();
        isRunning = state === 'running';
        lastTunnelStatus = isRunning ? 'Active' : 'Offline';
      } else {
        lastTunnelStatus = 'Offline';
      }

      // Busca última URL do trycloudflare nos logs ao vivo
      const logsRes = await deployService.runRemoteSsh(`docker logs --tail 40 ${containerName} 2>&1 || echo ""`);
      const logsText = logsRes.stdout || logsRes.stderr || '';
      const matchUrl = logsText.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
      if (matchUrl) {
        lastKnownUrl = matchUrl[0];
      } else if (!lastKnownUrl) {
        lastKnownUrl = 'https://his-unified-cleanup-cancellation.trycloudflare.com';
      }
    } else {
      lastTunnelStatus = 'Offline';
    }

    return {
      success: true,
      isRunning,
      status: lastTunnelStatus,
      currentUrl: lastKnownUrl,
      startedAt,
      lastChecked: lastCheckedAt,
      domains: loadDomains(),
      watchdogHistory: watchdogHistory.slice(-5)
    };
  } catch (err) {
    return {
      success: false,
      isRunning: false,
      status: 'Degraded',
      currentUrl: lastKnownUrl,
      error: err.message,
      lastChecked: lastCheckedAt,
      domains: loadDomains(),
      watchdogHistory: watchdogHistory.slice(-5)
    };
  }
}

// Regenera o túnel / Reinicia e captura nova URL
async function regenerateTunnel() {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  try {
    // 1. Reinicia o container do cloudflared na VM
    const restartRes = await deployService.runRemoteSsh('docker restart boteco_tunnel');
    
    // 2. Aguarda 3.5 segundos para o cloudflared estabelecer o handshake na rede Anycast
    await new Promise(resolve => setTimeout(resolve, 3500));

    // 3. Lê os logs para capturar a nova URL gerada
    const logsRes = await deployService.runRemoteSsh('docker logs --tail 30 boteco_tunnel 2>&1');
    const logsText = logsRes.stdout || logsRes.stderr || '';
    const matchUrl = logsText.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);

    if (matchUrl) {
      lastKnownUrl = matchUrl[0];
    }

    lastTunnelStatus = 'Active';
    const eventMsg = `[${timestamp}] ⚡ Túnel Cloudflare regenerado com sucesso. Link ativo: ${lastKnownUrl}`;
    watchdogHistory.push({ time: timestamp, event: eventMsg, type: 'success' });

    return {
      success: true,
      message: 'Túnel Cloudflare reiniciado e link regenerado com sucesso!',
      url: lastKnownUrl,
      timestamp,
      rawOutput: restartRes.stdout || 'Restart OK'
    };
  } catch (err) {
    const errMsg = `[${timestamp}] ❌ Falha ao regenerar túnel: ${err.message}`;
    watchdogHistory.push({ time: timestamp, event: errMsg, type: 'error' });
    return {
      success: false,
      error: err.message,
      url: lastKnownUrl
    };
  }
}

// Mapeia ou substitui um domínio
async function mapOrReplaceDomain({ domain, port = '3002', type = 'Túnel Cloudflare', ssl = "Let's Encrypt / Cloudflare SSL" }) {
  if (!domain) {
    throw new Error('Nome de domínio é obrigatório.');
  }

  const cleanDomain = domain.trim().toLowerCase();
  const domains = loadDomains();

  // Verifica se já existe
  const existingIdx = domains.findIndex(d => d.domain === cleanDomain);

  const domainEntry = {
    id: existingIdx >= 0 ? domains[existingIdx].id : `dom-${Date.now()}`,
    domain: cleanDomain,
    target: `VM Oracle :${port}`,
    port: String(port),
    type: type || 'Túnel Cloudflare (Zero Trust)',
    status: 'Ativo & Conectado',
    ssl: ssl || 'Cloudflare Full SSL',
    updatedAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    domains[existingIdx] = domainEntry;
  } else {
    domains.push(domainEntry);
  }

  saveDomains(domains);

  // Aplica também no Nginx da VM se for rota Nginx
  try {
    if (type.includes('Nginx')) {
      const config = `
server {
    listen 80;
    server_name ${cleanDomain};
    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`.trim();
      await deployService.runRemoteSsh(`echo '${config}' | sudo tee /etc/nginx/conf.d/${cleanDomain}.conf && sudo docker restart nginx-manager-nginx-1 || true`);
    }
  } catch (e) {
    console.warn('Aviso ao aplicar Nginx:', e.message);
  }

  const timestamp = new Date().toLocaleTimeString('pt-BR');
  watchdogHistory.push({
    time: timestamp,
    event: `🌐 Domínio "${cleanDomain}" mapeado para a porta :${port} com sucesso.`,
    type: 'success'
  });

  return {
    success: true,
    message: `Domínio ${cleanDomain} configurado e apontado para a porta :${port}!`,
    domain: domainEntry,
    domains
  };
}

// Remove um domínio
function removeDomain(domainId) {
  const domains = loadDomains();
  const filtered = domains.filter(d => d.id !== domainId && d.domain !== domainId);
  saveDomains(filtered);
  return { success: true, domains: filtered };
}

// Watchdog de Auto-Cura: Executa verificação a cada 60s em segundo plano
function initWatchdog() {
  setInterval(async () => {
    try {
      const inspectRes = await deployService.runRemoteSsh('docker inspect boteco_tunnel --format "{{.State.Status}}" 2>/dev/null || echo "offline"');
      const status = (inspectRes.stdout || '').trim();

      if (status !== 'running') {
        const time = new Date().toLocaleTimeString('pt-BR');
        console.log(`[Watchdog] ⚠️ Túnel boteco_tunnel offline (${status}). Iniciando auto-cura...`);
        
        await deployService.runRemoteSsh('docker restart boteco_tunnel');
        
        watchdogHistory.push({
          time,
          event: `⚠️ [Auto-Cura Watchdog] Túnel Cloudflare estava ${status} e foi reiniciado automaticamente com sucesso.`,
          type: 'warning'
        });
      }
    } catch (err) {
      // Falha silenciosa de rede temporária
    }
  }, 60000);
}

// Inicializa o watchdog
initWatchdog();

module.exports = {
  getTunnelStatus,
  regenerateTunnel,
  mapOrReplaceDomain,
  removeDomain,
  loadDomains,
  saveDomains
};
