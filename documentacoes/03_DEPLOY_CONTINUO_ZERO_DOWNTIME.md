# 🚀 Documento 03: Deploy Contínuo, Rollback & Auditoria

Este documento detalha o funcionamento do mecanismo de deploy real via SSH, rollback de emergência e auditoria de versões do CloudOps Hub.

---

## 1. O Conceito de Zero Downtime (Sem Queda de Serviço)

Em um ambiente de restaurante ou comércio, clientes estão acessando o cardápio a todo momento.
Um deploy tradicional derrubaria o sistema por 15 a 30 segundos, gerando erros como `502 Bad Gateway` ou tela branca.

O CloudOps Hub utiliza a técnica **Zero Downtime**:
1. A nova versão da aplicação é construída em paralelo;
2. Os testes de integridade internos (*healthcheck*) são validados;
3. O tráfego de rede é alternado suavemente para a nova versão;
4. Somente após a nova versão estar respondendo, a versão antiga é finalizada.

---

## 2. Deploy Real via SSH do Boteco Sivirino (Cardápio Digital)

* **Painel:** Card *"Boteco Sivirino (Cardápio Digital)"*
* **Porta:** Host `3002` ➔ Container `3001`
* **Localização na VM:** `/home/ubuntu/cardapio_digital`

### Etapas Executadas ao Clicar em "Fazer Deploy Agora":
1. **Conexão SSH Real:** O backend conecta na VM Oracle (`137.131.185.243`) autenticado com a chave privada `ssh-key-2026-02-20.key`.
2. **`git pull origin <branch>`:** Acessa `/home/ubuntu/cardapio_digital` e baixa as alterações reais da branch selecionada.
3. **Leitura de Commit:** Extrai o hash curto do commit (ex: `e4a81fc`) e a mensagem para auditoria.
4. **`docker compose up -d --build`:** Compila e sobe os novos containers Docker no ar.
5. **Registro de Auditoria:** Salva data/hora, autor, commit e tempo gasto em `database/deploy_history.json`.
6. **Alerta WhatsApp:** Envia notificação confirmando:
   > 🚀 *CloudOps Hub:* Deploy Real concluído com êxito!  
   > *Projeto:* Boteco Sivirino  
   > *Branch:* main (Commit: e4a81fc)  
   > *Duração:* 4.2s  
   > *Status:* Containers no ar sem queda.

---

## 3. ⏪ Rollback em 1-Clique (Desfazer Deploy de Emergência)

* **Botão:** *"Rollback"* (laranja com ícone de reversão)
* **Objetivo:** Se um deploy trouxer um erro inesperado no restaurante, reverter para a versão estável anterior em segundos.

### O que acontece quando você clica em Rollback:
1. O painel solicita uma confirmação de segurança;
2. Conecta via SSH na VM e executa:
   ```bash
   cd /home/ubuntu/cardapio_digital
   git reset --hard HEAD~1
   docker compose up -d --build
   ```
3. A versão anterior é reconstruída e assume o tráfego;
4. Um alerta de prioridade máxima é enviado para o seu **WhatsApp** informando a reversão e o ID da versão restabelecida;
5. Um registro de tipo `ROLLBACK` é gravado no histórico de auditoria.

---

## 4. Deploy da Lottus API — PM2 Cluster Mode

* **Painel:** Card *"Lottus API (Corporativo)"*
* **Porta:** Host `3001` (com proxy reverso Nginx em `api.lottus.com.br`)
* **Localização na VM:** `/home/ubuntu/api_users/api_users/server.js`

### Por que PM2 e não Docker?
A máquina virtual possui **956 MB de RAM**. O gerenciador de processos PM2 consome apenas **14.7 MB de RAM**, permitindo que a API rode com altíssimo desempenho sem sobrecarregar a memória do servidor.

### Etapas Executadas ao Clicar em "Atualizar Lottus API":
1. A VM acessa a pasta `/home/ubuntu/api_users/api_users/`.
2. Executa `git pull origin main`.
3. Executa `pm2 reload lottus-api`. O comando `reload` recarrega os processos em fila sem fechar conexões ativas.
4. Grava a auditoria e dispara notificação no WhatsApp.

---

## 5. Histórico & Auditoria de Deploys

Localizada logo abaixo do terminal, a tabela de auditoria exibe:
* **Data / Hora:** Registro com timestamp exato do evento.
* **Projeto:** Identificação da aplicação atualizada.
* **Tipo:** Badge visual indicando se foi um `DEPLOY` (ciano) ou `ROLLBACK` (âmbar).
* **Branch / Commit:** Identificador do commit no GitHub (ex: `main@e4a81fc`).
* **Descrição:** Mensagem do commit ou motivo da reversão.
* **Duração:** Tempo exato gasto na execução SSH (ex: `3.8s`).
* **Status:** Indicador verde (`Sucesso`) ou vermelho (`Falha`).
