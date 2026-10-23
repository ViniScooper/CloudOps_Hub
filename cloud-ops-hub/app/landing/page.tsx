'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ShieldCheck, Star, ExternalLink, Server, Database, 
  Cpu, Lock, Zap, ArrowRight, CheckCircle2, Terminal, 
  Layers, Globe, Check, Eye, AlertTriangle, Sparkles,
  Container, Network, KeyRound, Shield, ArrowLeftRight, HardDrive, RefreshCw,
  HelpCircle, FileCheck, Layers3, TerminalSquare, GitBranch, ShieldAlert, ChevronRight, UserCheck,
  Share2, MessageCircle, Copy, Search, Tag, Sliders,
  Newspaper
} from 'lucide-react'

const LinkedinIcon = ({ size = 16, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)

const printsData = [
  {
    id: '01',
    title: 'Dashboard Central de Telemetria SRE',
    subtitle: 'Observabilidade em tempo real de CPU, RAM NVMe, Swap e tráfego de rede das instâncias OCI.',
    image: '/prints/01_dashboard_principal.png',
    badge: 'Telemetria & Métricas',
    highlights: ['Uso de RAM e Swap em tempo real', 'Saúde dos nós de computação', 'Semáforo de incidentes SRE']
  },
  {
    id: '02',
    title: 'Gestão de Contêineres Docker & Microsserviços',
    subtitle: 'Controle de ciclo de vida (Start, Stop, Restart) e métricas de consumo por contêiner.',
    image: '/prints/06_docker_containers.png',
    badge: 'Docker Engine',
    highlights: ['Inspeção de portas ativas', 'Consumo de memória por aplicação', 'Ações rápidas sem SSH']
  },
  {
    id: '03',
    title: 'Bancos de Dados Oracle 23ai & MySQL 8.0',
    subtitle: 'Painel DBA integrado para monitoramento de instâncias relacionais e autônomas sem expor portas.',
    image: '/prints/04_mysql_docker_connection.png',
    badge: 'DBA & Banco de Dados',
    highlights: ['Conexão segura via túnel interno', 'Rotinas de backup e restauração', 'Zero exposição à internet']
  },
  {
    id: '04',
    title: 'Watchdog Autônomo & Cron Jobs Anti-Sleep',
    subtitle: 'Robôs em segundo plano que monitoram serviços 24/7 e impedem suspensão de instâncias Always Free.',
    image: '/prints/03_cron_jobs_antisleep.png',
    badge: 'Automação & Auto-Cura',
    highlights: ['Keep-alive inteligente de APIs', 'Monitoramento contínuo de integridade', 'Histórico de execuções']
  },
  {
    id: '05',
    title: 'Integração Vercel Edge Global CDN',
    subtitle: 'Acompanhamento de deploys na borda da Vercel com segurança de cabeçalhos Grade A+.',
    image: '/prints/05_vercel_frontend_edge.png',
    badge: 'Edge Computing',
    highlights: ['Deploys atômicos ultrarrápidos', 'Proteção DDoS e TLS 1.3 nativos', 'Conexão direta com backend OCI']
  },
  {
    id: '06',
    title: 'Orquestração de Deploys Multi-Cloud & Render',
    subtitle: 'Gestão visual de pipelines de entrega contínua para múltiplos provedores de nuvem.',
    image: '/prints/02_render_backend_deploys.png',
    badge: 'Multi-Cloud CI/CD',
    highlights: ['Deploy e rollback com 1 clique', 'Logs de build centralizados', 'Status de saúde de endpoints']
  },
  {
    id: '07',
    title: 'Odisseu Copilot IA — Inteligência para DevOps',
    subtitle: 'Agente inteligente integrado para diagnóstico de problemas, geração de comandos e automações.',
    image: '/prints/07_odisseu_copilot_ia.png',
    badge: 'Inteligência Artificial',
    highlights: ['Análise de incidentes em linguagem natural', 'Recomendações de arquitetura cloud', 'Comandos auditados']
  }
]

export default function LandingPage() {
  const [activePrint, setActivePrint] = useState(printsData[0])
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedShare, setCopiedShare] = useState(false)
  const [terminalMode, setTerminalMode] = useState<'magic' | 'pain'>('magic')

  const handleCopy = () => {
    navigator.clipboard.writeText('https://github.com/ViniScooper/CloudOps_Hub')
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handleCopyShare = () => {
    navigator.clipboard.writeText('https://cloudops-hub-dun.vercel.app/landing')
    setCopiedShare(true)
    setTimeout(() => setCopiedShare(false), 2500)
  }

  return (
    <div className="min-h-screen bg-[#070b0e] text-[#d4e1e3] selection:bg-[#20d6c7] selection:text-black font-sans">
      
      {/* 🧭 Topbar / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070b0e]/80 border-b border-[#1b2b30]/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-[#0f4044] to-[#20d6c7] flex items-center justify-center text-black font-black text-lg shadow-[0_0_15px_rgba(32,214,199,0.3)]">
              ⚡
            </div>
            <div>
              <span className="font-bold text-white tracking-wider text-base">CloudOps<span className="text-[#20d6c7]">Hub</span></span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono bg-[#142629] text-[#20d6c7] px-2 py-0.5 rounded-full border border-[#20d6c7]/30">
                v2.1.0 • Grade A+
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-[#8ba2a7]">
            <a href="#recursos" className="hover:text-white transition-colors">Recursos</a>
            <a href="#prints" className="hover:text-white transition-colors">Showcase & Prints</a>
            <a href="#arquitetura" className="hover:text-white transition-colors">Zero Trust</a>
            <a href="#comousar" className="hover:text-white transition-colors">Como Usar</a>
            <a href="#seguranca" className="hover:text-white transition-colors">Segurança</a>
            <a 
              href="https://www.tabnews.com.br/viniScooper/cansei-de-abrir-10-paineis-oracle-aws-hostinger-vercel-criei-um-hub-multi-cloud-com-ia-para-controlar-tudo-em-1-lugar" 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-center gap-1.5 text-xs text-[#20d6c7] bg-[#102225] hover:bg-[#142d31] px-2.5 py-1 rounded-md border border-[#20d6c7]/30 transition-all font-medium"
            >
              <Newspaper size={12} />
              <span>TabNews</span>
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href="https://www.linkedin.com/in/jose-vinicius-louren%C3%A7o-1a6b9014a/"
              target="_blank"
              rel="noreferrer"
              title="LinkedIn de José Vinícius Lourenço"
              className="p-2 rounded-lg bg-[#101b1e] hover:bg-[#16272c] border border-[#264147] text-[#0077b5] hover:text-white transition-all shadow-sm"
            >
              <LinkedinIcon size={15} />
            </a>

            <a
              href="https://github.com/ViniScooper/CloudOps_Hub"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#101b1e] hover:bg-[#16272c] border border-[#264147] hover:border-[#20d6c7]/60 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all shadow-sm group"
            >
              <Star size={14} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Star no GitHub</span>
            </a>

            <Link
              href="/"
              className="bg-[#20d6c7] hover:bg-[#1ec3b5] text-black text-xs font-bold px-3.5 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(32,214,199,0.25)] flex items-center gap-1.5"
            >
              <span>Acessar Painel</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* 🚀 Hero Section */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-[#152327]">
        {/* Glow de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#20d6c7]/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 text-center relative z-10">
          
          {/* Badge Superior */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#102225] border border-[#20d6c7]/40 text-[#20d6c7] text-xs font-mono mb-6 shadow-[0_0_20px_rgba(32,214,199,0.15)]">
            <Sparkles size={13} />
            <span>Versão 2.1.0 Lançada com Auditoria Snyk & SecurityHeaders Grade A+</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mx-auto">
            A Nuvem sob o seu <span className="bg-gradient-to-r from-white via-[#74ece2] to-[#20d6c7] bg-clip-text text-transparent">Comando Absoluto.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#88a3a8] max-w-2xl mx-auto leading-relaxed">
            Painel unificado de observabilidade SRE, gestão de contêineres Docker e bancos de dados <strong className="text-white">Oracle 23ai & MySQL</strong> na <strong className="text-white">Oracle Cloud (OCI)</strong> — 100% blindado por <strong className="text-[#20d6c7]">Cloudflare Zero Trust</strong> e <strong className="text-white">Vercel Edge</strong>.
          </p>

          {/* Botões de Ação Hero */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/ViniScooper/CloudOps_Hub"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-gradient-to-r from-[#179c91] to-[#20d6c7] hover:brightness-110 text-black font-extrabold text-sm px-6 py-3.5 rounded-xl shadow-[0_0_25px_rgba(32,214,199,0.35)] transition-all transform hover:-translate-y-0.5"
            >
              <Star size={16} className="fill-black" />
              <span>Deixar Estrela no GitHub (Star)</span>
            </a>

            <Link
              href="/"
              className="flex items-center gap-2 bg-[#0e191c] hover:bg-[#16272c] border border-[#27444c] hover:border-[#20d6c7]/50 text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all"
            >
              <Zap size={16} className="text-[#20d6c7]" />
              <span>Testar Painel ao Vivo</span>
            </Link>
          </div>

          {/* 📰 Destaque TabNews */}
          <div className="mt-10 max-w-3xl mx-auto bg-gradient-to-r from-[#0a181b] via-[#0e2428] to-[#0a181b] border border-[#20d6c7]/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(32,214,199,0.15)] text-left hover:border-[#20d6c7] transition-all group">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-[#14353a] text-[#20d6c7] flex items-center justify-center font-bold text-xl flex-shrink-0 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
                📰
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase bg-[#184449] text-[#20d6c7] px-2 py-0.5 rounded-full font-bold border border-[#20d6c7]/30">Publicação no TabNews</span>
                  <span className="text-[11px] text-[#729297]">Artigo por @viniScooper</span>
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                  &quot;Cansei de abrir 10 painéis (Oracle, AWS, Hostinger, Vercel)... Criei um Hub Multi-Cloud com IA para controlar tudo em 1 lugar!&quot;
                </h3>
              </div>
            </div>
            <a
              href="https://www.tabnews.com.br/viniScooper/cansei-de-abrir-10-paineis-oracle-aws-hostinger-vercel-criei-um-hub-multi-cloud-com-ia-para-controlar-tudo-em-1-lugar"
              target="_blank"
              rel="noreferrer"
              className="flex-shrink-0 flex items-center gap-2 bg-[#20d6c7] hover:bg-[#1ec3b5] text-black font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(32,214,199,0.25)] whitespace-nowrap"
            >
              <span>Ler Artigo Completo</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Badges Oficiais de Segurança e Reconhecimento */}
          <div className="mt-12 pt-8 border-t border-[#142327] flex flex-wrap items-center justify-center gap-3">
            <a href="https://github.com/ViniScooper/CloudOps_Hub" target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
              <img src="https://img.shields.io/github/stars/ViniScooper/CloudOps_Hub?style=for-the-badge&logo=github&color=gold" alt="GitHub Stars" className="h-7" />
            </a>
            <a href="https://snyk.io/test/github/ViniScooper/CloudOps_Hub" target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
              <img src="https://snyk.io/test/github/ViniScooper/CloudOps_Hub/badge.svg" alt="Snyk Security" className="h-7" />
            </a>
            <a href="https://securityheaders.com/?q=https%3A%2F%2Fcloudops-hub-dun.vercel.app%2F&followRedirects=on" target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
              <img src="https://img.shields.io/badge/Security_Headers-Grade_A+-brightgreen?style=for-the-badge&logo=securityscorecard" alt="Security Headers Grade A+" className="h-7" />
            </a>
            <a href="https://www.ssllabs.com/ssltest/analyze.html?d=cloudops-hub-dun.vercel.app" target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
              <img src="https://img.shields.io/badge/Qualys_SSL_Labs-Grade_A+-blue?style=for-the-badge&logo=qualys" alt="Qualys SSL Grade A+" className="h-7" />
            </a>
            <a href="https://owasp.org" target="_blank" rel="noreferrer" className="hover:opacity-85 transition-opacity">
              <img src="https://img.shields.io/badge/OWASP-Top_10_Compliant-00599C?style=for-the-badge&logo=owasp" alt="OWASP Top 10" className="h-7" />
            </a>
          </div>

        </div>
      </section>

      {/* 📸 Galeria de Prints e Showcase */}
      <section id="prints" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Showcase Oficial em Produção
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Conheça o Sistema por Dentro
          </h2>
          <p className="text-[#839ea2] mt-3 text-sm sm:text-base">
            Capturas de tela reais da plataforma operando em produção nas instâncias da Oracle Cloud. Clique em cada módulo para inspecionar os detalhes técnicos.
          </p>
        </div>

        {/* Seletor de Telas */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {printsData.map((item) => {
            const isActive = activePrint.id === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePrint(item)}
                className={`text-xs font-medium px-4 py-2 rounded-lg transition-all border ${
                  isActive
                    ? 'bg-[#143236] border-[#20d6c7] text-[#20d6c7] shadow-[0_0_15px_rgba(32,214,199,0.2)] font-bold'
                    : 'bg-[#0c1619] border-[#1d3237] text-[#7d999d] hover:text-white hover:border-[#2d4d54]'
                }`}
              >
                {item.title.split('—')[0]}
              </button>
            )
          })}
        </div>

        {/* Display do Print Ativo */}
        <div className="bg-[#0b1316] border border-[#1c3338] rounded-2xl p-4 sm:p-6 shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#182c30]">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase bg-[#14292d] text-[#20d6c7] px-2 py-0.5 rounded border border-[#20d6c7]/40 font-bold">
                  {activePrint.badge}
                </span>
                <span className="text-xs text-[#5f7d82]">Módulo {activePrint.id} de 07</span>
              </div>
              <h3 className="text-xl font-bold text-white">{activePrint.title}</h3>
              <p className="text-xs sm:text-sm text-[#88a4a9] mt-0.5">{activePrint.subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              {activePrint.highlights.map((h, i) => (
                <span key={i} className="flex items-center gap-1.5 bg-[#0e1b1e] border border-[#1f373d] text-[#b0cbcf] px-2.5 py-1 rounded-md">
                  <Check size={11} className="text-[#20d6c7]" />
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Imagem do Print */}
          <div className="relative rounded-xl overflow-hidden border border-[#213b42] bg-[#05090b] shadow-inner group">
            <div className="aspect-[16/10] relative w-full">
              <Image
                src={activePrint.image}
                alt={activePrint.title}
                fill
                className="object-contain"
                sizes="(max-width: 1200px) 100vw, 1200px"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* 🛡️ Por que o CloudOps Hub é Indispensável? */}
      <section id="recursos" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Diferencial Competitivo
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Por Que Esta Aplicação é Essencial?
          </h2>
          <p className="text-[#839ea2] mt-3 text-sm sm:text-base">
            Administrar servidores em nuvem sem observabilidade centralizada gera custos altos, incidentes silenciosos e falhas de segurança graves.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card O Jeito Tradicional (Ruim) */}
          <div className="bg-[#120f11] border border-red-900/30 rounded-2xl p-6 sm:p-8 relative">
            <div className="flex items-center gap-2.5 text-red-400 font-bold mb-4 text-base">
              <AlertTriangle size={18} />
              <span>O Jeito Tradicional (Caixa-Preta)</span>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-[#9e8b8e]">
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Portas de banco (1521, 3306) expostas à internet sofrendo ataques de força bruta 24/7.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Instâncias travam silenciosamente por falta de RAM ou Swap sem nenhum alerta prévio.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Necessidade de abrir terminal SSH preto no celular toda vez que um contêiner Docker cai.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-500 font-bold">✕</span>
                <span>Backups salvos no mesmo disco da VM — se o servidor queimar, perde-se tudo.</span>
              </li>
            </ul>
          </div>

          {/* Card CloudOps Hub (A Solução) */}
          <div className="bg-[#0b1719] border border-[#20d6c7]/50 rounded-2xl p-6 sm:p-8 relative shadow-[0_0_30px_rgba(32,214,199,0.1)]">
            <div className="flex items-center gap-2.5 text-[#20d6c7] font-bold mb-4 text-base">
              <ShieldCheck size={18} />
              <span>Com o CloudOps Hub (Zero Trust & SRE)</span>
            </div>
            <ul className="space-y-3.5 text-xs sm:text-sm text-[#a3c3c7]">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#20d6c7] mt-0.5" />
                <span><strong className="text-white">Zero Exposição:</strong> Portas fechadas. Acesso 100% via túneis criptografados Cloudflare.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#20d6c7] mt-0.5" />
                <span><strong className="text-white">Watchdog 24/7:</strong> Robôs anti-sleep e auto-recuperação de serviços Always Free.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#20d6c7] mt-0.5" />
                <span><strong className="text-white">Gestão Visual em 1 Clique:</strong> Start, stop, logs e métricas de contêineres direto do celular ou PC.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#20d6c7] mt-0.5" />
                <span><strong className="text-white">Recuperação PITR:</strong> Estrutura auditável com RMAN para voltar dados no segundo exato.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ⚡ Superpoderes do CloudOps Hub (Recursos em 1 Clique) */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Produtividade & Automação SRE
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Operações Complexas de Nuvem em 1 Clique
          </h2>
          <p className="text-[#839ea2] mt-3 text-sm sm:text-base">
            Elimine scripts manuais no terminal. Tudo o que você precisa para gerenciar contêineres, balanceamento de carga, túneis e cofres de senhas com simplicidade visual.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Criar Containers com 1 Botão */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <Container size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🐳 Criar Contêineres com 1 Botão</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Esqueça comandos gigantes como <code className="text-[#20d6c7] bg-[#070b0e] px-1.5 py-0.5 rounded text-[11px]">docker run -d -p 3000:3000</code>. Basta selecionar a imagem, definir a porta e disparar. O contêiner sobe instantaneamente com telemetria e logs ao vivo.
            </p>
            <div className="text-[11px] font-mono text-[#a3c3c7] bg-[#070e10] p-2.5 rounded-lg border border-[#172b30] flex items-center gap-2">
              <Check size={12} className="text-[#20d6c7]" />
              <span>Start, Stop, Restart & Logs direto na tela</span>
            </div>
          </div>

          {/* 2. Load Balancer Nginx */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <Network size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">⚖️ Load Balancer Nginx em Segundos</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Crie balanceamento de carga e proxy reverso sem encostar em arquivos confusos de <code className="text-[#20d6c7] bg-[#070b0e] px-1.5 py-0.5 rounded text-[11px]">nginx.conf</code>. Distribua o tráfego entre nós e microsserviços com SSL automático e reinício transparente.
            </p>
            <div className="text-[11px] font-mono text-[#a3c3c7] bg-[#070e10] p-2.5 rounded-lg border border-[#172b30] flex items-center gap-2">
              <Check size={12} className="text-[#20d6c7]" />
              <span>Roteamento de subdomínios & Upstream dinâmico</span>
            </div>
          </div>

          {/* 3. Cofre Oracle & .ENV */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <KeyRound size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🔐 Cofre OCI Vault & Variáveis .ENV</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Gere senhas criptografadas e armazene segredos no <strong>Cofre da Oracle Cloud (OCI Key Vault)</strong> com criptografia <strong>AES-256-GCM</strong>. As variáveis são injetadas em memória na inicialização — <strong>zero senhas em arquivos .txt ou no Git</strong>.
            </p>
            <div className="text-[11px] font-mono text-[#a3c3c7] bg-[#070e10] p-2.5 rounded-lg border border-[#172b30] flex items-center gap-2">
              <Check size={12} className="text-[#20d6c7]" />
              <span>Conforme SOC 2 CC6.1 & ISO 27001</span>
            </div>
          </div>

          {/* 4. Cloudflare Zero Trust 1 Clique */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">⚡ Cloudflare Zero Trust com 1 Clique</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Publique suas APIs e sistemas para a internet sem abrir <strong>nenhuma porta no firewall da nuvem</strong>. O túnel criptografado oculta seu IP público real, oferece proteção DDoS massiva e conexão TLS 1.3 de alta performance.
            </p>
            <div className="text-[11px] font-mono text-[#a3c3c7] bg-[#070e10] p-2.5 rounded-lg border border-[#172b30] flex items-center gap-2">
              <Check size={12} className="text-[#20d6c7]" />
              <span>Zero portas expostas (porta 80/443 fechadas)</span>
            </div>
          </div>

          {/* 5. Migração de Bancos */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <ArrowLeftRight size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🔄 Migração de Bancos sem Fricção</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Mova schemas e dados com facilidade entre instâncias locais, <strong>MySQL 8.0</strong>, <strong>Oracle Database 23ai</strong> e <strong>Oracle Autonomous Database (ATP Serverless)</strong>. Rotinas integradas de exportação, importação e validação de consistência.
            </p>
            <div className="text-[11px] font-mono text-[#a3c3c7] bg-[#070e10] p-2.5 rounded-lg border border-[#172b30] flex items-center gap-2">
              <Check size={12} className="text-[#20d6c7]" />
              <span>Export/Import seguro sem parada de serviço</span>
            </div>
          </div>

          {/* 6. Buckets & Object Storage */}
          <div className="bg-[#0b1316] border border-[#1b3137] hover:border-[#20d6c7]/50 rounded-2xl p-6 transition-all hover:shadow-[0_0_25px_rgba(32,214,199,0.15)] group">
            <div className="w-12 h-12 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-5 border border-[#20d6c7]/40 group-hover:scale-105 transition-transform">
              <HardDrive size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">🪣 Buckets OCI & Por Que Usá-los?</h3>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed mb-4">
              Crie buckets no <strong>Oracle Object Storage</strong> em 1 clique para fotos e mídias. <br />
              <strong className="text-white">Por que NUNCA guardar fotos na VM?</strong>
            </p>
            <ul className="space-y-1.5 text-xs text-[#a1c1c5] mb-2">
              <li className="flex items-center gap-1.5">
                <Check size={11} className="text-[#20d6c7]" />
                <span><strong>Não estoura o disco:</strong> A VM tem apenas 45GB. O Bucket tem espaço infinito.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={11} className="text-[#20d6c7]" />
                <span><strong>Economiza RAM/CPU:</strong> O servidor não processa uploads pesados.</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={11} className="text-[#20d6c7]" />
                <span><strong>CDN Global:</strong> Imagens entregues em milissegundos via borda.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 🚀 Passo a Passo de Como Usar */}
      <section id="comousar" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Guia Rápido de Uso
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Como Operar o Hub em 3 Passos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0b1316] border border-[#1b3137] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-lg bg-[#142e33] text-[#20d6c7] font-mono font-bold flex items-center justify-center mb-4 text-base border border-[#20d6c7]/40">
              01
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Conecte seus Nós OCI</h4>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed">
              O Hub reconhece automaticamente instâncias Ubuntu na Oracle Cloud via Cloudflare Tunnel sem abrir a porta 22 para a internet.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1b3137] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-lg bg-[#142e33] text-[#20d6c7] font-mono font-bold flex items-center justify-center mb-4 text-base border border-[#20d6c7]/40">
              02
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Monitore Docker & Bancos</h4>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed">
              Acesse telemetria de CPU, memória, inspecione contêineres Docker e consulte bancos Oracle Database e MySQL com 1 toque.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1b3137] rounded-xl p-6 relative">
            <div className="w-10 h-10 rounded-lg bg-[#142e33] text-[#20d6c7] font-mono font-bold flex items-center justify-center mb-4 text-base border border-[#20d6c7]/40">
              03
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Automatize com Robôs</h4>
            <p className="text-xs sm:text-sm text-[#7f9c9f] leading-relaxed">
              Deixe os agentes de auto-cura e cron jobs mantendo suas instâncias aquecidas e receba diagnósticos do Copilot Odisseu.
            </p>
          </div>
        </div>
      </section>

      {/* 🛡️ Matriz de Conformidade e Segurança (SOC 2, ISO 27001, OWASP) */}
      <section id="seguranca" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Conformidade & Blindagem Criptográfica
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Auditoria & Governança de Nível Bancário
          </h2>
          <p className="text-[#839ea2] mt-3 text-sm sm:text-base">
            O CloudOps Hub foi construído seguindo rigorosamente os controles auditáveis exigidos por grandes corporações internacionais.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#0b1316] border border-[#1d3339] rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-4 border border-[#20d6c7]/40">
              <FileCheck size={20} />
            </div>
            <span className="text-[11px] font-mono text-[#20d6c7] uppercase font-bold tracking-wider">SOC 2 Type II</span>
            <h4 className="text-base font-bold text-white mt-1 mb-2">Trust Services Criteria (CC6.1)</h4>
            <p className="text-xs text-[#819e9f] leading-relaxed">
              Cofre de chaves AES-256-GCM isolado com rotação periódica e segregação estrita de privilégios. Zero senhas hardcoded em disco ou git.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1d3339] rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-4 border border-[#20d6c7]/40">
              <Lock size={20} />
            </div>
            <span className="text-[11px] font-mono text-[#20d6c7] uppercase font-bold tracking-wider">ISO/IEC 27001 & 27017</span>
            <h4 className="text-base font-bold text-white mt-1 mb-2">Segurança em Nuvem & Dados</h4>
            <p className="text-xs text-[#819e9f] leading-relaxed">
              Criptografia TLS 1.3 ponta a ponta na borda e comunicação interna estritamente privada em rede isolada na Oracle Cloud.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1d3339] rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-4 border border-[#20d6c7]/40">
              <ShieldAlert size={20} />
            </div>
            <span className="text-[11px] font-mono text-[#20d6c7] uppercase font-bold tracking-wider">OWASP Top 10</span>
            <h4 className="text-base font-bold text-white mt-1 mb-2">Defesa Contra Ataques Web</h4>
            <p className="text-xs text-[#819e9f] leading-relaxed">
              Blindagem ativa contra injeção SQL, Cross-Site Scripting (XSS via CSP), clickjacking e ataques de enumeração via Rate-Limit.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1d3339] rounded-2xl p-6 relative">
            <div className="w-10 h-10 rounded-xl bg-[#142e33] text-[#20d6c7] flex items-center justify-center mb-4 border border-[#20d6c7]/40">
              <Database size={20} />
            </div>
            <span className="text-[11px] font-mono text-[#20d6c7] uppercase font-bold tracking-wider">DR & Continuidade</span>
            <h4 className="text-base font-bold text-white mt-1 mb-2">Oracle RMAN Point-In-Time</h4>
            <p className="text-xs text-[#819e9f] leading-relaxed">
              Rotinas auditáveis de backup a quente no Oracle 23ai com capacidade de recuperação no segundo exato anterior a qualquer desastre.
            </p>
          </div>

        </div>
      </section>

      {/* 💻 Simulador de Terminal Interativo (A Dor do Manual vs A Magia do CloudOps Hub) */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Comparativo de Experiência do Desenvolvedor
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            A Dor do DevOps Manual vs O Poder em 1 Clique
          </h2>
          <p className="mt-3 text-sm text-[#829fa3]">
            Veja a diferença entre operar servidores manualmente via SSH contra a automação orquestrada pelo CloudOps Hub.
          </p>

          <div className="inline-flex p-1 mt-8 bg-[#091114] border border-[#1d353b] rounded-xl">
            <button
              onClick={() => setTerminalMode('magic')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                terminalMode === 'magic'
                  ? 'bg-gradient-to-r from-[#114b50] to-[#1e8d84] text-white shadow-[0_0_20px_rgba(32,214,199,0.3)]'
                  : 'text-[#6c8b90] hover:text-white'
              }`}
            >
              <Zap size={15} className="text-[#20d6c7]" />
              <span>Modo CloudOps Hub (1 Clique)</span>
            </button>
            <button
              onClick={() => setTerminalMode('pain')}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                terminalMode === 'pain'
                  ? 'bg-red-950/70 text-red-200 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                  : 'text-[#6c8b90] hover:text-white'
              }`}
            >
              <AlertTriangle size={15} className="text-red-400" />
              <span>Modo Manual (A Dor do SSH Tradicional)</span>
            </button>
          </div>
        </div>

        <div className="bg-[#04080a] border border-[#1b2f35] rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#0b1417] px-4 py-3 border-b border-[#1b2f35] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-[#6c8c91]">
                {terminalMode === 'magic' ? 'cloudops-hub@production-orchestrator:~$' : 'ssh root@129.148.xx.xx (terminal manual frágil)'}
              </span>
            </div>
            <span className="text-[11px] font-mono text-[#3d5d62]">bash / zsh v5.9</span>
          </div>

          <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto min-h-[300px]">
            {terminalMode === 'magic' ? (
              <div className="space-y-3 text-emerald-300">
                <p className="text-[#658b90]"># Solicitando criação de microsserviço com alta disponibilidade via UI</p>
                <p className="text-white flex items-center gap-2">
                  <span className="text-[#20d6c7] font-bold">cloudops &gt;</span> engine.deploy(&#39;service-api&#39;, &#123; replicas: 3, db: &#39;oracle23ai&#39;, zeroTrust: true &#125;)
                </p>
                <div className="text-xs text-[#82b4b9] pl-4 border-l-2 border-[#20d6c7]/40 space-y-1.5 my-3">
                  <p className="text-[#20d6c7]">⚡ [00:00.08] Provisionando 3 contêineres Docker isolados em bridge interna (sem expor portas externas)...</p>
                  <p className="text-emerald-400">✓ [00:00.32] Configurando Nginx Reverse Proxy com algoritmo Round-Robin e Active Healthchecks.</p>
                  <p className="text-emerald-400">✓ [00:00.65] Injetando segredos e variáveis .env diretamente via OCI Vault (criptografia AES-256 HSM).</p>
                  <p className="text-emerald-400">✓ [00:00.91] Abrindo túnel Cloudflare Zero Trust via conexão socket de saída (Portas de entrada 100% blindadas).</p>
                  <p className="text-emerald-400">✓ [00:01.14] Conexão com Oracle Database 23ai validada via pool mTLS e snapshot PITR RMAN agendado.</p>
                </div>
                <p className="text-emerald-400 font-bold bg-[#092224] p-3 rounded-lg border border-[#1f6869]">
                  🎉 DEPLOY CONCLUÍDO COM SUCESSO EM 1.2s • ZERO DOWNTIME • NOTA A+ NO SECURITYHEADERS
                </p>
              </div>
            ) : (
              <div className="space-y-3 text-red-300">
                <p className="text-[#658b90]"># Tentando configurar tudo na mão via linha de comando...</p>
                <p className="text-white">root@vm-manual:~# nano /etc/nginx/sites-available/default</p>
                <p className="text-amber-400">root@vm-manual:~# nginx -t</p>
                <p className="text-red-400 font-bold">nginx: [emerg] unexpected &#34;&#125;&#34; in /etc/nginx/sites-available/default:42 (Falta ponto e vírgula!)</p>
                <p className="text-white mt-2">root@vm-manual:~# cat .env</p>
                <p className="text-amber-300 bg-red-950/40 p-2 rounded border border-red-500/30">
                  🚨 ALERTA CRÍTICO: Senha em texto plano gravada no disco e no .bash_history! (Risco de invasão SOC 2)
                </p>
                <p className="text-white mt-2">root@vm-manual:~# ufw status</p>
                <p className="text-red-400">
                  ⚠️ Portas 80, 443, 3000, 1521 abertas diretamente para a internet. Sofrendo 1.400 varreduras maliciosas por hora.
                </p>
                <p className="text-red-300 italic pt-2">
                  Tempo gasto: 3 horas e 45 minutos. Servidor vulnerável, com downtime e sem observabilidade.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ⚖️ Comparativo: Jenkins vs CloudOps Hub */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Modernização de Infraestrutura
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Jenkins Tradicional vs CloudOps Hub: A Evolução
          </h2>
          <p className="mt-3 text-sm text-[#829fa3]">
            Entenda por que o CloudOps Hub foi projetado como uma melhoria moderna e ultraleve sobre as antigas esteiras de automação em Java.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Jenkins */}
          <div className="bg-[#0b1214] border border-red-500/20 rounded-2xl p-6 sm:p-8 relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-red-500/20">
              <div>
                <span className="text-xs font-mono text-red-400 uppercase tracking-widest font-bold">Arquitetura Legada</span>
                <h3 className="text-2xl font-bold text-white mt-1">Jenkins CI/CD</h3>
              </div>
              <span className="text-2xl">☕</span>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-[#889fa2]">
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Alto Consumo de Memória:</strong> Baseado em Java JVM, consome de 1 GB a 2 GB de RAM mesmo ocioso, inviabilizando servidores menores ou instâncias gratuitas Always Free.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Vulnerabilidades em Plugins:</strong> Dependência de dezenas de plugins de terceiros frequentemente abandonados, com histórico de brechas críticas (CVEs).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Configuração Manual Frágil:</strong> Exige dominar sintaxe Groovy e escrever pipelines complexos em arquivos <code className="text-red-300">Jenkinsfile</code>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-400 font-bold mt-0.5">✕</span>
                <div>
                  <strong className="text-white">Escopo Limitado:</strong> Apenas executa scripts e rotinas de build. Não gerencia contêineres Docker, nem telemetria SRE, nem bancos de dados.
                </div>
              </li>
            </ul>
          </div>

          {/* Card CloudOps Hub */}
          <div className="bg-[#081619] border border-[#20d6c7]/50 rounded-2xl p-6 sm:p-8 relative shadow-[0_0_35px_rgba(32,214,199,0.15)]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#20d6c7]/30">
              <div>
                <span className="text-xs font-mono text-[#20d6c7] uppercase tracking-widest font-bold">Nova Geração SRE</span>
                <h3 className="text-2xl font-bold text-white mt-1">CloudOps Hub</h3>
              </div>
              <span className="text-2xl">⚡</span>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-[#9abec2]">
              <li className="flex items-start gap-2.5">
                <span className="text-[#20d6c7] font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white">Pegada Ultraleve (~35 MB RAM):</strong> Motor de microsserviços em Fastify e Node.js de alta performance. Roda com folga no plano Always Free da Oracle Cloud.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#20d6c7] font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white">Zero Trust & Zero CVEs:</strong> Auditado para 0 vulnerabilidades (Snyk), Nota A+ no SecurityHeaders e túnel reverso Cloudflare sem expor portas na internet.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#20d6c7] font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white">Automação em 1 Clique com IA:</strong> Gerenciador visual de contêineres Docker, Nginx Load Balancers e Copiloto Inteligente integrado (Odisseu IA).
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[#20d6c7] font-bold mt-0.5">✓</span>
                <div>
                  <strong className="text-white">Hub Unificado Completo:</strong> Além de CI/CD, inclui observabilidade SRE em tempo real, cofre OCI Vault HSM e painel DBA para Oracle Database 23ai com backup RMAN PITR.
                </div>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* ❓ Perguntas Frequentes (FAQ Técnico de Arquitetos e DBAs) */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Dúvidas Técnicas Frequentes
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            Perguntas & Respostas sobre a Arquitetura
          </h2>
        </div>

        <div className="space-y-4">
          
          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">01.</span> Por que utilizar Buckets (Object Storage) em vez de gravar imagens no disco da VM?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              A máquina virtual tem armazenamento NVMe finito (ex: 45 GB). Se os usuários começarem a fazer upload de fotos e notas fiscais diretamente no disco, o filesystem atinge 100% de uso rapidamente, o que trava o banco de dados Oracle/MySQL e corrompe arquivos do Linux. O Object Storage oferece capacidade ilimitada, não consome RAM/CPU do servidor para servir imagens estáticas e distribui os arquivos globalmente via CDN.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">02.</span> Como o Cloudflare Tunnel funciona sem abrir nenhuma porta no firewall da nuvem?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              Diferente de servidores tradicionais que abrem as portas 80, 443 e 3000 para a internet e ficam expostos a varreduras de bots, o agente do Cloudflare (<code className="text-[#20d6c7]">cloudflared</code>) cria uma conexão de <em>saída reversa criptografada</em> diretamente com o datacenter mais próximo da Cloudflare. As portas de entrada permanecem 100% fechadas e blindadas na Security List da OCI.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">03.</span> O CloudOps Hub funciona no plano gratuito vitalício da Oracle Cloud (Always Free)?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              Sim! Todo o projeto foi otimizado para rodar com eficiência máxima em instâncias gratuitas da Oracle Cloud. O backend em Node.js é gerenciado pelo PM2 consumindo apenas 25 MB a 40 MB de memória RAM, permitindo rodar bancos de dados Oracle Database 23ai Free, contêineres Docker e APIs sem custos de infraestrutura.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">04.</span> Como funciona a recuperação a desastres Point-In-Time (PITR) com Oracle RMAN?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              Em caso de um comando destrutivo acidental (como um <code className="text-red-400">TRUNCATE TABLE</code> que não vai para a lixeira do banco), o RMAN utiliza os backupsets e os Archivelogs gravados para restaurar os datafiles e reaplicar as transações até o milissegundo exato anterior ao erro, reabrindo o banco com <code className="text-[#20d6c7]">OPEN RESETLOGS</code> e preservando 100% dos dados.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">05.</span> Como o Nginx Load Balancer distribui o tráfego entre contêineres Docker?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              O CloudOps Hub configura o bloco <code className="text-[#20d6c7]">upstream</code> do Nginx dinamicamente apontando para as instâncias ativas do contêiner. Utilizando o algoritmo <em>Round-Robin ponderado</em> com verificações passivas de integridade (<code className="text-[#20d6c7]">max_fails</code> e <code className="text-[#20d6c7]">fail_timeout</code>), qualquer contêiner com falha é retirado da rota em milissegundos sem que o usuário final sofra nenhum erro HTTP 502.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">06.</span> Como o Cofre OCI Vault protege variáveis de ambiente (.env) contra vazamentos?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              Em arquiteturas tradicionais, senhas ficam salvas em arquivos <code className="text-amber-400">.env</code> de texto plano no disco da máquina, correndo o risco de serem commitadas no GitHub ou lidas por invasores. Com o CloudOps Hub integrado ao OCI Vault, os segredos são criptografados por chaves mestras de Hardware (HSM AES-256) e injetados diretamente na memória do processo em tempo de execução via API autenticada por Resource Principal.
            </p>
          </div>

          <div className="bg-[#0b1316] border border-[#1a2f35] rounded-xl p-5 sm:p-6">
            <h4 className="text-base font-bold text-white flex items-center gap-2 mb-2">
              <span className="text-[#20d6c7]">07.</span> O CloudOps Hub é uma evolução/melhoria em relação ao Jenkins?
            </h4>
            <p className="text-xs sm:text-sm text-[#829fa3] leading-relaxed">
              Sim! Enquanto o Jenkins tradicional foi concebido há quase 20 anos em Java (consumindo 1 GB a 2 GB de memória RAM ocioso, dependendo de plugins quebradiços e expondo portas 8080 na internet com frequentes CVEs), o CloudOps Hub é uma <strong>evolução moderna e ultraleve</strong>: consome apenas 35 MB de RAM, opera com 0 vulnerabilidades (auditado pelo Snyk), blindado por Cloudflare Zero Trust sem portas abertas e unifica CI/CD, observabilidade SRE em tempo real, orquestração Docker e rotinas completas de DBA Oracle 23ai com backup RMAN num único painel.
            </p>
          </div>

        </div>
      </section>

      {/* 🏷️ Matriz Semântica de Palavras-Chave de Busca (Google SEO Semantic Index) */}
      <section className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono uppercase tracking-widest text-[#20d6c7] bg-[#122326] px-3 py-1 rounded-full border border-[#20d6c7]/30">
            Índice de Tópicos & Tecnologias
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-4">
            O que você encontra no CloudOps Hub
          </h2>
          <p className="mt-3 text-sm text-[#829fa3]">
            Referência completa para quem busca ferramentas modernas de observabilidade SRE, infraestrutura em nuvem e cibersegurança.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="bg-[#0b1316] border border-[#182b30] rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-[#142629] text-[#20d6c7] flex items-center justify-center mb-4">
              <Container size={20} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Docker & Orquestração</h4>
            <p className="text-xs text-[#7d9b9f] mb-4">
              Gerenciamento visual completo de microsserviços sem precisar abrir o terminal SSH.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono bg-[#111e22] text-[#20d6c7] px-2 py-0.5 rounded border border-[#20d6c7]/20">Gerenciador Docker Web</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Portainer Alternativa</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Coolify Alternativa</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Nginx Load Balancer</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Port Inspection</span>
            </div>
          </div>

          <div className="bg-[#0b1316] border border-[#182b30] rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-[#142629] text-[#20d6c7] flex items-center justify-center mb-4">
              <ShieldCheck size={20} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Cibersegurança & Zero Trust</h4>
            <p className="text-xs text-[#7d9b9f] mb-4">
              Camadas rigorosas de proteção corporativa com certificação nos principais benchmarks de segurança.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono bg-[#111e22] text-[#20d6c7] px-2 py-0.5 rounded border border-[#20d6c7]/20">Cloudflare Tunnel</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">OCI Vault HSM</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">SecurityHeaders Grade A+</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Qualys SSL Labs A+</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">SOC 2 & ISO 27001</span>
            </div>
          </div>

          <div className="bg-[#0b1316] border border-[#182b30] rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-[#142629] text-[#20d6c7] flex items-center justify-center mb-4">
              <Database size={20} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">Bancos de Dados & DBA</h4>
            <p className="text-xs text-[#7d9b9f] mb-4">
              Controle avançado de motores relacionais de alta volumetria e rotinas críticas de recuperação.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono bg-[#111e22] text-[#20d6c7] px-2 py-0.5 rounded border border-[#20d6c7]/20">Oracle Database 23ai</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Oracle RMAN PITR</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">MySQL 8.0 Cluster</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Zero-Downtime Migration</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">OCI Object Storage</span>
            </div>
          </div>

          <div className="bg-[#0b1316] border border-[#182b30] rounded-2xl p-6">
            <div className="w-9 h-9 rounded-lg bg-[#142629] text-[#20d6c7] flex items-center justify-center mb-4">
              <Cpu size={20} />
            </div>
            <h4 className="text-base font-bold text-white mb-2">SRE & Confiabilidade</h4>
            <p className="text-xs text-[#7d9b9f] mb-4">
              Métricas em tempo real, robôs de auto-cura e telemetria profunda para servidores Linux na OCI.
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] font-mono bg-[#111e22] text-[#20d6c7] px-2 py-0.5 rounded border border-[#20d6c7]/20">Oracle Always Free</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Watchdog Anti-Sleep</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Telemetria RAM & CPU</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Vercel Edge Global CDN</span>
              <span className="text-[10px] font-mono bg-[#111e22] text-[#8aaab0] px-2 py-0.5 rounded border border-[#1b2b30]">Vinícius Lourenço</span>
            </div>
          </div>

        </div>
      </section>

      {/* 🧑‍💻 Sobre o Criador & Engenharia */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#152327]">
        <div className="bg-gradient-to-r from-[#0c181b] to-[#0d2125] border border-[#213f47] rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#166068] to-[#20d6c7] text-black font-black text-2xl flex items-center justify-center shadow-[0_0_25px_rgba(32,214,199,0.4)] flex-shrink-0">
              JV
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                <span className="text-xs font-mono bg-[#16353b] text-[#20d6c7] px-2.5 py-0.5 rounded-full font-bold border border-[#20d6c7]/40">
                  Arquiteto & Engenheiro Criador
                </span>
                <span className="text-xs text-[#729297]">Recife, PE, Brasil • Remoto Global</span>
              </div>
              <h3 className="text-2xl font-bold text-white">José Vinícius Lourenço Marques de Sousa</h3>
              <p className="text-xs sm:text-sm text-[#8baab0] mt-1.5 leading-relaxed">
                Desenvolvedor Full-Stack & Especialista em Arquitetura Cloud (OCI / AWS) e Administração de Bancos de Dados Oracle Database. Criador do CloudOps Hub, focado em alta disponibilidade, engenharia de confiabilidade SRE e cibersegurança Zero Trust.
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs">
                <a 
                  href="https://www.linkedin.com/in/jose-vinicius-louren%C3%A7o-1a6b9014a/" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 bg-[#0a1e2f] hover:bg-[#0f2c45] border border-sky-600/40 text-sky-300 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <LinkedinIcon size={14} className="text-sky-400" />
                  <span>LinkedIn</span>
                  <ExternalLink size={12} />
                </a>

                <a 
                  href="https://github.com/ViniScooper" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 bg-[#121d21] hover:bg-[#1a292f] border border-[#233f46] text-white px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Star size={13} className="text-[#20d6c7]" />
                  <span>GitHub: @ViniScooper</span>
                </a>

                <a 
                  href="https://www.tabnews.com.br/viniScooper/cansei-de-abrir-10-paineis-oracle-aws-hostinger-vercel-criei-um-hub-multi-cloud-com-ia-para-controlar-tudo-em-1-lugar" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 bg-[#102428] hover:bg-[#153238] border border-[#20d6c7]/40 text-[#20d6c7] px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <Newspaper size={13} />
                  <span>Artigo no TabNews</span>
                  <ExternalLink size={12} />
                </a>

                <a 
                  href="https://wa.me/5581995126839" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="flex items-center gap-1.5 bg-[#0d231d] hover:bg-[#13332a] border border-emerald-600/40 text-emerald-300 px-3 py-1.5 rounded-lg transition-all font-semibold"
                >
                  <MessageCircle size={13} className="text-emerald-400" />
                  <span>WhatsApp (+55 81)</span>
                </a>

                <a 
                  href="mailto:vviniciuslourenco@gmail.com" 
                  className="text-[#8aaab0] hover:text-[#20d6c7] transition-colors font-medium px-2 py-1"
                >
                  vviniciuslourenco@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ CTA Estrela no GitHub & Compartilhamento Social */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-[#070b0e] via-[#0b1619] to-[#070b0e]">
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#166068] to-[#20d6c7] text-black flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(32,214,199,0.4)]">
            <Star size={32} className="fill-black" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Gostou do Projeto? Deixe uma Estrela no GitHub! ⭐
          </h2>

          <p className="mt-4 text-[#88a5a9] text-base sm:text-lg max-w-2xl mx-auto">
            O seu like no repositório apoia o desenvolvimento contínuo de novas funcionalidades de cibersegurança e observabilidade para a comunidade!
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href="https://github.com/ViniScooper/CloudOps_Hub"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 bg-[#20d6c7] hover:bg-[#1ec3b5] text-black font-extrabold text-base px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(32,214,199,0.4)] transition-all transform hover:scale-105"
            >
              <Star size={18} className="fill-black" />
              <span>Dar Estrela (Star) no Repositório</span>
              <ExternalLink size={16} />
            </a>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 bg-[#101b1e] hover:bg-[#17272c] border border-[#27444c] text-white font-semibold text-sm px-6 py-4 rounded-xl transition-all"
            >
              {copiedLink ? <Check size={16} className="text-emerald-400" /> : <Layers size={16} />}
              <span>{copiedLink ? 'Link do GitHub Copiado!' : 'Copiar Link do Repositório'}</span>
            </button>
          </div>

          {/* 📢 1-Click Social Sharing Matrix */}
          <div className="mt-12 pt-8 border-t border-[#16272b] max-w-2xl mx-auto">
            <p className="text-xs uppercase font-mono tracking-widest text-[#6c8c91] mb-4">
              Divulgue para a comunidade de DevOps & Desenvolvedores
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent('🚀 Conheça o CloudOps Hub: Plataforma SRE, Gestão de Docker e Oracle Database com Zero Trust e Grade A+ em Cibersegurança desenvolvida por José Vinícius Lourenço: https://cloudops-hub-dun.vercel.app/landing')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#122822] hover:bg-[#18362e] border border-emerald-500/30 text-emerald-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <MessageCircle size={15} />
                <span>WhatsApp</span>
              </a>

              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://cloudops-hub-dun.vercel.app/landing')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#0c2236] hover:bg-[#11314d] border border-sky-500/30 text-sky-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <Share2 size={15} />
                <span>LinkedIn</span>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('CloudOps Hub — Gestão de servidores Cloud, Docker e Oracle DB com Zero Trust e Grade A+ em Cibersegurança. Criado por @ViniScooper: https://cloudops-hub-dun.vercel.app/landing')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 bg-[#171c24] hover:bg-[#202733] border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                <ExternalLink size={15} />
                <span>X (Twitter)</span>
              </a>

              <button
                onClick={handleCopyShare}
                className="flex items-center gap-2 bg-[#121c1f] hover:bg-[#1a272b] border border-[#254249] text-[#20d6c7] text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
              >
                {copiedShare ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                <span>{copiedShare ? 'Link Copiado!' : 'Copiar Link da Página'}</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 📜 Rodapé */}
      <footer className="border-t border-[#132226] py-10 text-xs text-[#5f7a7e] bg-[#05080a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">CloudOps Hub</span> — Desenvolvido por <strong className="text-[#20d6c7]">José Vinícius Lourenço Marques de Sousa (Vinícius Lourenço)</strong>.
            <p className="mt-1">Software Proprietário & Proteção Comercial (Lei Federal nº 9.609/1998 e 9.610/1998).</p>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <a href="https://github.com/ViniScooper/CloudOps_Hub" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://www.linkedin.com/in/jose-vinicius-louren%C3%A7o-1a6b9014a/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a>
            <a href="https://www.tabnews.com.br/viniScooper/cansei-de-abrir-10-paineis-oracle-aws-hostinger-vercel-criei-um-hub-multi-cloud-com-ia-para-controlar-tudo-em-1-lugar" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">TabNews</a>
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="mailto:vviniciuslourenco@gmail.com" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
