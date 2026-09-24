'use client'

import { useState } from 'react'
import { Network, Plus, Server, Check, X } from 'lucide-react'
import { ProxyHost, Server as ServerType } from '../types'

interface NginxViewProps {
  server: ServerType | null
  proxyHosts: ProxyHost[]
  setProxyHosts: React.Dispatch<React.SetStateAction<ProxyHost[]>>
  doAction: (msg: string) => void
  setConnectModalOpen: (open: boolean) => void
}

export function NginxView({
  server,
  proxyHosts,
  setProxyHosts,
  doAction,
  setConnectModalOpen
}: NginxViewProps) {
  const [editProxyOpen, setEditProxyOpen] = useState(false)
  const [editingProxyIndex, setEditingProxyIndex] = useState<number | null>(null)
  const [proxyDomain, setProxyDomain] = useState('')
  const [proxyForward, setProxyForward] = useState('')
  const [proxySsl, setProxySsl] = useState("Let's Encrypt (Ativo)")

  if (!server) {
    return (
      <div>
        <div className="section-heading">
          <div>
            <h2>Nginx Proxy Reverso & API Gateway</h2>
            <p>Roteamento de domínios públicos para portas e containers locais na VM.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
            <Network size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
          <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
            Conecte sua VM para configurar regras de proxy reverso, certificados SSL Let's Encrypt automáticos e roteamento de tráfego para suas aplicações internas.
          </p>
          <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
            <Server size={15} /> Conectar Minha VM (SSH)
          </button>
        </div>
      </div>
    )
  }

  const isVirginMicro = server.ip === '137.131.187.54' || server.id === 'oracle-micro-02'

  return (
    <>
      <div className="section-heading">
        <div>
          <h2>Nginx Proxy Reverso & API Gateway</h2>
          <p>Roteamento de domínios públicos para portas e containers locais na VM.</p>
        </div>
        <button 
          className="primary-button" 
          title="Criar novo mapeamento de domínio para porta local" 
          onClick={() => {
            setEditingProxyIndex(null)
            setProxyDomain('')
            setProxyForward('http://127.0.0.1:3000')
            setProxySsl("Let's Encrypt (Ativo)")
            setEditProxyOpen(true)
          }}
        >
          <Plus size={14} /> Adicionar Host
        </button>
      </div>

      <div className="step-box" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#d9e2e1' }}>
            <span className="live-dot" /> Container Nginx: <b>{isVirginMicro ? 'Nenhum' : 'nginx-manager-nginx-1'}</b>
          </div>
          <div style={{ fontSize: '10px', color: '#6f8387', marginTop: '3px' }}>
            {isVirginMicro 
              ? 'Nginx ainda não instalado nesta VM virgem.' 
              : 'Porta 80/443 exposta e roteando requisições diretamente para as portas internas dos containers.'}
          </div>
        </div>
        <span className="healthy-label">
          <span className={`status-dot ${isVirginMicro ? 'amber' : 'emerald'}`} /> 
          {isVirginMicro ? 'Não Instalado' : 'Roteador Ativo'}
        </span>
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>Hosts Configurados ({proxyHosts.length})</h3>
            <p>Roteamento ativo com SSL Let's Encrypt e Cloudflare Tunnel</p>
          </div>
        </div>
        <div className="container-list">
          {proxyHosts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#6f8387', fontSize: '11px' }}>
              Nenhum Proxy Host configurado ainda. Clique em &quot;Adicionar Host&quot; para mapear um domínio para uma porta.
            </div>
          ) : proxyHosts.map((item, idx) => (
            <div className="container-row" key={item.domain}>
              <span className="status-dot emerald" />
              <div className="container-info">
                <strong>{item.domain}</strong>
                <small>Encaminha tráfego externo para ➔ <b>{item.forward}</b></small>
              </div>
              <span className="status-text emerald">{item.ssl}</span>
              <button 
                className="text-action" 
                title={`Editar apontamento e certificado SSL de ${item.domain}`} 
                style={{ marginLeft: 'auto' }} 
                onClick={() => {
                  setEditingProxyIndex(idx)
                  setProxyDomain(item.domain)
                  setProxyForward(item.forward)
                  setProxySsl(item.ssl)
                  setEditProxyOpen(true)
                }}
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Modal de Edição / Adição de Host Nginx */}
      {editProxyOpen && (
        <div className="modal-overlay" onClick={() => setEditProxyOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{editingProxyIndex !== null ? 'Editar Proxy Host (Nginx)' : 'Adicionar Novo Proxy Host (Nginx)'}</h2>
                <p>Mapeie um domínio com SSL para uma porta de container na sua VM.</p>
              </div>
              <button className="modal-close" onClick={() => setEditProxyOpen(false)} aria-label="Fechar modal"><X size={18} /></button>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#6f8387', marginBottom: '4px' }}>Nome de Domínio / Subdomínio</label>
              <input 
                type="text" 
                placeholder="ex: app.seudominio.com.br" 
                value={proxyDomain} 
                onChange={e => setProxyDomain(e.target.value)}
                style={{ width: '100%', height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#6f8387', marginBottom: '4px' }}>Destino de Encaminhamento (Forward Host / Porta)</label>
              <input 
                type="text" 
                placeholder="ex: http://127.0.0.1:3002" 
                value={proxyForward} 
                onChange={e => setProxyForward(e.target.value)}
                style={{ width: '100%', height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '10px', color: '#6f8387', marginBottom: '4px' }}>Certificado SSL</label>
              <select 
                value={proxySsl} 
                onChange={e => setProxySsl(e.target.value)}
                style={{ width: '100%', height: '36px', background: '#080b0d', border: '1px solid #182326', borderRadius: '6px', padding: '0 10px', color: '#d9e2e1', fontSize: '11px', outline: 'none' }}
              >
                <option value="Let's Encrypt (Ativo)">Let&apos;s Encrypt (Automático com renovação)</option>
                <option value="Cloudflare Zero Trust SSL">Cloudflare Zero Trust (Edge SSL)</option>
                <option value="Auto-Renew">Auto-Renew</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="refresh-button" onClick={() => setEditProxyOpen(false)}>Cancelar</button>
              {editingProxyIndex !== null && (
                <button 
                  className="refresh-button" 
                  style={{ color: '#ff6b6b', borderColor: '#ff6b6b44' }}
                  onClick={() => {
                    const updated = proxyHosts.filter((_, idx) => idx !== editingProxyIndex)
                    setProxyHosts(updated)
                    localStorage.setItem('cloudops_proxies', JSON.stringify(updated))
                    setEditProxyOpen(false)
                    doAction('Host removido do Nginx com sucesso!')
                  }}
                >
                  Excluir Host
                </button>
              )}
              <button 
                className="primary-button" 
                disabled={!proxyDomain || !proxyForward}
                onClick={() => {
                  const newHost: ProxyHost = { domain: proxyDomain, forward: proxyForward, ssl: proxySsl, status: 'Online' }
                  let updated: ProxyHost[] = []
                  if (editingProxyIndex !== null) {
                    updated = [...proxyHosts]
                    updated[editingProxyIndex] = newHost
                  } else {
                    updated = [...proxyHosts, newHost]
                  }
                  setProxyHosts(updated)
                  localStorage.setItem('cloudops_proxies', JSON.stringify(updated))
                  setEditProxyOpen(false)
                  doAction(`Host ${proxyDomain} salvo no Nginx e recarregado! 🚀`)
                }}
              >
                <Check size={14} /> Salvar Host Nginx
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
