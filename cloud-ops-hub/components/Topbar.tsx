'use client'

import React from 'react'
import { Check, ChevronDown, CircleHelp, Plus, Server, Settings } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

export function Topbar() {
  const {
    active,
    setActive,
    server,
    serverList,
    topbarServerMenu,
    setTopbarServerMenu,
    handleSwitchServer,
    setConnectModalOpen,
    currentUser
  } = useWorkspace()

  if (!currentUser) return null

  return (
    <header className="topbar" style={{ position: 'relative', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
      <div className="topbar-nav" style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: '1 1 auto' }}>
        <div className="topbar-breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
          <span className="breadcrumb-workspace" style={{ color: '#526e72', fontSize: '11.5px', whiteSpace: 'nowrap' }}>Workspace</span>
          <span className="breadcrumb-slash" style={{ color: '#2a3d40', fontSize: '11.5px' }}>/</span>
          <strong className="breadcrumb-active" style={{ color: '#e2edeb', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}>{active}</strong>
        </div>

        <div className="topbar-divider" style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.12)', margin: '0 2px', flexShrink: 0 }} />

        <div className="topbar-server-wrapper" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {server ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setTopbarServerMenu(!topbarServerMenu)
              }}
              title="Clique para alternar o servidor / VM de trabalho"
              className="topbar-server-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '28px',
                padding: '0 8px 0 5px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, rgba(16, 28, 30, 0.98), rgba(7, 14, 16, 0.98))',
                border: '1px solid rgba(32, 214, 199, 0.4)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                color: '#e2edeb',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }}
            >
              <span 
                style={{ 
                  padding: '1px 5px', 
                  borderRadius: '4px', 
                  fontSize: '8px', 
                  fontWeight: 800, 
                  lineHeight: '13px',
                  letterSpacing: '0.4px',
                  background: server.provider?.toLowerCase().includes('aws') ? '#f4b942' : 'linear-gradient(135deg, #ef9b55, #c25f39)', 
                  color: '#fff',
                  flexShrink: 0
                }}
              >
                {server.provider?.toLowerCase().includes('aws') ? 'AWS' : 'OCI'}
              </span>

              <div style={{ position: 'relative', display: 'flex', width: '7px', height: '7px', flexShrink: 0 }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10b981', opacity: 0.6, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                <span className="server-label-prefix" style={{ fontSize: '8.5px', fontWeight: 700, color: '#20d6c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  NÓ:
                </span>
                <span className="server-name-text" style={{ fontSize: '11px', fontWeight: 600, color: '#f0fdfa' }}>
                  {server.name}
                </span>
                <span className="server-ip-badge" style={{ 
                  fontSize: '9.5px', 
                  fontFamily: 'monospace', 
                  color: '#38bdf8', 
                  background: 'rgba(0, 0, 0, 0.5)', 
                  padding: '1px 5px', 
                  borderRadius: '3px',
                  border: '1px solid rgba(56, 189, 248, 0.25)'
                }}>
                  {server.ip}
                </span>
              </div>

              <ChevronDown 
                size={12} 
                style={{ 
                  color: '#8ca6a5', 
                  transform: topbarServerMenu ? 'rotate(180deg)' : 'none', 
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  marginLeft: '2px'
                }} 
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              title="Nenhuma máquina conectada. Clique para conectar via SSH."
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                height: '28px',
                padding: '0 9px',
                borderRadius: '6px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                cursor: 'pointer',
                fontSize: '10px',
                color: '#f59e0b',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span className="status-dot amber" style={{ width: '5px', height: '5px' }} />
              <Server size={11} />
              <span style={{ fontWeight: 600 }}>Sem Nó Ativo</span>
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>(Conectar SSH)</span>
            </button>
          )}

          {topbarServerMenu && (
            <div 
              className="topbar-dropdown-backdrop"
              style={{ 
                position: 'fixed', 
                inset: 0, 
                zIndex: 999998,
                background: 'rgba(0, 0, 0, 0.45)',
                backdropFilter: 'blur(2px)'
              }} 
              onClick={(e) => {
                e.stopPropagation()
                setTopbarServerMenu(false)
              }} 
            />
          )}

          {topbarServerMenu && (
            <div 
              className="topbar-server-dropdown"
              onClick={(e) => e.stopPropagation()}
              style={{ 
                position: 'absolute', 
                top: 'calc(100% + 7px)', 
                left: 0, 
                zIndex: 999999,
                width: '320px',
                background: '#090f11',
                border: '1px solid rgba(32, 214, 199, 0.4)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.95), 0 0 25px rgba(0, 0, 0, 0.85)',
                borderRadius: '10px',
                padding: '8px',
                backdropFilter: 'blur(24px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px 10px', borderBottom: '1px solid #162426', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Server size={13} style={{ color: '#20d6c7' }} />
                  <span style={{ fontSize: '10px', color: '#8ca6a5', textTransform: 'uppercase', letterSpacing: '0.8px', fontWeight: 700 }}>
                    Nós do Cluster ({serverList.length})
                  </span>
                </div>
                <span style={{ fontSize: '9.5px', color: '#526e72' }}>Zero Trust</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {serverList.map(item => {
                  const isCurrent = item.id === server?.id
                  return (
                    <button
                      key={item.id} 
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSwitchServer(item)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '7px',
                        background: isCurrent ? 'rgba(32, 214, 199, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: isCurrent ? '1px solid rgba(32, 214, 199, 0.4)' : '1px solid #162426',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <span className={`provider-mark small ${item.color || 'oracle'}`}>OC</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <b style={{ color: isCurrent ? '#20d6c7' : '#d9e2e1', fontSize: '11.5px' }}>{item.name}</b>
                          {isCurrent && <span style={{ fontSize: '8px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(32, 214, 199, 0.25)', color: '#20d6c7', fontWeight: 700 }}>ATIVO</span>}
                        </div>
                        <small style={{ color: '#6f8387', fontSize: '10px', display: 'block', marginTop: '2px', fontFamily: 'monospace' }}>
                          {item.ip} · {item.region}
                        </small>
                      </div>
                      {isCurrent && <Check size={14} style={{ color: '#20d6c7', flexShrink: 0 }} />}
                    </button>
                  )
                })}

                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '8px', borderTop: '1px solid #162426' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setTopbarServerMenu(false)
                      setConnectModalOpen(true)
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '7px',
                      background: 'rgba(32, 214, 199, 0.1)',
                      border: '1px solid rgba(32, 214, 199, 0.3)',
                      borderRadius: '6px',
                      color: '#20d6c7',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} /> Conectar Nova VM
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button 
          className="topbar-action-icon"
          title="Ajuda & Guia Rápido"
          onClick={() => setActive('Ajuda & Guia')}
          style={{ color: active === 'Ajuda & Guia' ? '#20d6c7' : undefined }}
        >
          <CircleHelp size={16} />
        </button>
        <button 
          className="topbar-action-icon"
          title="Configurações e Segurança"
          onClick={() => setActive('Configurações')}
          style={{ color: active === 'Configurações' ? '#20d6c7' : undefined }}
        >
          <Settings size={16} />
        </button>
        <button 
          className="topbar-avatar-btn"
          title={`${currentUser.name} (${currentUser.email})`}
          onClick={() => setActive('Configurações')}
          style={{ 
            borderColor: active === 'Configurações' ? '#20d6c7' : undefined 
          }}
        >
          <span>{currentUser.name.charAt(0)}</span>
        </button>
      </div>
    </header>
  )
}
