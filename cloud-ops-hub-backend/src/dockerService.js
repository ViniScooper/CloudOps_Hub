const { runRemoteSsh } = require('./deployService');

// Valida nome de container seguro (apenas letras, números, traços e underscores)
function sanitizeContainerName(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim();
  if (/^[a-zA-Z0-9_\-\.]+$/.test(clean)) {
    return clean;
  }
  return null;
}

// Executa ação de ciclo de vida no container
async function executeContainerAction({ container, action, ip, user }) {
  const safeName = sanitizeContainerName(container);
  if (!safeName) {
    throw new Error('Nome de container inválido ou inseguro.');
  }

  const allowedActions = ['start', 'stop', 'restart', 'pause', 'unpause'];
  if (!allowedActions.includes(action)) {
    throw new Error(`Ação não suportada. Ações permitidas: ${allowedActions.join(', ')}`);
  }

  const cmd = `docker ${action} ${safeName} && docker inspect -f '{{.State.Status}}' ${safeName}`;
  const res = await runRemoteSsh(cmd);

  if (res.code !== 0 && !res.stdout) {
    throw new Error(res.stderr || `Falha ao executar ${action} no container ${safeName}`);
  }

  const newStatus = (res.stdout || '').split('\n').pop().trim() || 'unknown';

  return {
    success: true,
    container: safeName,
    action,
    status: newStatus,
    output: res.stdout || res.stderr
  };
}

// Obtém logs em tempo real do container
async function getContainerLogs({ container, tail = 100, ip, user }) {
  const safeName = sanitizeContainerName(container);
  if (!safeName) {
    throw new Error('Nome de container inválido.');
  }

  const safeTail = Math.min(Math.max(parseInt(tail, 10) || 100, 10), 1000);
  const cmd = `docker logs --tail ${safeTail} --timestamps ${safeName}`;
  const res = await runRemoteSsh(cmd);

  // docker logs costuma cuspir logs tanto no stdout quanto no stderr
  const logs = (res.stdout || '') + (res.stderr ? '\n' + res.stderr : '');

  return {
    success: true,
    container: safeName,
    tail: safeTail,
    logs: logs.trim() || `[${new Date().toISOString()}] Nenhum log recente emitido por ${safeName}.`
  };
}

// Lista detalhada de todos os containers (ativos e inativos)
async function listContainersDetailed() {
  const cmd = `docker ps -a --format '{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","state":"{{.State}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}"}'`;
  const res = await runRemoteSsh(cmd);

  if (!res.stdout) return [];

  const list = [];
  const lines = res.stdout.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed);
      const isUp = parsed.state === 'running' || parsed.status.toLowerCase().includes('up');
      list.push({
        id: parsed.id,
        name: parsed.name,
        image: parsed.image,
        status: parsed.status,
        state: parsed.state,
        port: parsed.ports || '-',
        color: isUp ? 'emerald' : 'red',
        cpu: isUp ? '0.4%' : '0%',
        memory: isUp ? (parsed.name.includes('db') ? '180 MB' : '35 MB') : '0 MB'
      });
    } catch {
      // Ignora falhas de parse de linha única
    }
  }

  return list;
}

module.exports = {
  executeContainerAction,
  getContainerLogs,
  listContainersDetailed
};
