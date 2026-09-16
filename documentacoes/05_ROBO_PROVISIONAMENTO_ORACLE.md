# 🤖 Documento 05: Robô de Auto-Provisionamento da Oracle Cloud

Este documento explica o funcionamento do robô em background (`oracleScraper.js`) projetado para obter instâncias gratuitas na Oracle Cloud.

---

## 1. O Problema: "Out of host capacity" na Oracle

A Oracle Cloud oferece instâncias gratuitas muito potentes baseadas em arquitetura ARM (Ampere A1 Flex — até 4 OCPUs e 24 GB de RAM Always Free). 

No entanto, no datacenter de **São Paulo (`sa-saopaulo-1`)**, a demanda é gigantesca. Quando um usuário tenta criar uma máquina pelo site da Oracle, quase sempre recebe o erro:
> `Error: 500-InternalError, Out of host capacity.`

Isso acontece porque não há slots livres no momento. A vaga só abre quando outro usuário deleta ou desliga uma máquina.

---

## 2. Como o Robô do CloudOps Hub Resolve Isso

Em vez de você ficar atualizando a página da Oracle o dia todo, o script `src/oracleScraper.js` do backend faz isso de forma totalmente automatizada:

```text
┌────────────────────────┐
│  Loop a cada 15/30s    │ ──── Assina com OCI API Key (SHA256 RSA) ────► [ API REST OCI ]
└────────────────────────┘                                                        │
           │                                                                      ▼
           │◄─────────────────── 500 Out of host capacity ────────────────────────┤
           │                                                                      │
     Alterna Perfil                                                       201 Created! 🎉
(ex: 1 OCPU/2GB -> 2 OCPU/8GB)                                                   │
           │                                                                      ▼
           └──────────────────────────────────────────────────────► [ Alerta no WhatsApp 📲 ]
```

---

## 3. Segurança & Criptografia da Conexão OCI

O robô não usa navegador nem interface visual. Ele se comunica diretamente com a **API REST oficial da Oracle**:
1. Lê as credenciais em `~/.oci/config` e a chave privada `oci_api_key.pem`;
2. Gera uma assinatura criptográfica **RSA-SHA256** com o `tenancy_ocid`, `user_ocid` e `fingerprint`;
3. Faz a chamada `POST /20160918/instances` na API `iaas.sa-saopaulo-1.oraclecloud.com`.

---

## 4. Perfis de Recursos que o Robô Alterna

O robô testa dinamicamente diferentes combinações de hardware para maximizar as chances de sucesso:
1. `1 OCPU / 2 GB RAM` *(Maior probabilidade de vaga rápida)*
2. `1 OCPU / 4 GB RAM`
3. `1 OCPU / 6 GB RAM`
4. `2 OCPU / 6 GB RAM`
5. `2 OCPU / 8 GB RAM`
6. `2 OCPU / 12 GB RAM`

---

## 5. Notificação Automática no WhatsApp

Assim que o datacenter libera uma vaga e a Oracle responde com código **201 Created**:
1. O robô interrompe o loop para não criar máquinas duplicadas;
2. Extrai o ID da máquina criada, IP e perfil de memória;
3. Dispara uma mensagem instantânea via CallMeBot API para o seu celular:
   > 🔔 *Parabéns! Sua nova VM Oracle ARM foi criada com sucesso!*  
   > *Perfil:* 2 OCPU / 12 GB RAM  
   > *IP:* 137.xxx.xxx.xxx
