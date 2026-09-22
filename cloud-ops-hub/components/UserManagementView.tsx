import React, { useState, useEffect } from 'react'
import { Users, UserCheck, UserX, Clock, ShieldCheck, Mail, RefreshCw, KeyRound, Check, AlertCircle, Send } from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface RequestItem {
  id: string
  name: string
  email: string
  note?: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at?: string
  requestedAt?: string
  approvedAt?: string
}

interface UserItem {
  id: string
  name: string
  email: string
  role: string
  status: string
  createdAt?: string
}

interface UserManagementViewProps {
  doAction: (msg: string) => void
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({ doAction }) => {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [approvedResult, setApprovedResult] = useState<{ email: string; name: string; tempPassword?: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [reqRes, usersRes] = await Promise.all([
        fetch(getApiUrl('/api/admin/requests')),
        fetch(getApiUrl('/api/admin/users'))
      ])

      const reqData = await reqRes.json()
      if (reqData.success && Array.isArray(reqData.requests)) {
        setRequests(reqData.requests)
      }

      const usersData = await usersRes.json()
      if (usersData.success && Array.isArray(usersData.users)) {
        setUsers(usersData.users)
      }
    } catch (err: any) {
      console.error('Erro ao carregar dados de usuários:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleApprove = async (req: RequestItem) => {
    setApprovingId(req.id)
    doAction(`Aprovando acesso para ${req.name}...`)
    try {
      const res = await fetch(getApiUrl('/api/admin/approve-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: req.id,
          email: req.email,
          name: req.name
        })
      })
      const data = await res.json()
      if (data.success) {
        doAction(`✅ Acesso aprovado para ${req.name}! Email enviado com a senha.`)
        setApprovedResult({
          email: req.email,
          name: req.name,
          tempPassword: data.user?.tempPassword
        })
        loadData()
      } else {
        doAction(`Erro ao aprovar: ${data.error || 'Falha na requisição'}`)
      }
    } catch (err: any) {
      doAction(`Falha na aprovação: ${err.message}`)
    } finally {
      setApprovingId(null)
    }
  }

