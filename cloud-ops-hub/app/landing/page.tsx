'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  ShieldCheck, Star, ExternalLink, Server, Database, 
  Cpu, Lock, Zap, ArrowRight, CheckCircle2, Terminal, 
  Layers, Globe, Check, Eye, AlertTriangle, Sparkles,
  Container, Network, KeyRound, Shield, ArrowLeftRight, HardDrive, RefreshCw
} from 'lucide-react'

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

  const handleCopy = () => {
    navigator.clipboard.writeText('https://github.com/ViniScooper/CloudOps_Hub')
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
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
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/ViniScooper/CloudOps_Hub"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 bg-[#101b1e] hover:bg-[#16272c] border border-[#264147] hover:border-[#20d6c7]/60 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-sm group"
            >
              <Star size={14} className="text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform" />
              <span>Star no GitHub</span>
            </a>

            <Link
              href="/"
              className="bg-[#20d6c7] hover:bg-[#1ec3b5] text-black text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(32,214,199,0.25)] flex items-center gap-1.5"
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

      {/* ⭐ CTA Estrela no GitHub */}
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
        </div>
      </section>

      {/* 📜 Rodapé */}
      <footer className="border-t border-[#132226] py-10 text-xs text-[#5f7a7e] bg-[#05080a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-white">CloudOps Hub</span> — Desenvolvido por <strong className="text-[#20d6c7]">José Vinícius Lourenço Marques de Sousa (Vinícius Lourenço)</strong>.
            <p className="mt-1">Software Proprietário & Proteção Comercial (Lei Federal nº 9.609/1998 e 9.610/1998).</p>
          </div>

          <div className="flex items-center gap-6">
            <a href="https://github.com/ViniScooper/CloudOps_Hub" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
            <a href="mailto:vviniciuslourenco@gmail.com" className="hover:text-white transition-colors">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
