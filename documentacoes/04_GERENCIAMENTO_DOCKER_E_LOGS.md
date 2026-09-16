# 🐳 Documento 04: Gerenciamento Docker, Logs & Proteção de Disco

Este documento descreve as funcionalidades de observabilidade e manutenção de containers no CloudOps Hub.

---

## 1. Monitor Visual de Containers

Na tela principal do CloudOps Hub, você visualiza em tempo real o status de todos os serviços da VM:
* **Indicador Verde (`Running` / `Online`):** Container saudável e operando normalmente.
* **Indicador Vermelho (`Unhealthy` / `Exited`):** Container com falha no healthcheck ou parado.
* **Métricas Individuais:** Consumo de CPU (%) e memória RAM (MB) consumida por cada processo.
* **Ações em 1 Clique:** Botões para Iniciar (▶️), Parar (⏹️) e Reiniciar (🔄) sem precisar de comandos de terminal.

---

## 2. Inspecionar Logs em Tempo Real (Live Logs)

Clicando no ícone de **Lupa** ao lado de qualquer container:
1. Uma janela modal se abre com as últimas 60 linhas de log (`stdout` e `stderr`);
2. **Diagnóstico Inteligente:** O sistema analisa palavras-chave nos logs (ex: `ECONNREFUSED`, `ETIMEDOUT`, `Invalid API Key`) e exibe uma caixa com a causa provável e a sugestão de correção;
3. **Copiar Logs:** Botão direto para copiar o log de erro para a área de transferência.

---

## 3. Editor Visual de Variáveis de Ambiente (`.env`)

Mudar variáveis de ambiente diretamente pelo terminal (`nano .env`) é arriscado porque um erro de digitação pode derrubar a aplicação.

O CloudOps Hub possui um editor gráfico na rota `/api/env`:
* Lista as chaves (`PORT`, `DB_HOST`, `DB_PASSWORD`, `JWT_SECRET`);
* Oculta senhas e chaves sensíveis com máscaras;
* Salva e reaplica as variáveis com segurança e notificação no WhatsApp.

---

## 4. Otimização e Blindagem de Disco (Rotação de Logs 50 MB)

* **O Perigo do Docker em VMs com 45 GB de Disco:**
  Por padrão, o Docker grava logs indefinidamente no arquivo `/var/lib/docker/containers/*/*.log`. Com o tempo, esses arquivos crescem até 20 GB ou 30 GB, lotando o disco e travando o banco de dados.
* **A Proteção do CloudOps Hub:**
  O sistema aplica a configuração de rotação automática:
  ```json
  {
    "log-driver": "json-file",
    "log-opts": {
      "max-size": "50m",
      "max-file": "3"
    }
  }
  ```
  Isso garante que nenhum container gerará mais de 150 MB de logs no total, mantendo o disco sempre livre e protegido contra estouro.
