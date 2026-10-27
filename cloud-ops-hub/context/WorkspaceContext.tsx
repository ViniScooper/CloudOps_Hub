'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Server as ServerType, ContainerItem, BucketItem, ProxyHost, CurrentUser, ScraperData } from '../types'
import { getApiUrl } from '../lib/api'

export const initialServers: ServerType[] = [
  { id: 'oracle-prod', name: 'instance-bytedata', provider: 'Oracle Cloud (Always Free)', region: 'sa-saopaulo-1 (GRU)', ip: '137.131.185.243', status: 'Healthy', type: 'AMD EPYC (2 vCPUs)', cpu: '18', ram: '42', ramUsed: '401', ramTotal: '956', cacheUsed: '233', cachePct: '24', disk: '34', diskUsed: '15', diskTotal: '45', color: 'oracle' },
  { id: 'oracle-micro-02', name: 'cloudops-micro-02', provider: 'Oracle Cloud (Always Free)', region: 'sa-saopaulo-1 (GRU)', ip: '137.131.187.54', status: 'Healthy', type: 'VM.Standard.E2.1.Micro', cpu: '2', ram: '21', ramUsed: '207', ramTotal: '956', cacheUsed: '278', cachePct: '29', disk: '5', diskUsed: '2.4', diskTotal: '49', color: 'oracle' }
]

export const initialContainers: ContainerItem[] = [
  { name: 'financeiro_backend', image: 'node:20-alpine', status: 'Running', port: '3006:3006', cpu: '0.1%', memory: '42.5 MB', color: 'emerald' },
  { name: 'financeiro_tunnel', image: 'cloudflare/cloudflared', status: 'Running', port: 'Tunnel (FinControl)', cpu: '0.1%', memory: '30.1 MB', color: 'emerald' },
  { name: 'boteco_backend', image: 'node:20-alpine', status: 'Running', port: '3002:3001', cpu: '0.0%', memory: '33.6 MB', color: 'emerald' },
  { name: 'boteco_db', image: 'mysql:8.0 (Buffer 64M)', status: 'Running', port: '3306:3306', cpu: '0.5%', memory: '9.2 MB', color: 'emerald' },
  { name: 'boteco_tunnel', image: 'cloudflare/cloudflared', status: 'Running', port: 'Tunnel', cpu: '0.1%', memory: '31.3 MB', color: 'emerald' },
  { name: 'nginx-manager-nginx-1', image: 'nginx:alpine', status: 'Running', port: '80:80', cpu: '0.0%', memory: '1.5 MB', color: 'emerald' },
  { name: 'plataforma_ingles_api', image: 'node:18', status: 'Running', port: '3003:3002', cpu: '0.0%', memory: '23.8 MB', color: 'emerald' },
  { name: 'lottus-api (PM2)', image: 'node/pm2', status: 'Online', port: '3001', cpu: '0.0%', memory: '35.5 MB', color: 'emerald' },
]

export const initialBuckets: BucketItem[] = [
  { name: 'boteco-sivirino-fotos', visibility: 'Public (ObjectRead)', tier: 'Standard Always Free', region: 'sa-saopaulo-1', count: '142 objetos', size: '1.4 GB', url: 'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/' },
  { name: 'boteco-db-backups', visibility: 'Private', tier: 'Archive', region: 'sa-saopaulo-1', count: '14 dumps (.sql.gz)', size: '420 MB', url: 'Private Vault' },
]

export const initialProxies: ProxyHost[] = [
  { domain: 'cardapio.botecosivirino.com.br', forward: 'http://127.0.0.1:3002', ssl: 'Let\'s Encrypt (Ativo)', status: 'Online' },
  { domain: 'api.lottus.com.br', forward: 'http://127.0.0.1:3001', ssl: 'Let\'s Encrypt (Ativo)', status: 'Online' },
  { domain: 'ingles.plataforma.com.br', forward: 'http://127.0.0.1:3003', ssl: 'Auto-Renew', status: 'Warning' },
]

