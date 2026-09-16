# ⚡ Documento 06: Guia Rápido do Dia a Dia (Cheatsheet)

Guia prático para consultar rapidamente durante a sua rotina de desenvolvimento e operações.

---

## 🟢 Cenário 1: "Quero criar uma nova funcionalidade no Cardápio"

1. **No seu PC (VS Code):**
   Abra a pasta `C:\Users\vini\Documents\AP1_CARDAPIO` no terminal e entre na branch `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```
2. **Faça as alterações:** Edite o código, adicione os novos pratos ou fotos.
3. **Salve e suba para o GitHub:**
   ```bash
   git add .
   git commit -m "Adiciona novos pratos no cardápio"
   git push origin develop
   ```
4. **No CloudOps Hub (Navegador):**
   * No card **Automação de Pull Request & Merge**, selecione `develop ➔ main` e clique em:
     👉 **"Fazer Pull Request & Merge"**
   * No card **Boteco Sivirino**, clique em:
     👉 **"Fazer Deploy Agora"**

*Pronto! A versão nova está no ar para os clientes e você recebe o aviso no WhatsApp.*

---

## 🔴 Cenário 2: "Deu um erro urgente em produção (Hotfix)"

1. **No seu PC (VS Code):**
   ```bash
   git checkout hotfix
   git pull origin hotfix
   ```
2. Corrija o bug no código.
3. Suba a correção:
   ```bash
   git add .
   git commit -m "Corrige bug no valor total"
   git push origin hotfix
   ```
4. **No CloudOps Hub:**
   * No card **Automação de Pull Request & Merge**, selecione `hotfix ➔ main` e clique em:
     👉 **"Fazer Pull Request & Merge"**
   * Em seguida, clique em:
     👉 **"Fazer Deploy Agora"**

---

## 💻 Cenário 3: "Como ligar o CloudOps Hub na minha máquina"

Abra dois terminais PowerShell:

### Terminal 1 (Backend):
```powershell
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub-backend
node src/server.js
```
*(Ativo na porta 3005)*

### Terminal 2 (Frontend Web):
```powershell
cd C:\Users\vini\Documents\MY_VM_ORACLE\cloud-ops-hub
pnpm dev
```
*(Acesse pelo navegador em: http://localhost:3000)*

---

## 📱 Cenário 4: "Como testar a notificação do WhatsApp"

No backend, você pode testar o envio de mensagem para o seu celular com um único comando:

```powershell
curl -X POST http://localhost:3005/api/oracle/scraper/test-whatsapp
```
Você receberá imediatamente uma mensagem com o emoji de sino 🔔 no número cadastrado.

---

## 📦 Cenário 5: "Quero subir um repositório novo do GitHub para a minha VM"

1. Acesse o CloudOps Hub e vá até a aba **Deploy**;
2. Clique no botão azul:  
   👉 **`[ 📦 Clonar Novo Projeto do GitHub ]`**
3. Cole a URL do seu repositório Git (ex: `https://github.com/ViniScooper/meu-novo-app.git`);
4. Escolha como quer rodar na VM:
   * 🐳 **Docker Compose:** Constrói e sobe os containers automaticamente (`docker compose up -d --build`).
   * ⚡ **Node.js / PM2:** Instala dependências e roda em background pelo PM2 (ideal para economizar RAM na VM).
   * 📂 **Apenas Clonar:** Apenas baixa os arquivos na pasta da VM.
5. Clique em **"Clonar e Lançar na VM"**.

*O CloudOps Hub conecta via SSH, baixa o código, inicializa o projeto e cria um novo card no seu painel para futuros deploys!*
