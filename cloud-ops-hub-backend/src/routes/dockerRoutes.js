/**
 * dockerRoutes.js — Rotas e WebSockets para Gerenciamento de Containers Docker e Terminal
 */

const dockerService = require('../dockerService');
const deployService = require('../deployService');
const auditService = require('../auditService');
const { extractClientIp, sanitizeBashCommand } = require('../security');
const { Client } = require('ssh2');

async function dockerRoutes(fastify, options) {
  // Ações de Ciclo de Vida do Docker (start, stop, restart, pause, unpause)
  fastify.post('/api/docker/action', async (request, reply) => {
    const { container, action, ip, user } = request.body || {};
    const clientIp = extractClientIp(request);

    if (!container || !action) {
      return reply.code(400).send({ success: false, error: 'Parâmetros "container" e "action" são obrigatórios.' });
    }

    try {
      const result = await dockerService.executeContainerAction({ container, action, ip, user });

      auditService.logEvent({
        user: user || 'operator',
        action: `DOCKER_${action.toUpperCase()}`,
        target: container,
        ip: clientIp,
        status: 'SUCCESS',
        details: `Ação ${action} executada com sucesso`
      });

      return result;
    } catch (err) {
      auditService.logEvent({
        user: user || 'operator',
        action: `DOCKER_${action.toUpperCase()}`,
        target: container,
        ip: clientIp,
        status: 'FAILED',
        details: err.message
      });
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // Obter logs pontuais do container via HTTP
  fastify.get('/api/docker/logs/:container', async (request, reply) => {
    const { container } = request.params;
    const { tail } = request.query || {};

    try {
      const result = await dockerService.getContainerLogs({ container, tail });
      return result;
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // Listagem detalhada de containers
  fastify.get('/api/docker/containers', async (request, reply) => {
    try {
      const containers = await dockerService.listContainersDetailed();
      return { success: true, containers };
    } catch (err) {
      return reply.code(500).send({ success: false, error: err.message });
    }
  });

  // Rotação de logs do Docker
  fastify.post('/api/docker/optimize-logs', async () => {
    try {
      const daemonConfig = {
        'log-driver': 'json-file',
        'log-opts': {
          'max-size': '10m',
          'max-file': '3'
        }
      };
      const jsonStr = JSON.stringify(daemonConfig);
      const cmd = `echo '${jsonStr}' | sudo tee /etc/docker/daemon.json && sudo systemctl reload docker`;
      await deployService.runRemoteSsh(cmd);
      return {
        success: true,
        message: 'Rotação de logs configurada (10MB x 3 arquivos) e Docker recarregado com sucesso!'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // =========================================================================
  // WEBSOCKET: STREAMING DE LOGS DO CONTAINER EM TEMPO REAL
  // =========================================================================
  fastify.get('/ws/docker/logs/:container', { websocket: true }, (connection, req) => {
    const { container } = req.params;
    const socket = connection.socket || connection;

    if (!container || !/^[a-zA-Z0-9_\-\.]+$/.test(container)) {
      socket.send(JSON.stringify({ type: 'error', data: 'Nome de container inválido' }));
      socket.close();
      return;
    }

    socket.send(JSON.stringify({ type: 'info', data: `[WebSocket] Conectado ao stream de logs do container: ${container}` }));

    let activeStream = null;
    let conn = null;

    try {
      conn = new Client();
      conn.on('ready', () => {
        // -f (follow) para stream em tempo real
        conn.exec(`docker logs -f --tail 50 --timestamps ${container}`, (err, stream) => {
          if (err) {
            socket.send(JSON.stringify({ type: 'error', data: err.message }));
            socket.close();
            conn.end();
            return;
          }
          activeStream = stream;

          stream.on('data', (data) => {
            if (socket.readyState === 1) { // OPEN
              socket.send(JSON.stringify({ type: 'log', data: data.toString() }));
            }
          });

          stream.stderr.on('data', (data) => {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: 'log', data: data.toString() }));
            }
          });

          stream.on('close', () => {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: 'close', data: 'Stream de logs finalizado pelo servidor' }));
            }
            conn.end();
          });
        });
      });

      conn.on('error', (err) => {
        if (socket.readyState === 1) {
          socket.send(JSON.stringify({ type: 'error', data: 'Falha na conexão SSH para stream: ' + err.message }));
        }
      });

      // Conexão SSH usando as credenciais do ambiente
      const fs = require('fs');
      const sshKeyPath = process.env.VM_SSH_KEY_PATH || 'C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key';
      let privateKey = '';
      if (fs.existsSync(sshKeyPath)) {
        privateKey = fs.readFileSync(sshKeyPath, 'utf8');
      }

      conn.connect({
        host: process.env.VM_IP || '137.131.185.243',
        port: Number(process.env.VM_PORT) || 22,
        username: process.env.VM_USER || 'ubuntu',
        privateKey: privateKey.trim()
      });
    } catch (e) {
      socket.send(JSON.stringify({ type: 'error', data: e.message }));
    }

    socket.on('close', () => {
      if (activeStream) activeStream.destroy();
      if (conn) conn.end();
    });
  });

  // =========================================================================
  // WEBSOCKET: TERMINAL INTERATIVO BIDIRECIONAL
  // =========================================================================
  fastify.get('/ws/terminal', { websocket: true }, (connection, req) => {
    const socket = connection.socket || connection;
    socket.send(JSON.stringify({ type: 'info', data: 'Conectado ao Terminal Web Interativo SSH' }));

    let shellStream = null;
    let conn = null;

    try {
      conn = new Client();
      conn.on('ready', () => {
        conn.shell({ term: 'xterm-color' }, (err, stream) => {
          if (err) {
            socket.send(JSON.stringify({ type: 'error', data: err.message }));
            socket.close();
            conn.end();
            return;
          }
          shellStream = stream;

          stream.on('data', (chunk) => {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: 'output', data: chunk.toString() }));
            }
          });

          stream.on('close', () => {
            if (socket.readyState === 1) {
              socket.send(JSON.stringify({ type: 'close', data: 'Sessão de shell encerrada' }));
            }
            conn.end();
          });
        });
      });

      const fs = require('fs');
      const sshKeyPath = process.env.VM_SSH_KEY_PATH || 'C:\\Users\\vini\\Documents\\CHAVES_SSH_ORACLE_HOJE\\ssh-key-2026-02-20 (1).key';
      let privateKey = '';
      if (fs.existsSync(sshKeyPath)) {
        privateKey = fs.readFileSync(sshKeyPath, 'utf8');
      }

      conn.connect({
        host: process.env.VM_IP || '137.131.185.243',
        port: Number(process.env.VM_PORT) || 22,
        username: process.env.VM_USER || 'ubuntu',
        privateKey: privateKey.trim()
      });
    } catch (e) {
      socket.send(JSON.stringify({ type: 'error', data: e.message }));
    }

    // Recebe comandos/teclas do cliente
    socket.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        if (parsed.command && shellStream) {
          // Sanitiza antes de escrever
          const check = sanitizeBashCommand(parsed.command);
          if (!check.safe) {
            socket.send(JSON.stringify({ type: 'error', data: check.error }));
            return;
          }
          shellStream.write(parsed.command + '\n');
        } else if (parsed.input && shellStream) {
          shellStream.write(parsed.input);
        }
      } catch {
        if (shellStream) {
          shellStream.write(message.toString());
        }
      }
    });

    socket.on('close', () => {
      if (shellStream) shellStream.end();
      if (conn) conn.end();
    });
  });
}

module.exports = dockerRoutes;
