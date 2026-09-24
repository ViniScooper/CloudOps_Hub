'use client'

import React, { useState, useEffect } from 'react'
import { KeyRound, Eye, EyeOff, Plus, Save, RotateCcw, ShieldCheck, Trash2, Folder, Server, Check } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface EnvManagerViewProps {
  server: any
  doAction: (msg: string) => void
  onConnect?: () => void
}

interface ProjectConfig {
  id: string
  name: string
  containerName: string
  path: string
  port: string
  tag: string
  defaultEnvs: Array<{ key: string; value: string; isSecret: boolean; description: string }>
}

const AVAILABLE_PROJECTS: ProjectConfig[] = [
  {
    id: 'cloudops_hub',
    name: 'CloudOps Hub (Console DevOps & API)',
    containerName: 'cloudops-backend',
    path: '/home/ubuntu/cloudops_hub/cloud-ops-hub-backend/.env',
    port: '3005',
    tag: 'SISTEMA PRINCIPAL',
    defaultEnvs: [
      { key: 'PORT', value: '3005', isSecret: false, description: 'Porta HTTP do servidor Fastify' },
      { key: 'FASTIFY_ADDRESS', value: '0.0.0.0', isSecret: false, description: 'Interface de escuta na VM' },
      { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução' },
      { key: 'ORDS_HOST', value: 'https://g442b32fb1cf117-bancodedadosfinancas.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle Autonomous Database' },
      { key: 'ORDS_PATH', value: '/ords/admin/_/sql', isSecret: false, description: 'Caminho REST SQL no Oracle Cloud' },
      { key: 'ORDS_ENABLED', value: 'true', isSecret: false, description: 'Persistência no Oracle Cloud (Zero consumo RAM na VM)' },
      { key: 'WHATSAPP_PHONE', value: '558195126839', isSecret: false, description: 'WhatsApp do Admin para Alertas' },
      { key: 'WHATSAPP_APIKEY', value: '7939819', isSecret: true, description: 'API Key CallMeBot WhatsApp' },
      { key: 'JWT_SECRET', value: 'cloudops_jwt_secret_key_prod_master_2026', isSecret: true, description: 'Chave secreta para autenticação JWT Master' }
    ]
  },
  {
    id: 'controle_financeiro',
    name: 'FinControl (Gestão Financeira & Dívidas)',
    containerName: 'financeiro_backend',
    path: '/home/ubuntu/controle-financeiro/backend/.env',
    port: '3006',
    tag: 'DOCKER CONTAINER',
    defaultEnvs: [
      { key: 'PORT', value: '3006', isSecret: false, description: 'Porta HTTP do container financeiro_backend' },
      { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução do container' },
      { key: 'ORDS_HOST', value: 'https://g442b32fb1cf117-bancodedadosfinancas.adb.sa-saopaulo-1.oraclecloudapps.com', isSecret: false, description: 'Endpoint REST do Oracle ATP Cloud' },
      { key: 'ADMIN_EMAIL', value: 'vviniciuslourenco@gmail.com', isSecret: false, description: 'E-mail do Administrador Master' },
      { key: 'ADMIN_NAME', value: 'Vinícius Lourenço', isSecret: false, description: 'Nome do Administrador' },
      { key: 'JWT_SECRET', value: 'fincontrol_jwt_secret_key_default', isSecret: true, description: 'Chave de assinatura dos tokens do FinControl' },
      { key: 'CALLMEBOT_API_KEY', value: '7939819', isSecret: true, description: 'API Key do robô de notificações WhatsApp' }
    ]
  },
  {
    id: 'cardapio_digital',
    name: 'Boteco Sivirino (Cardápio Digital)',
    containerName: 'boteco_backend',
    path: '/home/ubuntu/cardapio_digital/.env',
    port: '3002',
    tag: 'DOCKER CONTAINER',
    defaultEnvs: [
      { key: 'PORT', value: '3002', isSecret: false, description: 'Porta do container boteco_backend' },
      { key: 'NODE_ENV', value: 'production', isSecret: false, description: 'Ambiente de execução' },
      { key: 'DB_HOST', value: '127.0.0.1', isSecret: false, description: 'Host do MySQL' },
      { key: 'DB_PORT', value: '3306', isSecret: false, description: 'Porta de conexão MySQL' },
      { key: 'DB_USER', value: 'boteco_user', isSecret: false, description: 'Usuário do banco de dados' },
      { key: 'DB_PASSWORD', value: 'Boteco@Sec2026!Oracle', isSecret: true, description: 'Senha criptografada do MySQL' },
      { key: 'JWT_SECRET', value: 'c09f7a8b6e5d4c3b2a109876543210ab', isSecret: true, description: 'Chave de segurança de autenticação' }
    ]
  }
]

export function EnvManagerView({ server, doAction, onConnect }: EnvManagerViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('cloudops_hub')
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newIsSecret, setNewIsSecret] = useState(false)

  const currentProject = AVAILABLE_PROJECTS.find(p => p.id === selectedProjectId) || AVAILABLE_PROJECTS[0]

  const [envVars, setEnvVars] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`cloudops_env_vars_${currentProject.id}`)
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) return parsed
        } catch (e) {}
      }
    }
    return currentProject.defaultEnvs
  })

  const fetchEnv = async (projectId: string) => {
    setIsLoading(true)
    const targetProj = AVAILABLE_PROJECTS.find(p => p.id === projectId) || currentProject
    try {
      const res = await fetch(getApiUrl(`/api/env?project=${encodeURIComponent(projectId)}`))
      const data = await res.json()
      if (data.envVars && Array.isArray(data.envVars) && data.envVars.length > 0) {
        setEnvVars(data.envVars)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`cloudops_env_vars_${projectId}`, JSON.stringify(data.envVars))
        }
      } else {
        setEnvVars(targetProj.defaultEnvs)
      }
    } catch (e) {
      // Fallback para os dados locais do projeto
      const saved = typeof window !== 'undefined' ? localStorage.getItem(`cloudops_env_vars_${projectId}`) : null
      if (saved) {
        try { setEnvVars(JSON.parse(saved)) } catch { setEnvVars(targetProj.defaultEnvs) }
      } else {
        setEnvVars(targetProj.defaultEnvs)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Carrega ao mudar o projeto selecionado
  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id)
    fetchEnv(id)
  }

  useEffect(() => {
    if (server?.ip) {
      fetchEnv(selectedProjectId)
    }
  }, [server?.ip, selectedProjectId])

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
        localStorage.setItem(`cloudops_env_vars_${currentProject.id}`, JSON.stringify(updated))
      }
      return updated
    })
  }

  const handleDeleteVariable = (index: number) => {
    setEnvVars(prev => {
      const updated = prev.filter((_, idx) => idx !== index)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cloudops_env_vars_${currentProject.id}`, JSON.stringify(updated))
      }
      return updated
    })
    doAction(`Variável removida de ${currentProject.name}!`)
  }

  const handleAddVariable = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!newKey.trim()) return
    const newEntry = { 
      key: newKey.trim().toUpperCase(), 
      value: newValue.trim(), 
      isSecret: newIsSecret, 
      description: `Configurada para ${currentProject.name}` 
    }
    setEnvVars(prev => {
      const updated = [...prev, newEntry]
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cloudops_env_vars_${currentProject.id}`, JSON.stringify(updated))
      }
      return updated
    })
    setNewKey('')
    setNewValue('')
    setNewIsSecret(false)
    doAction(`Variável ${newEntry.key} adicionada ao projeto ${currentProject.name}!`)
  }

  const saveVariables = async () => {
    setIsSaving(true)
    doAction(`Salvando .env e reiniciando container ${currentProject.containerName} na VM...`)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cloudops_env_vars_${currentProject.id}`, JSON.stringify(envVars))
      }
      const res = await fetch(getApiUrl('/api/env'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: currentProject.id, envVars })
      })
      const data = await res.json()
      doAction(`✅ ${data.message || `Variáveis aplicadas no container ${currentProject.containerName}!`}`)
    } catch (e: any) {
      doAction(`Variáveis salvas localmente! (Servidor: ${e.message})`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="section-heading">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <KeyRound size={20} style={{ color: '#20d6c7' }} />
            Gerenciador Visual de Variáveis de Ambiente (.env)
          </h2>
          <p>
            Edite credenciais, portas e chaves por aplicação com injeção segura e reinicialização direcionada.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="refresh-button" onClick={() => fetchEnv(selectedProjectId)} disabled={isLoading}>
            <RotateCcw size={13} className={isLoading ? 'spinning' : ''} /> Recarregar .env
          </button>
          <button className="primary-button" onClick={saveVariables} disabled={isSaving} style={{ fontWeight: 600 }}>
            <Save size={14} /> {isSaving ? 'Aplicando...' : `Salvar & Reiniciar (${currentProject.containerName})`}
          </button>
        </div>
      </div>

      {/* SELETOR DE PROJETO / APLICAÇÃO */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {AVAILABLE_PROJECTS.map(proj => {
          const isSelected = proj.id === selectedProjectId
          return (
            <button
              key={proj.id}
              onClick={() => handleSelectProject(proj.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: isSelected ? '1px solid #20d6c7' : '1px solid #162426',
                background: isSelected ? 'rgba(32, 214, 199, 0.12)' : '#0a1012',
                color: isSelected ? '#f0fdfa' : '#8ca6a5',
                fontSize: '11.5px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <Folder size={13} style={{ color: isSelected ? '#20d6c7' : '#526e72' }} />
              <span>{proj.name}</span>
              <span style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px',
                background: isSelected ? 'rgba(32, 214, 199, 0.25)' : 'rgba(255,255,255,0.06)',
                color: isSelected ? '#20d6c7' : '#6f8387'
              }}>
                Porta {proj.port}
              </span>
            </button>
          )
        })}
      </div>

      {/* Banner Informativo da Aplicação Selecionada */}
      <div style={{
        background: '#070c0e',
        border: '1px solid #142023',
        borderRadius: '8px',
        padding: '10px 14px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
        fontSize: '11px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Server size={14} style={{ color: '#20d6c7' }} />
          <span style={{ color: '#d9e2e1' }}>
            Arquivo Alvo na VM: <code style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{currentProject.path}</code>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#8ca6a5' }}>Container / Processo:</span>
          <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '2px 7px', borderRadius: '4px', fontWeight: 700, fontSize: '10px' }}>
            {currentProject.containerName}
          </span>
        </div>
      </div>

      {/* Tabela de Variáveis */}
      <section className="panel" style={{ marginBottom: '20px' }}>
        <div className="panel-header">
          <div>
            <h3>Variáveis Ativas (.env) — {currentProject.name}</h3>
            <p>Mapeadas e injetadas no serviço {currentProject.containerName} (Porta {currentProject.port})</p>
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
                    <span style={{ fontSize: '10px', color: '#334e52' }}>-</span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => handleDeleteVariable(idx)} 
                    style={{ background: 'transparent', border: 0, color: '#f43f5e', cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                    title="Excluir variável"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Adicionar Nova Variável */}
      <section className="panel" style={{ padding: '16px 20px' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: '#d9e2e1' }}>
          Adicionar Nova Variável em <span style={{ color: '#20d6c7' }}>{currentProject.name}</span>
        </h4>
        <form onSubmit={handleAddVariable} style={{ display: 'grid', gridTemplateColumns: '200px 1fr 150px auto', gap: '10px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="NOME_DA_VARIAVEL" 
            value={newKey} 
            onChange={e => setNewKey(e.target.value)}
            style={{ height: '34px', background: '#070a0c', border: '1px solid #142023', borderRadius: '4px', padding: '0 10px', color: '#20d6c7', fontSize: '11px', fontFamily: 'monospace' }}
          />
          <input 
            type="text" 
            placeholder="Valor da variável" 
            value={newValue} 
            onChange={e => setNewValue(e.target.value)}
            style={{ height: '34px', background: '#070a0c', border: '1px solid #142023', borderRadius: '4px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', fontFamily: 'monospace' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8ca6a5', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={newIsSecret} 
              onChange={e => setNewIsSecret(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            É Secreto / Token
          </label>
          <button type="submit" className="primary-button" style={{ height: '34px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
            <Plus size={14} /> Inserir Variável
          </button>
        </form>
      </section>
    </div>
  )
}
