'use client'

import React from 'react'
import {
  MoreHorizontal, ArrowUpRight, RotateCcw, Database, Cloud, Archive, Copy, ExternalLink, Server, ShieldCheck
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface DashboardViewProps {
  server: any
  serverList: any[]
  containers: any[]
  setServer: (server: any) => void
  setActive: (tab: string) => void
  doAction: (msg: string) => void
}

export function DashboardView({
  server,
  serverList,
  containers,
  setServer,
  setActive,
  doAction
}: DashboardViewProps) {
  if (!server) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 24px',
        background: 'linear-gradient(180deg, rgba(16, 28, 32, 0.6) 0%, rgba(7, 14, 17, 0.8) 100%)',
        borderRadius: '16px',
        border: '1px dashed rgba(32, 214, 199, 0.3)',
        marginTop: '20px'
      }}>
        <div style={{
          display: 'inline-flex',
          padding: '16px',
          borderRadius: '50%',
          background: 'rgba(32, 214, 199, 0.1)',
          color: '#20d6c7',
          marginBottom: '16px'
        }}>
          <Server size={36} />
        </div>
        <h2 style={{ fontSize: '20px', color: '#f0fdfa', margin: '0 0 8px', fontWeight: 600 }}>
          Nenhum Servidor Conectado
        </h2>
        <p style={{ fontSize: '13px', color: '#829396', maxWidth: '460px', margin: '0 auto 24px', lineHeight: 1.5 }}>
          Seu ambiente está limpo e pronto. Conecte sua máquina virtual (Oracle Cloud, AWS EC2, DigitalOcean ou VPS própria) via SSH para começar a monitorar telemetria, gerenciar Docker e criar túneis de borda.
        </p>
        <button
          className="primary-button"
          style={{ padding: '10px 20px', fontSize: '13px', margin: '0 auto' }}
          onClick={() => doAction('Abra o menu superior para conectar uma VM')}
        >
          + Conectar Minha Primeira VM / VPS (SSH)
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Infraestrutura Conectada</h2>
          <p>Servidores monitorados em tempo real na nuvem.</p>
        </div>
        <span className="updated">
          <span className="live-dot" /> Atualizado agora mesmo
        </span>
      </div>

      <section className="panel resource-panel">
        <div className="panel-header">
          <div>
            <h3>Instâncias e Nós Cloud</h3>
            <p>{serverList.length} servidor(es) conectado(s) · {containers.length} containers ativos</p>
          </div>
          <button className="panel-menu" onClick={() => doAction('Visualizando nós')} aria-label="Mais opções">
            <MoreHorizontal size={18} />
          </button>
        </div>

        <div className="resource-table">
          <div className="resource-table-head">
            <span>Resource</span>
            <span>Provider / region</span>
            <span>Type</span>
            <span>CPU</span>
            <span>Memory</span>
            <span>Status</span>
            <span />
          </div>

          {serverList.map(item => (
            <div className={`resource-row ${item.id === server.id ? 'selected' : ''}`} key={item.id}>
              <div className="resource-name">
                <span className="provider-mark small oracle">OC</span>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.ip}</small>
                </span>
              </div>
              <span className="resource-provider">
                {item.provider}
                <small>{item.region}</small>
              </span>
              <span className="resource-type">{item.type}</span>
              <span className="resource-number">{String(item.cpu || '0').replace('%', '')}%</span>
              <span className="resource-number">{String(item.ram || '0').replace('%', '')}%</span>
              <span className="resource-status good">
                <span className="status-dot emerald" />
                {item.status}
              </span>
              <button 
                className="row-menu" 
                onClick={() => { setServer(item); doAction(`Selecionado: ${item.name}`) }} 
                aria-label={`Abrir ${item.name}`}
              >
                <ArrowUpRight size={15} />
              </button>
            </div>
          ))}
        </div>

        <button className="view-all" onClick={() => setActive('Docker')}>
          Ver todos os containers e serviços <span>→</span>
        </button>
      </section>

      <div className="section-heading lower-heading">
        <div>
          <h2>Bancos de Dados & Armazenamento</h2>
          <p>MySQL 8.0, dumps contínuos e Oracle Cloud Object Storage.</p>
        </div>
        <button className="text-action" title="Ir para o gerenciamento de buckets do Oracle Object Storage" onClick={() => setActive('Storage')}>
          Gerenciar Buckets <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="overview-grid lower-grid">
        <section className="panel containers-panel">
          <div className="panel-header">
            <div>
              <h3>Bancos de Dados & Backend ({server.name})</h3>
              <p>Containers de banco de dados e serviços ativos</p>
            </div>
            <button className="panel-menu" title="Ver todos os containers no gerenciador Docker" onClick={() => setActive('Docker')} aria-label="Mais opções">
              <MoreHorizontal size={18} />
            </button>
          </div>

          <div className="container-list">
            {containers.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6f8387' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#d9e2e1', fontWeight: 600 }}>Nenhum container Docker ativo</p>
                <small style={{ fontSize: '11px', color: '#6f8387' }}>Esta VM é nova e virgem. Instale o Docker ou faça deploy de novos serviços pelo Hub.</small>
              </div>
            ) : (
              containers.filter(c => c.name.includes('db') || c.name.includes('mysql') || c.name.includes('backend')).map(item => (
                <div className="container-row" key={item.name}>
                  <span className={`status-dot ${item.color || 'emerald'}`} />
                  <div className="container-info">
                    <strong>{item.name}</strong>
                    <small>{item.image} · Porta {item.port}</small>
                  </div>
                  <span className={`status-text ${item.color || 'emerald'}`}>{item.status}</span>
                  <div className="container-stats">
                    <span><b>{item.cpu || '0%'}</b><small>CPU</small></span>
                    <span><b>{item.memory || '0 MB'}</b><small>RAM</small></span>
                  </div>
                  <button className="row-menu" title={`Reiniciar container ${item.name}`} onClick={() => doAction(`Reiniciando container ${item.name}...`)} aria-label={`Opções de ${item.name}`}>
                    <RotateCcw size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <button className="view-all" title="Abrir painel completo de Docker com todos os containers da VM" onClick={() => setActive('Docker')}>
            {containers.length === 0 ? 'Gerenciar Docker nesta VM' : `Ver todos os ${containers.length} containers (incluindo Nginx e Túneis)`} <span>→</span>
          </button>
        </section>
        
        <section className="panel database-card">
          <div className="panel-header">
            <div>
              <h3>Serviços de Dados & DBA</h3>
              <p>Bancos Gerenciados OCI & Containers Locais</p>
            </div>
            <Database size={18} className="database-icon" />
          </div>

          {/* Banco de Dados em Nuvem: Oracle Autonomous Database (ATP) */}
          <div className="data-service" style={{ border: '1px solid rgba(249, 115, 22, 0.3)', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(13, 20, 24, 0.6) 100%)', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px' }}>
            <span className="service-icon" style={{ background: 'rgba(249, 115, 22, 0.2)', color: '#f97316' }}>
              <Database size={16} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <strong style={{ color: '#ffedd5', fontSize: '13px' }}>bancodedadosfinancas (Oracle ATP)</strong>
                <span style={{ fontSize: '10px', background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Always Free</span>
              </div>
              <small style={{ color: '#9ca3af', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                Always Free OCI · Oracle Autonomous Transaction Processing · REST Data Services (ORDS)
              </small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-text emerald" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#20d6c7', display: 'inline-block' }}></span>
                Ativo & Gerenciado
              </span>
              <a
                href="https://g442b32fb1cf117-bancodedadosfinancas.adb.sa-saopaulo-1.oraclecloudapps.com/ords/sql-developer"
                target="_blank"
                rel="noreferrer"
                className="action-btn"
                style={{
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: '#fb923c',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  textDecoration: 'none',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                title="Abrir Oracle Database Actions / SQL Developer Web"
              >
                SQL Web <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {(() => {
            const dbContainers = containers.filter(c => 
              c.name.includes('db') || 
              c.name.includes('mysql') || 
              c.name.includes('postgres') || 
              c.name.includes('redis') || 
              c.name.includes('mongo')
            )

            return (
              <>
                {dbContainers.length > 0 ? (
                  dbContainers.map(c => (
                    <div className="data-service" key={c.name} style={{ marginBottom: '8px' }}>
                      <span className="service-icon postgres"><Database size={16} /></span>
                      <div style={{ flex: 1 }}>
                        <strong>{c.name.toUpperCase()} ({c.image})</strong>
                        <small>Porta {c.port || 'Padrão'} · Docker Local na VM</small>
                      </div>
                      <span className="status-text emerald">Healthy</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '8px 12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px', marginBottom: '8px', border: '1px dashed rgba(255, 255, 255, 0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: '#829396' }}>
                      Nenhum container MySQL/Postgres local rodando nesta VM ({server.name}).
                    </span>
                    <button 
                      className="text-link" 
                      style={{ fontSize: '11px', color: '#20d6c7', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                      onClick={() => setActive('Docker')}
                    >
                      + Docker DB
                    </button>
                  </div>
                )}

                <div className="data-service" style={{ marginTop: '6px' }}>
                  <span className="service-icon managed"><Cloud size={16} /></span>
                  <div>
                    <strong>Cloud Object Storage</strong>
                    <small>OCI / AWS S3 Backup Pipeline</small>
                  </div>
                  <span className="status-text emerald">Pronto</span>
                </div>

                <div className="backup-row">
                  <span><Archive size={14} /> Rotina de Backup (.sql.gz)</span>
                  <button 
                    title="Executar backup do banco MySQL agora e compactar em .sql.gz" 
                    onClick={async () => {
                      doAction('Iniciando dump do MySQL boteco_db e compactação gzip...')
                      try {
                        const res = await fetch(getApiUrl('/api/backups/create'), { method: 'POST' })
                        const data = await res.json()
                        if (data.success) {
                          doAction(`✅ Snapshot gerado com sucesso: ${data.filename}! Salvo na VM.`)
                        } else {
                          doAction(`Aviso: ${data.error || 'Falha no dump'}`)
                        }
                      } catch (err: any) {
                        doAction(`Erro ao gerar backup: ${err.message}`)
                      }
                    }}
                  >
                    <Copy size={13} /> Gerar Snapshot Agora
                  </button>
                </div>

                {/* Card do Guardião Watchdog 24/7 */}
                <div className="data-service" style={{ marginTop: '10px', borderLeft: '3px solid #10b981', background: 'rgba(16, 185, 129, 0.05)', padding: '10px 12px' }}>
                  <span className="service-icon managed" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                    <ShieldCheck size={16} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ color: '#f0fdfa', fontSize: '11.5px' }}>Guardião Watchdog 24/7</strong>
                      <span style={{ fontSize: '8.5px', fontWeight: 800, padding: '1px 5px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                        ATIVO (3M)
                      </span>
                    </div>
                    <small style={{ color: '#829d9c', fontSize: '10px', display: 'block', marginTop: '2px' }}>
                      Vigiando RAM &gt; 90% e auto-cura de containers via WhatsApp
                    </small>
                  </div>
                  <button
                    type="button"
                    title="Dispara um alerta de teste real para o WhatsApp de Vinicius"
                    onClick={async () => {
                      doAction('Disparando alerta de teste no WhatsApp (CallMeBot)...')
                      try {
                        const res = await fetch(getApiUrl('/api/watchdog/test-alert'), { method: 'POST' })
                        const data = await res.json()
                        if (data.success) {
                          doAction('✅ Alerta de teste enviado com sucesso para o WhatsApp!')
                        } else {
                          doAction(`Aviso: ${data.error || 'Falha ao enviar'}`)
                        }
                      } catch (e: any) {
                        doAction(`Erro no teste: ${e.message}`)
                      }
                    }}
                    style={{
                      background: 'rgba(32, 214, 199, 0.1)',
                      border: '1px solid rgba(32, 214, 199, 0.3)',
                      color: '#20d6c7',
                      borderRadius: '5px',
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '4px 8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    🧪 Testar WhatsApp
                  </button>
                </div>
              </>
            )
          })()}
        </section>
      </div>
    </>
  )
}
