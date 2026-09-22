'use client'

import React from 'react'
import {
  MoreHorizontal, ArrowUpRight, RotateCcw, Database, Cloud, Archive, Copy
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
              <p>Estado de bancos e backups</p>
            </div>
            <Database size={18} className="database-icon" />
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
                    <div className="data-service" key={c.name}>
                      <span className="service-icon postgres"><Database size={16} /></span>
                      <div>
                        <strong>{c.name.toUpperCase()} ({c.image})</strong>
                        <small>Porta {c.port || 'Padrão'} · Status: {c.status || 'Rodando'}</small>
                      </div>
                      <span className="status-text emerald">Healthy</span>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '20px 16px', textAlign: 'center', color: '#6f8387' }}>
                    <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.05)', marginBottom: '8px', color: '#20d6c7' }}>
                      <Database size={20} />
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#d9e2e1', fontWeight: 600 }}>Nenhum Banco Detectado</p>
                    <small style={{ fontSize: '11px', color: '#6f8387', display: 'block', marginBottom: '12px' }}>Nenhum container MySQL, Postgres ou Redis rodando nesta VM.</small>
                    <button 
                      className="primary-button" 
                      style={{ fontSize: '11px', padding: '5px 12px', margin: '0 auto' }}
                      onClick={() => setActive('Docker')}
                    >
                      Provisionar via Docker
                    </button>
                  </div>
                )}

                <div className="data-service" style={{ marginTop: '10px' }}>
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
