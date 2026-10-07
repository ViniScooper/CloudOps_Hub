'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Terminal, 
  RefreshCw, 
  Search, 
  Copy, 
  ArrowDown, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Layers, 
  Filter,
  Check,
  ShieldAlert,
  ShieldX,
  Bug
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface ContainerInfo {
  name: string
  status?: string
  image?: string
}

const DEFAULT_CONTAINERS: ContainerInfo[] = [
  { name: 'financeiro_backend', status: 'running' },
  { name: 'boteco_backend', status: 'running' },
  { name: 'boteco_db', status: 'running' },
  { name: 'nginx-manager-nginx-1', status: 'running' },
  { name: 'boteco_tunnel', status: 'running' },
  { name: 'financeiro_tunnel', status: 'running' }
]

export function LiveContainerLogs({ server, doAction }: { server?: any; doAction?: (msg: string) => void }) {
  const isMicro = server?.id === 'oracle-micro-02' || server?.ip === '137.131.187.54' || server?.name === 'cloudops-micro-02'
  const initialList = isMicro
    ? [{ name: 'nginx-proxy', status: 'running' }]
    : DEFAULT_CONTAINERS

  const [containers, setContainers] = useState<ContainerInfo[]>(initialList)
  const [selectedContainer, setSelectedContainer] = useState<string>(isMicro ? 'nginx-proxy' : 'financeiro_backend')
  const [tailLines, setTailLines] = useState<number>(100)
  const [rawLogs, setRawLogs] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const terminalRef = useRef<HTMLDivElement>(null)

  // Buscar lista de containers da VM selecionada
  const fetchContainers = async () => {
    try {
      const ipParam = server?.ip ? `?ip=${encodeURIComponent(server.ip)}` : ''
      const res = await fetch(getApiUrl(`/api/docker/containers${ipParam}`))
      if (res.ok) {
        const data = await res.json()
        if (data.containers && Array.isArray(data.containers) && data.containers.length > 0) {
          const mapped = data.containers.map((c: any) => ({
            name: c.name || c.Names || '',
            status: c.status || c.Status || 'running',
            image: c.image || c.Image || ''
          })).filter((c: ContainerInfo) => !!c.name)
          if (mapped.length > 0) {
            setContainers(mapped)
            if (!mapped.some((c: any) => c.name === selectedContainer)) {
              setSelectedContainer(mapped[0].name)
            }
          }
        }
      }
    } catch {
      // Manter lista padrão
    }
  }

  // Buscar logs do container selecionado na VM correta
  const fetchLogs = async (silent = false) => {
    if (!selectedContainer) return
    if (!silent) setLoading(true)
    try {
      const ipParam = server?.ip ? `&ip=${encodeURIComponent(server.ip)}` : ''
      const res = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(selectedContainer)}?tail=${tailLines}${ipParam}`))
      const data = await res.json()
      if (data.success && typeof data.logs === 'string') {
        setRawLogs(data.logs)
      } else if (data.error) {
        setRawLogs(`[ERRO AO BUSCAR LOGS]: ${data.error}`)
      }
    } catch (err: any) {
      setRawLogs(`[FALHA DE REDE]: ${err.message}`)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchContainers()
  }, [server?.id, server?.ip])

  useEffect(() => {
    fetchLogs()
  }, [selectedContainer, tailLines, server?.id, server?.ip])

  // Timer para Auto-Refresh
  useEffect(() => {
    let timer: any = null
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchLogs(true)
      }, 5000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh, selectedContainer, tailLines])

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(rawLogs)
    setCopied(true)
    if (doAction) doAction(`Logs de ${selectedContainer} copiados para a área de transferência!`)
    setTimeout(() => setCopied(false), 2000)
  }

  // Filtrar linhas se houver termo de busca
  const lines = rawLogs ? rawLogs.split('\n') : []
  const filteredLines = searchTerm.trim()
    ? lines.filter(line => line.toLowerCase().includes(searchTerm.toLowerCase()))
    : lines

  // Análise em tempo real de incidentes e varreduras/ataques nos logs carregados
  const attackIncidents = React.useMemo(() => {
    const list: Array<{ ip: string; path: string; reason: string; raw: string }> = []
    const seenIps = new Set<string>()

    for (const line of lines) {
      if (!line.trim()) continue
      const lower = line.toLowerCase()

      // Padrão 1: Nginx error log (connect refused upstream com client IP e request)
      const errMatch = line.match(/\[error\].*client:\s*([0-9.]+).*request:\s*"([^"]+)"/i)
      if (errMatch) {
        const ip = errMatch[1]
        const req = errMatch[2]
        seenIps.add(ip)
        list.push({
          ip,
          path: req,
          reason: line.includes('Connection refused') ? 'Upstream Recusado / Port Scan' : 'Erro Nginx Upstream',
          raw: line
        })
        continue
      }

      // Padrão 2: Nginx access log com status suspeito (404/400/403 de bots vasculhando rotas)
      const accMatch = line.match(/^([0-9.]+)\s+-\s+-\s+\[[^\]]+\]\s+"([^"]+)"\s+(404|400|403|405)\s+/i)
      if (accMatch) {
        const ip = accMatch[1]
        const req = accMatch[2]
        if (req.includes('.env') || req.includes('.git') || req.includes('SDK') || req.includes('login') || req.includes('\\x') || req.includes('php') || req.includes('wp-')) {
          seenIps.add(ip)
          list.push({
            ip,
            path: req,
            reason: 'Varredura de Vulnerabilidade (Scan Bot)',
            raw: line
          })
        }
      }
    }

    return {
      count: list.length,
      uniqueIps: Array.from(seenIps),
      incidents: list
    }
  }, [lines])

  // Formatação de cor por linha
  const renderLine = (line: string, idx: number) => {
    const lower = line.toLowerCase()
    let color = '#d1d5db' // cinza claro padrão
    let bg = 'transparent'

    if (lower.includes('error') || lower.includes('fatal') || lower.includes('exception') || lower.includes('fail') || lower.includes(' 500 ') || lower.includes('502 bad gateway') || lower.includes('504')) {
      color = '#f87171' // vermelho
      bg = 'rgba(239, 68, 68, 0.08)'
    } else if (lower.includes('warn') || lower.includes('warning') || lower.includes(' 404 ') || lower.includes(' 401 ') || lower.includes(' 403 ')) {
      color = '#fbbf24' // amarelo
      bg = 'rgba(245, 158, 11, 0.05)'
    } else if (lower.includes('info') || lower.includes('ready') || lower.includes('listening') || lower.includes('connected') || lower.includes('200 ok') || lower.includes(' 200 ')) {
      color = '#34d399' // verde / ciano
    }

    return (
      <div 
        key={idx} 
        style={{ 
          color, 
          backgroundColor: bg,
          padding: '2px 8px', 
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '12px',
          lineHeight: '1.5',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          borderLeft: bg !== 'transparent' ? `2px solid ${color}` : '2px solid transparent'
        }}
      >
        <span style={{ color: '#4b5563', marginRight: '10px', userSelect: 'none', fontSize: '11px' }}>
          {String(idx + 1).padStart(3, ' ')}
        </span>
        {line}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Barra de Seleção de Container & Controles */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px',
        background: 'rgba(19, 28, 31, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '12px 16px'
      }}>
        {/* Seletor do Container */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#20d6c7', fontSize: '13px', fontWeight: 600 }}>
            <Layers size={16} /> Container:
          </div>
          <select
            value={selectedContainer}
            onChange={(e) => setSelectedContainer(e.target.value)}
            style={{
              background: '#070c0e',
              color: '#f0fdfa',
              border: '1px solid rgba(32, 214, 199, 0.3)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {containers.map(c => (
              <option key={c.name} value={c.name}>
                🐳 {c.name} {c.status ? `(${c.status})` : ''}
              </option>
            ))}
          </select>

          {/* Atalhos Rápidos dos Containers Reais desta VM */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {containers.slice(0, 5).map(c => (
              <button
                key={c.name}
                onClick={() => setSelectedContainer(c.name)}
                style={{
                  background: selectedContainer === c.name ? 'rgba(32, 214, 199, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedContainer === c.name ? '#20d6c7' : '#9ca3af',
                  border: selectedContainer === c.name ? '1px solid rgba(32, 214, 199, 0.4)' : '1px solid transparent',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {c.name.replace('_backend', '').replace('nginx-manager-', '').replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Quantidade de Linhas + Auto-Refresh + Recarregar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#829396', fontSize: '12px' }}>
            Linhas:
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              style={{
                background: '#070c0e',
                color: '#d1d5db',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? 'rgba(32, 214, 199, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: autoRefresh ? '#20d6c7' : '#9ca3af',
              border: autoRefresh ? '1px solid #20d6c7' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title={autoRefresh ? 'Desativar atualização contínua' : 'Atualizar logs a cada 5 segundos'}
          >
            <RefreshCw size={12} className={autoRefresh || loading ? 'animate-spin' : ''} />
            {autoRefresh ? 'Auto 5s Ativo' : 'Auto 5s'}
          </button>

          <button
            onClick={() => fetchLogs()}
            disabled={loading}
            style={{
              background: '#20d6c7',
              color: '#070c0e',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Lendo...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Banner de Ataques / Scans Detectados nos Logs do Container */}
      {attackIncidents.count > 0 && (
        <div style={{
          background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: '9px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fecaca' }}>
                  🚨 {attackIncidents.count} Tentativa(s) de Varredura / Ataque detectadas
                </span>
                <span style={{
                  fontSize: '10.5px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  color: '#f87171',
                  padding: '1px 7px',
                  borderRadius: '10px',
                  fontWeight: 600
                }}>
                  {attackIncidents.uniqueIps.length} IP(s) Invasor(es)
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                IPs ativos detectados neste container: {attackIncidents.uniqueIps.slice(0, 4).map(ip => (
                  <button
                    key={ip}
                    onClick={() => setSearchTerm(ip)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fca5a5',
                      borderRadius: '4px',
                      padding: '1px 6px',
                      fontSize: '10.5px',
                      marginRight: '5px',
                      cursor: 'pointer'
                    }}
                    title={`Filtrar apenas requisições do IP ${ip}`}
                  >
                    {ip}
                  </button>
                ))}
                {attackIncidents.uniqueIps.length > 4 && <span>+{attackIncidents.uniqueIps.length - 4} outros</span>}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setSearchTerm(searchTerm === 'error' ? '' : 'error')}
              style={{
                background: searchTerm === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#fca5a5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Bug size={12} /> {searchTerm === 'error' ? 'Ver Todos os Logs' : 'Filtrar Ataques & Erros'}
            </button>
          </div>
        </div>
      )}

      {/* Barra de Filtro de Texto / Busca nos Logs */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          background: 'rgba(7, 14, 17, 0.8)', 
          border: '1px solid rgba(255, 255, 255, 0.1)', 
          borderRadius: '7px', 
          padding: '6px 12px' 
        }}>
          <Search size={14} style={{ color: '#829396' }} />
          <input
            type="text"
            placeholder="Filtrar logs por palavra-chave (ex: error, 500, timeout, exception, GET)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#f0fdfa',
              fontSize: '12px',
              width: '100%',
              outline: 'none'
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                fontSize: '11px'
              }}
            >
              ✕ Limpar
            </button>
          )}
        </div>

        {/* Botão de Copiar */}
        <button
          onClick={handleCopy}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: copied ? '#20d6c7' : '#d1d5db',
            padding: '7px 12px',
            borderRadius: '7px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Copiar todo o output para a área de transferência"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>

        {/* Botão Rolar para o Fim */}
        <button
          onClick={scrollToBottom}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#d1d5db',
            padding: '7px 12px',
            borderRadius: '7px',
            fontSize: '11px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title="Rolar terminal para a última linha"
        >
          <ArrowDown size={13} />
          Fim
        </button>
      </div>

      {/* Terminal View */}
      <div 
        ref={terminalRef}
        style={{
          background: '#04080a',
          border: '1px solid rgba(32, 214, 199, 0.2)',
          borderRadius: '10px',
          padding: '12px 6px',
          minHeight: '380px',
          maxHeight: '520px',
          overflowY: 'auto',
          overflowX: 'auto',
          boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.8)'
        }}
      >
        {filteredLines.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#6b7280', fontSize: '12px' }}>
            {loading ? 'Carregando stream de logs do Docker...' : searchTerm ? `Nenhuma ocorrência encontrada para "${searchTerm}".` : 'Nenhum log retornado para este container.'}
          </div>
        ) : (
          filteredLines.map((line, idx) => renderLine(line, idx))
        )}
      </div>

      {/* Rodapé informativo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#6b7280', padding: '0 4px' }}>
        <div>
          Mostrando <strong>{filteredLines.length}</strong> de <strong>{lines.length}</strong> linhas {searchTerm ? `(filtrado por "${searchTerm}")` : ''}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
          Stream Docker via SSH seguro (Sem overhead de daemon)
        </div>
      </div>
    </div>
  )
}
