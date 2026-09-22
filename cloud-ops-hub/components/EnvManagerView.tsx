'use client'

import React, { useState, useEffect } from 'react'
import { KeyRound, Eye, EyeOff, Plus, Save, RotateCcw, ShieldCheck, Trash2 } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface EnvManagerViewProps {
  server: any
  doAction: (msg: string) => void
  onConnect?: () => void
}

const DEFAULT_ENV_VARS = [
  { key: 'PORT', value: '3002', isSecret: false, description: 'Porta de escuta do servidor HTTP' },
  { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução do sistema' },
  { key: 'DB_HOST', value: '127.0.0.1', isSecret: false, description: 'Endereço do banco de dados MySQL' },
  { key: 'DB_PORT', value: '3306', isSecret: false, description: 'Porta de conexão MySQL' },
  { key: 'DB_USER', value: 'boteco_user', isSecret: false, description: 'Usuário do banco de dados' },
  { key: 'DB_PASSWORD', value: 'Boteco@Sec2026!Oracle', isSecret: true, description: 'Senha criptografada do MySQL' },
  { key: 'JWT_SECRET', value: 'c09f7a8b6e5d4c3b2a109876543210ab', isSecret: true, description: 'Chave secreta para tokens JWT' },
  { key: 'CORS_ORIGIN', value: '*', isSecret: false, description: 'Origens permitidas para requisições' }
]

export function EnvManagerView({ server, doAction, onConnect }: EnvManagerViewProps) {
  const [envVars, setEnvVars] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('cloudops_env_vars')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) {}
      }
    }
    return DEFAULT_ENV_VARS
  })
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIsSecret, setNewIsSecret] = useState(false)

  const fetchEnv = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/env?project=app_service'))
      const data = await res.json()
      if (data.envVars && Array.isArray(data.envVars) && data.envVars.length > 0) {
        setEnvVars(data.envVars)
        if (typeof window !== 'undefined') {
          localStorage.setItem('cloudops_env_vars', JSON.stringify(data.envVars))
        }
      }
    } catch (e) {
      // mantém os valores locais
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (server?.ip) {
      fetchEnv()
    }
  }, [server?.ip])

  if (!server) {
    return (
      <div>
        <div className="section-heading">
          <div>
            <h2>Gerenciador Visual de Variáveis (.env)</h2>
            <p>Gerenciamento de segredos, chaves de API e variáveis de ambiente com injeção segura.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
            <KeyRound size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
          <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
            Conecte sua VM da Oracle Cloud, AWS ou VPS via SSH para visualizar, editar e injetar variáveis de ambiente (.env) nos seus containers e microserviços com segurança AES-256.
          </p>
          <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => onConnect ? onConnect() : doAction('Conectar VM')}>
            Conectar Minha VM (SSH)
          </button>
        </div>
      </div>
    )
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleValueChange = (index: number, val: string) => {
    setEnvVars(prev => {
      const updated = prev.map((item, idx) => idx === index ? { ...item, value: val } : item)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_env_vars', JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleDeleteVariable = (index: number) => {
    setEnvVars(prev => {
      const updated = prev.filter((_, idx) => idx !== index)
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_env_vars', JSON.stringify(updated))
      }
      return updated
    })
    doAction('Variável removida!')
  }

  const handleAddVariable = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!newKey.trim()) return
    const newEntry = { 
      key: newKey.trim().toUpperCase(), 
      value: newValue.trim(), 
      isSecret: newIsSecret, 
      description: 'Configurada manualmente pelo painel' 
    }
    setEnvVars(prev => {
      const updated = [...prev, newEntry]
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_env_vars', JSON.stringify(updated))
      }
      return updated
    })
    setNewKey('')
    setNewValue('')
    setNewIsSecret(false)
    doAction(`Variável ${newEntry.key} adicionada à lista!`)
  }

  const saveVariables = async () => {
    doAction('Salvando variáveis de ambiente no servidor...')
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cloudops_env_vars', JSON.stringify(envVars))
      }
      await fetch(getApiUrl('/api/env'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'app_service', envVars })
      })
      doAction('Variáveis aplicadas e salvas com sucesso!')
    } catch (e: any) {
      doAction('Variáveis salvas localmente! (Servidor: ' + e.message + ')')
    }
  }

  return (
    <div>
      <div className="section-heading">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} style={{ color: '#20d6c7' }} />
            Gerenciador Visual de Variáveis de Ambiente (.env)
          </h2>
          <p>
            Edite credenciais, URLs e portas com máscara de segurança. As alterações reiniciam o container automaticamente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="refresh-button" onClick={fetchEnv} disabled={isLoading}>
            <RotateCcw size={13} /> Recarregar .env
          </button>
          <button className="primary-button" onClick={saveVariables} style={{ fontWeight: 600 }}>
            <Save size={14} /> Salvar & Reiniciar Container
          </button>
        </div>
      </div>

      {/* Tabela de Variáveis */}
      <section className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <h3>Variáveis Ativas (.env)</h3>
            <p>Mapeadas e injetadas no container de produção</p>
          </div>
          <span style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> Criptografia em Trânsito
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          {envVars.map((item, idx) => {
            const isRevealed = showSecrets[item.key]
            return (
              <div 
                key={item.key + '_' + idx}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '220px 1fr 40px 40px', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: '#070a0c', 
                  padding: '8px 14px', 
                  borderRadius: '6px', 
                  border: '1px solid #142023' 
                }}
              >
                <div>
                  <strong style={{ fontSize: '11px', color: '#20d6c7', fontFamily: 'monospace' }}>{item.key}</strong>
                  <small style={{ display: 'block', fontSize: '9px', color: '#52666a' }}>{item.description}</small>
                </div>

                <div style={{ position: 'relative' }}>
                  <input 
                    type={item.isSecret && !isRevealed ? 'password' : 'text'}
                    value={item.value}
                    onChange={e => handleValueChange(idx, e.target.value)}
                    style={{ 
                      width: '100%', 
                      height: '34px', 
                      background: '#0e1618', 
                      border: '1px solid #1b282b', 
                      borderRadius: '4px', 
                      padding: '0 10px', 
                      color: '#d9e2e1', 
                      fontSize: '11px', 
                      fontFamily: 'monospace',
                      outline: 'none' 
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  {item.isSecret ? (
                    <button 
                      type="button" 
                      onClick={() => toggleSecret(item.key)} 
                      style={{ background: 'transparent', border: 0, color: '#6f8387', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                      title={isRevealed ? 'Ocultar segredo' : 'Mostrar segredo'}
                    >
                      {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  ) : (
                    <span style={{ color: '#294043', fontSize: '11px' }}>-</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleDeleteVariable(idx)}
                    style={{ background: 'transparent', border: 0, color: '#ef444499', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    title="Remover variável"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Box para Adicionar Nova Variável */}
      <section className="panel" style={{ padding: '16px 20px' }}>
        <h4 style={{ margin: '0 0 10px', fontSize: '12px', color: '#d9e2e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Plus size={14} style={{ color: '#20d6c7' }} /> Adicionar Nova Variável
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 140px 140px', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="NOME_DA_VARIAVEL" 
            value={newKey} 
            onChange={e => setNewKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
            style={{ height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Valor da variável" 
            value={newValue} 
            onChange={e => setNewValue(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
            style={{ height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#829d9c', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={newIsSecret} 
              onChange={e => setNewIsSecret(e.target.checked)}
              style={{ accentColor: '#20d6c7' }}
            />
            É Secreto / Token
          </label>
          <button className="primary-button" onClick={handleAddVariable} style={{ padding: '8px 14px' }}>
            <Plus size={13} /> Inserir Variável
          </button>
        </div>
      </section>
    </div>
  )
}
