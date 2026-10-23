# 🚀 CloudOps Hub - Cloud Infrastructure & Database Management Platform

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/ViniScooper/CloudOps_Hub?style=for-the-badge&logo=github&color=gold)](https://github.com/ViniScooper/CloudOps_Hub/stargazers)
[![GitHub Release](https://img.shields.io/github/v/release/ViniScooper/CloudOps_Hub?style=for-the-badge&color=20d6c7)](https://github.com/ViniScooper/CloudOps_Hub/releases/tag/v2.1.0)
[![Snyk Security](https://snyk.io/test/github/ViniScooper/CloudOps_Hub/badge.svg)](https://snyk.io/test/github/ViniScooper/CloudOps_Hub)
[![Security Headers](https://img.shields.io/badge/Security_Headers-Grade_A+-brightgreen?style=for-the-badge&logo=securityscorecard)](https://securityheaders.com/?q=https%3A%2F%2Fcloudops-hub-dun.vercel.app%2F&followRedirects=on)
[![SSL Labs](https://img.shields.io/badge/Qualys_SSL_Labs-Grade_A+-blue?style=for-the-badge&logo=qualys)](https://www.ssllabs.com/ssltest/analyze.html?d=cloudops-hub-dun.vercel.app)
[![OWASP Top 10](https://img.shields.io/badge/OWASP-Top_10_Compliant-00599C?style=for-the-badge&logo=owasp)](https://owasp.org)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://cloudops-hub-dun.vercel.app/)
[![Oracle Cloud](https://img.shields.io/badge/Oracle_Cloud-OCI_Infrastructure-F80000?style=for-the-badge&logo=oracle)](https://www.oracle.com/cloud/)

**Painel Unificado de Observabilidade, Gestão de Infraestrutura Cloud e Bancos de Dados de Alta Performance.**

[🌟 Ver Landing Page Oficial & Showcase Interativo](https://cloudops-hub-dun.vercel.app/landing) • [🌐 Acessar Painel ao Vivo](https://cloudops-hub-dun.vercel.app/)

</div>

---

## 🌟 Visão Geral do Projeto

O **CloudOps Hub** é uma plataforma corporativa desenvolvida para monitoramento em tempo real, automação de operações de DevOps e controle centralizado de instâncias em nuvem, contêineres Docker e bancos de dados relacionais e autônomos.

Projetado sob a arquitetura **Zero Trust** e princípios modernos de engenharia de confiabilidade (**SRE**), o sistema conecta a borda (*Edge*) da Vercel diretamente às instâncias na **Oracle Cloud Infrastructure (OCI)** através de túneis criptografados via **Cloudflare Zero Trust**.

---

## 🛡️ Conformidade e Blindagem de Segurança

O CloudOps Hub foi construído seguindo rigorosos padrões de segurança da informação (alinhado a **OWASP Top 10** e **CIS Benchmarks**):

* **🛡️ Security Headers (Grade A+):**
  - `Content-Security-Policy` (CSP) estrito contra ataques XSS e injeção de scripts.
  - `Strict-Transport-Security` (HSTS com preload e validade máxima).
  - `X-Frame-Options: DENY` (proteção absoluta contra Clickjacking).
  - `X-Content-Type-Options: nosniff` (prevenção contra MIME-sniffing).
  - `Permissions-Policy` restringindo uso indevido de sensores de hardware.
* **🔒 Criptografia de Ponta a Ponta:** Tráfego TLS 1.3 obrigatório via Vercel Edge e Cloudflare Tunnel.
* **🔑 Zero Exposure:** Nenhuma porta de banco de dados (Oracle 1521 / MySQL 3306) ou porta SSH (22) é exposta diretamente à internet pública. Comunicação intermediada exclusivamente por túneis autenticados e redes privadas internas.

---

## 🏗️ Arquitetura do Ecossistema

```text
[ Cliente Web / Mobile ]
           │
           ▼ (HTTPS / TLS 1.3 - Security Headers A+)
[ Vercel Edge Global CDN (Next.js) ]
           │
           ▼ (Túnel Cloudflare Zero Trust Criptografado)
[ Oracle Cloud Infrastructure (OCI - São Paulo GRU) ]
   ├── VM 1: instance-bytedata (Node.js API, PM2, Docker, Nginx)
   ├── VM 2: cloudops-micro-02 (API Gateway, Nginx Reverse Proxy)
   └── Oracle Autonomous Database (ATP Exadata Serverless)
```

---

## 💻 Stack Tecnológica

* **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), TypeScript, Tailwind CSS, Lucide Icons, Radix UI.
* **Backend:** Node.js, Express, PM2 Process Manager.
* **Bancos de Dados:** Oracle Database 23ai / Oracle Autonomous Database (ATP), MySQL 8.0.
* **Cloud & Infraestrutura:** Oracle Cloud Infrastructure (OCI), Docker, Vercel, Cloudflare Zero Trust.

---

## 📜 Licença e Propriedade Intelectual

Este software é protegido pela legislação de direitos autorais e de propriedade intelectual (Lei Federal nº 9.609/1998 e Lei Federal nº 9.610/1998).

**Copyright (c) 2026 José Vinícius Lourenço Marques de Sousa (Vinícius Lourenço). Todos os direitos reservados.**  
*Software Proprietário — Uso comercial não autorizado expressamente é proibido.*  
Contato: `vviniciuslourenco@gmail.com`
