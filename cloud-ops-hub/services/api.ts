import { getApiUrl } from '../lib/api'

export async function execServerCommand(cmd: string, serverConfig?: { host?: string; user?: string; port?: string; key?: string }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cloudops_token') : null
  const res = await fetch(getApiUrl('/api/servers/exec'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      cmd,
      ...(serverConfig || {})
    })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Falha na execução' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function dropServerCaches() {
  const res = await fetch(getApiUrl('/api/servers/drop-caches'), { method: 'POST' })
  if (!res.ok) throw new Error('Falha ao limpar caches')
  return res.json()
}

export async function fetchContainers() {
  const res = await fetch(getApiUrl('/api/docker/containers'))
  if (!res.ok) throw new Error('Falha ao listar containers')
  return res.json()
}

export async function runDockerAction(container: string, action: 'start' | 'stop' | 'restart' | 'kill') {
  const res = await fetch(getApiUrl('/api/docker/action'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ container, action })
  })
  if (!res.ok) throw new Error('Falha na ação Docker')
  return res.json()
}

export async function fetchContainerLogs(name: string, tail: number = 100) {
  const res = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(name)}?tail=${tail}`))
  if (!res.ok) throw new Error('Falha ao obter logs do container')
  return res.json()
}

export async function optimizeDockerLogs() {
  const res = await fetch(getApiUrl('/api/docker/optimize-logs'), { method: 'POST' })
  if (!res.ok) throw new Error('Falha ao truncar logs do Docker')
  return res.json()
}

export async function fetchSystemMetrics() {
  const res = await fetch(getApiUrl('/api/system/metrics'))
  if (!res.ok) throw new Error('Falha ao obter métricas')
  return res.json()
}

export async function fetchNginxHosts() {
  const res = await fetch(getApiUrl('/api/nginx/hosts'))
  if (!res.ok) throw new Error('Falha ao obter hosts Nginx')
  return res.json()
}

export async function fetchSystemLogs() {
  const res = await fetch(getApiUrl('/api/system/logs'))
  if (!res.ok) throw new Error('Falha ao obter logs do sistema')
  return res.json()
}
