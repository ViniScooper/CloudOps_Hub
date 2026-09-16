'use client'

import React, { useState } from 'react'
import { 
  CircleHelp, BookOpen, Rocket, Shield, Container, Terminal, HardDrive, 
  Zap, CheckCircle2, ArrowRight, RotateCcw, GitPullRequest, ExternalLink, 
  HelpCircle, MessageSquare, AlertCircle, ChevronDown, ChevronUp, Lock, Globe
} from 'lucide-react'

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
      title: 'Conectar ao seu Servidor',
      icon: Shield,
      desc: 'O CloudOps Hub conecta na sua VM via SSH seguro (porta 22) usando chaves criptografadas em memória. Nenhuma porta precisa ser aberta publicamente.',
      actionLabel: 'Ver Dashboard',
      targetTab: 'Dashboard'
    },
    {
      num: '02',
      title: 'Gerenciar Containers Docker',
      icon: Container,
      desc: 'Visualize status ao vivo, portas mapeadas e consumo de RAM. Inicie, pare ou reinicie qualquer serviço e visualize logs em tempo real com diagnóstico.',
      actionLabel: 'Abrir Docker',
      targetTab: 'Docker'
    },
    {
      num: '03',
      title: 'Deploy em 1-Clique & Rollback',
      icon: Rocket,
      desc: 'Atualize aplicações direto do Git com Zero Downtime. Se surgir qualquer problema em produção, aperte Rollback para voltar à versão estável em 3 segundos.',
      actionLabel: 'Ir para Deploy',
      targetTab: 'Deploy'
    },
    {
      num: '04',
      title: 'GitFlow & Pull Request Automático',
      icon: GitPullRequest,
      desc: 'Trabalhe na branch develop e mescle para a main direto pelo painel sem precisar abrir o site do GitHub.',
      actionLabel: 'Ver GitFlow',
      targetTab: 'Deploy'
    },
    {
      num: '05',
      title: 'Robô de VM Always Free (Oracle)',
      icon: Zap,
      desc: 'Contorne o erro "Out of host capacity" da Oracle Cloud. O robô testa vagas em loop assinado pela API OCI e te avisa no WhatsApp assim que conseguir.',
      actionLabel: 'Ver VM Scraper',
      targetTab: 'VM Scraper'
    },
    {
      num: '06',
      title: 'Terminal Web SSH Integrado',
      icon: Terminal,
      desc: 'Execute comandos diretamente no Linux da VM pelo navegador (no computador ou celular), dispensando o uso de PuTTY ou MobaXterm.',
      actionLabel: 'Abrir Terminal',
      targetTab: 'Terminal'
    }
  ]

  const faqs = [
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
            1. Programe na branch <code>develop</code> no seu VS Code local.<br/>
            2. Dê <code>git push origin develop</code>.<br/>
            3. No CloudOps Hub, vá na aba <b>Deploy</b> e clique em <b>"Fazer Pull Request & Merge"</b> (a <code>main</code> será atualizada).<br/>
            4. Clique em <b>"Fazer Deploy Agora"</b> para subir a nova versão na VM sem queda.<br/>
            5. Se surgir qualquer bug em produção, use o botão <b>Rollback</b> para voltar imediatamente.
          </div>
        )}

        {selectedRole === 'devops' && (
          <div style={{ background: '#070a0c', padding: '16px', borderRadius: '6px', border: '1px solid #142023', fontSize: '12px', lineHeight: '1.7', color: '#a2b3b6' }}>
            <strong style={{ color: '#20d6c7', display: 'block', marginBottom: '6px' }}>Rotina do DevOps & Segurança:</strong>
            1. Monitore a saúde da VM pelo <b>Dashboard</b> (mantenha a RAM abaixo de 85% e o swap controlado).<br/>
            2. Na aba <b>Docker</b>, clique em <b>"Otimizar Logs Docker"</b> para garantir a rotação de 50 MB e proteger o disco.<br/>
            3. Verifique se o container <code>boteco_tunnel</code> está ativo para garantir tráfego seguro pela Cloudflare.<br/>
            4. Inspecione logs de containers problemáticos usando o ícone de Lupa com diagnóstico automático.
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
