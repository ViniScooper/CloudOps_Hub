/**
 * authGuard.js — Guarda global de autenticação e autorização (deny-by-default)
 *
 * Regras:
 *  1. Só são públicas: health, login e solicitação de acesso (e preflight OPTIONS).
 *  2. Todo o resto exige JWT válido (header Authorization: Bearer ... ou ?token= nas rotas /ws/).
 *  3. Por padrão, uma rota é ADMIN-ONLY. Usuários comuns só acessam uma lista curta e explícita.
 *  4. Para usuários comuns, rotas que operam sobre servidores nunca podem mirar a infraestrutura master.
 */
const authService = require('./authService');
const auditService = require('./auditService');
const { extractClientIp } = require('./security');

const MASTER_IPS = new Set(
  ['137.131.185.243', '137.131.187.54', '127.0.0.1', '::1', 'localhost', process.env.VM_HOST]
    .filter(Boolean)
    .map((s) => String(s).trim().toLowerCase())
);

// Rotas totalmente públicas (método + caminho exato)
const PUBLIC_ROUTES = new Set([
  'GET /api/health',
  'POST /api/auth/login',
  'POST /api/auth/request-access'
]);

// Qualquer usuário autenticado (sem exigir admin)
const USER_ROUTES = [
  { method: 'GET', path: '/api/auth/me' },
  { method: 'POST', path: '/api/auth/change-password' },
  { method: 'GET', path: '/api/user/servers' },
  { method: 'POST', path: '/api/user/servers' },
  { method: 'DELETE', prefix: '/api/user/servers/' },
  { method: 'POST', path: '/api/telemetry/log' }
];

// Usuário comum só pode usar estas rotas contra servidores que NÃO são a infra master
// (exige parâmetro ip explícito e diferente dos IPs master)
const USER_SCOPED_ROUTES = [
  { method: 'POST', path: '/api/servers/connect' },
  { method: 'POST', path: '/api/servers/exec', requirePrivateKey: true },
  { method: 'GET', path: '/api/docker/containers' },
  { method: 'GET', prefix: '/api/docker/logs/' },
  { method: 'GET', path: '/api/system/metrics' },
  { method: 'GET', path: '/api/system/logs' },
  { method: 'GET', path: '/api/nginx/hosts' },
  { method: 'GET', path: '/api/network/pings' },
  { method: 'GET', path: '/api/servers/overview' }
];

function matches(rule, method, path) {
  if (rule.method !== method) return false;
  if (rule.path) return rule.path === path;
  return path.startsWith(rule.prefix);
}

function getTargetIp(request) {
  const raw = (request.query && request.query.ip) || (request.body && request.body.ip) || '';
  return String(raw).trim().toLowerCase();
}

function deny(reply, status, code, error) {
  return reply.code(status).send({ success: false, error, code });
}

async function authGuard(request, reply) {
  const method = request.method.toUpperCase();
  if (method === 'OPTIONS') return; // preflight CORS

  const path = (request.raw.url || request.url).split('?')[0];
  if (PUBLIC_ROUTES.has(`${method} ${path}`)) return;

  // Extrai o token (header; ou query ?token= apenas para WebSocket, que não envia headers)
  let token = null;
  const authHeader = request.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (path.startsWith('/ws/') && request.query && request.query.token) {
    token = String(request.query.token);
  }

  if (!token) {
    return deny(reply, 401, 'AUTH_REQUIRED', 'Autenticação necessária.');
  }

  const user = authService.verifyToken(token);
  if (!user) {
    return deny(reply, 401, 'AUTH_REQUIRED', 'Token inválido ou expirado.');
  }
  request.user = user;

  if (user.role === 'admin') return; // admin: acesso total (já autenticado)

  // ----- Usuário comum -----
  if (USER_ROUTES.some((r) => matches(r, method, path))) return;

  const scoped = USER_SCOPED_ROUTES.find((r) => matches(r, method, path));
  if (scoped) {
    const targetIp = getTargetIp(request);
    if (!targetIp || MASTER_IPS.has(targetIp)) {
      auditService.logEvent({
        user: user.email, action: 'ACCESS_DENIED', target: targetIp || 'default-master',
        ip: extractClientIp(request), status: 'BLOCKED', details: `${method} ${path}: alvo master/ausente`
      });
      return deny(reply, 403, 'FORBIDDEN', 'Você só pode operar nos seus próprios servidores.');
    }
    if (scoped.requirePrivateKey && !(request.body && request.body.privateKey)) {
      return deny(reply, 403, 'FORBIDDEN', 'Chave privada do seu servidor é obrigatória.');
    }
    return;
  }

  auditService.logEvent({
    user: user.email, action: 'ACCESS_DENIED', target: path,
    ip: extractClientIp(request), status: 'BLOCKED', details: `${method} ${path}: requer perfil admin`
  });
  return deny(reply, 403, 'FORBIDDEN', 'Permissão insuficiente: esta ação requer perfil de administrador.');
}

// Headers de segurança básicos em todas as respostas
async function securityHeaders(request, reply, payload) {
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('X-Frame-Options', 'DENY');
  reply.header('Referrer-Policy', 'no-referrer');
  reply.header('Cross-Origin-Resource-Policy', 'same-site');
  if ((request.raw.url || '').startsWith('/api/')) {
    reply.header('Cache-Control', 'no-store');
  }
  return payload;
}

module.exports = { authGuard, securityHeaders, MASTER_IPS };
