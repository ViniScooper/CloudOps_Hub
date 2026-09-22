# 🖥️ Documento 01: Arquitetura & Infraestrutura da VM Oracle

Este documento detalha as especificações da máquina virtual na **Oracle Cloud Infrastructure (OCI)** e como os serviços estão distribuídos.

---

## 1. Dados do Cluster e Nós da Infraestrutura (Always Free)

### Nó Primário: `instance-bytedata`
* **Provedor:** Oracle Cloud Infrastructure (OCI) - Always Free
* **Região:** `sa-saopaulo-1` (São Paulo, Brasil - Datacenter GRU)
* **IP Público:** `137.131.185.243` | **IP Privado:** `10.0.0.224`
* **Sistema Operacional:** Ubuntu 22.04.5 LTS (Jammy Jellyfish)
* **Arquitetura de CPU:** x86_64 (AMD EPYC 7551 32-Core, 2 vCPUs)
* **Memória RAM Física:** 956 MB (+ 2.0 GB Swap NVMe)
* **Disco:** 45 GB NVMe (`/dev/sda1`)
* **Papel:** Host do Backend CloudOps Hub (PM2 porta 3005), Túnel Cloudflare, Nginx e Containers Docker (`boteco_backend`, `boteco_db`).

### Nó Secundário: `cloudops-micro-02`
* **Provedor:** Oracle Cloud Infrastructure (OCI) - Always Free
* **Região:** `sa-saopaulo-1` (São Paulo, Brasil - Datacenter GRU)
* **IP Público:** `137.131.187.54` | **IP Privado:** `10.0.0.125`
* **Especificações:** 1 OCPU · 956 MB RAM (+ 1.0 GB Swap montado) · 50 GB NVMe
* **Papel:** Nó de redundância e borda com Nginx Proxy ativo nas portas 80 e 443.

### Banco de Dados Gerenciado: Oracle Autonomous Database (ATP)
* **Nome do Banco:** `CLOUDOPSHUB`
* **Tipo:** Autonomous Transaction Processing (ATP) - Exadata PDB
* **Especificações:** 1 OCPU · 20 GB Armazenamento NVMe Autônomo · Always Free
* **Segurança:** mTLS criptografado na porta 1522 com Wallet Oracle
* **Console Web:** Oracle SQL Developer Web Console integrado
* **Status:** `AVAILABLE` (Ativo na nuvem OCI)

---

## 2. Mapa de Conexões e Serviços

```text
                                [ INTERNET PÚBLICA ]
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     [ Cloudflare Global Edge ]                      [ Vercel CDN & Edge ]
  (cardapio.botecosivirino.com.br)                   (botecosivirino.com.br)
                 │
                 │ (Túnel Criptografado Zero Trust)
                 ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │                           VM ORACLE CLOUD                              │
  │                                                                        │
  │  1. boteco_tunnel (cloudflared)                                        │
  │     └─ Encaminha requisições com SSL direto para o container Node.js   │
  │                                                                        │
  │  2. boteco_backend (Docker - Porta Host 3002 -> Container 3001)        │
  │     └─ API Node.js/Express do Cardápio Digital                         │
  │                                                                        │
  │  3. boteco_db (Docker - Porta Host 3306 -> Container 3306)             │
  │     └─ Banco MySQL 8.0 ('restaurante')                                 │
  │                                                                        │
  │  4. nginx-manager-nginx-1 (Docker - Portas 80 e 443)                   │
  │     └─ Reverse Proxy com terminação SSL                                │
  │                                                                        │
  │  5. lottus-api (Gerenciado via PM2 no Host - Porta 3001)               │
  │     └─ Consome apenas ~15 MB de RAM física                             │
  │                                                                        │
  │  6. plataforma_ingles_api (Docker - Porta Host 3003 -> Container 3002) │
  │     └─ Integrado com o Supabase Cloud                                  │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tabela de Portas da VM

| Porta | Serviço / Container | Protocolo | Função |
| :--- | :--- | :--- | :--- |
| **22** | SSH (`sshd`) | TCP | Acesso administrativo remoto à VM |
| **80 / 443** | Nginx Reverse Proxy | HTTP / HTTPS | Roteamento de domínios públicos |
| **3001** | `lottus-api` (PM2) | HTTP Local | API corporativa rodando no host |
| **3002** | `boteco_backend` (Docker) | HTTP Local | API do Cardápio Digital |
| **3003** | `plataforma_ingles_api` | HTTP Local | Microsserviço de idiomas |
| **3306** | `boteco_db` (MySQL 8.0) | MySQL | Banco de dados relacional |
| **20241/20242** | Cloudflare Tunnel | WSS / TLS | Comunicação do túnel Anycast seguro |

---

## 4. Nuvem & Armazenamento (Object Storage & Terraform)

* **Namespace OCI:** `gr88wz9mdro0`
* **Bucket Ativo:** `boteco-sivirino-fotos`
* **Visibilidade:** `ObjectRead` (acesso público para leitura das imagens do cardápio)
* **URL Pública do Bucket:**
  `https://objectstorage.sa-saopaulo-1.oraclecloud.com/n/gr88wz9mdro0/b/boteco-sivirino-fotos/o/`
* **Automação Terraform na VM:**
  Localizado no diretório `/home/ubuntu/terraform-bucket/` para provisionamento declarativo.
