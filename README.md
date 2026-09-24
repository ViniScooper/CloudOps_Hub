# 🚀 CloudOps Hub — Self-Hosted Multi-Cloud DevOps Control Plane

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-BSL_1.1_%7C_Commercial_Protection-e11d48.svg?style=for-the-badge&logo=shield&logoColor=white" alt="License: BSL 1.1 / Commercial Protection" /></a>
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-Zero_Downtime-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Multi--Cloud-Oracle_%7C_AWS_%7C_Hostinger-orange?style=for-the-badge" alt="Multi-Cloud" />
  <img src="https://img.shields.io/badge/AI_Copilot-Odisseu_RAG-8b5cf6?style=for-the-badge&logo=openai&logoColor=white" alt="Odisseu AI" />
  <img src="https://img.shields.io/badge/Access-Request_Only-blue?style=for-the-badge" alt="Access: Request Only" />
</p>

<p align="center">
  <b>A lightweight, high-performance web console for multi-cloud infrastructure orchestration, real-time Docker management, automated CI/CD deployments, AI-driven DevOps assistance (Odisseu AI), and telemetry error tracking without vendor lock-in.</b>
</p>

<p align="center">
  🌐 <b>Production Web Console:</b> <a href="https://cloudops-hub-dun.vercel.app/" target="_blank">https://cloudops-hub-dun.vercel.app/</a>
</p>

