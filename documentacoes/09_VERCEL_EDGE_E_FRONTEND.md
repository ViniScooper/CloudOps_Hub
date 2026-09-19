# 🌐 09. Vercel Frontend & Edge Deployments

Este documento detalha o funcionamento, configuração e operação do frontend do **Cardápio Digital** na borda da **Vercel** (`cardapiodigital-gamma.vercel.app`) integrado diretamente ao **CloudOps Hub**.

---

## 🏗️ 1. Arquitetura Híbrida: Frontend Edge + Backend Nuvem

O ecossistema opera de forma desacoplada para garantir velocidade global máxima e consumo mínimo de recursos na VM da Oracle:

```
[ Usuários / Clientes no WhatsApp / Salão ]
                   │
                   ▼ (HTTPS)
   ┌───────────────────────────────┐
   │    Vercel Edge Global CDN     │
   │  cardapiodigital-gamma.vercel │  <─── Next.js / React Frontend Estático & Cache
   └───────────────┬───────────────┘
                   │ Chamadas de API (cardapio, pedidos, auth)
                   ▼ (Cloudflare Zero Trust Tunnel)
   ┌───────────────────────────────┐
   │     Oracle Cloud VM Linux     │
   │   • boteco_backend (Node.js)  │
   │   • boteco_db (MySQL 8.0)     │
   │   • boteco_tunnel (Cloudflare)│
   └───────────────────────────────┘
```

* **Frontend (Vercel):** Servido a partir de mais de 300 pontos de presença da CDN da Vercel (incluindo São Paulo - GRU), com latência inferior a 15ms.
* **Backend (Oracle Cloud):** Processa as regras de negócio, banco de dados MySQL e uploads de fotos.

---

## 🚀 2. Métodos de Disparo de Build (Redeploy)

O CloudOps Hub suporta dois métodos integrados:

### A. Deploy Hook (Recomendado para Disparos 1-Clique)
* **O que é:** Uma URL Webhook única gerada pelo painel da Vercel em *Settings → Git → Deploy Hooks*.
* **Vantagens:**
  * Não expõe credenciais da conta Vercel.
  * Dispara a compilação imediata na branch `main`.
  * Funciona diretamente pelo botão **"Forçar Redeploy Vercel"** no CloudOps Hub sem precisar de tokens pessoais.
* **Formato:** `https://api.vercel.com/v1/integrations/deploy/prj_xxxx/xxxx`

### B. Personal Access Token (Para Consulta de Histórico)
* **O que é:** Token pessoal gerado em [vercel.com/account/tokens](https://vercel.com/account/tokens).
* **Vantagens:**
  * Permite que o CloudOps Hub consulte a API da Vercel (`GET /v6/deployments`).
  * Preenche a tabela com histórico completo: hash do commit, autor, mensagem, tempo de compilação em segundos e link de preview de cada build.

---

## 🔄 3. Fluxo de Trabalho do Desenvolvedor (GitFlow)

1. Faça suas alterações nos componentes do cardápio localmente no seu computador.
2. Dê commit e envie para o GitHub:
   ```bash
   git add .
   git commit -m "feat: novo item no cardapio"
   git push origin main
   ```
3. Acesse o **CloudOps Hub** (`http://localhost:3000`) e clique na aba **Vercel Frontend**.
4. Acompanhe o status do build mudar de `BUILDING` para `READY`.
5. Se por qualquer motivo a compilação não iniciar automaticamente pelo GitHub, clique no botão azul **"Forçar Redeploy Vercel"** no topo da tela.

---

## ⚡ 4. Tratamento de Cache da CDN (Edge Cache)

A Vercel mantém arquivos estáticos cacheados na rede Edge para máxima performance. Caso você tenha subido uma alteração e ainda visualize textos ou fotos antigas:

1. **No Navegador (Computador):** Pressione `Ctrl + Shift + R` (ou `Cmd + Shift + R` no Mac) para forçar o bypass do cache local.
2. **No Smartphone:** Abra o cardápio em uma aba anônima para carregar os assets diretamente da borda sem cache anterior.
3. **Verificação de Branches:** Certifique-se de que a branch de trabalho (`desenvolvimento` ou `develop`) foi mesclada na branch oficial da Vercel (`main`).

---

## 🛡️ 5. Segurança das Credenciais

* O token e a URL do Deploy Hook ficam salvos localmente no arquivo `cloud-ops-hub-backend/database/vercel_config.json`.
* Este arquivo está registrado no `.gitignore` e **nunca é enviado ao repositório público do GitHub**.
* O formulário do CloudOps Hub conta com proteção contra preenchimento indevido de gerenciadores de senhas (`autoComplete="new-password"`).
