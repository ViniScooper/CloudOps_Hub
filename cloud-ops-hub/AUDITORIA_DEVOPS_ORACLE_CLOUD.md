# Relatório de Auditoria Técnica & Recomendações de Arquitetura Sênior
**Projeto:** CloudOps Hub / Infraestrutura Multi-Cloud  
**Alvo:** VM Oracle Cloud (`instance-bytedata` - `137.131.185.243`)  
**Data:** 14 de Setembro de 2026  
**Arquiteto:** Cloud & DevOps Master Architect  

---

## 1. Diagnóstico e Alocação de Recursos (Current State)

### 1.1 Mapeamento de Recursos do Host
* **CPU / Arquitetura Atual:** Provavelmente `VM.Standard.E2.1.Micro` (1 OCPU AMD EPYC, 1GB RAM) — perfil básico do Always Free da Oracle Cloud.
* **Memória RAM:**
  * **Total:** 956 MB
  * **Uso Base:** ~378 MB em repouso
  * **Disponível Real:** ~578 MB (Margem crítica de folga)
* **Swap:**
  * **Total:** 2.0 GB (Configuração preventiva já ativa, salvando o kernel de OOM instantâneo, porém com alto custo de I/O de disco caso entre em thrashing).
* **Armazenamento:**
  * **Disco NVMe/Block Storage:** 45 GB total (15 GB usados / 30 GB livres — ~33% de ocupação). Folga segura para logs e dados locais a curto/médio prazo.

### 1.2 Inventário de Cargas de Trabalho (Workloads)
1. **`boteco_backend`**: Node.js 20 (Motor V8, gerência de heap automática, suscetível a saltos bruscos de memória sob concorrência).
2. **`boteco_db`**: MySQL 8.0 Oficial (Altamente voraz por padrão; o `innodb_buffer_pool_size` default reserva centenas de MBs se não parametrizado explicitamente).
3. **`boteco_tunnel`**: Cloudflare Zero Trust Daemon (`cloudflared` em Go; leve, ~25–45 MB de RAM).
4. **`nginx-manager-nginx-1`**: Reverse Proxy Nginx (Event-driven, levíssimo, <15 MB de RAM).
5. **`plataforma_ingles_api`**: Node.js 18 + cliente Supabase (Pós-conexão HTTP/Websocket, consumo médio de 40–80 MB).
6. **`lottus-api`**: Gerenciado via PM2 (Possível Node.js adicional; cada processo Node.js consome no mínimo 35–60 MB de RSS inicial).

---

## 2. Riscos Críticos & Gargalos Arquiteturais

### 2.1 Risco Extremo de OOM (Out Of Memory) Killer
* **Problema:** Um host Linux com apenas **956 MB de RAM física** executando **3 runtimes Node.js + 1 daemon PM2 + MySQL 8.0 + Nginx + Cloudflared** opera na borda do colapso térmico de memória.
* **Mecanismo de Falha:**
  * O **MySQL 8.0** aloca threads por conexão, caches de tabela e pools de buffer. Sob uma consulta pesada ou pico de requisições concorrentes no `boteco_backend`, a demanda por RAM excede a memória física.
  * O sistema começa a paginar em **Swap (2GB)**. Devido à latência de leitura/gravação no Block Volume, o I/O Wait dispara para >70%, congelando a CPU.
  * O Kernel Linux ativa o **`oom-killer`**. Pelo algoritmo de pontuação (`oom_score`), os processos com maior footprint de RSS (geralmente `mysqld` ou `node`) são sumariamente terminados com `SIGKILL`.

### 2.2 Exposição e Vetores de Ataque (Zero Trust vs. Portas Abertas)
* Se o túnel **Cloudflare Zero Trust (`cloudflared`)** já está operacional para direcionar o tráfego externo para o Nginx/Backends:
  * **Portas 80/443 e portas de aplicação NÃO devem estar abertas para a Internet pública (`0.0.0.0/0`)** na Security List da VCN ou nas regras do `iptables`/`ufw` do host.
  * O SSH (porta 22) **jamais** deve ficar com autenticação por senha e, idealmente, deve ser acessado via Cloudflare Access SSH ou restrito ao IP do administrador / Bastion.

### 2.3 Resiliência de Dados e RPO/RTO de Bancos
* O container `boteco_db` mantém seus dados no volume local da VM.
* Sem uma rotina automatizada e isolada que execute `mysqldump` com criptografia e faça push imediato para o **Oracle Object Storage (OCI Bucket)**, qualquer perda de bloco ou deleção acidental de volume resultará em perda irrecuperável de dados.

---

## 3. Plano de Otimização e Prevenção Imediata (VM 1GB)

### 3.1 Otimização Cirúrgica do MySQL 8.0 (`my.cnf`)
Crie ou injete um arquivo de configuração personalizada para o container `boteco_db` (ex: `/etc/mysql/conf.d/low-ram.cnf`):

