'use client'

import React, { useState, useEffect } from 'react'
import {
  Activity, Bell, Check, ChevronDown, CircleHelp, Cloud, Container, Database,
  HardDrive, LayoutDashboard, Menu, MoreHorizontal, Network, Plus, RefreshCw,
  Search, Server, Settings, TerminalSquare, X, Zap, Globe2, ArrowUpRight,
  RotateCcw, Layers3, Shield, LogOut, Users, Rocket, KeyRound, Bot, ArrowLeftRight
} from 'lucide-react'
import { VmScraper } from '../components/VmScraper'
import { DashboardView } from '../components/DashboardView'
import { DeployView } from '../components/DeployView'
import { EnvManagerView } from '../components/EnvManagerView'
import { HelpView } from '../components/HelpView'
import { OdisseuChatView } from '../components/OdisseuChatView'
import { CloudflareTunnelView } from '../components/CloudflareTunnelView'
import { StorageExplorerView } from '../components/StorageExplorerView'
import { LogsTelemetryView } from '../components/LogsTelemetryView'
import { MigrationWorkspaceView } from '../components/MigrationWorkspaceView'
import { VercelDeploymentsView, VercelIcon } from '../components/VercelDeploymentsView'
import { RenderDeploymentsView, RenderIcon } from '../components/RenderDeploymentsView'
import { LoginView } from '../components/LoginView'
import { UserManagementView } from '../components/UserManagementView'
import { SettingsView } from '../components/SettingsView'
import { DockerView } from '../components/DockerView'
import { NginxView } from '../components/NginxView'
import { TerminalView } from '../components/TerminalView'
import { ConnectModal } from '../components/ConnectModal'
import { CloudShellModal } from '../components/CloudShellModal'
import { CloudflareModal } from '../components/CloudflareModal'
import { getApiUrl } from '../lib/api'
import { Server as ServerType, ContainerItem, BucketItem, ProxyHost, CurrentUser, ScraperData } from '../types'

const navSections = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Odisseu AI', icon: Bot, badge: 'Copilot' },
      { label: 'Deploy', icon: Rocket, badge: 'CI/CD' },
      { label: 'Vercel Frontend', icon: VercelIcon, badge: 'Edge' },
      { label: 'Render Backend', icon: RenderIcon, badge: 'PaaS' },
      { label: 'Monitoramento & Logs', icon: Activity, badge: 'Realtime' },
      { label: 'Migração Multi-Cloud', icon: ArrowLeftRight, badge: '1-Click' },
    ]
  },
  {
    title: 'Infraestrutura & Serviços',
    items: [
      { label: 'Docker', icon: Container },
      { label: 'Nginx', icon: Network },
      { label: 'Tunnels', icon: Shield, badge: 'Zero Trust' },
      { label: 'Storage', icon: HardDrive },
      { label: 'Terminal', icon: TerminalSquare },
      { label: 'Variáveis (.env)', icon: KeyRound },
    ]
  },
  {
    title: 'Gerenciamento',
    items: [
      { label: 'Recursos & VMs', icon: Layers3 },
      { label: 'Aprovações & Usuários', icon: Users, badge: 'Admin' },
      { label: 'Configurações', icon: Settings, badge: 'Perfil' },
    ]
  },
  {
    title: 'Suporte',
    items: [
      { label: 'Ajuda & Guia', icon: CircleHelp, badge: 'Help' },
    ]
  }
]

const initialServers: ServerType[] = [
  { id: 'oracle-prod', name: 'instance-bytedata', provider: 'Oracle Cloud (Always Free)', region: 'sa-saopaulo-1 (GRU)', ip: '137.131.185.243', status: 'Healthy', type: 'AMD EPYC (2 vCPUs)', cpu: '18', ram: '42', ramUsed: '401', ramTotal: '956', cacheUsed: '233', cachePct: '24', disk: '34', diskUsed: '15', diskTotal: '45', color: 'oracle' },
  { id: 'oracle-micro-02', name: 'cloudops-micro-02', provider: 'Oracle Cloud (Always Free)', region: 'sa-saopaulo-1 (GRU)', ip: '137.131.187.54', status: 'Healthy', type: 'VM.Standard.E2.1.Micro', cpu: '2', ram: '21', ramUsed: '207', ramTotal: '956', cacheUsed: '278', cachePct: '29', disk: '5', diskUsed: '2.4', diskTotal: '49', color: 'oracle' }
]

