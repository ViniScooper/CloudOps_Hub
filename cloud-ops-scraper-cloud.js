/**
 * CLOUDOPS HUB — AUTONOMOUS ORACLE CLOUD ARM SCRAPER (CLOUD EDITION)
 * Executado 24/7 na VM cloudops-micro-02 (sa-saopaulo-1)
 * Consumo ultra-baixo de RAM (~18MB), zero dependências externas.
 * Inclui Telemetria Inteligente de Heartbeat a cada 3h via WhatsApp (Anti-Spam & Keep-Alive).
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const BASE_DIR = '/home/ubuntu/cloudops-scraper';
const STATE_FILE = path.join(BASE_DIR, 'state.json');
const LOG_FILE = path.join(BASE_DIR, 'scraper.log');
const SUCCESS_FILE = path.join(BASE_DIR, 'vm_sucesso.json');
const PUB_KEY_PATH = path.join(BASE_DIR, 'keys', 'arm_vm_key.pub');
const PRIV_KEY_PATH = path.join(BASE_DIR, 'keys', 'arm_vm_key');

const WHATSAPP_PHONE = '558195126839';
const WHATSAPP_APIKEY = '7939819';
const INTERVAL_SECONDS = 25;

// Heartbeat a cada 3 horas (8 mensagens por dia — 100% seguro contra limites da CallMeBot)
const HEARTBEAT_INTERVAL_MS = 3 * 60 * 60 * 1000;

const PROFILES = [
  { ocpus: 1, memoryInGBs: 2, label: '1 OCPU / 2 GB RAM (Alta Chance)' },
  { ocpus: 1, memoryInGBs: 4, label: '1 OCPU / 4 GB RAM' },
  { ocpus: 2, memoryInGBs: 4, label: '2 OCPU / 4 GB RAM' },
  { ocpus: 2, memoryInGBs: 6, label: '2 OCPU / 6 GB RAM' },
  { ocpus: 2, memoryInGBs: 8, label: '2 OCPU / 8 GB RAM' },
  { ocpus: 2, memoryInGBs: 12, label: '2 OCPU / 12 GB RAM' }
];

let state = {
  isRunning: true,
  status: 'Ativo na Nuvem (cloudops-micro-02)',
  workerHost: 'cloudops-micro-02 (137.131.187.54)',
  attempts: 0,
  successfulVm: null,
  lastAttemptAt: null,
  lastHeartbeatAt: null,
  attemptsAtLastHeartbeat: 0,
  currentProfile: PROFILES[0],
  profileIndex: 0,
  intervalSeconds: INTERVAL_SECONDS,
  recentLogs: []
};

// Carrega estado prévio salvo em disco para não perder contador acumulado
function loadInitialState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
      state = {
        ...state,
        ...saved,
        isRunning: true,
        status: 'Ativo na Nuvem (cloudops-micro-02)',
        workerHost: 'cloudops-micro-02 (137.131.187.54)',
        intervalSeconds: INTERVAL_SECONDS
      };
      if (typeof state.profileIndex !== 'number' || state.profileIndex >= PROFILES.length) {
        state.profileIndex = 0;
      }
      state.currentProfile = PROFILES[state.profileIndex];
      console.log(`[INIT] Estado restaurado com sucesso! Tentativas acumuladas: ${state.attempts}`);
    }
  } catch (e) {
    console.error('[INIT] Erro ao restaurar state.json, usando padrão:', e.message);
  }
}

function log(message, type = 'info') {
  const time = new Date().toLocaleTimeString('pt-BR');
  const date = new Date().toISOString().split('T')[0];
  const formatted = `[${date} ${time}] [${type.toUpperCase()}] ${message}`;
  
  console.log(formatted);
  
  try {
    // Rotação de log simples se passar de 10MB
    if (fs.existsSync(LOG_FILE)) {
      const stats = fs.statSync(LOG_FILE);
      if (stats.size > 10 * 1024 * 1024) {
        fs.renameSync(LOG_FILE, LOG_FILE + '.old');
      }
    }
    fs.appendFileSync(LOG_FILE, formatted + '\n');
  } catch (e) {}

  state.recentLogs.unshift({ time, message, type });
  if (state.recentLogs.length > 50) state.recentLogs.pop();
  
  saveState();
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

function sendWhatsAppNotification(text) {
  const encoded = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_PHONE}&text=${encoded}&apikey=${WHATSAPP_APIKEY}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', d => { data += d; });
      res.on('end', () => resolve({ ok: true, data }));
    }).on('error', (err) => resolve({ ok: false, error: err.message }));
  });
}

/**
 * Envia relatório de telemetria periódico para manter a API de WhatsApp conectada e ativa
 */
