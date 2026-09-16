'use client'

import React, { useState } from 'react'
import { 
  X, Check, RefreshCw, GitBranch, Shield, Container, Terminal, 
  Sparkles, AlertCircle, CheckCircle2, ArrowRight, FolderPlus, Play
} from 'lucide-react'

interface CloneRepoModalProps {
  isOpen: boolean
  onClose: () => void
  doAction: (msg: string) => void
  onProjectAdded?: (project: any) => void
}

export function CloneRepoModal({ isOpen, onClose, doAction, onProjectAdded }: CloneRepoModalProps) {
  const [repoUrl, setRepoUrl] = useState('')
  const [projectName, setProjectName] = useState('')
  const [branch, setBranch] = useState('main')
  const [runMode, setRunMode] = useState<'docker' | 'pm2' | 'clone_only'>('docker')
  const [port, setPort] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [result, setResult] = useState<any>(null)

  const handleUrlChange = (url: string) => {
    setRepoUrl(url)
    if (!projectName || projectName === '') {
      const parts = url.trim().split('/')
      const last = parts[parts.length - 1] || ''
      setProjectName(last.replace(/\.git$/, ''))
    }
  }

  const handleCloneAndLaunch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!repoUrl) {
      alert('Por favor, informe a URL do repositório Git.')
      return
    }

    setIsLoading(true)
    setLogs([`[${new Date().toLocaleTimeString('pt-BR')}] Conectando à VM para clonar repositório...`])
    doAction(`Clonando e lançando ${projectName || 'novo projeto'} na VM...`)

    try {
      const res = await fetch('http://localhost:3005/api/projects/clone-and-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl,
          projectName,
          branch,
          runMode,
          port
        })
      })

      const data = await res.json()
      if (data.logs) {
        setLogs(data.logs)
      }

      if (data.success) {
        setResult(data)
        doAction(`✅ Projeto ${data.folder} lançado com sucesso na VM!`)
        if (onProjectAdded) {
          onProjectAdded({
            name: data.folder,
            branch,
            runMode,
            port: port || 'Auto',
            status: 'Running'
          })
        }
      } else {
        setLogs(prev => [...prev, `❌ Erro: ${data.error}`])
        doAction(`Falha: ${data.error}`)
      }
    } catch (err: any) {
      setLogs(prev => [...prev, `❌ Erro de conexão: ${err.message}`])
      doAction('Erro ao conectar ao servidor')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <div 
        className="modal-card" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '620px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderPlus size={18} style={{ color: '#20d6c7' }} /> Clonar & Subir Novo Projeto do GitHub
            </h2>
            <p>Baixe qualquer repositório na sua VM Oracle e inicie a execução via Docker ou PM2 automaticamente.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal"><X size={18} /></button>
        </div>

        <form onSubmit={handleCloneAndLaunch}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
              URL do Repositório Git *
            </label>
            <input 
              type="url" 
              required
              value={repoUrl}
              onChange={e => handleUrlChange(e.target.value)}
              placeholder="https://github.com/ViniScooper/meu-novo-app.git"
              style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '8px 10px', borderRadius: '4px', fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                Nome da Pasta na VM
              </label>
              <input 
                type="text" 
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Ex: meu-app"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                Branch Inicial
              </label>
              <input 
                type="text" 
                value={branch}
                onChange={e => setBranch(e.target.value)}
                placeholder="main"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
          </div>

          {/* Seletor de Modo de Execução */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '6px' }}>
              Como deseja rodar esse projeto na VM?
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div 
                onClick={() => setRunMode('docker')}
                style={{
                  background: runMode === 'docker' ? '#143136' : '#070a0c',
                  border: `1px solid ${runMode === 'docker' ? '#20d6c7' : '#142023'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Container size={16} style={{ color: runMode === 'docker' ? '#20d6c7' : '#6f8387', margin: '0 auto 4px' }} />
                <strong style={{ display: 'block', fontSize: '11px', color: '#d9e2e1' }}>Docker Compose</strong>
                <small style={{ color: '#6f8387', fontSize: '9px' }}>up -d --build</small>
              </div>

              <div 
                onClick={() => setRunMode('pm2')}
                style={{
                  background: runMode === 'pm2' ? '#143136' : '#070a0c',
                  border: `1px solid ${runMode === 'pm2' ? '#20d6c7' : '#142023'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <Terminal size={16} style={{ color: runMode === 'pm2' ? '#20d6c7' : '#6f8387', margin: '0 auto 4px' }} />
                <strong style={{ display: 'block', fontSize: '11px', color: '#d9e2e1' }}>Node.js / PM2</strong>
                <small style={{ color: '#6f8387', fontSize: '9px' }}>Ultra leve (~15 MB)</small>
              </div>

              <div 
                onClick={() => setRunMode('clone_only')}
                style={{
                  background: runMode === 'clone_only' ? '#143136' : '#070a0c',
                  border: `1px solid ${runMode === 'clone_only' ? '#20d6c7' : '#142023'}`,
                  borderRadius: '6px',
                  padding: '10px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <FolderPlus size={16} style={{ color: runMode === 'clone_only' ? '#20d6c7' : '#6f8387', margin: '0 auto 4px' }} />
                <strong style={{ display: 'block', fontSize: '11px', color: '#d9e2e1' }}>Apenas Clonar</strong>
                <small style={{ color: '#6f8387', fontSize: '9px' }}>Baixar sem rodar</small>
              </div>
            </div>
          </div>

          {/* Console de Saída */}
          {logs.length > 0 && (
            <div 
              style={{ 
                background: '#070a0c', 
                border: '1px solid #142023', 
                borderRadius: '6px', 
                padding: '10px 12px', 
                maxHeight: '140px', 
                overflowY: 'auto',
                fontFamily: 'Consolas, monospace',
                fontSize: '10px',
                color: '#a3e635',
                lineHeight: '1.5',
                marginBottom: '14px'
              }}
            >
              {logs.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          )}

          {result && (
            <div style={{ background: '#081714', border: '1px solid #124d3e', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '11px', color: '#a3e635', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} /> Projeto <b>{result.folder}</b> clonado e iniciado na VM em {result.duration}!
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="refresh-button" onClick={onClose} disabled={isLoading}>
              {result ? 'Concluir' : 'Cancelar'}
            </button>
            <button 
              type="submit" 
              className="primary-button" 
              disabled={isLoading}
              style={{ fontWeight: 600, padding: '8px 18px' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={13} className="spin" /> Clonando e Iniciando na VM...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Play size={13} /> Clonar & Lançar na VM
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
