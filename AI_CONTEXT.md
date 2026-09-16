# 🤖 AI_CONTEXT.md — Documento de Contexto Mestre para Inteligências Artificiais

> **AVISO PARA NOVAS SESSÕES DE IA:**  
> Leia este documento antes de realizar qualquer ação. Ele contém o estado completo da infraestrutura, arquitetura de software, credenciais operacionais, topologia de rede, comandos de inicialização e decisões de design do ecossistema **CloudOps Hub**.  
> Você não precisa re-pesquisar todo o diretório nem pedir para o usuário reexplicar o projeto.

---

## 1. Visão Geral do Projeto (CloudOps Hub)

- **Propósito:** Plataforma DevOps Full-Stack moderna para gerenciar, monitorar, realizar deploys contínuos com zero-downtime, rollback em 1 clique, automação de GitFlow e provisionamento de infraestrutura na **Oracle Cloud Infrastructure (OCI)**.
- **Dono do Projeto:** Vinicius Lourenço (`ViniScooper`).
- **Repositório Oficial no GitHub:** [`https://github.com/ViniScooper/CloudOps_Hub.git`](https://github.com/ViniScooper/CloudOps_Hub.git) (branch `main`).
- **Diretório Raiz Local:** `C:\Users\vini\Documents\MY_VM_ORACLE`

---

## 2. Topologia da Infraestrutura Real (Oracle Cloud VM)

A máquina em produção é uma VM Ubuntu na nuvem Oracle, operando no tier Always Free:

| Parâmetro | Valor Operacional |
| :--- | :--- |
| **Nome da Instância** | `instance-bytedata` |
| **IP Público** | `137.131.185.243` |
| **Usuário SSH** | `ubuntu` |
| **Porta SSH** | `22` |
| **Chave SSH Privada Local** | `C:\Users\vini\Documents\CHAVES_SSH_ORACLE_HOJE\ssh-key-2026-02-20 (1).key` |
| **Processador** | AMD EPYC (1 Core / 2 Threads virtuais) |
| **Memória RAM Real** | 956 MB (1 GB físico) |
| **Memória Swap Ativa** | 2048 MB (2 GB Swap em SSD NVMe para proteger contra OOM) |
| **Armazenamento** | 45 GB NVMe (~15 GB em uso, ~28 GB livres) |
| **Sistema Operacional** | Ubuntu 22.04 LTS (Kernel Linux 5.15) |

### 2.1 Mapa de Portas e Containers em Produção na VM
| Porta Host | Serviço / Container | Tecnologia / Imagem | Função / Observação |
| :--- | :--- | :--- | :--- |
| `80` / `443` | `nginx-manager-nginx-1` | Nginx Alpine (Docker) | Proxy reverso principal, SSL/HTTPS |
| `3001` | `lottus-api` | Node.js (via PM2) | API leve (~14.7 MB RAM) |
| `3002` | `boteco_backend` | Node.js 20 (Docker) | Backend da API do Cardápio Digital |
| `3003` | `plataforma_ingles_api` | Node.js 18 (Docker) | API Plataforma de Inglês |
| `3306` | `boteco_db` | MySQL 8.0 (Docker) | Banco de dados MySQL |
| N/A | `boteco_tunnel` | Cloudflare `cloudflared` | Túnel seguro Cloudflare |

---

## 3. Arquitetura do Software (Monorepo)

O projeto local está organizado como um monorepo com duas aplicações principais:

```
C:\Users\vini\Documents\MY_VM_ORACLE\
├── AI_CONTEXT.md                     # [ESTE ARQUIVO] Contexto unificado para IAs
├── README.md                         # Documentação pública do repositório
├── .gitignore                        # Proteção estrita de chaves, senhas e .env
├── documentacoes/                    # Manuais de engenharia detalhados (00 a 06)
│   ├── 00_INDICE_GERAL.md
│   ├── 01_ARQUITETURA_E_INFRAESTRUTURA.md
│   ├── 02_GITFLOW_BRANCHES_E_PULL_REQUEST.md
│   ├── 03_DEPLOY_CONTINUO_ZERO_DOWNTIME.md
│   ├── 04_GERENCIAMENTO_DOCKER_E_LOGS.md
│   ├── 05_ROBO_PROVISIONAMENTO_ORACLE.md
│   └── 06_GUIA_RAPIDO_DO_DIA_A_DIA.md
├── cloud-ops-hub/                    # FRONTEND (Next.js 16 + React 19 + Tailwind CSS)
│   ├── app/                          # Rotas Next.js App Router (page.tsx, layout.tsx)
│   ├── components/                   # Componentes modulares do painel
│   │   ├── DashboardView.tsx         # Telemetria ao vivo da VM, RAM, CPU e Containers
│   │   ├── DeployView.tsx            # Pipeline GitFlow, Deploy SSH, Rollback e Ações
│   │   ├── DockerView.tsx            # Gerenciamento de containers, start/stop/restart/logs
│   │   ├── TerminalView.tsx          # Terminal web SSH interativo conectado à VM
│   │   ├── EnvView.tsx               # Gerenciador visual seguro de .env
│   │   ├── AutomationView.tsx        # Robô de busca de capacidade OCI (Ampere A1)
│   │   ├── HelpView.tsx              # Central de Ajuda, Primeiros Passos e FAQ
│   │   ├── GitSetupModal.tsx         # Modal de configuração e login do Git na VM em 1 clique
│   │   ├── CloneRepoModal.tsx        # Modal de clonar e rodar qualquer repo na VM
│   │   ├── RollbackModal.tsx         # Modal de reversão instantânea de deploy
│   │   ├── Sidebar.tsx               # Barra de navegação lateral
│   │   └── TopHeader.tsx             # Cabeçalho com status de conexão e botão de ajuda
└── cloud-ops-hub-backend/            # BACKEND (Fastify 5 + SSH2 + GitHub API + WhatsApp)
    ├── package.json
    ├── .env                          # Variáveis de ambiente (PORT, SSH key path, etc.)
    └── src/
        ├── server.js                 # Servidor Fastify e rotas da API
        ├── deployService.js          # Motor de SSH remoto, Git, deploys, rollback e histórico
        ├── githubService.js          # Integração GitHub API (PRs, auto-merge, status)
        └── oracleScraper.js          # Robô de automação OCI e alertas via WhatsApp
```

---

## 4. Rotas da API Backend (`cloud-ops-hub-backend`)

O backend roda em Fastify na porta `3005` (configurável via `PORT` no `.env`):

### Telemetria e Conexão SSH
* `GET  /api/health` — Verificação de saúde da API.
* `POST /api/servers/connect` — Conecta na VM via chave SSH, executa `free -m`, `df -h /`, `docker ps` e retorna telemetria em tempo real.
* `POST /api/servers/exec` — Executa qualquer comando bash remotamente na VM via SSH stream seguro.

### Pipeline de Deploy e Rollback
* `POST /api/deploy` — Executa deploy real com zero downtime via SSH (backup de segurança, `git pull`, build/restart, verificação de saúde).
* `POST /api/deploy/rollback` — Reverte instantaneamente a versão em produção para o backup anterior em 3 segundos.
* `GET  /api/deploy/history` — Retorna o histórico auditado de todos os deploys e rollbacks realizados.

### Git & Gerenciamento de Projetos na VM
* `POST /api/git/setup-vm` — Configura nome, email e autenticação com Personal Access Token (PAT) do GitHub direto na VM via SSH.
* `GET  /api/git/status-vm` — Verifica se o Git está instalado na VM e se há credenciais configuradas.
* `POST /api/projects/clone-and-launch` — Clona qualquer repositório Git na VM e o inicializa conforme a opção escolhida:
  * `docker`: Executa `docker compose up -d --build`
  * `pm2`: Executa `npm install && pm2 start`
  * `clone_only`: Apenas clona os arquivos sem executar comandos.

### GitHub API & GitFlow
* `POST /api/github/pull-request-merge` — Cria um Pull Request de `develop` para `main` e executa o auto-merge via GitHub REST API sem abrir o navegador.

### Variáveis de Ambiente e Logs
* `GET  /api/env` / `POST /api/env` — Leitura e gravação segura de variáveis de ambiente de projetos.
* `POST /api/docker/optimize-logs` — Configura rotação automática de logs do Docker em 50MB (máximo 3 arquivos) para evitar estouro de disco.

---

## 5. Regras Críticas de Operação e Segurança

### 5.1 Restrição de Memória RAM (Regra de Ouro)
* A máquina possui apenas **956 MB de RAM**.
* **Evite subir múltiplos containers pesados com Docker.**
* **Prefira PM2** para APIs Node.js (`~15 MB de RAM` vs `~150 MB do Docker`).
* O Swap de 2 GB garante estabilidade, mas não substitui a necessidade de manter processos leves.

### 5.2 Prevenção de Conflito de Portas (Proxy Reverso Nginx)
* **Portas 80 e 443** pertencem exclusivamente ao Nginx. Nenhum novo app deve tentar escutar nelas diretamente.
* **Portas já ocupadas:** `3001` (Lottus), `3002` (Boteco), `3003` (Inglês), `3306` (MySQL).
* **Novos projetos:** Devem usar portas `3004`, `3005`, `3006`, etc., e receber tráfego via Nginx:
  ```nginx
  server {
      server_name novoapp.seusite.com;
      location / {
          proxy_pass http://localhost:3004;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }
  }
  ```

### 5.3 Blindagem de Segurança Git
* **NUNCA** commitar arquivos com extensões `.key`, `.pem`, `.env`, nem arquivos `VM_DADPS*.TXT`. O `.gitignore` na raiz do repositório já está configurado para bloquear isso rigidamente.

---

## 6. Como Iniciar o Projeto Localmente

Se o computador for reiniciado ou uma nova sessão for aberta, os comandos para iniciar são:

### 1. Iniciar o Backend
```powershell
# No PowerShell / Terminal:
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub-backend
npm install    # (apenas se for a primeira vez ou novas libs)
npm run dev    # Roda com nodemon na porta 3005
```

### 2. Iniciar o Frontend
```powershell
# Em outro terminal:
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub
npm install    # (apenas se for a primeira vez)
npm run dev    # Roda o Next.js na porta 3000
```

### 3. Teste de Tipagem TypeScript
```powershell
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub
npx tsc --noEmit   # Deve retornar código de saída 0 sem erros
```

---

## 7. Decisões Arquiteturais Recentes & Último Estado

1. **Central de Ajuda Integrada:** O componente `HelpView.tsx` foi criado contendo:
   - Passo a passo visual de conexão, Docker, Deploy, GitFlow e Rollback.
   - Comparativo interativo entre Docker Compose, PM2 e Modo Apenas Clonar.
   - Guia de prevenção de conflitos de portas com Nginx Proxy Reverso.
   - Botões de ação rápida para abrir modais de configuração de Git e clonagem de repositório.
2. **Modais de Ação Rápida:**
   - `GitSetupModal.tsx`: Permite ao usuário cadastrar usuário/PAT do GitHub na VM sem precisar rodar comandos manuais.
   - `CloneRepoModal.tsx`: Permite clonar qualquer repositório Git na VM e escolher rodar via Docker, PM2 ou Apenas Clonar.
3. **Auditoria de Deploy:** Implementado em `deployService.js` com persistência em `deploy_history.json`.

---
*Documento mantido e gerado para sincronização de agentes de IA e engenharia contínua.*
