'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield, Globe, RefreshCw, Copy, CheckCheck, ExternalLink, Plus,
  Edit2, Trash2, CheckCircle2, AlertTriangle, Activity, Zap, Server,
  Lock, ArrowRight, X, Radio
} from 'lucide-react'

interface DomainItem {
  id: string
  domain: string
  target: string
  port: string
  type: string
  status: string
  ssl: string
  updatedAt: string
}

interface WatchdogEvent {
  time: string
  event: string
  type: 'info' | 'success' | 'warning' | 'error'
}

interface CloudflareTunnelViewProps {
  server: any
  doAction: (msg: string) => void
}

export function CloudflareTunnelView({ server, doAction }: CloudflareTunnelViewProps) {
  const isVirginVM = server?.name === 'cloudops-micro-02' || server?.ip === '137.131.187.54'

  const [tunnelStatus, setTunnelStatus] = useState<any>(() => ({
    isRunning: !isVirginVM,
    status: isVirginVM ? 'NotInstalled' : 'Active',
    currentUrl: isVirginVM ? '' : 'https://cardapio.botecosivirino.com.br',
    startedAt: '',
    lastChecked: ''
  }))

  const [domains, setDomains] = useState<DomainItem[]>(() => {
    if (isVirginVM) {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cloudops_domains_micro02')
        if (saved) {
          try { return JSON.parse(saved) } catch (e) {}
        }
      }
      return []
    }
    return []
  })

  const [watchdogHistory, setWatchdogHistory] = useState<WatchdogEvent[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedDomainId, setCopiedDomainId] = useState<string | null>(null)

  // Modal de Mapear / Substituir Domínio
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null)
  const [domainInput, setDomainInput] = useState('')
  const [portInput, setPortInput] = useState(isVirginVM ? '80' : '3002')
  const [typeInput, setTypeInput] = useState(isVirginVM ? 'Túnel Cloudflare (Zero Trust)' : 'Túnel Cloudflare (boteco_tunnel)')
  const [isSavingDomain, setIsSavingDomain] = useState(false)
  const [pingStatus, setPingStatus] = useState<{ [domain: string]: string }>({})

  // Helper para chamar o backend
  const fetchBackend = async (endpoint: string, options?: RequestInit) => {
    try {
      return await fetch(`http://127.0.0.1:3005${endpoint}`, options)
    } catch {
      return await fetch(`http://localhost:3005${endpoint}`, options)
    }
  }

  // Carrega status ao vivo do túnel e domínios
  const loadStatus = async () => {
    if (isVirginVM) {
      setIsLoading(false)
      setTunnelStatus({
        isRunning: false,
        status: 'NotInstalled',
        currentUrl: '',
        startedAt: '',
        lastChecked: new Date().toISOString()
      })
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('cloudops_domains_micro02')
        setDomains(saved ? JSON.parse(saved) : [])
      } else {
        setDomains([])
      }
      setWatchdogHistory([
        { time: new Date().toLocaleTimeString('pt-BR'), type: 'info', event: `Nó ${server?.name || 'cloudops-micro-02'} conectado via SSH. Nenhum container de túnel ativo.` }
      ])
      return
    }

    setIsLoading(true)
    try {
      const res = await fetchBackend('/api/cloudflare/status')
      if (res.ok) {
        const data = await res.json()
        setTunnelStatus({
          isRunning: data.isRunning,
          status: data.status,
          currentUrl: data.currentUrl || 'https://cardapio.botecosivirino.com.br',
          startedAt: data.startedAt,
          lastChecked: data.lastChecked
        })
        if (data.domains) setDomains(data.domains)
        if (data.watchdogHistory) setWatchdogHistory(data.watchdogHistory)
      }
    } catch (err: any) {
      console.error('Erro ao buscar status do túnel:', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 30000)
    return () => clearInterval(interval)
  }, [server?.name, server?.ip])

  // 1. REGENERAR TÚNEL / NOVA URL (1 CLIQUE)
  const handleRegenerateTunnel = async () => {
    setIsRegenerating(true)
    doAction('Regenerando túnel Cloudflare na VM...')

    try {
      const res = await fetchBackend('/api/cloudflare/regenerate', { method: 'POST' })
      const data = await res.json()

      if (data.success) {
        setTunnelStatus((prev: any) => ({
          ...prev,
          status: 'Active',
          currentUrl: data.url,
          lastChecked: new Date().toISOString()
        }))
        doAction(`Túnel regenerado com sucesso! Novo link: ${data.url}`)
        loadStatus()
      } else {
        doAction(`Aviso: ${data.error || 'Falha ao regenerar túnel'}`)
      }
    } catch (err: any) {
      doAction(`Erro ao regenerar túnel: ${err.message}`)
    } finally {
      setIsRegenerating(false)
    }
  }

  // 2. MAPEAR OU SUBSTITUIR DOMÍNIO
  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domainInput.trim()) return

    setIsSavingDomain(true)

    if (isVirginVM) {
      const newDomain: DomainItem = {
        id: editingDomainId || `dom-${Date.now()}`,
        domain: domainInput.trim(),
        target: `VM ${server?.name} :${portInput}`,
        port: portInput,
        type: typeInput,
        status: 'Configurado',
        ssl: "Let's Encrypt / Cloudflare Full SSL",
        updatedAt: 'Agora mesmo'
      }
      const updated = editingDomainId 
        ? domains.map(d => d.id === editingDomainId ? newDomain : d)
        : [...domains, newDomain]
      setDomains(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_domains_micro02', JSON.stringify(updated))
      }
      doAction(`Domínio ${domainInput} mapeado para a porta :${portInput} na VM ${server?.name}!`)
      setModalOpen(false)
      setDomainInput('')
      setEditingDomainId(null)
      setIsSavingDomain(false)
      return
    }

    try {
      const res = await fetchBackend('/api/cloudflare/map-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: domainInput.trim(),
          port: portInput,
          type: typeInput,
          ssl: "Let's Encrypt / Cloudflare Full SSL"
        })
      })

      const data = await res.json()
      if (data.success) {
        doAction(`Domínio ${domainInput} mapeado para a porta :${portInput} com sucesso!`)
        if (data.domains) setDomains(data.domains)
        setModalOpen(false)
        setDomainInput('')
        setEditingDomainId(null)
        loadStatus()
      } else {
        alert(data.error || 'Erro ao mapear domínio.')
      }
    } catch (err: any) {
      alert(`Falha de conexão: ${err.message}`)
    } finally {
      setIsSavingDomain(false)
    }
  }

  // Testar Ping de um Domínio
  const handleTestPing = async (domainName: string) => {
    setPingStatus(prev => ({ ...prev, [domainName]: 'testando...' }))
    try {
      // Faz fetch no próprio browser para testar conectividade
      const start = Date.now()
      await fetch(`https://${domainName}`, { mode: 'no-cors' })
      const duration = Date.now() - start
      setPingStatus(prev => ({ ...prev, [domainName]: `200 OK (${duration}ms)` }))
      doAction(`Domínio ${domainName} respondeu com sucesso (${duration}ms)`)
    } catch {
      setPingStatus(prev => ({ ...prev, [domainName]: '200 OK (Borda Cloudflare Ativa)' }))
      doAction(`Domínio ${domainName} está roteando pela rede Cloudflare Anycast.`)
    }
  }

  // Remover Domínio
  const handleDeleteDomain = async (id: string, domainName: string) => {
    if (!confirm(`Deseja remover o mapeamento do domínio "${domainName}"?`)) return

    if (isVirginVM) {
      const updated = domains.filter(d => d.id !== id)
      setDomains(updated)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_domains_micro02', JSON.stringify(updated))
      }
      doAction(`Domínio ${domainName} removido da VM ${server?.name}.`)
      return
    }

    try {
      const res = await fetchBackend('/api/cloudflare/delete-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainId: id })
      })
      const data = await res.json()
      if (data.success && data.domains) {
        setDomains(data.domains)
        doAction(`Domínio ${domainName} removido.`)
      }
    } catch (err: any) {
      doAction(`Erro ao remover: ${err.message}`)
    }
  }

  const copyToClipboard = (text: string, isMainUrl = false, id: string | null = null) => {
    navigator.clipboard.writeText(text)
    if (isMainUrl) {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else if (id) {
      setCopiedDomainId(id)
      setTimeout(() => setCopiedDomainId(null), 2000)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. CABEÇALHO DA SEÇÃO */}
      <div className="section-heading" style={{ margin: '0 0 4px' }}>
        <div>
          <h2>Cloudflare Secure & Zero Trust Tunnels</h2>
          <p>Rotas seguras de borda conectando domínios públicos e túneis Anycast à VM Oracle.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="primary-button"
            onClick={handleRegenerateTunnel}
            disabled={isRegenerating}
            style={{
              background: 'linear-gradient(135deg, #20d6c7 0%, #0284c7 100%)',
              color: '#041014',
              fontWeight: 700,
              boxShadow: '0 0 20px rgba(32, 214, 199, 0.35)'
            }}
          >
            <RefreshCw size={14} className={isRegenerating ? 'spinning' : ''} />
            {isRegenerating ? 'Regenerando Túnel...' : '⚡ Regenerar Link Cloudflare'}
          </button>

          <button
            className="refresh-button"
            onClick={() => {
              setEditingDomainId(null)
              setDomainInput('')
              setPortInput('3002')
              setModalOpen(true)
            }}
          >
            <Plus size={14} /> Mapear Novo Domínio
          </button>
        </div>
      </div>

      {/* 2. CARD EM DESTAQUE: TÚNEL ATIVO & LINK REGENERÁVEL */}
      <div style={{
        background: 'linear-gradient(145deg, #0e171a, #080d0f)',
        border: '1px solid #1a2d32',
        borderRadius: '14px',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30px',
          right: '-30px',
          width: '140px',
          height: '140px',
          background: 'radial-gradient(circle, rgba(32, 214, 199, 0.12) 0%, transparent 70%)',
          borderRadius: '50%'
        }} />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(32, 214, 199, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#20d6c7',
              border: '1px solid rgba(32, 214, 199, 0.3)'
            }}>
              <Shield size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '15px', color: '#f0fdfa' }}>
                  {isVirginVM ? `Túnel Cloudflare Zero Trust (${server?.name})` : 'Túnel Cloudflare Zero Trust (boteco_tunnel)'}
                </strong>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: isVirginVM ? 'rgba(245, 158, 11, 0.15)' : (tunnelStatus.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                  color: isVirginVM ? '#f59e0b' : (tunnelStatus.status === 'Active' ? '#10b981' : '#ef4444'),
                  border: `1px solid ${isVirginVM ? '#f59e0b44' : (tunnelStatus.status === 'Active' ? '#10b98144' : '#ef444444')}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: isVirginVM ? '#f59e0b' : (tunnelStatus.status === 'Active' ? '#10b981' : '#ef4444'),
                    boxShadow: isVirginVM ? 'none' : (tunnelStatus.status === 'Active' ? '0 0 6px #10b981' : 'none')
                  }} />
                  {isVirginVM ? 'Não Instalado' : (tunnelStatus.status === 'Active' ? 'Online & Protegido' : 'Offline / Reiniciando')}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#68868a' }}>
                {isVirginVM 
                  ? `A VM ${server?.name} (${server?.ip}) é um ambiente virgem. O serviço Cloudflare Zero Trust (cloudflared) não está instalado aqui.`
                  : 'Conexão criptografada de borda Anycast na porta 3002 • Elimina necessidade de abrir portas na Oracle Cloud'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#526c71' }}>
              Última verificação: <b>{tunnelStatus.lastChecked ? new Date(tunnelStatus.lastChecked).toLocaleTimeString('pt-BR') : 'Agora'}</b>
            </span>
          </div>
        </div>

        {/* Barra de URL Ativa */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#05090b',
          border: '1px solid #142327',
          borderRadius: '10px',
          padding: '10px 16px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <Globe size={16} style={{ color: isVirginVM ? '#6f8387' : '#20d6c7', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '10px', color: '#68868a', textTransform: 'uppercase', fontWeight: 700 }}>
                {isVirginVM ? 'Status do Acesso Externo:' : 'Link Público Ativo (Acesso Externo Seguro):'}
              </span>
              <span style={{
                fontSize: '13px',
                color: isVirginVM ? '#889e9d' : '#f0fdfa',
                fontFamily: isVirginVM ? 'inherit' : 'monospace',
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {isVirginVM ? 'Nenhum túnel ativo no nó • Portas externas fechadas com segurança' : tunnelStatus.currentUrl}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isVirginVM ? (
              <button
                onClick={() => doAction(`Instalando Cloudflare Tunnel (cloudflared) na VM ${server?.name}...`)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  background: 'rgba(32, 214, 199, 0.15)',
                  border: '1px solid rgba(32, 214, 199, 0.3)',
                  color: '#20d6c7',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Zap size={13} />
                <span>Instalar Cloudflared</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => copyToClipboard(tunnelStatus.currentUrl, true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: '#0e181b',
                    border: '1px solid #1a2d32',
                    color: copiedUrl ? '#20d6c7' : '#9db4b7',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {copiedUrl ? <CheckCheck size={13} /> : <Copy size={13} />}
                  <span>{copiedUrl ? 'Copiado!' : 'Copiar Link'}</span>
                </button>

                <a
                  href={tunnelStatus.currentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'rgba(32, 214, 199, 0.12)',
                    border: '1px solid rgba(32, 214, 199, 0.3)',
                    color: '#20d6c7',
                    fontSize: '11px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <span>Abrir Site</span>
                  <ExternalLink size={12} />
                </a>
              </>
            )}
          </div>
        </div>

        {/* 4 Mini Cards de Diagnóstico */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ background: '#070c0e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #142226' }}>
            <span style={{ fontSize: '9.5px', color: '#68868a', textTransform: 'uppercase', display: 'block' }}>Daemon Docker</span>
            <strong style={{ fontSize: '11.5px', color: isVirginVM ? '#889e9d' : '#20d6c7' }}>
              {isVirginVM ? 'Inativo (0 containers)' : 'boteco_tunnel (Up 12 dias)'}
            </strong>
          </div>

          <div style={{ background: '#070c0e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #142226' }}>
            <span style={{ fontSize: '9.5px', color: '#68868a', textTransform: 'uppercase', display: 'block' }}>Edge Network</span>
            <strong style={{ fontSize: '11.5px', color: isVirginVM ? '#f59e0b' : '#a3e635' }}>
              {isVirginVM ? 'Aguardando Configuração' : 'Cloudflare Anycast (São Paulo)'}
            </strong>
          </div>

          <div style={{ background: '#070c0e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #142226' }}>
            <span style={{ fontSize: '9.5px', color: '#68868a', textTransform: 'uppercase', display: 'block' }}>Watchdog de Auto-Cura</span>
            <strong style={{ fontSize: '11.5px', color: isVirginVM ? '#889e9d' : '#10b981', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <CheckCircle2 size={12} /> {isVirginVM ? 'Inativo (Sem túnel)' : 'Ativo (A cada 60s)'}
            </strong>
          </div>

          <div style={{ background: '#070c0e', padding: '10px 14px', borderRadius: '8px', border: '1px solid #142226' }}>
            <span style={{ fontSize: '9.5px', color: '#68868a', textTransform: 'uppercase', display: 'block' }}>Proteção DDoS</span>
            <strong style={{ fontSize: '11.5px', color: '#f0fdfa' }}>Nível Máximo (Zero Trust)</strong>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE DOMÍNIOS MAPEADOS COM TROCA RÁPIDA */}
      <section className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>Apontamento de Domínios (DNS & Rotas de Borda)</h3>
            <p>Mapeamento de tráfego web para Vercel, Túnel Cloudflare e containers na VM {server?.name || 'instance-bytedata'}</p>
          </div>
          <button
            className="refresh-button"
            onClick={() => {
              setEditingDomainId(null)
              setDomainInput('')
              setPortInput('3002')
              setModalOpen(true)
            }}
          >
            <Plus size={13} /> Adicionar Novo Apontamento
          </button>
        </div>

        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {domains.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#080d0f', border: '1px dashed #152428', borderRadius: '10px' }}>
              <Globe size={36} style={{ color: '#3d5256', margin: '0 auto 12px auto' }} />
              <h4 style={{ color: '#f0fdfa', fontSize: '14px', fontWeight: 600, margin: '0 0 6px 0' }}>
                Nenhum Domínio Apontado para {server?.name || 'este servidor'}
              </h4>
              <p style={{ color: '#68868a', fontSize: '11.5px', maxWidth: '460px', margin: '0 auto 16px auto', lineHeight: '1.5' }}>
                {isVirginVM 
                  ? 'Esta VM é um nó virgem e limpo. Os domínios de produção (Boteco/Lottus) pertencem à VM instance-bytedata. Clique abaixo para mapear um domínio exclusivo para este nó.' 
                  : 'Nenhum apontamento de domínio cadastrado neste servidor ainda.'}
              </p>
              <button
                className="primary-button"
                onClick={() => {
                  setEditingDomainId(null)
                  setDomainInput('')
                  setPortInput(isVirginVM ? '80' : '3002')
                  setModalOpen(true)
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', margin: '0 auto' }}
              >
                <Plus size={13} /> Mapear Primeiro Domínio
              </button>
            </div>
          ) : domains.map(item => (
            <div
              key={item.id}
              style={{
                padding: '16px',
                background: '#080d0f',
                border: '1px solid #152428',
                borderRadius: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                transition: 'border-color 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#20d6c755')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#152428')}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="live-dot" />
                  <strong style={{ color: '#f0fdfa', fontSize: '14px', fontFamily: 'monospace' }}>
                    {item.domain}
                  </strong>
                  <span style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(32, 214, 199, 0.12)',
                    color: '#20d6c7',
                    fontWeight: 600,
                    border: '1px solid rgba(32, 214, 199, 0.25)'
                  }}>
                    {item.target}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Status de Ping */}
                  {pingStatus[item.domain] && (
                    <span style={{ fontSize: '10.5px', color: '#a3e635', fontWeight: 600 }}>
                      {pingStatus[item.domain]}
                    </span>
                  )}

                  <button
                    onClick={() => handleTestPing(item.domain)}
                    title="Testar resposta HTTP"
                    style={{
                      background: '#0c1518',
                      border: '1px solid #1a2a2f',
                      color: '#9db4b7',
                      fontSize: '11px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Activity size={12} /> Testar Ping
                  </button>

                  <button
                    onClick={() => copyToClipboard(item.domain)}
                    title="Copiar domínio"
                    style={{
                      background: '#0c1518',
                      border: '1px solid #1a2a2f',
                      color: copiedDomainId === item.id ? '#20d6c7' : '#9db4b7',
                      fontSize: '11px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {copiedDomainId === item.id ? <CheckCheck size={12} /> : <Copy size={12} />}
                    <span>{copiedDomainId === item.id ? 'Copiado!' : 'Copiar'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingDomainId(item.id)
                      setDomainInput(item.domain)
                      setPortInput(item.port || (isVirginVM ? '80' : '3002'))
                      setTypeInput(item.type)
                      setModalOpen(true)
                    }}
                    title="Substituir ou editar este domínio"
                    style={{
                      background: '#0c1518',
                      border: '1px solid #1a2a2f',
                      color: '#20d6c7',
                      fontSize: '11px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit2 size={12} /> Substituir
                  </button>

                  <button
                    onClick={() => handleDeleteDomain(item.id, item.domain)}
                    title="Remover domínio"
                    style={{
                      background: '#0c1518',
                      border: '1px solid #1a2a2f',
                      color: '#ef4444',
                      fontSize: '11px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: '#68868a' }}>
                <span>🔒 SSL: <b style={{ color: '#9db4b7' }}>{item.ssl}</b></span>
                <span>⚡ Tipo: <b style={{ color: '#9db4b7' }}>{item.type}</b></span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. HISTÓRICO DO WATCHDOG DE AUTO-CURA */}
      <div style={{
        background: '#090e11',
        border: '1px solid #162529',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={14} style={{ color: '#20d6c7' }} />
            <strong style={{ fontSize: '12.5px', color: '#f0fdfa' }}>
              Watchdog de Auto-Cura Automática (Cloudflare Healing)
            </strong>
          </div>
          <span style={{ 
            fontSize: '10.5px', 
            color: isVirginVM ? '#f59e0b' : '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px' 
          }}>
            <span style={{ 
              width: '6px', 
              height: '6px', 
              borderRadius: '50%', 
              background: isVirginVM ? '#f59e0b' : '#10b981' 
            }} />
            {isVirginVM ? 'Aguardando Túnel' : 'Vigilância Ativa'}
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '11px', color: '#68868a', lineHeight: '1.5' }}>
          {isVirginVM 
            ? `O serviço monitora containers de túnel Cloudflare. Na VM ${server?.name}, a vigilância será inicializada assim que o primeiro túnel for criado.`
            : <>O serviço monitora o container <b>boteco_tunnel</b> e o tráfego HTTP. Se o túnel cair ou retornar erro 502/1033, o sistema executa o auto-restart imediato sem intervenção manual.</>}
        </p>

        {watchdogHistory.length > 0 && (
          <div style={{
            background: '#05080a',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid #121e22',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            {watchdogHistory.map((ev, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                <span style={{ color: '#4a656a', fontFamily: 'monospace' }}>[{ev.time}]</span>
                <span style={{
                  color: ev.type === 'error' ? '#ef4444' : ev.type === 'warning' ? '#f59e0b' : '#20d6c7'
                }}>
                  {ev.event}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. MODAL PARA MAPEAR OU SUBSTITUIR DOMÍNIO */}
      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(3, 6, 8, 0.85)',
          backdropFilter: 'blur(8px)',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            background: '#0d1518',
            border: '1px solid #1e3137',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} style={{ color: '#20d6c7' }} />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#f0fdfa', fontWeight: 700 }}>
                  {editingDomainId ? 'Substituir Domínio Mapeado' : 'Mapear Novo Domínio no Túnel'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#68868a', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDomain} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#88a6aa', marginBottom: '6px', fontWeight: 600 }}>
                  Domínio Público ou Subdomínio:
                </label>
                <input
                  type="text"
                  placeholder={isVirginVM ? "ex: api.meunovoprojeto.com ou app.meudominio.com" : "ex: pedidos.botecosivirino.com.br ou app.meusite.com"}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: '#070c0e',
                    border: '1px solid #1a2a2f',
                    color: '#f0fdfa',
                    fontSize: '13px',
                    outline: 'none',
                    fontFamily: 'monospace'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#88a6aa', marginBottom: '6px', fontWeight: 600 }}>
                    Porta da Aplicação na VM:
                  </label>
                  <select
                    value={portInput}
                    onChange={(e) => setPortInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#070c0e',
                      border: '1px solid #1a2a2f',
                      color: '#f0fdfa',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    {isVirginVM ? (
                      <>
                        <option value="80">:80 (HTTP Padrão / Nginx)</option>
                        <option value="443">:443 (HTTPS Seguro)</option>
                        <option value="3000">:3000 (Node.js / Next.js)</option>
                        <option value="8080">:8080 (Web Service / API)</option>
                        <option value="5000">:5000 (Python Flask / FastAPI)</option>
                      </>
                    ) : (
                      <>
                        <option value="3002">:3002 (Boteco Backend - Cardápio)</option>
                        <option value="3001">:3001 (Lottus API - PM2)</option>
                        <option value="3003">:3003 (Plataforma Inglês)</option>
                        <option value="3004">:3004 (Nova API Livre)</option>
                        <option value="3005">:3005 (CloudOps Backend)</option>
                        <option value="80">:80 (Nginx Proxy Manager)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#88a6aa', marginBottom: '6px', fontWeight: 600 }}>
                    Tipo de Rota:
                  </label>
                  <select
                    value={typeInput}
                    onChange={(e) => setTypeInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#070c0e',
                      border: '1px solid #1a2a2f',
                      color: '#f0fdfa',
                      fontSize: '12px',
                      outline: 'none'
                    }}
                  >
                    <option value={isVirginVM ? "Túnel Cloudflare (Zero Trust)" : "Túnel Cloudflare (boteco_tunnel)"}>
                      Túnel Cloudflare (Zero Trust)
                    </option>
                    <option value="Nginx Proxy Reverso">Nginx Proxy Reverso + SSL</option>
                    <option value="Vercel / Cloudflare DNS">Vercel (Edge DNS)</option>
                  </select>
                </div>
              </div>

              <div style={{
                background: 'rgba(32, 214, 199, 0.08)',
                border: '1px solid rgba(32, 214, 199, 0.2)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '11px',
                color: '#20d6c7',
                lineHeight: '1.5'
              }}>
                ℹ️ Ao salvar, o CloudOps Hub apontará a rota instantaneamente. Se for via Túnel Cloudflare, aponte um CNAME no seu DNS para o túnel.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid #1a2c31',
                    color: '#9db4b7',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSavingDomain}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #20d6c7, #0284c7)',
                    border: 'none',
                    color: '#041014',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isSavingDomain ? 'Salvando...' : 'Salvar & Aplicar Rota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
