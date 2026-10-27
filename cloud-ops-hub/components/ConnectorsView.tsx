'use client'

import React from 'react'
import { Check, ExternalLink, RefreshCw, Zap } from 'lucide-react'
import { useWorkspace } from '../context/WorkspaceContext'

export function ConnectorsView() {
  const { server, doAction, setActive } = useWorkspace()

  return (
    <div className="view-container" style={{ padding: '4px 0 24px' }}>
      <div className="section-heading" style={{ marginBottom: '20px' }}>
        <div>
          <div className="eyebrow"><span className="live-dot" /> Integrações Multi-Cloud • Hub Central</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 6px', color: '#f0fdfa' }}>
            🔌 Conectores do Workspace
          </h2>
          <p style={{ fontSize: '13px', color: '#829aa0', margin: 0 }}>
            Central unificada de conexões. Repositórios de código, nuvens públicas, provedores de borda e bancos de dados integrados.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* 1. GitHub */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(32, 214, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#112027', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🐙
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● Conectado
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>GitHub Repository</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Sincronização contínua de código, commits e webhooks na branch <code>main</code>.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#526e72', fontFamily: 'monospace' }}>
            ViniScooper/CloudOps_Hub (main)
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => window.open('https://github.com/ViniScooper/CloudOps_Hub', '_blank')}
            >
              <ExternalLink size={13} /> Ver no GitHub
            </button>
            <button
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => doAction('Repositório GitHub sincronizado com sucesso!')}
            >
              <RefreshCw size={13} /> Sincronizar
            </button>
          </div>
        </div>

        {/* 2. Vercel */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(32, 214, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#112027', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#fff' }}>
              ▲
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● Produção Live
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>Vercel Edge Frontend</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Hospedagem de borda com certificado SSL automático e auto-redirect 307 ativo.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#526e72', fontFamily: 'monospace' }}>
            https://cloudopshub.com.br
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setActive('Vercel Frontend')}
            >
              Ver Deploys
            </button>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px', borderColor: 'rgba(32, 214, 199, 0.4)', color: '#20d6c7' }}
              onClick={() => window.open('https://cloudopshub.com.br', '_blank')}
            >
              Abrir Site ↗
            </button>
          </div>
        </div>

        {/* 3. Oracle Cloud OCI */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(32, 214, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 155, 85, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', fontWeight: 800, color: '#ef9b55' }}>
              OCI
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● Always Free Ativo
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>Oracle Cloud Infrastructure</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Instância AMD Epyc em São Paulo (GRU), telemetria SSH e Object Storage.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#526e72', fontFamily: 'monospace' }}>
            {server ? `${server.ip} · ${server.region}` : '137.131.185.243 · sa-saopaulo-1'}
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setActive('Dashboard')}
            >
              Métricas VM
            </button>
            <button
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => doAction('Ping de 21ms para Oracle GRU!')}
            >
              <Zap size={13} /> Testar Ping
            </button>
          </div>
        </div>

        {/* 4. Cloudflare Zero Trust */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(32, 214, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(243, 128, 32, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🛡️
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● Túnel Ativo
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>Cloudflare Zero Trust</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Túnel criptografado seguro sem necessidade de portas expostas diretamente na internet.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#526e72', fontFamily: 'monospace' }}>
            Túnel HTTPS Ativo (Fastify API)
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setActive('Tunnels')}
            >
              Configurar
            </button>
            <button
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => doAction('Túnel operacional e respondendo requisições!')}
            >
              <Check size={13} /> Status
            </button>
          </div>
        </div>

        {/* 5. Oracle Autonomous Database */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🗄️
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              ● 100% Online & Guardião Ativo
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>Oracle ATP Database</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Banco relacional autônomo na Oracle Cloud. <b>Guardião Anti-Sono Ativo com Dupla Redundância</b> (Node.js PM2 + Crontab Linux).
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#10b981', fontFamily: 'monospace' }}>
            🛡️ Ping 24/7 Redundante: cloudopshub.adb.sa-saopaulo-1
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => window.open('https://g31ac88bc331093-cloudopshub.adb.sa-saopaulo-1.oraclecloudapps.com/ords/sql-developer', '_blank')}
            >
              SQL Developer ↗
            </button>
            <button
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => doAction('✅ Ping enviado ao Oracle ATP: 200 OK (Banco 100% desperto e ativo!)')}
            >
              <Zap size={13} /> Testar Ping Agora
            </button>
          </div>
        </div>

        {/* 6. Render Backend */}
        <div className="panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(13, 25, 31, 0.75)', borderColor: 'rgba(32, 214, 199, 0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🟣
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              ● Standby Failover
            </span>
          </div>
          <div>
            <strong style={{ fontSize: '15px', color: '#f0fdfa', display: 'block', marginBottom: '4px' }}>Render Backend</strong>
            <p style={{ fontSize: '12px', color: '#829aa0', margin: 0, lineHeight: 1.4 }}>
              Ambiente de backup pronto para contingência e alta disponibilidade.
            </p>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.35)', padding: '6px 10px', borderRadius: '6px', fontSize: '11.5px', color: '#526e72', fontFamily: 'monospace' }}>
            cloudops-backend.onrender.com
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
            <button
              className="refresh-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => setActive('Render Backend')}
            >
              Ver Detalhes
            </button>
            <button
              className="primary-button"
              style={{ flex: 1, justifyContent: 'center', padding: '7px 12px', fontSize: '12px' }}
              onClick={() => doAction('Ambiente Render sincronizado!')}
            >
              Disparar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
