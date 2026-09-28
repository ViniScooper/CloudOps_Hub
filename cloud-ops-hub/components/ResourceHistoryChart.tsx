'use client'

import React, { useState, useEffect } from 'react'
import { Activity, Cpu, HardDrive, RefreshCw, Database, TrendingUp, AlertTriangle } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface MetricPoint {
  id?: number | string
  timestamp: string
  cpu_percent: number
  ram_used_mb: number
  ram_total_mb: number
  ram_percent: number
  disk_percent: number
  containers_running: number
}

interface ResourceHistoryChartProps {
  doAction?: (msg: string) => void
}

export function ResourceHistoryChart({ doAction }: ResourceHistoryChartProps) {
  const [history, setHistory] = useState<MetricPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState<'cpu' | 'ram' | 'disk'>('ram')
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [sourceInfo, setSourceInfo] = useState<{ source?: string; total?: number }>({})

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const res = await fetch(getApiUrl('/api/metrics/history?limit=36'))
      if (!res.ok) throw new Error('Falha ao buscar histórico')
      const data = await res.json()
      if (data.history && Array.isArray(data.history)) {
        setHistory(data.history)
        setSourceInfo({ source: data.source, total: data.total })
      }
    } catch (err: any) {
      console.warn('Erro ao carregar histórico de métricas:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const triggerCollect = async () => {
    try {
      setLoading(true)
      if (doAction) doAction('Coletando telemetria da VM e persistindo no Oracle ATP...')
      const res = await fetch(getApiUrl('/api/metrics/collect'), { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        if (doAction) doAction('✅ Métrica registrada no Oracle ATP!')
        await fetchHistory()
      } else {
        if (doAction) doAction(`Aviso: ${data.error || 'Falha ao coletar'}`)
      }
    } catch (err: any) {
      if (doAction) doAction(`Erro na coleta: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  // Extrair valores de acordo com a métrica selecionada
  const getValue = (p: MetricPoint): number => {
    if (selectedMetric === 'cpu') return Number(p.cpu_percent || 0)
    if (selectedMetric === 'ram') return Number(p.ram_percent || 0)
    if (selectedMetric === 'disk') return Number(p.disk_percent || 0)
    return 0
  }

  const values = history.map(getValue)
  const currentVal = values.length > 0 ? values[values.length - 1] : 0
  const maxVal = values.length > 0 ? Math.max(...values) : 0
  const minVal = values.length > 0 ? Math.min(...values) : 0
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length) : 0

  // Configuração SVG
  const width = 640
  const height = 180
  const paddingX = 24
  const paddingY = 24

  const usableWidth = width - paddingX * 2
  const usableHeight = height - paddingY * 2

  // Gerar coordenadas dos pontos
  const points = history.map((pt, idx) => {
    const val = getValue(pt)
    const x = history.length <= 1 
      ? width / 2 
      : paddingX + (idx / (history.length - 1)) * usableWidth
    // Inverter Y (0% em baixo, 100% no topo)
    const clampedVal = Math.min(Math.max(val, 0), 100)
    const y = paddingY + usableHeight - (clampedVal / 100) * usableHeight
    return { x, y, val, time: pt.timestamp, point: pt }
  })

  // Gerar caminho SVG com linha e área preenchida
  let linePath = ''
  let areaPath = ''

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      // Linha reta suave
      linePath += ` L ${points[i].x} ${points[i].y}`
    }
    const lastX = points[points.length - 1].x
    const firstX = points[0].x
    const bottomY = paddingY + usableHeight
    areaPath = `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`
  }

  const metricColor = selectedMetric === 'cpu' 
    ? '#38bdf8' 
    : selectedMetric === 'ram' 
      ? '#20d6c7' 
      : '#f59e0b'

  const metricLabel = selectedMetric === 'cpu' 
    ? 'CPU' 
    : selectedMetric === 'ram' 
      ? 'Memória RAM' 
      : 'Disco (/)'

  const hoveredPoint = hoverIndex !== null && points[hoverIndex] ? points[hoverIndex] : null

  return (
    <section className="panel" style={{ marginTop: '20px', padding: '18px 20px', position: 'relative' }}>
      {/* Cabeçalho do Card */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} style={{ color: metricColor }} />
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f0fdfa' }}>
              Telemetria Histórica de Recursos (Oracle ATP)
            </h3>
            <span style={{ 
              fontSize: '10px', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              background: 'rgba(32, 214, 199, 0.12)', 
              color: '#20d6c7', 
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Database size={11} /> {sourceInfo.source === 'oracle_atp' ? 'Nuvem Oracle ATP' : 'Sincronizado'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', color: '#829396', fontSize: '12px' }}>
            Curva temporal persistente de carga na VM. Histórico armazenado sem consumir a RAM do servidor.
          </p>
        </div>

        {/* Controles: Abas de Métrica + Botão de Coletar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '3px', borderRadius: '8px', display: 'flex', gap: '3px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <button
              onClick={() => setSelectedMetric('ram')}
              style={{
                background: selectedMetric === 'ram' ? 'rgba(32, 214, 199, 0.18)' : 'transparent',
                color: selectedMetric === 'ram' ? '#20d6c7' : '#9ca3af',
                border: selectedMetric === 'ram' ? '1px solid rgba(32, 214, 199, 0.35)' : 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Activity size={12} /> RAM
            </button>
            <button
              onClick={() => setSelectedMetric('cpu')}
              style={{
                background: selectedMetric === 'cpu' ? 'rgba(56, 189, 248, 0.18)' : 'transparent',
                color: selectedMetric === 'cpu' ? '#38bdf8' : '#9ca3af',
                border: selectedMetric === 'cpu' ? '1px solid rgba(56, 189, 248, 0.35)' : 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Cpu size={12} /> CPU
            </button>
            <button
              onClick={() => setSelectedMetric('disk')}
              style={{
                background: selectedMetric === 'disk' ? 'rgba(245, 158, 11, 0.18)' : 'transparent',
                color: selectedMetric === 'disk' ? '#f59e0b' : '#9ca3af',
                border: selectedMetric === 'disk' ? '1px solid rgba(245, 158, 11, 0.35)' : 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <HardDrive size={12} /> Disco
            </button>
          </div>

          <button
            onClick={triggerCollect}
            disabled={loading}
            style={{
              background: 'rgba(32, 214, 199, 0.1)',
              border: '1px solid rgba(32, 214, 199, 0.3)',
              color: '#20d6c7',
              padding: '5px 11px',
              borderRadius: '7px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="Solicitar snapshot instantâneo e gravar no Oracle ATP agora"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Snapshot Agora
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas (Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '11px', color: '#829396', marginBottom: '4px' }}>Atual</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: metricColor }}>
            {currentVal.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '11px', color: '#829396', marginBottom: '4px' }}>Média Período</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#e5e7eb' }}>
            {avgVal.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '11px', color: '#829396', marginBottom: '4px' }}>Pico Máximo</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: maxVal > 85 ? '#ef4444' : '#e5e7eb' }}>
            {maxVal.toFixed(1)}%
          </div>
        </div>
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '8px', padding: '10px 14px' }}>
          <div style={{ fontSize: '11px', color: '#829396', marginBottom: '4px' }}>Amostras Gravadas</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#9ca3af' }}>
            {history.length} pts
          </div>
        </div>
      </div>

      {/* Gráfico SVG Responsivo */}
      <div style={{ width: '100%', position: 'relative', background: 'rgba(7, 14, 17, 0.5)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', overflow: 'hidden' }}>
        {history.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#829396', fontSize: '12px' }}>
            {loading ? 'Consultando histórico no Oracle ATP...' : 'Nenhum ponto registrado ainda. Clique em "Snapshot Agora" para iniciar o rastreamento.'}
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg 
              viewBox={`0 0 ${width} ${height}`} 
              style={{ width: '100%', height: 'auto', display: 'block', minWidth: '480px' }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <defs>
                <linearGradient id={`grad-${selectedMetric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricColor} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={metricColor} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Linhas de Grade e Marcadores (0%, 25%, 50%, 75%, 100%) */}
              {[0, 25, 50, 75, 100].map(pct => {
                const y = paddingY + usableHeight - (pct / 100) * usableHeight
                return (
                  <g key={pct}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeDasharray={pct === 0 ? 'none' : '3 3'}
                    />
                    <text
                      x={paddingX - 4}
                      y={y + 3}
                      fill="#6b7280"
                      fontSize="9"
                      textAnchor="end"
                    >
                      {pct}%
                    </text>
                  </g>
                )
              })}

              {/* Linha de alerta Watchdog em 85% */}
              <line
                x1={paddingX}
                y1={paddingY + usableHeight - (85 / 100) * usableHeight}
                x2={width - paddingX}
                y2={paddingY + usableHeight - (85 / 100) * usableHeight}
                stroke="rgba(239, 68, 68, 0.4)"
                strokeDasharray="4 4"
              />
              <text
                x={width - paddingX - 4}
                y={paddingY + usableHeight - (85 / 100) * usableHeight - 3}
                fill="rgba(239, 68, 68, 0.7)"
                fontSize="8.5"
                textAnchor="end"
              >
                Alerta 85%
              </text>

              {/* Área Gradiente */}
              {areaPath && (
                <path d={areaPath} fill={`url(#grad-${selectedMetric})`} />
              )}

              {/* Linha Principal */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={metricColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Pontos interativos */}
              {points.map((pt, i) => (
                <g key={i}>
                  {/* Círculo visível */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoverIndex === i ? 5 : 2.5}
                    fill={hoverIndex === i ? '#ffffff' : metricColor}
                    stroke={metricColor}
                    strokeWidth="1.5"
                    style={{ transition: 'all 0.15s ease' }}
                  />
                  {/* Zona de hover invisível e ampla para fácil toque/clique */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={12}
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setHoverIndex(i)}
                  />
                </g>
              ))}

              {/* Linha Vertical no Ponto Selecionado */}
              {hoveredPoint && (
                <line
                  x1={hoveredPoint.x}
                  y1={paddingY}
                  x2={hoveredPoint.x}
                  y2={paddingY + usableHeight}
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeDasharray="2 2"
                />
              )}
            </svg>
          </div>
        )}

        {/* Tooltip Overlay */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '16px',
            background: 'rgba(19, 28, 31, 0.95)',
            border: `1px solid ${metricColor}`,
            borderRadius: '6px',
            padding: '6px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            fontSize: '11px',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div>
              <span style={{ color: '#9ca3af', display: 'block', fontSize: '9.5px' }}>Horário</span>
              <strong style={{ color: '#f3f4f6' }}>
                {hoveredPoint.time ? new Date(hoveredPoint.time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--'}
              </strong>
            </div>
            <div>
              <span style={{ color: '#9ca3af', display: 'block', fontSize: '9.5px' }}>{metricLabel}</span>
              <strong style={{ color: metricColor, fontSize: '13px' }}>
                {hoveredPoint.val.toFixed(1)}%
              </strong>
            </div>
            {hoveredPoint.point.ram_used_mb && (
              <div>
                <span style={{ color: '#9ca3af', display: 'block', fontSize: '9.5px' }}>RAM Usada</span>
                <span style={{ color: '#d1d5db' }}>{hoveredPoint.point.ram_used_mb} MB</span>
              </div>
            )}
            <div>
              <span style={{ color: '#9ca3af', display: 'block', fontSize: '9.5px' }}>Containers</span>
              <span style={{ color: '#d1d5db' }}>{hoveredPoint.point.containers_running || 0}</span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
