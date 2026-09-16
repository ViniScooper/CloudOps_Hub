const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// Envio de Notificação via WhatsApp (CallMeBot)
function sendWhatsAppNotification(message) {
  const phone = process.env.WHATSAPP_PHONE || '558195126839';
  const apiKey = process.env.WHATSAPP_APIKEY || '7939819';
  const encodedText = encodeURIComponent(message);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${apiKey}`;

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ success: true, data }));
    }).on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
}

let scraperState = {
  isRunning: false,
  status: 'Idle',
  attempts: 0,
  successfulVm: null,
  lastAttemptAt: null,
  currentProfile: null,
  logs: [],
  profiles: [
    { ocpus: 1, memoryInGBs: 2, label: '1 OCPU / 2 GB RAM (Alta Chance)' },
    { ocpus: 1, memoryInGBs: 4, label: '1 OCPU / 4 GB RAM' },
    { ocpus: 1, memoryInGBs: 6, label: '1 OCPU / 6 GB RAM' },
    { ocpus: 2, memoryInGBs: 6, label: '2 OCPU / 6 GB RAM' },
    { ocpus: 2, memoryInGBs: 8, label: '2 OCPU / 8 GB RAM' },
    { ocpus: 2, memoryInGBs: 12, label: '2 OCPU / 12 GB RAM' }
  ],
  profileIndex: 0,
  intervalSeconds: 15,
  errorCount: 0
};

let scraperTimer = null;

function loadOciConfig() {
  const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\vini';
  const configPath = path.join(homeDir, '.oci', 'config');
  
  if (!fs.existsSync(configPath)) {
    throw new Error(`Arquivo de configuração OCI não encontrado em: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf8');
  const lines = content.split('\n');
  const config = {};

  for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || line.startsWith('[')) continue;
    const [key, ...vals] = line.split('=');
    if (key && vals.length) {
      config[key.trim()] = vals.join('=').trim();
    }
  }

  let keyPath = config.key_file;
  if (!keyPath || !fs.existsSync(keyPath)) {
    keyPath = path.join(homeDir, '.oci', 'oci_api_key.pem');
  }

  if (!fs.existsSync(keyPath)) {
    throw new Error(`Chave privada OCI não encontrada em: ${keyPath}`);
  }

  const privateKey = fs.readFileSync(keyPath, 'utf8');

  return {
    user: config.user,
    fingerprint: config.fingerprint,
    tenancy: config.tenancy,
    region: config.region || 'sa-saopaulo-1',
    privateKey
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

      const options = {
        hostname: host,
        port: 443,
        path: pathWithQuery,
        method: method.toUpperCase(),
        headers: headers,
        timeout: 25000
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (d) => { responseBody += d; });
        res.on('end', () => {
          try {
            const parsed = responseBody ? JSON.parse(responseBody) : {};
            resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed, raw: responseBody });
          } catch (e) {
            resolve({ statusCode: res.statusCode, headers: res.headers, data: responseBody, raw: responseBody });
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('OCI API timeout'));
      });

      if (body) {
        const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
        req.write(bodyStr);
      }
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function addLog(msg, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const logEntry = { timestamp, message: msg, type };
  scraperState.logs.unshift(logEntry);
  if (scraperState.logs.length > 200) scraperState.logs.pop();
}

