'use client'

import React from 'react'
import {
  Activity, Check, ChevronDown, Cpu, Globe2, HardDrive, Network, Plus, RefreshCw,
  RotateCcw, Server, Shield, Zap
} from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'
import { DashboardView } from './DashboardView'
import { ConnectorsView } from './ConnectorsView'
import { DeployView } from './DeployView'
import { EnvManagerView } from './EnvManagerView'
import { HelpView } from './HelpView'
import { OdisseuChatView } from './OdisseuChatView'
import { CloudflareTunnelView } from './CloudflareTunnelView'
import { StorageExplorerView } from './StorageExplorerView'
import { LogsTelemetryView } from './LogsTelemetryView'
import { MigrationWorkspaceView } from './MigrationWorkspaceView'
import { VercelDeploymentsView } from './VercelDeploymentsView'
import { RenderDeploymentsView } from './RenderDeploymentsView'
import { UserManagementView } from './UserManagementView'
import { SettingsView } from './SettingsView'
import { DockerView } from './DockerView'
import { NginxView } from './NginxView'
import { TerminalView } from './TerminalView'
import { VmBotsSection } from './VmBotsSection'
import { VmScraper } from './VmScraper'

function Metric({ 
  label, 
  value, 
  unit, 
  change, 
  icon: Icon, 
  tone, 
  progress,
  badge,
  actionButton
}: { 
  label: string; 
  value: string; 
  unit: string; 
  change: string; 
  icon: typeof Activity; 
  tone: string; 
  progress: number;
  badge?: React.ReactNode;
  actionButton?: React.ReactNode;
}) {
  const isResourceMetric = label !== 'Status SSH'
  const isCritical = isResourceMetric && progress >= 85
  const isWarning = isResourceMetric && progress >= 70 && progress < 85
  const dynamicColor = isCritical ? '#ff6b6b' : isWarning ? '#f59e0b' : undefined
  const statusLabel = isCritical ? 'Crítico' : isWarning ? 'Atenção' : change

  return (
    <article 
      className="metric-card" 
      style={{ 
        position: 'relative',
        borderColor: isCritical ? 'rgba(255, 107, 107, 0.5)' : isWarning ? 'rgba(245, 158, 11, 0.4)' : undefined
      }}
    >
      <div className="metric-topline">
        <span className={`metric-icon ${tone}`} style={dynamicColor ? { color: dynamicColor, background: `${dynamicColor}22` } : undefined}>
          <Icon size={16} />
        </span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="metric-value" style={isCritical ? { color: '#ff6b6b' } : undefined}>
        {value}<span>{unit}</span>
      </div>
      <div className="metric-bottom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="change positive" style={dynamicColor ? { color: dynamicColor, fontWeight: 700 } : undefined}>
            {statusLabel}
          </span>
          <span className="muted">tempo real</span>
        </div>
        {badge && (
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 7px', borderRadius: '4px', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
            {badge}
          </div>
        )}
      </div>
      <div className="progress-track">
        <div 
          className={`progress-fill ${tone}`} 
          style={{ 
            width: `${Math.min(Math.max(progress, 0), 100)}%`,
            background: dynamicColor || undefined,
            transition: 'width 0.4s ease, background 0.3s ease'
          }} 
        />
      </div>
      {actionButton && <div style={{ marginTop: '8px' }}>{actionButton}</div>}
    </article>
  )
}

