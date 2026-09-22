// Centralizador de URL da API do CloudOps Hub
// Detecta se está na Vercel (onde as rotas /api passam pelo proxy de rewrites) ou em localhost
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://localhost:3005');

export function getApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}
