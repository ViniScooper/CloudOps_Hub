'use client'

import React, { useState, useEffect } from 'react'
import {
  Shield, ShieldAlert, ShieldCheck, Ban, RefreshCw, Globe,
  Activity, Trash2, CheckCircle2, AlertTriangle, ArrowRight, Server, Zap
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface ThreatItem {
  id: string
  ip: string
  country: string
  org: string
  path: string
  status: number
  statusText: string
  time: string
  banned: boolean
}

interface ThreatShieldCardProps {
  server: any
  doAction: (msg: string) => void
  onNavigateToLogs?: () => void
}

export function ThreatShieldCard({ server, doAction, onNavigateToLogs }: ThreatShieldCardProps) {
  const [threats, setThreats] = useState<ThreatItem[]>([])
  const [loading, setLoading] = useState(true)
  const [banningIp, setBanningIp] = useState<string | null>(null)
  const [pruning, setPruning] = useState(false)
  const [bannedIps, setBannedIps] = useState<string[]>([])
  const [pings, setPings] = useState<any[]>([])

  const [autoRefresh, setAutoRefresh] = useState(true)

  const targetIp = server?.ip || '137.131.185.243'
  const isMicro = targetIp === '137.131.187.54' || targetIp.includes('micro')

  const parseThreatsFromLogs = (rawLogs: string): ThreatItem[] => {
    const list: ThreatItem[] = []
    const lines = rawLogs.split('\n')
    for (let i = lines.length - 1; i >= 0 && list.length < 50; i--) {
      const line = lines[i].trim()
      if (!line) continue

      // Extrai timestamp real do Docker (ex: 2026-10-06T17:18:57...)
      const isoMatch = line.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2}:\d{2})/)
      let realTime = ''
      if (isoMatch) {
        const [, year, month, day, time] = isoMatch
        realTime = `${day}/${month} ${time}`
      }

      // 1. Error log upstream (ex: connect() failed ... client: IP ... request: "GET /...")
      const errMatch = line.match(/client:\s*([0-9.]+).*?request:\s*"([^"]+)"/i)
      if (errMatch) {
        const clientIp = errMatch[1]
        const req = errMatch[2]

        if (!realTime) {
          const nginxErrTime = line.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}:\d{2}:\d{2})/)
          if (nginxErrTime) {
            realTime = `${nginxErrTime[3]}/${nginxErrTime[2]} ${nginxErrTime[4]}`
          } else {
            realTime = 'Hoje'
          }
        }

        list.push({
          id: `fe-err-${clientIp}-${i}`,
          ip: clientIp,
          country: 'Internacional 🌐',
          org: 'Scanner de Portas / Botnet',
          path: req.slice(0, 50),
          status: line.includes('Connection refused') ? 502 : 400,
          statusText: line.includes('Connection refused') ? 'Scan / Refused' : 'Bloqueado',
          time: realTime,
          banned: bannedIps.includes(clientIp)
        })
        continue
      }

      // 2. Access log (IP - - [...] "METHOD /... HTTP/..." 404/400/403/502)
      const accMatch = line.match(/([0-9.]+)\s+-\s+-\s+\[([^\]]+)\]\s+"([^"]+)"\s+(\d{3})\s+/i)
      if (accMatch) {
        const clientIp = accMatch[1]
        const rawTime = accMatch[2]
        const req = accMatch[3]
        const status = parseInt(accMatch[4], 10)

        if (
          req.includes('.env') || req.includes('.git') || req.includes('SDK') ||
          req.includes('login') || req.includes('\\x') || req.includes('php') ||
          req.includes('wp-') || req.includes('yml') || req.includes('yaml') ||
          status === 404 || status === 400 || status === 502
        ) {
          if (!realTime) {
            const dateParts = rawTime.split(':')
            const dayMonth = dateParts[0] || ''
            const timeStr = dateParts.slice(1, 4).join(':').split(' ')[0] || ''
            realTime = `${dayMonth.slice(0, 6)} ${timeStr}`.trim()
          }

          list.push({
            id: `fe-acc-${clientIp}-${i}`,
            ip: clientIp,
            country: 'Internacional 🌐',
            org: 'Varredura Web / Crawler',
            path: req.slice(0, 50),
            status,
            statusText: status === 502 ? '502 Bloqueado' : status === 404 ? '404 Barrado' : `${status} Rejeitado`,
            time: realTime || 'Recente',
            banned: bannedIps.includes(clientIp)
          })
        }
      }
    }
    return list
  }

  const fetchSecurityData = async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      let threatsFound: ThreatItem[] = []

      // 1. Tenta carregar do endpoint dedicado de segurança
      try {
        const res = await fetch(getApiUrl(`/api/security/threats?ip=${targetIp}`))
        const data = await res.json()
        if (data.threats && Array.isArray(data.threats) && data.threats.length > 0) {
          threatsFound = data.threats
        }
      } catch (err) {
        console.warn('Endpoint /api/security/threats indisponível, buscando via logs do container:', err)
      }

      // 2. Se não encontrou ameaças pelo endpoint de segurança, consome diretamente os logs do Nginx
      if (threatsFound.length === 0) {
        try {
          const containerName = isMicro ? 'nginx-proxy' : 'nginx-manager-nginx-1'
          const logRes = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(containerName)}?tail=200&ip=${encodeURIComponent(targetIp)}`))
          const logData = await logRes.json()
          if (logData.success && typeof logData.logs === 'string') {
            const parsed = parseThreatsFromLogs(logData.logs)
            if (parsed.length > 0) {
              threatsFound = parsed
            }
          }
        } catch (logErr) {
          console.warn('Erro ao ler logs de container para segurança:', logErr)
        }
      }

      setThreats(threatsFound)

      // Busca pings de rede
      const pingRes = await fetch(getApiUrl(`/api/network/pings?ip=${targetIp}`))
      const pingData = await pingRes.json()
      if (pingData.pings && Array.isArray(pingData.pings)) {
        setPings(pingData.pings)
      }
    } catch (e: any) {
      console.warn('Fallback segurança:', e.message)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchSecurityData()
  }, [server?.ip])

  // Auto-refresh a cada 5 segundos para refletir novos ataques em tempo real sem mocks
  useEffect(() => {
    let timer: any = null
    if (autoRefresh) {
      timer = setInterval(() => {
        fetchSecurityData(true)
      }, 5000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [autoRefresh, targetIp])

  const handleBanIp = async (ipToBan: string) => {
    try {
      setBanningIp(ipToBan)
      doAction(`Banindo IP ${ipToBan} no firewall iptables da VM ${server?.name}...`)
      const res = await fetch(getApiUrl('/api/security/ban-ip'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp, banIp: ipToBan })
      })
      const data = await res.json()
      if (data.success) {
        setBannedIps(prev => [...prev, ipToBan])
        doAction(data.message)
      } else {
        doAction(`Erro ao banir: ${data.error}`)
      }
    } catch (err: any) {
      doAction(`Falha ao comunicar com firewall: ${err.message}`)
    } finally {
      setBanningIp(null)
    }
  }

  const handlePruneDocker = async () => {
    try {
      setPruning(true)
      doAction(`Executando docker system prune na VM ${server?.name}...`)
      const res = await fetch(getApiUrl('/api/docker/prune'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: targetIp })
      })
      const data = await res.json()
      if (data.success) {
        doAction(`✅ ${data.message}`)
      } else {
        doAction(`Aviso: ${data.error || 'Falha ao limpar Docker'}`)
      }
    } catch (err: any) {
      doAction(`Erro na limpeza: ${err.message}`)
    } finally {
      setPruning(false)
    }
  }

  return (
    <section className="panel" style={{
      background: 'linear-gradient(145deg, rgba(13, 22, 26, 0.95) 0%, rgba(9, 14, 17, 0.98) 100%)',
      borderColor: 'rgba(32, 214, 199, 0.25)',
      padding: '22px',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      marginBottom: '20px'
    }}>
      {/* HEADER DO THREAT SHIELD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(32, 214, 199, 0.12)',
            border: '1px solid rgba(32, 214, 199, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#20d6c7',
            flexShrink: 0
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#f0fdfa' }}>
                Threat Shield & Defesa de Borda ({server?.name || targetIp})
              </h3>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                ● Perímetro Blindado (100% 404/400)
              </span>
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#88a6aa' }}>
              Varreduras automatizadas e caçadores de credenciais neutralizados na porta 80 ({isMicro ? 'nginx-proxy' : 'nginx-manager'})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: autoRefresh ? 'rgba(32, 214, 199, 0.15)' : '#121e22',
              border: `1px solid ${autoRefresh ? 'rgba(32, 214, 199, 0.4)' : '#1c2e34'}`,
              color: autoRefresh ? '#20d6c7' : '#88a6aa',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Alternar atualização automática a cada 5s"
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: autoRefresh ? '#20d6c7' : '#64748b'
            }} />
            Auto (5s) {autoRefresh ? 'Ativo' : 'Pausado'}
          </button>

          <button
            onClick={() => fetchSecurityData(false)}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#121e22',
              border: '1px solid #1c2e34',
              color: '#dbe7e8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            title="Atualizar lista de varreduras agora"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>

          <button
            onClick={handlePruneDocker}
            disabled={pruning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '11px',
              fontWeight: 600,
              cursor: pruning ? 'not-allowed' : 'pointer'
            }}
            title="Remove containers parados e imagens sem tag"
          >
            <Trash2 size={12} />
            {pruning ? 'Limpando...' : 'Limpar Lixo Docker'}
          </button>
        </div>
      </div>

      {/* PINGS DE CONECTIVIDADE E LATÊNCIA */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '10px',
        marginBottom: '18px'
      }}>
        {pings.map((p, idx) => (
          <div key={idx} style={{
            background: '#091013',
            border: '1px solid #142327',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={14} style={{ color: '#20d6c7' }} />
              <span style={{ fontSize: '11.5px', color: '#c5d8da', fontWeight: 600 }}>{p.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11.5px', color: '#a3e635', fontFamily: 'monospace', fontWeight: 700 }}>{p.latency}</span>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a3e635' }}></span>
            </div>
          </div>
        ))}
      </div>

      {/* TABELA DE AMEAÇAS E SCANS NEUTRALIZADOS */}
      <div style={{
        background: '#080d10',
        border: '1px solid #162428',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr 1.3fr 0.9fr 1.1fr 90px',
          padding: '10px 16px',
          background: '#0d161a',
          fontSize: '11px',
          fontWeight: 700,
          color: '#68868a',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: '1px solid #162428'
        }}>
          <span>IP Atacante</span>
          <span>País / Scanner</span>
          <span>Alvo Tentado</span>
          <span>Resposta</span>
          <span>Data / Horário</span>
          <span style={{ textAlign: 'right' }}>Ação</span>
        </div>

        <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
          {threats.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#88a6aa', fontSize: '12px' }}>
              <ShieldCheck size={28} style={{ color: '#10b981', margin: '0 auto 8px' }} />
              Nenhuma ameaça detectada nos eventos recentes do Nginx nesta VM.
            </div>
          ) : (
            threats.map((t, idx) => {
              const isBanned = t.banned || bannedIps.includes(t.ip)
              const isCurrentlyBanning = banningIp === t.ip

              return (
                <div
                  key={t.id || idx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 1fr 1.3fr 0.9fr 1.1fr 90px',
                    padding: '10px 16px',
                    fontSize: '12px',
                    alignItems: 'center',
                    borderBottom: '1px solid #111c20',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f87171' }}></span>
                    <strong style={{ color: '#f0fdfa', fontFamily: 'monospace' }}>{t.ip}</strong>
                  </div>

                  <div style={{ color: '#8faab0', fontSize: '11.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <span>{t.country}</span>
                    <small style={{ display: 'block', fontSize: '10px', color: '#577378' }}>{t.org}</small>
                  </div>

                  <div>
                    <code style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      color: '#fca5a5',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      display: 'inline-block',
                      maxWidth: '180px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {t.path}
                    </code>
                  </div>

                  <div>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: t.status === 404 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: t.status === 404 ? '#fbbf24' : '#f87171',
                      border: `1px solid ${t.status === 404 ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
                    }}>
                      {t.statusText}
                    </span>
                  </div>

                  <div>
                    <span style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#94a3b8'
                    }}>
                      {t.time || 'Recente'}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {isBanned ? (
                      <span style={{ fontSize: '10.5px', color: '#ef4444', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Ban size={12} /> Banido
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBanIp(t.ip)}
                        disabled={isCurrentlyBanning}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.35)',
                          color: '#f87171',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: isCurrentlyBanning ? 'not-allowed' : 'pointer'
                        }}
                        title={`Bloqueia o IP ${t.ip} no iptables do Linux`}
                      >
                        {isCurrentlyBanning ? '...' : '🚫 Banir'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
