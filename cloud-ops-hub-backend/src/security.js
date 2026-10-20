/**
 * security.js — Módulo Central de Sanitização e Proteção contra Command Injection
 * Protege a execução de comandos remotos SSH e validações de integridade.
 */

// Padrões estritamente proibidos de comandos perigosos e destrutivos
const DANGEROUS_PATTERNS = [
  /rm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?(\/|\/\*|~|\$HOME)\b/i, // rm -rf / ou rm -rf /*
  />\s*\/dev\/sd[a-z]/i,                                     // sobrescrever disco bruto
  /mkfs(\.[a-z0-9]+)?\s+/i,                                  // formatar partição
  /:(){ :\|:& };:/,                                          // fork bomb
  /chmod\s+(-[a-zA-Z]*R[a-zA-Z]*\s+)?(777|000)\s+\//i,      // chmod recursivo na raiz
  /dd\s+if=.*of=\/dev\//i,                                   // dd bruto em disco
  />\s*\/etc\/(passwd|shadow)/i                              // sobrescrever arquivos do sistema
];

/**
 * Sanitiza e valida se um comando bash é seguro para execução remota via SSH.
 * @param {string} command - O comando a ser validado
 * @returns {{ safe: boolean, error?: string }}
 */
function sanitizeBashCommand(command) {
  if (!command || typeof command !== 'string') {
    return { safe: false, error: 'Comando inválido ou vazio.' };
  }

  const trimmed = command.trim();

  // Verifica se cai em algum padrão destrutivo
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        safe: false,
        error: 'Comando bloqueado pela política de segurança (Padrão destrutivo detectado).'
      };
    }
  }

  return { safe: true };
}

/**
 * Extrai o IP real do cliente mesmo através de proxies/Cloudflare
 */
function extractClientIp(request) {
  if (!request) return '127.0.0.1';
  const xForwardedFor = request.headers['x-forwarded-for'];
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  return request.headers['x-real-ip'] || request.ip || (request.socket && request.socket.remoteAddress) || '127.0.0.1';
}

/**
 * Valida estritamente se uma string é um endereço IPv4 legítimo ou localhost
 * @param {string} ip
 * @returns {boolean}
 */
function isValidHostAddress(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const trimmed = ip.trim();
  if (trimmed === 'localhost') return true;
  const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(trimmed);
}

/**
 * Mascara automaticamente senhas, tokens, API keys e chaves privadas em logs e textos
 * @param {string} text
 * @returns {string}
 */
function maskSensitiveData(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/(MYSQL_PWD=["']?)([^"'\s]+)(["']?)/gi, '$1[REDACTED_DB_PASS]$3')
    .replace(/(-p)([^\s"']+)/g, '$1[REDACTED_PASS]')
    .replace(/(apikey=)([^&\s]+)/gi, '$1[REDACTED_APIKEY]')
    .replace(/(Authorization:\s*(?:Basic|Bearer)\s+)([^\s"']+)/gi, '$1[REDACTED_TOKEN]')
    .replace(/(gsk_[a-zA-Z0-9]{20,})/g, '[REDACTED_GROQ_KEY]')
    .replace(/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, '[REDACTED_SSH_PRIVATE_KEY]');
}

module.exports = {
  sanitizeBashCommand,
  extractClientIp,
  isValidHostAddress,
  maskSensitiveData
};
