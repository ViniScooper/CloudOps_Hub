'use client'

import { X } from 'lucide-react'
import { Server as ServerType } from '../types'

interface CloudflareModalProps {
  isOpen: boolean
  onClose: () => void
  server: ServerType | null
  doAction: (msg: string) => void
}

export function CloudflareModal({
  isOpen,
  onClose,
  server,
  doAction
}: CloudflareModalProps) {
  if (!isOpen) return null

  const isVirginMicro = server?.name === 'cloudops-micro-02' || server?.ip === '137.131.187.54'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Cloudflare Secure & Zero Trust Tunnels</h2>
            <p>Rotas seguras de borda conectando domínios públicos ao Vercel e à VM Oracle.</p>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Fechar modal"><X size={18} /></button>
        </div>

        {isVirginMicro ? (
          <>
            <div className="step-box" style={{ borderColor: '#f59e0b44' }}>
              <div className="step-title"><span className="status-dot amber" /> Nenhum Túnel Configurado na VM: {server?.name}</div>
              <p style={{ fontSize: '10px', color: '#6f8387', margin: '0 0 10px' }}>
                Esta máquina é um nó virgem recém-provisionado. O daemon cloudflared ainda não foi instalado.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="parsed-item">
                  <span>Status do Túnel</span>
                  <strong style={{ color: '#f59e0b' }}>Não Instalado</strong>
                </div>
                <div className="parsed-item">
                  <span>Portas Externas</span>
                  <strong style={{ color: '#20d6c7' }}>Bloqueadas (Zero Trust)</strong>
                </div>
              </div>
            </div>
            <div className="step-box">
              <div className="step-title"><span className="live-dot" /> Apontamento de Domínios</div>
              <p style={{ fontSize: '11px', color: '#6f8387', margin: '10px 0 0' }}>
                Nenhum domínio apontado para este nó. Para criar uma nova rota, use a aba <b>Tunnels</b> ou clique no botão Mapear Novo Domínio.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="step-box" style={{ borderColor: '#20d6c744' }}>
              <div className="step-title"><span className="live-dot" /> Túnel Ativo na VM: boteco_tunnel (cloudflare/cloudflared)</div>
              <p style={{ fontSize: '10px', color: '#6f8387', margin: '0 0 10px' }}>
                O túnel protege a infraestrutura de ataques DDoS e elimina a necessidade de abrir portas no roteador ou firewall da Oracle.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="parsed-item">
                  <span>Status do Túnel</span>
                  <strong style={{ color: '#a3e635' }}>Ativo & Conectado</strong>
                </div>
                <div className="parsed-item">
                  <span>Edge Network</span>
                  <strong>Cloudflare Global Anycast</strong>
                </div>
              </div>
            </div>

            <div className="step-box">
              <div className="step-title"><span className="live-dot" /> Apontamento de Domínios (DNS & Rotas de Borda)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <div style={{ padding: '10px', background: '#0e1618', border: '1px solid #1b282b', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#d9e2e1', fontSize: '11px' }}>botecosivirino.com.br</strong>
                    <span className="status-text emerald" style={{ fontSize: '9px' }}>Apontado ➔ Vercel</span>
                  </div>
                  <small style={{ color: '#6f8387', fontSize: '9px', display: 'block', marginTop: '4px' }}>
                    Frontend Next.js hospedado na Vercel (Edge Functions + CDN global com CNAME cname.vercel-dns.com).
                  </small>
                </div>

                <div style={{ padding: '10px', background: '#0e1618', border: '1px solid #1b282b', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#d9e2e1', fontSize: '11px' }}>cardapio.botecosivirino.com.br</strong>
                    <span className="status-text emerald" style={{ fontSize: '9px' }}>Túnel ➔ VM Oracle (:3002)</span>
                  </div>
                  <small style={{ color: '#6f8387', fontSize: '9px', display: 'block', marginTop: '4px' }}>
                    Roteado via boteco_tunnel diretamente para o container Node.js (boteco_backend) na porta 3002 da VM.
                  </small>
                </div>

                <div style={{ padding: '10px', background: '#0e1618', border: '1px solid #1b282b', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: '#d9e2e1', fontSize: '11px' }}>api.lottus.com.br</strong>
                    <span className="status-text emerald" style={{ fontSize: '9px' }}>Nginx Proxy ➔ VM Oracle (:3001)</span>
                  </div>
                  <small style={{ color: '#6f8387', fontSize: '9px', display: 'block', marginTop: '4px' }}>
                    API corporativa gerenciada via PM2 no host local com terminação SSL automática Let's Encrypt.
                  </small>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="refresh-button" onClick={() => doAction('Status de DNS Cloudflare verificado')}>Verificar DNS</button>
          <button className="primary-button" onClick={onClose}>Fechar Janela</button>
        </div>
      </div>
    </div>
  )
}
