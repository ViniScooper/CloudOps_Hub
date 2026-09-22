// Centralizador de URL da API do CloudOps Hub
// Detecta se está na Vercel ou em localhost e direciona ao túnel seguro HTTPS ativo
export const LIVE_TUNNEL_URL = 'https://his-unified-cleanup-cancellation.trycloudflare.com';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? LIVE_TUNNEL_URL
    : 'http://localhost:3005');

export function getApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