const initialContainers: ContainerItem[] = [
  { name: 'financeiro_backend', image: 'node:20-alpine', status: 'Running', port: '3006:3006', cpu: '0.1%', memory: '42.5 MB', color: 'emerald' },
  { name: 'financeiro_tunnel', image: 'cloudflare/cloudflared', status: 'Running', port: 'Tunnel (FinControl)', cpu: '0.1%', memory: '30.1 MB', color: 'emerald' },
  { name: 'boteco_backend', image: 'node:20-alpine', status: 'Running', port: '3002:3001', cpu: '0.0%', memory: '33.6 MB', color: 'emerald' },
  { name: 'boteco_db', image: 'mysql:8.0 (Buffer 64M)', status: 'Running', port: '3306:3306', cpu: '0.5%', memory: '9.2 MB', color: 'emerald' },
  { name: 'boteco_tunnel', image: 'cloudflare/cloudflared', status: 'Running', port: 'Tunnel', cpu: '0.1%', memory: '31.3 MB', color: 'emerald' },
  { name: 'nginx-manager-nginx-1', image: 'nginx:alpine', status: 'Running', port: '80:80', cpu: '0.0%', memory: '1.5 MB', color: 'emerald' },
  { name: 'plataforma_ingles_api', image: 'node:18', status: 'Running', port: '3003:3002', cpu: '0.0%', memory: '23.8 MB', color: 'emerald' },
  { name: 'lottus-api (PM2)', image: 'node/pm2', status: 'Online', port: '3001', cpu: '0.0%', memory: '35.5 MB', color: 'emerald' },
]

const initialBuckets: BucketItem[] = [
  { name: 'boteco-sivirino-fotos', visibility: 'Public (ObjectRead)', tier: 'Standard Always Free', region: 'sa-saopaulo-1', count: '142 objetos', size: '1.4 GB', url: 'https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/' },
  { name: 'boteco-db-backups', visibility: 'Private', tier: 'Archive', region: 'sa-saopaulo-1', count: '14 dumps (.sql.gz)', size: '420 MB', url: 'Private Vault' },
]

const initialProxies: ProxyHost[] = [
  { domain: 'cardapio.botecosivirino.com.br', forward: 'http://127.0.0.1:3002', ssl: 'Let\'s Encrypt (Ativo)', status: 'Online' },
  { domain: 'api.lottus.com.br', forward: 'http://127.0.0.1:3001', ssl: 'Let\'s Encrypt (Ativo)', status: 'Online' },
  { domain: 'ingles.plataforma.com.br', forward: 'http://127.0.0.1:3003', ssl: 'Auto-Renew', status: 'Warning' },
]

function Metric({ 
  label, 
  value, 
  unit, 
  change, 
  icon: Icon, 
  tone, 
  progress,
  badge,
  actionButton
}: { 
  label: string; 
  value: string; 
  unit: string; 
  change: string; 
  icon: typeof Activity; 
  tone: string; 
  progress: number;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
}) {
  return (
    <article className="metric-card" style={{ position: 'relative' }}>
      <div className="metric-topline">
        <span className={`metric-icon ${tone}`}><Icon size={16} /></span>
        <span className="metric-label">{label}</span>
        {actionButton ? actionButton : <MoreHorizontal size={16} className="metric-more" />}
      </div>
      <div className="metric-value">
        {value}<span>{unit}</span>
      </div>
      <div className="metric-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="change positive">{change}</span>
          <span className="muted">vs. last hour</span>
        </div>
        {badge && (
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            {badge}
          </div>
        )}
      </div>
      <div className="progress-track">
        <div className={`progress-fill ${tone}`} style={{ width: `${progress}%` }} />
      </div>
    </article>
  )
}

