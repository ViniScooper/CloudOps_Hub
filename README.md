# 🚀 CloudOps Hub — Self-Hosted Multi-Cloud DevOps Control Plane

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-teal.svg?style=for-the-badge" alt="License: MIT" />
  <img src="https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Node.js-20_LTS-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Docker-Zero_Downtime-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Multi--Cloud-Oracle_%7C_AWS_%7C_Hostinger-orange?style=for-the-badge" alt="Multi-Cloud" />
  <img src="https://img.shields.io/badge/Open_Source-PRs_Welcome-20d6c7?style=for-the-badge" alt="Open Source" />
</p>

<p align="center">
  <b>A lightweight, high-performance, open-source web console for multi-cloud infrastructure orchestration, real-time Docker management, automated CI/CD deployments, and telemetry error tracking without vendor lock-in.</b>
</p>

---

## ⚡ Overview

**CloudOps Hub** replaces bulky, fragmented enterprise tools with a unified, responsive developer console built for indie hackers, DevOps engineers, and agile teams. Manage cloud VMs (Oracle Cloud Infrastructure, Hostinger, AWS, or bare-metal VPS), monitor containers, inspect production logs, run 1-click zero-downtime deploys, and detect runtime errors with minimal CPU and memory footprint on the host.

Available in English and Portuguese (PT-BR).

---

## ✨ Key Features

* 🌐 **Multi-Cloud & VPS Control:** Seamlessly switch between cloud instances, monitor RAM/CPU/Disk usage, and plan server migrations across providers in 1-click.
* 🚀 **1-Click Zero-Downtime Deployments:** Trigger atomic Git production builds directly over secure SSH without dropping live user connections.
* ⏪ **Instant Rollback:** Revert instantly to the previous stable release hash with a single click if production anomalies occur.
* 🔍 **Real-Time Telemetry & Error Tracking:** Monitor system health, track HTTP 4xx/5xx failures, and inspect stack traces without polling overhead.
* 🐳 **Interactive Docker Orchestrator:** Inspect live container metrics, restart crashed microservices, view filtered stdout/stderr logs, and enforce 50MB log rotation to prevent VM disk saturation.
* 🤖 **Odisseu AI Copilot:** Integrated DevOps AI assistant to troubleshoot errors, analyze telemetry, and guide infrastructure upgrades.
* 🛡️ **Zero Trust & Reverse Proxy:** Configure Cloudflare Tunnels and inspect Nginx reverse proxy mappings with automatic SSL handling.
* 📱 **Instant Alerts:** Real-time push notifications for deployments, container crashes, and background scheduler events.

---

## 🏛️ Architecture

```mermaid
flowchart TD
    User["👨‍💻 DevOps / Developer (Desktop or Mobile PWA)"] -->|HTTPS / WSS| HubUI["🖥️ CloudOps Hub Frontend (Next.js 16 + React 19)"]
    HubUI -->|REST API :3005| HubAPI["⚙️ CloudOps Hub Core Backend (Node.js)"]
    
    subgraph Services["Core Automation & Telemetry"]
        HubAPI -->|Telemetry Collector| LogEngine["📊 Error & Log Analyzer"]
        HubAPI -->|Git Automation| GitEngine["🐙 GitHub GitFlow Engine"]
        HubAPI -->|Security Tunnels| CloudflareEngine["🛡️ Cloudflare Zero Trust"]
    end

    subgraph Infrastructure["Target Cloud Fleet (SSH :22)"]
        HubAPI -->|SSH Pipeline| OCI["☁️ Oracle Cloud (Always Free VM)"]
        HubAPI -->|SSH Pipeline| VPS["🏢 Hostinger / VPS / Bare-Metal"]
        HubAPI -->|SSH Pipeline| AWS["🟧 AWS EC2 Instance"]
        
        OCI --> DockerFleet["🐳 Docker Microservices (Zero Downtime)"]
        OCI --> NginxProxy["🌐 Nginx Ingress & SSL"]
    end
```

---

## 📁 Repository Structure

```text
├── cloud-ops-hub/             # Frontend Client (Next.js 16, React 19, Tailwind CSS 4, Cyber-Teal UI)
│   ├── app/                   # Next.js App Router and core views
│   ├── components/            # Modular dashboard views (Deploy, Docker, Telemetry, Storage, Tunnels)
│   └── public/                # Static assets, manifests, and icons
│
├── cloud-ops-hub-backend/     # Automation & Telemetry Engine
│   ├── src/                   # Server, deploy pipelines, SSH adapters, and log parsers
│   └── database/              # Telemetry logs, deploy audit trails, and server registries
│
└── documentacoes/             # Step-by-step architecture, guide, and operational manuals
```

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** or **pnpm** installed
* **Git** installed

### 2. Clone Repository
```bash
git clone https://github.com/ViniScooper/CloudOps_Hub.git
cd CloudOps_Hub
```

### 3. Start Backend Service
```bash
cd cloud-ops-hub-backend
npm install
node src/server.js
# API running on http://localhost:3005
```

### 4. Start Frontend Console
```bash
cd ../cloud-ops-hub
npm install
npm run dev
# Dashboard running on http://localhost:3000
```

---

## 🔒 Security & Privacy

* **Zero-Knowledge Credentials:** Private SSH keys (`.key` / `.pem`), API tokens, and production secrets are never committed to git. All sensitive parameters are injected strictly via local environment variables (`.env`).
* **Self-Hosted:** Your data stays entirely on your own servers. Telemetry and deployment logs are stored locally in your instance.

---

## 🇧🇷 Sobre o Projeto (Resumo em Português)

O **CloudOps Hub** é uma plataforma open-source brasileira de gerenciamento unificado de infraestrutura em nuvem e containers Docker. Criado para oferecer aos desenvolvedores e pequenas equipes a mesma agilidade de ferramentas corporativas (Portainer, Coolify, Datadog), porém com baixíssimo consumo de memória e foco em custo zero (compatível com máquinas Always Free da Oracle Cloud, Hostinger e AWS).

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/ViniScooper/CloudOps_Hub/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

Developed with ❤️ by [Vinicius Lourenço](https://github.com/ViniScooper).
