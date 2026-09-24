// Centralizador de URL da API do CloudOps Hub
// Detecta se está na Vercel ou em localhost e direciona ao túnel seguro HTTPS ativo
export const LIVE_TUNNEL_URL = 'https://departmental-sussex-reveals-comparative.trycloudflare.com';

function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    // Quando executado na Vercel ou em domínio público, usa o túnel ativo com a VM Oracle
    if (host.includes('vercel.app')) {
      return LIVE_TUNNEL_URL;
    }
    if (host === 'localhost' || host === '127.0.0.1') {
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
    }
    return LIVE_TUNNEL_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL || LIVE_TUNNEL_URL;
}

export const API_BASE_URL = resolveBaseUrl();

export function getApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
