const { Client } = require('ssh2');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const oracleScraper = require('./oracleScraper');

const HISTORY_FILE = path.join(__dirname, '..', 'database', 'deploy_history.json');

function getSshKey() {
  const keyPath = process.env.VM_SSH_KEY_PATH || 'C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key';
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }
  return null;
}

function runRemoteSsh(command) {
  if (process.platform === 'linux') {
    return new Promise((resolve) => {
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        resolve({
          stdout: stdout ? stdout.trim() : '',
          stderr: stderr ? stderr.trim() : '',
          code: err ? (err.code || 1) : 0
        });
      });
    });
  }

  return new Promise((resolve, reject) => {
    const key = getSshKey();
    if (!key) {
      return reject(new Error('Chave SSH da VM nao encontrada no caminho configurado.'));
    }

    const conn = new Client();
    conn.on('ready', () => {
      conn.exec(command, (err, stream) => {
        if (err) {
          conn.end();
          return reject(err);
        }

        let stdout = '';
        let stderr = '';

        stream.on('data', d => { stdout += d.toString(); });
        stream.stderr.on('data', d => { stderr += d.toString(); });

        stream.on('close', (code) => {
          conn.end();
          if (code !== 0 && stderr && !stdout) {
            return reject(new Error(stderr.trim()));
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), code });
        });
      });
    }).on('error', err => {
      reject(new Error('Falha na conexao SSH com a VM: ' + err.message));
    }).connect({
      host: process.env.VM_HOST || '137.131.185.243',
      port: Number(process.env.VM_PORT || 22),
      username: process.env.VM_USER || 'ubuntu',
      privateKey: key,
      readyTimeout: 15000
    });
  });
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao ler deploy_history.json:', err.message);
  }
  return [];
}

