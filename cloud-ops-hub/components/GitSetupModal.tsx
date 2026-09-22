'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, Check, RefreshCw, GitBranch, Shield, KeyRound, Copy, 
  Terminal, Sparkles, AlertCircle, CheckCircle2, User, Mail
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface GitSetupModalProps {
  isOpen: boolean
  onClose: () => void
  doAction: (msg: string) => void
}

export function GitSetupModal({ isOpen, onClose, doAction }: GitSetupModalProps) {
  const [name, setName] = useState('Vinicius Lourenço')
  const [email, setEmail] = useState('vviniciuslourenco@gmail.com')
  const [githubUser, setGithubUser] = useState('ViniScooper')
  const [githubToken, setGithubToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [gitStatus, setGitStatus] = useState<any>(null)
  const [setupResult, setSetupResult] = useState<any>(null)
  const [copiedKey, setCopiedKey] = useState(false)

  const checkStatus = async () => {
    setStatusLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/git/status-vm'))
      const data = await res.json()
      setGitStatus(data)
      if (data.name && data.name !== 'Não configurado') setName(data.name)
      if (data.email && data.email !== 'Não configurado') setEmail(data.email)
    } catch {
      // Backend offline ou erro de conexao
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      checkStatus()
    }
  }, [isOpen])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) {
      alert('Por favor, preencha o Nome e o E-mail.')
      return
    }

    setIsLoading(true)
    doAction('Conectando à VM via SSH e configurando Git...')

    try {
      const res = await fetch(getApiUrl('/api/git/setup-vm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          githubUser,
          githubToken
        })
      })

      const data = await res.json()
      if (data.success) {
        setSetupResult(data)
        doAction('✅ Git instalado e autenticado com sucesso na sua VM!')
        checkStatus()
      } else {
        alert(`Erro ao configurar Git na VM: ${data.error}`)
        doAction(`Falha: ${data.error}`)
      }
    } catch (err: any) {
      alert(`Falha de conexão com o backend: ${err.message}`)
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
        style={{ maxWidth: '580px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#20d6c7' }} /> Auto-Configuração do Git na VM
            </h2>
            <p>Instale o Git e configure a autenticação permanente na sua máquina virtual em 1 clique via SSH.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal"><X size={18} /></button>
        </div>

        {/* Status Atual do Git na VM */}
        <div style={{ background: '#070a0c', padding: '12px 16px', borderRadius: '6px', border: '1px solid #142023', marginBottom: '16px', fontSize: '11px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ color: '#6f8387', textTransform: 'uppercase', fontSize: '9px', fontWeight: 700 }}>Status Atual na VM</span>
            <button 
              onClick={checkStatus} 
              disabled={statusLoading}
              style={{ background: 'transparent', border: 'none', color: '#20d6c7', cursor: 'pointer', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={10} className={statusLoading ? 'spin' : ''} /> Atualizar Status
            </button>
          </div>
          {gitStatus ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span className={`status-text ${gitStatus.installed ? 'emerald' : 'amber'}`}>
                {gitStatus.installed ? `● ${gitStatus.version}` : '● Git Não Instalado'}
              </span>
              <span style={{ color: '#8fa4a8' }}>
                Usuário: <b style={{ color: '#d9e2e1' }}>{gitStatus.name}</b>
              </span>
              <span style={{ color: '#8fa4a8' }}>
                Email: <b style={{ color: '#d9e2e1' }}>{gitStatus.email}</b>
              </span>
            </div>
          ) : (
            <span style={{ color: '#6f8387' }}>Consultando VM via SSH...</span>
          )}
        </div>

        <form onSubmit={handleSetup}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                Nome para os Commits *
              </label>
              <input 
                type="text" 
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Vinicius Lourenço"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                E-mail do Git *
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: seu-email@gmail.com"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                Usuário do GitHub (opcional)
              </label>
              <input 
                type="text" 
                value={githubUser}
                onChange={e => setGithubUser(e.target.value)}
                placeholder="Ex: ViniScooper"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#8fa4a8', fontSize: '11px', marginBottom: '4px' }}>
                GitHub Token (PAT - opcional)
              </label>
              <input 
                type="password" 
                value={githubToken}
                onChange={e => setGithubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                style={{ width: '100%', background: '#0e1618', border: '1px solid #1f3035', color: '#d9e2e1', padding: '7px 10px', borderRadius: '4px', fontSize: '11px' }}
              />
            </div>
          </div>

          <div style={{ background: '#0c1518', border: '1px solid #14282c', padding: '10px 12px', borderRadius: '6px', marginBottom: '16px', fontSize: '11px', color: '#8fa4a8', lineHeight: '1.5' }}>
            💡 <b>O que o CloudOps Hub fará na sua VM:</b><br/>
            1. Conecta na VM via SSH e roda <code>apt install git</code> (se não houver);<br/>
            2. Configura <code>user.name</code>, <code>user.email</code> e <code>credential.helper store</code>;<br/>
            3. Salva a autenticação permanente em <code>~/.git-credentials</code> para nunca pedir senha;<br/>
            4. Gera uma chave SSH exclusiva para Deploy Keys no GitHub.
          </div>

          {setupResult && (
            <div style={{ background: '#081714', border: '1px solid #124d3e', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontSize: '11px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a3e635', fontWeight: 600, marginBottom: '6px' }}>
                <CheckCircle2 size={14} /> Git Configurado na VM com Sucesso!
              </div>

              {setupResult.deployKeyPublic && (
                <div>
                  <span style={{ color: '#8fa4a8', display: 'block', marginBottom: '4px' }}>
                    Chave Pública SSH da VM (Deploy Key para repositórios privados):
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      readOnly 
                      value={setupResult.deployKeyPublic}
                      style={{ flex: 1, background: '#0e1618', border: '1px solid #19272b', color: '#20d6c7', fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(setupResult.deployKeyPublic)
                        setCopiedKey(true)
                        setTimeout(() => setCopiedKey(false), 2000)
                      }}
                      style={{ background: '#133538', border: '1px solid #20d6c7', color: '#d9e2e1', padding: '4px 10px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}
                    >
                      {copiedKey ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="modal-actions" style={{ marginTop: '16px' }}>
            <button type="button" className="refresh-button" onClick={onClose} disabled={isLoading}>
              Fechar
            </button>
            <button 
              type="submit" 
              className="primary-button" 
              disabled={isLoading}
              style={{ fontWeight: 600, padding: '8px 18px' }}
            >
              {isLoading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={13} className="spin" /> Configurando na VM via SSH...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={13} /> Configurar Git na VM Automaticamente
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