  const handleReject = async (req: RequestItem) => {
    doAction(`Rejeitando solicitação de ${req.name}...`)
    try {
      const res = await fetch(getApiUrl('/api/admin/reject-request'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: req.id })
      })
      const data = await res.json()
      if (data.success) {
        doAction(`Solicitação de ${req.name} marcada como rejeitada.`)
        loadData()
      }
    } catch (err: any) {
      doAction(`Erro ao rejeitar: ${err.message}`)
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending'
    if (filter === 'approved') return r.status === 'approved'
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Cabeçalho */}
      <div className="section-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#f0fdfa' }}>Gestão & Aprovação de Usuários</h2>
            <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '4px', background: 'rgba(32, 214, 199, 0.15)', color: '#20d6c7', border: '1px solid rgba(32, 214, 199, 0.3)' }}>
              MASTER ONLY
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#728b8c' }}>
            Aprove novas solicitações de cadastro, emita senhas temporárias automáticas e visualize os usuários ativos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="secondary-button"
            onClick={loadData}
            disabled={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', background: '#0e1618', border: '1px solid #1c2b2e', color: '#8ca6a5', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
          >
            <RefreshCw size={13} className={isLoading ? 'spinning' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Alerta de Sucesso / Modal de Confirmação com Senha Gerada */}
      {approvedResult && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(12, 24, 22, 0.95))',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: '10px',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: '#10b981' }} />
              <strong style={{ color: '#f0fdfa', fontSize: '13px' }}>Acesso Liberado com Sucesso!</strong>
            </div>
            <button
              onClick={() => setApprovedResult(null)}
              style={{ background: 'transparent', border: 'none', color: '#6ee7b7', cursor: 'pointer', fontSize: '12px' }}
            >
              ✕ Fechar
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '11.5px', color: '#a7f3d0' }}>
            O usuário <strong>{approvedResult.name}</strong> ({approvedResult.email}) foi cadastrado e recebeu as credenciais no e-mail.
          </p>
          {approvedResult.tempPassword && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px', background: '#090f11', padding: '8px 12px', borderRadius: '6px', border: '1px solid #1c2d28' }}>
              <KeyRound size={14} style={{ color: '#20d6c7' }} />
              <span style={{ fontSize: '11px', color: '#8ca6a5' }}>Senha Gerada:</span>
              <code style={{ fontSize: '12.5px', color: '#10b981', fontWeight: 700, letterSpacing: '0.5px' }}>{approvedResult.tempPassword}</code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(approvedResult.tempPassword || '')
                  doAction('Senha copiada para a área de transferência!')
                }}
                style={{ marginLeft: 'auto', background: 'rgba(32, 214, 199, 0.15)', border: '1px solid rgba(32, 214, 199, 0.3)', color: '#20d6c7', borderRadius: '4px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer' }}
              >
                Copiar Senha
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tabs de Filtro de Solicitações */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #162426', paddingBottom: '8px' }}>
        <button
          onClick={() => setFilter('pending')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: filter === 'pending' ? '1px solid #20d6c7' : '1px solid transparent',
            background: filter === 'pending' ? 'rgba(32, 214, 199, 0.12)' : 'transparent',
            color: filter === 'pending' ? '#20d6c7' : '#8ca6a5',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Clock size={13} />
          Pendentes
          {pendingCount > 0 && (
            <span style={{ background: '#f59e0b', color: '#000', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '10px' }}>
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setFilter('approved')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: filter === 'approved' ? '1px solid #10b981' : '1px solid transparent',
            background: filter === 'approved' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
            color: filter === 'approved' ? '#10b981' : '#8ca6a5',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <UserCheck size={13} />
          Aprovados ({requests.filter(r => r.status === 'approved').length})
        </button>

        <button
          onClick={() => setFilter('all')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '6px',
            border: filter === 'all' ? '1px solid #38bdf8' : '1px solid transparent',
            background: filter === 'all' ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
            color: filter === 'all' ? '#38bdf8' : '#8ca6a5',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <Users size={13} />
          Todas ({requests.length})
        </button>
      </div>

      {/* Lista de Solicitações */}
      <section className="panel" style={{ background: '#0b1113', border: '1px solid #162426', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #162426', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: '#e2edeb', fontSize: '12.5px' }}>
            Solicitações de Acesso ({filteredRequests.length})
          </strong>
          <span style={{ fontSize: '10px', color: '#526e72' }}>Notificação no WhatsApp e E-mail Automáticos</span>
        </div>

        {filteredRequests.length === 0 ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#6f8387', fontSize: '12px' }}>
            Nenhuma solicitação encontrada neste filtro.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filteredRequests.map(req => {
              const isPending = req.status === 'pending'
              const dateStr = req.requested_at || req.requestedAt
              const formattedDate = dateStr ? new Date(dateStr).toLocaleString('pt-BR') : '-'

              return (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderBottom: '1px solid #142022',
                    gap: '14px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '220px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: isPending ? '#f59e0b' : '#10b981',
                      display: 'grid',
                      placeItems: 'center',
                      fontWeight: 700,
                      fontSize: '13px'
                    }}>
                      {req.name ? req.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div>
                      <strong style={{ color: '#f0fdfa', fontSize: '12.5px', display: 'block' }}>{req.name}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <Mail size={11} style={{ color: '#526e72' }} />
                        <span style={{ fontSize: '11px', color: '#20d6c7', fontFamily: 'monospace' }}>{req.email}</span>
                      </div>
                      {req.note && (
                        <p style={{ margin: '4px 0 0', fontSize: '10.5px', color: '#8ca6a5', fontStyle: 'italic' }}>
                          &quot;{req.note}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        background: isPending ? 'rgba(245, 158, 11, 0.15)' : req.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: isPending ? '#f59e0b' : req.status === 'approved' ? '#10b981' : '#ef4444',
                        border: isPending ? '1px solid rgba(245, 158, 11, 0.3)' : req.status === 'approved' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {isPending ? 'PENDENTE' : req.status === 'approved' ? 'APROVADO' : 'RECUSADO'}
                      </span>
                      <small style={{ display: 'block', fontSize: '9.5px', color: '#526e72', marginTop: '4px' }}>{formattedDate}</small>
                    </div>

                    {isPending && (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={approvingId === req.id}
                          onClick={() => handleApprove(req)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)'
                          }}
                        >
                          <UserCheck size={13} />
                          {approvingId === req.id ? 'Aprovando...' : 'Aprovar Acesso'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleReject(req)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            color: '#ef4444',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          <UserX size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Seção de Usuários Registrados */}
      <section className="panel" style={{ background: '#0b1113', border: '1px solid #162426', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #162426', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ color: '#e2edeb', fontSize: '12.5px' }}>
            Usuários Cadastrados ({users.length})
          </strong>
          <span style={{ fontSize: '10px', color: '#526e72' }}>Sessão JWT com Validade de 7 Dias</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid #142022',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: u.role === 'master' ? 'linear-gradient(135deg, #20d6c7, #0e857b)' : 'rgba(56, 189, 248, 0.15)',
                  color: u.role === 'master' ? '#000' : '#38bdf8',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '11px'
                }}>
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong style={{ fontSize: '12px', color: '#f0fdfa' }}>{u.name}</strong>
                  <span style={{ fontSize: '10.5px', color: '#728b8c', marginLeft: '8px' }}>{u.email}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: u.role === 'master' ? 'rgba(32, 214, 199, 0.15)' : 'rgba(107, 114, 128, 0.2)',
                  color: u.role === 'master' ? '#20d6c7' : '#9ca3af',
                  border: u.role === 'master' ? '1px solid rgba(32, 214, 199, 0.3)' : '1px solid rgba(107, 114, 128, 0.3)'
                }}>
                  {u.role.toUpperCase()}
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                  {u.status || 'Ativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
export default UserManagementView