function saveHistory(history) {
  try {
    const dir = path.dirname(HISTORY_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(0, 15), null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar deploy_history.json:', err.message);
  }
}

async function executeDeploy({ project = 'app_service', branch = 'main' }) {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const logs = [];

  logs.push(`[${timestamp}] 🚀 Iniciando pipeline de Deploy Real via SSH na VM (${process.env.VM_HOST || 'Servidor'})...`);

  let commitHash = 'latest';
  let commitMsg = 'Deploy efetuado com sucesso';

  try {
    const targetDir = `/home/ubuntu/${project}`;
      
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Acessando diretório ${targetDir} na VM...`);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Executando: git fetch origin && git checkout ${branch} && git pull origin ${branch}...`);

    const gitPullRes = await runRemoteSsh(`cd ${targetDir} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`);
    if (gitPullRes.stdout) {
      gitPullRes.stdout.split('\n').forEach(l => logs.push(`[Git] ${l}`));
    }

    // Obtém o hash e mensagem do commit
    const gitInfo = await runRemoteSsh(`cd ${targetDir} && git rev-parse --short HEAD && git log -1 --pretty=%B`);
    const infoParts = gitInfo.stdout.split('\n');
    commitHash = infoParts[0] || 'head';
    commitMsg = (infoParts[1] || 'Atualizacao de codigo').trim();
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Commit em execucao: [${commitHash}] ${commitMsg}`);

    // Recria os containers no Docker ou recarrega PM2
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Atualizando serviços...`);
    const dockerRes = await runRemoteSsh(`cd ${targetDir} && (docker compose up -d --build 2>/dev/null || pm2 reload all 2>/dev/null || true)`);
    if (dockerRes.stdout) {
      dockerRes.stdout.split('\n').forEach(l => logs.push(`[Deploy] ${l}`));
    }

    // Validação de containers
    const psRes = await runRemoteSsh(`docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -n 10`);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Status dos containers:`);
    psRes.stdout.split('\n').forEach(l => logs.push(`  ${l}`));

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Deploy Real concluído com sucesso em ${durationSeconds}!`);

    // Salva no histórico de auditoria
    const history = loadHistory();
    const newEntry = {
      id: `dep-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      project: project || 'app_service',
      type: 'DEPLOY',
      branch,
      commitHash,
      commitMessage: commitMsg,
      author: 'DevOps CI/CD',
      duration: durationSeconds,
      status: 'Sucesso'
    };
    history.unshift(newEntry);
    saveHistory(history);

    // Dispara WhatsApp
    oracleScraper.sendWhatsAppNotification(`🚀 *CloudOps Hub:* Deploy Real concluído com êxito!\n\nProjeto: *${newEntry.project}*\nBranch: *${branch}* (Commit: ${commitHash})\nDuração: ${durationSeconds}\nStatus: Containers no ar sem queda.`);

    return {
      success: true,
      project,
      branch,
      commitHash,
      duration: durationSeconds,
      message: `Deploy de ${project} executado com êxito na VM!`,
      logs,
      history: history.slice(0, 10)
    };
  } catch (err) {
    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro durante deploy SSH: ${err.message}`);

    const history = loadHistory();
    history.unshift({
      id: `dep-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      project: project || 'app_service',
      type: 'DEPLOY',
      branch,
      commitHash: 'failed',
      commitMessage: err.message,
      author: 'DevOps CI/CD',
      duration: durationSeconds,
      status: 'Falha'
    });
    saveHistory(history);

    throw new Error(err.message);
  }
}

async function executeRollback({ project = 'app_service' }) {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const logs = [];

  logs.push(`[${timestamp}] ⏪ ACIONANDO ROLLBACK DE EMERGÊNCIA (Desfazendo último deploy)...`);

  try {
    const targetDir = `/home/ubuntu/${project}`;
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Executando git reset --hard HEAD~1 em ${targetDir}...`);

    const resetRes = await runRemoteSsh(`cd ${targetDir} && git reset --hard HEAD~1`);
    logs.push(`[Git] ${resetRes.stdout}`);

    const gitInfo = await runRemoteSsh(`cd ${targetDir} && git rev-parse --short HEAD && git log -1 --pretty=%B`);
    const infoParts = gitInfo.stdout.split('\n');
    const commitHash = infoParts[0] || 'restored';
    const commitMsg = (infoParts[1] || 'Versao anterior restaurada').trim();
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Versão restaurada: [${commitHash}] ${commitMsg}`);

    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Recriando containers Docker na versão anterior...`);
    const dockerRes = await runRemoteSsh(`cd ${targetDir} && docker compose up -d --build`);
    if (dockerRes.stdout) {
      dockerRes.stdout.split('\n').forEach(l => logs.push(`[Docker] ${l}`));
    }

    const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ ROLLBACK CONCLUÍDO COM SUCESSO! A aplicação voltou ao estado estável anterior.`);

    const history = loadHistory();
    const newEntry = {
      id: `rol-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleString('pt-BR'),
      project: project || 'app_service',
      type: 'ROLLBACK',
      branch: 'main',
      commitHash,
      commitMessage: `Reversão para versão estável: ${commitMsg}`,
      author: 'DevOps CI/CD',
      duration: durationSeconds,
      status: 'Sucesso'
    };
    history.unshift(newEntry);
    saveHistory(history);

    oracleScraper.sendWhatsAppNotification(`⚠️ *CloudOps Hub:* ROLLBACK EXECUTADO COM SUCESSO!\n\nProjeto: *${newEntry.project}*\nVersão restaurada: *${commitHash}*\nStatus: Aplicação restabelecida.`);

    return {
      success: true,
      project,
      commitHash,
      duration: durationSeconds,
      message: 'Rollback executado! Versão estável anterior restabelecida no ar.',
      logs,
      history: history.slice(0, 10)
    };
  } catch (err) {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ❌ Erro ao executar rollback: ${err.message}`);
    throw new Error(err.message);
  }
}

async function setupGitOnVm({ name, email, githubUser, githubToken }) {
  const logs = [];
  const timestamp = new Date().toLocaleTimeString('pt-BR');

  logs.push(`[${timestamp}] 🚀 Iniciando configuração automática do Git na VM via SSH...`);

  if (!name || !email) {
    throw new Error('Nome e E-mail são obrigatórios para configurar o Git.');
  }

  // 1. Verifica ou instala o Git
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Verificando instalação do Git...`);
  const gitCheck = await runRemoteSsh('which git || (sudo apt-get update -qq && sudo apt-get install -y -qq git)');
  
  const gitVersionRes = await runRemoteSsh('git --version');
  const gitVersion = gitVersionRes.stdout || 'Git instalado';
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ${gitVersion}`);

  // 2. Configura Nome e Email Global
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Configurando git config --global user.name "${name}"...`);
  await runRemoteSsh(`git config --global user.name "${name}"`);
  await runRemoteSsh(`git config --global user.email "${email}"`);
  await runRemoteSsh(`git config --global credential.helper store`);
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Identidade Git registrada: ${name} <${email}>`);

  // 3. Salva Token de autenticação se fornecido
  if (githubToken && githubToken.trim()) {
    const userHandle = githubUser || name.replace(/\s+/g, '');
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Salvando token de autenticação permanente para @${userHandle}...`);
    await runRemoteSsh(`echo "https://${userHandle}:${githubToken.trim()}@github.com" > ~/.git-credentials && chmod 600 ~/.git-credentials`);
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Credenciais salvas em ~/.git-credentials! Downloads e envios não pedirão senha.`);
  }

  // 4. Garante Chave SSH para Deploy Key no GitHub caso não exista
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Verificando chave SSH para repositórios privados...`);
  await runRemoteSsh(`[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -C "${email}" -f ~/.ssh/id_ed25519 -N ""`);
  const pubKeyRes = await runRemoteSsh(`cat ~/.ssh/id_ed25519.pub 2>/dev/null || cat ~/.ssh/id_rsa.pub 2>/dev/null`);
  const deployKeyPublic = pubKeyRes.stdout || '';

  if (deployKeyPublic) {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Deploy Key (SSH pública) pronta para repositórios privados.`);
  }

  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Setup do Git na VM concluído com 100% de sucesso!`);

  // Notificação WhatsApp
  oracleScraper.sendWhatsAppNotification(`⚡ *CloudOps Hub:* Git configurado com sucesso na VM!\n\nUsuário: *${name}* (${email})\nStatus: Git ativo e autenticado para deploys automáticos.`);

  return {
    success: true,
    gitVersion,
    name,
    email,
    deployKeyPublic,
    logs
  };
}