export function WorkspaceViewRouter() {
  const {
    active,
    setActive,
    server,
    serverList,
    containers,
    proxyHosts,
    setProxyHosts,
    currentUser,
    setCurrentUser,
    ociCreds,
    refreshed,
    setRefreshed,
    serverMenu,
    setServerMenu,
    doAction,
    setCloudShellOpen,
    setConnectModalOpen,
    isDroppingCache,
    handleDropCaches,
    handleSwitchServer,
    handleDockerAction,
    fetchLiveContainers,
    fetchLiveSystemMetrics,
    scraperData,
    scraperLoading,
    setScraperLoading,
    isMasterUser
  } = useWorkspace()

  return (
    <div className={active === 'Odisseu AI' ? 'page-content odisseu-page-content' : 'page-content'}>
      {/* Cabeçalho do Dashboard */}
      {(active === 'Dashboard' || active === 'Recursos & VMs') && (
        <>
          <div className="page-heading">
            <div>
              <div className="eyebrow"><span className="live-dot" /> Multi-cloud command center • Zero Trust</div>
              <h1>Painel de Controle</h1>
              <p>{server ? `Conectado em ${server.name} (${server.ip}) via SSH seguro.` : 'Nenhum servidor conectado no momento. Conecte sua VM Oracle ou AWS.'}</p>
            </div>
            <div className="heading-actions">
              {server && (
                <button 
                  className={`refresh-button ${refreshed ? 'spinning' : ''}`} 
                  onClick={() => { 
                    setRefreshed(true)
                    setTimeout(() => setRefreshed(false), 700)
                    if (server) {
                      fetchLiveSystemMetrics(server)
                      fetchLiveContainers(server)
                    }
                    doAction('Telemetria atualizada') 
                  }}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
              )}
              <button className="primary-button" onClick={() => setConnectModalOpen(true)}>
                <Server size={15} /> {server ? 'Adicionar Servidor' : 'Conectar Minha VM (SSH)'}
              </button>
              <button className="refresh-button" onClick={() => setCloudShellOpen(true)} style={{ borderColor: ociCreds ? '#20d6c7' : '#182326' }}>
                <Zap size={14} style={{ color: ociCreds ? '#20d6c7' : '#6f8387' }} /> {ociCreds ? `OCI Conectado (${ociCreds.region || 'sa-saopaulo-1'})` : 'Conectar OCI (Terraform)'}
              </button>
            </div>
          </div>

          {/* Barra de contexto do servidor */}
          {server ? (
            <div className="server-switcher">
              <div className="server-context">
                <span className={`provider-mark ${server.color || 'oracle'}`}>{server.provider === 'aws' ? 'aws' : 'OC'}</span>
                <div>
                  <small>Servidor Ativo em Execução</small>
                  <strong>{server.name}</strong>
                </div>
              </div>
              <div className="server-meta">
                <span><Globe2 size={13} /> {server.region || 'sa-saopaulo-1'}</span>
                <span className="server-ip">{server.ip}</span>
                <span className="healthy-label"><span className="status-dot emerald" /> {server.status}</span>
              </div>
              {serverList.length > 1 && (
                <button className="server-select" onClick={() => setServerMenu(!serverMenu)} aria-label="Trocar servidor">
                  <span>Trocar VM ({serverList.length})</span><ChevronDown size={15} />
                </button>
              )}
              {serverMenu && (
                <div className="server-menu">
                  {serverList.map(item => (
                    <button key={item.id} onClick={() => handleSwitchServer(item)}>
                      <span className="provider-mark small oracle">OC</span>
                      <span><b>{item.name}</b><small>{item.region} · {item.ip}</small></span>
                      {item.id === server.id && <Check size={15} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="step-box" style={{ padding: '24px', textAlign: 'center', borderColor: '#20d6c744', marginBottom: '20px' }}>
              <Server size={32} style={{ color: '#20d6c7', margin: '0 auto 10px' }} />
              <h3 style={{ color: '#d9e2e1', margin: '0 0 6px', fontSize: '15px' }}>Nenhum servidor conectado</h3>
              <p style={{ color: '#6f8387', fontSize: '11px', margin: '0 0 16px' }}>Conecte sua VM da Oracle Cloud inserindo o IP e a sua chave privada SSH para liberar métricas ao vivo, Docker e Nginx.</p>
              <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                <Plus size={14} /> Conectar Minha Primeira VM
              </button>
            </div>
          )}

          {/* Métricas ao vivo */}
          {server && (
            <div className="metrics-grid">
              <Metric label="CPU usage" value={String(server.cpu || '0').replace('%', '')} unit="%" change="Normal" icon={Activity} tone="indigo" progress={Number.parseInt(String(server.cpu || '0').replace('%', '')) || 0} />
              <Metric 
                label="Memory (RAM)" 
                value={server.ramUsed || '420'} 
                unit={`MB / ${server.ramTotal || '956'} MB`} 
                change={`${String(server.ram || '44').replace('%', '')}%`} 
                icon={Server} 
                tone="violet" 
                progress={Number.parseInt(String(server.ram || '44').replace('%', '')) || 0} 
                badge={`Cache: ${server.cachePct || '24'}% (${server.cacheUsed || '226'} MB)`}
                actionButton={
                  <button
                    type="button"
                    title="Limpa buffers e caches inativos da memória do Linux (drop_caches) sem parar nenhum serviço"
                    onClick={handleDropCaches}
                    disabled={isDroppingCache}
                    style={{
                      background: isDroppingCache ? 'rgba(32, 214, 199, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.35)',
                      color: '#c084fc',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: isDroppingCache ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Zap size={11} className={isDroppingCache ? 'animate-pulse' : ''} />
                    {isDroppingCache ? 'Liberando...' : 'Liberar Cache'}
                  </button>
                }
              />
              <Metric label="Disk NVMe" value={server.diskUsed || '0'} unit={`GB / ${server.diskTotal || '45'} GB`} change={`${String(server.disk || '0').replace('%', '')}%`} icon={HardDrive} tone="amber" progress={Number.parseInt(String(server.disk || '0').replace('%', '')) || 0} />
              <Metric label="Status SSH" value="100" unit="% Ativo" change="Porta 22" icon={Network} tone="emerald" progress={100} />
            </div>
          )}
        </>
      )}

      {/* Roteamento das Abas */}
      {server && active === 'Dashboard' && (
        <>
          <DashboardView
            key={`dash-${server.id || server.ip}`}
            server={server}
            currentUser={currentUser}
            serverList={serverList}
            containers={containers}
            setServer={handleSwitchServer}
            setActive={setActive}
            doAction={doAction}
          />
          <TerminalView 
            key={`term-dash-${server.id || server.ip}`}
            server={server}
            isFullTab={false}
            doAction={doAction}
            setConnectModalOpen={setConnectModalOpen}
          />
        </>
      )}

      {active === 'Conectores Hub' && (
        <ConnectorsView key={`connectors-${server?.id || server?.ip || 'none'}`} />
      )}

      {active === 'Odisseu AI' && (
        <OdisseuChatView key={`odisseu-${server?.id || server?.ip || 'none'}`} server={server} doAction={doAction} />
      )}

      {(active === 'VM Scraper' || active === 'Robôs & Bots da VM') && (
        isMasterUser ? (
          <div key={`bots-wrap-${server?.id || server?.ip || 'none'}`} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {server && (
              <VmBotsSection
                key={`bots-sec-${server.id || server.ip}`}
                server={server}
                doAction={doAction}
                onOpenScraperModal={() => {}}
              />
            )}
            <VmScraper
              key={`scraper-${server?.id || server?.ip || 'none'}`}
              scraperData={scraperData}
              scraperLoading={scraperLoading}
              doAction={doAction}
              setScraperLoading={setScraperLoading}
              server={server}
            />
          </div>
        ) : (
          <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
              <Cpu size={28} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#edf4f2' }}>Módulo de Automação & Scrapers</h3>
            <p style={{ margin: '0 auto 20px', fontSize: '13px', color: '#8fa4a8', maxWidth: '520px', lineHeight: 1.6 }}>
              Esta seção é dedicada a nós trabalhadores e automações autônomas 24/7. Cadastre seus próprios robôs de automação usando a aba <b>Terminal</b> ou <b>Deploy</b> da sua VM.
            </p>
          </div>
        )
      )}

      {active === 'Deploy' && (
        <DeployView key={`deploy-${server?.id || server?.ip || 'none'}`} server={server} currentUser={currentUser} doAction={doAction} />
      )}

      {active === 'Monitoramento & Logs' && (
        <LogsTelemetryView key={`logs-${server?.id || server?.ip || 'none'}`} server={server} doAction={doAction} />
      )}

      {active === 'Vercel Frontend' && (
        <VercelDeploymentsView 
          key={`vercel-${server?.id || server?.ip || 'none'}`}
          server={server} 
          currentUser={currentUser}
          doAction={doAction} 
          onSwitchServer={() => handleSwitchServer(serverList[0])}
        />
      )}

      {active === 'Render Backend' && (
        <RenderDeploymentsView 
          key={`render-${server?.id || server?.ip || 'none'}`}
          server={server} 
          currentUser={currentUser}
          doAction={doAction} 
        />
      )}

      {active === 'Migração Multi-Cloud' && (
        <MigrationWorkspaceView key={`migration-${server?.id || server?.ip || 'none'}`} server={server} doAction={doAction} />
      )}

      {(active === 'Cofre & Variáveis' || active === 'Variáveis (.env)') && (
        <EnvManagerView key={`env-${server?.id || server?.ip || 'none'}`} server={server} currentUser={currentUser} doAction={doAction} />
      )}

      {(active === 'Usuários & Aprovações' || active === 'Aprovações & Usuários') && (
        <UserManagementView doAction={doAction} />
      )}

      {active === 'Configurações' && (
        <SettingsView 
          currentUser={currentUser} 
          setCurrentUser={setCurrentUser}
          doAction={doAction} 
        />
      )}

      {active === 'Ajuda & Guia' && (
        <HelpView onNavigate={(tab: string) => setActive(tab)} />
      )}

      {active === 'Docker' && (
        <DockerView
          key={`docker-${server?.id || server?.ip || 'none'}`}
          server={server}
          containers={containers}
          fetchLiveContainers={fetchLiveContainers}
          handleDockerAction={handleDockerAction}
          doAction={doAction}
          setConnectModalOpen={setConnectModalOpen}
        />
      )}

      {active === 'Nginx' && (
        <NginxView
          key={`nginx-${server?.id || server?.ip || 'none'}`}
          server={server}
          proxyHosts={proxyHosts}
          setProxyHosts={setProxyHosts}
          doAction={doAction}
          setConnectModalOpen={setConnectModalOpen}
        />
      )}

      {active === 'Tunnels' && (
        server ? (
          <CloudflareTunnelView key={`tunnels-${server.id || server.ip}`} server={server} doAction={doAction} />
        ) : (
          <div>
            <div className="section-heading">
              <div>
                <h2>Cloudflare Zero Trust Tunnels</h2>
                <p>Rotas seguras de borda sem portas abertas na VM.</p>
              </div>
            </div>
            <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
                <Shield size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
              <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
                Conecte sua VM da Oracle Cloud para gerenciar seus túneis ativos e apontamentos DNS com segurança militar.
              </p>
              <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                <Server size={15} /> Conectar Minha VM (SSH)
              </button>
            </div>
          </div>
        )
      )}

      {active === 'Storage' && (
        server ? (
          <StorageExplorerView key={`storage-${server.id || server.ip}`} server={server} doAction={doAction} />
        ) : (
          <div>
            <div className="section-heading">
              <div>
                <h2>Armazenamento de Objetos (Buckets OCI)</h2>
                <p>Nuvem de dados, backups e arquivos públicos de mídia.</p>
              </div>
            </div>
            <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
                <HardDrive size={28} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
              <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
                Conecte sua conta para explorar buckets, fazer upload de imagens e gerenciar backups criptografados.
              </p>
              <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
                <Server size={15} /> Conectar Minha VM (SSH)
              </button>
            </div>
          </div>
        )
      )}

      {active === 'Terminal' && (
        <TerminalView
          key={`term-full-${server?.id || server?.ip || 'none'}`}
          server={server}
          isFullTab={true}
          doAction={doAction}
          setConnectModalOpen={setConnectModalOpen}
        />
      )}

      {active === 'Dashboard' && (
        <div className="bottom-strip">
          <div><Check size={16} /><span>{server ? 'Servidor conectado e túnel seguro ativo' : 'Aguardando conexão com servidor'}</span></div>
          <span>{server ? 'Verificado há 12 segundos' : 'Status: Offline'}</span>
          <div className="secure">
            <Server size={14} /> {serverList.length} servidor(es) conectado(s) 
            {server && <button title="Reiniciar agentes de coleta de métricas" onClick={() => doAction('Agentes de telemetria reiniciados com sucesso')}><RotateCcw size={13} /> Reiniciar agentes</button>}
          </div>
        </div>
      )}
    </div>
  )
}
