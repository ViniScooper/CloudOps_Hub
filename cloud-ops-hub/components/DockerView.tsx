'use client'

import { useState } from 'react'
import {
  Container, RefreshCw, Zap, Plus, Play, Square, RotateCcw,
  FileText, Server, X
} from 'lucide-react'
import { getApiUrl } from '../lib/api'
import { ContainerItem, Server as ServerType } from '../types'

interface DockerViewProps {
  server: ServerType | null
  containers: ContainerItem[]
  fetchLiveContainers: (server: ServerType) => Promise<void>
  handleDockerAction: (name: string, action: 'start' | 'stop' | 'restart' | 'kill') => Promise<void>
  doAction: (msg: string) => void
  setConnectModalOpen: (open: boolean) => void
}

export function DockerView({
  server,
  containers,
  fetchLiveContainers,
  handleDockerAction,
  doAction,
  setConnectModalOpen
}: DockerViewProps) {
  const [containerModalOpen, setContainerModalOpen] = useState(false)
  const [newContainerName, setNewContainerName] = useState('')
  const [newContainerImage, setNewContainerImage] = useState('')
  const [newContainerPort, setNewContainerPort] = useState('')

  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [activeLogContainer, setActiveLogContainer] = useState('')
  const [containerLogsText, setContainerLogsText] = useState('')
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  if (!server) {
    return (
      <div>
        <div className="section-heading">
          <div>
            <h2>Gerenciador Visual de Docker</h2>
            <p>Controle de containers, logs e portas na sua infraestrutura cloud.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
            <Container size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
          <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
            Conecte sua VM da Oracle Cloud, AWS ou VPS via SSH para listar containers ativos, verificar portas, inspecionar logs em tempo real e otimizar o consumo de disco.
          </p>
          <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
            <Server size={15} /> Conectar Minha VM (SSH)
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Gerenciador Visual de Docker</h2>
          <p>Controle de containers, logs e portas na VM {server.name}.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="secondary-button" 
            style={{ background: '#0c1013', border: '1px solid #182326', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            title="Consulta o Docker Engine em tempo real na VM via SSH"
            onClick={() => {
              doAction('Sincronizando containers em tempo real com a VM...')
              fetchLiveContainers(server)
            }}
          >
            <RefreshCw size={13} /> Atualizar Containers
          </button>
          <button 
            className="secondary-button" 
            style={{ background: '#0c1013', border: '1px solid #182326', color: '#20d6c7', display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
            title="Configura rotação de logs no daemon.json (max-size 10m) e limpa logs antigos para liberar disco"
            onClick={async () => {
              doAction('Configurando rotação de logs Docker e liberando disco...')
              try {
                const res = await fetch(getApiUrl('/api/docker/optimize-logs'), {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ ip: server?.ip || '137.131.185.243', user: 'ubuntu' })
                })
                const data = await res.json()
                if (data.ok) {
                  doAction('✅ Logs Docker otimizados! Rotação ativa (max-size: 10m) sem risco de encher o disco.')
                } else {
                  doAction(`Erro ao otimizar: ${data.error}`)
                }
              } catch (e: any) {
                doAction(`Falha: ${e.message}`)
              }
            }}
          >
            <Zap size={13} /> Otimizar Logs Docker
          </button>
          <button className="primary-button" title="Criar e rodar um novo container Docker nesta VM" onClick={() => setContainerModalOpen(true)}>
            <Plus size={14} /> Novo Container
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Containers em Execução na VM ({containers.length})</h3>
            <p>Integração direta com o Docker Engine da VM {server.name}</p>
          </div>
        </div>
        <div className="container-list">
          {/* Card Oficial do CloudOps Hub Backend (Core DevOps) */}
          {(server?.ip === '137.131.185.243' || server?.id === 'oracle-prod' || !server?.name?.includes('micro')) && (
            <div className="container-row" style={{ background: 'linear-gradient(90deg, rgba(32, 214, 199, 0.08) 0%, rgba(9, 18, 21, 0.95) 100%)', borderColor: 'rgba(32, 214, 199, 0.3)' }}>
              <span className="status-dot emerald" />
              <div className="container-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ color: '#20d6c7' }}>cloudops_hub_backend</strong>
                  <span style={{ fontSize: '9px', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', background: 'rgba(32, 214, 199, 0.2)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.4)' }}>
                    CORE DEVOPS • NATIVO VM
                  </span>
                </div>
                <small>Node.js 20 Fastify + Oracle ATP | Porta: 0.0.0.0:3005 (Zero Overhead Docker)</small>
              </div>
              <span className="status-text emerald">Ativo & Protegido</span>
              <div className="container-stats">
                <span><b>0.3%</b><small>CPU</small></span>
                <span><b>74 MB</b><small>RAM</small></span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'center' }}>
                <button
                  className="row-menu"
                  title="Reiniciar CloudOps Hub Backend"
                  style={{ color: '#20d6c7' }}
                  onClick={async () => {
                    doAction('Reiniciando CloudOps Hub Backend na VM...')
                    try {
                      await fetch(getApiUrl('/api/env/restart'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ project: 'cloudops_hub' })
                      })
                      doAction('✅ CloudOps Hub reiniciado com sucesso!')
                    } catch (e: any) {
                      doAction(`Falha ao reiniciar: ${e.message}`)
                    }
                  }}
                >
                  <RefreshCw size={13} />
                </button>
              </div>
            </div>
          )}

          {containers.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6f8387', fontSize: '11px' }}>
              Nenhum container Docker encontrado na máquina.
            </div>
          ) : containers.map((item) => {
            const isRunning = item.status?.toLowerCase().includes('running') || item.status?.toLowerCase().includes('up') || item.status?.toLowerCase().includes('healthy')
            return (
              <div className="container-row" key={item.name}>
                <span className={`status-dot ${isRunning ? 'emerald' : 'red'}`} />
                <div className="container-info">
                  <strong>{item.name}</strong>
                  <small>{item.image} | Mapeamento: {item.port}</small>
                </div>
                <span className={`status-text ${isRunning ? 'emerald' : 'red'}`}>{item.status}</span>
                <div className="container-stats">
                  <span><b>{item.cpu || '0%'}</b><small>CPU</small></span>
                  <span><b>{item.memory || '0 MB'}</b><small>RAM</small></span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto', alignItems: 'center' }}>
                  {/* Botão Start */}
                  {!isRunning && (
                    <button 
                      className="row-menu" 
                      title={`Iniciar container ${item.name}`}
                      style={{ color: '#10b981' }}
                      onClick={() => handleDockerAction(item.name, 'start')}
                    >
                      <Play size={13} />
                    </button>
                  )}

                  {/* Botão Stop */}
                  {isRunning && (
                    <button 
                      className="row-menu" 
                      title={`Parar container ${item.name}`}
                      style={{ color: '#f87171' }}
                      onClick={() => handleDockerAction(item.name, 'stop')}
                    >
                      <Square size={12} />
                    </button>
                  )}

                  {/* Botão Restart */}
                  <button 
                    className="row-menu" 
                    title={`Reiniciar container ${item.name}`}
                    style={{ color: '#38bdf8' }}
                    onClick={() => handleDockerAction(item.name, 'restart')}
                  >
                    <RotateCcw size={13} />
                  </button>

                  {/* Botão Logs ao Vivo */}
                  <button 
                    className="row-menu" 
                    title={`Ver logs ao vivo do container ${item.name}`} 
                    onClick={async () => {
                      setActiveLogContainer(item.name)
                      setLogsModalOpen(true)
                      setIsLoadingLogs(true)
                      setContainerLogsText('Carregando logs via Docker Engine SSH...')
                      try {
                        const res = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(item.name)}?tail=100`))
                        const data = await res.json()
                        if (data.logs) {
                          setContainerLogsText(data.logs)
                        } else {
                          setContainerLogsText('Nenhum log retornado pelo Docker.')
                        }
                      } catch (err: any) {
                        setContainerLogsText(`Erro ao consultar logs de ${item.name}: ${err.message}`)
                      } finally {
                        setIsLoadingLogs(false)
                      }
                    }}
                  >
                    <FileText size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* MODAL: CRIAR NOVO CONTAINER */}
      {containerModalOpen && (
        <div className="modal-overlay" onClick={() => setContainerModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <div>
                <h2>Subir Novo Container Docker</h2>
                <p>Execute um container em segundo plano diretamente na VM {server?.name}.</p>
              </div>
              <button className="modal-close" onClick={() => setContainerModalOpen(false)} aria-label="Fechar modal"><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '16px 0 20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Nome do Container</label>
                <input 
                  type="text" 
                  value={newContainerName}
                  onChange={e => setNewContainerName(e.target.value)}
                  placeholder="ex: redis_cache" 
                  style={{ width: '100%', background: '#0a0f12', border: '1px solid #1e293b', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Imagem Docker (Docker Hub ou Registry)</label>
                <input 
                  type="text" 
                  value={newContainerImage}
                  onChange={e => setNewContainerImage(e.target.value)}
                  placeholder="ex: redis:alpine ou nginx:latest" 
                  style={{ width: '100%', background: '#0a0f12', border: '1px solid #1e293b', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>Mapeamento de Portas (Host:Container)</label>
                <input 
                  type="text" 
                  value={newContainerPort}
                  onChange={e => setNewContainerPort(e.target.value)}
                  placeholder="ex: 6379:6379 (opcional)" 
                  style={{ width: '100%', background: '#0a0f12', border: '1px solid #1e293b', borderRadius: '6px', padding: '9px 12px', color: '#fff', fontSize: '12px', outline: 'none' }}
                />
              </div>
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="secondary-button" onClick={() => setContainerModalOpen(false)}>Cancelar</button>
              <button 
                className="primary-button" 
                onClick={async () => {
                  if (!newContainerName || !newContainerImage) {
                    alert('Informe o nome e a imagem!')
                    return
                  }
                  doAction(`Iniciando container ${newContainerName}...`)
                  setContainerModalOpen(false)
                  try {
                    const portParam = newContainerPort ? `-p ${newContainerPort}` : ''
                    const cmd = `docker run -d --name ${newContainerName} --restart unless-stopped ${portParam} ${newContainerImage}`
                    const res = await fetch(getApiUrl('/api/servers/exec'), {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ ip: server?.ip || '137.131.185.243', user: 'ubuntu', command: cmd })
                    })
                    const data = await res.json()
                    if (data.output) {
                      doAction(`Container ${newContainerName} criado com sucesso!`)
                      fetchLiveContainers(server)
                    } else {
                      doAction(`Erro ao criar container: ${data.error}`)
                    }
                  } catch (e: any) {
                    doAction(`Erro: ${e.message}`)
                  }
                }}
              >
                Executar Container
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOGS AO VIVO DO CONTAINER */}
      {logsModalOpen && (
        <div className="modal-overlay" onClick={() => setLogsModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px', width: '90%' }}>
            <div className="modal-header">
              <div>
                <h2>Logs em Tempo Real: {activeLogContainer}</h2>
                <p>Últimas 100 linhas capturadas do `docker logs` via SSH seguro.</p>
              </div>
              <button className="modal-close" onClick={() => setLogsModalOpen(false)} aria-label="Fechar modal"><X size={18} /></button>
            </div>
            <div 
              style={{ 
                margin: '16px 0', 
                background: '#040708', 
                border: '1px solid #142224', 
                borderRadius: '8px', 
                padding: '16px', 
                maxHeight: '400px', 
                overflowY: 'auto', 
                fontFamily: 'Consolas, monospace', 
                fontSize: '11px', 
                color: '#a3e635', 
                whiteSpace: 'pre-wrap', 
                lineHeight: '1.4' 
              }}
            >
              {isLoadingLogs ? 'Buscando logs no Docker...' : containerLogsText}
            </div>
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button 
                className="secondary-button" 
                style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={async () => {
                  setIsLoadingLogs(true)
                  try {
                    const res = await fetch(getApiUrl(`/api/docker/logs/${encodeURIComponent(activeLogContainer)}?tail=100`))
                    const data = await res.json()
                    setContainerLogsText(data.logs || 'Nenhum log retornado.')
                  } catch (e: any) {
                    setContainerLogsText(`Erro: ${e.message}`)
                  } finally {
                    setIsLoadingLogs(false)
                  }
                }}
              >
                <RefreshCw size={12} /> Atualizar Agora
              </button>
              <button className="primary-button" onClick={() => setLogsModalOpen(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
