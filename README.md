<div align="center">
  <img width="1200" height="475" alt="Instituto Ser Melhor Banner" src="https://github.com/instsermelhor/ISMCL/blob/main/assets/banner.png?raw=true" onerror="this.style.display='none'" />
</div>

# 🏥 Projeto Aura — Instituto Ser Melhor

> **Plataforma integrada de acolhimento, saúde mental e gestão do cuidado social.**

[![GitHub repo](https://img.shields.io/badge/GitHub-instsermelhor%2FISMCL-blue?logo=github)](https://github.com/instsermelhor/ISMCL)
[![Node.js](https://img.shields.io/badge/Node.js-Required-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## 📋 Sobre o Projeto

O **Projeto Aura** é a plataforma central do Instituto Ser Melhor, desenvolvida para integrar e centralizar todos os módulos de gestão institucional, clínica e operacional.

### Módulos Implementados

| Módulo | Descrição | Status |
|--------|-----------|--------|
| **Painel Principal** | Dashboard com visão geral institucional | ✅ Ativo |
| **Gestão de Pacientes** | Prontuários, histórico e acompanhamento clínico | ✅ Ativo |
| **Agenda** | Calendário de consultas e eventos institucionais | ✅ Ativo |
| **Mensagens** | Sistema de comunicação interna | ✅ Ativo |
| **Financeiro** | Gestão financeira completa da instituição | ✅ Ativo |
| **CGI** | Centro de Gestão Institucional | ✅ Ativo |
| **Portal do Beneficiário** | Acesso e acompanhamento pelo assistido | ✅ Ativo |
| **Portal do Profissional** | Interface dedicada para profissionais de saúde | ✅ Ativo |
| **MCSI** | Módulo Complementar de Segurança Institucional | ✅ Ativo |
| **IAM Center** | Gestão de Identidade e Acesso (RBAC/ABAC) | ✅ Ativo |
| **Configurações** | Administração e preferências do sistema | ✅ Ativo |

---

## 🚀 Executar Localmente

**Pré-requisitos:** Node.js 18+

```bash
# 1. Clonar o repositório
git clone https://github.com/instsermelhor/ISMCL.git
cd ISMCL

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e defina GEMINI_API_KEY com sua chave da API Gemini

# 4. Iniciar o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em: **http://localhost:3000**

---

## 🛠️ Stack Tecnológica

- **Frontend:** React 19 + TypeScript + Vite + TailwindCSS
- **Backend:** Node.js + Express + Prisma ORM
- **IA:** Google Gemini API (`@google/genai`)
- **Animações:** Motion (Framer Motion)
- **Roteamento:** React Router DOM v7

---

## 📁 Estrutura do Projeto

```
ISMCL/
├── src/
│   ├── components/      # Componentes reutilizáveis (layout, auth, UI)
│   ├── contexts/        # Contextos React (Auth, IAM, Security, Portais)
│   ├── data/            # Dados mock para desenvolvimento
│   ├── pages/           # Páginas da aplicação
│   ├── services/        # Serviços e integrações de API
│   └── types/           # Tipos TypeScript
├── backend/
│   ├── prisma/          # Schema do banco de dados
│   └── src/             # Código do servidor (controllers, services, middleware)
├── docs/                # Documentação técnica dos módulos
└── assets/              # Recursos estáticos
```

---

## 📄 Documentação

A documentação técnica completa de cada módulo está disponível na pasta [`/docs`](./docs/).

---

## 🔐 Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `GEMINI_API_KEY` | Chave da API Google Gemini |

---

<div align="center">
  <sub>Instituto Ser Melhor • Projeto Aura © 2026</sub>
</div>