interface WorkspaceContextType {
  active: string
  setActive: (tab: string) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void
  currentUser: CurrentUser | null
  setCurrentUser: (user: CurrentUser | null) => void
  serverList: ServerType[]
  setServerList: React.Dispatch<React.SetStateAction<ServerType[]>>
  server: ServerType | null
  setServer: React.Dispatch<React.SetStateAction<ServerType | null>>
  ociCreds: any
  setOciCreds: (creds: any) => void
  containers: ContainerItem[]
  setContainers: React.Dispatch<React.SetStateAction<ContainerItem[]>>
  buckets: BucketItem[]
  setBuckets: React.Dispatch<React.SetStateAction<BucketItem[]>>
  proxyHosts: ProxyHost[]
  setProxyHosts: React.Dispatch<React.SetStateAction<ProxyHost[]>>
  refreshed: boolean
  setRefreshed: (refreshed: boolean) => void
  serverMenu: boolean
  setServerMenu: (menu: boolean) => void
  topbarServerMenu: boolean
  setTopbarServerMenu: (menu: boolean) => void
  action: string
  doAction: (label: string) => void
  cloudShellOpen: boolean
  setCloudShellOpen: (open: boolean) => void
  connectModalOpen: boolean
  setConnectModalOpen: (open: boolean) => void
  cloudflareModalOpen: boolean
  setCloudflareModalOpen: (open: boolean) => void
  isDroppingCache: boolean
  pendingRequestsCount: number
  scraperData: ScraperData
  scraperLoading: boolean
  setScraperLoading: (loading: boolean) => void
  handleDropCaches: () => Promise<void>
  handleSwitchServer: (item: ServerType) => void
  handleDockerAction: (containerName: string, action: 'start' | 'stop' | 'restart' | 'kill') => Promise<void>
  fetchLiveContainers: (targetServer?: ServerType | null) => Promise<void>
  fetchLiveSystemMetrics: (targetServer?: ServerType | null) => Promise<void>
  fetchLiveNginxHosts: (targetServer?: ServerType | null) => Promise<void>
  isMasterUser: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  const [serverList, setServerList] = useState<ServerType[]>([])
  const [server, setServer] = useState<ServerType | null>(null)
  const [ociCreds, setOciCreds] = useState<any>(null)
  const [containers, setContainers] = useState<ContainerItem[]>([])
  const [buckets, setBuckets] = useState<BucketItem[]>([])
  const [proxyHosts, setProxyHosts] = useState<ProxyHost[]>([])
  const [refreshed, setRefreshed] = useState(false)
  const [serverMenu, setServerMenu] = useState(false)
  const [topbarServerMenu, setTopbarServerMenu] = useState(false)
  const [action, setAction] = useState('')
  const [cloudShellOpen, setCloudShellOpen] = useState(false)
  const [connectModalOpen, setConnectModalOpen] = useState(false)
  const [cloudflareModalOpen, setCloudflareModalOpen] = useState(false)
  const [isDroppingCache, setIsDroppingCache] = useState(false)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)

  const [scraperData, setScraperData] = useState<ScraperData>({
    isRunning: false,
    status: 'Idle',
    attempts: 0,
    successfulVm: null,
    lastAttemptAt: null,
    currentProfile: null,
    logs: [],
    profiles: [],
    profileIndex: 0,
    intervalSeconds: 30
  })
  const [scraperLoading, setScraperLoading] = useState(false)

  const doAction = (label: string) => {
    setAction(label)
    setTimeout(() => setAction(''), 2500)
  }

  // Polling do status do Scraper
  useEffect(() => {
    const fetchScraperStatus = async () => {
      if (!localStorage.getItem('cloudops_token') && !sessionStorage.getItem('cloudops_token')) return
      try {
        const res = await fetch(getApiUrl('/api/oracle/scraper/status'))
        if (res.ok) {
          const data = await res.json()
          setScraperData(data)
        }
      } catch (err) {}
    }

    fetchScraperStatus()
    const interval = setInterval(fetchScraperStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Validação ativa da sessão
  useEffect(() => {
    const validateActiveSession = async () => {
      const token = localStorage.getItem('cloudops_token') || sessionStorage.getItem('cloudops_token')
      const savedUserStr = localStorage.getItem('cloudops_user') || sessionStorage.getItem('cloudops_user')

      if (!token) {
        setCurrentUser(null)
        localStorage.removeItem('cloudops_user')
        sessionStorage.removeItem('cloudops_user')
        return
      }

      try {
        const res = await fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json().catch(() => ({}))

        if (res.ok && data.success && data.user) {
          setCurrentUser(data.user)
          localStorage.setItem('cloudops_user', JSON.stringify(data.user))
        } else {
          console.warn('[CloudOps Hub] Sessão expirada ou segredo rotacionado. Forçando logout...')
          setCurrentUser(null)
          localStorage.removeItem('cloudops_user')
          localStorage.removeItem('cloudops_token')
          sessionStorage.removeItem('cloudops_user')
          sessionStorage.removeItem('cloudops_token')
        }
      } catch (err) {
        if (savedUserStr && !currentUser) {
          try {
            setCurrentUser(JSON.parse(savedUserStr))
          } catch {}
        }
      }
    }

    validateActiveSession()
  }, [])

  // Carrega servidores e configurações associadas ao usuário
  useEffect(() => {
    try {
      const u = currentUser
      const isMaster = (u?.email || '').trim().toLowerCase() === 'vviniciuslourenco@gmail.com'

      let activeServers = isMaster ? initialServers : []
      const storageKey = isMaster ? 'cloudops_servers' : `cloudops_servers_${u?.id || u?.email || 'guest'}`
      const savedServers = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
      if (savedServers) {
        try {
          const parsed = JSON.parse(savedServers)
          if (Array.isArray(parsed) && parsed.length > 0) activeServers = parsed
        } catch {}
      }

      setServerList(activeServers)

      if (activeServers.length > 0) {
        const savedActiveId = localStorage.getItem('cloudops_active_server_id')
        const targetServer = (savedActiveId && activeServers.find(s => s.id === savedActiveId || s.name === savedActiveId || s.ip === savedActiveId)) || activeServers[0]
        setServer(targetServer)

        const isVirgin = targetServer?.id === 'oracle-micro-02' || targetServer?.ip === '137.131.187.54' || targetServer?.name === 'cloudops-micro-02'
        if (isVirgin) {
          setContainers([
            {
              name: 'nginx-proxy',
              image: 'nginx:alpine',
              port: '80:80, 443:443',
              status: 'Running',
              cpu: '0.1%',
              memory: '6.5 MB',
              color: 'emerald'
            }
          ])
          setProxyHosts([
            {
              domain: '137.131.187.54',
              forward: '127.0.0.1:80',
              ssl: 'Nginx Edge Proxy',
              status: 'Active'
            }
          ])
          setBuckets([])
        } else {
          const savedContainers = localStorage.getItem(`cloudops_containers_${targetServer.id}`) || localStorage.getItem('cloudops_containers')
          if (savedContainers) {
            try { setContainers(JSON.parse(savedContainers)) } catch { setContainers(initialContainers) }
          } else {
            setContainers(isMaster ? initialContainers : [])
          }

          const savedBuckets = localStorage.getItem('cloudops_buckets')
          if (savedBuckets) {
            try { setBuckets(JSON.parse(savedBuckets)) } catch { setBuckets(initialBuckets) }
          } else {
            setBuckets(isMaster ? initialBuckets : [])
          }

          const savedProxies = localStorage.getItem(`cloudops_proxies_${targetServer.id}`) || localStorage.getItem('cloudops_proxies')
          if (savedProxies) {
            try { setProxyHosts(JSON.parse(savedProxies)) } catch { setProxyHosts(initialProxies) }
          } else {
            setProxyHosts(isMaster ? initialProxies : [])
          }
        }

        if (targetServer) {
          fetchLiveSystemMetrics(targetServer)
          fetchLiveContainers(targetServer)
          fetchLiveNginxHosts(targetServer)
        }
      } else {
        setServer(null)
        setContainers([])
        setBuckets([])
        setProxyHosts([])
      }

      const savedOci = localStorage.getItem('cloudops_oci')
      if (savedOci) {
        try { setOciCreds(JSON.parse(savedOci)) } catch {}
      }
    } catch (e) {
      console.error('Erro ao ler localStorage', e)
    }
  }, [currentUser])

  async function fetchLiveContainers(targetServer?: ServerType | null) {
    const s = targetServer || server
    if (!s) return
    const ipParam = s.ip ? `?ip=${encodeURIComponent(s.ip)}` : ''

    try {
      const res = await fetch(getApiUrl(`/api/docker/containers${ipParam}`))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.containers)) {
          setContainers(data.containers)
          if (typeof window !== 'undefined' && s?.id) {
            localStorage.setItem(`cloudops_containers_${s.id}`, JSON.stringify(data.containers))
          }
        }
      }
    } catch (e) {}
  }

  async function fetchLiveSystemMetrics(targetServer?: ServerType | null) {
    const s = targetServer || server
    if (!s) return
    const ipParam = s.ip ? `?ip=${encodeURIComponent(s.ip)}` : ''

    try {
      const res = await fetch(getApiUrl(`/api/system/metrics${ipParam}`))
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.metrics) {
          const m = data.metrics
          setServer((prev: any) => {
            if (!prev || (prev.id !== s.id && prev.ip !== s.ip)) return prev
            return {
              ...prev,
              cpu: m.cpu,
              ram: m.ram,
              ramUsed: m.ramUsed,
              ramTotal: m.ramTotal,
              cacheUsed: m.cacheUsed,
              cachePct: m.cachePct,
              disk: m.disk,
              diskUsed: m.diskUsed,
              diskTotal: m.diskTotal,
              uptime: m.uptime || prev.uptime,
              status: m.status || prev.status
            }
          })
          setServerList((prevList: any[]) =>
            prevList.map(srv => {
              if (srv.id === s.id || srv.ip === s.ip) {
                return {
                  ...srv,
                  cpu: m.cpu,
                  ram: m.ram,
                  ramUsed: m.ramUsed,
                  ramTotal: m.ramTotal,
                  cacheUsed: m.cacheUsed,
                  cachePct: m.cachePct,
                  disk: m.disk,
                  diskUsed: m.diskUsed,
                  diskTotal: m.diskTotal,
                  uptime: m.uptime || srv.uptime,
                  status: m.status || srv.status
                }
              }
              return srv
            })
          )
        }
      }
    } catch (e) {}
  }

  async function fetchLiveNginxHosts(targetServer?: ServerType | null) {
    const s = targetServer || server
    if (!s) return
    const ipParam = s.ip ? `?ip=${encodeURIComponent(s.ip)}` : ''

    try {
      const res = await fetch(getApiUrl(`/api/nginx/hosts${ipParam}`))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.proxies)) {
          setProxyHosts(data.proxies)
          if (typeof window !== 'undefined' && s?.id) {
            localStorage.setItem(`cloudops_proxies_${s.id}`, JSON.stringify(data.proxies))
          }
        }
      }
    } catch (e) {}
  }

  const handleDropCaches = async () => {
    setIsDroppingCache(true)
    doAction(`Otimizando memória... executando drop_caches na VM ${server?.name || server?.ip || ''}`)
    try {
      const res = await fetch(getApiUrl('/api/servers/drop-caches'), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: server?.ip })
      })
      const data = await res.json()
      if (data.success && data.server) {
        setServer((prev: any) => {
          const updated = { ...prev, ...data.server }
          try {
            const currentList = JSON.parse(localStorage.getItem('cloudops_servers') || '[]')
            const newList = currentList.map((s: any) => s.id === updated.id ? { ...s, ...data.server } : s)
            if (newList.length > 0) {
              localStorage.setItem('cloudops_servers', JSON.stringify(newList))
              setServerList(newList)
            }
          } catch (e) {}
          return updated
        })
        doAction('Memória RAM otimizada! Cache do kernel liberado com sucesso.')
      } else {
        doAction(`Erro ao liberar cache: ${data.error || 'Falha na resposta'}`)
      }
    } catch (err: any) {
      doAction(`Erro ao conectar com o backend: ${err.message}`)
    } finally {
      setIsDroppingCache(false)
    }
  }

  const handleSwitchServer = (item: ServerType) => {
    setServer(item)
    setServerMenu(false)
    setTopbarServerMenu(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloudops_active_server_id', item.id)
    }
    doAction(`Contexto alterado para ${item.name}`)

    const isVirgin = item.id === 'oracle-micro-02' || item.ip === '137.131.187.54' || item.name === 'cloudops-micro-02'

    if (isVirgin) {
      const savedContainers = localStorage.getItem(`cloudops_containers_${item.id}`)
      if (savedContainers) {
        try { setContainers(JSON.parse(savedContainers)) } catch (e) {
          setContainers([
            {
              name: 'nginx-proxy',
              image: 'nginx:alpine',
              port: '80:80, 443:443',
              status: 'Running',
              cpu: '0.1%',
              memory: '6.5 MB',
              color: 'emerald'
            }
          ])
        }
      } else {
        setContainers([
          {
            name: 'nginx-proxy',
            image: 'nginx:alpine',
            port: '80:80, 443:443',
            status: 'Running',
            cpu: '0.1%',
            memory: '6.5 MB',
            color: 'emerald'
          }
        ])
      }

      const savedProxies = localStorage.getItem(`cloudops_proxies_${item.id}`)
      if (savedProxies) {
        try { setProxyHosts(JSON.parse(savedProxies)) } catch (e) {
          setProxyHosts([
            {
              domain: '137.131.187.54',
              forward: '127.0.0.1:80',
              ssl: 'Nginx Edge Proxy',
              status: 'Active'
            }
          ])
        }
      } else {
        setProxyHosts([
          {
            domain: '137.131.187.54',
            forward: '127.0.0.1:80',
            ssl: 'Nginx Edge Proxy',
            status: 'Active'
          }
        ])
      }
      setBuckets([])
      fetchLiveContainers(item)
      fetchLiveSystemMetrics(item)
      fetchLiveNginxHosts(item)
    } else {
      const isMaster = (currentUser?.email || '').trim().toLowerCase() === 'vviniciuslourenco@gmail.com'
      const savedContainers = localStorage.getItem(`cloudops_containers_${item.id}`)
      if (savedContainers) {
        try { setContainers(JSON.parse(savedContainers)) } catch (e) { setContainers(isMaster ? initialContainers : []) }
      } else {
        setContainers(isMaster ? initialContainers : [])
      }
      const savedProxies = localStorage.getItem(`cloudops_proxies_${item.id}`)
      if (savedProxies) {
        try { setProxyHosts(JSON.parse(savedProxies)) } catch (e) { setProxyHosts(isMaster ? initialProxies : []) }
      } else {
        setProxyHosts(isMaster ? initialProxies : [])
      }
      setBuckets(isMaster ? initialBuckets : [])
      fetchLiveContainers(item)
      fetchLiveSystemMetrics(item)
      fetchLiveNginxHosts(item)
    }
  }

  const handleDockerAction = async (containerName: string, dockerAction: 'start' | 'stop' | 'restart' | 'kill') => {
    const actionLabel = dockerAction === 'start' ? 'Iniciando' : dockerAction === 'stop' ? 'Parando' : 'Reiniciando'
    doAction(`${actionLabel} container ${containerName}...`)
    try {
      const res = await fetch(getApiUrl('/api/docker/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container: containerName, action: dockerAction, ip: server?.ip })
      })
      const data = await res.json()
      if (data.success) {
        doAction(`✅ Container ${containerName}: ${dockerAction} executado com sucesso! (Status: ${data.status})`)
        setContainers(prev => prev.map(c => {
          if (c.name === containerName) {
            const isUp = dockerAction === 'start' || (dockerAction === 'restart' && data.status !== 'exited')
            return {
              ...c,
              status: isUp ? 'Running' : 'Exited',
              color: isUp ? 'emerald' : 'red'
            }
          }
          return c
        }))
      } else {
        doAction(`Erro ao executar ${dockerAction}: ${data.error || 'Falha na resposta'}`)
      }
    } catch (err: any) {
      doAction(`Falha na requisição Docker: ${err.message}`)
    }
  }

  // Polling periódico do servidor ativo
  useEffect(() => {
    if (!server) return

    if (active === 'Dashboard') {
      fetchLiveSystemMetrics(server)
      fetchLiveContainers(server)
      const interval = setInterval(() => {
        fetchLiveSystemMetrics(server)
      }, 15000)
      return () => clearInterval(interval)
    } else if (active === 'Docker') {
      fetchLiveContainers(server)
    } else if (active === 'Nginx') {
      fetchLiveNginxHosts(server)
    }
  }, [active, server?.id, server?.ip])

  // Checagem de solicitações pendentes de acesso
  useEffect(() => {
    const checkRequests = () => {
      fetch(getApiUrl('/api/admin/requests'))
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.requests)) {
            const count = data.requests.filter((r: any) => r.status === 'pending').length
            setPendingRequestsCount(count)
          }
        })
        .catch(() => {})
    }
    checkRequests()
    const timer = setInterval(checkRequests, 10000)
    return () => clearInterval(timer)
  }, [currentUser])

  const isMasterUser = (currentUser?.email || '').trim().toLowerCase() === 'vviniciuslourenco@gmail.com'

  return (
    <WorkspaceContext.Provider
      value={{
        active,
        setActive,
        sidebarOpen,
        setSidebarOpen,
        sidebarCollapsed,
        setSidebarCollapsed,
        currentUser,
        setCurrentUser,
        serverList,
        setServerList,
        server,
        setServer,
        ociCreds,
        setOciCreds,
        containers,
        setContainers,
        buckets,
        setBuckets,
        proxyHosts,
        setProxyHosts,
        refreshed,
        setRefreshed,
        serverMenu,
        setServerMenu,
        topbarServerMenu,
        setTopbarServerMenu,
        action,
        doAction,
        cloudShellOpen,
        setCloudShellOpen,
        connectModalOpen,
        setConnectModalOpen,
        cloudflareModalOpen,
        setCloudflareModalOpen,
        isDroppingCache,
        pendingRequestsCount,
        scraperData,
        scraperLoading,
        setScraperLoading,
        handleDropCaches,
        handleSwitchServer,
        handleDockerAction,
        fetchLiveContainers,
        fetchLiveSystemMetrics,
        fetchLiveNginxHosts,
        isMasterUser
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext)
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
