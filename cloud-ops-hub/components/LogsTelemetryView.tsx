'use client'

import { useState, useEffect } from 'react'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Trash2, 
  Search, 
  Filter, 
  Terminal, 
  Radio, 
  ExternalLink,
  ShieldAlert,
  Zap,
  Clock,
  Eye,
  X
} from 'lucide-react'

interface TelemetryLog {
  id: string
  timestamp: string
  level: 'CRITICAL' | 'ERROR' | 'WARN' | 'INFO'
  source: string
  message: string
  path?: string
  method?: string
  statusCode?: number
  details?: string
  ip?: string
  userAgent?: string
}

export function LogsTelemetryView({ doAction }: { doAction: (msg: string) => void }) {
  const [logs, setLogs] = useState<TelemetryLog[]>([])
  const [metrics, setMetrics] = useState({ total: 0, errors: 0, warnings: 0, info: 0 })
  const [loading, setLoading] = useState(false)
  const [filterLevel, setFilterLevel] = useState('ALL')
  const [filterSource, setFilterSource] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filterLevel !== 'ALL') params.append('level', filterLevel)
      if (filterSource !== 'ALL') params.append('source', filterSource)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())

      const res = await fetch(`http://localhost:3005/api/telemetry/logs?${params.toString()}`)
      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
        setMetrics(data.metrics || { total: 0, errors: 0, warnings: 0, info: 0 })
      }
    } catch (err: any) {
      console.error('Erro ao buscar logs de telemetria:', err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    let timer: any = null
    if (autoRefresh) {
      timer = setInterval(fetchLogs, 5000)
    }
    return () => { if (timer) clearInterval(timer) }
  }, [filterLevel, filterSource, searchTerm, autoRefresh])

  const handleClear = async () => {
    if (!confirm('Deseja realmente limpar todos os logs de telemetria?')) return
    try {
      let res = await fetch('http://localhost:3005/api/telemetry/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      })
      if (!res.ok) {
        res = await fetch('http://localhost:3005/api/telemetry/clear')
      }
      setLogs([])
      setMetrics({ total: 0, errors: 0, warnings: 0, info: 0 })
      doAction('Logs de telemetria limpos com sucesso.')
    } catch (err: any) {
      doAction(`Erro ao limpar: ${err.message}`)
    }
  }

  return (
    <div className="section-space" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#f3f4f6' }}>Central de Monitoramento & Logs do Sistema</h2>
            <span style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: autoRefresh ? 'rgba(32, 214, 199, 0.12)' : 'rgba(255, 255, 255, 0.05)', 
              color: autoRefresh ? '#20d6c7' : '#9ca3af',
              padding: '3px 10px', 
              borderRadius: '20px', 
              fontSize: '11px', 
              fontWeight: 600 
            }}>
              <Radio size={12} className={autoRefresh ? 'animate-pulse' : ''} /> {autoRefresh ? 'Live Feed (5s)' : 'Modo Manual / Econômico'}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', color: '#9ca3af', fontSize: '13px' }}>
            Rastreamento em tempo real de erros dos clientes, falhas de API, exceções não tratadas e status dos micro-serviços.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => {
              fetchLogs()
              doAction('Verificando telemetria e erros do sistema...')
            }}
            style={{
              background: '#20d6c7',
              color: '#070c0e',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(32, 214, 199, 0.2)'
            }}
            title="Consulta imediata no backend sem consumir memória em segundo plano"
          >
            <Search size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Verificando...' : '🔍 Verificar Erros'}
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              background: autoRefresh ? 'rgba(32, 214, 199, 0.15)' : '#131c1f',
              border: autoRefresh ? '1px solid #20d6c7' : '1px solid #1f2d30',
              color: autoRefresh ? '#20d6c7' : '#e5e7eb',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title={autoRefresh ? 'Desativar atualização contínua' : 'Ativar atualização automática a cada 5s'}
          >
            <RefreshCw size={14} className={loading || autoRefresh ? 'animate-spin' : ''} /> {autoRefresh ? 'Auto 5s Ativo' : 'Ativar Auto (5s)'}
          </button>

          <button
            onClick={handleClear}
            style={{
              background: '#131c1f',
              border: '1px solid #1f2d30',
              color: '#9ca3af',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Limpar todos os logs de telemetria"
          >
            <Trash2 size={14} /> Limpar Logs
          </button>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div style={{ background: '#0e1518', border: '1px solid #182326', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Logs</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f3f4f6', marginTop: '4px' }}>{metrics.total}</div>
          <div style={{ fontSize: '11px', color: '#20d6c7', marginTop: '2px' }}>Eventos monitorados</div>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Erros Críticos / 5xx</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444', marginTop: '4px' }}>{metrics.errors}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Falhas de servidor e API</div>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avisos / 4xx</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b', marginTop: '4px' }}>{metrics.warnings}</div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Requisições inválidas ou 404</div>
        </div>

        <div style={{ background: '#0e1518', border: '1px solid #182326', borderRadius: '12px', padding: '14px 18px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Saúde do Sistema</div>
          <div style={{ fontSize: '24px', fontWeight: 700, color: metrics.errors === 0 ? '#10b981' : '#f59e0b', marginTop: '4px' }}>
            {metrics.errors === 0 ? '100% OK' : `${Math.round(((metrics.total - metrics.errors) / (metrics.total || 1)) * 100)}%`}
          </div>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>Taxa de sucesso operacional</div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div style={{ background: '#0e1518', border: '1px solid #182326', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Buscar por mensagem, rota, IP ou detalhes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: '#080c0e',
              border: '1px solid #1f2d30',
              borderRadius: '8px',
              padding: '8px 12px 8px 34px',
              color: '#f3f4f6',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={12} /> Nível:
          </span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            style={{
              background: '#080c0e',
              border: '1px solid #1f2d30',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#e5e7eb',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Todos os Níveis</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="ERROR">ERROR (5xx)</option>
            <option value="WARN">WARN (4xx)</option>
            <option value="INFO">INFO (2xx)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>Origem:</span>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            style={{
              background: '#080c0e',
              border: '1px solid #1f2d30',
              borderRadius: '6px',
              padding: '6px 10px',
              color: '#e5e7eb',
              fontSize: '12px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Todas as Origens</option>
            <option value="Cardápio Digital">Cardápio Digital</option>
            <option value="Painel Admin">Painel Admin</option>
            <option value="Boteco Backend">Boteco Backend</option>
            <option value="Oracle Scraper">Oracle Scraper</option>
            <option value="Nginx Proxy">Nginx Proxy</option>
          </select>
        </div>
      </div>

      {/* TABELA / FEED DE LOGS */}
      <div style={{ background: '#0e1518', border: '1px solid #182326', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#090e10', borderBottom: '1px solid #182326', color: '#9ca3af' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Nível</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Horário</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Origem</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Rota / Ação</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Mensagem do Evento</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Ação</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', marginBottom: '10px' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f3f4f6', marginBottom: '4px' }}>
                      Nenhum erro registrado no sistema
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Todos os serviços, APIs e acessos dos clientes estão operando com 100% de estabilidade. Clique em <b>"🔍 Verificar Erros"</b> para checar sob demanda.
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isError = log.level === 'ERROR' || log.level === 'CRITICAL' || (log.statusCode && log.statusCode >= 500)
                  const isWarn = log.level === 'WARN' || (log.statusCode && log.statusCode >= 400 && log.statusCode < 500)

                  let badgeColor = '#20d6c7'
                  let badgeBg = 'rgba(32, 214, 199, 0.1)'
                  if (isError) {
                    badgeColor = '#f87171'
                    badgeBg = 'rgba(239, 68, 68, 0.12)'
                  } else if (isWarn) {
                    badgeColor = '#fbbf24'
                    badgeBg = 'rgba(245, 158, 11, 0.12)'
                  }

                  return (
                    <tr 
                      key={log.id} 
                      style={{ 
                        borderBottom: '1px solid #131c1f',
                        background: selectedLog?.id === log.id ? 'rgba(32, 214, 199, 0.05)' : 'transparent',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          display: 'inline-block',
                          padding: '3px 8px', 
                          borderRadius: '4px', 
                          fontSize: '10px', 
                          fontWeight: 700, 
                          color: badgeColor, 
                          background: badgeBg 
                        }}>
                          {log.level}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                        {log.timestamp}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ 
                          background: '#131c1f', 
                          border: '1px solid #1f2d30', 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          color: '#d1d5db', 
                          fontSize: '11px',
                          fontWeight: 500
                        }}>
                          {log.source}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#e5e7eb' }}>
                        {log.method && <span style={{ color: '#20d6c7', marginRight: '6px' }}>{log.method}</span>}
                        {log.path || '-'}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        {log.statusCode ? (
                          <span style={{ 
                            fontWeight: 700, 
                            color: isError ? '#f87171' : (isWarn ? '#fbbf24' : '#10b981') 
                          }}>
                            {log.statusCode}
                          </span>
                        ) : '-'}
                      </td>

                      <td style={{ padding: '12px 16px', color: '#d1d5db', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.message}>
                        {log.message}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedLog(log)}
                          style={{
                            background: '#131c1f',
                            border: '1px solid #1f2d30',
                            color: '#20d6c7',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Eye size={12} /> Detalhes
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALHES DO LOG */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0e1518',
            border: '1px solid #1f2d30',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #182326', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: selectedLog.level === 'ERROR' ? '#f87171' : '#20d6c7', 
                  background: selectedLog.level === 'ERROR' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(32, 214, 199, 0.15)' 
                }}>
                  {selectedLog.level}
                </span>
                <strong style={{ fontSize: '15px', color: '#f3f4f6' }}>Inspeção do Evento</strong>
              </div>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'transparent', border: 0, color: '#9ca3af', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '16px', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#6b7280' }}>Horário:</span>
                <div style={{ color: '#e5e7eb', fontWeight: 600, marginTop: '2px' }}>{selectedLog.timestamp}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Origem:</span>
                <div style={{ color: '#e5e7eb', fontWeight: 600, marginTop: '2px' }}>{selectedLog.source}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Endpoint / Rota:</span>
                <div style={{ color: '#20d6c7', fontFamily: 'monospace', marginTop: '2px' }}>{selectedLog.method || ''} {selectedLog.path || '-'}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Código HTTP:</span>
                <div style={{ color: '#e5e7eb', fontWeight: 600, marginTop: '2px' }}>{selectedLog.statusCode || '-'}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>IP do Cliente:</span>
                <div style={{ color: '#e5e7eb', fontFamily: 'monospace', marginTop: '2px' }}>{selectedLog.ip || '127.0.0.1'}</div>
              </div>
              <div>
                <span style={{ color: '#6b7280' }}>Navegador / Device:</span>
                <div style={{ color: '#9ca3af', fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedLog.userAgent || 'App / API Client'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>Mensagem do Erro:</span>
              <div style={{ background: '#080c0e', border: '1px solid #1f2d30', padding: '12px', borderRadius: '8px', color: '#f87171', fontSize: '13px', fontWeight: 600, marginTop: '6px' }}>
                {selectedLog.message}
              </div>
            </div>

            {selectedLog.details && (
              <div style={{ marginTop: '16px' }}>
                <span style={{ color: '#6b7280', fontSize: '12px' }}>Stack Trace / Detalhes Técnicos:</span>
                <pre style={{ 
                  background: '#080c0e', 
                  border: '1px solid #1f2d30', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  color: '#9ca3af', 
                  fontSize: '11px', 
                  fontFamily: 'monospace', 
                  marginTop: '6px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedLog.details}
                </pre>
              </div>
            )}

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedLog(null)}
                style={{
                  background: '#20d6c7',
                  border: 0,
                  color: '#080c0e',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
