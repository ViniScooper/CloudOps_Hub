'use client'

import React, { useState, useEffect } from 'react'
import {
  Globe, ExternalLink, RefreshCw, Zap, CheckCircle2, AlertCircle,
  Clock, GitBranch, GitCommit, User, KeyRound, Eye, EyeOff, ShieldCheck,
  Play, Settings, Layers, ArrowUpRight, Check, Sparkles
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

// Ícone vetorial oficial da Vercel (Triângulo clássico)
export function VercelIcon({ size = 16, color = 'currentColor', style = {} }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <path d="M24 22.525H0l12-21.05 12 21.05z" />
    </svg>
  )
}

interface VercelDeploymentsViewProps {
  doAction: (msg: string) => void
}

export function VercelDeploymentsView({ doAction }: VercelDeploymentsViewProps) {
  const [loading, setLoading] = useState(true)
  const [redeploying, setRedeploying] = useState(false)
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string>('')
  
  // Configurações e Chave de Acesso
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [vercelToken, setVercelToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [deployHookUrl, setDeployHookUrl] = useState('')
  const [testingToken, setTestingToken] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [tokenUser, setTokenUser] = useState<any>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Carrega configurações e status de deployments
  const fetchDeployments = async () => {
    try {
      setLoading(true)
      const tokenHeader = vercelToken || localStorage.getItem('vercel_user_token') || ''
      
      const res = await fetch(getApiUrl('/api/vercel/deployments?limit=8'), {
        headers: tokenHeader ? { 'x-vercel-token': tokenHeader } : {}
      })
      const result = await res.json()
      
      if (result.error) {
        setError(result.error)
      } else {
        setError('')
      }
      setData(result)
    } catch (e: any) {
      console.warn('Erro ao carregar deployments da Vercel:', e.message)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  // Carrega configuração salva no backend e no localStorage
  const loadConfig = async () => {
    try {
      const res = await fetch(getApiUrl('/api/vercel/config'))
      const cfg = await res.json()
      if (cfg) {
        setProjectName(cfg.projectName || '')
        setDeployHookUrl(cfg.deployHookUrl || '')
        if (cfg.token && !cfg.token.startsWith('gsk_')) {
          setVercelToken(cfg.token)
          setTokenStatus('valid')
        } else if (cfg.token && cfg.token.startsWith('gsk_')) {
          setVercelToken('')
        }
      }

      const localToken = typeof window !== 'undefined' ? localStorage.getItem('vercel_user_token') : null
      if (localToken) {
        if (localToken.startsWith('gsk_')) {
          // Detectou chave Groq salva por engano, remove automaticamente
          localStorage.removeItem('vercel_user_token')
          setVercelToken('')
        } else if (!vercelToken) {
          setVercelToken(localToken)
          setTokenStatus('valid')
        }
      }
    } catch (e) {
      console.warn('Erro ao ler config da Vercel:', e)
    }
  }

  useEffect(() => {
    loadConfig().then(() => {
      fetchDeployments()
    })
  }, [])

  // Dispara novo deploy (Redeploy)
  const handleRedeploy = async (deploymentId = '') => {
    try {
      setRedeploying(true)
      doAction('Disparando redeploy na Vercel...')
      const tokenHeader = vercelToken || localStorage.getItem('vercel_user_token') || ''

      const res = await fetch(getApiUrl('/api/vercel/redeploy'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokenHeader ? { 'x-vercel-token': tokenHeader } : {})
        },
        body: JSON.stringify({ deploymentId })
      })

      const json = await res.json()
      if (json.success) {
        doAction('✅ Redeploy disparado com sucesso na Vercel!')
        // Aguarda 2 segundos e recarrega os dados para mostrar o novo build
        setTimeout(fetchDeployments, 2500)
      } else {
        doAction(`Erro ao disparar redeploy: ${json.error || 'Falha na requisição'}`)
      }
    } catch (e: any) {
      doAction(`Falha na conexão com o backend: ${e.message}`)
    } finally {
      setRedeploying(false)
    }
  }

  // Testa e salva as configurações da Vercel
  const handleSaveToken = async () => {
    const trimmedToken = vercelToken.trim()
    const trimmedHook = deployHookUrl.trim()
    const trimmedProject = projectName.trim()

    if (trimmedToken.startsWith('gsk_')) {
      setError('⚠️ Atenção: A chave informada começa com "gsk_", que é uma chave da Groq (IA) e não da Vercel! Deixe o campo de Token vazio (usando apenas o Deploy Hook) ou crie um Token oficial da Vercel em vercel.com/account/tokens.')
      setTokenStatus('invalid')
      return
    }

    try {
      setTestingToken(true)
      setError('')

      if (trimmedToken) {
        const testRes = await fetch(getApiUrl('/api/vercel/test-token'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: trimmedToken })
        })
        const testJson = await testRes.json()

        if (testJson.valid) {
          setTokenStatus('valid')
          setTokenUser(testJson.user)
          if (typeof window !== 'undefined') {
            localStorage.setItem('vercel_user_token', trimmedToken)
          }
        } else {
          setTokenStatus('invalid')
          setError(testJson.error || 'Token da Vercel inválido ou sem permissão.')
          setTestingToken(false)
          return
        }
      } else {
        // Sem token pessoal (apenas Deploy Hook)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vercel_user_token')
        }
        setTokenStatus('idle')
        setTokenUser(null)
      }

      // Salva no backend
      await fetch(getApiUrl('/api/vercel/config'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: trimmedToken,
          projectName: trimmedProject,
          deployHookUrl: trimmedHook
        })
      })

      setSaveSuccess(true)
      doAction(trimmedToken ? '✅ Token e configurações da Vercel salvos!' : '✅ Deploy Hook da Vercel configurado com sucesso!')
      setTimeout(() => {
        setSaveSuccess(false)
        setConfigModalOpen(false)
        fetchDeployments()
      }, 1000)
    } catch (e: any) {
      setTokenStatus('invalid')
      setError(`Falha ao conectar: ${e.message}`)
    } finally {
      setTestingToken(false)
    }
  }

  const latest = data?.latest
  const isReady = latest?.state === 'READY' || latest?.state === 'ready'
  const isBuilding = latest?.state === 'BUILDING' || latest?.state === 'building' || redeploying

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
      
      {/* 1. CABEÇALHO DA SEÇÃO */}
      <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #091215 0%, #000 100%)',
            border: '1px solid #1a2a2e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            color: '#fff'
          }}>
            <VercelIcon size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#f0fdfa' }}>
                Vercel Edge Deployments
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: '12px',
                background: isReady ? 'rgba(16, 185, 129, 0.15)' : isBuilding ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isReady ? '#10b981' : isBuilding ? '#f59e0b' : '#ef4444',
                border: isReady ? '1px solid rgba(16, 185, 129, 0.3)' : isBuilding ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                {isBuilding ? <RefreshCw size={11} className="spinning" /> : isReady ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {isBuilding ? 'Compilando Build...' : isReady ? 'Produção Online' : 'Aguardando Sincronização'}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#68868a' }}>
              Monitoramento em tempo real, status de CDN Edge e disparador de deploy para o Cardápio Digital.
            </p>
          </div>
        </div>

        {/* Botões de Ação do Cabeçalho */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setConfigModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              background: '#091215',
              border: '1px solid #1a2c31',
              color: '#dbe7e8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#20d6c7')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a2c31')}
          >
            <KeyRound size={13} style={{ color: tokenStatus === 'valid' ? '#20d6c7' : '#f59e0b' }} />
            <span>Configurar Token</span>
          </button>

          <button
            onClick={() => handleRedeploy()}
            disabled={redeploying}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: redeploying ? '#152528' : 'linear-gradient(135deg, #20d6c7 0%, #0284c7 100%)',
              border: 'none',
              color: redeploying ? '#88a6aa' : '#041014',
              fontSize: '12.5px',
              fontWeight: 700,
              cursor: redeploying ? 'not-allowed' : 'pointer',
              boxShadow: redeploying ? 'none' : '0 0 20px rgba(32, 214, 199, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            {redeploying ? <RefreshCw size={14} className="spinning" /> : <Zap size={14} />}
            <span>{redeploying ? 'Recompilando...' : 'Forçar Redeploy Vercel'}</span>
          </button>
        </div>
      </div>

      {/* 2. CARDS DE TOPOLOGIA & ESTADO DO FRONTEND */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
        
        {/* Card 1: Projeto e Repositório */}
        <div style={{ background: '#0a1013', border: '1px solid #162428', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#68868a', fontWeight: 600, textTransform: 'uppercase' }}>
              Projeto Vercel
            </span>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '11px', color: '#20d6c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Abrir Dashboard <ArrowUpRight size={12} />
            </a>
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#f0fdfa' }}>
            {data?.projectName || projectName || 'Nenhum projeto configurado'}
          </div>
          <div style={{ fontSize: '11px', color: '#88a6aa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitBranch size={13} style={{ color: '#20d6c7' }} />
            <span>Branch Ativa: <b style={{ color: '#fff' }}>main</b> (sincronizada com GitHub)</span>
          </div>
        </div>

        {/* Card 2: Domínio Público & SSL */}
        <div style={{ background: '#0a1013', border: '1px solid #162428', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#68868a', fontWeight: 600, textTransform: 'uppercase' }}>
              Domínio Oficial
            </span>
            <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <ShieldCheck size={12} /> SSL Automático
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#f0fdfa', fontFamily: 'monospace' }}>
            {data?.domain ? (
              <a
                href={`https://${data.domain}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#20d6c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {data.domain} <ExternalLink size={13} />
              </a>
            ) : (
              <span style={{ color: '#6f8387', fontSize: '13px' }}>Aguardando configuração de domínio</span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#88a6aa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Globe size={13} style={{ color: '#20d6c7' }} />
            <span>Edge Network: <b>Global Anycast</b> / Latência ultrabaixa</span>
          </div>
        </div>

        {/* Card 3: Commit Ativo na Nuvem */}
        <div style={{ background: '#0a1013', border: '1px solid #162428', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#68868a', fontWeight: 600, textTransform: 'uppercase' }}>
              Último Commit Compilado
            </span>
            <span style={{ fontSize: '10px', color: '#20d6c7', fontFamily: 'monospace', fontWeight: 700 }}>
              {latest?.meta?.commitSha ? latest.meta.commitSha.slice(0, 7) : '—'}
            </span>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#f0fdfa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {latest?.meta?.commitMessage || 'Aguardando sincronização de deploy'}
          </div>
          <div style={{ fontSize: '11px', color: '#88a6aa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <User size={12} style={{ color: '#20d6c7' }} />
            <span>Autor: <b style={{ color: '#fff' }}>{latest?.meta?.commitAuthor || 'DevOps CI/CD'}</b></span>
          </div>
        </div>
      </div>

      {/* 3. DICA DE LIMPEZA DE CACHE DO NAVEGADOR */}
      <div style={{
        background: 'rgba(32, 214, 199, 0.05)',
        border: '1px solid rgba(32, 214, 199, 0.2)',
        borderRadius: '10px',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#bce4e8' }}>
          <Sparkles size={16} style={{ color: '#20d6c7' }} />
          <span>
            <b>Dica de Cache:</b> Se você fez um deploy e ainda estiver vendo textos antigos no navegador, use o atalho <b>Ctrl + Shift + R</b> (ou abra em aba anônima) para forçar o recarregamento direto do Edge da Vercel.
          </span>
        </div>
        <button
          onClick={fetchDeployments}
          disabled={loading}
          style={{
            background: 'transparent',
            border: '1px solid #1e353b',
            color: '#20d6c7',
            padding: '5px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <RefreshCw size={12} className={loading ? 'spinning' : ''} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* 4. TABELA DE DEPLOYMENTS RECENTES */}
      <div style={{ background: '#0a1013', border: '1px solid #162428', borderRadius: '14px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #162428', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f0fdfa' }}>
              Histórico de Deployments no Edge
            </h3>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#68868a' }}>
              Cada build é distribuído globalmente pela Vercel com terminação SSL automática
            </p>
          </div>
          <div style={{ fontSize: '11px', color: '#20d6c7', fontWeight: 600 }}>
            {data?.deployments?.length || 0} builds registrados
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#68868a', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <RefreshCw size={16} className="spinning" style={{ color: '#20d6c7' }} />
            <span>Consultando API da Vercel...</span>
          </div>
        ) : (!data?.deployments || data.deployments.length === 0) ? (
          <div style={{ padding: '36px 20px', textAlign: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: deployHookUrl ? 'rgba(16, 185, 129, 0.1)' : 'rgba(32, 214, 199, 0.05)',
              border: deployHookUrl ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid #1a2a2e',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px'
            }}>
              {deployHookUrl ? <CheckCircle2 size={24} color="#10b981" /> : <VercelIcon size={24} color="#334d52" />}
            </div>

            <div style={{ fontSize: '14px', color: deployHookUrl ? '#a7f3d0' : '#88a6aa', fontWeight: 700 }}>
              {deployHookUrl ? 'Deploy Hook Ativo • Redeploy em 1-Clique Pronto' : 'Token da Vercel não configurado'}
            </div>

            <p style={{ fontSize: '12px', color: '#68868a', maxWidth: '480px', margin: '8px auto 16px', lineHeight: 1.5 }}>
              {deployHookUrl ? (
                <>
                  O webhook da Vercel já está conectado. Você pode clicar em <b>"Forçar Redeploy Vercel"</b> no topo a qualquer momento para atualizar seu site.<br />
                  <span style={{ fontSize: '11px', color: '#557074', marginTop: '4px', display: 'inline-block' }}>
                    Para listar o histórico detalhado de commits e tempos de compilação linha a linha nesta tabela, você pode adicionar um Token pessoal da Vercel (opcional).
                  </span>
                </>
              ) : (
                'Configure seu Personal Access Token da Vercel para visualizar todos os builds, tempo de compilação e histórico em tempo real.'
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setConfigModalOpen(true)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: deployHookUrl ? '#121e22' : '#20d6c7',
                  border: deployHookUrl ? '1px solid #1f3338' : 'none',
                  color: deployHookUrl ? '#20d6c7' : '#041014',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {deployHookUrl ? 'Adicionar Token para Histórico' : 'Configurar Token da Vercel'}
              </button>

              <a
                href="https://vercel.com/dashboard"
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid #1a2d32',
                  color: '#9db4b7',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Abrir Painel da Vercel <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {data.deployments.map((dep: any, idx: number) => {
              const depReady = dep.state === 'READY' || dep.state === 'ready'
              const depBuilding = dep.state === 'BUILDING' || dep.state === 'building'
              const dateStr = dep.createdAt ? new Date(dep.createdAt).toLocaleString('pt-BR') : 'Recentemente'

              return (
                <div
                  key={dep.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    borderBottom: idx === data.deployments.length - 1 ? 'none' : '1px solid #121d20',
                    background: idx === 0 ? 'rgba(32, 214, 199, 0.02)' : 'transparent',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#0e171a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx === 0 ? 'rgba(32, 214, 199, 0.02)' : 'transparent')}
                >
                  {/* Status e Info do Commit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '280px' }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: depReady ? '#10b981' : depBuilding ? '#f59e0b' : '#ef4444',
                      boxShadow: depReady ? '0 0 8px #10b981' : 'none',
                      flexShrink: 0
                    }} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0fdfa' }}>
                          {dep.meta?.commitMessage || dep.name}
                        </span>
                        {idx === 0 && (
                          <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.3)' }}>
                            PRODUÇÃO ATIVA
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#68868a', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'monospace', color: '#20d6c7' }}>
                          {dep.meta?.commitSha ? dep.meta.commitSha.slice(0, 7) : 'commit'}
                        </span>
                        <span>•</span>
                        <span>{dep.meta?.branch || 'main'}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Estado do Build e Botão de Ação */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: '6px',
                      background: depReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: depReady ? '#10b981' : '#f59e0b',
                      border: depReady ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)'
                    }}>
                      {depReady ? 'Ready' : depBuilding ? 'Building' : dep.state}
                    </span>

                    {dep.url && (
                      <a
                        href={dep.url}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir preview do deployment"
                        style={{
                          padding: '6px 10px',
                          borderRadius: '6px',
                          background: '#121e22',
                          border: '1px solid #1d2f34',
                          color: '#20d6c7',
                          fontSize: '11px',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Preview <ExternalLink size={11} />
                      </a>
                    )}

                    <button
                      onClick={() => handleRedeploy(dep.id)}
                      disabled={redeploying}
                      title="Forçar recompilação deste build na Vercel"
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: 'transparent',
                        border: '1px solid #1a2d32',
                        color: '#9db4b7',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: redeploying ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#20d6c7')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a2d32')}
                    >
                      <RefreshCw size={11} />
                      <span>Recompilar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 5. MODAL DE CONFIGURAÇÃO DE TOKEN VERCEL */}
      {configModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 70,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(3, 6, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '540px',
            background: '#0d1619',
            border: '1px solid #1f3238',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Topo do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: '#000',
                  border: '1px solid #1d2e33',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff'
                }}>
                  <VercelIcon size={16} color="#fff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#f0fdfa' }}>
                    Integração com Vercel API
                  </h3>
                  <span style={{ fontSize: '11px', color: '#68868a' }}>
                    Conecte sua conta para monitoramento e redeploy em 1-clique
                  </span>
                </div>
              </div>
              <button
                onClick={() => setConfigModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#68868a', cursor: 'pointer', fontSize: '18px' }}
              >
                ✕
              </button>
            </div>

            {/* Input Token Vercel */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: '#88a6aa', fontWeight: 600 }}>
                  Personal Access Token da Vercel <span style={{ color: '#557074', fontWeight: 400 }}>(Opcional se usar Deploy Hook)</span>:
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {vercelToken && (
                    <button
                      type="button"
                      onClick={() => {
                        setVercelToken('')
                        if (typeof window !== 'undefined') {
                          localStorage.removeItem('vercel_user_token')
                        }
                        setError('')
                        setTokenStatus('idle')
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#f87171',
                        fontSize: '11px',
                        cursor: 'pointer',
                        padding: '0'
                      }}
                    >
                      Limpar Token
                    </button>
                  )}
                  <a
                    href="https://vercel.com/account/tokens"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '11px', color: '#20d6c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                  >
                    Gerar Token na Vercel <ExternalLink size={10} />
                  </a>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  name="vercel_token_no_autofill"
                  id="vercel_token_no_autofill"
                  autoComplete="new-password"
                  data-lpignore="true"
                  data-form-type="other"
                  placeholder="Ex: vercel_tok_... (ou deixe vazio)"
                  value={vercelToken}
                  onChange={(e) => {
                    setVercelToken(e.target.value)
                    setTokenStatus('idle')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 12px',
                    borderRadius: '8px',
                    background: '#080e10',
                    border: vercelToken.startsWith('gsk_') ? '1px solid #ef4444' : '1px solid #1b2d32',
                    color: vercelToken.startsWith('gsk_') ? '#f87171' : '#20d6c7',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#68868a',
                    cursor: 'pointer'
                  }}
                >
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {vercelToken.startsWith('gsk_') && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#fca5a5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <span>⚠️ Esta chave é da <b>Groq (IA)</b> e não da Vercel! Deixe vazio para usar apenas o Deploy Hook.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setVercelToken('')
                      if (typeof window !== 'undefined') localStorage.removeItem('vercel_user_token')
                    }}
                    style={{
                      background: '#ef4444',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Remover Chave
                  </button>
                </div>
              )}
            </div>

            {/* Nome do Projeto na Vercel */}
            <div>
              <label style={{ fontSize: '11px', color: '#88a6aa', display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Nome do Projeto na Vercel:
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="meu-app-web"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#080e10',
                  border: '1px solid #1b2d32',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Deploy Hook URL (Opcional) */}
            <div>
              <label style={{ fontSize: '11px', color: '#88a6aa', display: 'block', marginBottom: '4px', fontWeight: 600 }}>
                Deploy Hook URL (Opcional • Disparo sem restrição de token):
              </label>
              <input
                type="text"
                value={deployHookUrl}
                onChange={(e) => setDeployHookUrl(e.target.value)}
                placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#080e10',
                  border: '1px solid #1b2d32',
                  color: '#88a6aa',
                  fontSize: '11px',
                  outline: 'none',
                  fontFamily: 'monospace'
                }}
              />
              <span style={{ fontSize: '10px', color: '#557074', marginTop: '3px', display: 'block' }}>
                Encontre em: Vercel → Projeto → Settings → Git → Deploy Hooks
              </span>
            </div>

            {/* Erros / Sucessos */}
            {error && (
              <div style={{ fontSize: '11px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={13} /> {error}
              </div>
            )}

            {tokenUser && (
              <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={13} /> Conectado como: <b>{tokenUser.username} ({tokenUser.email || 'Conta Vercel'})</b>
              </div>
            )}

            {/* Botões do Rodapé */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setConfigModalOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid #1a2c31',
                  color: '#9db4b7',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveToken}
                disabled={testingToken}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: saveSuccess ? '#10b981' : '#20d6c7',
                  border: 'none',
                  color: '#041014',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: testingToken ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 16px rgba(32, 214, 199, 0.3)'
                }}
              >
                {testingToken ? (
                  <>
                    <RefreshCw size={13} className="spinning" /> Validando Token...
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check size={13} /> Salvo com Sucesso!
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Salvar & Conectar Vercel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
