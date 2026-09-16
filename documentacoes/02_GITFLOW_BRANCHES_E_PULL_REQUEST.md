# 🔀 Documento 02: GitFlow, Branches e Automação de Pull Request

Este documento ensina como gerenciar o código-fonte de forma profissional, eliminando o risco de quebrar a versão que está no ar para os clientes.

---

## 1. O que é o GitFlow e por que usamos 3 Branches?

O repositório do cardápio (`ViniScooper/cardapio_digital`) está estruturado com 3 branches:

```text
  main (Produção) ──────────────────────────────────────────● (Versão dos Clientes)
         ▲                                                  ▲
         │                                       Merge      │
         └───────────── develop (Melhorias) ────────────────┘
```

1. **`main` (Produção):**
   * É a branch sagrada. Ela contém apenas código testado, aprovado e estável.
   * A sua VM na Oracle Cloud lê e executa a branch `main`.
2. **`develop` (Desenvolvimento):**
   * É a branch onde você faz novas telas, adiciona produtos e altera o layout.
   * Mexer aqui **não afeta** os clientes que estão usando o cardápio no restaurante.
3. **`hotfix` (Correções de Emergência):**
   * Usada quando um erro grave surge em produção e precisa ser consertado em minutos.

---

## 2. Passo a Passo do Desenvolvimento no seu PC (VS Code)

Sempre que for programar uma melhoria:

### Passo 1: Entrar na branch `develop`
Abra o terminal do projeto (`C:\Users\vini\Documents\AP1_CARDAPIO`):
```bash
git checkout develop
git pull origin develop
```

### Passo 2: Fazer as alterações no código
Edite os arquivos que precisar no VS Code (ex: adicionar novos pratos).

### Passo 3: Salvar e enviar para o GitHub
```bash
git add .
git commit -m "Adiciona novos pratos no cardápio"
git push origin develop
```
*(Pronto! Suas alterações estão salvas com segurança no GitHub, sem mexer na `main`).*

---

## 3. Como Funciona a Automação no CloudOps Hub

Em vez de abrir o site do GitHub, criar Pull Request manual e clicar em botões de merge, você usa o módulo integrado do **CloudOps Hub**:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🔀 Automação de Pull Request & Merge (GitFlow)           [Zero Conflitos]   │
│                                                                             │
│ [ Origem: develop (Desenvolvimento) ]  ➔  [ Destino: main (Produção) ]      │
│                                                                             │
│                            [ Fazer Pull Request & Merge ]                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### O que cada opção faz:
1. **Origem (Melhoria):** Você escolhe de onde vem o código (`develop` ou `hotfix`).
2. **Destino (Produção):** Fixo na `main`, garantindo que o destino é a versão oficial.
3. **Botão "Fazer Pull Request & Merge":**
   * Conecta ao repositório;
   * Executa a mesclagem das alterações de `develop` para `main`;
   * Envia a versão atualizada para o GitHub (`git push origin main`);
   * Dispara notificação no seu WhatsApp avisando que a integração concluiu;
   * Imprime o relatório completo no **Console de Execução do Pipeline**.

---

## 4. O que o Usuário Precisa Configurar (Na VM vs no CloudOps Hub)

Uma dúvida comum é: *"Preciso cadastrar meu Git na plataforma ou só instalar na VM?"*

Aqui está o resumo prático:

### A) Na sua VM (Servidor na Nuvem):
* **Apenas o Git instalado:** Rodar `sudo apt install git` na máquina virtual.
* **Repositório clonado:** Clonar o projeto (`git clone https://github.com/...`).
* **Permissão de Download (`git pull`):**
  * Se o repositório for **público**: Não precisa de nenhuma senha.
  * Se o repositório for **privado**: Gere uma chave SSH na VM (`ssh-keygen -t ed25519`) e cole a chave pública no seu GitHub em *Settings ➔ Deploy keys*. Isso dá permissão permanente para a VM baixar o código sem pedir senha.

### B) No Painel do CloudOps Hub (Para criar PR e Merge automático):
O usuário escolhe entre dois modos:
1. **Modo Token (Qualquer dispositivo / Novo Usuário):**
   * Clica em **"⚙️ Configurar GitHub Token"**;
   * Cola um Personal Access Token gerado no GitHub (com escopo `repo`);
   * O CloudOps Hub se comunica diretamente com a **API oficial do GitHub** (`https://api.github.com`), criando o PR e fazendo o merge pelo próprio site do GitHub. O usuário nem precisa ter o repositório clonado no computador!
2. **Modo Local (PC de Desenvolvimento):**
   * Se você estiver rodando o CloudOps Hub no mesmo computador onde já programa com VS Code e Git logado, pode deixar o campo de token em branco. O sistema usará o Git local autenticado da sua máquina automaticamente!
