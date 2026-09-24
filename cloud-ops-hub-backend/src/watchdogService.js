const https = require('https');
const { runRemoteSsh } = require('./deployService');

let watchdogInterval = null;
const state = {
  active: true,
  lastCheck: null,
  ramPct: 0,
  ramUsed: 0,
  ramTotal: 956,
  selfHealingEvents: [],
  criticalContainers: [
    { name: 'boteco_db', status: 'unknown', essential: true },
    { name: 'boteco_backend', status: 'unknown', essential: true },
    { name: 'boteco_tunnel', status: 'unknown', essential: true },
    { name: 'financeiro_backend', status: 'unknown', essential: true },
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

// Executa verificação de saúde da VM e dos containers com AUTO-CURA ATIVA
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

      // Se RAM >= 90%, tenta auto-liberar cache de disco para evitar OOM
      if (pct >= 90) {
        console.warn(`[Watchdog] RAM atingiu ${pct}%. Disparando auto-limpeza de cache de disco...`);
        try {
          await runRemoteSsh('sync && echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true');
        } catch {}

        await triggerAlert(
          'ram_high',
          `⚠️ *[CloudOps Watchdog — Alerta de RAM Crítica]*\n\nUso de Memória: *${pct}%* (${used}MB / ${total}MB) na VM *instance-bytedata*.\n\n🛡️ *Ação do Sentinela:* Cache de buffers limpo preventivamente para evitar congelamentos.`
        , 30);
      }
    }

    // 3. Checagem de Containers Críticos com Self-Healing
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
      const isUp = statusText && statusText.toLowerCase().includes('up');

      if (!isUp) {
        const previousStatus = statusText || 'Inexistente / Parado';
        console.warn(`[Watchdog Self-Healing] Container crítico ${c.name} está inoperante (${previousStatus}). Iniciando auto-recuperação...`);

        // AUTO-CURA ATIVA: Tenta reiniciar/iniciar o container
        try {
          await runRemoteSsh(`docker restart ${c.name} 2>/dev/null || docker start ${c.name} 2>/dev/null`);
          
          // Aguarda 3 segundos e valida status
          await new Promise(r => setTimeout(r, 3000));
          const checkRes = await runRemoteSsh(`docker ps --filter "name=${c.name}" --format "{{.Status}}"`);
          const newStatus = (checkRes.stdout || '').trim();
          const recovered = newStatus.toLowerCase().includes('up');

          if (recovered) {
            c.status = `Online (Auto-curado: ${newStatus})`;
            console.log(`[Watchdog Self-Healing] ✅ Container ${c.name} recuperado com sucesso!`);
            
            state.selfHealingEvents.unshift({
              container: c.name,
              recoveredAt: new Date().toISOString(),
              status: newStatus
            });
            if (state.selfHealingEvents.length > 20) state.selfHealingEvents.pop();

            await triggerAlert(
              `healed_${c.name}`,
              `🛡️ *[CloudOps Watchdog — Auto-Cura Executada]*\n\nO container *${c.name}* havia caído na VM *instance-bytedata*.\n\n✅ *Ação do Sentinela:* O container foi reiniciado automaticamente!\n⚡ *Status Atual:* Online (${newStatus})\n⏰ *Horário:* ${new Date().toLocaleTimeString('pt-BR')}`
            , 15);
          } else {
            c.status = `Falha ao auto-curar (${newStatus || 'Parado'})`;
            await triggerAlert(
              `failed_${c.name}`,
              `🚨 *[CloudOps Watchdog — Alerta Crítico]*\n\nO container *${c.name}* caiu e a tentativa de auto-recuperação não conseguiu subi-lo!\n\nStatus: *${previousStatus}*\nAcesse o painel: https://cloudops-hub-dun.vercel.app/`
            , 10);
          }
        } catch (err) {
          c.status = `Erro: ${err.message}`;
          await triggerAlert(
            `err_${c.name}`,
            `🚨 *[CloudOps Watchdog — Erro de Recuperação]*\n\nFalha ao executar auto-restart de *${c.name}*: ${err.message}`
          , 15);
        }
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

  console.log(`[Watchdog] Iniciado monitoramento automático com Auto-Cura a cada ${intervalMinutes} minutos.`);
  // Executa uma vez no início após 10s
  setTimeout(runHealthCheck, 10000);

  watchdogInterval = setInterval(runHealthCheck, intervalMinutes * 60 * 1000);
}

function getWatchdogStatus() {
  return {
    ...state,
    intervalMinutes: 3,
    status: state.active ? 'Ativo & Vigiando 24/7 (Auto-Cura Habilitada)' : 'Pausado'
  };
}

async function testAlert() {
  const msg = `🧪 *[CloudOps Watchdog - Teste de Alerta]*\n\nConexão com WhatsApp validada com sucesso!\nO Watchdog monitora RAM > 90% e auto-recupera containers Docker em queda a cada 3 minutos.\n\nData: ${new Date().toLocaleString('pt-BR')}`;
  return sendWhatsApp(msg);
}

module.exports = {
  startWatchdog,
  getWatchdogStatus,
  runHealthCheck,
  testAlert
};
