const fs = require('fs');
const path = require('path');

const puppeteerPath = path.resolve('C:/Users/vini/Documents/LEADS/backend/node_modules/puppeteer');
const puppeteer = require(puppeteerPath);

const OUTPUT_DIR = path.resolve(__dirname, 'apresentacao_vendas_prints');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function run() {
  console.log('🚀 Iniciando captura em Ultra HD (1920x1080 @ 2x Retina)...');

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2
    },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Injeta usuário autenticado e servidor no localStorage antes do carregamento
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('cloudops_user', JSON.stringify({
      name: 'Vinicius Lourenço',
      email: 'admin@cloudops.io',
      role: 'Cloud Architect & DevOps'
    }));

    localStorage.setItem('cloudops_servers', JSON.stringify([
      {
        id: 'oracle-prod',
        name: 'instance-bytedata',
        type: 'AMD EPYC (2 vCPUs)',
        provider: 'Oracle Cloud (Always Free)',
        region: 'sa-saopaulo-1 (GRU)',
        ip: '137.131.185.243',
        cpu: '14',
        ram: '39',
        ramUsed: '378',
        ramTotal: '956',
        cacheUsed: '240',
        cachePct: '25',
        disk: '34',
        diskUsed: '15',
        diskTotal: '45',
        status: 'Online',
        uptime: '14 dias, 8 horas'
      }
    ]));

    localStorage.setItem('render_api_key', 'rnd_demo_cloudops_2026');
  });

  // 1. Dashboard Principal
  console.log('📸 1/7: Capturando Dashboard Principal (Gauges, CPU, RAM, Disco)...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01_dashboard_principal.png'), fullPage: false });

  // Função para alternar aba clicando no texto do item da sidebar
  async function selectTab(tabLabel) {
    const clicked = await page.evaluate((label) => {
      const buttons = Array.from(document.querySelectorAll('button.nav-item, button'));
      const target = buttons.find(b => b.textContent && b.textContent.includes(label));
      if (target) {
        target.click();
        return true;
      }
      return false;
    }, tabLabel);

    if (clicked) {
      await new Promise(r => setTimeout(r, 1800));
    } else {
      console.warn(`⚠️ Não foi possível clicar na aba: ${tabLabel}`);
    }
  }

  // 2. Render Backend & Deploys
  console.log('📸 2/7: Capturando Render Backend & Deploys...');
  await selectTab('Render Backend');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '02_render_backend_deploys.png'), fullPage: false });

  // 3. Cron Jobs & Guardião Anti-Sleep
  console.log('📸 3/7: Capturando Cron Jobs & Guardião Anti-Sleep...');
  await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('button'));
    const cronBtn = subtabs.find(b => b.textContent && b.textContent.includes('Cron Jobs'));
    if (cronBtn) cronBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '03_cron_jobs_antisleep.png'), fullPage: false });

  // 4. MySQL Docker & Conexão
  console.log('📸 4/7: Capturando MySQL Docker & Conexão...');
  await page.evaluate(() => {
    const subtabs = Array.from(document.querySelectorAll('button'));
    const mysqlBtn = subtabs.find(b => b.textContent && b.textContent.includes('MySQL Docker'));
    if (mysqlBtn) mysqlBtn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '04_mysql_docker_connection.png'), fullPage: false });

  // 5. Vercel Frontend & Edge CI/CD
  console.log('📸 5/7: Capturando Vercel Frontend...');
  await selectTab('Vercel Frontend');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '05_vercel_frontend_edge.png'), fullPage: false });

  // 6. Docker & Containers
  console.log('📸 6/7: Capturando Docker Containers...');
  await selectTab('Docker');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '06_docker_containers.png'), fullPage: false });

  // 7. Odisseu AI Copilot
  console.log('📸 7/7: Capturando Odisseu Copilot IA...');
  await selectTab('Odisseu AI');
  await page.screenshot({ path: path.join(OUTPUT_DIR, '07_odisseu_copilot_ia.png'), fullPage: false });

  await browser.close();
  console.log('\n🎉 SUCESSO! Todos os 7 prints em 1920x1080 (Ultra HD) foram gerados perfeitamente em:');
  console.log(OUTPUT_DIR);
}

run().catch(err => {
  console.error('❌ Erro na captura:', err);
  process.exit(1);
});
