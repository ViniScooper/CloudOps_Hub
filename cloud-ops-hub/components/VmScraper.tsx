'use client'

import React from 'react'
import { Activity, RefreshCw, Server, Shield, Zap } from 'lucide-react'

interface VmScraperProps {
  scraperData: any
  scraperLoading: boolean
  setScraperLoading: (val: boolean) => void
  doAction: (msg: string) => void
}

export function VmScraper({
  scraperData,
  scraperLoading,
  setScraperLoading,
  doAction
}: VmScraperProps) {
  return (
    <div>
      <div className="section-heading">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={20} style={{ color: '#20d6c7' }} />
            Scraper & Auto-Provisioning de VM Always Free (ARM Ampere A1)
          </h2>
          <p>
            Executado 100% pelo CloudOps Hub no seu computador local. Zero consumo de RAM na sua VM de produção!
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
                  await fetch('http://localhost:3005/api/oracle/scraper/stop', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                  doAction('Scraper de VM interrompido.')
                } finally {
                  setScraperLoading(false)
                }
              }}
            >
              Parar Robô Scraper
            </button>
          ) : (
            <button 
              className="primary-button"
              disabled={scraperLoading}
              onClick={async () => {
                setScraperLoading(true)
                try {
                  await fetch('http://localhost:3005/api/oracle/scraper/start', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                  doAction('Robô Scraper de VM iniciado no seu Hub!')
                } finally {
                  setScraperLoading(false)
                }
              }}
            >
              <Zap size={14} /> Iniciar Robô Scraper
            </button>
          )}
          <button 
            className="refresh-button"
            title="Testar envio de notificação para o seu WhatsApp (+558195126839)"
            onClick={async () => {
              doAction('Disparando mensagem de teste para o WhatsApp...')
              try {
                await fetch('http://localhost:3005/api/oracle/scraper/test-whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
                doAction('Notificação enviada para o seu WhatsApp! 📲')
              } catch (e: any) {
                doAction('Erro ao testar: ' + e.message)
              }
            }}
          >
            📲 Testar WhatsApp
          </button>
        </div>
      </div>

      {/* Cards de Métricas do Robô */}
      <div className="metrics-grid" style={{ marginBottom: '20px' }}>
        <article className="metric-card">
          <div className="metric-topline">
            <span className={`metric-icon ${scraperData.isRunning ? 'emerald' : 'cyan'}`}>
              <Activity size={16} />
            </span>
            <span className="metric-label">Status do Robô</span>
          </div>
          <div className="metric-value" style={{ fontSize: '18px' }}>
            {scraperData.isRunning ? 'ATIVO (POLLING)' : (scraperData.status || 'PARADO')}
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
            {scraperData.currentProfile?.label || scraperData.nextProfile?.label || '2 OCPU / 12 GB RAM'}
          </div>
          <div className="metric-bottom">
            <span className="muted">Rotaciona entre 6 perfis ARM</span>
          </div>
        </article>

        <article className="metric-card">
          <div className="metric-topline">
            <span className="metric-icon emerald">
              <Shield size={16} />
            </span>
            <span className="metric-label">Carga na VM Atual</span>
          </div>
          <div className="metric-value" style={{ color: '#20d6c7' }}>
            0.0%
          </div>
          <div className="metric-bottom">
            <span className="muted">Protegido contra OOM Killer</span>
          </div>
        </article>
      </div>

      {/* Sucesso em Destaque */}
      {scraperData.status === 'SUCESSO' && scraperData.successfulVm && (
        <div style={{ marginBottom: '20px', padding: '18px 22px', background: '#08211b', border: '1px solid #10b981', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h3 style={{ color: '#10b981', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🎉 SUCESSO! Instância Oracle Always Free Provisionada com Êxito!
              </h3>
              <p style={{ color: '#a7f3d0', fontSize: '12px', margin: 0 }}>
                A Oracle Cloud liberou a capacidade e a sua nova máquina já está criada e em inicialização.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="primary-button"
                style={{ background: '#10b981', color: '#042116', fontWeight: 600 }}
                onClick={() => {
                  const element = document.createElement('a')
                  const file = new Blob([scraperData.successfulVm.sshPrivateKeyContent || ''], { type: 'text/plain' })
                  element.href = URL.createObjectURL(file)
                  element.download = 'cloudops_nova_vm.key'
                  document.body.appendChild(element)
                  element.click()
                  document.body.removeChild(element)
                  doAction('Chave privada SSH (.key) baixada com sucesso!')
                }}
              >
                📥 Baixar Chave Privada (.key / MobaXterm)
              </button>
            </div>
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
              <strong style={{ fontSize: '13px' }}>{scraperData.successfulVm.shapeLabel || 'ARM Ampere A1'}</strong>
            </div>
            <div>
              <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Nome da Instância</span>
              <strong>{scraperData.successfulVm.displayName}</strong>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <span style={{ color: '#6ee7b7', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Como Conectar no MobaXterm</span>
              <span style={{ fontFamily: 'monospace', color: '#a7f3d0' }}>
                Session ➔ SSH ➔ Remote host: <b>[IP_DA_VM]</b> ➔ Specify username: <b>ubuntu</b> ➔ Advanced SSH settings ➔ Use private key ➔ Selecione o arquivo <b>cloudops_nova_vm.key</b>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Terminal de Logs do Scraper em Tempo Real */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Console de Eventos do Scraper</h3>
            <p>Log detalhado das chamadas de API assinadas direto do seu Hub para a Oracle Cloud</p>
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
              O scraper está em repouso. Clique em <b>"Iniciar Robô Scraper"</b> acima para começar o monitoramento e auto-provisionamento da sua VM Always Free.
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
    </div>
  )
}
