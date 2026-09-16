# 🚀 CloudOps Hub - Plataforma Unificada de Gestão de Servidores & Cloud

> Um painel web moderno, leve e completo para gerenciamento de servidores Linux (VMs Oracle, AWS, DigitalOcean), containers Docker, Nginx Proxy Reverso, API Gateways, Bancos de Dados / DBA (MySQL e Oracle DB/RMAN), automações Terraform e Object Storage — tudo com métricas em tempo real, segurança militar e acessível pelo PC ou celular (PWA).

---

## 📌 1. Visão Geral do Produto (A Ideia)

Hoje, desenvolvedores, agências e equipes de tecnologia enfrentam uma fragmentação caótica de ferramentas para gerenciar seus servidores:
* **MobaXterm / Termius / JuiceSSH** para comandos via terminal SSH manual.
* **Portainer** para gerenciar containers Docker (pesado, consome 150-250 MB de RAM).
* **Nginx Proxy Manager** para configurar domínios e certificados SSL.
* **Kong / Apigee** para gerenciar rotas de APIs, tokens e Rate Limiting.
* **Grafana / Prometheus / Datadog** para métricas (complexos de configurar, comem muita memória e são caríssimos em dólar).
* **Painel Web da Oracle / AWS** para ver redes, firewalls, métricas ou gerenciar Buckets (lentos, confusos e péssimos no celular).
* **Scripts manuais no terminal** para rodar backups, consultas DBA (RMAN, Datafiles) e Terraform.

O **CloudOps Hub** resolve isso unificando tudo em uma única aplicação web responsiva (PWA). O usuário cria uma conta, cadastra sua VM informando o IP e a chave privada SSH (armazenada de forma criptografada em um cofre AES-256-GCM), e tem controle absoluto na palma da mão sem digitar uma única linha de comando.

---

## 🎨 2. Design System & Identidade Visual

* **Tema:** Dark Mode Nativo de Alto Contraste (Cyberpunk / Sci-Fi Minimalista).
* **Paleta Oficial (Cyber Teal & Carbon):**
  * Canvas (Fundo Geral): #080B0D (Carvão Profundo)
  * Superfícies & Cards: #101719
  * Bordas Sutis: #182326
  * Ciano Principal (Ações/Destaque): #20D6C7
  * Status Saudável (Online/Up): #A3E635 (Lime Neon)
  * Status Alerta (RAM alta/Warning): #F4B942 (Âmbar)
  * Status Erro (Falha/Down): #FF6B6B (Coral Carmim)
  * Texto Principal: #D9E2E1
  * Texto Muted: #6F8387
* **Fontes:** Inter / Geist Sans (Interface) e JetBrains Mono (Métricas, IPs, Portas e Terminal).

---

## 🎯 3. Módulos e Funcionalidades Detalhadas

### 🔐 Módulo 1: Autenticação, Multi-Tenancy & Multi-Cloud
* **Cadastro e Login:** Autenticação segura com JWT e suporte nativo a 2FA (Google Authenticator / TOTP).
* **Multi-Servidores & Multi-Cloud:** Seletor rápido no topo da aplicação para alternar instantaneamente entre servidores da **Oracle Cloud (OCI)**, **AWS (EC2)** ou VPS própria.
* **Cofre de Credenciais (Key Vault):** Chaves SSH (.pem / .key) criptografadas no banco via **AES-256-GCM**.

---

### 📊 Módulo 2: Dashboard de Métricas ao Vivo (Substituto de Datadog / Grafana)
* **Métricas em Tempo Real via WebSocket (Ultra Leve - consome apenas ~25 MB na VM):**
  * **CPU:** Uso em tempo real por núcleo e média geral.
  * **Memória RAM:** Gauge visual com RAM física usada, livre e buffer de cache.
  * **Swap:** Monitoramento de paginação para prevenir travamentos catastróficos (OOM).
  * **Disco:** Consumo de /dev/sda1 e volumes extras montados.
  * **I/O de Rede:** Taxa de download e upload em KB/s em tempo real.
* **Processos Ativos:** Visualização dinâmica estilo htop dos processos que mais consomem recursos.

---

### 🐳 Módulo 3: Gerenciador Visual de Docker (Substituto de Portainer)
* **Painel de Containers:** Status ao vivo (🟢 Rodando, 🟡 Unhealthy, 🔴 Parado), portas mapeadas e consumo individual de RAM/CPU.
* **Ações em 1 Clique:** Iniciar (Play ▶️), Parar (Stop ⏹️) e Reiniciar (Restart 🔄) sem abrir terminal.
* **Live Logs Viewer:** Console com streaming de logs em tempo real (docker logs -f), busca e limpeza.
* **Editor de .env:** Edição visual de variáveis de ambiente sem risco de corromper arquivos.

