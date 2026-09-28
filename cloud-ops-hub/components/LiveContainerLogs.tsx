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
  Check
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

export function LiveContainerLogs({ doAction }: { doAction?: (msg: string) => void }) {
  const [containers, setContainers] = useState<ContainerInfo[]>(DEFAULT_CONTAINERS)
  const [selectedContainer, setSelectedContainer] = useState<string>('financeiro_backend')
  const [tailLines, setTailLines] = useState<number>(100)
  const [rawLogs, setRawLogs] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)

  const terminalRef = useRef<HTMLDivElement>(null)

  // Buscar lista de containers da VM
  const fetchContainers = async () => {
    try {
      const res = await fetch(getApiUrl('/api/docker/containers'))
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
          }
        }
      }
    } catch {
      // Manter lista padrão
    }
  }

  // Buscar logs do container selecionado
  const fetchLogs = async (silent = false) => {
    if (!selectedContainer) return
    if (!silent) setLoading(true)
    try {
      const res = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(selectedContainer)}?tail=${tailLines}`))
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
  }, [])

  useEffect(() => {
    fetchLogs()
  }, [selectedContainer, tailLines])

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

          {/* Atalhos Rápidos dos Principais Containers */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['financeiro_backend', 'boteco_backend', 'boteco_db'].map(name => (
              <button
                key={name}
                onClick={() => setSelectedContainer(name)}
                style={{
                  background: selectedContainer === name ? 'rgba(32, 214, 199, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: selectedContainer === name ? '#20d6c7' : '#9ca3af',
                  border: selectedContainer === name ? '1px solid rgba(32, 214, 199, 0.4)' : '1px solid transparent',
                  borderRadius: '5px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {name.replace('_backend', '').replace('_', ' ')}
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
