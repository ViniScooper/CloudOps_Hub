# ⚙️ Documento 11: Guardião Watchdog 24/7, Ciclo Docker & Backups MySQL

Este documento descreve a suíte de resiliência, automação de saúde e backups contínuos do **CloudOps Hub**.

---

## 1. Guardião Watchdog 24/7 (SRE Autônomo)

O **Watchdog** é um serviço proativo executado em background no Node.js/Fastify da VM `instance-bytedata`, com intervalo de checagem a cada **3 minutos**.

### 1.1 Verificações de Saúde
1. **Memória RAM Física**:
   - Analisa `free -m`.
   - Se o uso da RAM física atingir ou superar **90%**, dispara um alerta de urgência no WhatsApp do administrador.
   - Recomenda a execução da limpeza de caches de página inativos (`drop_caches`).
2. **Containers Críticos em Execução**:
   - Monitora se os containers essenciais estão no estado `Up`:
     - `boteco_tunnel`: Túnel Anycast Cloudflare Zero Trust (elimina portas abertas).
     - `boteco_db`: Banco de dados MySQL 8.0 do Cardápio Digital.
     - `nginx-manager-nginx-1`: Proxy reverso HTTP/HTTPS.
   - Caso algum container seja finalizado (`Exited`) ou desapareça, dispara alerta imediato:
     `🚨 [CloudOps Watchdog] Container CRÍTICO caiu: boteco_tunnel!`

### 1.2 Regras de Cooldown Inteligente
Para evitar sobrecarga de notificações no celular do operador:
* Alertas de RAM alta possuem cooldown de **30 minutos**.
* Alertas de containers inativos possuem cooldown de **15 minutos**.

### 1.3 Endpoints do Watchdog
* `GET /api/watchdog/status`: Retorna o estado atual da vigília, última checagem, % de RAM e status de cada container.
* `POST /api/watchdog/test-alert`: Dispara uma mensagem de teste no WhatsApp cadastrado (`CallMeBot`).
* `POST /api/watchdog/check-now`: Força uma checagem de saúde imediata.

---

## 2. Gestão de Ciclo de Vida dos Containers Docker

A aba **Docker** do CloudOps Hub oferece controle total sobre os containers da VM conectada, com ações de 1-toque:

* **▶️ Iniciar (`start`)**: Ativa containers que estejam com status `Exited` ou pausados.
* **⏹️ Parar (`stop`)**: Finaliza graciosamente um container em execução (`SIGTERM`).
* **🔄 Reiniciar (`restart`)**: Reinicia o container de forma atômica para aplicar novas configurações ou limpar processos órfãos.
* **📜 Logs em Tempo Real (`logs`)**: Abre uma janela de terminal carregando as últimas 100 linhas (`docker logs --tail 100 --timestamps`) com data/hora e mensagens de erro destacadas.

### Endpoints da API Docker:
* `POST /api/docker/action`: Recebe `{ container: "nome", action: "start" | "stop" | "restart" }`.
* `GET /api/docker/logs/:container?tail=100`: Retorna o fluxo de logs do container.
* `GET /api/docker/containers`: Lista todos os containers da VM com status e consumo de recursos.

---

## 3. Pipeline de Backups Automatizados do MySQL

O CloudOps Hub conta com um pipeline de backup para o banco relacional MySQL 8.0:

### 3.1 Como Funciona o Dump
1. O comando é executado diretamente via SSH/Docker Engine:
   ```bash
   docker exec boteco_db mysqldump -u root -pviniZIKA3103 \
     --single-transaction --quick restaurante | gzip -9 > /home/ubuntu/backups/backup_restaurante_[TIMESTAMP].sql.gz
   ```
2. O dump passa por um pipe direto para o `gzip -9`, garantindo **compactação máxima** (reduzindo megabytes para poucos kilobytes) sem gravar arquivos intermediários descompactados no disco.
3. O arquivo final é gravado no diretório seguro `/home/ubuntu/backups/`.

### 3.2 Política de Retenção Automática (7 Dias)
Para evitar que dumps antigos ocupem espaço desnecessário no disco NVMe da VM Always Free, a cada novo backup o sistema executa uma limpeza automática:
```bash
find /home/ubuntu/backups -type f -name "*.sql.gz" -mtime +7 -delete
```

### 3.3 Endpoints de Backup
* `POST /api/backups/create`: Executa a rotina de dump e compactação em tempo real.
* `GET /api/backups`: Lista todos os backups armazenados na VM com nome, tamanho compactado e data.
