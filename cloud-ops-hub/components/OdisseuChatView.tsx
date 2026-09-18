'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Sparkles, Bot, Send, KeyRound, ExternalLink, Check, AlertCircle,
  RefreshCw, Terminal, Shield, Cpu, HardDrive, Container, ArrowRight,
  Trash2, ChevronDown, CheckCircle2, Eye, EyeOff, Zap, Play, Globe,
  Server, Copy, CheckCheck, Settings, X, CornerDownLeft, Activity,
  Layers, Lock, Database, Code, CheckSquare
} from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  toolsExecuted?: Array<{
    tool: string
    arguments: any
    result: string
  }>
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    totalTime?: string
    speedTps?: number
  }
  rateLimit?: {
    limitTokens?: string
    remainingTokens?: string
    limitRequests?: string
    remainingRequests?: string
    resetTokens?: string
  }
}

interface OdisseuChatViewProps {
  server: any
  doAction: (msg: string) => void
  onNavigate?: (tab: string) => void
}

const PROVIDERS = [
  {
    id: 'groq',
    name: 'Groq Cloud',
    badge: 'Recomendado • Grátis & Ultra-Rápido',
    models: [
      { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B (120B Parâmetros • Suporta Ferramentas)' },
      { id: 'qwen/qwen3.8-27b', name: 'Qwen 3.8 27B (Especialista em Código • Suporta Ferramentas)' }
    ],
    keyUrl: 'https://console.groq.com/keys',
    keyPlaceholder: 'gsk_...'
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    badge: 'Grátis (AI Studio)',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Rápido e leve)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Experimental)' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Raciocínio complexo)' }
    ],
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyPlaceholder: 'AIzaSy...'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Pago por uso',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Econômico)' },
      { id: 'gpt-4o', name: 'GPT-4o (Completo)' }
    ],
    keyUrl: 'https://platform.openai.com/api-keys',
    keyPlaceholder: 'sk-...'
  }
]

// Renderizador Markdown elegante com blocos de código estilizados
function MarkdownContent({ content, onCopyCode }: { content: string; onCopyCode: (code: string) => void }) {
  // Quebra o texto entre blocos de código ``` e texto comum
  const parts = content.split(/(```[\s\S]*?```)/g)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', lineHeight: '1.65' }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).split('\n')
          const language = lines[0]?.trim() || 'bash'
          const code = lines.slice(1).join('\n')

          return (
            <div
              key={index}
              style={{
                margin: '8px 0',
                borderRadius: '10px',
                background: '#05090b',
                border: '1px solid #16262a',
                overflow: 'hidden',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)'
              }}
            >
              {/* Cabeçalho do Bloco de Código */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '7px 14px',
                background: '#091215',
                borderBottom: '1px solid #142327',
                fontSize: '11px',
                color: '#6e8d91'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
                  <span style={{ marginLeft: '6px', fontWeight: 600, color: '#88a6aa', textTransform: 'uppercase', fontSize: '10px' }}>
                    {language}
                  </span>
                </div>
                <button
                  onClick={() => onCopyCode(code)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#20d6c7',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(32, 214, 199, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Copy size={12} /> Copiar
                </button>
              </div>

              {/* Corpo do Código */}
              <pre style={{
                margin: 0,
                padding: '14px',
                overflowX: 'auto',
                fontSize: '12px',
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                color: '#a3e635',
                lineHeight: '1.55',
                background: '#05090b'
              }}>
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // Renderização de parágrafos normais com suporte a negrito, listas e código inline
        return (
          <div key={index} style={{ whiteSpace: 'pre-wrap' }}>
            {renderInlineMarkdown(part)}
          </div>
        )
      })}
    </div>
  )
}

