'use client'

import React, { useState, useEffect } from 'react'
import {
  ExternalLink, RefreshCw, Zap, CheckCircle2, AlertCircle,
  Clock, GitBranch, GitCommit, User, KeyRound, Eye, EyeOff, ShieldCheck,
  Play, Settings, Layers, ArrowUpRight, Check, Sparkles, Database,
  Terminal, Server, Power, Activity, PlayCircle, Plus, Trash2, Cpu
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

// Ícone vetorial oficial do Render (Símbolo geométrico moderno)
export function RenderIcon({ size = 16, color = '#46e3b7', style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <path
        d="M3 7.5L12 2.5L21 7.5V16.5L12 21.5L3 16.5V7.5Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 2.5V21.5M3 7.5L21 16.5M21 7.5L3 16.5"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
    </svg>
  )
}

interface RenderDeploymentsViewProps {
  doAction: (msg: string) => void
}

export function RenderDeploymentsView({ doAction }: RenderDeploymentsViewProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'cron' | 'mysql'>('services')
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>('')
  const [deploysData, setDeploysData] = useState<any>(null)
  const [deploying, setDeploying] = useState(false)
  const [restarting, setRestarting] = useState(false)
  const [clearCache, setClearCache] = useState(false)
  const [error, setError] = useState<string>('')

  // Configuração da Chave API
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [keyUser, setKeyUser] = useState<any>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Cron Jobs & Anti-Sleep
  const [cronJobs, setCronJobs] = useState<any[]>([])
  const [cronLoading, setCronLoading] = useState(false)
  const [pingingNow, setPingingNow] = useState(false)
  const [newCronModal, setNewCronModal] = useState(false)
  const [newCronForm, setNewCronForm] = useState({
    name: '',
    targetUrl: '',
    intervalMinutes: 10
  })

  // Gerador de String MySQL
  const [mysqlConfig, setMysqlConfig] = useState({
    host: '152.67.x.x (IP da sua VM)',
    port: '3306',
    user: 'root',
    password: 'suasenhamysql2026',
    database: 'cloudops_db'
  })
  const [copiedString, setCopiedString] = useState(false)

  const apiUrl = getApiUrl('')

  // Carrega configuração e serviços
  useEffect(() => {
    loadInitialConfig()
  }, [])

  const loadInitialConfig = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${apiUrl}/api/render/config`)
      const cfg = await res.json()
      if (cfg?.apiKey) {
        setApiKey(cfg.apiKey)
        setKeyStatus('valid')
        if (cfg.serviceId) {
          setSelectedServiceId(cfg.serviceId)
        }
      }

      const localKey = typeof window !== 'undefined' ? localStorage.getItem('render_api_key') : null
      const effectiveKey = cfg?.apiKey || localKey || ''

      if (effectiveKey) {
        await fetchServices(effectiveKey, cfg?.serviceId)
      }
      await fetchCronJobs()
    } catch (e: any) {
      console.warn('Erro ao carregar configs do Render:', e.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchServices = async (token = '', initialServiceId = '') => {
    const key = token || apiKey || (typeof window !== 'undefined' ? localStorage.getItem('render_api_key') : '') || ''
    if (!key) return

    try {
      setError('')
      const res = await fetch(`${apiUrl}/api/render/services`, {
        headers: { 'x-render-key': key }
      })
      const result = await res.json()

      if (result.error) {
        setError(result.error)
      } else if (Array.isArray(result.services)) {
        setServices(result.services)
        const targetId = initialServiceId || selectedServiceId || result.services[0]?.id || ''
        setSelectedServiceId(targetId)
        if (targetId) {
          fetchDeploys(targetId, key)
        }
      }
    } catch (e: any) {
      setError(e.message)
    }
  }

  const fetchDeploys = async (serviceId: string, token = '') => {
    if (!serviceId) return
    const key = token || apiKey || (typeof window !== 'undefined' ? localStorage.getItem('render_api_key') : '') || ''
    try {
      const res = await fetch(`${apiUrl}/api/render/services/${serviceId}/deploys?limit=8`, {
        headers: { 'x-render-key': key }
      })
      const data = await res.json()
      setDeploysData(data)
    } catch (e: any) {
      console.warn('Erro ao buscar deploys:', e.message)
    }
  }

  const fetchCronJobs = async () => {
    try {
      setCronLoading(true)
      const res = await fetch(`${apiUrl}/api/cron/jobs`)
      const data = await res.json()
      if (Array.isArray(data.jobs)) {
        setCronJobs(data.jobs)
      }
    } catch (e: any) {
      console.warn('Erro ao buscar cron jobs:', e.message)
    } finally {
      setCronLoading(false)
    }
  }

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId)
    fetchDeploys(serviceId)
    // Atualiza URL do Anti-Sleep sugerida
    const s = services.find(x => x.id === serviceId)
    if (s?.url) {
      const defaultAntiSleep = cronJobs.find(j => j.id === 'cron_render_antisleep')
      if (defaultAntiSleep && !defaultAntiSleep.targetUrl.includes(s.id)) {
        setNewCronForm(prev => ({ ...prev, targetUrl: `${s.url}/api/health` }))
      }
    }
  }

  const handleTriggerDeploy = async () => {
    if (!selectedServiceId) return
    setDeploying(true)
    doAction('Disparando novo deploy no Render...')
    try {
      const key = apiKey || localStorage.getItem('render_api_key') || ''
      const res = await fetch(`${apiUrl}/api/render/services/${selectedServiceId}/deploys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-render-key': key
        },
        body: JSON.stringify({ clearCache })
      })
      const json = await res.json()
      if (json.success) {
        doAction('✅ Deploy iniciado com sucesso no Render!')
        setTimeout(() => fetchDeploys(selectedServiceId), 2500)
      } else {
        doAction(`Erro no deploy: ${json.error || 'Falha na requisição'}`)
      }
    } catch (e: any) {
      doAction(`Erro: ${e.message}`)
    } finally {
      setDeploying(false)
    }
  }

  const handleRestartService = async () => {
    if (!selectedServiceId) return
    setRestarting(true)
    doAction('Enviando sinal de reinicialização para o Render...')
    try {
      const key = apiKey || localStorage.getItem('render_api_key') || ''
      const res = await fetch(`${apiUrl}/api/render/services/${selectedServiceId}/restart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-render-key': key
        }
      })
      const json = await res.json()
      if (json.success) {
        doAction('✅ Serviço reiniciado com sucesso no Render!')
      } else {
        doAction(`Erro ao reiniciar: ${json.error || 'Falha'}`)
      }
    } catch (e: any) {
      doAction(`Erro: ${e.message}`)
    } finally {
      setRestarting(false)
    }
  }

  const handleSaveApiKey = async () => {
    const trimmed = apiKey.trim()
    if (!trimmed) {
      setError('Por favor, informe a API Key do Render.')
      return
    }

    try {
      setTestingKey(true)
      setError('')
      const testRes = await fetch(`${apiUrl}/api/render/test-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: trimmed })
      })
      const testJson = await testRes.json()

      if (testJson.valid) {
        setKeyStatus('valid')
        setKeyUser(testJson.user)
        if (typeof window !== 'undefined') {
          localStorage.setItem('render_api_key', trimmed)
        }

        // Salva no backend
        await fetch(`${apiUrl}/api/render/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: trimmed, serviceId: selectedServiceId })
        })

        setSaveSuccess(true)
        doAction('✅ Chave de API do Render validada e salva!')
        await fetchServices(trimmed)
        setTimeout(() => {
          setSaveSuccess(false)
          setConfigModalOpen(false)
        }, 1200)
      } else {
        setKeyStatus('invalid')
        setError(testJson.error || 'Chave de API do Render inválida.')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setTestingKey(false)
    }
  }

  // Ações de Cron Jobs
  const handleToggleCron = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/cron/jobs/${id}/toggle`, { method: 'PUT' })
      const json = await res.json()
      if (json.success) {
        setCronJobs(prev => prev.map(j => j.id === id ? json.job : j))
        doAction(json.job.enabled ? '⚡ Guardião Anti-Sleep ATIVADO!' : 'Guardião Anti-Sleep pausado.')
      }
    } catch (e: any) {
      doAction(`Erro: ${e.message}`)
    }
  }

  const handleRunCronNow = async (id: string) => {
    try {
      setPingingNow(true)
      doAction('Disparando ping Keep-Alive imediato...')
      const res = await fetch(`${apiUrl}/api/cron/jobs/${id}/run-now`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setCronJobs(prev => prev.map(j => j.id === id ? json.job : j))
        doAction(`✅ Ping bem-sucedido! Status: ${json.execution.status} (${json.execution.latencyMs}ms)`)
      } else {
        doAction(`Falha no ping: ${json.error}`)
      }
    } catch (e: any) {
      doAction(`Erro no ping: ${e.message}`)
    } finally {
      setPingingNow(false)
    }
  }

  const handleDeleteCron = async (id: string) => {
    try {
      await fetch(`${apiUrl}/api/cron/jobs/${id}`, { method: 'DELETE' })
      setCronJobs(prev => prev.filter(j => j.id !== id))
      doAction('Cron Job removido.')
    } catch (e: any) {
      doAction(`Erro: ${e.message}`)
    }
  }

  const handleCreateCron = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCronForm.targetUrl.trim()) return
    try {
      const res = await fetch(`${apiUrl}/api/cron/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCronForm)
      })
      const json = await res.json()
      if (json.success) {
        setCronJobs(prev => [...prev, json.job])
        setNewCronModal(false)
        setNewCronForm({ name: '', targetUrl: '', intervalMinutes: 10 })
        doAction('✅ Novo Cron Job cadastrado com sucesso!')
      }
    } catch (e: any) {
      doAction(`Erro: ${e.message}`)
    }
  }

  const currentService = services.find(s => s.id === selectedServiceId)
  const antiSleepJob = cronJobs.find(j => j.id === 'cron_render_antisleep')

  const connectionString = `mysql://${mysqlConfig.user}:${mysqlConfig.password}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`

  return (
    <div className="space-y-6">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#101719] border border-[#182326] shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#46e3b7]/10 border border-[#46e3b7]/30 flex items-center justify-center text-[#46e3b7] shadow-inner">
            <RenderIcon size={28} color="#46e3b7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#D9E2E1]">Render PaaS & Web Services</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#46e3b7]/15 text-[#46e3b7] border border-[#46e3b7]/30">
                Backend & Docker
              </span>
            </div>
            <p className="text-xs text-[#6F8387] mt-0.5">
              Deploy contínuo de APIs Node.js/Python, WebSockets, containers e Guardião Anti-Sleep
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfigModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl bg-[#182326] hover:bg-[#223136] text-[#D9E2E1] border border-[#223136] transition-all"
          >
            <KeyRound size={14} className={keyStatus === 'valid' ? 'text-[#A3E635]' : 'text-[#F4B942]'} />
            {keyStatus === 'valid' ? 'API Key Conectada' : 'Conectar API Key'}
          </button>

          <button
            onClick={() => {
              fetchServices()
              if (selectedServiceId) fetchDeploys(selectedServiceId)
              fetchCronJobs()
              doAction('Atualizando dados do Render...')
            }}
            className="p-2 text-xs rounded-xl bg-[#182326] hover:bg-[#223136] text-[#6F8387] hover:text-[#D9E2E1] border border-[#223136] transition-all"
            title="Recarregar dados"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* NAVEGAÇÃO DE SUB-ABAS */}
      <div className="flex items-center gap-2 border-b border-[#182326] pb-3">
        <button
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'services'
              ? 'bg-[#20D6C7]/15 text-[#20D6C7] border border-[#20D6C7]/30'
              : 'text-[#6F8387] hover:text-[#D9E2E1] hover:bg-[#101719]'
          }`}
        >
          <Server size={14} />
          Web Services & Deploys
          {services.length > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#20D6C7]/20 text-[#20D6C7]">
              {services.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cron')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'cron'
              ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30'
              : 'text-[#6F8387] hover:text-[#D9E2E1] hover:bg-[#101719]'
          }`}
        >
          <Clock size={14} />
          Cron Jobs & Anti-Sleep
          {antiSleepJob?.enabled && (
            <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('mysql')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeTab === 'mysql'
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30'
              : 'text-[#6F8387] hover:text-[#D9E2E1] hover:bg-[#101719]'
          }`}
        >
          <Database size={14} />
          MySQL Docker & Conexão
        </button>
      </div>

      {/* ERRO GERAL */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[#FF6B6B]/10 border border-[#FF6B6B]/30 text-[#FF6B6B] text-xs">
          <AlertCircle size={16} className="shrink-0" />
          <div className="flex-1">{error}</div>
          <button onClick={() => setError('')} className="hover:underline text-[11px]">Fechar</button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: SERVIÇOS & DEPLOYS */}
      {/* ========================================================================= */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          {/* SELETOR DE SERVIÇOS & STATUS PRINCIPAL */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Card Principal do Serviço Selecionado */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-[#101719] border border-[#182326] space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#6F8387] tracking-wider uppercase">Serviço Selecionado</div>
                  <div className="flex items-center gap-2 mt-1">
                    {services.length > 0 ? (
                      <select
                        value={selectedServiceId}
                        onChange={(e) => handleServiceChange(e.target.value)}
                        className="bg-[#080B0D] border border-[#223136] text-[#D9E2E1] font-bold text-base rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#46e3b7]"
                      >
                        {services.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.type === 'web_service' ? 'Web Service' : s.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm text-[#D9E2E1] font-semibold">
                        {keyStatus === 'valid' ? 'Nenhum serviço encontrado no Render' : 'Conecte sua API Key para carregar serviços'}
                      </span>
                    )}

                    {currentService?.status && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                        currentService.status === 'active'
                          ? 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/30'
                          : 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30'
                      }`}>
                        {currentService.status === 'active' ? '🟢 Ativo' : '🔴 Pausado'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação Imediata */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRestartService}
                    disabled={restarting || !selectedServiceId}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#182326] hover:bg-[#223136] text-[#D9E2E1] border border-[#223136] transition-all disabled:opacity-50"
                  >
                    <Power size={13} className={restarting ? 'animate-spin' : ''} />
                    {restarting ? 'Reiniciando...' : 'Reiniciar'}
                  </button>

                  <button
                    onClick={handleTriggerDeploy}
                    disabled={deploying || !selectedServiceId}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#46e3b7] hover:bg-[#34c7a0] text-[#080B0D] shadow-lg shadow-[#46e3b7]/20 transition-all disabled:opacity-50"
                  >
                    <Zap size={14} className={deploying ? 'animate-bounce' : ''} />
                    {deploying ? 'Disparando...' : '🚀 Fazer Deploy'}
                  </button>
                </div>
              </div>

              {/* URL Pública e Repositório */}
              {currentService ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3.5 rounded-xl bg-[#080B0D] border border-[#182326] flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-[#6F8387]">URL PÚBLICA DA API</div>
                      {currentService.url ? (
                        <a
                          href={currentService.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#20D6C7] hover:underline flex items-center gap-1 mt-0.5"
                        >
                          {currentService.url.replace('https://', '')}
                          <ArrowUpRight size={12} />
                        </a>
                      ) : (
                        <span className="text-xs text-[#6F8387]">Não atribuída</span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#080B0D] border border-[#182326]">
                    <div className="text-[11px] text-[#6F8387]">REPOSITÓRIO & BRANCH</div>
                    <div className="text-xs font-semibold text-[#D9E2E1] flex items-center gap-1.5 mt-0.5 truncate">
                      <GitBranch size={13} className="text-[#A3E635]" />
                      <span className="truncate">{currentService.repo ? currentService.repo.split('/').slice(-2).join('/') : 'Manual / Docker'}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-[#182326] text-[#6F8387] rounded">{currentService.branch || 'main'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#6F8387] p-4 bg-[#080B0D] rounded-xl border border-[#182326]">
                  Adicione sua Render API Key nas configurações para gerenciar deploys e ver a URL do seu serviço.
                </div>
              )}

              {/* Opção de Limpar Cache no Deploy */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="clearCache"
                  checked={clearCache}
                  onChange={(e) => setClearCache(e.target.checked)}
                  className="rounded border-[#223136] bg-[#080B0D] text-[#46e3b7] focus:ring-0 cursor-pointer"
                />
                <label htmlFor="clearCache" className="text-xs text-[#6F8387] cursor-pointer select-none">
                  Limpar cache de build antes do deploy (útil se você mudou pacotes no package.json)
                </label>
              </div>
            </div>

            {/* Card Lateral: Status do Guardião Anti-Sleep */}
            <div className="p-6 rounded-2xl bg-[#101719] border border-[#182326] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6F8387] uppercase tracking-wider">Guardião Anti-Sleep</span>
                  <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                    antiSleepJob?.enabled
                      ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30'
                      : 'bg-[#6F8387]/15 text-[#6F8387] border border-[#6F8387]/30'
                  }`}>
                    {antiSleepJob?.enabled ? 'Ativo 24/7' : 'Desativado'}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#D9E2E1] mt-2">Zero Cold-Start no Render Free</h3>
                <p className="text-xs text-[#6F8387] mt-1">
                  O plano Free do Render desliga sua API após 15 min de inatividade. O Guardião dá um ping a cada 10 min para manter a resposta em menos de 50ms.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => antiSleepJob && handleToggleCron(antiSleepJob.id)}
                  disabled={!antiSleepJob}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    antiSleepJob?.enabled
                      ? 'bg-[#FF6B6B]/15 hover:bg-[#FF6B6B]/25 text-[#FF6B6B] border border-[#FF6B6B]/30'
                      : 'bg-[#A3E635] hover:bg-[#8fd128] text-[#080B0D] shadow-lg shadow-[#A3E635]/20'
                  }`}
                >
                  <Activity size={14} />
                  {antiSleepJob?.enabled ? 'Pausar Guardião Anti-Sleep' : '⚡ Ativar Guardião Agora'}
                </button>

                {antiSleepJob?.lastRun && (
                  <div className="text-[11px] text-center text-[#6F8387]">
                    Último ping: {new Date(antiSleepJob.lastRun).toLocaleTimeString('pt-BR')} ({antiSleepJob.lastLatencyMs || 45}ms)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE DEPLOYS */}
          <div className="p-6 rounded-2xl bg-[#101719] border border-[#182326] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#D9E2E1]">Histórico de Deploys</h3>
                <p className="text-xs text-[#6F8387]">Últimas execuções e compilações no Render</p>
              </div>
              <span className="text-xs text-[#6F8387]">
                {deploysData?.deploys?.length || 0} deploys registrados
              </span>
            </div>

            {deploysData?.deploys && deploysData.deploys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#D9E2E1]">
                  <thead>
                    <tr className="border-b border-[#182326] text-[#6F8387] font-semibold text-[11px]">
                      <th className="pb-3">STATUS</th>
                      <th className="pb-3">MENSAGEM / COMMIT</th>
                      <th className="pb-3">GATILHO</th>
                      <th className="pb-3">DATA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182326]">
                    {deploysData.deploys.map((dep: any) => {
                      const isLive = dep.status === 'live'
                      const isBuilding = dep.status === 'build_in_progress'
                      const isFailed = dep.status === 'build_failed'
                      return (
                        <tr key={dep.id} className="hover:bg-[#182326]/40 transition-colors">
                          <td className="py-3.5 pr-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                              isLive
                                ? 'bg-[#A3E635]/15 text-[#A3E635] border-[#A3E635]/30'
                                : isBuilding
                                ? 'bg-[#F4B942]/15 text-[#F4B942] border-[#F4B942]/30 animate-pulse'
                                : isFailed
                                ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border-[#FF6B6B]/30'
                                : 'bg-[#6F8387]/15 text-[#6F8387] border-[#6F8387]/30'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#A3E635]' : isBuilding ? 'bg-[#F4B942]' : isFailed ? 'bg-[#FF6B6B]' : 'bg-[#6F8387]'}`} />
                              {dep.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 pr-4">
                            <div className="font-medium text-[#D9E2E1] max-w-xs truncate">
                              {dep.commit?.message || 'Deploy acionado pelo painel'}
                            </div>
                            {dep.commit?.id && (
                              <div className="text-[10px] text-[#6F8387] font-mono mt-0.5">
                                commit #{dep.commit.id}
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 pr-4 text-[#6F8387]">
                            <span className="capitalize">{dep.trigger === 'clear_cache' ? 'Limpeza de Cache' : dep.trigger}</span>
                          </td>
                          <td className="py-3.5 text-[#6F8387]">
                            {new Date(dep.createdAt).toLocaleString('pt-BR')}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10 text-xs text-[#6F8387] border border-dashed border-[#182326] rounded-xl">
                Nenhum deploy listado para este serviço no momento.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: CRON JOBS & ANTI-SLEEP */}
      {/* ========================================================================= */}
      {activeTab === 'cron' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 rounded-2xl bg-[#101719] border border-[#182326]">
            <div>
              <h3 className="text-base font-bold text-[#D9E2E1]">Agendador de Cron Jobs & Pings Automáticos</h3>
              <p className="text-xs text-[#6F8387]">
                Mantenha suas APIs acordadas e configure rotinas de checagem periódica
              </p>
            </div>
            <button
              onClick={() => setNewCronModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#20D6C7] hover:bg-[#1ab8ab] text-[#080B0D] transition-all self-start"
            >
              <Plus size={14} />
              + Novo Cron Job
            </button>
          </div>

          {/* LISTA DE CRON JOBS */}
          <div className="grid grid-cols-1 gap-4">
            {cronJobs.map((job) => {
              const isAntiSleep = job.id === 'cron_render_antisleep'
              return (
                <div
                  key={job.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    job.enabled
                      ? 'bg-[#101719] border-[#A3E635]/30 shadow-lg shadow-[#A3E635]/5'
                      : 'bg-[#101719] border-[#182326]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#D9E2E1]">{job.name}</span>
                        {isAntiSleep && (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#46e3b7]/15 text-[#46e3b7] border border-[#46e3b7]/30">
                            Render Keep-Alive
                          </span>
                        )}
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          job.enabled ? 'bg-[#A3E635]/15 text-[#A3E635]' : 'bg-[#6F8387]/20 text-[#6F8387]'
                        }`}>
                          {job.enabled ? '🟢 ATIVO' : '⚪ PAUSADO'}
                        </span>
                      </div>

                      <div className="text-xs text-[#20D6C7] font-mono break-all">
                        {job.targetUrl}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#6F8387] pt-1">
                        <span>⏱️ Intervalo: <strong>a cada {job.intervalMinutes} min</strong></span>
                        <span>•</span>
                        <span>Último Status: <strong className={job.lastStatus === 200 ? 'text-[#A3E635]' : 'text-[#FF6B6B]'}>{job.lastStatus || '—'}</strong></span>
                        {job.lastLatencyMs && (
                          <>
                            <span>•</span>
                            <span>Latência: <strong>{job.lastLatencyMs}ms</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Ações do Job */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRunCronNow(job.id)}
                        disabled={pingingNow}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#182326] hover:bg-[#223136] text-[#D9E2E1] border border-[#223136]"
                        title="Executar ping de teste agora"
                      >
                        <PlayCircle size={13} className="text-[#20D6C7]" />
                        Testar Ping
                      </button>

                      <button
                        onClick={() => handleToggleCron(job.id)}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          job.enabled
                            ? 'bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30 hover:bg-[#FF6B6B]/25'
                            : 'bg-[#A3E635] text-[#080B0D] hover:bg-[#8fd128]'
                        }`}
                      >
                        {job.enabled ? 'Pausar' : 'Ativar'}
                      </button>

                      {!isAntiSleep && (
                        <button
                          onClick={() => handleDeleteCron(job.id)}
                          className="p-2 text-[#6F8387] hover:text-[#FF6B6B] transition-colors"
                          title="Excluir Job"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Histórico dos últimos pings */}
                  {job.history && job.history.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-[#182326]">
                      <div className="text-[11px] text-[#6F8387] mb-2 font-medium">Últimos pings registrados:</div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        {job.history.slice(0, 10).map((h: any, idx: number) => (
                          <div
                            key={idx}
                            className={`px-2 py-1 rounded text-[10px] font-mono shrink-0 flex items-center gap-1 ${
                              h.status >= 200 && h.status < 300
                                ? 'bg-[#A3E635]/15 text-[#A3E635] border border-[#A3E635]/30'
                                : 'bg-[#FF6B6B]/15 text-[#FF6B6B] border border-[#FF6B6B]/30'
                            }`}
                            title={`${new Date(h.timestamp).toLocaleTimeString('pt-BR')} - ${h.latencyMs}ms`}
                          >
                            <span>{h.status || 'ERR'}</span>
                            <span className="opacity-70">{h.latencyMs}ms</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: MYSQL DOCKER NA VM ORACLE */}
      {/* ========================================================================= */}
      {activeTab === 'mysql' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#101719] border border-[#182326] space-y-4">
            <div className="flex items-center gap-2">
              <Database size={20} className="text-[#38BDF8]" />
              <h3 className="text-base font-bold text-[#D9E2E1]">Banco de Dados MySQL Persistente (Grátis na VM Oracle)</h3>
            </div>
            <p className="text-xs text-[#6F8387] leading-relaxed">
              Diferente do Render (onde o banco gratuito expira após 30 a 90 dias), rodar o MySQL em Docker na sua VM da Oracle garante que seus dados são <strong>100% seus, nunca expiram e rodam 24/7 de graça</strong>.
            </p>

            {/* Comando Docker para rodar na VM */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-[#D9E2E1]">Comando para iniciar o MySQL via Docker na VM:</label>
              <div className="p-3.5 rounded-xl bg-[#080B0D] border border-[#182326] font-mono text-xs text-[#38BDF8] flex items-center justify-between break-all">
                <span>docker run -d --name mysql-db -p 3306:3306 -v mysql_data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=suasenha mysql:8.0</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('docker run -d --name mysql-db -p 3306:3306 -v mysql_data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=suasenha mysql:8.0')
                    doAction('Comando copiado!')
                  }}
                  className="ml-2 px-2.5 py-1 bg-[#182326] hover:bg-[#223136] text-white rounded text-[11px] shrink-0"
                >
                  Copiar
                </button>
              </div>
            </div>
          </div>

          {/* Gerador de String de Conexão DATABASE_URL */}
          <div className="p-6 rounded-2xl bg-[#101719] border border-[#182326] space-y-4">
            <h4 className="text-sm font-bold text-[#D9E2E1]">Gerador de String de Conexão (Para colar nas variáveis do Render)</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-[#6F8387] block mb-1">Host / IP da VM</label>
                <input
                  type="text"
                  value={mysqlConfig.host}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, host: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6F8387] block mb-1">Porta</label>
                <input
                  type="text"
                  value={mysqlConfig.port}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, port: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6F8387] block mb-1">Usuário</label>
                <input
                  type="text"
                  value={mysqlConfig.user}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, user: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#6F8387] block mb-1">Senha</label>
                <input
                  type="text"
                  value={mysqlConfig.password}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] text-[#6F8387] block mb-1">Nome do Banco (Database)</label>
                <input
                  type="text"
                  value={mysqlConfig.database}
                  onChange={(e) => setMysqlConfig({ ...mysqlConfig, database: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="text-xs font-semibold text-[#D9E2E1] block mb-1.5">Variável DATABASE_URL para o Render:</label>
              <div className="p-3.5 rounded-xl bg-[#080B0D] border border-[#182326] font-mono text-xs text-[#A3E635] flex items-center justify-between break-all">
                <span>{connectionString}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(connectionString)
                    setCopiedString(true)
                    doAction('DATABASE_URL copiada!')
                    setTimeout(() => setCopiedString(false), 2000)
                  }}
                  className="ml-2 px-3 py-1 bg-[#20D6C7] text-[#080B0D] font-bold rounded text-xs shrink-0"
                >
                  {copiedString ? '✓ Copiado!' : 'Copiar URL'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CONFIGURAÇÃO DE CHAVE DE API DO RENDER */}
      {/* ========================================================================= */}
      {configModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-[#101719] border border-[#223136] shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RenderIcon size={20} color="#46e3b7" />
                <h3 className="text-base font-bold text-[#D9E2E1]">Configurar Render API Key</h3>
              </div>
              <button onClick={() => setConfigModalOpen(false)} className="text-[#6F8387] hover:text-[#D9E2E1]">✕</button>
            </div>

            <p className="text-xs text-[#6F8387] leading-relaxed">
              Para listar seus Web Services e disparar deploys, informe sua chave de API pessoal do Render.
              Você pode gerar uma chave em{' '}
              <a href="https://dashboard.render.com/u/settings#api-keys" target="_blank" rel="noreferrer" className="text-[#46e3b7] underline">
                dashboard.render.com ➔ Account Settings ➔ API Keys
              </a>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#D9E2E1]">Render API Key (começa com rnd_):</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="rnd_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1] focus:outline-none focus:border-[#46e3b7] font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-2.5 text-[#6F8387] hover:text-[#D9E2E1]"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {keyUser && (
              <div className="p-3 rounded-xl bg-[#A3E635]/10 border border-[#A3E635]/30 text-xs text-[#A3E635] flex items-center gap-2">
                <ShieldCheck size={16} />
                <span>Conta verificada: <strong>{keyUser.name || keyUser.email}</strong></span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfigModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-[#182326] hover:bg-[#223136] text-[#D9E2E1]"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveApiKey}
                disabled={testingKey}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#46e3b7] hover:bg-[#34c7a0] text-[#080B0D] transition-all disabled:opacity-50"
              >
                {testingKey ? 'Validando...' : saveSuccess ? '✓ Salvo!' : 'Salvar e Conectar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NOVO CRON JOB */}
      {/* ========================================================================= */}
      {newCronModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#101719] border border-[#223136] shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#D9E2E1]">Cadastrar Novo Cron Job</h3>

            <form onSubmit={handleCreateCron} className="space-y-4">
              <div>
                <label className="text-xs text-[#6F8387] block mb-1">Nome do Cron Job</label>
                <input
                  type="text"
                  placeholder="Ex: Checagem API Pagamentos"
                  value={newCronForm.name}
                  onChange={(e) => setNewCronForm({ ...newCronForm, name: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6F8387] block mb-1">URL Alvo (Endpoint que receberá o GET)</label>
                <input
                  type="url"
                  placeholder="https://sua-api.onrender.com/api/health"
                  value={newCronForm.targetUrl}
                  onChange={(e) => setNewCronForm({ ...newCronForm, targetUrl: e.target.value })}
                  required
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                />
              </div>

              <div>
                <label className="text-xs text-[#6F8387] block mb-1">Intervalo em Minutos</label>
                <select
                  value={newCronForm.intervalMinutes}
                  onChange={(e) => setNewCronForm({ ...newCronForm, intervalMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#080B0D] border border-[#223136] text-[#D9E2E1]"
                >
                  <option value={5}>A cada 5 minutos</option>
                  <option value={10}>A cada 10 minutos (Recomendado para Anti-Sleep)</option>
                  <option value={14}>A cada 14 minutos</option>
                  <option value={30}>A cada 30 minutos</option>
                  <option value={60}>A cada 1 hora</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewCronModal(false)}
                  className="px-3.5 py-1.5 text-xs text-[#D9E2E1] bg-[#182326] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-[#080B0D] bg-[#20D6C7] rounded-xl"
                >
                  Criar Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
