'use client'

import React, { useState } from 'react'
import { 
  CircleHelp, BookOpen, Rocket, Shield, Container, Terminal, HardDrive, 
  Zap, CheckCircle2, ArrowRight, RotateCcw, GitPullRequest, ExternalLink, 
  HelpCircle, MessageSquare, AlertCircle, ChevronDown, ChevronUp, Lock, Globe, FolderPlus,
  Activity, ArrowLeftRight, Database, Bot, Cpu, Sparkles, RefreshCw
} from 'lucide-react'
import { VercelIcon } from './VercelDeploymentsView'

interface HelpViewProps {
  onNavigate: (tab: string) => void
}

export function HelpView({ onNavigate }: HelpViewProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<'dev' | 'devops' | 'dba'>('dev')

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const steps = [
    {
      num: '01',
      title: 'Dashboard & Métricas da VM',
      icon: Cpu,
      desc: 'Supervisão central da sua máquina virtual: Consumo de CPU, uso de RAM, memória Swap, espaço em disco e tempo de atividade (Uptime) em tempo real via SSH.',
      actionLabel: 'Ver Dashboard',
      targetTab: 'Dashboard'
    },
    {
      num: '02',
      title: 'Gerenciar Containers Docker',
      icon: Container,
      desc: 'Controle visual de containers (boteco_backend, boteco_db, boteco_tunnel). Visualize uso de memória, mapeamento de portas, reinicie serviços e ative a rotação de logs.',
      actionLabel: 'Abrir Docker',
      targetTab: 'Docker'
    },
    {
      num: '03',
      title: 'Deploy em 1-Clique & Rollback',
      icon: Rocket,
      desc: 'Atualize o backend direto do Git com Zero Downtime. Se qualquer instabilidade surgir em produção, use o Rollback para reverter à versão anterior em 3 segundos.',
      actionLabel: 'Ir para Deploy',
      targetTab: 'Deploy'
    },
    {
      num: '04',
      title: 'Vercel Frontend & Edge CDN',
      icon: Globe,
      desc: 'Monitoramento do cardápio digital na borda da Vercel. Acompanhe status de build (Ready/Building), commits sincronizados e dispare redeploys em 1-clique via Deploy Hook.',
      actionLabel: 'Ver Vercel Edge',
      targetTab: 'Vercel Frontend'
    },
    {
      num: '05',
      title: 'Terminal Web SSH Integrado',
      icon: Terminal,
      desc: 'Console Linux completo e seguro direto no navegador (computador ou smartphone). Execute comandos administrativos dispensando o PuTTY ou MobaXterm.',
      actionLabel: 'Abrir Terminal',
      targetTab: 'Terminal'
    },
    {
      num: '06',
      title: 'Nginx Proxy & Cloudflare Tunnels',
      icon: Shield,
      desc: 'Gestão de proxies reversos e túneis Zero Trust. Distribua domínios com terminação HTTPS/SSL automática sem precisar abrir portas vulneráveis no firewall da Oracle.',
      actionLabel: 'Ver Nginx & Tunnels',
      targetTab: 'Nginx'
    },
    {
      num: '07',
      title: 'Storage & Backups OCI',
      icon: HardDrive,
      desc: 'Controle de buckets na Oracle Cloud (fotos de produtos do cardápio, uploads) e histórico de backups/dumps automáticos do banco MySQL com retenção segura.',
      actionLabel: 'Ver Storage',
      targetTab: 'Storage'
    },
    {
      num: '08',
      title: 'Monitoramento & Telemetria HTTP',
      icon: Activity,
      desc: 'Rastreamento de erros 4xx/5xx enfrentados pelos usuários no Cardápio Digital ou Painel Admin com rotas afetadas e payloads detalhados sob demanda.',
      actionLabel: 'Ver Logs & Erros',
      targetTab: 'Monitoramento & Logs'
    },
    {
      num: '09',
      title: 'Workspace de Migração Multi-Cloud',
      icon: ArrowLeftRight,
      desc: 'Mude da Oracle para Hostinger, AWS ou qualquer VPS em menos de 3 minutos. O Hub gera automações Terraform e transfere MySQL, fotos e containers com 1 clique.',
      actionLabel: 'Ir para Migração',
      targetTab: 'Migração Multi-Cloud'
    },
    {
      num: '10',
      title: 'Agente Odisseu AI (RAG)',
      icon: Bot,
      desc: 'Assistente inteligente treinado especificamente na arquitetura e histórico dos seus servidores. Faz diagnósticos de falhas, sugere comandos e responde dúvidas técnicas.',
      actionLabel: 'Consultar Odisseu',
      targetTab: 'Odisseu AI'
    },
    {
      num: '11',
      title: 'Robô VM Always Free (Oracle)',
      icon: Zap,
      desc: 'Automação que contorna o erro "Out of host capacity" da Oracle Cloud, tentando alocar instâncias gratuitas em loop assinado até conseguir, avisando no WhatsApp.',
      actionLabel: 'Ver VM Scraper',
      targetTab: 'VM Scraper'
    }
  ]

  const faqs = [
    {
      q: 'O que o usuário precisa configurar para usar o GitFlow & Pull Request no Hub?',
      a: 'É super simples e dividido em 2 partes: 1) Na VM da Nuvem: Apenas ter o Git instalado (sudo apt install git) e o repositório clonado. Se o repositório for privado, adicione uma Deploy Key no GitHub para a VM poder dar "git pull"; 2) No CloudOps Hub: O usuário pode clicar em "⚙️ Configurar GitHub Token" e colar seu Personal Access Token com permissão de "repo" para criar PRs pelo celular ou outro PC. Se estiver rodando o Hub no PC onde já programa, o sistema usa o Git local automaticamente sem precisar de token!'
    },
    {
      q: 'Preciso abrir portas no firewall da Oracle Cloud para acessar o painel ou APIs?',
      a: 'Não! O sistema utiliza o Cloudflare Tunnel (Zero Trust). O tráfego passa por um túnel criptografado direto da VM para a rede global da Cloudflare, oferecendo HTTPS automático sem portas expostas.'
    },
    {
      q: 'Como funciona o Rollback de emergência?',
      a: 'Quando você clica em Rollback, o backend se conecta via SSH na VM, executa "git reset --hard HEAD~1" e recria os containers na versão estável anterior em segundos, avisando você no WhatsApp.'
    },
    {
      q: 'Minhas chaves SSH ou senhas ficam expostas no GitHub?',
      a: 'Nunca! O projeto possui um arquivo .gitignore rigoroso que bloqueia qualquer arquivo .env, chaves privadas (.key/.pem) e notas com senhas. O repositório armazena apenas o código da plataforma.'
    },
    {
      q: 'A VM tem apenas ~1 GB de RAM. O CloudOps Hub vai pesar no servidor?',
      a: 'Não! O CloudOps Hub foi projetado com arquitetura "Zero Agent". Ele roda o backend na sua máquina ou na borda e só faz consultas SSH rápidas quando solicitado, consumindo míseros megabytes.'
    },
    {
      q: 'Como recebo os alertas no meu WhatsApp?',
      a: 'O sistema utiliza a API do CallMeBot integrada ao backend. Qualquer ação importante (deploy, rollback, queda de serviço ou nova VM) envia uma mensagem instantânea com detalhes.'
    },
    {
      q: 'Como funciona o monitoramento de erros em tempo real dos clientes no Cardápio?',
      a: 'O Cardápio Digital e o Painel Admin possuem interceptadores HTTP nativos. Quando um cliente ou administrador encontra qualquer erro 4xx ou 5xx, o detalhe é transmitido de forma assíncrona para a Central de Monitoramento do Hub. Você vê a mensagem amigável, o código HTTP, a rota acessada e o traceback em 1 clique no botão "🔍 Verificar Erros", economizando memória por não manter conexões pesadas abertas.'
    },
    {
      q: 'Se eu decidir migrar da Oracle para a Hostinger ou outra VPS, como o Hub faz isso?',
      a: 'No "Workspace de Migração Multi-Cloud", basta inserir o IP e credenciais SSH da VPS de destino (ex: Hostinger). O Hub testa a conexão, estima o tempo de transferência (~2m 45s para ~142MB), gera scripts de automação Terraform e transfere o banco MySQL, buckets de fotos e containers Docker de forma automatizada com rollback de segurança.'
    },
    {
      q: 'Como funciona a integração com a Vercel e quando usar o Deploy Hook vs Token de Acesso?',
      a: 'O Deploy Hook permite disparar atualizações e novos builds na Vercel em 1-clique sem restrição de escopo ou risco de vazar credenciais. Já o Token de Acesso Pessoal (gerado em vercel.com/account/tokens) permite que o CloudOps Hub consulte a API da Vercel para carregar o histórico linha a linha de cada build, autor do commit e tempo de compilação na CDN Edge.'
    },
    {
      q: 'Por que após fazer um deploy na Vercel o cardápio ainda mostrava textos ou imagens antigas?',
      a: 'A Vercel utiliza uma CDN global de borda (Edge) com cache agressivo, e os navegadores armazenam arquivos estáticos (HTML/CSS/JS) no cache local. Para visualizar a versão mais recente imediatamente, utilize o atalho Ctrl + Shift + R no computador ou abra uma aba anônima no celular. Verifique também se a branch padrão configurada na Vercel (main) recebeu o merge das suas alterações.'
    },
    {
      q: 'O que é o Agente Odisseu AI e como ele ajuda na operação do dia a dia?',
      a: 'O Odisseu é um agente de inteligência artificial com RAG (Retrieval-Augmented Generation) e LangChain que conhece a arquitetura completa da sua infraestrutura: portas, containers Docker, domínios Cloudflare, scripts de automação e histórico de erros. Você pode tirar dúvidas técnicas, pedir comandos SSH precisos ou diagnósticos de incidentes diretamente pelo console.'
    }
  ]

  return (
    <div>
      {/* Cabeçalho */}
      <div className="section-heading">
        <div>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CircleHelp size={20} style={{ color: '#20d6c7' }} />
            Central de Ajuda & Guia de Primeiros Passos
          </h2>
          <p>
            Tudo o que você precisa saber para operar seus servidores e aplicações com total autonomia e segurança.
          </p>
        </div>
      </div>

      {/* Banner de Boas-Vindas */}
      <div 
        className="panel" 
        style={{ 
          padding: '24px', 
          marginBottom: '24px', 
          borderColor: '#1d3438', 
          background: 'radial-gradient(ellipse at top left, #0e2326 0%, #0a1114 70%)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '680px' }}>
            <span className="status-text emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', marginBottom: '8px' }}>
              <CheckCircle2 size={13} /> Sistema Conectado & 100% Operacional
            </span>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#d9e2e1' }}>
              Bem-vindo ao CloudOps Hub v2.5
            </h3>
            <p style={{ color: '#8fa4a8', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              Esta plataforma foi desenhada para substituir ferramentas fragmentadas e pesadas (MobaXterm, Portainer, Grafana) por um console único, visual, ultra-rápido e acessível pelo PC ou celular (PWA).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="primary-button"
              onClick={() => onNavigate('Deploy')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontWeight: 600 }}
            >
              <Rocket size={14} /> Fazer um Deploy
            </button>
            <button 
              className="secondary-button"
              onClick={() => onNavigate('Terminal')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#0e171a', border: '1px solid #1f2f33', color: '#d9e2e1', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
            >
              <Terminal size={14} /> Terminal Web
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Primeiros Passos */}
      <h3 style={{ fontSize: '15px', color: '#d9e2e1', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={16} style={{ color: '#20d6c7' }} /> Primeiros Passos: Como Usar o Sistema
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {steps.map((step, idx) => {
          const Icon = step.icon
          return (
            <div 
              key={idx} 
              className="panel" 
              style={{ 
                padding: '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ background: 'rgba(32, 214, 199, 0.1)', color: '#20d6c7', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} />
                    </div>
                    <strong style={{ color: '#d9e2e1', fontSize: '13px' }}>{step.title}</strong>
                  </div>
                  <span style={{ fontSize: '11px', color: '#52666a', fontFamily: 'monospace', fontWeight: 700 }}>
                    {step.num}
                  </span>
                </div>
                <p style={{ color: '#8fa4a8', fontSize: '11px', lineHeight: '1.6', margin: '0 0 14px 0' }}>
                  {step.desc}
                </p>
              </div>

              <button
                onClick={() => onNavigate(step.targetTab)}
                style={{
                  background: '#070c0e',
                  border: '1px solid #17262a',
                  color: '#20d6c7',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  width: 'fit-content'
                }}
              >
                {step.actionLabel} <ArrowRight size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Guia Personalizado por Perfil */}
      <section className="panel" style={{ padding: '20px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', color: '#d9e2e1' }}>Guias Práticos por Função</h3>
            <small style={{ color: '#6f8387' }}>Selecione o seu papel para ver o roteiro recomendado de ações diárias</small>
          </div>

          <div style={{ display: 'flex', gap: '6px', background: '#070a0c', padding: '3px', borderRadius: '6px', border: '1px solid #142023' }}>
            <button
              onClick={() => setSelectedRole('dev')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: selectedRole === 'dev' ? '#143136' : 'transparent',
                color: selectedRole === 'dev' ? '#20d6c7' : '#6f8387',
                fontWeight: 600
              }}
            >
              💻 Desenvolvedor
            </button>
            <button
              onClick={() => setSelectedRole('devops')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: selectedRole === 'devops' ? '#143136' : 'transparent',
                color: selectedRole === 'devops' ? '#20d6c7' : '#6f8387',
                fontWeight: 600
              }}
            >
              🛡️ DevOps / Infra
            </button>
            <button
              onClick={() => setSelectedRole('dba')}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                background: selectedRole === 'dba' ? '#143136' : 'transparent',
                color: selectedRole === 'dba' ? '#20d6c7' : '#6f8387',
                fontWeight: 600
              }}
            >
              🗄️ DBA / Dados
            </button>
          </div>
        </div>

        {selectedRole === 'dev' && (
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '6px', border: '1px solid #142023', fontSize: '12px', lineHeight: '1.7', color: '#a2b3b6' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '6px' }}>Fluxo Diário do Desenvolvedor:</strong>
            <b>1. Backend & Banco (VM Oracle):</b> Programe na branch <code>develop</code> → Suba para o GitHub (<code>git push origin develop</code>) → No CloudOps Hub, vá na aba <b>Deploy</b> e clique em <b>"Fazer Pull Request & Merge"</b> → Em seguida, clique em <b>"Fazer Deploy Agora"</b> para atualizar os containers sem queda.<br/>
            <b>2. Frontend Cardápio (Vercel Edge):</b> Desenvolva seus componentes e envie para a branch <code>main</code> → Acesse a aba <b>Vercel Frontend</b> para acompanhar o build em tempo real na CDN Edge → Se necessário, clique em <b>"Forçar Redeploy Vercel"</b> para recriar o build em 1 clique.<br/>
            <b>3. Rollback de Emergência:</b> Se qualquer bug subir em produção, aperte <b>Rollback</b> (para o backend na VM) ou recompile o deployment anterior na aba Vercel.
          </div>
        )}

        {selectedRole === 'devops' && (
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '6px', border: '1px solid #142023', fontSize: '12px', lineHeight: '1.7', color: '#a2b3b6' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '6px' }}>Rotina do DevOps & Segurança:</strong>
            1. Monitore a saúde da VM pelo <b>Dashboard</b> (mantenha a RAM abaixo de 85% e o swap controlado).<br/>
            2. Na aba <b>Docker</b>, clique em <b>"Otimizar Logs Docker"</b> para garantir a rotação de 50 MB e proteger o disco.<br/>
            3. Verifique se o container <code>boteco_tunnel</code> está ativo para garantir tráfego seguro pela Cloudflare.<br/>
            4. Inspecione logs de containers problemáticos usando o ícone de Lupa com diagnóstico automático.<br/>
            5. Acompanhe a <b>Central de Monitoramento & Logs</b> usando o botão <b>"🔍 Verificar Erros"</b> para diagnosticar em tempo real erros 4xx/5xx gerados no cardápio/admin.<br/>
            6. Acesse o <b>Workspace de Migração Multi-Cloud</b> para transferir banco MySQL, fotos e containers para a Hostinger ou outra VPS em 1-clique.
          </div>
        )}

        {selectedRole === 'dba' && (
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '6px', border: '1px solid #142023', fontSize: '12px', lineHeight: '1.7', color: '#a2b3b6' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '6px' }}>Rotina do Administrador de Banco (DBA):</strong>
            1. Monitore o container <code>boteco_db</code> (MySQL 8.0) no Dashboard.<br/>
            2. Utilize a aba <b>Storage</b> para verificar a retenção de dumps no bucket <code>boteco-sivirino-fotos</code>.<br/>
            3. O banco opera isolado na rede privada local, acessível apenas internamente ou via túnel SSH autenticado.
          </div>
        )}
      </section>

      {/* Guia Especial: Clonar & Subir Novo Projeto do GitHub */}
      <section className="panel" style={{ padding: '22px', marginBottom: '28px', borderColor: '#1b3236', background: 'linear-gradient(180deg, #091214 0%, #0d171a 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <FolderPlus size={18} style={{ color: '#20d6c7' }} />
              <h3 style={{ margin: 0, fontSize: '16px', color: '#d9e2e1' }}>
                Clonar & Subir Novo Projeto do GitHub na VM
              </h3>
            </div>
            <p style={{ color: '#8fa4a8', fontSize: '12px', margin: 0 }}>
              Baixe qualquer repositório na sua VM Oracle e inicie a execução via Docker ou PM2 automaticamente sem abrir terminal manual.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={() => onNavigate('Deploy')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '6px 14px' }}
          >
            <Rocket size={13} /> Ir para Tela de Deploy
          </button>
        </div>

        {/* Campos Explicados */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '18px' }}>
          <div style={{ background: '#070a0c', padding: '12px', borderRadius: '6px', border: '1px solid #142023', fontSize: '11px' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '4px' }}>🔗 URL do Repositório Git *</strong>
            <span style={{ color: '#d9e2e1', fontFamily: 'monospace' }}>https://github.com/ViniScooper/meu-novo-app.git</span>
            <small style={{ display: 'block', color: '#6f8387', marginTop: '4px' }}>Link HTTPS ou SSH do repositório no GitHub.</small>
          </div>

          <div style={{ background: '#070a0c', padding: '12px', borderRadius: '6px', border: '1px solid #142023', fontSize: '11px' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '4px' }}>📁 Nome da Pasta na VM & Branch</strong>
            <span style={{ color: '#d9e2e1' }}>Pasta: <code>/home/ubuntu/meu-app</code> | Branch: <code>main</code></span>
            <small style={{ display: 'block', color: '#6f8387', marginTop: '4px' }}>Onde os arquivos ficarão salvos no Linux da VM.</small>
          </div>
        </div>

        {/* Comparação dos 3 Modos de Execução */}
        <h4 style={{ fontSize: '12px', color: '#d9e2e1', textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: '0.5px' }}>
          Como escolher o Modo de Execução correto?
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#070a0c', padding: '14px', borderRadius: '6px', border: '1px solid #162428' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#20d6c7', fontWeight: 600, fontSize: '12px' }}>
              <Container size={15} /> 🐳 Docker Compose
            </div>
            <p style={{ color: '#8fa4a8', fontSize: '11px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
              Roda <code>docker compose up -d --build</code>.
            </p>
            <span style={{ display: 'block', color: '#d9e2e1', fontSize: '11px', lineHeight: '1.5' }}>
              • <b>Quando usar:</b> Projetos com <code>docker-compose.yml</code>, banco de dados ou múltiplos containers.<br/>
              • <b>Vantagem:</b> Isolamento total de bibliotecas e versões.
            </span>
          </div>

          <div style={{ background: '#070a0c', padding: '14px', borderRadius: '6px', border: '1px solid #162428' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#a3e635', fontWeight: 600, fontSize: '12px' }}>
              <Terminal size={15} /> ⚡ Node.js / PM2
            </div>
            <p style={{ color: '#8fa4a8', fontSize: '11px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
              Instala dependências e roda <code>pm2 start</code>.
            </p>
            <span style={{ display: 'block', color: '#d9e2e1', fontSize: '11px', lineHeight: '1.5' }}>
              • <b>Quando usar:</b> APIs REST em Node.js/Express/Fastify.<br/>
              • <b>Vantagem para sua VM:</b> Consome míseros <b>~15 MB de RAM</b>, ideal para não sobrecarregar servidores de 1 GB.
            </span>
          </div>

          <div style={{ background: '#070a0c', padding: '14px', borderRadius: '6px', border: '1px solid #162428' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#f59e0b', fontWeight: 600, fontSize: '12px' }}>
              <FolderPlus size={15} /> 📂 Apenas Clonar
            </div>
            <p style={{ color: '#8fa4a8', fontSize: '11px', lineHeight: '1.5', margin: '0 0 8px 0' }}>
              Apenas baixa os arquivos para a VM.
            </p>
            <span style={{ display: 'block', color: '#d9e2e1', fontSize: '11px', lineHeight: '1.5' }}>
              • <b>Quando usar:</b> Quando você precisa configurar arquivos <code>.env</code>, senhas ou migrações antes de inicializar.
            </span>
          </div>
        </div>

        {/* Alerta Crítico: Proxy Reverso e Evitar Conflito de Portas */}
        <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', padding: '14px', fontSize: '11px', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 700, marginBottom: '6px', fontSize: '12px' }}>
            <AlertCircle size={15} /> ⚠️ IMPORTANTE: Como evitar Conflito de Portas com o Proxy Reverso (Nginx)
          </div>
          <p style={{ color: '#d9e2e1', margin: '0 0 8px 0' }}>
            No Linux, duas aplicações <b>NUNCA</b> podem escutar na mesma porta ao mesmo tempo. Suas portas atuais já utilizadas são:
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px', fontFamily: 'monospace', fontSize: '10px' }}>
            <span style={{ background: '#070a0c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e282a', color: '#6f8387' }}>Porta 3001: Lottus API</span>
            <span style={{ background: '#070a0c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e282a', color: '#6f8387' }}>Porta 3002: Boteco Backend</span>
            <span style={{ background: '#070a0c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e282a', color: '#6f8387' }}>Porta 3003: Inglês API</span>
            <span style={{ background: '#070a0c', padding: '2px 8px', borderRadius: '4px', border: '1px solid #1e282a', color: '#6f8387' }}>Porta 3306: MySQL</span>
            <span style={{ background: '#133538', padding: '2px 8px', borderRadius: '4px', border: '1px solid #20d6c7', color: '#20d6c7', fontWeight: 700 }}>Porta 3004+: DISPONÍVEIS</span>
          </div>
          <p style={{ color: '#a2b3b6', margin: 0 }}>
            <b>Como publicar seu novo app na internet:</b><br/>
            1. Configure a sua aplicação para escutar em uma porta livre (ex: <code>3004</code>);<br/>
            2. Vá até a aba <b>Nginx</b> do CloudOps Hub e clique em <b>"Adicionar Host"</b>;<br/>
            3. Aponte seu domínio (ex: <code>app.meudominio.com</code>) para <code>http://127.0.0.1:3004</code> e ative o <b>SSL Let's Encrypt</b>.<br/>
            Dessa forma, os usuários acessam na porta padrão 443 (HTTPS) e o Nginx faz o encaminhamento sem nenhum conflito de portas!
          </p>
        </div>
      </section>

      {/* MAPA COMPLETO DOS 11 MÓDULOS DO SISTEMA */}
      <section className="panel" style={{ padding: '22px', marginBottom: '28px', borderColor: '#1b3236' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} style={{ color: '#20d6c7' }} />
          <h3 style={{ margin: 0, fontSize: '16px', color: '#d9e2e1' }}>
            Mapa Completo do Sistema: Guia de Cada Tópico
          </h3>
        </div>
        <p style={{ color: '#8fa4a8', fontSize: '12px', margin: '0 0 18px 0', lineHeight: 1.5 }}>
          Entenda detalhadamente a função de cada módulo, o que você pode executar nele e quando utilizá-lo na sua rotina diária:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          
          {/* 1. Dashboard */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Cpu size={16} /> 1. Dashboard & Saúde da VM
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Coleta métricas de telemetria da VM via SSH seguro: uso de CPU, consumo de RAM, espaço em disco (NVMe), uso de Swap e Uptime.<br/>
                <b>Quando usar:</b> Sempre que acessar o console para verificar se a máquina está estável e se a RAM está sob controle (abaixo de 85%).
              </p>
            </div>
            <button onClick={() => onNavigate('Dashboard')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Abrir Dashboard <ArrowRight size={11} />
            </button>
          </div>

          {/* 2. Docker Containers */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Container size={16} /> 2. Docker Containers
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Lista todos os containers ativos (<code>boteco_backend</code>, <code>boteco_db</code>, <code>boteco_tunnel</code>), portas expostas e memória individual. Permite reiniciar serviços e ativar a rotação de logs (limite de 50MB).<br/>
                <b>Quando usar:</b> Quando um serviço parar de responder, para inspecionar logs ao vivo ou liberar espaço em disco.
              </p>
            </div>
            <button onClick={() => onNavigate('Docker')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Gerenciar Docker <ArrowRight size={11} />
            </button>
          </div>

          {/* 3. Deploy & Rollback */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Rocket size={16} /> 3. Deploy & Rollback GitFlow
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Permite mesclar a branch <code>develop</code> na <code>main</code> com 1 clique (Pull Request automático) e fazer deploy Zero Downtime no backend. Em caso de bugs, o botão <b>Rollback</b> reverte a versão em 3 segundos.<br/>
                <b>Quando usar:</b> Sempre que terminar de codificar uma nova funcionalidade no backend e quiser publicar em produção.
              </p>
            </div>
            <button onClick={() => onNavigate('Deploy')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ir para Deploy <ArrowRight size={11} />
            </button>
          </div>

          {/* 4. Vercel Frontend */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <VercelIcon size={16} color="#20d6c7" /> 4. Vercel Frontend & Edge CDN
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Monitora o site <code>cardapiodigital-gamma.vercel.app</code> na rede Edge global da Vercel. Mostra o último commit compilado, status (Ready/Building) e botão <b>Forçar Redeploy Vercel</b> via Deploy Hook.<br/>
                <b>Quando usar:</b> Sempre que atualizar o visual do cardápio, para acompanhar o build em tempo real ou forçar a atualização imediata.
              </p>
            </div>
            <button onClick={() => onNavigate('Vercel Frontend')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ver Vercel Edge <ArrowRight size={11} />
            </button>
          </div>

          {/* 5. Terminal Web SSH */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Terminal size={16} /> 5. Terminal Web SSH
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Emulador de terminal Linux completo conectado via túnel SSH autenticado em memória, dispensando o uso de PuTTY ou MobaXterm.<br/>
                <b>Quando usar:</b> Quando precisar rodar comandos no Bash, debugar arquivos do servidor ou verificar configurações diretamente pelo celular ou PC.
              </p>
            </div>
            <button onClick={() => onNavigate('Terminal')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Abrir Terminal <ArrowRight size={11} />
            </button>
          </div>

          {/* 6. Nginx & Cloudflare */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Shield size={16} /> 6. Nginx & Cloudflare Tunnels
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Gerencia hosts virtuais Nginx e túneis Cloudflare Zero Trust. Conecta o tráfego externo aos microserviços com certificados SSL/HTTPS automáticos sem abrir portas públicas.<br/>
                <b>Quando usar:</b> Ao adicionar um novo subdomínio ou direcionar rotas para APIs internas sem expor seu IP.
              </p>
            </div>
            <button onClick={() => onNavigate('Nginx')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ver Nginx & Tunnels <ArrowRight size={11} />
            </button>
          </div>

          {/* 7. Storage & Buckets */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <HardDrive size={16} /> 7. Storage & Backups OCI
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Controla os buckets de objetos na nuvem (<code>boteco-sivirino-fotos</code>) e os dumps diários do banco MySQL.<br/>
                <b>Quando usar:</b> Para auditar fotos de itens do cardápio, validar backups de segurança e garantir retenção de dados históricos.
              </p>
            </div>
            <button onClick={() => onNavigate('Storage')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ver Storage <ArrowRight size={11} />
            </button>
          </div>

          {/* 8. Monitoramento & Logs */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Activity size={16} /> 8. Monitoramento & Telemetria
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Intercepta erros HTTP (4xx e 5xx) enfrentados em tempo real por clientes ou administradores no Cardápio Digital ou Painel Admin, exibindo rota, parâmetros e traceback.<br/>
                <b>Quando usar:</b> Para descobrir problemas antes mesmo do cliente reclamar ou após lançar uma nova funcionalidade.
              </p>
            </div>
            <button onClick={() => onNavigate('Monitoramento & Logs')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ver Telemetria <ArrowRight size={11} />
            </button>
          </div>

          {/* 9. Migração Multi-Cloud */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <ArrowLeftRight size={16} /> 9. Migração Multi-Cloud
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Automatiza a mudança de provedor (da Oracle para Hostinger, AWS, DigitalOcean ou VPS própria). Calcula os tamanhos (~142 MB), gera automações Terraform e transfere MySQL e fotos com 1 clique.<br/>
                <b>Quando usar:</b> Se precisar de mais recursos, contingência ou quiser migrar sem ficar com o cardápio fora do ar.
              </p>
            </div>
            <button onClick={() => onNavigate('Migração Multi-Cloud')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ir para Migração <ArrowRight size={11} />
            </button>
          </div>

          {/* 10. Agente Odisseu AI */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Bot size={16} /> 10. Agente Odisseu AI (RAG)
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Assistente especialista alimentado por RAG e LangChain que conhece de cor toda a topologia da sua infraestrutura: portas, containers, scripts, arquitetura e histórico de deploys.<br/>
                <b>Quando usar:</b> Sempre que tiver uma dúvida técnica, quiser auxílio para debugar ou precisar de comandos específicos para a sua VM.
              </p>
            </div>
            <button onClick={() => onNavigate('Odisseu AI')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Falar com Odisseu <ArrowRight size={11} />
            </button>
          </div>

          {/* 11. VM Scraper */}
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '8px', border: '1px solid #142023', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#20d6c7', fontWeight: 700, fontSize: '13px', marginBottom: '8px' }}>
                <Zap size={16} /> 11. Robô VM Always Free
              </div>
              <p style={{ fontSize: '11.5px', color: '#8fa4a8', lineHeight: 1.6, margin: '0 0 10px 0' }}>
                <b>O que faz:</b> Robô autônomo que testa vagas de instâncias Always Free (Ampere A1 / Micro) na Oracle Cloud em loop assinado, superando a escassez de recursos e enviando aviso no WhatsApp.<br/>
                <b>Quando usar:</b> Quando você tentar criar uma máquina na Oracle e ela retornar o erro "Out of host capacity".
              </p>
            </div>
            <button onClick={() => onNavigate('VM Scraper')} style={{ background: '#0f1b1e', border: '1px solid #1a2f34', color: '#20d6c7', borderRadius: '4px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
              Ver VM Scraper <ArrowRight size={11} />
            </button>
          </div>

        </div>
      </section>

      {/* FAQ Acordeão */}
      <section className="panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', color: '#d9e2e1', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={16} style={{ color: '#20d6c7' }} /> Perguntas Frequentes (FAQ)
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx
            return (
              <div 
                key={idx}
                style={{ 
                  background: '#070a0c', 
                  border: '1px solid #142023', 
                  borderRadius: '6px', 
                  overflow: 'hidden' 
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: '#d9e2e1',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={14} style={{ color: '#20d6c7' }} /> : <ChevronDown size={14} style={{ color: '#6f8387' }} />}
                </button>
                {isOpen && (
                  <div style={{ padding: '0 16px 14px 16px', color: '#8fa4a8', fontSize: '11px', lineHeight: '1.6', borderTop: '1px solid #101a1c' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