> ### 🔒 Solicitação de Acesso & Ajuda com Instalação
> **Quer testar ou instalar o CloudOps Hub na sua infraestrutura (Oracle Cloud, Hostinger, AWS ou VPS própria)?**  
> Para garantir estabilidade, segurança e evitar conflitos em máquinas de baixa memória (1 GB RAM), o acesso e instalação assistida são liberados diretamente pelo autor:  
> 📩 **Solicite seu acesso / Agende auxílio de instalação:** Envie um e-mail para **[vviniciuslourenco@gmail.com](mailto:vviniciuslourenco@gmail.com)** com o assunto `[CloudOps Hub] Solicitação de Acesso` ou mande mensagem direta no [GitHub](https://github.com/ViniScooper).

---

## ⚡ Overview

**CloudOps Hub** replaces bulky, expensive, and fragmented enterprise tools (Portainer, Coolify, Datadog) with a unified, ultra-responsive developer command plane built for indie hackers, DevOps engineers, and agile software teams.

Manage cloud VMs (**Oracle Cloud Infrastructure**, **Hostinger**, **AWS EC2**, or bare-metal VPS), monitor containers, inspect production logs, trigger automated 1-click CI/CD GitFlow deployments with instant rollbacks, and consult **Odisseu AI** (an autonomous DevOps copilot backed by LangChain RAG) with a host memory footprint of **less than 50 MB RAM**.

Available in English and Portuguese (PT-BR).

---

## ✨ Key Features & New Capabilities

### 🚀 1. Continuous Deployment & GitFlow Automation (SSH-Driven)
* **1-Click Pull Request & Branch Merging:** Merge `develop` or `hotfix` branches directly into `main` with a single click without opening the GitHub web portal.
* **1-Click Zero-Downtime Deploy:** Connects securely over SSH to trigger atomic Git pulls, dependency installations, and container/process reloads.
* **Instant 1-Click Rollback:** If a deployment fails or causes production regressions, roll back to the previous stable release commit with one click.
* **Live Deployment Streaming Console:** Stream physical bash pipeline outputs and build steps in real time directly inside the browser.
* **Comprehensive Audit Trail:** Full logging of every deploy and rollback (timestamp, project name, branch, commit hash, commit message, author, duration, and status).
* **Git Auto-Configuration:** Automatically set up Git, Deploy Keys, and clone new repositories from GitHub directly into any target VM.

### ☁️ 2. Multi-Cloud Migration Workspace (Zero-Downtime • 1-Click)
* **Real-Time Stack Detection:** Automatically discovers what is actually running on your connected VM (Docker microservices, MySQL 8.0, Object Storage, Nginx, or systemd services).
* **Clean State Intelligence:** Fresh or virginal VMs report zero active projects cleanly, eliminating misleading mock data.
* **1-Click Multi-Cloud Migration:** Automated cutover between Oracle Cloud (OCI), AWS EC2, and VPS providers (Hostinger, Hetzner, DigitalOcean) with automated Terraform script generation.

### 🤖 3. Odisseu AI — Autonomous DevOps & SRE Copilot
* **LangChain RAG Architecture:** Retrieval-Augmented Generation indexed on your live infrastructure state, hardware metrics, container status, and telemetry.
* **Multi-Provider LLM Engine:** Native support for Groq Cloud (GPT-120B / Llama 3.3 70B), Google Gemini, and local Ollama runtimes.
* **Hardware & Quota Diagnostics:** Real-time token quota tracking, CPU/RAM thresholds, swap memory monitoring, and port collision analysis.
* **Interactive Troubleshooting:** Ask questions like *"O que está rodando na VM?"*, *"Como otimizar a memória?"*, or *"Analise os erros dos últimos 15 minutos"*.

### ⚡ 4. Real-Time Telemetry & Hardware Optimization
* **Live Hardware Metrics:** Real-time CPU usage, Memory (used/total), Disk NVMe, and SSH port 22 connectivity status.
* **1-Click RAM Cache Purge (`drop_caches`):** Safely release inactive Linux kernel page caches, dentries, and inodes without restarting containers or interrupting active connections.
* **Zero Overhead:** Metrics are gathered on-demand via lightweight SSH commands rather than heavy persistent background daemons.

### 🌐 5. Vercel & Render Cloud Integrations
* **Vercel Edge & Frontend:** Real-time visibility into production edge builds, domains, commit references, and deployment status.
* **Render Backend & Anti-Sleep Heartbeats:** Monitor backend microservices on Render and configure automated cron heartbeats to prevent free-tier instances from going to sleep.

### 🐳 6. Visual Docker Orchestration & Full Lifecycle Control
* **Complete Lifecycle Management:** Start (▶️), Stop (⏹️), and Restart (🔄) microservices directly from the web or mobile interface without SSHing manually into the machine.
* **Live Streaming Logs:** Inspect real-time stdout/stderr streams (`docker logs --tail 100 --timestamps`) with instant search, syntax highlighting, and 1-click clipboard copying.
* **Automatic Log Rotation (`max-size: 10m`):** 1-click Docker daemon log configuration to prevent disk exhaustion from unmanaged container outputs.

### 🐕 7. 24/7 SRE Guard Watchdog & WhatsApp Alerts
* **Autonomous Telemetry Loop:** Periodic background monitor running every 3 minutes directly on the primary Oracle VM (`instance-bytedata`).
* **Critical Memory Thresholds:** Automatically detects if physical RAM usage hits or exceeds **90%** and triggers an emergency alert to prevent Linux Out-Of-Memory (OOM) killer crashes.
* **Service Crash Detection:** Monitors critical production containers (`boteco_tunnel`, `boteco_db`, `nginx-manager-nginx-1`) and alerts immediately if any microservice exits or disappears.
* **Anti-Flood Cooldown:** Smart rate limiting (15 to 30 min cooldown) via CallMeBot WhatsApp API and email notifications.
* **Dashboard Widget:** Live watchdog health badge with a 1-click `[ 🧪 Testar WhatsApp ]` verification button.

### 💾 8. Automated MySQL 8.0 Backups & Gzip Retention
* **Zero-Downtime Database Dumps:** Generates transactional MySQL dumps (`boteco_db`) piped on the fly to `gzip -9`, producing compact `.sql.gz` archives in `/home/ubuntu/backups/`.
* **Rolling 7-Day Retention:** Automatically purges dumps older than 7 days (`find -mtime +7 -delete`) to conserve NVMe storage on Always Free cloud instances.
* **1-Click Snapshot:** Instant snapshot trigger directly from the dashboard and Storage Explorer.

### 👥 9. Master Admin Approvals & Multi-Tenant Isolation
* **Role-Based Access Control (RBAC):** Master superuser account (`Vinicius Lourenco - vviniciuslourenco@gmail.com`) with total cluster management.
* **Tenant Isolation:** New users access a pristine 0-server workspace with a guided 1-click onboarding flow, keeping production VMs strictly private.
* **1-Click Access Approval:** Master dashboard displays pending access requests with applicant details, automatically generates secure random temporary passwords (`CloudOps#<HEX>!`), activates user accounts, dispatches welcome emails with direct login links, and notifies via WhatsApp.
* **AES-256-GCM Server Persistence:** Newly attached VMs/VPS are encrypted with AES-256-GCM (including 16-byte random IVs and authentication tags) in MySQL (`user_servers`) and persisted across sessions without exposing private keys.

### 🏛️ 10. Multi-VM Cluster & Oracle Autonomous Database (ATP)
* **Multi-Node Switching:** Fast topbar context switcher toggling between `instance-bytedata` (2 OCPUs · 1GB RAM) and `cloudops-micro-02` (1 OCPU · 1GB (+1GB Swap)).
* **Oracle ATP Integration:** Direct monitoring and 1-click launch of Oracle Autonomous Transaction Processing (Exadata 20GB NVMe, mTLS :1522) with SQL Developer Web Console.
* **Cloudflare Zero Trust Anycast:** Tunnel bridge (`trycloudflare.com`) eliminating open inbound ports on the cloud firewall.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    User["👨‍💻 DevOps Engineer / Developer (Desktop & Mobile)"] -->|HTTPS / WSS| HubUI["🖥️ CloudOps Hub Frontend (Next.js 16 + React 19)"]
    
    subgraph EdgeLayer["Edge & Security Layer"]
        HubUI -->|Anycast Zero Trust Tunnel| CFTunnel["🛡️ Cloudflare Zero Trust Tunnel"]
        CFTunnel -->|Reverse Proxy :3005| HubAPI["⚙️ Fastify Backend Engine (PM2 on VM)"]
        HubAPI -->|Alerts & Notifications| CallMeBot["📲 WhatsApp (CallMeBot) & Email Gateway"]
    end
    
    subgraph HubEngine["Control Plane & Daemons"]
        HubAPI -->|RAG Knowledge Base| Odisseu["🤖 Odisseu AI Copilot (LangChain + Groq/Gemini)"]
        HubAPI -->|24/7 Health Monitoring| Watchdog["🐕 24/7 SRE Watchdog (RAM >90% & Crash Guard)"]
        HubAPI -->|Backup Pipeline| BackupEngine["💾 Gzip MySQL Dumps (/home/ubuntu/backups)"]
        HubAPI -->|RBAC & AES-256| AuthEngine["🔐 Multi-Tenant Vault (user_servers AES-256-GCM)"]
    end
    
    subgraph TargetCluster["Connected Multi-Cloud Fleet"]
        HubAPI -->|Local Fastify / SSH| VM1["☁️ Node 1: instance-bytedata (137.131.185.243)"]
        HubAPI -->|Zero-Trust SSH| VM2["☁️ Node 2: cloudops-micro-02 (137.131.187.54)"]
        HubAPI -->|mTLS :1522 / Wallet| ATP["⚡ Oracle Autonomous Database (ATP Exadata 20GB)"]
        
        VM1 --> DockerEngine["🐳 Docker Microservices (boteco_backend, boteco_db, boteco_tunnel)"]
        VM1 --> NginxIngress["🌐 Nginx Reverse Proxy (80/443)"]
        VM1 --> PM2Daemon["⚡ PM2 Process Manager (lottus-api, cloudops-hub)"]
    end
```

---

## 📁 Repository Structure

```text
├── cloud-ops-hub/             # Frontend Client (Next.js 16, React 19, Tailwind CSS 4, Cyber-Teal UI)
│   ├── app/                   # App Router views (layout, page, login, global styling)
│   ├── components/            # Modular dashboard views:
│   │   ├── DashboardView.tsx         # Real-time infrastructure, cluster switcher & Watchdog widget
│   │   ├── UserManagementView.tsx    # Master admin approval panel & user management
│   │   ├── DeployView.tsx            # CI/CD pipelines, GitFlow PR & instant rollback
│   │   ├── OdisseuChatView.tsx       # AI Copilot with RAG telemetry context
│   │   ├── MigrationWorkspaceView.tsx# Multi-Cloud migration & stack inspector
│   │   ├── VercelDeploymentsView.tsx # Edge frontend status & deployments
│   │   ├── RenderDeploymentsView.tsx # Backend services & anti-sleep crons
│   │   ├── StorageExplorerView.tsx   # Oracle Object Storage & MySQL Gzip Backups
│   │   ├── EnvManagerView.tsx        # Secure environment variables manager
│   │   └── HelpView.tsx              # Documentation & quick onboarding
│   └── lib/                   # API clients, auth helpers, and encryption utilities
│
├── cloud-ops-hub-backend/     # Automation & Telemetry Engine (Fastify + SSH)
│   ├── src/
│   │   ├── server.js                 # API Gateway, routes & middleware
│   │   ├── dockerService.js          # Lifecycle control (start, stop, restart, live logs)
│   │   ├── watchdogService.js        # 24/7 RAM and container health monitoring
│   │   ├── backupService.js          # Automated MySQL dumps & 7-day gzip rotation
│   │   ├── userManagementService.js  # Access requests, 1-click approvals & credentials
│   │   ├── userServerService.js      # AES-256-GCM encrypted SSH server persistence
│   │   ├── ragKnowledgeBase.js       # Semantic RAG index for Odisseu AI
│   │   └── deployService.js          # Remote SSH execution & Git pipelines
│   ├── database/              # Telemetry logs, audit trails, and server registries
│   └── test_suite_e2e.js      # End-to-end automated testing suite
│
└── documentacoes/             # Comprehensive technical guides & architecture manuals (00 to 11)
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **Git**: v2.30.0 or higher
* **Target Server**: Any Linux VM (Ubuntu, Debian, CentOS) with SSH access

### 2. Clone Repository
```bash
git clone https://github.com/ViniScooper/CloudOps_Hub.git
cd CloudOps_Hub
```

### 3. Start Backend Engine
```bash
cd cloud-ops-hub-backend
npm install
node src/server.js
# Backend API active on http://localhost:3005
```

### 4. Start Frontend Console
```bash
cd ../cloud-ops-hub
npm install
npm run dev
# Dashboard accessible on http://localhost:3000
```

---

## 🔒 Security & Privacy

* **No Hardcoded Credentials:** Private SSH keys, API tokens, and passwords are never tracked in Git.
* **Encrypted Credential Vault:** All sensitive inputs are kept strictly in client-side memory or encrypted local storage via AES-256.
* **Self-Hosted Privacy:** Telemetry and deployment audits are saved locally on your server. No analytical telemetry is transmitted to third parties.

---

## 🇧🇷 Sobre o Projeto (Resumo em Português)

O **CloudOps Hub** é uma plataforma brasileira de console unificado de DevOps, infraestrutura multi-cloud e gerenciamento de containers Docker.

Desenvolvido para oferecer a desenvolvedores solo, startups e equipes ágeis o mesmo nível de controle de soluções corporativas (Portainer, Coolify, Datadog), porém com **consumo de memória ultrabaixo (< 50MB RAM)** e foco em custo zero — rodando perfeitamente em instâncias *Always Free* da **Oracle Cloud**, **Hostinger**, **AWS** ou qualquer VPS Linux.

### Principais Diferenciais:
1. **Deploy Contínuo 1-Clique com Rollback:** Merge de PRs e deploys atômicos via SSH sem derrubar conexões ativas.
2. **Migração Multi-Cloud:** Detecta serviços em execução na VM e gera scripts Terraform para migrar entre provedores em 1 clique.
3. **Copiloto Odisseu AI:** Assistente de DevOps autônomo com LangChain RAG integrado à telemetria real do seu servidor.
4. **Otimização Ativa de Memória:** Botão para liberar cache inativo do kernel Linux (`drop_caches`) instantaneamente.
5. **Monitoramento Integrado:** Suporte a Vercel Frontend, Render Backend (com cron anti-sleep) e Oracle Object Storage.

---

## 🤝 Contributing

Contribuições, correções e sugestões de novas funcionalidades são muito bem-vindas!

1. Fork o Projeto (`https://github.com/ViniScooper/CloudOps_Hub/fork`)
2. Crie uma Branch para sua Feature (`git checkout -b feature/MinhaNovaFeature`)
3. Faça Commit das suas alterações (`git commit -m 'feat: Adiciona MinhaNovaFeature'`)
4. Faça Push para a Branch (`git push origin feature/MinhaNovaFeature`)
5. Abra um Pull Request

---

## 📄 Licença & Propriedade Intelectual

Este projeto está protegido sob **Licença de Software Proprietário com Restrição Comercial**.
* **Copyright © 2026 José Vinícius Lourenço Marques de Sousa.** Todos os direitos reservados.
* **Proibição Comercial Estrita:** É expressamente proibida a venda, revenda, exploração comercial ou distribuição deste software sem autorização formal por escrito e contrato com o autor.
* Para mais detalhes, consulte o arquivo [`LICENSE`](./LICENSE).

Desenvolvido com dedicação por [Vinicius Lourenço](https://github.com/ViniScooper).
