'use client'

import React, { useState, useEffect } from 'react'
import { 
  Rocket, GitBranch, Check, RefreshCw, Terminal, GitPullRequest, 
  GitMerge, ShieldCheck, ArrowRight, RotateCcw, History, AlertTriangle, Clock
} from 'lucide-react'

interface DeployViewProps {
  server: any
  doAction: (msg: string) => void
}

interface DeployRecord {
  id: string
  timestamp: string
  project: string
  type: 'DEPLOY' | 'ROLLBACK'
  branch: string
  commitHash: string
  commitMessage: string
  author: string
  duration: string
  status: 'Sucesso' | 'Falha'
}

export function DeployView({ server, doAction }: DeployViewProps) {
  const [isDeploying, setIsDeploying] = useState(false)
  const [isMerging, setIsMerging] = useState(false)
  const [isRollingBack, setIsRollingBack] = useState(false)
  const [deployLogs, setDeployLogs] = useState<string[]>([])
  const [selectedBranch, setSelectedBranch] = useState('main')
  const [mergeSourceBranch, setMergeSourceBranch] = useState('develop')
  const [githubToken, setGithubToken] = useState('')
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [lastDeployTime, setLastDeployTime] = useState('Hoje, 11:45 (v2.4.0)')
  const [history, setHistory] = useState<DeployRecord[]>([])

  const fetchHistory = async () => {
    try {
      const res = await fetch('http://localhost:3005/api/deploy/history')
      const data = await res.json()
      if (data.history) {
        setHistory(data.history)
      }
    } catch {
      // Fallback gracioso caso backend não responda imediatamente
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [])

  const triggerDeploy = async (project: string) => {
    setIsDeploying(true)
    doAction(`Iniciando deploy real via SSH de ${project}...`)
    setDeployLogs([`[${new Date().toLocaleTimeString('pt-BR')}] Conectando à VM via SSH (${server?.ip || '137.131.185.243'})...`])

    try {
      const res = await fetch('http://localhost:3005/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, branch: selectedBranch })
      })

      const data = await res.json()
      if (data.logs) {
        setDeployLogs(data.logs)
      }
      if (data.history) {
        setHistory(data.history)
      }
      setLastDeployTime(`Agora mesmo (${data.commitHash || selectedBranch})`)
      doAction(`Deploy de ${project} concluído na VM! Notificação enviada ao WhatsApp 📲`)
    } catch (err: any) {
      setDeployLogs(prev => [...prev, `❌ Erro no deploy: ${err.message}`])
      doAction('Falha ao executar deploy na VM')
    } finally {
      setIsDeploying(false)
      fetchHistory()
    }
  }

  const triggerRollback = async (project: string) => {
    if (!window.confirm('⚠️ Tem certeza que deseja desfazer o último deploy e voltar para a versão estável anterior na VM?')) {
      return
    }

    setIsRollingBack(true)
    doAction(`Acionando Rollback de emergência para ${project}...`)
    setDeployLogs([`[${new Date().toLocaleTimeString('pt-BR')}] ⏪ Rollback acionado. Conectando à VM para reverter commit...`])

    try {
      const res = await fetch('http://localhost:3005/api/deploy/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project })
      })

      const data = await res.json()
      if (data.logs) {
        setDeployLogs(data.logs)
      }
      if (data.history) {
        setHistory(data.history)
      }
      setLastDeployTime(`Restaurado (${data.commitHash || 'estável'})`)
      doAction(`Rollback concluído! Versão anterior no ar no restaurante 🛡️`)
    } catch (err: any) {
      setDeployLogs(prev => [...prev, `❌ Erro no rollback: ${err.message}`])
      doAction('Falha ao executar rollback')
    } finally {
      setIsRollingBack(false)
      fetchHistory()
    }
  }

  const triggerPullRequestAndMerge = async () => {
    setIsMerging(true)
    doAction(`Iniciando Pull Request & Merge de ${mergeSourceBranch} para main...`)
    setDeployLogs([`[${new Date().toLocaleTimeString('pt-BR')}] Iniciando integração de branches (${mergeSourceBranch} ➔ main)...`])

    try {
      const res = await fetch('http://localhost:3005/api/github/pull-request-merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceBranch: mergeSourceBranch,
          targetBranch: 'main',
          token: githubToken || undefined
        })
      })

      const data = await res.json()

      if (data.logs) {
        setDeployLogs(data.logs)
      }

      if (data.success) {
        doAction(`Integração concluída! Branch ${mergeSourceBranch} mesclada na main com sucesso.`)
        setSelectedBranch('main')
      } else {
        setDeployLogs(prev => [...prev, `❌ Erro: ${data.error || 'Falha no merge'}`])
        doAction('Erro ao realizar merge das branches')
      }
    } catch (err: any) {
      setDeployLogs(prev => [...prev, `❌ Falha na requisição: ${err.message}`])
      doAction('Falha ao conectar com o backend de automação')
    } finally {
      setIsMerging(false)
    }
  }

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={20} style={{ color: '#20d6c7' }} />
            Deploy Contínuo 1-Click via SSH & Auditoria
          </h2>
          <p>
            Integração contínua real conectada à sua VM na Oracle Cloud, com rollback de emergência e histórico auditável.
          </p>
        </div>
      </div>

      {/* Seção 1: Automação de Pull Request & Merge */}
      <div className="panel" style={{ padding: '20px', marginBottom: '20px', borderColor: '#1b3236', background: 'linear-gradient(180deg, #0a1114 0%, #0d1619 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <GitPullRequest size={16} style={{ color: '#20d6c7' }} />
              <h3 style={{ margin: 0, fontSize: '15px', color: '#d9e2e1' }}>Automação de Pull Request & Merge (GitFlow)</h3>
              <span className="status-text emerald" style={{ fontSize: '10px' }}>Zero Conflitos</span>
            </div>
            <small style={{ color: '#6f8387' }}>
              Terminou uma melhoria ou correção? Junte as alterações para dentro da branch <b>main</b> com um único clique.
            </small>
          </div>

          <button
            onClick={() => setShowTokenInput(!showTokenInput)}
            style={{
              background: 'transparent',
              border: '1px solid #1f2e32',
              color: '#8fa4a8',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            {showTokenInput ? 'Ocultar Config GitHub' : '⚙️ Configurar GitHub Token'}
          </button>
        </div>

        {showTokenInput && (
          <div style={{ background: '#070a0c', padding: '12px', borderRadius: '6px', border: '1px solid #19272b', marginBottom: '14px', fontSize: '11px' }}>
            <label style={{ display: 'block', color: '#8fa4a8', marginBottom: '4px' }}>
              GitHub Personal Access Token (Opcional - caso queira registrar o PR formal no site do GitHub):
            </label>
            <input 
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '450px',
                background: '#0e1618',
                border: '1px solid #1f3035',
                color: '#d9e2e1',
                padding: '6px 10px',
                borderRadius: '4px',
                fontSize: '11px'
              }}
            />
            <span style={{ display: 'block', color: '#52666a', fontSize: '10px', marginTop: '4px' }}>
              Se deixar em branco, o Hub utiliza o Git local já autenticado na sua máquina para fazer a mesclagem e o push direto.
            </span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', background: '#070a0c', padding: '14px', borderRadius: '6px', border: '1px solid #142023' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Origem (Melhoria)</span>
              <select
                value={mergeSourceBranch}
                onChange={e => setMergeSourceBranch(e.target.value)}
                style={{ background: '#0e1618', border: '1px solid #1f3035', borderRadius: '4px', color: '#20d6c7', fontSize: '12px', padding: '4px 8px', fontWeight: 600, marginTop: '2px' }}
              >
                <option value="develop">develop (Desenvolvimento)</option>
                <option value="hotfix">hotfix (Correção Urgente)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', padding: '0 6px', color: '#52666a', marginTop: '12px' }}>
              <ArrowRight size={16} />
            </div>

            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Destino (Produção)</span>
              <div style={{ background: '#0e1618', border: '1px solid #142023', borderRadius: '4px', color: '#a3e635', fontSize: '12px', padding: '4px 10px', fontWeight: 600, marginTop: '2px' }}>
                main (Produção)
              </div>
            </div>
          </div>

          <button
            className="primary-button"
            disabled={isMerging || isDeploying || isRollingBack}
            onClick={triggerPullRequestAndMerge}
            style={{ padding: '8px 18px', fontWeight: 600, background: '#137770', borderColor: '#20d6c7' }}
          >
            {isMerging ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <RefreshCw size={14} className="spin" /> Mesclando Branches...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <GitMerge size={14} /> Fazer Pull Request & Merge
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Seção 2: Cards de Aplicações */}
      <div className="overview-grid" style={{ marginBottom: '20px' }}>
        {/* Card do Cardápio Digital com Rollback */}
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="status-dot emerald" />
                <h3 style={{ margin: 0, fontSize: '15px' }}>Boteco Sivirino (Cardápio Digital)</h3>
              </div>
              <small style={{ color: '#6f8387' }}>Repositório: cardapio_digital | Host VM: 3002 ➔ 3001</small>
            </div>
            <span className="status-text emerald">Produção Ativa</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#070a0c', padding: '12px', borderRadius: '6px', border: '1px solid #142023', marginBottom: '16px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Branch Alvo</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                <GitBranch size={13} style={{ color: '#20d6c7' }} />
                <select 
                  value={selectedBranch} 
                  onChange={e => setSelectedBranch(e.target.value)}
                  style={{ background: '#0e1618', border: '1px solid #1b282b', borderRadius: '4px', color: '#d9e2e1', fontSize: '11px', padding: '2px 6px' }}
                >
                  <option value="main">main (Produção)</option>
                  <option value="develop">develop (Staging)</option>
                  <option value="hotfix">hotfix</option>
                </select>
              </div>
            </div>
            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Última Versão no Ar</span>
              <strong style={{ color: '#d9e2e1', display: 'block', marginTop: '4px' }}>{lastDeployTime}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '10px', color: '#52666a' }}>
              Conexão SSH Real com a Oracle Cloud
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Botão de Rollback */}
              <button 
                className="refresh-button"
                disabled={isDeploying || isMerging || isRollingBack}
                onClick={() => triggerRollback('cardapio_digital')}
                title="Desfaz a última alteração e restaura a versão anterior na VM"
                style={{
                  background: '#161009',
                  borderColor: '#8c4b18',
                  color: '#f59e0b',
                  fontSize: '11px',
                  padding: '7px 12px'
                }}
              >
                {isRollingBack ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RefreshCw size={12} className="spin" /> Revertendo...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <RotateCcw size={12} /> Rollback
                  </span>
                )}
              </button>

              {/* Botão de Deploy */}
              <button 
                className="primary-button"
                disabled={isDeploying || isMerging || isRollingBack}
                onClick={() => triggerDeploy('cardapio_digital')}
                style={{ padding: '7px 16px', fontWeight: 600 }}
              >
                {isDeploying ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} className="spin" /> Fazendo Deploy...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Rocket size={14} /> Fazer Deploy Agora
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Card da Lottus API */}
        <div className="panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span className="status-dot emerald" />
                <h3 style={{ margin: 0, fontSize: '15px' }}>Lottus API (Corporativo)</h3>
              </div>
              <small style={{ color: '#6f8387' }}>Host: api.lottus.com.br | Porta: 3001</small>
            </div>
            <span className="status-text emerald">PM2 Online</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#070a0c', padding: '12px', borderRadius: '6px', border: '1px solid #142023', marginBottom: '16px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Branch</span>
              <strong style={{ color: '#d9e2e1', display: 'block', marginTop: '4px' }}>main</strong>
            </div>
            <div>
              <span style={{ color: '#6f8387', display: 'block', fontSize: '9px', textTransform: 'uppercase' }}>Gerenciador de Processos</span>
              <strong style={{ color: '#d9e2e1', display: 'block', marginTop: '4px' }}>PM2 Cluster Mode</strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#52666a' }}>
              Memória: ~14.7 MB (Ultra leve)
            </span>
            <button 
              className="refresh-button"
              disabled={isDeploying || isMerging || isRollingBack}
              onClick={() => triggerDeploy('lottus-api')}
              style={{ padding: '7px 14px' }}
            >
              <RefreshCw size={13} /> Atualizar Lottus API
            </button>
          </div>
        </div>
      </div>

      {/* Seção 3: Terminal de Saída do Deploy */}
      <section className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={15} style={{ color: '#20d6c7' }} /> Console de Execução do Pipeline (Saída SSH Real)
            </h3>
            <p>Acompanhe em tempo real os comandos executados fisicamente dentro da sua VM na Oracle Cloud</p>
          </div>
        </div>
        <div 
          style={{ 
            background: '#070a0c', 
            border: '1px solid #142023', 
            borderRadius: '6px', 
            padding: '14px', 
            maxHeight: '220px', 
            overflowY: 'auto',
            fontFamily: 'Consolas, Monaco, monospace', 
            fontSize: '11px',
            color: '#a3e635',
            lineHeight: '1.6'
          }}
        >
          {deployLogs.length === 0 ? (
            <div style={{ color: '#6f8387', textAlign: 'center', padding: '16px' }}>
              Nenhum processo em execução. Clique em <b>"Fazer Deploy Agora"</b> para acionar o pipeline SSH na VM ou <b>"Rollback"</b> para reverter.
            </div>
          ) : (
            deployLogs.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))
          )}
        </div>
      </section>

      {/* Seção 4: Histórico & Auditoria de Deploys */}
      <section className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <History size={16} style={{ color: '#20d6c7' }} /> Histórico & Auditoria de Deploys
            </h3>
            <p>Rastreabilidade completa de todas as alterações, branches, reversões e horários de deploy</p>
          </div>
          <button 
            onClick={fetchHistory}
            className="refresh-button"
            style={{ fontSize: '10px', padding: '4px 8px' }}
          >
            <RefreshCw size={11} /> Atualizar Histórico
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #182528', color: '#6f8387', textTransform: 'uppercase', fontSize: '9px' }}>
                <th style={{ padding: '10px 12px' }}>Data / Hora</th>
                <th style={{ padding: '10px 12px' }}>Projeto</th>
                <th style={{ padding: '10px 12px' }}>Tipo</th>
                <th style={{ padding: '10px 12px' }}>Branch / Commit</th>
                <th style={{ padding: '10px 12px' }}>Descrição</th>
                <th style={{ padding: '10px 12px' }}>Duração</th>
                <th style={{ padding: '10px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#6f8387' }}>
                    Nenhum registro no histórico de auditoria.
                  </td>
                </tr>
              ) : (
                history.map((rec) => (
                  <tr key={rec.id} style={{ borderBottom: '1px solid #0f181a', color: '#d9e2e1' }}>
                    <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: '#8fa4a8' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={11} /> {rec.timestamp}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 600 }}>{rec.project}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9px',
                          fontWeight: 700,
                          background: rec.type === 'ROLLBACK' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(32, 214, 199, 0.15)',
                          color: rec.type === 'ROLLBACK' ? '#f59e0b' : '#20d6c7',
                          border: `1px solid ${rec.type === 'ROLLBACK' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(32, 214, 199, 0.3)'}`
                        }}
                      >
                        {rec.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontFamily: 'Consolas, monospace', color: '#20d6c7' }}>
                        {rec.branch}@{rec.commitHash}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#a2b3b6' }}>
                      {rec.commitMessage}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6f8387' }}>{rec.duration}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span 
                        className={`status-text ${rec.status === 'Sucesso' ? 'emerald' : 'red'}`}
                        style={{ fontSize: '11px' }}
                      >
                        {rec.status === 'Sucesso' ? '● Sucesso' : '● Falha'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
