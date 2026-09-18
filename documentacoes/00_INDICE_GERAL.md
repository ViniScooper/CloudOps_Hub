# 📚 CloudOps Hub — Índice e Central de Documentação

Seja bem-vindo à documentação oficial e completa do **CloudOps Hub** e da infraestrutura da sua **VM na Oracle Cloud (OCI)**.

Esta pasta contém todos os manuais técnicos, arquiteturais e guias passo a passo para operar e evoluir o sistema com total segurança.

---

## 🗂️ Sumário dos Documentos

| Arquivo | Descrição |
| :--- | :--- |
| **[01. Arquitetura e Infraestrutura](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/01_ARQUITETURA_E_INFRAESTRUTURA.md)** | Raio-X completo da VM na Oracle Cloud, especificações, containers, portas e segurança Zero Trust. |
| **[02. GitFlow, Branches e Pull Request](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/02_GITFLOW_BRANCHES_E_PULL_REQUEST.md)** | Guia completo de branches (`main`, `develop`, `hotfix`), fluxo de trabalho no VS Code e Pull Request automático. |
| **[03. Deploy Contínuo e Zero Downtime](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/03_DEPLOY_CONTINUO_ZERO_DOWNTIME.md)** | Como funciona a atualização em 1 clique do Boteco Sivirino (Docker) e da Lottus API (PM2) sem derrubar clientes. |
| **[04. Gerenciamento Docker e Logs](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/04_GERENCIAMENTO_DOCKER_E_LOGS.md)** | Diagnóstico de containers, visualizador de logs, editor de `.env` e rotação para blindagem de disco. |
| **[05. Robô de Provisionamento Oracle](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/05_ROBO_PROVISIONAMENTO_ORACLE.md)** | Como opera o bot de auto-provisionamento de instâncias OCI Always Free com alerta no WhatsApp. |
| **[06. Guia Rápido do Dia a Dia](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/06_GUIA_RAPIDO_DO_DIA_A_DIA.md)** | Cheatsheet prático: comandos rápidos, passo a passo para novas funcionalidades e como subir o sistema local. |
| **[07. Agente Odisseu RAG & LangChain](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/07_AGENTE_ODISSEU_RAG_LANGCHAIN.md)** | Copiloto de nuvem inteligente com RAG dinâmico, Function Calling, telemetria ao vivo e auto-failover. |
| **[08. Migração Multi-Cloud & Tunnels](file:///C:/Users/vini/Documents/MY_VM_ORACLE/documentacoes/08_MIGRACAO_MULTICLOUD_E_TUNNELS.md)** | Guia completo de migração zero downtime 1-clique (Hostinger, Hetzner, AWS) e túneis Cloudflare Zero Trust. |

---

## 🚀 Como Inicializar a Plataforma Localmente

### 1. Iniciar o Backend de Automação:
```powershell
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub-backend
node src/server.js
# Servidor Fastify ativo na porta 3005 (http://localhost:3005)
```

### 2. Iniciar o Frontend Web:
```powershell
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub
pnpm dev
# Painel Next.js disponível em: http://localhost:3000
```
