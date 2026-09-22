'use client'

import React, { useState, useEffect } from 'react'
import { KeyRound, Eye, EyeOff, Plus, Save, RotateCcw, Check, ShieldCheck } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface EnvManagerViewProps {
  server: any
  doAction: (msg: string) => void
}

export function EnvManagerView({ server, doAction }: EnvManagerViewProps) {
  const [envVars, setEnvVars] = useState<any[]>([])
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIsSecret, setNewIsSecret] = useState(false)

  const fetchEnv = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(getApiUrl('/api/env?project=cardapio_digital'))
      const data = await res.json()
      if (data.envVars) {
        setEnvVars(data.envVars)
      }
    } catch (e) {
      // fallback
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (server?.ip !== '137.131.187.54' && server?.id !== 'oracle-micro-02') {
      fetchEnv()
    } else {
      setEnvVars([])
    }
  }, [server?.ip])

  if (server?.ip === '137.131.187.54' || server?.id === 'oracle-micro-02') {
    return (
      <div className="panel" style={{ padding: '40px 20px', textAlign: 'center', marginTop: '20px' }}>
        <div style={{ display: 'inline-flex', padding: '12px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.08)', marginBottom: '12px', color: '#20d6c7' }}>
          <KeyRound size={28} />
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: '#d9e2e1' }}>Nenhum Arquivo .env Configurado</h3>
        <p style={{ margin: '0 auto', fontSize: '12px', color: '#6f8387', maxWidth: '480px' }}>
          Esta máquina virtual está limpa e ainda não possui projetos rodando. Quando você clonar uma aplicação ou iniciar um container, o cofre de variáveis de ambiente (.env) será ativado aqui.
        </p>
      </div>
    )
  }

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleToggleSecret = (index: number) => {
    setEnvVars(prev => prev.map((item, idx) => idx === index ? { ...item, isSecret: !item.isSecret } : item))
  }

  const handleValueChange = (index: number, val: string) => {
    setEnvVars(prev => prev.map((item, idx) => idx === index ? { ...item, value: val } : item))
  }

  const handleAddVariable = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!newKey.trim()) return
    setEnvVars(prev => [...prev, { key: newKey.trim(), value: newValue.trim(), isSecret: newIsSecret, description: 'Configurada manualmente' }])
    setNewKey('')
    setNewValue('')
    setNewIsSecret(false)
    doAction('Nova variável adicionada à lista!')
  }

  const saveVariables = async () => {
    doAction('Salvando variáveis de ambiente e reiniciando container...')
    try {
      await fetch(getApiUrl('/api/env'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: 'cardapio_digital', envVars })
      })
      doAction('Variáveis aplicadas e salvas com sucesso! Notificação enviada ao WhatsApp 📲')
    } catch (e: any) {
      doAction('Erro ao salvar variáveis: ' + e.message)
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
            <h3>Variáveis Ativas: cardapio_digital (.env)</h3>
            <p>Mapeadas e injetadas no container Node.js (boteco_backend)</p>
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
                key={item.key}
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '220px 1fr 40px', 
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
                      style={{ background: 'transparent', border: 0, color: '#6f8387', cursor: 'pointer' }}
                      title={isRevealed ? 'Ocultar segredo' : 'Mostrar segredo'}
                    >
                      {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  ) : (
                    <span style={{ color: '#294043', fontSize: '11px' }}>-</span>
                  )}
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
            style={{ height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', fontFamily: 'monospace', outline: 'none' }}
          />
          <input 
            type="text" 
            placeholder="Valor da variável" 
            value={newValue} 
            onChange={e => setNewValue(e.target.value)}
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
          <button className="primary-button" onClick={addVariable} style={{ padding: '8px 14px' }}>
            <Plus size={13} /> Inserir Variável
          </button>
        </div>
      </section>
    </div>
  )
}
