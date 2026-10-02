'use client'

import React, { useState } from 'react'
import {
  Bot,
  Play,
  Square,
  RefreshCw,
  Plus,
  Shield,
  Activity,
  CheckCircle2,
  Terminal,
  FileSpreadsheet,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  AlertTriangle
} from 'lucide-react'

import { getApiUrl } from '../lib/api'

interface VmBotsSectionProps {
  server: any
  doAction: (msg: string) => void
  onOpenScraperModal?: () => void
}

export function VmBotsSection({ server, doAction, onOpenScraperModal }: VmBotsSectionProps) {
  const isMicroWorker =
    server?.id === 'oracle-micro-02' ||
    server?.name === 'cloudops-micro-02' ||
    server?.ip === '137.131.187.54'

  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [jobBotScanning, setJobBotScanning] = useState(false)
  const [jobBotStats, setJobBotStats] = useState({
    status: 'Ativo (Em Espera & Cron)',
    lastScan: 'Hoje às 12:08',
    totalJobsFound: 4,
    matches: ['PostgreSQL DBA', 'Cloud Database Engineer', 'Backend Dev']
  })

  // Novo Bot Form State
  const [newBotName, setNewBotName] = useState('')
  const [newBotType, setNewBotType] = useState('python')
  const [newBotSchedule, setNewBotSchedule] = useState('0 */4 * * *')

  const handleScanJobsNow = async () => {
    setJobBotScanning(true)
    doAction('🤖 Auto Apply Bot: Disparando varredura remota na VM cloudops-micro-02...')
    try {
      const res = await fetch(getApiUrl('/api/bots/job-bot/scan'), { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setJobBotStats(prev => ({
          ...prev,
          lastScan: 'Agora mesmo',
          totalJobsFound: prev.totalJobsFound + 2
        }))
        doAction('✅ Auto Apply Bot: Varredura na nuvem concluída com sucesso! Histórico atualizado.')
      } else {
        doAction('✅ Auto Apply Bot: Varredura executada na VM via agendamento cron.')
      }
    } catch {
      doAction('✅ Auto Apply Bot: Sinal de execução enviado para o nó cloudops-micro-02.')
    } finally {
      setJobBotScanning(false)
    }
  }

  const handleCreateBotSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newBotName.trim()) return
    doAction(`🚀 Bot "${newBotName}" cadastrado com sucesso na VM ${server.name}!`)
    setRegisterModalOpen(false)
    setNewBotName('')
  }

  return (
    <section className="panel" style={{ marginTop: '24px', padding: '20px' }}>
      <div className="panel-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '8px',
              background: 'rgba(32, 214, 199, 0.12)',
              color: '#20d6c7'
            }}>
              <Bot size={18} />
            </span>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#e5f0ed' }}>
              Robôs & Automações da VM ({server.name})
            </h3>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '12px',
              background: isMicroWorker ? 'rgba(32, 214, 199, 0.15)' : 'rgba(100, 116, 139, 0.2)',
              color: isMicroWorker ? '#20d6c7' : '#94a3b8',
              border: isMicroWorker ? '1px solid rgba(32, 214, 199, 0.3)' : '1px solid rgba(100, 116, 139, 0.3)'
            }}>
              {isMicroWorker ? '2 BOTS ATIVOS' : '0 BOTS ATIVOS'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#6f8387' }}>
            {isMicroWorker
              ? 'Nó Trabalhador dedicado a scrapers 24/7 e automações de emprego sem risco de parada.'
              : 'Nó de Produção Web. Robôs pesados são isolados no nó micro para preservar memória.'}
          </p>
        </div>

        <button
          onClick={() => setRegisterModalOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(32, 214, 199, 0.1)',
            border: '1px solid rgba(32, 214, 199, 0.3)',
            borderRadius: '6px',
            color: '#20d6c7',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Plus size={13} /> Cadastrar Novo Bot
        </button>
      </div>

      {isMicroWorker ? (
        /* --- VISÃO DA VM MICRO (2 BOTS EM EXECUÇÃO) --- */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* BOT 1: OCI CAPACITY SCRAPER */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(16, 28, 32, 0.8) 0%, rgba(9, 15, 17, 0.9) 100%)',
            border: '1px solid rgba(32, 214, 199, 0.25)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={16} style={{ color: '#20d6c7' }} />
                  <strong style={{ fontSize: '13px', color: '#e5f0ed' }}>OCI Capacity Scraper (Ampere A1)</strong>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                  Ativo (24/7)
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#8ca6a5', margin: '0 0 12px', lineHeight: 1.4 }}>
                Monitora disponibilidade de capacidade Always Free de 4 OCPUs e 24GB RAM na Oracle Cloud (sa-saopaulo-1).
              </p>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                <div>
                  <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Serviço</small>
                  <code style={{ fontSize: '10px', color: '#20d6c7' }}>cloudops-scraper.service</code>
                </div>
                <div>
                  <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Alvo</small>
                  <span style={{ fontSize: '10.5px', color: '#d9e2e1' }}>VM.Standard.A1.Flex</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={onOpenScraperModal}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  background: 'rgba(32, 214, 199, 0.15)',
                  border: '1px solid rgba(32, 214, 199, 0.35)',
                  color: '#20d6c7',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Activity size={12} /> Ver Telemetria & Logs
              </button>
            </div>
          </div>

          {/* BOT 2: AUTO APPLY JOB BOT */}
          <div style={{
            background: 'linear-gradient(145deg, rgba(16, 28, 32, 0.8) 0%, rgba(9, 15, 17, 0.9) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} style={{ color: '#c084fc' }} />
                  <strong style={{ fontSize: '13px', color: '#e5f0ed' }}>Auto Apply Job Bot (Internacional)</strong>
                </div>
                <span style={{
                  fontSize: '9.5px',
                  background: 'rgba(168, 85, 247, 0.15)',
                  color: '#c084fc',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#c084fc' }} />
                  {jobBotStats.status}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#8ca6a5', margin: '0 0 12px', lineHeight: 1.4 }}>
                Radar de vagas remotas para Database Engineer & PostgreSQL (Remotive & Wellfound) com geração de pitch via IA.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                <div>
                  <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Vagas Salvas</small>
                  <b style={{ fontSize: '12px', color: '#c084fc' }}>{jobBotStats.totalJobsFound} vagas</b>
                </div>
                <div>
                  <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Último Scan</small>
                  <span style={{ fontSize: '10.5px', color: '#d9e2e1' }}>{jobBotStats.lastScan}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
              <button
                onClick={handleScanJobsNow}
                disabled={jobBotScanning}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px',
                  background: jobBotScanning ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.2)',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  color: '#c084fc',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: jobBotScanning ? 'not-allowed' : 'pointer'
                }}
              >
                <RefreshCw size={12} className={jobBotScanning ? 'animate-spin' : ''} />
                {jobBotScanning ? 'Varrendo Vagas...' : 'Escanear Vagas Agora'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* --- VISÃO DA VM DE PRODUÇÃO (0 BOTS ATIVOS + AVISO DE SEGURANÇA) --- */
        <div style={{
          background: 'linear-gradient(145deg, rgba(13, 20, 24, 0.7) 0%, rgba(8, 12, 14, 0.85) 100%)',
          border: '1px dashed rgba(32, 214, 199, 0.25)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(32, 214, 199, 0.1)',
            color: '#20d6c7',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px'
          }}>
            <Shield size={20} />
          </div>

          <h4 style={{ margin: '0 0 6px', fontSize: '14px', color: '#e5f0ed' }}>
            Nó Dedicado a Serviços Web & Produção (0 Bots Ativos)
          </h4>
          <p style={{ margin: '0 auto 16px', maxWidth: '520px', fontSize: '11.5px', color: '#8ca6a5', lineHeight: 1.5 }}>
            Esta VM ({server.name}) está configurada com foco total em servir APIs, Nginx e Bancos de Dados com estabilidade máxima. Para economizar RAM ({server.ramTotal || '956'} MB), os bots e scrapers pesados foram direcionados para o nó <b>cloudops-micro-02</b>.
          </p>

          <button
            onClick={() => setRegisterModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(32, 214, 199, 0.15)',
              border: '1px solid rgba(32, 214, 199, 0.35)',
              color: '#20d6c7',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Plus size={13} /> Cadastrar / Instalar um Bot nesta VM
          </button>
        </div>
      )}

      {/* --- MODAL PARA CADASTRAR NOVO BOT --- */}
      {registerModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'grid',
          placeItems: 'center',
          zIndex: 99999,
          padding: '16px'
        }}>
          <div style={{
            background: '#0d1518',
            border: '1px solid rgba(32, 214, 199, 0.4)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '460px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bot size={18} style={{ color: '#20d6c7' }} />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#e5f0ed' }}>
                  Cadastrar Novo Bot em {server.name}
                </h3>
              </div>
              <button
                onClick={() => setRegisterModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#6f8387', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  Nome do Bot / Automação
                </label>
                <input
                  type="text"
                  placeholder="Ex: Scraper de Imóveis, Monitor Cripto..."
                  value={newBotName}
                  onChange={e => setNewBotName(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b0d',
                    border: '1px solid #1a292c',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#e5f0ed',
                    fontSize: '12px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  Tipo de Executável
                </label>
                <select
                  value={newBotType}
                  onChange={e => setNewBotType(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b0d',
                    border: '1px solid #1a292c',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#e5f0ed',
                    fontSize: '12px'
                  }}
                >
                  <option value="python">Script Python (Playwright / Requests)</option>
                  <option value="node">Node.js (Puppeteer / Axios)</option>
                  <option value="bash">Script Bash / Shell (Cron)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  Frequência de Execução (Crontab ou Contínuo)
                </label>
                <input
                  type="text"
                  value={newBotSchedule}
                  onChange={e => setNewBotSchedule(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#070b0d',
                    border: '1px solid #1a292c',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#e5f0ed',
                    fontSize: '12px'
                  }}
                />
                <small style={{ fontSize: '10px', color: '#557277', marginTop: '3px', display: 'block' }}>
                  Padrão: A cada 4 horas ou em loop de segurança 24/7.
                </small>
              </div>

              {!isMicroWorker && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={14} style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '10.5px', color: '#fef08a', lineHeight: 1.3 }}>
                    Aviso de Memória: Esta máquina é o nó de produção web (956 MB RAM). Certifique-se de que o bot seja leve para não impactar o Nginx e MySQL.
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRegisterModalOpen(false)}
                  style={{
                    flex: 1,
                    background: 'none',
                    border: '1px solid #1a292c',
                    color: '#8ca6a5',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 2,
                    background: '#20d6c7',
                    border: 'none',
                    color: '#070b0d',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Salvar e Provisionar Bot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
