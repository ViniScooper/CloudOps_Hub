const https = require('https');
const { runRemoteSsh } = require('./deployService');

let watchdogInterval = null;
const state = {
  active: true,
  lastCheck: null,
  ramPct: 0,
  ramUsed: 0,
  ramTotal: 956,
  criticalContainers: [
    { name: 'boteco_tunnel', status: 'unknown', essential: true },
    { name: 'boteco_db', status: 'unknown', essential: true },
    { name: 'nginx-manager-nginx-1', status: 'unknown', essential: true }
  ],
  alertsHistory: [],
  lastAlertTimestamps: {}
};

// Envia mensagem WhatsApp via CallMeBot
function sendWhatsApp(text) {
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const encodedText = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({ success: true });
    }).on('error', (err) => {
      console.error('[Watchdog] Erro ao enviar WhatsApp:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

// Dispara alerta respeitando cooldown para não floodar o celular
async function triggerAlert(key, message, cooldownMinutes = 30) {
  const now = Date.now();
  const lastTime = state.lastAlertTimestamps[key] || 0;
  const cooldownMs = cooldownMinutes * 60 * 1000;

  if (now - lastTime < cooldownMs) {
    // Em cooldown, não envia repetição
    return;
  }

  state.lastAlertTimestamps[key] = now;
  const alertRecord = {
    id: 'alt-' + now,
    key,
    message,
    timestamp: new Date().toISOString()
  };

  state.alertsHistory.unshift(alertRecord);
  if (state.alertsHistory.length > 50) state.alertsHistory.pop();

  console.warn(`[WATCHDOG ALERTA] ${message}`);
  await sendWhatsApp(message);
}

// Executa verificação de saúde da VM e dos containers
async function runHealthCheck() {
  state.lastCheck = new Date().toISOString();

  try {
    // 1. Coleta telemetria de memória e containers em 1 comando SSH rápido
    const res = await runRemoteSsh('free -m && docker ps -a --format "{{.Names}}\t{{.Status}}"');
    const output = res.stdout || '';

    // 2. Parse da RAM
    const memMatch = output.match(/Mem:\s+(\d+)\s+(\d+)/);
    if (memMatch) {
      const total = parseInt(memMatch[1], 10);
      const used = parseInt(memMatch[2], 10);
      const pct = Math.round((used / (total || 1)) * 100);
      state.ramTotal = total;
      state.ramUsed = used;
      state.ramPct = pct;

      // Alerta se RAM >= 90%
      if (pct >= 90) {
        await triggerAlert(
          'ram_high',
          `⚠️ *[CloudOps Watchdog] Alerta de RAM Crítica!*\n\nUso de Memória: *${pct}%* (${used}MB / ${total}MB) na VM *instance-bytedata*.\n\nRecomendado: Acesse o CloudOps Hub e clique em *Liberar Cache* para evitar OOM.`
        , 30);
      }
    }

    // 3. Checagem de Containers Críticos
    const lines = output.split('\n');
    const runningMap = {};
    for (const line of lines) {
      const parts = line.trim().split('\t');
      if (parts.length >= 2) {
        runningMap[parts[0].trim()] = parts[1].trim();
      }
    }

    for (const c of state.criticalContainers) {
      const statusText = runningMap[c.name];
      if (!statusText) {
        c.status = 'Missing / Parado';
        await triggerAlert(
          `container_missing_${c.name}`,
          `🚨 *[CloudOps Watchdog] Container Crítico Inexistente!*\n\nO container *${c.name}* não foi encontrado em execução na VM *instance-bytedata*!\n\nAcesse: https://cloudops-hub-dun.vercel.app/`
        , 15);
      } else if (!statusText.toLowerCase().includes('up')) {
        c.status = statusText;
        await triggerAlert(
          `container_down_${c.name}`,
          `🚨 *[CloudOps Watchdog] Container Crítico Caiu!*\n\nO container *${c.name}* está com status: *${statusText}* na VM *instance-bytedata*.\n\nReinicie o container pelo painel CloudOps.`
        , 15);
      } else {
        c.status = 'Online (' + statusText + ')';
      }
    }

  } catch (err) {
    console.error('[Watchdog] Falha na checagem de saúde:', err.message);
  }
}

// Inicia o ciclo de monitoramento do Watchdog
function startWatchdog(intervalMinutes = 3) {
  if (watchdogInterval) clearInterval(watchdogInterval);

  console.log(`[Watchdog] Iniciado monitoramento automático a cada ${intervalMinutes} minutos.`);
  // Executa uma vez no início após 10s
  setTimeout(runHealthCheck, 10000);

  watchdogInterval = setInterval(runHealthCheck, intervalMinutes * 60 * 1000);
}

function getWatchdogStatus() {
  return {
    ...state,
    intervalMinutes: 3,
    status: state.active ? 'Ativo & Vigiando 24/7' : 'Pausado'
  };
}

async function testAlert() {
  const msg = `🧪 *[CloudOps Watchdog - Teste de Alerta]*\n\nConexão com WhatsApp validada com sucesso!\nO Watchdog monitora RAM > 90% e queda de containers Docker a cada 3 minutos.\n\nData: ${new Date().toLocaleString('pt-BR')}`;
  return sendWhatsApp(msg);
}

module.exports = {
  startWatchdog,
  getWatchdogStatus,
  runHealthCheck,
  testAlert
};