// Formata texto inline: **bold**, `code`, links, listas
function renderInlineMarkdown(text: string) {
  const lines = text.split('\n')
  return lines.map((line, lIdx) => {
    // Títulos Markdown ###
    if (line.startsWith('### ')) {
      return (
        <h3 key={lIdx} style={{ fontSize: '15px', fontWeight: 700, color: '#20d6c7', margin: '14px 0 6px' }}>
          {line.replace('### ', '')}
        </h3>
      )
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={lIdx} style={{ fontSize: '17px', fontWeight: 800, color: '#f0fdfa', margin: '16px 0 8px' }}>
          {line.replace('## ', '')}
        </h2>
      )
    }

    // Listas com marcadores
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const cleanLine = line.trim().substring(2)
      return (
        <div key={lIdx} style={{ display: 'flex', gap: '8px', margin: '4px 0', alignItems: 'flex-start' }}>
          <span style={{ color: '#20d6c7', marginTop: '6px', fontSize: '12px' }}>•</span>
          <div>{formatTextSegments(cleanLine)}</div>
        </div>
      )
    }

    return (
      <div key={lIdx} style={{ minHeight: line.trim() === '' ? '8px' : 'auto' }}>
        {formatTextSegments(line)}
      </div>
    )
  })
}

// Formata pedaços de **negrito** e `inline code`
function formatTextSegments(str: string) {
  const segments = str.split(/(\*\*.*?\*\*|`.*?`)/g)
  return segments.map((seg, idx) => {
    if (seg.startsWith('**') && seg.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: '#f0fdfa', fontWeight: 700 }}>
          {seg.slice(2, -2)}
        </strong>
      )
    }
    if (seg.startsWith('`') && seg.endsWith('`')) {
      return (
        <code
          key={idx}
          style={{
            background: 'rgba(32, 214, 199, 0.12)',
            color: '#20d6c7',
            padding: '2px 6px',
            borderRadius: '5px',
            fontSize: '12px',
            fontFamily: 'Consolas, Monaco, monospace',
            border: '1px solid rgba(32, 214, 199, 0.25)'
          }}
        >
          {seg.slice(1, -1)}
        </code>
      )
    }
    return seg
  })
}

