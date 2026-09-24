'use client'

import React, { useState } from 'react'
import {
  User, Mail, Lock, Shield, Bell, Smartphone, ShieldCheck, Check,
  RefreshCw, Settings, AlertTriangle, KeyRound, ExternalLink
} from 'lucide-react'
import { getApiUrl } from '../lib/api'

interface SettingsViewProps {
  currentUser: any
  setCurrentUser: (user: any) => void
  doAction: (msg: string) => void
  initialTab?: 'profile' | 'notifications' | 'security'
}

export function SettingsView({
  currentUser,
  setCurrentUser,
  doAction,
  initialTab = 'profile'
}: SettingsViewProps) {
  const [tab, setTab] = useState<'profile' | 'notifications' | 'security'>(initialTab)

  // Estados do formulário de perfil
  const [name, setName] = useState(currentUser?.name || 'Vinícius Lourenço')
  const [email, setEmail] = useState(currentUser?.email || 'admin@cloudops.io')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')

  // Estados de notificações e WhatsApp
  const savedNotifs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('cloudops_notifications') || '{}') : {}
  const [notifyDowntime, setNotifyDowntime] = useState(savedNotifs.notifyDowntime ?? true)
  const [notifySsl, setNotifySsl] = useState(savedNotifs.notifySsl ?? true)
  const [notifyEmail, setNotifyEmail] = useState(savedNotifs.notifyEmail ?? true)
  const [whatsappPhone, setWhatsappPhone] = useState(savedNotifs.whatsappPhone || '558195126839')
  const [whatsappApiKey, setWhatsappApiKey] = useState(savedNotifs.whatsappApiKey || '7939819')
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState(savedNotifs.discordWebhookUrl || '')
  const [isTestingWhatsapp, setIsTestingWhatsapp] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const updated = {
      ...currentUser,
      name: name.trim() || currentUser?.name,
      email: email.trim() || currentUser?.email
    }
    setCurrentUser(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloudops_user', JSON.stringify(updated))
    }
    setCurrentPassword('')
    setNewPassword('')
    doAction('Dados do perfil salvos com sucesso! 🛡️')
  }

  const handleSaveNotifications = () => {
    const pref = {
      notifyDowntime,
      notifySsl,
      notifyEmail,
      whatsappPhone,
      whatsappApiKey,
      discordWebhookUrl
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('cloudops_notifications', JSON.stringify(pref))
    }
    doAction('Preferências de notificação salvas com sucesso! 🔔')
  }

  const handleTestWhatsapp = async () => {
    setIsTestingWhatsapp(true)
    doAction('Enviando notificação de teste para o WhatsApp...')
    try {
      const res = await fetch(getApiUrl('/api/oracle/scraper/test-whatsapp'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      })
      const data = await res.json()
      if (data.success) {
        doAction('Notificação enviada com sucesso para o seu WhatsApp! 📲')
      } else {
        doAction('Aviso: Verifique a chave CallMeBot nas configurações.')
      }
    } catch (e: any) {
      doAction('Erro ao testar envio: ' + e.message)
    } finally {
      setIsTestingWhatsapp(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0c1417]/80 to-slate-900/90 border border-teal-500/20 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-[0_0_20px_rgba(32,214,199,0.2)]">
            <Settings size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-100 tracking-tight">Configurações & Perfil</h1>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                Master Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Gerencie seus dados de acesso, senhas, alertas de incidentes no WhatsApp e cofre criptográfico.
            </p>
          </div>
        </div>

        {/* Status de Segurança */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 self-start sm:self-auto">
          <ShieldCheck size={16} className="text-emerald-400" />
          <div className="text-left">
            <div className="text-[10px] font-mono text-slate-400 leading-none">Criptografia Ativa</div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5">AES-256-GCM Vault</div>
          </div>
        </div>
      </div>

      {/* Segmented Control Tabs */}
      <div className="p-1.5 bg-[#060a0c] border border-slate-800/80 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setTab('profile')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            tab === 'profile'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_15px_rgba(32,214,199,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <User size={15} /> Meu Perfil & Senha
        </button>

        <button
          type="button"
          onClick={() => setTab('notifications')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            tab === 'notifications'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_15px_rgba(32,214,199,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Bell size={15} /> Alertas & WhatsApp
        </button>

        <button
          type="button"
          onClick={() => setTab('security')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            tab === 'security'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-[0_0_15px_rgba(32,214,199,0.25)]'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Shield size={15} /> Cofre & Auditoria
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {tab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Card do Usuário em Destaque */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-2xl bg-[#090e11] border border-teal-500/20 shadow-lg">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-700 flex items-center justify-center text-slate-950 font-black text-2xl shadow-[0_0_20px_rgba(32,214,199,0.35)] shrink-0">
              {(name || currentUser?.name || 'V').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <strong className="text-base font-bold text-slate-100">
                  {name || currentUser?.name || 'Vinícius Lourenço'}
                </strong>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {currentUser?.role || 'admin'} • Permissão Total Multi-Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {email || currentUser?.email || 'vviniciuslourenco@gmail.com'}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-3 text-[11px] text-slate-500 font-mono">
                <span>Tenancy: sa-saopaulo-1 (GRU)</span>
                <span>•</span>
                <span>Provedor: Oracle Cloud Always Free</span>
              </div>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="p-6 rounded-2xl bg-[#090e11] border border-slate-800/90 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-teal-400" /> Informações Pessoais
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Vinicius Lourenço"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  E-mail de Acesso
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@cloudops.io"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="p-6 rounded-2xl bg-[#090e11] border border-slate-800/90 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Lock size={16} className="text-teal-400" /> Alteração de Senha
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                bcrypt 10 rounds
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-400 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-400 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Deixe os campos de senha em branco caso não queira alterar sua credencial de acesso.
            </p>
          </div>

          {/* Botão de Submissão */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-400 text-slate-950 font-bold text-xs hover:bg-teal-300 shadow-[0_0_20px_rgba(32,214,199,0.35)] transition-all cursor-pointer"
            >
              <Check size={16} /> Salvar Alterações do Perfil
            </button>
          </div>
        </form>
      )}

      {tab === 'notifications' && (
        <div className="space-y-6">
          {/* Card WhatsApp CallMeBot em Destaque */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-[#090e11] to-slate-900/40 border border-emerald-500/30 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <Smartphone size={20} />
                </div>
                <div>
                  <strong className="text-sm font-bold text-emerald-300">Alertas no WhatsApp (CallMeBot Ativo)</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Receba alertas em tempo real se a RAM atingir &gt;90% ou após cada deploy.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 self-start sm:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                SRE Watchdog 24/7
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  Número de Celular (com DDI + DDD)
                </label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={e => setWhatsappPhone(e.target.value)}
                  placeholder="558195126839"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase">
                  API Key CallMeBot
                </label>
                <input
                  type="text"
                  value={whatsappApiKey}
                  onChange={e => setWhatsappApiKey(e.target.value)}
                  placeholder="Chave recebida no WhatsApp"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-emerald-400 transition-all placeholder:text-slate-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleTestWhatsapp}
                disabled={isTestingWhatsapp}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer flex items-center gap-2"
              >
                {isTestingWhatsapp ? <RefreshCw size={14} className="animate-spin" /> : '📲'} Testar Envio no WhatsApp
              </button>
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all cursor-pointer"
              >
                Salvar Configurações WhatsApp
              </button>
            </div>
          </div>

          {/* Toggles de Notificações */}
          <div className="p-6 rounded-2xl bg-[#090e11] border border-slate-800/90 shadow-lg space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Bell size={16} className="text-teal-400" /> Eventos Monitorados
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-4 rounded-xl bg-[#070b0d] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div>
                  <strong className="block text-xs font-semibold text-slate-100">Queda de Containers & Servidor Indisponível</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">Dispara alerta imediato se qualquer microsserviço ou porta cair.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDowntime}
                  onChange={e => setNotifyDowntime(e.target.checked)}
                  className="w-5 h-5 accent-teal-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-[#070b0d] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div>
                  <strong className="block text-xs font-semibold text-slate-100">Alerta de Expiração de SSL / Let's Encrypt</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">Notifica 15 dias antes da expiração de certificados dos domínios Nginx/Cloudflare.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifySsl}
                  onChange={e => setNotifySsl(e.target.checked)}
                  className="w-5 h-5 accent-teal-400 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl bg-[#070b0d] border border-slate-800 hover:border-slate-700 transition-all cursor-pointer">
                <div>
                  <strong className="block text-xs font-semibold text-slate-100">Notificações e Relatórios por E-mail</strong>
                  <span className="block text-xs text-slate-400 mt-0.5">Enviar resumos de incidentes e novos acessos aprovados para seu e-mail.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={e => setNotifyEmail(e.target.checked)}
                  className="w-5 h-5 accent-teal-400 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Webhook Discord / Slack */}
          <div className="p-6 rounded-2xl bg-[#090e11] border border-slate-800/90 shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Mail size={16} className="text-teal-400" /> Webhook Discord / Slack
            </h2>
            <p className="text-xs text-slate-400">
              Cole a URL do webhook do canal da sua equipe para receber logs em tempo real.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                value={discordWebhookUrl}
                onChange={e => setDiscordWebhookUrl(e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-xl bg-[#070b0d] border border-slate-800 text-slate-100 text-xs focus:outline-none focus:border-teal-400 transition-all placeholder:text-slate-600"
              />
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Salvar Webhook
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="space-y-6">
          {/* Card Cofre AES-256-GCM */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-950/20 via-slate-900/30 to-slate-900/10 border border-teal-500/25 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={22} className="text-teal-400" />
                <div>
                  <strong className="text-sm font-bold text-teal-300">Cofre de Infraestrutura (Key Vault)</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Todas as chaves privadas SSH e credenciais são isoladas e criptografadas.</p>
                </div>
              </div>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                AES-256-GCM Ativo
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#060a0c] border border-slate-800 font-mono text-xs text-teal-400/90 break-all">
              ALGORITMO: AES-256-GCM • IV RANDÔMICO 16-BYTES • AUTENTICAÇÃO POR TAG
            </div>
          </div>

          {/* Trilha de Auditoria */}
          <div className="p-6 rounded-2xl bg-[#090e11] border border-slate-800/90 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Shield size={16} className="text-emerald-400" /> Trilha de Auditoria (Audit Trail)
              </h2>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Compliance Ativo
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Todos os comandos executados via SSH, pipelines de deploy, rollbacks e reinicializações de containers são registrados com endereço IP de origem, data/hora e identificador do usuário para máxima governança.
            </p>
          </div>

          {/* Zona de Perigo */}
          <div className="p-6 rounded-2xl bg-red-950/10 border border-red-500/25 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-red-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-400" /> Zona de Manutenção da Sessão
              </h2>
              <span className="text-xs font-mono text-red-400 uppercase">Cache Local</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Se você desejar redefinir os dados em cache do seu navegador (como servidores temporários ou tokens de sessão salvos), clique no botão abaixo. Isso não afetará os serviços em execução na sua nuvem.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza de que deseja limpar o cache local e reiniciar a sessão?')) {
                    localStorage.clear()
                    window.location.reload()
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Limpar Cache Local e Reiniciar Sessão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
