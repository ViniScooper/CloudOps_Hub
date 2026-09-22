const https = require('https');
const http = require('http');

// URLs
const FRONTEND_URL = 'https://cloudops-hub-dun.vercel.app';
const TUNNEL_URL = 'https://his-unified-cleanup-cancellation.trycloudflare.com';

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 BATERIA DE TESTES E2E - CLOUDOPS HUB (PRODUÇÃO)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, isOk, detail = '') {
    if (isOk) {
      console.log(`✅ [PASS] ${name} ${detail ? `(${detail})` : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // 1. Teste Frontend Vercel
  try {
    const fe = await request(FRONTEND_URL);
    report('Frontend Vercel (cloudops-hub-dun.vercel.app)', fe.statusCode === 200, `HTTP ${fe.statusCode} - Tamanho: ${fe.body.length} bytes`);
  } catch (err) {
    report('Frontend Vercel', false, err.message);
  }

  // 2. Teste Túnel Cloudflare & Health
  try {
    const health = await request(`${TUNNEL_URL}/api/health`);
    report('Túnel Cloudflare Zero Trust & Health', health.statusCode === 200 && health.json?.status === 'ok', `HTTP ${health.statusCode}`);
  } catch (err) {
    report('Túnel Cloudflare Zero Trust', false, err.message);
  }

  // 3. Teste Overview dos Nós e Oracle ATP
  try {
    const ov = await request(`${TUNNEL_URL}/api/servers/overview`);
    const ok = ov.statusCode === 200 && ov.json?.servers?.length >= 2;
    report('Visão Geral dos Servidores & Oracle ATP', ok, `${ov.json?.servers?.length || 0} VMs conectadas`);
  } catch (err) {
    report('Visão Geral dos Servidores', false, err.message);
  }

  // 4. Teste Autenticação Master
  let masterToken = '';
  try {
    const authRes = await request(`${TUNNEL_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'vviniciuslourenco@gmail.com', password: 'CloudOps#Master2026!' }
    });
    masterToken = authRes.json?.token || '';
    const ok = authRes.statusCode === 200 && !!masterToken;
    report('Login Seguro Master (Vinicius Lourenco)', ok, `Token JWT emitido`);
  } catch (err) {
    report('Login Seguro Master', false, err.message);
  }

  // 5. Teste Validação do Token Master (/api/auth/me)
  try {
    const meRes = await request(`${TUNNEL_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${masterToken}` }
    });
    report('Validação de Sessão JWT (/api/auth/me)', meRes.statusCode === 200 && meRes.json?.user?.role === 'admin', `Role: ${meRes.json?.user?.role}`);
  } catch (err) {
    report('Validação de Sessão JWT', false, err.message);
  }

  // 6. Teste Watchdog & Monitoramento 24/7
  try {
    const wd = await request(`${TUNNEL_URL}/api/watchdog/status`);
    const ok = wd.statusCode === 200 && wd.json?.active === true;
    report('Guardião Watchdog 24/7', ok, `RAM: ${wd.json?.ramPct}%, Containers Críticos: ${wd.json?.criticalContainers?.length}`);
  } catch (err) {
    report('Guardião Watchdog 24/7', false, err.message);
  }

  // 7. Teste Docker Containers & Logs
  try {
    const logs = await request(`${TUNNEL_URL}/api/docker/logs/boteco_tunnel?tail=5`);
    const ok = logs.statusCode === 200 && typeof logs.json?.logs === 'string';
    report('Telemetria e Logs ao Vivo do Docker (boteco_tunnel)', ok, `${logs.json?.logs?.split('\n').length || 0} linhas de log`);
  } catch (err) {
    report('Telemetria e Logs do Docker', false, err.message);
  }

  // 8. Teste Backups do MySQL
  try {
    const bkp = await request(`${TUNNEL_URL}/api/backups`);
    const ok = bkp.statusCode === 200 && Array.isArray(bkp.json?.backups);
    report('Listagem de Backups MySQL (.sql.gz)', ok, `${bkp.json?.backups?.length || 0} backups armazenados`);
  } catch (err) {
    report('Listagem de Backups MySQL', false, err.message);
  }

  // 9. Teste Solicitação de Acesso e Painel Admin
  try {
    const testEmail = `dev.tester.${Date.now()}@exemplo.com`;
    // Cria pedido
    const reqRes = await request(`${TUNNEL_URL}/api/auth/request-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { name: 'Dev Tester QA', email: testEmail, note: 'Teste automatizado de aprovação' }
    });

    // Lista pedidos no admin
    const listRes = await request(`${TUNNEL_URL}/api/admin/requests`);
    const found = listRes.json?.requests?.find(r => r.email === testEmail);

    report('Fluxo de Solicitação de Acesso', reqRes.statusCode === 200 && !!found, `Criado e detectado no painel admin`);

    // Aprova pedido
    if (found) {
      const appRes = await request(`${TUNNEL_URL}/api/admin/approve-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { requestId: found.id, email: testEmail, name: 'Dev Tester QA' }
      });
      report('Aprovação com 1-Clique & Emissão de Senha', appRes.statusCode === 200 && !!appRes.json?.user?.tempPassword, `Senha: ${appRes.json?.user?.tempPassword}`);
    }
  } catch (err) {
    report('Fluxo de Solicitação e Aprovação de Acesso', false, err.message);
  }

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} PASSOU | ${failed} FALHOU`);
  console.log('====================================================');
}

runTests().catch(console.error);
