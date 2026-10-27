'use client'

import React from 'react'
import {
  Activity, ArrowLeftRight, Bot, CircleHelp, Cloud, Container, Cpu, Globe2,
  HardDrive, KeyRound, Layers3, LayoutDashboard, LogOut, Menu, Network,
  Rocket, Settings, Shield, TerminalSquare, Users, X
} from 'lucide-react'
import { VercelIcon } from './VercelDeploymentsView'
import { RenderIcon } from './RenderDeploymentsView'
import { useWorkspace } from '../context/WorkspaceContext'

export const navSections = [
  {
    title: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Conectores Hub', icon: Shield, badge: 'Novo' },
      { label: 'Odisseu AI', icon: Bot, badge: 'Copilot' },
      { label: 'Monitoramento & Logs', icon: Activity, badge: 'Live' },
      { label: 'Robôs & Bots da VM', icon: Cpu },
      { label: 'Deploy', icon: Rocket },
      { label: 'Vercel Frontend', icon: VercelIcon },
      { label: 'Render Backend', icon: RenderIcon },
      { label: 'Migração Multi-Cloud', icon: ArrowLeftRight },
    ]
  },
  {
    title: 'Infraestrutura & Serviços',
    items: [
      { label: 'Docker', icon: Container },
      { label: 'Nginx', icon: Network },
      { label: 'Tunnels', icon: Shield, badge: 'Zero Trust' },
      { label: 'Storage', icon: HardDrive },
      { label: 'Terminal', icon: TerminalSquare },
      { label: 'Cofre & Variáveis', icon: KeyRound },
    ]
  },
  {
    title: 'Gerenciamento',
    items: [
      { label: 'Recursos & VMs', icon: Layers3 },
      { label: 'Aprovações & Usuários', icon: Users },
      { label: 'Configurações', icon: Settings },
    ]
  },
  {
    title: 'Divulgação & Apresentação',
    items: [
      { label: '🌟 Landing Page Oficial', icon: Globe2, badge: 'Pública' },
      { label: 'Ajuda & Guia', icon: CircleHelp },
    ]
  }
]

export function Sidebar() {
  const {
    active,
    setActive,
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentUser,
    setCurrentUser,
    server,
    containers,
    pendingRequestsCount
  } = useWorkspace()

  if (!currentUser) return null

  return (
    <>
      <button 
        className="mobile-menu" 
        onClick={() => setSidebarOpen(!sidebarOpen)} 
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {sidebarOpen && (
        <button 
          className="sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)} 
          aria-label="Fechar menu" 
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="brand">
          <span 
            className="brand-mark" 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)} 
            style={{ cursor: 'pointer' }} 
            title={sidebarCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral'}
          >
            <Cloud size={18} />
          </span>
          <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#e5f0ed', lineHeight: 1.1 }}>CloudOps <b>Hub</b></span>
            <span style={{ fontSize: '10px', color: '#6b8a8e', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px' }}>DevOps Cloud Console</span>
          </div>
          <button
            type="button"
            className="desktop-collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expandir Menu Lateral' : 'Recolher Menu Lateral (Modo Ícones)'}
            aria-label="Alternar largura da barra lateral"
          >
            <Menu size={16} />
          </button>
          <button 
            className="mobile-close" 
            onClick={() => setSidebarOpen(false)} 
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace">
          <span className="workspace-avatar">{currentUser.name.charAt(0)}</span>
          <div>
            <strong>{currentUser.name}</strong>
            <small>{currentUser.email}</small>
          </div>
          <span style={{ fontSize: '9px', padding: '2px 6px', background: 'rgba(32, 214, 199, 0.1)', color: '#20d6c7', borderRadius: '4px', border: '1px solid rgba(32, 214, 199, 0.25)', fontWeight: 600 }}>PRO</span>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section">
              <span className="nav-caption">{section.title}</span>
              {section.items.map(({ label, icon: Icon, badge }) => {
                const isApproval = label === 'Aprovações & Usuários'
                const isVm = label === 'Recursos & VMs'
                const isDashboard = label === 'Dashboard'

                const isItemActive =
                  active === label ||
                  (isVm && active === 'Dashboard') ||
                  (isDashboard && (active === 'Dashboard' || active === 'Recursos & VMs')) ||
                  (isApproval && (active === 'Usuários & Aprovações' || active === 'Aprovações & Usuários'))

                return (
                  <button 
                    key={label} 
                    title={`Abrir módulo ${label}`}
                    onClick={() => {
                      if (label === '🌟 Landing Page Oficial') {
                        window.open('/landing', '_blank')
                        return
                      }
                      if (isVm) {
                        setActive('Dashboard')
                      } else if (isApproval) {
                        setActive('Usuários & Aprovações')
                      } else {
                        setActive(label)
                      }
                      setSidebarOpen(false)
                    }} 
                    className={`nav-item ${isItemActive ? 'active' : ''}`}
                  >
                    <Icon size={16} style={isApproval ? { color: '#20d6c7' } : undefined} />
                    <span>{label}</span>
                    {label === 'Docker' && server && containers.length > 0 && <span className="nav-badge">{containers.length}</span>}
                    {isApproval && (
                      <span 
                        className="nav-badge" 
                        style={{ 
                          background: pendingRequestsCount > 0 ? '#f59e0b' : 'rgba(32, 214, 199, 0.2)', 
                          color: pendingRequestsCount > 0 ? '#000' : '#20d6c7', 
                          fontWeight: 800 
                        }}
                      >
                        {pendingRequestsCount > 0 ? pendingRequestsCount : 'Admin'}
                      </span>
                    )}
                    {!isApproval && label !== 'Docker' && badge && <span className="nav-badge">{badge}</span>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            className={`nav-item ${active === 'Configurações' ? 'active' : ''}`} 
            title="Abrir configurações de segurança, chaves AES-256 e perfil" 
            onClick={() => setActive('Configurações')}
          >
            <Settings size={16} />
            <span>Configurações</span>
          </button>
          <button 
            className="nav-item logout-btn" 
            title="Fazer logout e encerrar a sessão segura" 
            onClick={() => {
              setCurrentUser(null)
              localStorage.removeItem('cloudops_user')
              localStorage.removeItem('cloudops_token')
              sessionStorage.removeItem('cloudops_user')
              sessionStorage.removeItem('cloudops_token')
            }}
          >
            <LogOut size={16} />
            <span>Sair da Conta</span>
          </button>

          <div className="sidebar-status-pill">
            <div className="live-indicator">
              <span className="live-dot" />
              <span>Nuvem Ativa</span>
            </div>
            <span>v2.4.0</span>
          </div>
        </div>
      </aside>
    </>
  )
}