async function executeScrapeCycle() {
  if (!scraperState.isRunning) return;

  const currentProfile = scraperState.profiles[scraperState.profileIndex];
  scraperState.currentProfile = currentProfile;
  scraperState.attempts++;
  scraperState.lastAttemptAt = new Date().toISOString();

  addLog(`🔄 Tentativa #${scraperState.attempts} | Perfil: ${currentProfile.label}`, 'info');

  try {
    const config = loadOciConfig();

    const availabilityDomain = 'Cpoi:SA-SAOPAULO-1-AD-1';
    const subnetId = 'ocid1.subnet.oc1.sa-saopaulo-1.aaaaaaaajvtrkg23idowlhkghq23hwpypjbq3t5iovzlxkc2ogqmmyo2onka';
    const imageId = 'ocid1.image.oc1.sa-saopaulo-1.aaaaaaaaahbsrcowbgfo44ku57zbaxgwpl2zyf4tiqvk6lrqlqoy6db6immq';
    const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\vini';
    const pubKeyPath = path.join(homeDir, '.ssh', 'cloudops_nova_vm.key.pub');
    const privKeyPath = path.join(homeDir, '.ssh', 'cloudops_nova_vm.key');
    let sshPublicKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFjQci0HX4i05Ta28795RpDipIuWicVH3wVSr0Yu5P5F ubuntu@cloudops-arm-vm';
    
    if (fs.existsSync(pubKeyPath)) {
      sshPublicKey = fs.readFileSync(pubKeyPath, 'utf8').trim();
    }

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
        assignPublicIp: true,
        displayName: 'primary-vnic'
      },
      metadata: {
        ssh_authorized_keys: sshPublicKey
      }
    };

    const res = await callOciApi({
      method: 'POST',
      pathWithQuery: '/20160918/instances',
      body: launchPayload
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      scraperState.isRunning = false;
      scraperState.status = 'SUCESSO';
      
      const privKeyContent = fs.existsSync(privKeyPath) ? fs.readFileSync(privKeyPath, 'utf8') : '';

      scraperState.successfulVm = {
        ...res.data,
        sshUser: 'ubuntu',
        sshPort: 22,
        sshPrivateKeyPath: privKeyPath,
        sshPrivateKeyContent: privKeyContent,
        sshPublicKeyContent: sshPublicKey,
        shapeLabel: currentProfile.label,
        currentOcpus: currentProfile.ocpus,
        currentMemory: currentProfile.memoryInGBs
      };
      
      addLog(`====================================================`, 'success');
      addLog(`🎉 SUCESSO! VM ARM Always Free criada com êxito!`, 'success');
      addLog(`ID da Instância: ${res.data.id}`, 'success');
      addLog(`Nome: ${res.data.displayName}`, 'success');
      addLog(`Configuração Base: ${currentProfile.label}`, 'success');
      addLog(`Usuário SSH padrão: ubuntu | Porta: 22`, 'success');
      addLog(`Chave Privada salva em: ${privKeyPath}`, 'success');
      addLog(`📲 Enviando credenciais completas para o seu WhatsApp...`, 'info');
      addLog(`====================================================`, 'success');

      // Dispara notificação no WhatsApp com instruções completas
      sendWhatsAppNotification(`🎉 *CloudOps Hub:* Sua NOVA VM Always Free ARM foi criada com SUCESSO!\n\n🖥️ *Dados de Acesso:*\n🔹 *Usuário:* ubuntu\n🔹 *Porta:* 22\n🔹 *Perfil Base:* ${currentProfile.label}\n🔹 *Nome:* ${res.data.displayName}\n🔹 *Região:* sa-saopaulo-1\n🔹 *Chave SSH:* cloudops_nova_vm.key\n\n📥 Acesse o CloudOps Hub para baixar a Chave Privada (.key)!\n🚀 *Auto-Upgrade:* Iniciando monitor de redimensionamento para 12GB/24GB...`);

      if (scraperTimer) {
        clearInterval(scraperTimer);
        scraperTimer = null;
      }

      // Se a VM criada tiver menos de 12GB de RAM, inicia o Auto-Resize em segundo plano
      if (currentProfile.memoryInGBs < 12) {
        startAutoResizeEngine(res.data.id, currentProfile);
      }

      return;
    }

    if (res.statusCode === 429 || res.raw.includes('TooManyRequests')) {
      addLog(`🛑 Rate Limit da Oracle (429). Pausando 60s por segurança antes de retomar...`, 'warn');
      if (scraperTimer) {
        clearInterval(scraperTimer);
        scraperTimer = setTimeout(() => {
          scraperTimer = setInterval(executeScrapeCycle, scraperState.intervalSeconds * 1000);
          executeScrapeCycle();
        }, 60000);
      }
      return;
    }

    if (res.statusCode === 500 && (res.raw.includes('Out of host capacity') || res.raw.includes('capacity'))) {
      addLog(`⚠️ Sem capacidade em SP para ${currentProfile.label}. Alternando perfil em ${scraperState.intervalSeconds}s...`, 'warn');
    } else {
      const errMessage = res.data.message || res.raw || `HTTP ${res.statusCode}`;
      addLog(`⚠️ Resposta OCI (${res.statusCode}): ${errMessage.slice(0, 140)}`, 'warn');
    }
  } catch (err) {
    addLog(`❌ Erro no ciclo de tentativa: ${err.message}`, 'error');
    scraperState.errorCount++;
  }

  scraperState.profileIndex = (scraperState.profileIndex + 1) % scraperState.profiles.length;
}