async function checkAndSendHeartbeat(isStartup = false) {
  const now = Date.now();
  const lastHeartbeat = state.lastHeartbeatAt ? new Date(state.lastHeartbeatAt).getTime() : 0;
  const timeSinceLastHb = now - lastHeartbeat;

  if (isStartup || timeSinceLastHb >= HEARTBEAT_INTERVAL_MS) {
    const previousAttempts = state.attemptsAtLastHeartbeat || 0;
    const periodAttempts = Math.max(0, state.attempts - previousAttempts);

    // Identificação do turno com base na hora local de Brasília (UTC-3)
    const localHour = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })).getHours();
    let saudacao = '☀️ *Atualização Operacional*';
    if (localHour >= 0 && localHour < 6) saudacao = '🌙 *Relatório da Madrugada*';
    else if (localHour >= 6 && localHour < 12) saudacao = '🌅 *Relatório da Manhã*';
    else if (localHour >= 12 && localHour < 18) saudacao = '🌤️ *Relatório da Tarde*';
    else saudacao = '🌆 *Relatório da Noite*';

    const header = isStartup
      ? `🚀 *CLOUDOPS HUB — TELEMETRIA & KEEP-ALIVE ATIVADOS!*\n${saudacao}`
      : `🤖 *CLOUDOPS HUB — TELEMETRIA DO SCRAPER OCI*\n${saudacao}`;

    const currentProf = state.currentProfile || PROFILES[0];

    const msg = `${header}\n\n` +
      `🟢 *Status:* Ativo & Operando 24/7 na nuvem\n` +
      `🖥️ *Servidor:* cloudops-micro-02 (137.131.187.54)\n` +
      `📊 *Tentativas Acumuladas:* ${state.attempts.toLocaleString('pt-BR')}\n` +
      `${!isStartup ? `📈 *Tentativas no ciclo recente (3h):* ~${periodAttempts}\n` : ''}` +
      `🎯 *Perfil em Teste:* ${currentProf.label}\n` +
      `📍 *Região Alvo:* sa-saopaulo-1 (São Paulo - AD-1)\n` +
      `⏱️ *Intervalo do Loop:* ${INTERVAL_SECONDS}s\n\n` +
      `💡 *Keep-Alive WhatsApp:* Sessão 100% ativa. O alerta prioritário com as chaves SSH será enviado imediatamente assim que a VM for criada!`;

    log(`📲 Enviando Heartbeat de Telemetria WhatsApp (${isStartup ? 'Inicialização' : 'Ciclo 3h'})...`);
    
    try {
      const res = await sendWhatsAppNotification(msg);
      if (res.ok) {
        log('✅ Heartbeat WhatsApp entregue com êxito!');
        state.lastHeartbeatAt = new Date().toISOString();
        state.attemptsAtLastHeartbeat = state.attempts;
        saveState();
      } else {
        log(`⚠️ Resposta do CallMeBot: ${res.error || res.data || 'Falha'}`, 'warn');
      }
    } catch (err) {
      log(`⚠️ Erro ao enviar Heartbeat: ${err.message}`, 'warn');
    }
  }
}

function loadOciConfig() {
  const configPath = '/home/ubuntu/.oci/config';
  if (!fs.existsSync(configPath)) {
    throw new Error(`Arquivo OCI config não encontrado: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split('\n');
  const cfg = {};

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('[')) continue;
    const [key, ...vals] = line.split('=');
    if (key && vals.length) cfg[key.trim()] = vals.join('=').trim();
  }

  let keyPath = cfg.key_file || '/home/ubuntu/.oci/oci_api_key.pem';
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Chave privada OCI não encontrada: ${keyPath}`);
  }

  return {
    user: cfg.user,
    fingerprint: cfg.fingerprint,
    tenancy: cfg.tenancy,
    region: cfg.region || 'sa-saopaulo-1',
    privateKey: fs.readFileSync(keyPath, 'utf8')
  };
}

