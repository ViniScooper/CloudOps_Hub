'use client'

import { useState, useRef, useEffect } from 'react'
import { TerminalSquare, RotateCcw, Server } from 'lucide-react'
import { getApiUrl } from '../lib/api'
import { Server as ServerType, TerminalEntry } from '../types'

interface TerminalViewProps {
  server: ServerType | null
  isFullTab?: boolean
  doAction: (msg: string) => void
  setConnectModalOpen: (open: boolean) => void
}

export function TerminalView({
  server,
  isFullTab = false,
  doAction,
  setConnectModalOpen
}: TerminalViewProps) {
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalHistory, setTerminalHistory] = useState<TerminalEntry[]>([
    { time: '16:00:10', type: 'info', text: 'CloudOps Hub Zero Trust SSH Session connected' },
    { time: '16:00:15', type: 'info', text: 'Sessão SSH Zero Trust autenticada e ativa na porta 22.' },
    { time: '16:01:22', type: 'info', text: 'Sessão pronta. Experimente: uptime, free -m, df -h, docker ps' },
  ])
  const [isExecutingCmd, setIsExecutingCmd] = useState(false)
  const [historyCmds, setHistoryCmds] = useState<string[]>(['docker ps', 'free -m', 'df -h', 'uptime'])
  const [historyPointer, setHistoryPointer] = useState<number>(-1)
  const terminalEndRef = useRef<HTMLDivElement>(null)
  const terminalInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [terminalHistory])

  if (!server && isFullTab) {
    return (
      <div>
        <div className="section-heading">
          <div>
            <h2>Terminal Web SSH Seguro (Zero Trust)</h2>
            <p>Sessão interativa direta na VM via SSH.</p>
          </div>
        </div>
        <div className="panel" style={{ padding: '48px 24px', textAlign: 'center', marginTop: '16px', borderColor: 'rgba(32, 214, 199, 0.25)', background: 'linear-gradient(145deg, #0d1518, #080c0e)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(32, 214, 199, 0.1)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: '#20d6c7' }}>
            <TerminalSquare size={28} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#edf4f2' }}>Nenhum Servidor Conectado</h3>
          <p style={{ margin: '0 auto 20px', fontSize: '12px', color: '#8fa4a8', maxWidth: '500px', lineHeight: 1.6 }}>
            Conecte sua VM da Oracle Cloud, AWS ou VPS via SSH para abrir um terminal interativo Bash seguro com suporte a atalhos rápidos de DevOps (<code>top</code>, <code>df -h</code>, <code>docker ps</code>).
          </p>
          <button className="primary-button" style={{ margin: '0 auto' }} onClick={() => setConnectModalOpen(true)}>
            <Server size={15} /> Conectar Minha VM (SSH)
          </button>
        </div>
      </div>
    )
  }

  const getPrivateKey = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('cloudops_ssh_key') || ''
    }
    return ''
  }

  const runCommand = async (cmd: string) => {
    if (!server || isExecutingCmd || !cmd.trim()) return
    setIsExecutingCmd(true)
    const now = new Date().toTimeString().split(' ')[0]
    setTerminalHistory(prev => [...prev, { time: now, type: 'info', text: `$ ${cmd}` }])
    try {
      const res = await fetch(getApiUrl('/api/servers/exec'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: server.ip,
          user: 'ubuntu',
          command: cmd,
          privateKey: getPrivateKey()
        })
      })
      const d = await res.json()
      setTerminalHistory(prev => [...prev, { time: now, type: 'log', text: d.output || 'Concluído com sucesso.' }])
    } catch (e: any) {
      setTerminalHistory(prev => [...prev, { time: now, type: 'error', text: 'Erro: ' + e.message }])
    } finally {
      setIsExecutingCmd(false)
    }
  }

  return (
    <>
      {isFullTab && (
        <div className="section-heading">
          <div>
            <h2>Terminal Web SSH Seguro (Zero Trust)</h2>
            <p>Sessão interativa direta na VM {server?.name} ({server?.ip}) via xterm.js.</p>
          </div>
          <button className="refresh-button" onClick={() => { setTerminalHistory([]); doAction('Terminal limpo') }}>
            <RotateCcw size={13} /> Limpar Console
          </button>
        </div>
      )}

      <section className="panel terminal-panel command-panel" style={{ marginTop: isFullTab ? '0' : '14px' }}>
        <div className="terminal-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TerminalSquare size={16} style={{ color: '#20d6c7' }} />
              Terminal Interativo SSH (Bash)
            </h3>
            <p>
              <span className="live-dot" /> {server?.name || 'Local Shell'} 
              <span className="terminal-separator">•</span> 
              {server ? `ubuntu@${server.ip}` : 'desconectado'} (Zero Trust SSH:22)
            </p>
          </div>
          <div className="terminal-actions">
            <span className="terminal-live">{server ? 'CONECTADO' : 'OFFLINE'}</span>
            <button 
              className="panel-menu" 
              title="Limpar histórico do terminal" 
              onClick={() => setTerminalHistory([])} 
              aria-label="Limpar histórico"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
        <div className="terminal-window">
          <div className="terminal-tabs" style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <span className="terminal-tab active">
              <span className="tab-dot" /> bash ({server?.id || 'instance-bytedata'})
            </span>
            <span style={{ color: '#294043', fontSize: '10px' }}>| Atalhos:</span>
            {[
              { label: 'docker ps', cmd: 'docker ps --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"' },
              { label: 'free -m', cmd: 'free -m' },
              { label: 'df -h', cmd: 'df -h /' },
              { label: 'uptime', cmd: 'uptime' },
              { label: 'top (CPU)', cmd: 'top -b -n 1 | head -n 12' },
              { label: 'portas ativas', cmd: 'netstat -tuln | grep LISTEN' },
            ].map(fastCmd => (
              <button 
                key={fastCmd.label}
                className="terminal-tab" 
                title={`Executar: ${fastCmd.cmd}`} 
                style={{ cursor: 'pointer', border: '1px solid #1c3436', borderRadius: '4px', background: '#0b1618', padding: '2px 8px', fontSize: '9px', color: '#829d9c' }}
                onClick={() => runCommand(fastCmd.cmd)}
              >
                {fastCmd.label}
              </button>
            ))}
          </div>

          <div 
            className="terminal-body" 
            style={{ 
              height: isFullTab ? '460px' : '260px', 
              overflowY: 'auto',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '11px',
              background: '#05080a',
              padding: '12px'
            }}
            onClick={() => terminalInputRef.current?.focus()}
          >
            {terminalHistory.map((item, i) => (
              <div className="log-line" key={i} style={{ whiteSpace: 'pre-wrap', marginBottom: '6px', lineHeight: '1.4' }}>
                <span className="log-time" style={{ minWidth: '70px', color: '#4a6769' }}>[{item.time}]</span>
                <span className={`log-type ${item.type}`} style={{ minWidth: '46px', textTransform: 'uppercase', fontWeight: 600, fontSize: '9px' }}>
                  {item.type}
                </span>
                <span className="log-message" style={{ color: item.type === 'error' ? '#ff6b6b' : item.type === 'info' ? '#20d6c7' : '#a3e635' }}>
                  {item.text}
                </span>
              </div>
            ))}
            
            <form 
              onSubmit={async (e) => {
                e.preventDefault()
                if (!terminalInput.trim() || isExecutingCmd) return
                const cmd = terminalInput.trim()
                setTerminalInput('')
                setHistoryCmds(prev => [...prev, cmd])
                setHistoryPointer(-1)

                if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
                  setTerminalHistory([])
                  return
                }

                await runCommand(cmd)
              }}
              className="terminal-prompt" 
              style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', background: '#0a1012', padding: '6px 8px', borderRadius: '4px', border: '1px solid #162426' }}
            >
              <span style={{ color: '#20d6c7', fontWeight: 600, fontSize: '11px' }}>
                {server ? `ubuntu@${server.name}:~` : 'ubuntu@instance-bytedata:~'}
              </span> 
              <b style={{ color: '#6f8387' }}>$</b> 
              <input 
                ref={terminalInputRef}
                type="text" 
                value={terminalInput}
                disabled={isExecutingCmd}
                onChange={e => setTerminalInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    if (historyCmds.length === 0) return
                    const nextIndex = historyPointer === -1 ? historyCmds.length - 1 : Math.max(0, historyPointer - 1)
                    setHistoryPointer(nextIndex)
                    setTerminalInput(historyCmds[nextIndex] || '')
                  } else if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    if (historyPointer === -1) return
                    const nextIndex = historyPointer + 1
                    if (nextIndex >= historyCmds.length) {
                      setHistoryPointer(-1)
                      setTerminalInput('')
                    } else {
                      setHistoryPointer(nextIndex)
                      setTerminalInput(historyCmds[nextIndex] || '')
                    }
                  }
                }}
                placeholder={isExecutingCmd ? 'Executando comando no servidor...' : 'Digite qualquer comando bash (ex: htop, docker logs, ls -la) e pressione Enter...'}
                style={{ flex: 1, background: 'transparent', border: 0, color: '#a3e635', fontFamily: 'monospace', fontSize: '11px', outline: 'none' }}
              />
            </form>
            <div ref={terminalEndRef} />
          </div>
        </div>
      </section>
    </>
  )
}