export function OdisseuChatView({ server, doAction, onNavigate }: OdisseuChatViewProps) {
  const [provider, setProvider] = useState('groq')
  const [model, setModel] = useState('openai/gpt-oss-120b')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState<'idle' | 'testing' | 'valid' | 'invalid'>('idle')
  const [keyError, setKeyError] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  const [rateLimit, setRateLimit] = useState<any>(null)
  const [copiedCodeToast, setCopiedCodeToast] = useState(false)
  const [expandedToolIdx, setExpandedToolIdx] = useState<number | null>(null)

  // Base de Conhecimento RAG LangChain
  const [knowledgeStats, setKnowledgeStats] = useState<any>(null)
  const [reindexingKnowledge, setReindexingKnowledge] = useState(false)
  const [reindexSuccess, setReindexSuccess] = useState(false)

  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Carrega chaves e modelo salvos no localStorage
  useEffect(() => {
    const savedProvider = localStorage.getItem('odisseu_provider') || 'groq'
    setProvider(savedProvider)

    const curProv = PROVIDERS.find(p => p.id === savedProvider) || PROVIDERS[0]
    const savedModel = localStorage.getItem(`odisseu_model_${savedProvider}`) || curProv.models[0].id
    setModel(savedModel)

    const savedKey = localStorage.getItem(`odisseu_key_${savedProvider}`) || ''
    setApiKey(savedKey)

    if (savedKey) {
      setKeyStatus('valid')
    }

    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Olá, Vinicius! Eu sou o **Odisseu**, seu copiloto de infraestrutura e guardião autônomo na Oracle Cloud.\n\nEstou conectado à sua VM **${server?.name || 'instance-bytedata'}** (\`${server?.ip || '137.131.185.243'}\`) e conheço todas as diretrizes do seu ambiente: limite físico de 956 MB de RAM, swap ativo de 1GB, containers Docker em execução e mapa de portas reservadas.\n\nEscolha um diagnóstico abaixo ou digite sua dúvida ou comando:`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ])

    loadKnowledgeStats()
  }, [server])

  // Auto-scroll suave
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Troca de provedor
  const handleProviderChange = (newProvider: string) => {
    setProvider(newProvider)
    localStorage.setItem('odisseu_provider', newProvider)
    const curProv = PROVIDERS.find(p => p.id === newProvider) || PROVIDERS[0]
    const defaultModel = curProv.models[0].id
    setModel(defaultModel)
    localStorage.setItem(`odisseu_model_${newProvider}`, defaultModel)

    const savedKey = localStorage.getItem(`odisseu_key_${newProvider}`) || ''
    setApiKey(savedKey)
    setKeyStatus(savedKey ? 'valid' : 'idle')
    setKeyError('')
  }

  // Troca de modelo
  const handleModelChange = (newModel: string) => {
    setModel(newModel)
    localStorage.setItem(`odisseu_model_${provider}`, newModel)
  }

  // Helper de requisição ao backend
  const fetchBackend = async (endpoint: string, options?: RequestInit) => {
    try {
      return await fetch(`http://127.0.0.1:3005${endpoint}`, options)
    } catch {
      return await fetch(`http://localhost:3005${endpoint}`, options)
    }
  }

  // Consulta status da Base de Conhecimento RAG LangChain
  const loadKnowledgeStats = async () => {
    try {
      const res = await fetchBackend('/api/odisseu/knowledge')
      if (res && res.ok) {
        const data = await res.json()
        if (data.success) {
          setKnowledgeStats(data)
        }
      }
    } catch (e) {
      console.warn('Não foi possível carregar métricas do RAG:', e)
    }
  }

  // Força re-indexação da Base de Conhecimento
  const handleReindexKnowledge = async () => {
    try {
      setReindexingKnowledge(true)
      const res = await fetchBackend('/api/odisseu/knowledge/reindex', { method: 'POST' })
      if (res && res.ok) {
        const data = await res.json()
        if (data.success) {
          setKnowledgeStats(data)
          setReindexSuccess(true)
          setTimeout(() => setReindexSuccess(false), 3500)
        }
      }
    } catch (e: any) {
      console.error('Erro ao reindexar RAG:', e.message)
    } finally {
      setReindexingKnowledge(false)
    }
  }

  // Salvar e testar chave
  const handleSaveAndTestKey = async () => {
    if (!apiKey.trim()) {
      setKeyStatus('invalid')
      setKeyError('Por favor, informe a chave de API.')
      return
    }

    setKeyStatus('testing')
    setKeyError('')
    localStorage.setItem(`odisseu_key_${provider}`, apiKey.trim())
    localStorage.setItem('odisseu_provider', provider)
    localStorage.setItem(`odisseu_model_${provider}`, model)

    try {
      const res = await fetchBackend('/api/odisseu/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          apiKey: apiKey.trim(),
          model
        })
      })

      const data = await res.json()
      if (data.valid) {
        setKeyStatus('valid')
        if (data.rateLimit) setRateLimit(data.rateLimit)
        doAction(`Conexão com ${data.provider} validada com sucesso!`)
        setTimeout(() => setConfigOpen(false), 900)
      } else {
        setKeyStatus('invalid')
        setKeyError(data.error || 'Chave rejeitada pela API.')
      }
    } catch (e: any) {
      setKeyStatus('invalid')
      setKeyError(`Falha de conexão com backend: ${e.message}`)
    }
  }

  // Enviar mensagem
  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage
    if (!textToSend.trim() || isLoading) return

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMsg])
    if (!customPrompt) setInputMessage('')
    setIsLoading(true)

    try {
      const res = await fetchBackend('/api/odisseu/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          chatHistory: messages
            .filter(m => !m.content.includes('Erro retornado') && !m.content.includes('Rate limit') && !m.content.includes('429'))
            .slice(-4)
            .map(m => ({ role: m.role, content: m.content })),
          provider,
          apiKey: apiKey.trim(),
          model
        })
      })

      const data = await res.json()

      if (data.needsKey) {
        setConfigOpen(true)
        setKeyStatus('invalid')
        setKeyError(data.error)
      }

      if (data.rateLimit) {
        setRateLimit(data.rateLimit)
      }

      const botMsg: Message = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply || data.error || 'Nenhuma resposta retornada.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        toolsExecuted: data.toolsExecuted || [],
        usage: data.usage,
        rateLimit: data.rateLimit
      }

      setMessages(prev => [...prev, botMsg])
      if (data.toolsExecuted?.length > 0) {
        doAction(`Odisseu executou ${data.toolsExecuted.length} ação(ões) na VM`)
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Falha de comunicação:** ${err.message}. Verifique se o serviço na porta 3005 está ativo.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeToast(true)
    setTimeout(() => setCopiedCodeToast(false), 2000)
  }

  const currentProviderConfig = PROVIDERS.find(p => p.id === provider) || PROVIDERS[0]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '620px',
      background: 'radial-gradient(ellipse at 50% 0%, #0d1619 0%, #070a0c 100%)',
      borderRadius: '16px',
      border: '1px solid #1a292d',
      boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
      overflow: 'hidden',
      position: 'relative'
    }}>

      {/* TOAST DE CÓDIGO COPIADO */}
      {copiedCodeToast && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '24px',
          zIndex: 40,
          background: '#102428',
          border: '1px solid #20d6c7',
          color: '#20d6c7',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <CheckCheck size={14} /> Código copiado para a área de transferência!
        </div>
      )}

      {/* 1. CABEÇALHO ELEGANTE COM ESTILO COPILOT */}
      <header style={{
        padding: '14px 22px',
        background: 'rgba(9, 15, 18, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid #162428',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        zIndex: 10
      }}>
        {/* Identidade do Odisseu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            position: 'relative',
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #20d6c7 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#041014',
            boxShadow: '0 0 24px rgba(32, 214, 199, 0.35)',
            flexShrink: 0
          }}>
            <Bot size={22} strokeWidth={2.4} />
            <span style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#10b981',
              border: '2px solid #090f12',
              boxShadow: '0 0 8px #10b981'
            }} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#f0fdfa', margin: 0, letterSpacing: '-0.3px' }}>
                Odisseu AI
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'rgba(32, 214, 199, 0.1)',
                color: '#20d6c7',
                border: '1px solid rgba(32, 214, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Sparkles size={11} /> Copiloto Autônomo
              </span>
            </div>
            <p style={{ fontSize: '11px', color: '#68868a', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#20d6c7', display: 'inline-block' }} />
              VM: <b style={{ color: '#9db4b7' }}>{server?.ip || '137.131.185.243'}</b> • 956 MB RAM • RAG LangChain Ativo
            </p>
          </div>
        </div>

        {/* Indicadores, Cota e Controles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Badge Interativo da Base de Conhecimento RAG LangChain */}
          <button
            onClick={() => setConfigOpen(true)}
            title="Clique para inspecionar e gerenciar a Base de Conhecimento RAG LangChain"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(32, 214, 199, 0.08)',
              border: '1px solid rgba(32, 214, 199, 0.25)',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#20d6c7',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(32, 214, 199, 0.16)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(32, 214, 199, 0.08)')}
          >
            <Database size={12} />
            <span>RAG: <b>{knowledgeStats?.totalDocuments || 9} docs</b> ({knowledgeStats?.totalChunks || 72} chunks)</span>
          </button>

          {/* Cota Groq em Tempo Real */}
          {provider === 'groq' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 12px',
              background: '#091215',
              border: '1px solid #18282c',
              borderRadius: '20px',
              fontSize: '11px',
              color: '#8ba6aa'
            }}>
              <Zap size={13} style={{ color: '#20d6c7' }} />
              <span>Cota Groq:</span>
              <strong style={{ color: '#20d6c7' }}>
                {rateLimit?.remainingTokens ? Number(rateLimit.remainingTokens).toLocaleString('pt-BR') : '7.900'} / 8.000
              </strong>
              <span style={{ color: '#4a656a', fontSize: '10px' }}>
                ({rateLimit?.remainingRequests || '998'} reqs)
              </span>
            </div>
          )}

          {/* Botão Seletor de Modelo / Configuração */}
          <button
            onClick={() => setConfigOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: '#0c1518',
              border: `1px solid ${keyStatus === 'valid' ? '#20d6c755' : '#f59e0b'}`,
              color: '#dbe7e8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#20d6c7')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = keyStatus === 'valid' ? '#20d6c755' : '#f59e0b')}
          >
            <KeyRound size={13} style={{ color: keyStatus === 'valid' ? '#20d6c7' : '#f59e0b' }} />
            <span>{currentProviderConfig.name}: <b>{model.includes('120b') ? 'GPT-120B' : model.includes('27b') ? 'Qwen-27B' : model}</b></span>
            <Settings size={12} style={{ color: '#68868a' }} />
          </button>

          {/* Limpar Conversa */}
          <button
            onClick={() => {
              if (confirm('Deseja reiniciar a sessão do Odisseu AI?')) {
                setMessages([
                  {
                    id: 'msg-welcome-reset',
                    role: 'assistant',
                    content: 'Sessão reiniciada! Como posso ajudar você agora?',
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                  }
                ])
              }
            }}
            title="Limpar histórico"
            style={{
              padding: '7px 9px',
              borderRadius: '8px',
              background: '#0c1518',
              border: '1px solid #18282c',
              color: '#68868a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* 2. ÁREA DE MENSAGENS / CONTEÚDO PRINCIPAL */}
      <div style={{
        flex: 1,
        padding: '24px 32px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>

        {/* HERO INICIAL COM 4 CARDS DE ATALHO DE ALTA FIDELIDADE */}
        {messages.length === 1 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            margin: '8px 0 16px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px'
            }}>
              {[
                {
                  icon: Cpu,
                  color: '#20d6c7',
                  title: 'Diagnóstico de RAM & Swap',
                  desc: 'Verifica se a VM está perto do teto de 956 MB e se a swap está saudável.',
                  prompt: 'Como está a memória RAM física (956 MB), uso de swap e disco NVMe da VM agora?'
                },
                {
                  icon: Container,
                  color: '#f87171',
                  title: 'Auditoria de Containers Docker',
                  desc: 'Inspeciona containers ativos, identifica status unhealthy e analisa logs.',
                  prompt: 'Audite todos os containers Docker em execução na VM e informe se há erros ou falhas.'
                },
                {
                  icon: Zap,
                  color: '#fbbf24',
                  title: 'Deploy Zero-Touch via PM2',
                  desc: 'Clona um repositório Git e inicia a API na primeira porta livre sem estourar a RAM.',
                  prompt: 'Quero subir uma nova API Node do repositório https://github.com/ViniScooper/cardapio_digital.git via PM2 na porta 3004. Como você faz isso?'
                },
                {
                  icon: Globe,
                  color: '#38bdf8',
                  title: 'Configurar Proxy Reverso Nginx',
                  desc: 'Cria o bloco de host no Nginx e aponta subdomínio com terminação SSL.',
                  prompt: 'Gere a configuração do Nginx para apontar o subdomínio delivery.botecosivirino.com.br para a porta 3004.'
                }
              ].map((card, i) => (
                <div
                  key={i}
                  onClick={() => handleSendMessage(card.prompt)}
                  style={{
                    padding: '16px',
                    borderRadius: '14px',
                    background: 'rgba(13, 20, 24, 0.75)',
                    border: '1px solid #162529',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.color
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.background = 'rgba(18, 29, 34, 0.95)'
                    e.currentTarget.style.boxShadow = `0 8px 20px -6px ${card.color}33`
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#162529'
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.background = 'rgba(13, 20, 24, 0.75)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      background: `${card.color}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: card.color,
                      border: `1px solid ${card.color}33`
                    }}>
                      <card.icon size={18} />
                    </div>
                    <strong style={{ fontSize: '13px', color: '#f0fdfa', fontWeight: 700 }}>
                      {card.title}
                    </strong>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#7a969b', margin: 0, lineHeight: '1.5' }}>
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LISTA DE MENSAGENS COM FORMATO COPILOT */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              gap: '14px',
              maxWidth: msg.role === 'user' ? '75%' : '88%',
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: msg.role === 'user' ? '#182428' : 'linear-gradient(135deg, #20d6c7, #0284c7)',
                color: msg.role === 'user' ? '#20d6c7' : '#041014',
                fontWeight: 800,
                fontSize: '12px',
                boxShadow: msg.role === 'user' ? 'none' : '0 0 16px rgba(32, 214, 199, 0.25)',
                border: msg.role === 'user' ? '1px solid #23363b' : 'none'
              }}
            >
              {msg.role === 'user' ? 'VC' : <Bot size={18} />}
            </div>

            {/* Balão de Mensagem */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '100%' }}>
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: msg.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #10252b 0%, #0b1a1f 100%)'
                    : '#0a1215',
                  border: `1px solid ${msg.role === 'user' ? 'rgba(32, 214, 199, 0.35)' : '#152327'}`,
                  color: '#e2edee',
                  boxShadow: msg.role === 'user'
                    ? '0 4px 16px rgba(0,0,0,0.3)'
                    : '0 8px 24px rgba(0,0,0,0.45)',
                  position: 'relative'
                }}
              >
                {/* Renderização de Markdown & Código */}
                <MarkdownContent
                  content={msg.content}
                  onCopyCode={handleCopyCode}
                />

                {/* ACCORDION DE AÇÕES EXECUTADAS NA VM (TOOLS) */}
                {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #16272b'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#20d6c7',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      marginBottom: '10px'
                    }}>
                      <Terminal size={14} /> Ações Executadas na VM ({msg.toolsExecuted.length}):
                    </div>

                    {msg.toolsExecuted.map((t, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#060b0d',
                          borderRadius: '8px',
                          border: '1px solid #142226',
                          marginBottom: '8px',
                          overflow: 'hidden'
                        }}
                      >
                        <div
                          onClick={() => setExpandedToolIdx(expandedToolIdx === idx ? null : idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: '#091316',
                            cursor: 'pointer',
                            fontSize: '11px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#fbbf24', fontFamily: 'monospace', fontWeight: 700 }}>
                              ⚡ {t.tool}()
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#10b981', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} /> Sucesso
                            </span>
                            <ChevronDown
                              size={13}
                              style={{
                                color: '#68868a',
                                transform: expandedToolIdx === idx ? 'rotate(180deg)' : 'none',
                                transition: 'transform 0.2s'
                              }}
                            />
                          </div>
                        </div>

                        {/* Detalhes expandidos */}
                        {expandedToolIdx === idx && (
                          <div style={{ padding: '10px 12px', borderTop: '1px solid #142226' }}>
                            {t.arguments && Object.keys(t.arguments).length > 0 && (
                              <div style={{ color: '#68868a', fontSize: '10px', marginBottom: '6px', fontFamily: 'monospace' }}>
                                <b>Parâmetros:</b> {JSON.stringify(t.arguments)}
                              </div>
                            )}
                            <pre style={{
                              margin: 0,
                              color: '#20d6c7',
                              background: '#040708',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              fontSize: '10.5px',
                              maxHeight: '140px',
                              overflowY: 'auto',
                              fontFamily: 'Consolas, monospace'
                            }}>
                              {typeof t.result === 'string' ? t.result : JSON.stringify(t.result, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Métricas de Tokens e Timestamp no rodapé */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'space-between',
                gap: '12px',
                fontSize: '10.5px',
                color: '#526c71',
                padding: '0 4px'
              }}>
                {msg.role === 'assistant' && msg.usage && (
                  <span style={{ color: '#20d6c7', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Zap size={11} />
                    <b>{msg.usage.totalTokens} tokens</b>
                    <span style={{ color: '#445b60' }}>•</span>
                    <span>{msg.usage.promptTokens} in / {msg.usage.completionTokens} out</span>
                    {msg.usage.speedTps ? (
                      <>
                        <span style={{ color: '#445b60' }}>•</span>
                        <span>{msg.usage.speedTps} tps</span>
                      </>
                    ) : null}
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{msg.timestamp}</span>
                  <button
                    onClick={() => handleCopyCode(msg.content)}
                    title="Copiar texto"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#526c71',
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#20d6c7')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#526c71')}
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Indicador de Carregamento Fluido */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '14px', alignSelf: 'flex-start' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #20d6c7, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#041014'
            }}>
              <Bot size={18} />
            </div>
            <div style={{
              padding: '14px 20px',
              borderRadius: '4px 16px 16px 16px',
              background: '#0a1215',
              border: '1px solid #18282c',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#20d6c7',
              fontSize: '12.5px'
            }}>
              <RefreshCw size={14} className="spinning" />
              <span>Odisseu está consultando a VM e processando via <b>{currentProviderConfig.name}</b>...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. BARRA DE SUGESTÕES COMPACTAS (CHIPS RÁPIDOS) */}
      {messages.length > 1 && (
        <div style={{
          padding: '8px 24px',
          background: 'rgba(7, 12, 14, 0.8)',
          borderTop: '1px solid #142226',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}>
          {[
            { label: '📊 Checar RAM e Swap', prompt: 'Como está a memória RAM e uso de swap da VM agora?' },
            { label: '🐳 Listar Containers', prompt: 'Liste os containers ativos e mostre o status de saúde.' },
            { label: '🔒 Mapa de Portas', prompt: 'Quais portas estão abertas e escutando conexões na VM?' },
            { label: '⚙️ PM2 Status', prompt: 'Quais serviços estão rodando no PM2 da máquina?' }
          ].map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip.prompt)}
              style={{
                background: '#0b1316',
                border: '1px solid #1a2a2f',
                borderRadius: '16px',
                padding: '5px 12px',
                fontSize: '11px',
                color: '#9db4b7',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#20d6c7'
                e.currentTarget.style.color = '#f0fdfa'
                e.currentTarget.style.background = '#101d22'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#1a2a2f'
                e.currentTarget.style.color = '#9db4b7'
                e.currentTarget.style.background = '#0b1316'
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      {/* 4. BARRA DE INPUT ELEVADA ESTILO COPILOT / PERPLEXITY */}
      <footer style={{
        padding: '14px 24px 18px',
        background: '#070b0d',
        borderTop: '1px solid #142226',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          background: '#0b1316',
          border: '1px solid #1c2e33',
          borderRadius: '14px',
          padding: '10px 14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          transition: 'border-color 0.2s',
          position: 'relative'
        }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = 'rgba(32, 214, 199, 0.5)')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#1c2e33')}
        >
          <textarea
            ref={textareaRef}
            rows={2}
            placeholder={keyStatus === 'valid' ? 'Pergunte sobre seus servidores, containers ou peça para executar uma tarefa na VM...' : 'Configure sua chave de IA no topo para liberar o Odisseu...'}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#f0fdfa',
              fontSize: '13.5px',
              outline: 'none',
              resize: 'none',
              maxHeight: '140px',
              fontFamily: 'inherit',
              lineHeight: '1.5'
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '6px',
            borderTop: '1px solid #122125'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#526c71' }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: keyStatus === 'valid' ? '#20d6c7' : '#f59e0b'
              }} />
              <span>Modelo: <b>{model.includes('120b') ? 'GPT-120B' : model.includes('27b') ? 'Qwen-27B' : model}</b></span>
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: inputMessage.trim() && !isLoading ? 'linear-gradient(135deg, #20d6c7, #0284c7)' : '#101a1e',
                border: 'none',
                color: inputMessage.trim() && !isLoading ? '#041014' : '#455b5f',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: inputMessage.trim() && !isLoading ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                boxShadow: inputMessage.trim() && !isLoading ? '0 0 16px rgba(32, 214, 199, 0.4)' : 'none'
              }}
            >
              {isLoading ? <RefreshCw size={14} className="spinning" /> : <Send size={14} />}
              <span>Enviar</span>
            </button>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#496367',
          padding: '0 4px'
        }}>
          <span>Pressione <b>Enter</b> para enviar • <b>Shift + Enter</b> para nova linha</span>
          <span>Sessão segura com a VM 137.131.185.243 (Zero Trust SSH)</span>
        </div>
      </footer>

      {/* 5. MODAL DE CONFIGURAÇÃO DE IA ELEGANTE E MODERNO */}
      {configOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          display: 'grid',
          placeItems: 'center',
          background: 'rgba(3, 6, 8, 0.85)',
          backdropFilter: 'blur(10px)',
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            background: '#0d1619',
            border: '1px solid #1f3238',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            {/* Topo do Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(32, 214, 199, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#20d6c7'
                }}>
                  <KeyRound size={17} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', color: '#f0fdfa', fontWeight: 700 }}>
                    Configurar Motor de IA do Odisseu
                  </h3>
                  <small style={{ color: '#68868a', fontSize: '11px' }}>
                    Escolha o provedor e informe a chave para alimentar o agente
                  </small>
                </div>
              </div>

              <button
                onClick={() => setConfigOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#68868a',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas dos Provedores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '10px',
                    background: provider === p.id ? 'rgba(32, 214, 199, 0.12)' : '#080e10',
                    border: `1px solid ${provider === p.id ? '#20d6c7' : '#162529'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                  }}
                >
                  <strong style={{ fontSize: '12px', color: provider === p.id ? '#20d6c7' : '#d2e3e5' }}>
                    {p.name}
                  </strong>
                  <span style={{ fontSize: '9.5px', color: '#68868a' }}>
                    {p.id === 'groq' ? 'Grátis & Rápido' : p.id === 'gemini' ? 'Google AI' : 'OpenAI'}
                  </span>
                </button>
              ))}
            </div>

            {/* Seleção do Modelo */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: '#88a6aa', marginBottom: '6px', fontWeight: 600 }}>
                Modelo ({currentProviderConfig.name}):
              </label>
              <select
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: '#080e10',
                  border: '1px solid #1b2d32',
                  color: '#f0fdfa',
                  fontSize: '12px',
                  outline: 'none'
                }}
              >
                {currentProviderConfig.models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* Input da Chave de API */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: '#88a6aa', fontWeight: 600 }}>
                  Chave de API ({currentProviderConfig.name}):
                </label>
                <a
                  href={currentProviderConfig.keyUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '11px', color: '#20d6c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Gerar chave gratuita <ExternalLink size={11} />
                </a>
              </div>

              <div style={{ position: 'relative' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder={currentProviderConfig.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value)
                    setKeyStatus('idle')
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 42px 10px 12px',
                    borderRadius: '8px',
                    background: '#080e10',
                    border: '1px solid #1b2d32',
                    color: '#20d6c7',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#68868a',
                    cursor: 'pointer'
                  }}
                >
                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {keyError && (
              <div style={{ fontSize: '11.5px', color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {keyError}
              </div>
            )}

            {/* SEÇÃO DA BASE DE CONHECIMENTO RAG LANGCHAIN */}
            <div style={{
              background: '#070d0f',
              border: '1px solid #1a2a2e',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Database size={15} style={{ color: '#20d6c7' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#f0fdfa' }}>
                    Base de Conhecimento RAG LangChain
                  </span>
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(32, 214, 199, 0.15)',
                    color: '#20d6c7',
                    fontWeight: 600
                  }}>
                    {knowledgeStats?.totalDocuments || 9} docs • {knowledgeStats?.totalChunks || 72} chunks
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleReindexKnowledge}
                  disabled={reindexingKnowledge}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    background: reindexSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(32, 214, 199, 0.1)',
                    border: reindexSuccess ? '1px solid #10b981' : '1px solid rgba(32, 214, 199, 0.3)',
                    color: reindexSuccess ? '#10b981' : '#20d6c7',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: reindexingKnowledge ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {reindexingKnowledge ? (
                    <>
                      <RefreshCw size={11} className="spinning" /> Atualizando...
                    </>
                  ) : reindexSuccess ? (
                    <>
                      <CheckCircle2 size={11} /> Base Atualizada!
                    </>
                  ) : (
                    <>
                      <RefreshCw size={11} /> Recarregar Base RAG
                    </>
                  )}
                </button>
              </div>

              <div style={{ fontSize: '11px', color: '#68868a', lineHeight: '1.4' }}>
                O Odisseu consulta dinamicamente esta base técnica antes de responder, evitando alucinações sobre portas, RAM (956MB), deploys, migrações e túneis.
              </div>

              {/* Lista dos documentos carregados */}
              <div style={{
                maxHeight: '90px',
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                padding: '6px',
                background: '#040708',
                borderRadius: '6px',
                border: '1px solid #101d20'
              }}>
                {knowledgeStats?.documents?.map((doc: any, i: number) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#0e181b',
                      color: '#88a6aa',
                      border: '1px solid #1a2a2e'
                    }}
                  >
                    📄 {doc.file}
                  </span>
                ))}
              </div>
            </div>

            {/* Botões do Rodapé do Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={() => setConfigOpen(false)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid #1a2c31',
                  color: '#9db4b7',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Fechar
              </button>

              <button
                onClick={handleSaveAndTestKey}
                disabled={keyStatus === 'testing'}
                style={{
                  padding: '9px 20px',
                  borderRadius: '8px',
                  background: keyStatus === 'valid' ? '#20d6c7' : 'linear-gradient(135deg, #0284c7, #0369a1)',
                  border: 'none',
                  color: '#041014',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 16px rgba(32, 214, 199, 0.3)'
                }}
              >
                {keyStatus === 'testing' ? (
                  <>
                    <RefreshCw size={13} className="spinning" /> Testando Conexão...
                  </>
                ) : keyStatus === 'valid' ? (
                  <>
                    <CheckCircle2 size={15} /> Salvo & Ativo
                  </>
                ) : (
                  'Salvar e Validar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