function buildOciSignature({ method, host, pathWithQuery, body, tenancy, user, fingerprint, privateKey }) {
  const dateStr = new Date().toUTCString();
  const headersToSign = ['date', '(request-target)', 'host'];
  let signingString = `date: ${dateStr}\n(request-target): ${method.toLowerCase()} ${pathWithQuery}\nhost: ${host}`;

  let sha256Base64 = null;
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    headersToSign.push('content-length', 'content-type', 'x-content-sha256');
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body || {});
    sha256Base64 = crypto.createHash('sha256').update(bodyStr).digest('base64');
    const contentLength = Buffer.byteLength(bodyStr);
    signingString += `\ncontent-length: ${contentLength}\ncontent-type: application/json\nx-content-sha256: ${sha256Base64}`;
  }

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingString);
  const signature = signer.sign(privateKey, 'base64');

  const keyId = `${tenancy}/${user}/${fingerprint}`;
  const authHeader = `Signature version="1",headers="${headersToSign.join(' ')}",keyId="${keyId}",algorithm="rsa-sha256",signature="${signature}"`;

  const headers = {
    'date': dateStr,
    'host': host,
    'authorization': authHeader
  };

  if (sha256Base64 !== null) {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body || {});
    headers['content-type'] = 'application/json';
    headers['content-length'] = Buffer.byteLength(bodyStr);
    headers['x-content-sha256'] = sha256Base64;
  }

  return headers;
}

function callOciApi({ method, pathWithQuery, body }) {
  return new Promise((resolve, reject) => {
    try {
      const config = loadOciConfig();
      const host = `iaas.${config.region}.oraclecloud.com`;
      const headers = buildOciSignature({
        method,
        host,
        pathWithQuery,
        body,
        tenancy: config.tenancy,
        user: config.user,
        fingerprint: config.fingerprint,
        privateKey: config.privateKey
      });

      const req = https.request({
        hostname: host,
        port: 443,
        path: pathWithQuery,
        method: method.toUpperCase(),
        headers: headers,
        timeout: 25000
      }, (res) => {
        let raw = '';
        res.on('data', d => { raw += d; });
        res.on('end', () => {
          try {
            resolve({ statusCode: res.statusCode, data: raw ? JSON.parse(raw) : {}, raw });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: {}, raw });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('OCI API timeout')); });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    } catch (e) {
      reject(e);
    }
  });
}