export default function Page() {
  const [active, setActive] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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

  // Oracle VM Scraper Auto-Provisioning States
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
      try {
        const res = await fetch(getApiUrl('/api/oracle/scraper/status'))
        if (res.ok) {
          const data = await res.json()
          setScraperData(data)
        }
      } catch (err) {
        // backend offline ou carregando
      }
    }

    fetchScraperStatus()
    const interval = setInterval(fetchScraperStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Carrega os dados salvos do localStorage na inicialização
  useEffect(() => {
    try {
      const savedUserStr = localStorage.getItem('cloudops_user') || sessionStorage.getItem('cloudops_user')
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr)
        setCurrentUser(u)
      }

      const loggedUser = savedUserStr ? JSON.parse(savedUserStr) : null
      const isMasterUser = (loggedUser?.email || '').trim().toLowerCase() === 'vviniciuslourenco@gmail.com'

      let activeServers = isMasterUser ? initialServers : []
      const storageKey = isMasterUser ? 'cloudops_servers' : `cloudops_servers_${loggedUser?.id || loggedUser?.email || 'guest'}`
      const savedServers = localStorage.getItem(storageKey)
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
            setContainers(isMasterUser ? initialContainers : [])
          }

          const savedBuckets = localStorage.getItem('cloudops_buckets')
          if (savedBuckets) {
            try { setBuckets(JSON.parse(savedBuckets)) } catch { setBuckets(initialBuckets) }
          } else {
            setBuckets(isMasterUser ? initialBuckets : [])
          }

          const savedProxies = localStorage.getItem(`cloudops_proxies_${targetServer.id}`) || localStorage.getItem('cloudops_proxies')
          if (savedProxies) {
            try { setProxyHosts(JSON.parse(savedProxies)) } catch { setProxyHosts(initialProxies) }
          } else {
            setProxyHosts(isMasterUser ? initialProxies : [])
          }
        }

        const isProdTarget = targetServer?.id === 'oracle-prod' || targetServer?.ip === '137.131.185.243'
        if (isProdTarget) {
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
  }, [])

  const handleDropCaches = async () => {
    setIsDroppingCache(true)
    doAction('Otimizando memória... executando drop_caches na VM')
    try {
      const res = await fetch(getApiUrl('/api/servers/drop-caches'), { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
      const savedContainers = localStorage.getItem(`cloudops_containers_${item.id}`) || localStorage.getItem('cloudops_containers')
      if (savedContainers) {
        try { setContainers(JSON.parse(savedContainers)) } catch (e) { setContainers(initialContainers) }
      } else {
        setContainers(initialContainers)
      }
      const savedProxies = localStorage.getItem(`cloudops_proxies_${item.id}`) || localStorage.getItem('cloudops_proxies')
      if (savedProxies) {
        try { setProxyHosts(JSON.parse(savedProxies)) } catch (e) { setProxyHosts(initialProxies) }
      } else {
        setProxyHosts(initialProxies)
      }
      setBuckets(initialBuckets)
      fetchLiveContainers(item)
      fetchLiveSystemMetrics(item)
      fetchLiveNginxHosts(item)
    }
  }

  async function fetchLiveContainers(targetServer?: ServerType | null) {
    const s = targetServer || server
    const isProd = s?.id === 'oracle-prod' || s?.ip === '137.131.185.243'
    if (!isProd) return

    try {
      const res = await fetch(getApiUrl('/api/docker/containers'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.containers) && data.containers.length > 0) {
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
    const isProd = s?.id === 'oracle-prod' || s?.ip === '137.131.185.243'
    if (!isProd) return

    try {
      const res = await fetch(getApiUrl('/api/system/metrics'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.metrics) {
          const m = data.metrics
          setServer((prev: any) => {
            if (!prev) return prev
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
              if (srv.id === 'oracle-prod' || srv.ip === '137.131.185.243') {
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
    const isProd = s?.id === 'oracle-prod' || s?.ip === '137.131.185.243'
    if (!isProd) return

    try {
      const res = await fetch(getApiUrl('/api/nginx/hosts'))
      if (res.ok) {
        const data = await res.json()
        if (data.success && Array.isArray(data.proxies) && data.proxies.length > 0) {
          setProxyHosts(data.proxies)
          if (typeof window !== 'undefined' && s?.id) {
            localStorage.setItem(`cloudops_proxies_${s.id}`, JSON.stringify(data.proxies))
          }
        }
      }
    } catch (e) {}
  }

  useEffect(() => {
    if (!server) return
    const isProd = server?.id === 'oracle-prod' || server?.ip === '137.131.185.243'
    if (!isProd) return

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
  }, [active, server?.id])

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

  const handleDockerAction = async (containerName: string, action: 'start' | 'stop' | 'restart' | 'kill') => {
    const actionLabel = action === 'start' ? 'Iniciando' : action === 'stop' ? 'Parando' : 'Reiniciando'
    doAction(`${actionLabel} container ${containerName}...`)
    try {
      const res = await fetch(getApiUrl('/api/docker/action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ container: containerName, action })
      })
      const data = await res.json()
      if (data.success) {
        doAction(`✅ Container ${containerName}: ${action} executado com sucesso! (Status: ${data.status})`)
        setContainers(prev => prev.map(c => {
          if (c.name === containerName) {
            const isUp = action === 'start' || (action === 'restart' && data.status !== 'exited')
            return {
              ...c,
              status: isUp ? 'Running' : 'Exited',
              color: isUp ? 'emerald' : 'red'
            }
          }
          return c
        }))
      } else {
        doAction(`Erro ao executar ${action}: ${data.error || 'Falha na resposta'}`)
      }
    } catch (err: any) {
      doAction(`Falha na requisição Docker: ${err.message}`)
    }
  }

  if (!currentUser) {
    return (
      <LoginView
        onSuccess={(user) => {
          setCurrentUser(user)
          doAction(`Bem-vindo ao CloudOps Hub, ${user.name}! 🚀`)
        }}
      />
    )
  }

  return (
    <main className="app-shell">
      <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Abrir menu"><Menu size={20} /></button>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <span className="brand-mark"><Cloud size={18} /></span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5f0ed', lineHeight: 1.1 }}>CloudOps <b>Hub</b></span>
            <span style={{ fontSize: '9px', color: '#557277', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px' }}>DevOps Cloud Console</span>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={18} /></button>
        </div>

        <div className="workspace">
          <span className="workspace-avatar">{currentUser.name.charAt(0)}</span>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </div>
          <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(32, 214, 199, 0.1)', color: '#20d6c7', borderRadius: '4px', border: '1px solid rgba(32, 214, 199, 0.25)', fontWeight: 600 }}>PRO</span>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <span className="nav-caption">{section.title}</span>
              {section.items.map(({ label, icon: Icon, badge }) => {
                const isApproval = label === 'Aprovações & Usuários'
                const isVm = label === 'Recursos & VMs'
                const isDashboard = label === 'Dashboard'

                const isItemActive =
                  active === label ||
                  (isVm && active === 'Dashboard') ||
                  (isDashboard && (active === 'Dashboard' || active === 'Recursos & VMs')) ||
                  (isApproval && (active === 'Usuários & Aprovações' || active === 'Aprovações & Usuários'))

                return (
                  <button 
                    key={label} 
                    title={`Abrir módulo ${label}`}
                    onClick={() => {
                      if (isVm) {
                        setActive('Dashboard')
                      } else if (isApproval) {
                        setActive('Usuários & Aprovações')
                      } else {
                        setActive(label)
                      }
                      setSidebarOpen(false)
                    }} 
                    className={`nav-item ${isItemActive ? 'active' : ''}`}
                  >
                    <Icon size={16} style={isApproval ? { color: '#20d6c7' } : undefined} />
                    <span>{label}</span>
                    {label === 'Docker' && server && containers.length > 0 && <span className="nav-badge">{containers.length}</span>}
                    {isApproval && (
                      <span 
                        className="nav-badge" 
                        style={{ 
                          background: pendingRequestsCount > 0 ? '#f59e0b' : 'rgba(32, 214, 199, 0.2)', 
                          color: pendingRequestsCount > 0 ? '#000' : '#20d6c7', 
                          fontWeight: 800 
                        }}
                      >
                        {pendingRequestsCount > 0 ? pendingRequestsCount : 'Admin'}
                      </span>
                    )}
                    {!isApproval && label !== 'Docker' && badge && <span className="nav-badge">{badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`nav-item ${active === 'Configurações' ? 'active' : ''}`} 
            title="Abrir configurações de segurança, chaves AES-256 e perfil" 
            onClick={() => setActive('Configurações')}
          >
            <Settings size={16} />
            <span>Configurações</span>
          </button>
          <button 
            className="nav-item logout-btn" 
            title="Fazer logout e encerrar a sessão segura" 
            onClick={() => {
              setCurrentUser(null)
              localStorage.removeItem('cloudops_user')
              localStorage.removeItem('cloudops_token')
              sessionStorage.removeItem('cloudops_user')
              sessionStorage.removeItem('cloudops_token')
            }}
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>

          <div className="sidebar-status-pill">
            <div className="live-indicator">
              <span className="live-dot" />
              <span>Nuvem Ativa</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar" style={{ position: 'relative', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
            <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <span className="breadcrumb-workspace" style={{ color: '#526e72', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Workspace</span>
              <span className="breadcrumb-slash" style={{ color: '#2a3d40', fontSize: '11.5px' }}>/</span>
              <strong className="breadcrumb-active" style={{ color: '#e2edeb', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{active}</strong>
            </div>

            <div className="topbar-divider" style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px', flexShrink: 0 }} />

            <div className="topbar-server-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              {server ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setTopbarServerMenu(!topbarServerMenu)
                  }}
                  title="Clique para alternar o servidor / VM de trabalho"
                  className="topbar-server-btn"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: '28px',
                    padding: '0 8px 0 5px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, rgba(16, 28, 30, 0.98), rgba(7, 14, 16, 0.98))',
                    border: '1px solid rgba(32, 214, 199, 0.4)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                    cursor: 'pointer',
                    color: '#e2edeb',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span 
                    style={{ 
                      padding: '1px 5px', 
                      borderRadius: '4px', 
                      fontSize: '8px', 
                      fontWeight: 800, 
                      lineHeight: '13px',
                      letterSpacing: '0.4px',
                      background: server.provider?.toLowerCase().includes('aws') ? '#f4b942' : 'linear-gradient(135deg, #ef9b55, #c25f39)', 
                      color: '#fff',
                      flexShrink: 0
                    }}
                  >
                    {server.provider?.toLowerCase().includes('aws') ? 'AWS' : 'OCI'}
                  </span>

                  <div style={{ position: 'relative', display: 'flex', width: '7px', height: '7px', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', opacity: 0.6, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                    <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                    <span className="server-label-prefix" style={{ fontSize: '8.5px', fontWeight: 700, color: '#20d6c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      NÓ:
                    </span>
                    <span className="server-name-text" style={{ fontSize: '11px', fontWeight: 600, color: '#f0fdfa' }}>
                      {server.name}
                    </span>
                    <span className="server-ip-badge" style={{ 
                      fontSize: '9.5px', 
                      fontFamily: 'monospace', 
                      color: '#38bdf8', 
                      background: 'rgba(0, 0, 0, 0.5)', 
                      padding: '1px 5px', 
                      borderRadius: '3px',
                      border: '1px solid rgba(56, 189, 248, 0.25)'
                    }}>
                      {server.ip}
                    </span>
                  </div>

                  <ChevronDown 
                    size={12} 
                    style={{ 
                      color: '#8ca6a5', 
                      transform: topbarServerMenu ? 'rotate(180deg)' : 'none', 
                      transition: 'transform 0.2s ease',
                      flexShrink: 0,
                      marginLeft: '2px'
                    }} 
                  />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(true)}
                  title="Nenhuma máquina conectada. Clique para conectar via SSH."
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    height: '28px',
                    padding: '0 9px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#f59e0b',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span className="status-dot amber" style={{ width: '5px', height: '5px' }} />
                  <Server size={11} />
                  <span style={{ fontWeight: 600 }}>Sem Nó Ativo</span>
                  <span style={{ fontSize: '9px', color: '#9ca3af' }}>(Conectar SSH)</span>
                </button>
              )}

              {topbarServerMenu && (
                <div 
                  className="topbar-dropdown-backdrop"
                  style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: 999998,
                    background: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(2px)'
                  }} 
                  onClick={(e) => {
                    e.stopPropagation()
                    setTopbarServerMenu(false)
                  }} 
                />
              )}

              {topbarServerMenu && (
                <div 
                  className="topbar-server-dropdown"
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    position: 'absolute', 
                    top: 'calc(100% + 7px)', 
                    left: 0, 
                    zIndex: 999999,
                    width: '320px',
                    background: '#090f11',
                    border: '1px solid rgba(32, 214, 199, 0.4)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(0, 0, 0, 0.85)',
                    borderRadius: '10px',
                    padding: '8px',
                    backdropFilter: 'blur(24px)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 10px', borderBottom: '1px solid #162426', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Server size={13} style={{ color: '#20d6c7' }} />
                      <span style={{ fontSize: '10px', color: '#8ca6a5', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                        Nós do Cluster ({serverList.length})
                      </span>
                    </div>
                    <span style={{ fontSize: '9.5px', color: '#526e72' }}>Zero Trust</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {serverList.map(item => {
                      const isCurrent = item.id === server?.id
                      return (
                        <button
                          key={item.id} 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSwitchServer(item)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 10px',
                            borderRadius: '7px',
                            background: isCurrent ? 'rgba(32, 214, 199, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                            border: isCurrent ? '1px solid rgba(32, 214, 199, 0.4)' : '1px solid #162426',
                            cursor: 'pointer',
                            textAlign: 'left',
                            width: '100%'
                          }}
                        >
                          <span className={`provider-mark small ${item.color || 'oracle'}`}>OC</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <b style={{ color: isCurrent ? '#20d6c7' : '#d9e2e1', fontSize: '11.5px' }}>{item.name}</b>
                              {isCurrent && <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(32, 214, 199, 0.25)', color: '#20d6c7', fontWeight: 700 }}>ATIVO</span>}
                            </div>
                            <small style={{ color: '#6f8387', fontSize: '10px', display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>
                              {item.ip} · {item.region}
                            </small>
                          </div>
                          {isCurrent && <Check size={14} style={{ color: '#20d6c7', flexShrink: 0 }} />}
                        </button>
                      )
                    })}

                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #162426' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setTopbarServerMenu(false)
                          setConnectModalOpen(true)
                        }}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '7px',
                          background: 'rgba(32, 214, 199, 0.1)',
                          border: '1px solid rgba(32, 214, 199, 0.3)',
                          borderRadius: '6px',
                          color: '#20d6c7',
                          fontSize: '10px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={12} /> Conectar Nova VM
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button 
              className="topbar-action-icon"
              title="Ajuda & Guia Rápido"
              onClick={() => setActive('Ajuda & Guia')}
              style={{ color: active === 'Ajuda & Guia' ? '#20d6c7' : undefined }}
            >
              <CircleHelp size={16} />
            </button>
            <button 
              className="topbar-action-icon"
              title="Configurações e Segurança"
              onClick={() => setActive('Configurações')}
              style={{ color: active === 'Configurações' ? '#20d6c7' : undefined }}
            >
              <Settings size={16} />
            </button>
            <button 
              className="topbar-avatar-btn"
              title={`${currentUser.name} (${currentUser.email})`}
              onClick={() => setActive('Configurações')}
              style={{ 
                borderColor: active === 'Configurações' ? '#20d6c7' : undefined 
              }}
            >
              <span>{currentUser.name.charAt(0)}</span>
            </button>
          </div>
        </header>

        <div className={active === 'Odisseu AI' ? 'page-content odisseu-page-content' : 'page-content'}>
          {/* Cabeçalho do Dashboard */}
          {(active === 'Dashboard' || active === 'Recursos & VMs') && (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow"><span className="live-dot" /> Multi-cloud command center • Zero Trust</div>
                  <h1>Painel de Controle</h1>
                  <p>{server ? `Conectado em ${server.name} (${server.ip}) via SSH seguro.` : 'Nenhum servidor conectado no momento. Conecte sua VM Oracle ou AWS.'}</p>
                </div>
                <div className="heading-actions">
                  {server && (
                    <button 
                      className={`refresh-button ${refreshed ? 'spinning' : ''}`} 
                      onClick={() => { 
                        setRefreshed(true)
                        setTimeout(() => setRefreshed(false), 700)
                        if (server) {
                          fetchLiveSystemMetrics(server)
                          fetchLiveContainers(server)
                        }
                        doAction('Telemetria atualizada') 
                      }}
                    >
                      <RefreshCw size={14} /> Refresh
                    </button>
                  )}
                  <button className="primary-button" onClick={() => setConnectModalOpen(true)}>
                    <Server size={15} /> {server ? 'Adicionar Servidor' : 'Conectar Minha VM (SSH)'}
                  </button>
                  <button className="refresh-button" onClick={() => setCloudShellOpen(true)} style={{ borderColor: ociCreds ? '#20d6c7' : '#182326' }}>
                    <Zap size={14} style={{ color: ociCreds ? '#20d6c7' : '#6f8387' }} /> {ociCreds ? `OCI Conectado (${ociCreds.region || 'sa-saopaulo-1'})` : 'Conectar OCI (Terraform)'}
                  </button>
                </div>
              </div>

              {/* Barra de contexto do servidor */}
              {server ? (
                <div className="server-switcher">
                  <div className="server-context">
                    <span className={`provider-mark ${server.color || 'oracle'}`}>{server.provider === 'aws' ? 'aws' : 'OC'}</span>
                    <div>
                      <small>Servidor Ativo em Execução</small>
                      <strong>{server.name}</strong>
                    </div>
                  </div>
                  <div className="server-meta">
                    <span><Globe2 size={13} /> {server.region || 'sa-saopaulo-1'}</span>
                    <span className="server-ip">{server.ip}</span>
                    <span className="healthy-label"><span className="status-dot emerald" /> {server.status}</span>
                  </div>
                  {serverList.length > 1 && (
                    <button className="server-select" onClick={() => setServerMenu(!serverMenu)} aria-label="Trocar servidor">
                      <span>Trocar VM ({serverList.length})</span><ChevronDown size={15} />
                    </button>
                  )}
                  {serverMenu && (
                    <div className="server-menu">
                      {serverList.map(item => (
                        <button key={item.id} onClick={() => handleSwitchServer(item)}>
                          <span className="provider-mark small oracle">OC</span>
                          <span><b>{item.name}</b><small>{item.region} · {item.ip}</small></span>
                          {item.id === server.id && <Check size={15} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="step-box" style={{ padding: '24px', textAlign: 'center', borderColor: '#20d6c744', marginBottom: '20px' }}>
                  <Server size={32} style={{ color: '#20d6c7', margin: '0 auto 10px' }} />
                  <h3 style={{ color: '#d9e2e1', margin: '0 0 6px', fontSize: '15px' }}>Nenhum servidor conectado</h3>
                  <p style={{ color: '#6f8387', fontSize: '11px', margin: '0 0 16px' }}>Conecte sua VM da Oracle Cloud inserindo o IP e a sua chave privada SSH para liberar métricas ao vivo, Docker e Nginx.</p>
                  <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                    <Plus size={14} /> Conectar Minha Primeira VM
                  </button>
                </div>
              )}

              {/* Métricas ao vivo */}
              {server && (
                <div className="metrics-grid">
                  <Metric label="CPU usage" value={String(server.cpu || '0').replace('%', '')} unit="%" change="Normal" icon={Activity} tone="indigo" progress={Number.parseInt(String(server.cpu || '0').replace('%', '')) || 0} />
                  <Metric 
                    label="Memory (RAM)" 
                    value={server.ramUsed || '420'} 
                    unit={`MB / ${server.ramTotal || '956'} MB`} 
                    change={`${String(server.ram || '44').replace('%', '')}%`} 
                    icon={Server} 
                    tone="violet" 
                    progress={Number.parseInt(String(server.ram || '44').replace('%', '')) || 0} 
                    badge={`Cache: ${server.cachePct || '24'}% (${server.cacheUsed || '226'} MB)`}
                    actionButton={
                      <button
                        type="button"
                        title="Limpa buffers e caches inativos da memória do Linux (drop_caches) sem parar nenhum serviço"
                        onClick={handleDropCaches}
                        disabled={isDroppingCache}
                        style={{
                          background: isDroppingCache ? 'rgba(32, 214, 199, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                          border: '1px solid rgba(168, 85, 247, 0.35)',
                          color: '#c084fc',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: isDroppingCache ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Zap size={11} className={isDroppingCache ? 'animate-pulse' : ''} />
                        {isDroppingCache ? 'Liberando...' : 'Liberar Cache'}
                      </button>
                    }
                  />
                  <Metric label="Disk NVMe" value={server.diskUsed || '0'} unit={`GB / ${server.diskTotal || '45'} GB`} change={`${String(server.disk || '0').replace('%', '')}%`} icon={HardDrive} tone="amber" progress={Number.parseInt(String(server.disk || '0').replace('%', '')) || 0} />
                  <Metric label="Status SSH" value="100" unit="% Ativo" change="Porta 22" icon={Network} tone="emerald" progress={100} />
                </div>
              )}
            </>
          )}

          {/* Abas e Componentes Modulares */}
          {server && active === 'Dashboard' && (
            <>
              <DashboardView
                server={server}
                serverList={serverList}
                containers={containers}
                setServer={handleSwitchServer}
                setActive={setActive}
                doAction={doAction}
              />
              <TerminalView 
                server={server}
                isFullTab={false}
                doAction={doAction}
                setConnectModalOpen={setConnectModalOpen}
              />
            </>
          )}

          {active === 'Odisseu AI' && (
            <OdisseuChatView server={server} doAction={doAction} />
          )}

          {active === 'VM Scraper' && (
            <VmScraper
              scraperData={scraperData}
              scraperLoading={scraperLoading}
              doAction={doAction}
              setScraperLoading={setScraperLoading}
              server={server}
            />
          )}

          {active === 'Deploy' && (
            <DeployView server={server} doAction={doAction} />
          )}

          {active === 'Monitoramento & Logs' && (
            <LogsTelemetryView doAction={doAction} />
          )}

          {active === 'Vercel Frontend' && (
            <VercelDeploymentsView doAction={doAction} />
          )}

          {active === 'Render Backend' && (
            <RenderDeploymentsView doAction={doAction} />
          )}

          {active === 'Migração Multi-Cloud' && (
            <MigrationWorkspaceView server={server} doAction={doAction} />
          )}

          {active === 'Variáveis (.env)' && (
            <EnvManagerView server={server} doAction={doAction} />
          )}

          {(active === 'Usuários & Aprovações' || active === 'Aprovações & Usuários') && (
            <UserManagementView doAction={doAction} />
          )}

          {active === 'Configurações' && (
            <SettingsView 
              currentUser={currentUser} 
              setCurrentUser={setCurrentUser}
              doAction={doAction} 
            />
          )}

          {active === 'Ajuda & Guia' && (
            <HelpView onNavigate={(tab: string) => setActive(tab)} />
          )}

          {active === 'Docker' && (
            <DockerView
              server={server}
              containers={containers}
              fetchLiveContainers={fetchLiveContainers}
              handleDockerAction={handleDockerAction}
              doAction={doAction}
              setConnectModalOpen={setConnectModalOpen}
            />
          )}

          {active === 'Nginx' && (
            <NginxView
              server={server}
              proxyHosts={proxyHosts}
              setProxyHosts={setProxyHosts}
              doAction={doAction}
              setConnectModalOpen={setConnectModalOpen}
            />
          )}

          {active === 'Tunnels' && (
            server ? (
              <CloudflareTunnelView server={server} doAction={doAction} />
            ) : (
              <div>
                <div className="section-heading">
                  <div>
                    <h2>Cloudflare Zero Trust Tunnels</h2>
                    <p>Rotas seguras de borda sem portas abertas na VM.</p>
                  </div>
                </div>
                <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
                    <Shield size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
                  <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
                    Conecte sua VM da Oracle Cloud para gerenciar seus túneis ativos e apontamentos DNS com segurança militar.
                  </p>
                  <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                    <Server size={15} /> Conectar Minha VM (SSH)
                  </button>
                </div>
              </div>
            )
          )}

          {active === 'Storage' && (
            server ? (
              <StorageExplorerView server={server} doAction={doAction} />
            ) : (
              <div>
                <div className="section-heading">
                  <div>
                    <h2>Armazenamento de Objetos (Buckets OCI)</h2>
                    <p>Nuvem de dados, backups e arquivos públicos de mídia.</p>
                  </div>
                </div>
                <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
                    <HardDrive size={28} />
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
                  <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
                    Conecte sua conta para explorar buckets, fazer upload de imagens e gerenciar backups criptografados.
                  </p>
                  <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                    <Server size={15} /> Conectar Minha VM (SSH)
                  </button>
                </div>
              </div>
            )
          )}

          {active === 'Terminal' && (
            <TerminalView
              server={server}
              isFullTab={true}
              doAction={doAction}
              setConnectModalOpen={setConnectModalOpen}
            />
          )}

          {active === 'Dashboard' && (
            <div className="bottom-strip">
              <div><Check size={16} /><span>{server ? 'Servidor conectado e túnel seguro ativo' : 'Aguardando conexão com servidor'}</span></div>
              <span>{server ? 'Verificado há 12 segundos' : 'Status: Offline'}</span>
              <div className="secure">
                <Server size={14} /> {serverList.length} servidor(es) conectado(s) 
                {server && <button title="Reiniciar agentes de coleta de métricas" onClick={() => doAction('Agentes de telemetria reiniciados com sucesso')}><RotateCcw size={13} /> Reiniciar agentes</button>}
              </div>
            </div>
          )}

          {action && <div className="toast"><Check size={15} /> {action}</div>}

          {/* Modais Globais */}
          <CloudShellModal
            isOpen={cloudShellOpen}
            onClose={() => setCloudShellOpen(false)}
            server={server}
            ociCreds={ociCreds}
            setOciCreds={setOciCreds}
            setBuckets={setBuckets}
            doAction={doAction}
          />

          <ConnectModal
            isOpen={connectModalOpen}
            onClose={() => setConnectModalOpen(false)}
            serverList={serverList}
            setServerList={setServerList}
            setServer={setServer}
            setContainers={setContainers}
            setProxyHosts={setProxyHosts}
            doAction={doAction}
          />

          <CloudflareModal
            isOpen={cloudflareModalOpen}
            onClose={() => setCloudflareModalOpen(false)}
            server={server}
            doAction={doAction}
          />
        </div>
      </section>
    </main>
  )
}
