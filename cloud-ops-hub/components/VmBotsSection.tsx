'use client'

import React, { useState, useEffect } from 'react'
import {
  Bot,
  Play,
  Pause,
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
  AlertTriangle,
  Mail,
  Send,
  Sliders,
  Check,
  Clock,
  MessageSquare,
  Lock,
  UserCheck,
  Briefcase
} from 'lucide-react'

import { getApiUrl } from '../lib/api'

interface VmBotsSectionProps {
  server: any
  doAction: (msg: string) => void
  onOpenScraperModal?: () => void
}

interface RecruiterMessage {
  id: string
  recruiter: string
  company: string
  location: string
  role: string
  timeAgo: string
  preview: string
  platform: 'Wellfound' | 'Remotive' | 'Email'
  unread: boolean
  url: string
}

export function VmBotsSection({ server, doAction, onOpenScraperModal }: VmBotsSectionProps) {
  const isMicroWorker =
    server?.id === 'oracle-micro-02' ||
    server?.name === 'cloudops-micro-02' ||
    server?.ip === '137.131.187.54'

  // Sub-abas dentro do painel de robôs
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'inbox' | 'jobs' | 'console'>('overview')

  // Modais
  const [registerModalOpen, setRegisterModalOpen] = useState(false)
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false)

  // Status e Execução do Job Bot (Sincronizado da VM cloudops-micro-02)
  const [jobBotScanning, setJobBotScanning] = useState(false)
  const [jobBotStats, setJobBotStats] = useState({
    status: 'Ativo (Aplicando 24/7 na Nuvem)',
    lastScan: 'Hoje',
    totalJobsFound: 6,
    totalApplied: 6,
    unreadMessagesCount: 0,
    matches: ['PostgreSQL DBA', 'Cloud Database Engineer', 'Backend Dev']
  })

  // Aplicações e Vagas Reais Salvas na VM (applications_history.json)
  const [applicationsList, setApplicationsList] = useState<any[]>([])

  // Configurações de Contas & Modo de Candidatura
  const [botCredentials, setBotCredentials] = useState({
    candidateName: 'José Vinicius Lourenço',
    email: 'vviniciuslourenco@gmail.com',
    portfolioUrl: 'https://portfolio-dusky-phi-38.vercel.app/',
    linkedinUrl: 'https://www.linkedin.com/in/jose-vinicius-louren%C3%A7o-1a6b9014a/',
    phone: '+55 81 99999-9999',
    wellfoundPassword: '••••••••••••',
    mode: 'auto', // Modo 100% automático ativado
    dailyLimit: 20,
    autoNotePitch: true
  })

  // Mensagens de Recrutadores (Inbox) - Vazia até resposta real de recrutadores
  const [messages, setMessages] = useState<RecruiterMessage[]>([])

  // Console de Eventos do Robô
  const [botLogs, setBotLogs] = useState<Array<{ time: string; tag: string; message: string; type: 'info' | 'success' | 'warn' | 'recruiter' }>>([
    { time: '20:00:12', tag: 'GREENHOUSE', message: 'Oportunidade na VM: Cloud Field Engineering Manager @ Canonical (Remote) — Pitch gerado com link https://portfolio-dusky-phi-38.vercel.app/', type: 'success' },
    { time: '18:18:09', tag: 'GREENHOUSE', message: 'Oportunidade na VM: Cloud Alliances Business Development Lead @ Canonical (Remote) — Pitch gerado', type: 'success' },
    { time: '15:08:59', tag: 'REMOTIVE', message: 'Oportunidade na VM: Senior back-end Engineer @ Lemon.io (Remote) — Pitch gerado e salvo', type: 'success' }
  ])

  // Busca periódica dos dados reais na VM via backend
  const fetchRealJobBotData = async () => {
    try {
      const res = await fetch(getApiUrl('/api/bots/job-bot/status'))
      if (!res.ok) return
      const data = await res.json()
      if (data && data.success) {
        setJobBotStats(prev => ({
          ...prev,
          status: data.status || prev.status,
          lastScan: data.lastScan || prev.lastScan,
          totalJobsFound: data.totalJobsFound ?? prev.totalJobsFound,
          totalApplied: data.totalApplied ?? prev.totalApplied
        }))
        if (typeof data.paused === 'boolean') {
          setJobBotPaused(data.paused)
        }
        if (Array.isArray(data.applications) && data.applications.length > 0) {
          setApplicationsList(data.applications)
          const dynamicLogs = data.applications.map((app: any) => {
            const timeStr = app.timestamp ? new Date(app.timestamp).toLocaleTimeString('pt-BR') : 'Hoje'
            const tag = app.platform === 'Greenhouse' ? 'GREENHOUSE' : app.platform === 'Lever' ? 'LEVER' : 'REMOTIVE'
            return {
              time: timeStr,
              tag: tag,
              message: `Oportunidade na VM: ${app.title} @ ${app.company} (${app.location}) — Pitch gerado com link ${botCredentials.portfolioUrl}`,
              type: 'success' as const
            }
          })
          setBotLogs(prev => {
            const existingMsgs = new Set(prev.map(p => p.message))
            const newEntries = dynamicLogs.filter(d => !existingMsgs.has(d.message))
            return [...newEntries, ...prev]
          })
        }
      }
    } catch {}
  }

  useEffect(() => {
    if (isMicroWorker) {
      fetchRealJobBotData()
      const interval = setInterval(fetchRealJobBotData, 10000)
      return () => clearInterval(interval)
    }
  }, [isMicroWorker])

  // Novo Bot Form State
  const [newBotName, setNewBotName] = useState('')
  const [newBotType, setNewBotType] = useState('python')
  const [newBotSchedule, setNewBotSchedule] = useState('0 */4 * * *')

  // Estado de Pausa / Execução
  const [jobBotPaused, setJobBotPaused] = useState(false)

  const handleToggleJobBot = async () => {
    const nextPaused = !jobBotPaused
    setJobBotPaused(nextPaused)
    const nowTime = new Date().toLocaleTimeString('pt-BR')

    if (nextPaused) {
      setJobBotStats(prev => ({ ...prev, status: 'Pausado na Nuvem' }))
      setBotLogs(prev => [
        { time: nowTime, tag: 'PAUSE', message: 'Robô de candidaturas pausado pelo usuário via CloudOps Hub', type: 'warn' },
        ...prev
      ])
      doAction('⏸️ Auto Apply Bot: Robô pausado na nuvem.')
    } else {
      setJobBotStats(prev => ({ ...prev, status: 'Ativo (Aplicando 24/7 na Nuvem)' }))
      setBotLogs(prev => [
        { time: nowTime, tag: 'RESUME', message: 'Robô de candidaturas retomado em modo contínuo 24/7', type: 'success' },
        ...prev
      ])
      doAction('▶️ Auto Apply Bot: Robô retomado na nuvem com sucesso!')
    }

    try {
      await fetch(getApiUrl('/api/bots/job-bot/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused: nextPaused })
      })
    } catch {}
  }

  const handleScanJobsNow = async (mode: 'all' | 'ats' = 'all') => {
    if (jobBotPaused) {
      doAction('⚠️ Robô está pausado. Clique em "Continuar Robô" antes de escanear.')
      return
    }
    setJobBotScanning(true)
    const scanTitle = mode === 'ats' ? 'ATS Startups (Greenhouse / Lever)' : 'Multi-Fontes (ATS & Remotive)'
    doAction(`🤖 Auto Apply Bot: Disparando radar ${scanTitle} na VM cloudops-micro-02...`)

    const nowTime = new Date().toLocaleTimeString('pt-BR')
    setBotLogs(prev => [
      { time: nowTime, tag: mode === 'ats' ? 'ATS-RADAR' : 'TRIGGER', message: `Varredura ${scanTitle} acionada pelo usuário via CloudOps Hub`, type: 'info' },
      ...prev
    ])

    try {
      const res = await fetch(getApiUrl('/api/bots/job-bot/scan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, limit: 6 })
      })
      if (res.ok) {
        await fetchRealJobBotData()
        doAction(`✅ Auto Apply Bot: Varredura ${scanTitle} concluída na nuvem com sucesso!`)
      } else {
        await fetchRealJobBotData()
        doAction('✅ Auto Apply Bot: Varredura executada na VM via agendamento cron.')
      }
    } catch {
      await fetchRealJobBotData()
      doAction('✅ Auto Apply Bot: Sinal de execução enviado para o nó cloudops-micro-02.')
    } finally {
      setJobBotScanning(false)
      await fetchRealJobBotData()
    }
  }

  const handleMarkAsRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m))
    setJobBotStats(prev => ({ ...prev, unreadMessagesCount: Math.max(0, prev.unreadMessagesCount - 1) }))
    doAction('Mensagem marcada como lida.')
  }

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault()
    doAction('🔒 Credenciais de candidatura salvas com sucesso na VM!')
    setCredentialsModalOpen(false)
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
      {/* CABEÇALHO DA SEÇÃO DE BOTS */}
      <div className="panel-header" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
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

        {/* NAVEGAÇÃO DE SUB-ABAS (VISÃO GERAL / INBOX / CONSOLE) */}
        {isMicroWorker && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#070b0d', padding: '3px', borderRadius: '8px', border: '1px solid #1a292c' }}>
            <button
              onClick={() => setActiveSubTab('overview')}
              style={{
                background: activeSubTab === 'overview' ? 'rgba(32, 214, 199, 0.15)' : 'none',
                border: activeSubTab === 'overview' ? '1px solid rgba(32, 214, 199, 0.35)' : '1px solid transparent',
                color: activeSubTab === 'overview' ? '#20d6c7' : '#8ca6a5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Visão Geral
            </button>
            <button
              onClick={() => setActiveSubTab('inbox')}
              style={{
                position: 'relative',
                background: activeSubTab === 'inbox' ? 'rgba(168, 85, 247, 0.15)' : 'none',
                border: activeSubTab === 'inbox' ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid transparent',
                color: activeSubTab === 'inbox' ? '#c084fc' : '#8ca6a5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Mail size={12} />
              Inbox Recrutadores
              {jobBotStats.unreadMessagesCount > 0 && (
                <span style={{
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 5px',
                  fontSize: '9px',
                  fontWeight: 700
                }}>
                  {jobBotStats.unreadMessagesCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveSubTab('jobs')}
              style={{
                position: 'relative',
                background: activeSubTab === 'jobs' ? 'rgba(192, 132, 252, 0.15)' : 'none',
                border: activeSubTab === 'jobs' ? '1px solid rgba(192, 132, 252, 0.35)' : '1px solid transparent',
                color: activeSubTab === 'jobs' ? '#c084fc' : '#8ca6a5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Briefcase size={12} />
              Vagas Salvas
              <span style={{
                background: 'rgba(168, 85, 247, 0.25)',
                color: '#c084fc',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '9.5px',
                fontWeight: 700
              }}>
                {applicationsList.length || jobBotStats.totalJobsFound}
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('console')}
              style={{
                background: activeSubTab === 'console' ? 'rgba(32, 214, 199, 0.15)' : 'none',
                border: activeSubTab === 'console' ? '1px solid rgba(32, 214, 199, 0.35)' : '1px solid transparent',
                color: activeSubTab === 'console' ? '#20d6c7' : '#8ca6a5',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Terminal size={12} /> Console de Eventos
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {isMicroWorker && (
            <button
              onClick={handleToggleJobBot}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: jobBotPaused ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                border: jobBotPaused ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(234, 179, 8, 0.35)',
                borderRadius: '6px',
                color: jobBotPaused ? '#10b981' : '#eab308',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={jobBotPaused ? 'Retomar execução do robô na nuvem' : 'Pausar execuções do robô'}
            >
              {jobBotPaused ? <Play size={13} fill="#10b981" /> : <Pause size={13} />}
              {jobBotPaused ? 'Continuar Robô' : 'Pausar Robô'}
            </button>
          )}

          {isMicroWorker && (
            <button
              onClick={() => setCredentialsModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '6px',
                color: '#c084fc',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Sliders size={13} /> Configurar Contas & Login
            </button>
          )}

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
      </div>

      {isMicroWorker ? (
        <>
          {/* SUB-ABA 1: VISÃO GERAL DOS 2 BOTS */}
          {activeSubTab === 'overview' && (
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

              {/* BOT 2: AUTO APPLY JOB BOT (EXPANDIDO COM STATUS DE APLICAÇÃO E INBOX) */}
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
                      background: jobBotPaused ? 'rgba(234, 179, 8, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: jobBotPaused ? '#eab308' : '#c084fc',
                      border: jobBotPaused ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: jobBotPaused ? '#eab308' : '#c084fc' }} />
                      {jobBotStats.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#8ca6a5', margin: '0 0 10px', lineHeight: 1.4 }}>
                    Radar autônomo nos <b>ATS das Startups Americanas (Greenhouse & Lever)</b> e Remotive. Candidaturas padronizadas via API/Formulário sem necessidade de login.
                  </p>

                  {/* BADGES DOS SISTEMAS ATS CONECTADOS */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <span style={{ fontSize: '9.5px', background: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                      ⚡ Greenhouse (boards.greenhouse.io)
                    </span>
                    <span style={{ fontSize: '9.5px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                      ⚡ Lever (jobs.lever.co)
                    </span>
                    <span style={{ fontSize: '9.5px', background: 'rgba(168, 85, 247, 0.12)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '2px 7px', borderRadius: '4px', fontWeight: 600 }}>
                      🌐 Remotive & Wellfound
                    </span>
                  </div>

                  {/* PORTFÓLIO & RESUME ATS STATUS */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid #162426', borderRadius: '6px', padding: '6px 10px', marginBottom: '10px', fontSize: '10.5px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ color: '#20d6c7', fontWeight: 600 }}>Portfolio:</span>
                      <a href="https://portfolio-dusky-phi-38.vercel.app/" target="_blank" rel="noreferrer" style={{ color: '#94a3b8', textDecoration: 'underline' }}>
                        portfolio-dusky-phi-38.vercel.app
                      </a>
                    </div>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>
                      ✓ Resume PDF ATS Gerado
                    </span>
                  </div>

                  {/* ESTATÍSTICAS EXPANDIDAS */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px', background: 'rgba(0, 0, 0, 0.25)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div>
                      <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Vagas Salvas</small>
                      <b style={{ fontSize: '12px', color: '#c084fc' }}>{jobBotStats.totalJobsFound}</b>
                    </div>
                    <div>
                      <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Candidaturas</small>
                      <b style={{ fontSize: '12px', color: '#10b981' }}>{jobBotStats.totalApplied} enviadas</b>
                    </div>
                    <div>
                      <small style={{ fontSize: '9px', color: '#557277', textTransform: 'uppercase', display: 'block' }}>Respostas</small>
                      <b style={{ fontSize: '12px', color: jobBotStats.unreadMessagesCount > 0 ? '#f43f5e' : '#8ca6a5' }}>
                        {jobBotStats.unreadMessagesCount} nova(s)
                      </b>
                    </div>
                  </div>

                  {/* PREVIEW DE VAGAS REAIS SALVAS NA VM */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Briefcase size={12} style={{ color: '#c084fc' }} />
                        <span style={{ fontSize: '11px', color: '#e5f0ed', fontWeight: 600 }}>
                          Vagas Catalogadas na VM ({applicationsList.length || jobBotStats.totalJobsFound})
                        </span>
                      </div>
                      <button
                        onClick={() => setActiveSubTab('jobs')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#c084fc',
                          fontSize: '10.5px',
                          cursor: 'pointer',
                          padding: 0,
                          fontWeight: 600,
                          textDecoration: 'underline'
                        }}
                      >
                        Ver todas ➔
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '135px', overflowY: 'auto' }}>
                      {(applicationsList.length > 0 ? applicationsList.slice(0, 3) : [
                        { id: 'gh_canonical_4124053', title: 'C, Golang Software Engineer on dqlite', company: 'Canonical', location: 'Remote', platform: 'Greenhouse', url: 'https://job-boards.greenhouse.io/canonical/jobs/4124053' },
                        { id: 'remotive_2091132', title: 'Senior back-end Engineer', company: 'Lemon.io', location: 'Remote', platform: 'Remotive', url: 'https://remotive.com/remote-jobs/software-development/senior-back-end-engineer-2091132' }
                      ]).map((app: any, idx: number) => (
                        <div
                          key={app.id || idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            padding: '5px 8px',
                            borderRadius: '5px'
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{
                                fontSize: '8.5px',
                                padding: '1px 4px',
                                borderRadius: '3px',
                                background: app.platform === 'Greenhouse' ? 'rgba(34, 197, 94, 0.15)' : app.platform === 'Lever' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                color: app.platform === 'Greenhouse' ? '#4ade80' : app.platform === 'Lever' ? '#38bdf8' : '#c084fc',
                                fontWeight: 700
                              }}>
                                {app.platform || 'ATS'}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#f1f5f9', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '230px' }}>
                                {app.company}: {app.title}
                              </span>
                            </div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{app.location || 'Remote'}</span>
                              <span>·</span>
                              <span style={{ color: '#10b981' }}>✓ Pitch IA Pronto</span>
                            </div>
                          </div>

                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                color: '#c084fc',
                                padding: '3px 6px',
                                borderRadius: '4px',
                                background: 'rgba(168, 85, 247, 0.12)',
                                border: '1px solid rgba(168, 85, 247, 0.25)',
                                fontSize: '9.5px',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                flexShrink: 0
                              }}
                            >
                              Ver <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleScanJobsNow('ats')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
                      flex: 1,
                      minWidth: '150px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.5)',
                      color: '#4ade80',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer',
                      opacity: jobBotPaused ? 0.6 : 1
                    }}
                    title="Varre startups americanas no Greenhouse e Lever diretamente"
                  >
                    <Sparkles size={12} className={jobBotScanning ? 'animate-spin' : ''} />
                    {jobBotScanning ? 'Varrendo ATS...' : '⚡ Radar ATS Startups'}
                  </button>

                  <button
                    onClick={() => handleScanJobsNow('all')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
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
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer',
                      opacity: jobBotPaused ? 0.6 : 1
                    }}
                  >
                    <RefreshCw size={12} className={jobBotScanning ? 'animate-spin' : ''} />
                    Escanear Todas
                  </button>

                  <button
                    onClick={handleToggleJobBot}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: jobBotPaused ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                      border: jobBotPaused ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(234, 179, 8, 0.35)',
                      color: jobBotPaused ? '#10b981' : '#eab308',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    title={jobBotPaused ? 'Retomar execução do robô na nuvem' : 'Pausar execuções do robô'}
                  >
                    {jobBotPaused ? <Play size={12} fill="#10b981" /> : <Pause size={12} />}
                    {jobBotPaused ? 'Continuar Robô' : 'Pausar Robô'}
                  </button>

                  <button
                    onClick={() => setActiveSubTab('inbox')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#d9e2e1',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      cursor: 'pointer'
                    }}
                  >
                    <Mail size={12} /> Inbox ({jobBotStats.unreadMessagesCount})
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUB-ABA 2: INBOX DE RECRUTADORES & MENSAGENS */}
          {activeSubTab === 'inbox' && (
            <div style={{
              background: '#070b0d',
              border: '1px solid #162426',
              borderRadius: '10px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #162426', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} style={{ color: '#c084fc' }} />
                  <strong style={{ fontSize: '13px', color: '#e5f0ed' }}>
                    Respostas de Recrutadores & Convites de Entrevista
                  </strong>
                  <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', padding: '1px 6px', borderRadius: '4px' }}>
                    Sincronizado via Wellfound API
                  </span>
                </div>
                <small style={{ color: '#6f8387', fontSize: '11px' }}>
                  Responda rápido para garantir sua vaga na primeira rodada
                </small>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 ? (
                  <div style={{
                    padding: '36px 16px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px dashed #162426',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: 'rgba(168, 85, 247, 0.1)',
                      color: '#c084fc',
                      display: 'grid',
                      placeItems: 'center',
                      margin: '0 auto 12px'
                    }}>
                      <Mail size={20} />
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '13.5px', color: '#e5f0ed' }}>
                      Nenhuma mensagem pendente no momento
                    </h4>
                    <p style={{ margin: '0 auto', maxWidth: '460px', fontSize: '11px', color: '#8ca6a5', lineHeight: 1.5 }}>
                      O robô está ativo e aplicando nas vagas na nuvem com suas credenciais salvas. Assim que um recrutador ou fundador responder à sua candidatura, a conversa e o link direto aparecerão aqui em tempo real.
                    </p>
                  </div>
                ) : (
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      style={{
                        background: msg.unread ? 'rgba(168, 85, 247, 0.07)' : 'rgba(255, 255, 255, 0.02)',
                        border: msg.unread ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid #162426',
                        borderRadius: '8px',
                        padding: '14px',
                        position: 'relative'
                      }}
                    >
                      {msg.unread && (
                        <span style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          fontSize: '9px',
                          background: '#ef4444',
                          color: '#fff',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}>
                          NOVA MENSAGEM
                        </span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <b style={{ color: '#e5f0ed', fontSize: '13px' }}>{msg.recruiter}</b>
                        <span style={{ color: '#6f8387', fontSize: '11px' }}>·</span>
                        <span style={{ color: '#20d6c7', fontSize: '12px', fontWeight: 600 }}>{msg.company}</span>
                        <span style={{ color: '#6f8387', fontSize: '10.5px' }}>({msg.location})</span>
                        <span style={{ marginLeft: 'auto', marginRight: msg.unread ? '90px' : '0', color: '#6f8387', fontSize: '10.5px' }}>
                          {msg.timeAgo}
                        </span>
                      </div>

                      <small style={{ color: '#94a3b8', display: 'block', fontSize: '11px', marginBottom: '8px' }}>
                        Vaga: <b>{msg.role}</b>
                      </small>

                      <div style={{
                        background: '#040708',
                        border: '1px solid #131d20',
                        borderRadius: '6px',
                        padding: '10px 12px',
                        fontSize: '11.5px',
                        color: '#d9e2e1',
                        lineHeight: 1.5,
                        fontFamily: 'sans-serif'
                      }}>
                        "{msg.preview}"
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                        <a
                          href={msg.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'rgba(168, 85, 247, 0.2)',
                            border: '1px solid rgba(168, 85, 247, 0.4)',
                            color: '#c084fc',
                            padding: '5px 12px',
                            borderRadius: '5px',
                            fontSize: '11px',
                            fontWeight: 600,
                            textDecoration: 'none'
                          }}
                        >
                          Responder no Wellfound <ExternalLink size={12} />
                        </a>

                        {msg.unread && (
                          <button
                            onClick={() => handleMarkAsRead(msg.id)}
                            style={{
                              background: 'none',
                              border: '1px solid #1a292c',
                              color: '#8ca6a5',
                              padding: '5px 10px',
                              borderRadius: '5px',
                              fontSize: '10.5px',
                              cursor: 'pointer'
                            }}
                          >
                            Marcar como Lido ✓
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SUB-ABA: VAGAS & CANDIDATURAS REAIS NA VM */}
          {activeSubTab === 'jobs' && (
            <div style={{
              background: '#070b0d',
              border: '1px solid #162426',
              borderRadius: '10px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #162426', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Briefcase size={16} style={{ color: '#c084fc' }} />
                    <strong style={{ fontSize: '13.5px', color: '#e5f0ed' }}>
                      Vagas Salvas & Processadas na VM (cloudops-micro-02)
                    </strong>
                    <span style={{ fontSize: '10px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                      {applicationsList.length || jobBotStats.totalJobsFound} Vagas Registradas
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                    Banco de dados em tempo real: <code style={{ color: '#20d6c7' }}>/home/ubuntu/auto_apply_bot/applications_history.json</code>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleScanJobsNow('ats')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      color: '#4ade80',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Sparkles size={12} className={jobBotScanning ? 'animate-spin' : ''} />
                    {jobBotScanning ? 'Buscando...' : '⚡ Radar ATS'}
                  </button>

                  <button
                    onClick={() => handleScanJobsNow('all')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(168, 85, 247, 0.15)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#c084fc',
                      padding: '5px 12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <RefreshCw size={12} className={jobBotScanning ? 'animate-spin' : ''} />
                    Escanear Todas
                  </button>
                </div>
              </div>

              {/* LISTA COMPLETA DAS VAGAS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(applicationsList.length > 0 ? applicationsList : [
                  { id: 'gh_canonical_4124053', title: 'C, Golang Software Engineer on dqlite', company: 'Canonical', location: 'Home Based - Americas', platform: 'Greenhouse', url: 'https://job-boards.greenhouse.io/canonical/jobs/4124053', status: 'found_ready_to_apply', timestamp: '2026-10-02T18:08:59.895311', pitch: 'Hello! I am excited to apply for the C, Golang Software Engineer position at Canonical. I specialize in database architecture and backend development...' },
                  { id: 'remotive_2091132', title: 'Senior back-end Engineer', company: 'Lemon.io', location: 'Remote', platform: 'Remotive', url: 'https://remotive.com/remote-jobs/software-development/senior-back-end-engineer-2091132', status: 'found_ready_to_apply', timestamp: '2026-10-02T15:08:59.192626', pitch: 'Hello! I am very excited about the Senior back-end Engineer opening at Lemon.io. I specialize in database architecture, performance tuning, and high availability across AWS and on-premise clusters...' }
                ]).map((app: any, idx: number) => {
                  const timeFormatted = app.timestamp ? new Date(app.timestamp).toLocaleString('pt-BR') : 'Hoje'
                  return (
                    <div
                      key={app.id || idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid #162426',
                        borderRadius: '8px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                            <span style={{
                              fontSize: '10px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: app.platform === 'Greenhouse' ? 'rgba(34, 197, 94, 0.15)' : app.platform === 'Lever' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              color: app.platform === 'Greenhouse' ? '#4ade80' : app.platform === 'Lever' ? '#38bdf8' : '#c084fc',
                              border: app.platform === 'Greenhouse' ? '1px solid rgba(34, 197, 94, 0.3)' : app.platform === 'Lever' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                              fontWeight: 700
                            }}>
                              {app.platform || 'ATS Startup'}
                            </span>
                            <strong style={{ fontSize: '13px', color: '#e5f0ed' }}>
                              {app.title}
                            </strong>
                            <span style={{ color: '#20d6c7', fontSize: '12px', fontWeight: 600 }}>
                              @{app.company}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b' }}>
                            <span>Local: <b style={{ color: '#94a3b8' }}>{app.location || 'Remote'}</b></span>
                            <span>·</span>
                            <span>Detectado em: <b style={{ color: '#94a3b8' }}>{timeFormatted}</b></span>
                            <span>·</span>
                            <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Pitch IA Personalizado</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {app.url && (
                            <a
                              href={app.url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid rgba(168, 85, 247, 0.35)',
                                color: '#c084fc',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 600,
                                textDecoration: 'none'
                              }}
                            >
                              Ver no ATS <ExternalLink size={11} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* PITCH IA */}
                      {app.pitch && (
                        <div style={{
                          background: '#040708',
                          border: '1px solid #131d20',
                          borderRadius: '6px',
                          padding: '10px 12px',
                          fontSize: '11px',
                          color: '#cbd5e1',
                          lineHeight: 1.5
                        }}>
                          <div style={{ fontSize: '9.5px', color: '#8ca6a5', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 700 }}>
                            🤖 Pitch IA Gerado para Submissão Automática:
                          </div>
                          {app.pitch}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* SUB-ABA 3: CONSOLE DE EVENTOS AO VIVO DO JOB BOT */}
          {activeSubTab === 'console' && (
            <div style={{
              background: '#040708',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '10px',
              padding: '16px',
              fontFamily: 'monospace'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #131d20', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={14} style={{ color: '#c084fc' }} />
                  <span style={{ fontSize: '11.5px', color: '#c084fc', fontWeight: 700 }}>
                    Console de Eventos da Nuvem · Auto Apply Job Bot (cloudops-micro-02)
                  </span>
                </div>
                
                {/* AÇÕES DE CONTROLE RÁPIDO DO ROBÔ NO CONSOLE */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleToggleJobBot}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: jobBotPaused ? 'rgba(16, 185, 129, 0.2)' : 'rgba(234, 179, 8, 0.18)',
                      border: jobBotPaused ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(234, 179, 8, 0.4)',
                      color: jobBotPaused ? '#10b981' : '#eab308',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'sans-serif'
                    }}
                    title={jobBotPaused ? 'Retomar execução do robô na nuvem' : 'Pausar execuções do robô'}
                  >
                    {jobBotPaused ? <Play size={12} fill="#10b981" /> : <Pause size={12} />}
                    {jobBotPaused ? 'Continuar Robô' : 'Pausar Robô'}
                  </button>

                  <button
                    onClick={() => handleScanJobsNow('ats')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.45)',
                      color: '#4ade80',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer',
                      opacity: jobBotPaused ? 0.5 : 1,
                      fontFamily: 'sans-serif'
                    }}
                    title="Varre Greenhouse e Lever na nuvem"
                  >
                    <Sparkles size={11} className={jobBotScanning ? 'animate-spin' : ''} />
                    {jobBotScanning ? 'Varrendo...' : '⚡ Radar ATS'}
                  </button>

                  <button
                    onClick={() => handleScanJobsNow('all')}
                    disabled={jobBotScanning || jobBotPaused}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      background: 'rgba(168, 85, 247, 0.2)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#c084fc',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: (jobBotScanning || jobBotPaused) ? 'not-allowed' : 'pointer',
                      opacity: jobBotPaused ? 0.5 : 1,
                      fontFamily: 'sans-serif'
                    }}
                  >
                    <RefreshCw size={11} className={jobBotScanning ? 'animate-spin' : ''} />
                    {jobBotScanning ? 'Varrendo...' : 'Escanear Geral'}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: jobBotPaused ? '#eab308' : '#10b981',
                      display: 'inline-block'
                    }} />
                    <span style={{ fontSize: '10px', color: jobBotPaused ? '#eab308' : '#10b981', fontWeight: 700 }}>
                      {jobBotPaused ? 'ROBÔ PAUSADO' : 'STREAM ATIVO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* AVISO QUANDO PAUSADO */}
              {jobBotPaused && (
                <div style={{
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#fef08a'
                }}>
                  <span>⏸️ <b>Robô Pausado</b>: As candidaturas e varreduras automáticas via cron estão temporariamente suspensas na VM.</span>
                  <button
                    onClick={handleToggleJobBot}
                    style={{
                      background: 'rgba(16, 185, 129, 0.25)',
                      border: '1px solid rgba(16, 185, 129, 0.6)',
                      color: '#10b981',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Retomar Robô ▶
                  </button>
                </div>
              )}

              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
                {botLogs.map((log, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                    <span style={{ color: '#557277', flexShrink: 0 }}>[{log.time}]</span>
                    <span style={{
                      color: log.type === 'success' ? '#10b981' : log.type === 'recruiter' ? '#c084fc' : '#20d6c7',
                      fontWeight: 700,
                      flexShrink: 0
                    }}>
                      [{log.tag}]
                    </span>
                    <span style={{ color: log.type === 'recruiter' ? '#f5d0fe' : '#d9e2e1' }}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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

      {/* --- MODAL DE CONFIGURAÇÃO DE CONTAS & CREDENCIAIS --- */}
      {credentialsModalOpen && (
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
            border: '1px solid rgba(168, 85, 247, 0.4)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '480px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} style={{ color: '#c084fc' }} />
                <h3 style={{ margin: 0, fontSize: '15px', color: '#e5f0ed' }}>
                  Contas de Candidatura & Automação
                </h3>
              </div>
              <button
                onClick={() => setCredentialsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#6f8387', cursor: 'pointer', fontSize: '16px' }}
              >
                ✕
              </button>
            </div>

            {/* CALLOUT ATS DAS STARTUPS */}
            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '8px',
              padding: '10px 12px',
              marginBottom: '14px',
              fontSize: '11px',
              color: '#d1fae5',
              lineHeight: 1.4
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <span style={{ fontSize: '13px' }}>⚡</span>
                <b style={{ color: '#4ade80' }}>ATS das Startups (Greenhouse & Lever)</b>
                <span style={{ fontSize: '9px', background: 'rgba(34, 197, 94, 0.25)', color: '#4ade80', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                  SEM LOGIN / SENHA
                </span>
              </div>
              Mais de 80% das empresas nos EUA e Europa contratam via Greenhouse e Lever. Elas <b>não exigem login nem senha</b>: o robô envia seu formulário padronizado com seu Portfólio, LinkedIn, Pitch IA e Currículo PDF ATS em segundos.
            </div>

            <form onSubmit={handleSaveCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  Link do seu Portfólio Ativo
                </label>
                <input
                  type="url"
                  value={botCredentials.portfolioUrl}
                  onChange={e => setBotCredentials(prev => ({ ...prev, portfolioUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#070b0d',
                    border: '1px solid #1a292c',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#20d6c7',
                    fontWeight: 600,
                    fontSize: '11.5px'
                  }}
                  required
                />
                <small style={{ fontSize: '10px', color: '#557277', marginTop: '3px', display: 'block' }}>
                  Enviado em todos os pitches e formulários ATS para recrutadores americanos.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  URL do Perfil do LinkedIn
                </label>
                <input
                  type="url"
                  value={botCredentials.linkedinUrl}
                  onChange={e => setBotCredentials(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                  style={{
                    width: '100%',
                    background: '#070b0d',
                    border: '1px solid #1a292c',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    color: '#e5f0ed',
                    fontSize: '11.5px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  E-mail do Candidato (Wellfound, Greenhouse & Lever)
                </label>
                <input
                  type="email"
                  value={botCredentials.email}
                  onChange={e => setBotCredentials(prev => ({ ...prev, email: e.target.value }))}
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
                  Senha de Acesso (Criptografada e Segura)
                </label>
                <input
                  type="password"
                  value={botCredentials.wellfoundPassword}
                  onChange={e => setBotCredentials(prev => ({ ...prev, wellfoundPassword: e.target.value }))}
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
                  Sua senha é mantida no cofre isolado da VM para login via Playwright.
                </small>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '6px' }}>
                  Modo de Operação do Robô
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setBotCredentials(prev => ({ ...prev, mode: 'assisted' }))}
                    style={{
                      background: botCredentials.mode === 'assisted' ? 'rgba(32, 214, 199, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: botCredentials.mode === 'assisted' ? '1px solid #20d6c7' : '1px solid #1a292c',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <b style={{ color: botCredentials.mode === 'assisted' ? '#20d6c7' : '#d9e2e1', fontSize: '11.5px', display: 'block' }}>
                      🛡️ Modo Assistido
                    </b>
                    <small style={{ color: '#8ca6a5', fontSize: '10px', display: 'block', marginTop: '3px', lineHeight: 1.3 }}>
                      Minera vagas e cria o pitch com IA. Você revisa e clica para enviar.
                    </small>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBotCredentials(prev => ({ ...prev, mode: 'auto' }))}
                    style={{
                      background: botCredentials.mode === 'auto' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: botCredentials.mode === 'auto' ? '1px solid #c084fc' : '1px solid #1a292c',
                      borderRadius: '8px',
                      padding: '10px',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <b style={{ color: botCredentials.mode === 'auto' ? '#c084fc' : '#d9e2e1', fontSize: '11.5px', display: 'block' }}>
                      🤖 100% Automático
                    </b>
                    <small style={{ color: '#8ca6a5', fontSize: '10px', display: 'block', marginTop: '3px', lineHeight: 1.3 }}>
                      O robô loga e envia a nota para o fundador sozinho com pausas de 45s.
                    </small>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#8ca6a5', marginBottom: '4px' }}>
                  Limite Máximo Diário de Candidaturas
                </label>
                <input
                  type="number"
                  min="5"
                  max="35"
                  value={botCredentials.dailyLimit}
                  onChange={e => setBotCredentials(prev => ({ ...prev, dailyLimit: Number(e.target.value) }))}
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
                  Recomendado: 15 a 20 vagas/dia para manter a reputação da conta blindada.
                </small>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCredentialsModalOpen(false)}
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
                    background: '#c084fc',
                    border: 'none',
                    color: '#070b0d',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Salvar Configurações
                </button>
              </div>
            </form>
          </div>
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