```ini
[mysqld]
# Reduz o buffer pool de InnoDB para acomodar a máquina de 1GB
innodb_buffer_pool_size = 64M
innodb_log_buffer_size = 4M
innodb_redo_log_capacity = 16M

# Limita threads e conexões simultâneas
max_connections = 30
max_connect_errors = 10
thread_cache_size = 4

# Reduz buffers por conexão
key_buffer_size = 8M
table_open_cache = 200
table_definition_cache = 200
sort_buffer_size = 256K
read_buffer_size = 128K
read_rnd_buffer_size = 256K
join_buffer_size = 256K

# Desativa Performance Schema para economizar ~150MB a 200MB de RAM imediata
performance_schema = OFF
```
> [!IMPORTANT]
> Apenas a desativação do `performance_schema` no MySQL 8.0 libera imediatamente entre **120 MB e 220 MB de RAM física**, garantindo sobrevida imediata à VM.

### 3.2 Imposição de Resource Limits no Docker Compose
Sem limites declarados (`deploy.resources.limits`), os containers competem sem controle. Configure limites no `docker-compose.yml`:

```yaml
version: '3.8'

services:
  boteco_db:
    image: mysql:8.0
    deploy:
      resources:
        limits:
          memory: 280M
        reservations:
          memory: 150M

  boteco_backend:
    deploy:
      resources:
        limits:
          memory: 180M
    environment:
      # Otimização da Heap do Node.js
      - NODE_OPTIONS=--max-old-space-size=128

  plataforma_ingles_api:
    deploy:
      resources:
        limits:
          memory: 150M
    environment:
      - NODE_OPTIONS=--max-old-space-size=110

  lottus-api:
    deploy:
      resources:
        limits:
          memory: 150M

  boteco_tunnel:
    deploy:
      resources:
        limits:
          memory: 64M

  nginx-manager-nginx-1:
    deploy:
      resources:
        limits:
          memory: 32M
```

### 3.3 Ajuste Fino do Kernel para Swap (`swappiness` e `vfs_cache_pressure`)
Para evitar que o Linux pagine agressivamente em Swap antes de precisar:
```bash
# Executar no host Ubuntu
sudo sysctl vm.swappiness=15
sudo sysctl vm.vfs_cache_pressure=50

# Persistir em /etc/sysctl.d/99-memory-tuning.conf
echo "vm.swappiness = 15" | sudo tee -a /etc/sysctl.d/99-memory-tuning.conf
echo "vm.vfs_cache_pressure = 50" | sudo tee -a /etc/sysctl.d/99-memory-tuning.conf
```

---

## 4. Oportunidade Estratégica: Migração para Ampere A1 (Always Free)

A Oracle Cloud oferece no programa Always Free a arquitetura ARM **`VM.Standard.A1.Flex`** com:
* Até **4 OCPUs**
* Até **24 GB de RAM**
* Até **200 GB de Block Volume** sem nenhum custo mensal.

### Benefícios Diretos:
1. **Fim do risco de OOM:** Passar de 1GB para 12GB ou 24GB elimina qualquer gargalo de memória.
2. **Performance Multi-Thread:** 4 cores dedicados ARM Neoverse N1 superam em mais de 4x o micro core AMD E2.
3. **Compatibilidade dos Stacks:**
   * Node.js 18 e 20 possuem suporte nativo de alta performance a `linux/arm64`.
   * MySQL 8.0 e Cloudflared compilam e rodam perfeitamente em ARM64.
   * Nginx roda nativamente com menor consumo de ciclos de instrução.

---

## 5. Matriz de Ação e Recomendações por Prioridade

| Prioridade | Ação Recomendada | Impacto |
| :--- | :--- | :--- |
| **ALTA** | **Desativar `performance_schema` no MySQL 8.0** e limitar buffer pool a 64M. | Libera ~200MB de RAM imediatamente, evitando OOM Killer. |
| **ALTA** | **Limitar Heap do Node.js (`--max-old-space-size`)** nos containers backend. | Impede que o garbage collector do Node deixe o heap expandir até derrubar a máquina. |
| **ALTA** | **Backup Automatizado para OCI Object Storage** via cronjob + CLI OCI/Rclone com criptografia gpg. | Garante RPO < 24h para o banco de dados do Boteco. |
| **MÉDIA** | **Enrijecimento de Rede / Zero Trust:** Fechar portas 80/443 e de bancos na VCN Security List, deixando entrada unicamente via Cloudflare Tunnel. | Blindagem completa contra scanners de IP e ataques de força bruta. |
| **MÉDIA** | **Ajustar `vm.swappiness=15`** no kernel do host para mitigar disco thrashing. | Reduz latência de I/O em momentos de consumo pontual. |
| **BAIXA / EVOLUTIVA** | **Provisionar VM Ampere A1 Flex (4 OCPUs / 24GB RAM)** via Terraform ou console OCI e migrar stacks via Docker Compose. | Salto quântico de estabilidade, permitindo novos microsserviços sem custo adicional. |
