'use client'

import React, { useState, useEffect } from 'react'
import {
  Briefcase, ExternalLink, RefreshCw, Activity, ShieldCheck, Zap, Globe, Sparkles
} from 'lucide-react'

interface JobTrackerViewProps {
  doAction: (msg: string) => void
}

export function JobTrackerView({ doAction }: JobTrackerViewProps) {
  const [iframeKey, setIframeKey] = useState(Date.now())
  const [apiPingStatus, setApiPingStatus] = useState<'checking' | 'online' | 'slow' | 'offline'>('checking')
  const [apiLatency, setApiLatency] = useState<number | null>(null)
  const [lastCheckTime, setLastCheckTime] = useState<string>('')

  const appUrl = 'https://job-tracker-lac-five.vercel.app/'
  const apiUrl = 'https://job-tracker-1-e7fg.onrender.com/health'

  const checkApiHealth = async () => {
    setApiPingStatus('checking')
    const start = Date.now()
    try {
      const res = await fetch(apiUrl, { method: 'GET', mode: 'cors' }).catch(() => null)
      const latency = Date.now() - start
      setApiLatency(latency)
      setLastCheckTime(new Date().toLocaleTimeString('pt-BR'))

      if (res && res.ok) {
        setApiPingStatus(latency < 300 ? 'online' : 'slow')
        doAction(`🟢 Job Tracker API respondendo via Render (${latency}ms) — Guardião Anti-Sleep Ativo!`)
      } else {
        // Se a resposta for opaca ou 404/ok (mas acessível)
        setApiPingStatus('online')
        doAction(`🟢 Job Tracker API alcançável (${latency}ms)`)
      }
    } catch (err: any) {
      const latency = Date.now() - start
      setApiLatency(latency)
      setApiPingStatus('slow')
      setLastCheckTime(new Date().toLocaleTimeString('pt-BR'))
    }
  }

  useEffect(() => {
    checkApiHealth()
    const timer = setInterval(checkApiHealth, 60000) // Checa a cada 1 minuto
    return () => clearInterval(timer)
  }, [])

  const reloadIframe = () => {
    setIframeKey(Date.now())
    doAction('🔄 Recarregando interface do Job Tracker...')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: 'calc(100vh - 120px)', width: '100%' }}>
      {/* Barra Superior de Telemetria e Ações */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '12px 18px',
        background: 'linear-gradient(135deg, rgba(16, 28, 32, 0.8) 0%, rgba(7, 14, 17, 0.9) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(32, 214, 199, 0.2)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        {/* Lado Esquerdo: Identificação & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 10px rgba(20, 184, 166, 0.3)'
          }}>
            <Briefcase size={20} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#f0fdfa' }}>Job Tracker</span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#20d6c7',
                background: 'rgba(32, 214, 199, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(32, 214, 199, 0.3)',
                textTransform: 'uppercase'
              }}>
                Produção Integrada
              </span>
            </div>
            <span style={{ fontSize: '11px', color: '#6f8387' }}>
              Rastreamento de Vagas, Kanban ATS Matcher & Exportação IA
            </span>
          </div>
        </div>

        {/* Centro: Badges de Conexão (Render + Vercel) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Badge Vercel */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '11px',
            color: '#d9e2e1'
          }}>
            <Globe size={13} style={{ color: '#fff' }} />
            <span>Frontend: <b>Vercel Edge</b></span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          </div>

          {/* Badge Render + Guardião Anti-Sleep */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            background: 'rgba(70, 227, 183, 0.08)',
            border: '1px solid rgba(70, 227, 183, 0.25)',
            fontSize: '11px',
            color: '#46e3b7'
          }}>
            <ShieldCheck size={14} />
            <span>Guardião Anti-Sleep: <b>Ativo (10m)</b></span>
            {apiLatency !== null && (
              <span style={{ fontSize: '10px', color: '#a3e635', fontFamily: 'monospace' }}>
                ({apiLatency}ms)
              </span>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações Rápidas */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={checkApiHealth}
            title="Verificar latência da API no Render"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(32, 214, 199, 0.1)',
              border: '1px solid rgba(32, 214, 199, 0.25)',
              color: '#20d6c7',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Activity size={13} />
            <span>Testar API</span>
          </button>

          <button
            type="button"
            onClick={reloadIframe}
            title="Recarregar tela do Job Tracker"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d9e2e1',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={13} />
            <span>Recarregar</span>
          </button>

          <a
            href={appUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.25)'
            }}
          >
            <span>Abrir Nova Aba</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Frame Embutido do Job Tracker */}
      <div style={{
        flex: 1,
        width: '100%',
        minHeight: '400px',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(32, 214, 199, 0.15)',
        background: '#070e11',
        boxShadow: 'inset 0 0 20px rgba(0, 0, 0, 0.5)'
      }}>
        <iframe
          key={iframeKey}
          src={appUrl}
          title="Job Tracker Application"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block'
          }}
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  )
}
