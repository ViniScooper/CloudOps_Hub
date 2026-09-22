'use client'

import React from 'react'
import {
  MoreHorizontal, ArrowUpRight, RotateCcw, Database, Cloud, Archive, Copy, ExternalLink
} from 'lucide-react'

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
  if (!server) return null

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
                <strong style={{ color: '#ffedd5', fontSize: '13px' }}>CLOUDOPSHUB (Oracle ATP)</strong>
                <span style={{ fontSize: '10px', background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>Always Free</span>
              </div>
              <small style={{ color: '#9ca3af', display: 'block', fontSize: '11px', marginTop: '2px' }}>
                20 GB NVMe · 1 OCPU · Exadata PDB · mTLS :1522
              </small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="status-text emerald" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#20d6c7', display: 'inline-block' }}></span>
                Ativo
              </span>
              <a
                href="https://G31AC88BC331093-CLOUDOPSHUB.adb.sa-saopaulo-1.oraclecloudapps.com/ords/sql-developer"
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
                  <span><Archive size={14} /> Rotina de Backup</span>
                  <button 
                    title="Executar rotina de backup no servidor conectado" 
                    onClick={() => doAction('Rotina de snapshot de backup executada com sucesso!')}
                  >
                    <Copy size={13} /> Gerar Snapshot
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