---

### 🌐 Módulo 4: Nginx Proxy Reverso & Gestão de Domínios
* **Interface Gráfica de Proxy Hosts:** Apontar domínios e subdomínios (ex: pi.meudominio.com) para portas de containers locais (ex: 3002) em 1 clique.
* **SSL Automático (Let's Encrypt):** Criação e renovação automática de HTTPS com redirecionamento forçado de HTTP para HTTPS.
* **Regras Customizadas:** Cabeçalhos CORS, suporte a WebSockets e ajuste de limites de upload (client_max_body_size).

---

### 🚦 Módulo 5: API Gateway Integrado
* **Roteamento Centralizado:** Unifica várias APIs (/boteco/*, /ingles/*, /usuarios/*) sob um único domínio e porta.
* **Rate Limiting Visual:** Protege as APIs e a CPU da VM bloqueando requisições abusivas e ataques de força bruta por IP.
* **Gestão de API Keys:** Criação, controle e revogação de tokens de acesso para clientes.
* **Analytics de APIs:** Gráficos de requisições por minuto (RPM), status codes (200, 400, 500) e latência em milissegundos.
* **Cache de Resposta em Memória:** Aceleração de rotas estáticas sem consultar o banco de dados.

---

### 🗄️ Módulo 6: Bancos de Dados & Hub DBA (MySQL + Oracle DB / RMAN)
* **Bancos MySQL (Docker / VM):**
  * Backups com 1 clique (geração de mysqldump comprimido e upload automático para o Object Storage).
  * Mini-visualizador de tabelas, contagem de registros e executor de queries rápidas.
* **Oracle Database & RMAN Hub:**
  * **Monitor RMAN:** Histórico de execuções de backup, status (Sucesso/Falha), tempo gasto e tamanho. Botão para disparar backup RMAN imediato.
  * **Monitor de Tablespaces & Datafiles (.dbf):** Barras de progresso de espaço usado vs livre por Tablespace com alerta de perigo e botão de resize.
  * **Métricas do Banco:** Monitor de sessões ativas/travadas (Locks) com opção de Kill Session e gráfico de divisão de memória SGA/PGA.

---

### 📦 Módulo 7: Object Storage (Buckets da Nuvem)
* **Navegador de Buckets:** Listagem de buckets da Oracle Cloud com status de visibilidade (Público/Privado) e capacidade.
* **File Explorer:** Navegação por pastas, visualizador de fotos em galeria, upload por **Drag & Drop** e botão para copiar URLs públicas.

---

### ⚡ Módulo 8: Terminal Web SSH Embutido
* Terminal interativo embutido no navegador via **xterm.js**.
* Atalhos completos para uso pelo teclado do celular ou PC.
* Dispensa totalmente o uso de PuTTY, MobaXterm ou JuiceSSH.

---

### 🛡️ Módulo 9: Redes, Firewalls & Segurança na Nuvem (VCN / Security Lists)
* **Firewall da Nuvem (Security Lists / Network Security Groups na Oracle e AWS):**
  * Visualização de todas as regras de entrada (Ingress Rules) e saída (Egress Rules) da VCN.
  * **Abertura e Fechamento de Portas na Nuvem em 1 Clique:** Formulário visual para liberar portas (ex: 80, 443, 3001-3005, 3306) diretamente no firewall da Oracle Cloud via Terraform, sem navegar por dezenas de páginas da OCI.
* **Firewall Local do Sistema Operacional (UFW / Iptables):**
  * Tabela de portas ativas em escuta (LISTEN).
  * Botões rápidos para habilitar/desabilitar tráfego por porta.
* **Diagnóstico Duplo Inteligente:** Alerta se a porta estiver aberta no Linux mas bloqueada na nuvem da Oracle.

---

### 🛠️ Módulo 10: Automação Total com Terraform (Infra as Code Low-Code)
* **Criação de Infraestrutura via Formulários:** Criação de novos Buckets, novas VMs ou novas regras de rede. O Hub gera o arquivo .tf e aplica.
* **Terraform Studio Embutido:** Editor web de código .tf para desenvolvedores avançados com botões de [ Plan ], [ Apply ], [ State View ] e [ Destroy ].
* **Rastreabilidade de Estado:** Histórico e integridade via 	erraform.tfstate.

---

### 🔔 Módulo 11: Alertas Inteligentes & Notificações
* Notificações em tempo real via Webhooks para **Telegram**, **Discord** e **WhatsApp**.
* Alertas configuráveis para: RAM > 85%, queda de containers Docker, falha de backup RMAN ou MySQL e disco > 90%.

---

## 🔒 4. Arquitetura de Segurança & Blindagem (Zero-Trust)

Como a aplicação lida com chaves de acesso, comandos de servidor e infraestrutura na nuvem, o sistema é arquitetado em **5 camadas de proteção**:

### 1. Cofre de Chaves SSH (Key Vault) com AES-256-GCM
* **Criptografia Militar em Repouso:** Nenhuma chave .pem ou .key é salva em texto plano.
* Cada chave é protegida com **AES-256-GCM**, exigindo uma chave mestra (*Master Key*) derivada do ambiente do backend, com **IV único** e *Auth Tag* anti-adulteração para cada registro.
* **Descriptografia Apenas em Memória RAM:** A chave só é lida na memória no momento exato do aperto de mão SSH e é imediatamente descartada pelo coletor de lixo do Node.js.

### 2. Autenticação Reforçada & Prevenção de Ataques
* **2FA Obrigatório (MFA):** Suporte a códigos de 6 dígitos baseados em tempo (TOTP via Google Authenticator / 1Password).
* **JWT de Vida Curta (15 min) + Refresh Tokens:** Sessões expiradas automaticamente se o navegador for esquecido aberto.
* **Proteção contra Força Bruta (Rate Limiting):** Bloqueio automático de IP por 15 minutos após 5 tentativas de login com falha.

### 3. Conexão Segura & Zero Portas Expostas
* **Roteamento via Cloudflare Tunnel (Zero Trust):**
  * O painel **não precisa abrir portas perigosas na VM** (como 3000 ou 8080) para o mundo.
  * O tráfego passa pelo túnel da Cloudflare, garantindo **HTTPS/SSL automático**, mascaramento de IP real e mitigação contra ataques DDoS.
* **WebSockets com Criptografia (WSS):** Toda a transmissão de métricas e comandos do terminal (xterm.js) viaja sobre canais criptografados de ponta a ponta (wss://).

### 4. Isolamento do Terminal Web & Auditoria
* O terminal web utiliza sessões PTY isoladas com o usuário padrão da VM (ubuntu). Não há uso de funções vulneráveis como eval() ou comandos diretos de shell inseguro.
* **Audit Trail (Logs de Auditoria):** Cada ação sensível (reiniciar banco, deletar bucket, rodar terraform) é registrada com data, hora, IP de origem e usuário responsável.

### 5. Blindagem dos Bancos de Dados & Terraform State
* Os bancos de dados (MySQL e Oracle) **NÃO ficam expostos à internet pública**. Todas as consultas administrativas e rotinas RMAN são executadas internamente via rede privada ou túnel SSH local.
* O arquivo 	erraform.tfstate é mantido sob permissões estritas de sistema (chmod 600) para proteger credenciais de infraestrutura.

---

## 🏛️ 5. Arquitetura Técnica Recomendada

`
                                 [ DISPOSITIVOS ]
                     💻 PC Desktop / Notebook  |  📱 Celular (PWA)
                                        │
                                        │ (HTTPS / WSS Seguro via Cloudflare)
                                        ▼
                           [ FRONTEND (Vite + React) ]
            • Tailwind CSS (Paleta Cyber Teal & Carbon) + Lucide Icons
            • Recharts (Métricas ao vivo) + xterm.js (Terminal Web)
            • PWA (Instalável no celular como aplicativo nativo)
                                        │
                                        │ (API REST / WebSocket)
                                        ▼
                         [ BACKEND (Node.js / Fastify) ]
            • Fastify (Ultra rápido, baixa latência e consumo mínimo de RAM)
            • Prisma ORM + PostgreSQL / SQLite Criptografado
            • Node-SSH / ssh2 (Conexões seguras com as VMs cadastradas)
            • Dockerode (Comunicação direta com o Docker Engine)
                                        │
         ┌──────────────────┬───────────┴──────────┬──────────────────┐
         ▼                  ▼                      ▼                  ▼
 [ VM DO USUÁRIO ]   [ DOCKER & NGINX ]   [ BANCOS & RMAN ]   [ CLOUD (OCI / AWS) ]
• Métricas (/proc)  • Containers Docker   • MySQL Dumps       • Terraform runner
• Portas e UFW      • Proxy Reverso & SSL • Oracle DB Metrics • VCN & Security Lists
• Terminal SSH      • API Gateway         • RMAN Backups      • Object Storage
`

---

## 💎 6. Potencial de Negócio (SaaS)

Esse projeto se posiciona como uma alternativa definitiva e moderna às ferramentas legadas:
* **Frente ao Portainer:** Muito mais leve, bonito, moderno e com gerenciamento de nuvem e buckets embutido.
* **Frente ao Datadog / Grafana:** Custo zero, sem agentes pesados consumindo a memória da VM e com capacidade de interagir e reiniciar serviços direto no painel.
* **Frente ao Painel da Oracle / AWS:** Velocidade instantânea, sem menus labirínticos e desenhado sob medida para ser perfeito na tela do celular.
