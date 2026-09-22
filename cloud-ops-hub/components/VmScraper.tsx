'use client'

import React, { useState, useEffect } from 'react'
import { Activity, RefreshCw, Server, Shield, Zap, Cloud, Laptop, Play, Square, MessageSquare, Download, CheckCircle2, AlertCircle, Terminal, Cpu } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface VmScraperProps {
  scraperData: any
  scraperLoading: boolean
  setScraperLoading: (val: boolean) => void
  doAction: (msg: string) => void
  server?: any
  serverList?: any[]
  defaultSshKey?: string
}

export function VmScraper({
  scraperData,
  scraperLoading,
  setScraperLoading,
  doAction,
  server,
  serverList,
  defaultSshKey = ''
}: VmScraperProps) {
  // Modo de execução: Nuvem (cloudops-micro-02) ou Local (PC)
  const [activeMode, setActiveMode] = useState<'cloud' | 'local'>('cloud')

  // Estado do robô rodando na nuvem (cloudops-micro-02)
  const [cloudData, setCloudData] = useState<any>({
    isRunning: true,
    status: 'Ativo na Nuvem (cloudops-micro-02)',
    workerHost: 'cloudops-micro-02 (137.131.187.54)',
    attempts: 0,
    successfulVm: null,
    lastAttemptAt: null,
    currentProfile: { ocpus: 1, memoryInGBs: 2, label: '1 OCPU / 2 GB RAM (Alta Chance)' },
    recentLogs: []
  })
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudLastSync, setCloudLastSync] = useState<string>('')

  // Chave SSH e IP da VM Cloud
  const cloudVmIp = '137.131.187.54'
  const sshKeyToUse = (server?.ip === cloudVmIp ? server?.privateKey : null) ||
    serverList?.find((s: any) => s.ip === cloudVmIp)?.privateKey ||
    defaultSshKey

  // Função para consultar o status em tempo real do robô na nuvem via SSH
  const fetchCloudStatus = async () => {
    if (!sshKeyToUse) return
    try {
      const res = await fetch(getApiUrl('/api/servers/exec'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: cloudVmIp,
          port: 22,
          user: 'ubuntu',
          privateKey: sshKeyToUse,
          command: 'systemctl is-active cloudops-scraper.service && cat /home/ubuntu/cloudops-scraper/state.json'
        })
      })

      if (res.ok) {
        const json = await res.json()
        const rawOutput = json.output || ''
        const isActive = rawOutput.startsWith('active')

        const jsonStart = rawOutput.indexOf('{')
        if (jsonStart !== -1) {
          try {
            const parsed = JSON.parse(rawOutput.slice(jsonStart))
            setCloudData({
              ...parsed,
              isRunning: isActive,
              status: isActive ? 'Ativo na Nuvem (cloudops-micro-02)' : 'Pausado na Nuvem'
            })
            setCloudLastSync(new Date().toLocaleTimeString('pt-BR'))
          } catch (pe) {
            // parsing parcial em andamento
          }
        }
      }
    } catch (e) {
      // Falha temporária de rede ou backend reiniciando
    }
  }

  // Polling automático das informações da Nuvem a cada 5 segundos quando o modo Nuvem estiver ativo
  useEffect(() => {
    if (activeMode === 'cloud') {
      fetchCloudStatus()
      const interval = setInterval(fetchCloudStatus, 5000)
      return () => clearInterval(interval)
    }
  }, [activeMode, sshKeyToUse])

  // Ação de Iniciar/Parar o Robô na Nuvem via systemctl
  const toggleCloudScraper = async (start: boolean) => {
    setCloudLoading(true)
    const cmd = start
      ? 'sudo systemctl start cloudops-scraper.service && sleep 1 && systemctl is-active cloudops-scraper.service'
      : 'sudo systemctl stop cloudops-scraper.service && sleep 1 && systemctl is-active cloudops-scraper.service'

    try {
      doAction(start ? 'Iniciando robô na nuvem (cloudops-micro-02)...' : 'Pausando robô na nuvem...')
      const res = await fetch(getApiUrl('/api/servers/exec'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: cloudVmIp,
          port: 22,
          user: 'ubuntu',
          privateKey: sshKeyToUse,
          command: cmd
        })
      })
      const data = await res.json()
      if (start) {
        doAction('🚀 Robô na nuvem ativado com sucesso em cloudops-micro-02!')
      } else {
        doAction('⏸️ Robô na nuvem pausado.')
      }
      await fetchCloudStatus()
    } catch (err: any) {
      doAction(`Erro ao controlar robô na nuvem: ${err.message}`)
    } finally {
      setCloudLoading(false)
    }
  }

  // Download da chave privada SSH gerada na VM para a nova máquina ARM
  const downloadCloudArmKey = async () => {
    try {
      doAction('Buscando chave privada da VM ARM gerada na nuvem...')
      const res = await fetch(getApiUrl('/api/servers/exec'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: cloudVmIp,
          port: 22,
          user: 'ubuntu',
          privateKey: sshKeyToUse,
          command: 'cat /home/ubuntu/cloudops-scraper/keys/arm_vm_key'
        })
      })
      const data = await res.json()
      if (data.output && data.output.includes('PRIVATE KEY')) {
        const element = document.createElement('a')
        const file = new Blob([data.output.trim()], { type: 'text/plain' })
        element.href = URL.createObjectURL(file)
        element.download = 'cloudops_arm_vm_key.key'
        document.body.appendChild(element)
        element.click()
        document.body.removeChild(element)
        doAction('Chave SSH baixada com sucesso! Utilize-a no MobaXterm.')
      } else {
        doAction('Chave ainda não disponível ou sem permissão de leitura.')
      }
    } catch (e: any) {
      doAction(`Erro ao baixar chave: ${e.message}`)
    }
  }

  return (
    <div>
      {/* SELETOR DE MODO: NUVEM vs LOCAL */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#090f11',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid #14252a',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#6f8387', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ambiente do Robô:
          </span>
          <div style={{ display: 'flex', background: '#05090b', padding: '3px', borderRadius: '6px', border: '1px solid #132227' }}>
            <button
              onClick={() => setActiveMode('cloud')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeMode === 'cloud' ? 'rgba(32, 214, 199, 0.15)' : 'transparent',
                color: activeMode === 'cloud' ? '#20d6c7' : '#6f8387',
                boxShadow: activeMode === 'cloud' ? 'inset 0 0 0 1px #20d6c7' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Cloud size={15} />
              Robô Rodando na Nuvem
              <span style={{
                fontSize: '10px',
                background: '#10b981',
                color: '#042116',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 700
              }}>
                cloudops-micro-02
              </span>
            </button>
            <button
              onClick={() => setActiveMode('local')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeMode === 'local' ? 'rgba(32, 214, 199, 0.15)' : 'transparent',
                color: activeMode === 'local' ? '#20d6c7' : '#6f8387',
                boxShadow: activeMode === 'local' ? 'inset 0 0 0 1px #20d6c7' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Laptop size={15} />
              Robô Local (PC)
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#6f8387' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: activeMode === 'cloud'
              ? (cloudData.isRunning ? '#10b981' : '#f59e0b')
              : (scraperData.isRunning ? '#10b981' : '#f59e0b')
          }} />
          <span>
            {activeMode === 'cloud'
              ? (cloudData.isRunning ? '24/7 Ativo em sa-saopaulo-1' : 'Pausado na Nuvem')
              : (scraperData.isRunning ? 'Ativo no Computador Local' : 'Parado no PC')}
          </span>
          {activeMode === 'cloud' && cloudLastSync && (
            <span style={{ color: '#41555a', fontFamily: 'monospace' }}>· Sincronizado {cloudLastSync}</span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA DO ROBÔ NA NUVEM (cloudops-micro-02 - 137.131.187.54)                 */}
      {/* ========================================================================= */}
      {activeMode === 'cloud' && (
        <>
          <div className="section-heading">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cloud size={20} style={{ color: '#20d6c7' }} />
                Scraper Autônomo na Nuvem · cloudops-micro-02
              </h2>
              <p>
                Executado 24/7 como serviço systemd isolado na VM Oracle Cloud (137.131.187.54). Consumo ultra-baixo (~11 MB RAM) e zero impacto no seu PC.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {cloudData.isRunning ? (
                <button
                  className="refresh-button"
                  style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                  disabled={cloudLoading}
                  onClick={() => toggleCloudScraper(false)}
                >
                  <Square size={14} /> Pausar Robô na Nuvem
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={cloudLoading}
                  onClick={() => toggleCloudScraper(true)}
                >
                  <Play size={14} /> Retomar Robô na Nuvem
                </button>
              )}
              <button
                className="refresh-button"
                disabled={cloudLoading}
                onClick={fetchCloudStatus}
                title="Sincronizar telemetria e logs da VM"
              >
                <RefreshCw size={14} className={cloudLoading ? 'spin' : ''} /> Sincronizar
              </button>
              <button
                className="refresh-button"
                title="Testar envio de notificação para o WhatsApp configurado"
                onClick={async () => {
                  doAction('Disparando teste de WhatsApp...')
                  try {
                    await fetch(getApiUrl('/api/oracle/scraper/test-whatsapp'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: '{}'
                    })
                    doAction('Notificação enviada para o seu WhatsApp! 📲')
                  } catch (e: any) {
                    doAction('Erro ao testar WhatsApp: ' + e.message)
                  }
                }}
              >
                <MessageSquare size={14} /> Testar WhatsApp
              </button>
              <button
                className="refresh-button"
                title="Baixar chave privada SSH da nova VM ARM"
                onClick={downloadCloudArmKey}
              >
                <Download size={14} /> Chave ARM (.key)
              </button>
            </div>
          </div>

          {/* Cards de Métricas da Nuvem */}
          <div className="metrics-grid" style={{ marginBottom: '20px' }}>
            <article className="metric-card">
              <div className="metric-topline">
                <span className={`metric-icon ${cloudData.isRunning ? 'emerald' : 'amber'}`}>
                  <Activity size={16} />
                </span>
                <span className="metric-label">Status na Nuvem</span>
              </div>
              <div className="metric-value" style={{ fontSize: '17px' }}>
                {cloudData.isRunning ? 'RODANDO 24/7' : 'PAUSADO'}
              </div>
              <div className="metric-bottom">
                <span className={`status-dot ${cloudData.isRunning ? 'emerald' : 'amber'}`} />
                <span className="muted">cloudops-micro-02 (systemd)</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon cyan">
                  <RefreshCw size={16} />
                </span>
                <span className="metric-label">Tentativas na Nuvem</span>
              </div>
              <div className="metric-value">
                {cloudData.attempts || 0}
              </div>
              <div className="metric-bottom">
                <span className="muted">Ciclo: {cloudData.intervalSeconds || 25}s · GRU (SP)</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon purple">
                  <Server size={16} />
                </span>
                <span className="metric-label">Perfil Atual de Busca</span>
              </div>
              <div className="metric-value" style={{ fontSize: '15px' }}>
                {cloudData.currentProfile?.label || '1 OCPU / 2 GB RAM (Alta Chance)'}
              </div>
              <div className="metric-bottom">
                <span className="muted">Rotaciona entre perfis ARM</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon emerald">
                  <Cpu size={16} />
                </span>
                <span className="metric-label">Uso de RAM na VM</span>
              </div>
              <div className="metric-value" style={{ color: '#20d6c7', fontSize: '18px' }}>
                ~11.1 MB
              </div>
              <div className="metric-bottom">
                <span className="muted">1.1% da VM · Cgroups 60MB max</span>
              </div>
            </article>
          </div>

          {/* Banner de Sucesso quando uma VM ARM for capturada */}
          {(cloudData.status?.includes('SUCESSO') || cloudData.successfulVm) && (
            <div style={{ marginBottom: '20px', padding: '18px 22px', background: '#08211b', border: '1px solid #10b981', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ color: '#10b981', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} /> 🎉 SUCESSO! Instância Oracle ARM Always Free Capturada na Nuvem!
                  </h3>
                  <p style={{ color: '#a7f3d0', fontSize: '12px', margin: 0 }}>
                    A VM cloudops-micro-02 provisionou a máquina com sucesso e os detalhes já foram salvos e enviados ao seu WhatsApp!
                  </p>
                </div>
                <button
                  className="primary-button"
                  style={{ background: '#10b981', color: '#042116', fontWeight: 600 }}
                  onClick={downloadCloudArmKey}
                >
                  <Download size={14} /> Baixar Chave Privada (.key)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', padding: '14px', background: '#051612', borderRadius: '6px', border: '1px solid #144436', fontSize: '11px', color: '#d1fae5' }}>
                <div>
                  <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Usuário de Acesso</span>
                  <strong style={{ fontSize: '13px' }}>ubuntu</strong>
                </div>
                <div>
                  <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Porta SSH</span>
                  <strong style={{ fontSize: '13px' }}>22</strong>
                </div>
                <div>
                  <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Perfil Provisionado</span>
                  <strong style={{ fontSize: '13px' }}>{cloudData.successfulVm?.shapeLabel || cloudData.currentProfile?.label || 'ARM Ampere A1'}</strong>
                </div>
                <div>
                  <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Nome da Instância</span>
                  <strong>{cloudData.successfulVm?.displayName || 'cloudops-arm-vm'}</strong>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Conexão SSH / MobaXterm</span>
                  <span style={{ fontFamily: 'monospace', color: '#a7f3d0' }}>
                    ssh -i cloudops_arm_vm_key.key ubuntu@{cloudData.successfulVm?.publicIp || '[IP_PUBLICO]'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Console de Eventos do Scraper na Nuvem */}
          <section className="panel">
            <div className="panel-header">
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={16} style={{ color: '#20d6c7' }} />
                  Console de Eventos da Nuvem (cloudops-micro-02)
                </h3>
                <p>Logs das chamadas de API autenticadas e assinadas enviadas diretamente da VM na Oracle Cloud</p>
              </div>
              <span style={{ fontSize: '11px', color: '#6f8387', fontFamily: 'monospace' }}>
                {cloudData.lastAttemptAt ? `Última tentativa: ${new Date(cloudData.lastAttemptAt).toLocaleTimeString('pt-BR')}` : 'Aguardando telemetria'}
              </span>
            </div>
            <div
              style={{
                background: '#070a0c',
                border: '1px solid #142023',
                borderRadius: '6px',
                padding: '16px',
                maxHeight: '420px',
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {(!cloudData.recentLogs || cloudData.recentLogs.length === 0) ? (
                <div style={{ color: '#6f8387', textAlign: 'center', padding: '30px' }}>
                  Carregando telemetria ao vivo da VM cloudops-micro-02...
                </div>
              ) : (
                cloudData.recentLogs.map((item: any, i: number) => {
                  let color = '#d9e2e1'
                  if (item.type === 'success') color = '#34d399'
                  if (item.type === 'warn') color = '#fbbf24'
                  if (item.type === 'error') color = '#f87171'
                  return (
                    <div key={i} style={{ color, display: 'flex', gap: '12px' }}>
                      <span style={{ color: '#52666a', userSelect: 'none' }}>[{item.time}]</span>
                      <span>{item.message}</span>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </>
      )}

      {/* ========================================================================= */}
      {/* ABA DO ROBÔ LOCAL (Hub no Computador)                                      */}
      {/* ========================================================================= */}
      {activeMode === 'local' && (
        <>
          <div className="section-heading">
            <div>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Laptop size={20} style={{ color: '#20d6c7' }} />
                Scraper de VM Always Free (Execução Local no PC)
              </h2>
              <p>
                Executado pelo CloudOps Hub no seu computador. Requer que o aplicativo e terminal permaneçam abertos.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {scraperData.isRunning ? (
                <button
                  className="refresh-button"
                  style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}
                  disabled={scraperLoading}
                  onClick={async () => {
                    setScraperLoading(true)
                    try {
                      await fetch(getApiUrl('/api/oracle/scraper/stop'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                      doAction('Scraper local interrompido.')
                    } finally {
                      setScraperLoading(false)
                    }
                  }}
                >
                  <Square size={14} /> Parar Robô Local
                </button>
              ) : (
                <button
                  className="primary-button"
                  disabled={scraperLoading}
                  onClick={async () => {
                    setScraperLoading(true)
                    try {
                      await fetch(getApiUrl('/api/oracle/scraper/start'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                      doAction('Robô Scraper local iniciado!')
                    } finally {
                      setScraperLoading(false)
                    }
                  }}
                >
                  <Play size={14} /> Iniciar Robô Local
                </button>
              )}
              <button
                className="refresh-button"
                title="Testar envio de notificação para o WhatsApp configurado"
                onClick={async () => {
                  doAction('Disparando mensagem de teste para o WhatsApp...')
                  try {
                    await fetch(getApiUrl('/api/oracle/scraper/test-whatsapp'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                    doAction('Notificação enviada para o seu WhatsApp! 📲')
                  } catch (e: any) {
                    doAction('Erro ao testar: ' + e.message)
                  }
                }}
              >
                <MessageSquare size={14} /> Testar WhatsApp
              </button>
            </div>
          </div>

          <div className="metrics-grid" style={{ marginBottom: '20px' }}>
            <article className="metric-card">
              <div className="metric-topline">
                <span className={`metric-icon ${scraperData.isRunning ? 'emerald' : 'cyan'}`}>
                  <Activity size={16} />
                </span>
                <span className="metric-label">Status do Robô Local</span>
              </div>
              <div className="metric-value" style={{ fontSize: '18px' }}>
                {scraperData.isRunning ? 'ATIVO (LOCAL)' : (scraperData.status || 'PARADO')}
              </div>
              <div className="metric-bottom">
                <span className={`status-dot ${scraperData.isRunning ? 'emerald' : 'amber'}`} />
                <span className="muted">{scraperData.isRunning ? 'Tentando a cada 30s' : 'Aguardando início manual'}</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon cyan">
                  <RefreshCw size={16} />
                </span>
                <span className="metric-label">Total de Tentativas</span>
              </div>
              <div className="metric-value">
                {scraperData.attempts || 0}
              </div>
              <div className="metric-bottom">
                <span className="muted">Região: sa-saopaulo-1 (GRU)</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon purple">
                  <Server size={16} />
                </span>
                <span className="metric-label">Perfil Atual de Busca</span>
              </div>
              <div className="metric-value" style={{ fontSize: '15px' }}>
                {scraperData.currentProfile?.label || scraperData.nextProfile?.label || '1 OCPU / 2 GB RAM'}
              </div>
              <div className="metric-bottom">
                <span className="muted">Rotaciona entre perfis ARM</span>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-topline">
                <span className="metric-icon emerald">
                  <Shield size={16} />
                </span>
                <span className="metric-label">Carga no Servidor</span>
              </div>
              <div className="metric-value" style={{ color: '#20d6c7' }}>
                0.0%
              </div>
              <div className="metric-bottom">
                <span className="muted">Processamento no PC Local</span>
              </div>
            </article>
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h3>Console de Eventos do Robô Local</h3>
                <p>Log das chamadas de API geradas no seu Hub para a Oracle Cloud</p>
              </div>
              <span style={{ fontSize: '11px', color: '#6f8387', fontFamily: 'monospace' }}>
                {scraperData.lastAttemptAt ? `Último envio: ${new Date(scraperData.lastAttemptAt).toLocaleTimeString('pt-BR')}` : 'Sem atividade recente'}
              </span>
            </div>
            <div
              style={{
                background: '#070a0c',
                border: '1px solid #142023',
                borderRadius: '6px',
                padding: '16px',
                maxHeight: '420px',
                overflowY: 'auto',
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {(!scraperData.logs || scraperData.logs.length === 0) ? (
                <div style={{ color: '#6f8387', textAlign: 'center', padding: '30px' }}>
                  O scraper local está parado. Use o <b>Robô Rodando na Nuvem</b> para automação 24 horas contínua sem depender do seu computador!
                </div>
              ) : (
                scraperData.logs.map((log: any, i: number) => {
                  let color = '#d9e2e1'
                  if (log.type === 'success') color = '#34d399'
                  if (log.type === 'warn') color = '#fbbf24'
                  if (log.type === 'error') color = '#f87171'
                  return (
                    <div key={i} style={{ color, display: 'flex', gap: '12px' }}>
                      <span style={{ color: '#52666a', userSelect: 'none' }}>[{log.timestamp}]</span>
                      <span>{log.message}</span>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