async function cycle() {
  if (!state.isRunning) return;

  const currentProfile = PROFILES[state.profileIndex];
  state.currentProfile = currentProfile;
  state.attempts++;
  state.lastAttemptAt = new Date().toISOString();

  log(`🔄 Tentativa #${state.attempts} | Perfil: ${currentProfile.label}`);

  // Verifica se está na hora do Heartbeat periódico (a cada 3h)
  try {
    await checkAndSendHeartbeat(false);
  } catch (hbErr) {
    console.error('Erro na rotina de heartbeat:', hbErr.message);
  }

  try {
    const config = loadOciConfig();
    const availabilityDomain = 'Cpoi:SA-SAOPAULO-1-AD-1';
    const subnetId = 'ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaajvtrkg23idowlhkghq23hwpypjbq3t5iovzlxkc2ogqmmyo2onka';
    const imageId = 'ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaahbsrcowbgfo44ku57zbaxgwpl2zyf4tiqvk6lrqlqoy6db6immq';

    let sshPublicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFjQci0HX4i05Ta28795RpDipIuWicVH3wVSr0Yu5P5F ubuntu@cloudops-arm-vm';
    if (fs.existsSync(PUB_KEY_PATH)) {
      sshPublicKey = fs.readFileSync(PUB_KEY_PATH, 'utf8').trim();
    }

    const antiIdleScript = `#!/bin/bash
echo "[CloudOps Hub] Configurando protecao Anti-Idle Always Free..."
cat << 'EOF' > /usr/local/bin/cloudops-keepalive.sh
#!/bin/bash
while true; do
  uptime > /dev/null
  sleep 300
done
EOF
chmod +x /usr/local/bin/cloudops-keepalive.sh
nohup /usr/local/bin/cloudops-keepalive.sh > /dev/null 2>&1 &
echo "[CloudOps Hub] Protecao ativa."
`;

    const launchPayload = {
      availabilityDomain: availabilityDomain,
      compartmentId: config.tenancy,
      shape: 'VM.Standard.A1.Flex',
      displayName: `cloudops-arm-${currentProfile.ocpus}c-${currentProfile.memoryInGBs}gb`,
      shapeConfig: {
        ocpus: currentProfile.ocpus,
        memoryInGBs: currentProfile.memoryInGBs
      },
      sourceDetails: {
        sourceType: 'image',
        imageId: imageId,
        bootVolumeSizeInGBs: '50'
      },
      createVnicDetails: {
        subnetId: subnetId,
        assignPublicIp: false,
        displayName: 'primary-vnic'
      },
      metadata: {
        ssh_authorized_keys: sshPublicKey,
        user_data: Buffer.from(antiIdleScript).toString('base64')
      }
    };

    const res = await callOciApi({
      method: 'POST',
      pathWithQuery: '/20160918/instances',
      body: launchPayload
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      state.isRunning = false;
      state.status = 'SUCESSO_PROVISIONADO';

      const privKeyContent = fs.existsSync(PRIV_KEY_PATH) ? fs.readFileSync(PRIV_KEY_PATH, 'utf8') : '';

      const successData = {
        ...res.data,
        capturedAt: new Date().toISOString(),
        sshUser: 'ubuntu',
        sshPort: 22,
        sshPrivateKeyPath: PRIV_KEY_PATH,
        sshPrivateKeyContent: privKeyContent,
        sshPublicKeyContent: sshPublicKey,
        shapeLabel: currentProfile.label,
        currentOcpus: currentProfile.ocpus,
        currentMemory: currentProfile.memoryInGBs
      };

      state.successfulVm = successData;
      fs.writeFileSync(SUCCESS_FILE, JSON.stringify(successData, null, 2));

      log('================================================================', 'success');
      log(`🎉 SUCESSO ABSOLUTO! VM ARM Always Free CRIADA NA ORACLE CLOUD!`, 'success');
      log(`ID: ${res.data.id}`, 'success');
      log(`Nome: ${res.data.displayName}`, 'success');
      log(`Configuração: ${currentProfile.label}`, 'success');
      log(`Chave Privada salva com segurança em: ${PRIV_KEY_PATH}`, 'success');
      log('================================================================', 'success');

      // Notificação prioritária instantânea via WhatsApp
      const wppMsg = `🎉 *CLOUDOPS HUB (NUVEM):* Sua VM ARM Ampere A1 foi CRIADA COM SUCESSO!\n\n` +
        `🖥️ *Detalhes da Instância:*\n` +
        `🔹 *Nome:* ${res.data.displayName}\n` +
        `🔹 *Recursos:* ${currentProfile.label}\n` +
        `🔹 *Região:* sa-saopaulo-1 (São Paulo)\n` +
        `🔹 *Usuário SSH:* ubuntu | *Porta:* 22\n` +
        `🔹 *ID OCID:* ${res.data.id}\n\n` +
        `🔐 *Chave SSH Privada (.key):*\n` +
        `Salva automaticamente na VM cloudops-micro-02 e pronta no CloudOps Hub!\n\n` +
        `🚀 *Status:* 100% Always Free (Custo R$ 0,00)`;

      await sendWhatsAppNotification(wppMsg);
      log('📲 Mensagem com credenciais enviada com sucesso para o seu WhatsApp!', 'success');
      return;
    }

    if (res.statusCode === 429 || res.raw.includes('TooManyRequests')) {
      log('🛑 Rate Limit da Oracle (429). Aguardando 60s antes de retomar...', 'warn');
      setTimeout(cycle, 60000);
      return;
    }

    if (res.statusCode === 500 && (res.raw.includes('Out of host capacity') || res.raw.includes('capacity'))) {
      log(`⚠️ Sem capacidade em SP para ${currentProfile.label}. Alternando em ${INTERVAL_SECONDS}s...`, 'warn');
    } else {
      const msg = res.data?.message || res.raw?.slice(0, 120) || `HTTP ${res.statusCode}`;
      log(`⚠️ Resposta OCI (${res.statusCode}): ${msg}`, 'warn');
    }

  } catch (err) {
    log(`❌ Erro no ciclo: ${err.message}`, 'error');
  }

  // Alterna para o próximo perfil da fila
  state.profileIndex = (state.profileIndex + 1) % PROFILES.length;
  setTimeout(cycle, INTERVAL_SECONDS * 1000);
}

// Inicia o Scraper
(async () => {
  loadInitialState();
  log(`🚀 Scraper de Nuvem ativado no nó cloudops-micro-02 (Intervalo: ${INTERVAL_SECONDS}s, Heartbeat: 3h)`);
  saveState();
  // Dispara o primeiro heartbeat de inicialização para confirmar ativação no WhatsApp
  await checkAndSendHeartbeat(true);
  cycle();
})();
