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
              <span className="resource-number">{item.cpu}%</span>
              <span className="resource-number">{item.ram}%</span>
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
            {containers.filter(c => c.name.includes('db') || c.name.includes('mysql') || c.name.includes('backend')).map(item => (
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
            ))}
          </div>

          <button className="view-all" title="Abrir painel completo de Docker com todos os containers da VM" onClick={() => setActive('Docker')}>
            Ver todos os {containers.length} containers (incluindo Nginx e Túneis) <span>→</span>
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

          <div className="data-service">
            <span className="service-icon postgres"><Database size={16} /></span>
            <div>
              <strong>MySQL 8.0 (Container boteco_db)</strong>
              <small>Porta 3306 ➔ 3306 · Otimizado em 136 MB</small>
            </div>
            <span className="status-text emerald">Healthy</span>
          </div>

          <div className="data-service">
            <span className="service-icon managed"><Cloud size={16} /></span>
            <div>
              <strong>Oracle Object Storage</strong>
              <small>Bucket boteco-sivirino-fotos · 1.4 GB</small>
            </div>
            <span className="status-text emerald">Active</span>
          </div>

          <div className="backup-row">
            <span><Archive size={14} /> Rotina de Backup</span>
            <button title="Executar mysqldump no container boteco_db e salvar no Object Storage" onClick={() => doAction('Backup mysqldump do MySQL iniciado com sucesso!')}>
              <Copy size={13} /> Gerar Backup Agora
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