function startScraper(intervalSeconds = 15) {
  if (scraperState.isRunning) return { success: false, message: 'Scraper já está em execução.' };

  scraperState.isRunning = true;
  scraperState.status = 'Running';
  scraperState.intervalSeconds = intervalSeconds || 15;
  scraperState.profileIndex = 0;

  addLog(`🚀 Scraper de VM Oracle iniciado no Hub Local (intervalo: ${scraperState.intervalSeconds}s)`, 'info');

  executeScrapeCycle();

  scraperTimer = setInterval(() => {
    executeScrapeCycle();
  }, scraperState.intervalSeconds * 1000);

  return { success: true, message: 'Scraper iniciado com sucesso no Hub Local.' };
}

// =========================================================================
// AUTO-RESIZE ENGINE (UPGRADE A QUENTE PARA 12GB/24GB ASSIM QUE ABRIR VAGA)
// =========================================================================
let autoResizeTimer = null;

function startAutoResizeEngine(instanceId, currentProfile) {
  addLog(`🔄 [Auto-Upgrade]: Iniciando monitor em segundo plano para redimensionar a VM para 12 GB RAM...`, 'info');

  const targetOcpus = 2;
  const targetMemoryInGBs = 12;

  autoResizeTimer = setInterval(async () => {
    try {
      addLog(`🔄 [Auto-Upgrade]: Tentando expandir RAM de ${currentProfile.memoryInGBs}GB para ${targetMemoryInGBs}GB...`, 'info');

      const updatePayload = {
        shapeConfig: {
          ocpus: targetOcpus,
          memoryInGBs: targetMemoryInGBs
        }
      };

      const res = await callOciApi({
        method: 'PUT',
        pathWithQuery: `/20160918/instances/${instanceId}`,
        body: updatePayload
      });

      if (res.statusCode >= 200 && res.statusCode < 300) {
        clearInterval(autoResizeTimer);
        autoResizeTimer = null;

        addLog(`====================================================`, 'success');
        addLog(`🚀 SUCESSO NO UPGRADE! VM expandida com êxito para ${targetOcpus} OCPUs e ${targetMemoryInGBs} GB RAM!`, 'success');
        addLog(`====================================================`, 'success');

        if (scraperState.successfulVm) {
          scraperState.successfulVm.shapeLabel = `${targetOcpus} OCPU / ${targetMemoryInGBs} GB RAM`;
          scraperState.successfulVm.currentOcpus = targetOcpus;
          scraperState.successfulVm.currentMemory = targetMemoryInGBs;
        }

        sendWhatsAppNotification(`🚀 *CloudOps Hub:* UPGRADE CONCLUÍDO COM SUCESSO!\n\nSua nova VM Always Free acabou de ser redimensionada para *${targetOcpus} OCPUs e ${targetMemoryInGBs} GB de RAM* sem custo!\n\nAcesse o CloudOps Hub para conferir!`);
      } else if (res.statusCode === 500 && (res.raw.includes('capacity') || res.raw.includes('Out of host capacity'))) {
        addLog(`⚠️ [Auto-Upgrade]: Sem capacidade para expandir para ${targetMemoryInGBs}GB no momento. Tentando novamente em 60s...`, 'warn');
      } else {
        addLog(`⚠️ [Auto-Upgrade]: Resposta OCI (${res.statusCode}): ${res.raw?.slice(0, 100)}`, 'warn');
      }
    } catch (e) {
      addLog(`❌ [Auto-Upgrade]: Erro ao tentar resize: ${e.message}`, 'error');
    }
  }, 60000); // Tenta a cada 60s para não sobrecarregar
}

function stopScraper() {
  if (!scraperState.isRunning && !autoResizeTimer) return { success: false, message: 'Scraper não está em execução.' };

  scraperState.isRunning = false;
  scraperState.status = 'Stopped';

  if (scraperTimer) {
    clearInterval(scraperTimer);
    scraperTimer = null;
  }

  if (autoResizeTimer) {
    clearInterval(autoResizeTimer);
    autoResizeTimer = null;
    addLog(`⏹️ [Auto-Upgrade]: Monitor de redimensionamento interrompido.`, 'warn');
  }

  addLog(`⏹️ Scraper interrompido pelo usuário.`, 'warn');
  return { success: true, message: 'Scraper interrompido com sucesso.' };
}

function getScraperStatus() {
  return {
    ...scraperState,
    nextProfile: scraperState.profiles[scraperState.profileIndex],
    isAutoResizing: !!autoResizeTimer
  };
}

module.exports = {
  startScraper,
  stopScraper,
  getScraperStatus,
  loadOciConfig,
  sendWhatsAppNotification
};