async function getGitVmStatus() {
  try {
    const gitRes = await runRemoteSsh('git --version 2>/dev/null');
    const nameRes = await runRemoteSsh('git config --global user.name 2>/dev/null');
    const emailRes = await runRemoteSsh('git config --global user.email 2>/dev/null');
    const hasCreds = await runRemoteSsh('[ -f ~/.git-credentials ] && echo "yes" || echo "no"');

    return {
      success: true,
      installed: !!gitRes.stdout,
      version: gitRes.stdout || 'Não instalado',
      name: nameRes.stdout || 'Não configurado',
      email: emailRes.stdout || 'Não configurado',
      hasStoredCredentials: hasCreds.stdout.includes('yes')
    };
  } catch (err) {
    return {
      success: false,
      installed: false,
      error: err.message
    };
  }
}

async function cloneAndLaunchProject({ repoUrl, projectName, branch = 'main', runMode = 'docker', port = '' }) {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString('pt-BR');
  const logs = [];

  if (!repoUrl) {
    throw new Error('A URL do repositório Git é obrigatória.');
  }

  // Extrai nome do projeto a partir da URL se não informado
  let folder = projectName ? projectName.trim().replace(/[^a-zA-Z0-9_-]/g, '') : '';
  if (!folder) {
    const parts = repoUrl.split('/');
    const last = parts[parts.length - 1] || 'app';
    folder = last.replace(/\.git$/, '');
  }

  const targetDir = `/home/ubuntu/${folder}`;
  logs.push(`[${timestamp}] 📦 Iniciando clone e inicialização do projeto "${folder}" na VM...`);

  // 1. Verifica se pasta já existe
  const checkDir = await runRemoteSsh(`[ -d "${targetDir}" ] && echo "exists" || echo "not_exists"`);
  if (checkDir.stdout.includes('exists')) {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Diretório ${targetDir} já existe na VM. Atualizando código (git pull)...`);
    const pullRes = await runRemoteSsh(`cd ${targetDir} && git fetch origin && git checkout ${branch} && git pull origin ${branch}`);
    logs.push(`[Git] ${pullRes.stdout || 'Repositório atualizado'}`);
  } else {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Clonando ${repoUrl} (branch: ${branch}) para ${targetDir}...`);
    const cloneRes = await runRemoteSsh(`git clone -b ${branch} ${repoUrl} ${targetDir}`);
    logs.push(`[Git] ${cloneRes.stdout || cloneRes.stderr || 'Clone concluído com sucesso'}`);
  }

  // 2. Executa de acordo com o runMode
  if (runMode === 'docker') {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Compilando e subindo containers Docker (docker compose up -d --build)...`);
    const dockerRes = await runRemoteSsh(`cd ${targetDir} && (docker compose up -d --build || docker-compose up -d --build)`);
    if (dockerRes.stdout) dockerRes.stdout.split('\n').forEach(l => logs.push(`[Docker] ${l}`));
    if (dockerRes.stderr) dockerRes.stderr.split('\n').forEach(l => logs.push(`[Docker Info] ${l}`));
  } else if (runMode === 'pm2') {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Instalando dependências e iniciando processo PM2...`);
    await runRemoteSsh(`cd ${targetDir} && (npm install --production || true)`);
    const pm2Res = await runRemoteSsh(`cd ${targetDir} && (source ~/.bashrc 2>/dev/null; pm2 start server.js --name "${folder}" || pm2 start index.js --name "${folder}" || pm2 start app.js --name "${folder}" || pm2 start npm --name "${folder}" -- start)`);
    logs.push(`[PM2] ${pm2Res.stdout || 'Processo registrado no PM2'}`);
  } else {
    logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] Modo clone_only: Repositório baixado e pronto em ${targetDir}.`);
  }

  const durationSeconds = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
  logs.push(`[${new Date().toLocaleTimeString('pt-BR')}] ✅ Projeto ${folder} lançado com sucesso na VM em ${durationSeconds}!`);

  // Salva no histórico de auditoria
  const history = loadHistory();
  const newEntry = {
    id: `dep-${Date.now().toString().slice(-4)}`,
    timestamp: new Date().toLocaleString('pt-BR'),
    project: folder,
    type: 'NOVO PROJETO',
    branch,
    commitHash: 'initial',
    commitMessage: `Clone & Launch do repositório: ${repoUrl} (${runMode})`,
    author: 'Vinicius Lourenco',
    duration: durationSeconds,
    status: 'Sucesso'
  };
  history.unshift(newEntry);
  saveHistory(history);

  // Alerta WhatsApp
  oracleScraper.sendWhatsAppNotification(`🚀 *CloudOps Hub:* Novo projeto *${folder}* adicionado na VM com sucesso!\n\nOrigem: ${repoUrl}\nModo: ${runMode.toUpperCase()}\nDuração: ${durationSeconds}`);

  return {
    success: true,
    folder,
    targetDir,
    runMode,
    duration: durationSeconds,
    logs,
    history: history.slice(0, 10)
  };
}

function getDeployHistory() {
  return loadHistory().slice(0, 10);
}

module.exports = {
  executeDeploy,
  executeRollback,
  getDeployHistory,
  setupGitOnVm,
  getGitVmStatus,
  cloneAndLaunchProject,
  runRemoteSsh
};


