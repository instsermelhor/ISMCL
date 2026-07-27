# ADR-131: Foundation Platform Implementation — NestJS, Clean Architecture, DDD e Event-Driven

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Technology Officer, Principal Backend Architect, Principal Platform Engineer  
**Referência:** Prompt 131 (AFPI), Technical Baseline P120, OSS P129, AIRA P130

---

## Contexto

O Prompt 130 (AIRA) certificou a prontidão da Plataforma Aura para o início da implementação física. O Prompt 131 (AFPI) marca o início oficial da Fase 2 — construção física. A primeira entrega é a Foundation Platform, que serve como o núcleo tecnológico sobre o qual todos os 73 Módulos de Negócio Core serão desenvolvidos (Prompts 131–150).

O repositório existente (`/ISMCL`) contém uma base inicial (React, Prisma, Express) que deve ser expandida e refatorada para acomodar a arquitetura enterprise consolidada.

## Decisão

### Backend Foundation

**Decisão:** Adotar **NestJS 10 LTS** com **FastifyAdapter** como framework base do backend, aplicando **Clean Architecture**, **DDD** e **CQRS** por Bounded Context.

**Justificativas:**
- NestJS provê estrutura modular nativa compatível com DDD e Bounded Contexts.
- FastifyAdapter oferece ~2x mais throughput vs Express (benchmark oficial NestJS).
- Decorators nativos eliminam boilerplate de controllers, pipes e guards.
- `@nestjs/cqrs` suporta CQRS sem bibliotecas externas adicionais.
- Ecossistema maduro: Swagger, Terminus, Config, EventEmitter, CQRS, Cache.

**Consequências:**
- Migração gradual do código Express legado para NestJS (Sprint 0 a Sprint 3).
- Todos os novos módulos (Sprint 2+) devem seguir o template NestJS DDD.
- Prisma ORM mantido (já existente e com schema 849 linhas validado).

### Frontend Foundation

**Decisão:** Manter **React 19 + TypeScript + Vite** com adição do **Design System de tokens CSS** e **shared libraries** corporativas.

**Justificativas:**
- React/Vite já está em produção no repositório com código de alto valor.
- Evita retrabalho de migração de todo o frontend existente.
- Design System via CSS Custom Properties é agnóstico de framework (portável para Flutter Web futuramente).

### Estrutura de Diretórios

```
ISMCL/
├── backend/              # NestJS backend (DDD / Clean Architecture)
│   ├── src/
│   │   ├── domain/       # Bounded Contexts (um por módulo de negócio)
│   │   ├── shared/       # Guards, filters, interceptors, DTOs, decorators
│   │   ├── events/       # EventBusService (CloudEvents v1.0.3)
│   │   ├── health/       # Kubernetes health probes
│   │   └── config/       # Configuração centralizada com Joi
│   └── prisma/           # Schema e migrações
├── src/                  # React frontend (manter e evoluir)
│   ├── design-system/    # CSS tokens do Design System
│   ├── shared/           # Shared libraries (api-client, hooks, utils, components)
│   └── [páginas existentes]
├── infra/
│   ├── docker-compose.yml
│   └── helm/aura-foundation/  # Helm Chart Kubernetes
├── .github/workflows/    # GitHub Actions CI/CD
└── Makefile              # Developer tooling
```

### Security Foundation

**Decisão:** JwtAuthGuard com suporte a **modo dual**:
1. **Desenvolvimento:** JWT simétrico HS256 (sem Keycloak local necessário).
2. **Produção:** JWT assimétrico RS256 via JWKS remoto do Keycloak 24.

**Justificativa:** Facilita o desenvolvimento sem requerer infraestrutura Keycloak em ambiente local, enquanto mantém segurança máxima em produção.

### Event Foundation

**Decisão:** EventBusService sobre NestJS EventEmitter2 com envelope **CloudEvents v1.0.3**.

**Justificativa:** Em desenvolvimento, o EventEmitter2 in-process é suficiente e elimina dependência de Kafka. A migração para Kafka (Sprint 3) será transparente — apenas a camada de transporte muda, mantendo o mesmo contrato CloudEvents.

### DevSecOps Foundation

**Decisão:** GitHub Actions com 4 jobs sequenciais: `lint-and-typecheck` → `test` → `security-scan` → `build`. Coverage mínimo 60% (aumentar para 80% em Sprint 3).

## Alternativas Consideradas

| Alternativa | Motivo da Rejeição |
|------------|-------------------|
| Express.js puro | Sem estrutura de módulos, injeção de dependência ou DDD nativo |
| Fastify puro | Mesma ausência de estrutura — NestJS usa Fastify como adapter |
| Next.js API Routes | Não adequado para microsserviços DDD isolados |
| Remix | Overhead de SSR desnecessário para APIs JSON puras |

## Consequências

- ✅ Todos os novos módulos de negócio (Sprint 2+) devem usar o template NestJS do ADR-131.
- ✅ Nenhum módulo pode importar outro módulo diretamente (apenas via API Gateway ou Event Bus).
- ⚠️ O código Express legado em `backend/src/` deve ser migrado progressivamente (ADR a ser criado).
- ✅ O Design System CSS deve ser utilizado como única fonte de tokens visuais.

---

*Homologado pelo Architecture Review Board (ARB) — AFPI Prompt 131*
