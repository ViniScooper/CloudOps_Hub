// Centralizador de URL da API do CloudOps Hub
// Detecta se está na Vercel ou em localhost e direciona ao túnel seguro HTTPS ativo
export const LIVE_TUNNEL_URL = 'https://departmental-sussex-reveals-comparative.trycloudflare.com';

function resolveBaseUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || '';
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return envUrl || 'http://localhost:3005';
    }
    // Em produção, só usa NEXT_PUBLIC_API_URL se for um domínio fixo (ignora trycloudflare.com antigo da Vercel)
    if (envUrl && !envUrl.includes('trycloudflare.com')) {
      return envUrl;
    }
    return LIVE_TUNNEL_URL;
  }
  return envUrl || LIVE_TUNNEL_URL;
}

export const API_BASE_URL = resolveBaseUrl();

export function getApiUrl(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}

// Interceptor global: anexa o JWT em toda chamada à API do CloudOps Hub e
// encerra a sessão local quando o backend responde AUTH_REQUIRED (token inválido/expirado).
if (typeof window !== 'undefined' && !(window as any).__cloudopsFetchPatched) {
  ;(window as any).__cloudopsFetchPatched = true
  const originalFetch = window.fetch.bind(window)

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!url.startsWith(API_BASE_URL)) {
      return originalFetch(input, init)
    }

    const token = localStorage.getItem('cloudops_token') || sessionStorage.getItem('cloudops_token')
    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined))
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    const res = await originalFetch(input, { ...init, headers })

    if (res.status === 401 && token) {
      try {
        const data = await res.clone().json()
        if (data && data.code === 'AUTH_REQUIRED') {
          localStorage.removeItem('cloudops_token')
          localStorage.removeItem('cloudops_user')
          sessionStorage.removeItem('cloudops_token')
          sessionStorage.removeItem('cloudops_user')
          window.location.reload()
        }
      } catch {}
    }
    return res
  }
}