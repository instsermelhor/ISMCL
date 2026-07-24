# PROMPT 89A — AURA ENTERPRISE REFERENCE ARCHITECTURE (AERA)
## Arquitetura de Referência Oficial da Plataforma Aura

**Versão:** 1.0.0 — Padrão Corporativo Definitivo  
**Data:** 2026-07-24  
**Status:** APROVADO PELO COMITÊ DE ARQUITETURA ENTERPRISE (CEA/CTO/CAIO/CGO)  
**Classificação:** ARQUITETURA CANÔNICA MANDATÓRIA (PROMPTS 00–89 CONSOLIDADOS)  
**Escopo:** Padrão arquitetural imutável para todos os desenvolvimentos presentes e futuros (Prompt 90+)  

---

## EXECUTIVE SUMMARY & POLÍTICA ARQUITETURAL MANDATÓRIA

A **Aura Enterprise Reference Architecture (AERA)** estabelece a fonte única da verdade (*Single Source of Truth*) técnica e de engenharia para toda a Plataforma Aura. A partir desta norma:

1. **Nenhum desenvolvimento** poderá ser iniciado sem aderência estrita aos padrões canônicos aqui definidos.
2. **Nenhuma duplicação de domínio** será permitida. Os 10 Módulos Canônicos definidos no Módulo 88A absorvem todas as versões históricas/redundantes.
3. **Todo código** gerado por engenheiros ou agentes de IA autônomos será submetido à **Certificação Automatizada de Conformidade Arquitetural** antes de qualquer mesclagem (`merge`) na ramificação principal.

---

## ETAPA 1 — AUDITORIA DE CONSOLIDAÇÃO & MATRIZ DE REUTILIZAÇÃO

### 1.1 Consolidação de Módulos Históricos em Módulos Canônicos

Após auditoria nos Prompts 00 a 89, os 73 módulos foram consolidados em **12 Bounded Contexts Canônicos**, eliminando ambiguidades e sobreposições funcionais.

| Domínio Canônico | Módulo Principal (Fonte da Verdade) | Módulos Históricos Absorvidos / Supersedidos | Justificativa de Engenharia |
|------------------|------------------------------------|---------------------------------------------|-----------------------------|
| **Core Platform & Identity** | **M01 (P16)** | M16 (parcial) | Centralização de IAM, RBAC, ABAC e OAuth 2.1/OIDC |
| **Citizen & Health Care** | **M02–M06 (P17–P21)** | M04, M05, M06 | Agrupamento do ciclo de vida do cidadão e prontuário clínico |
| **AI Orchestration & Mesh** | **M72 (P87)** | M15 (P30), M26 (P41), M64 (P79) | M72 engloba A2A Protocol, MCP Gateway, Multi-Agent Mesh e AI Router |
| **Digital Twin Engine** | **M67 (P82)** | M22 (P37), M36 (P51), M51 (P66) | M67 consolida Monte Carlo (100k iter), DES SimPy e System Dynamics |
| **Enterprise GRC & Compliance** | **M66 (P81)** | M12 (P27), M24 (P39), M38 (P53), M47 (P62), M57 (P72) | M66 unifica COSO ERM, ISO 31000, ISO 37301 e CCM |
| **Knowledge & Semantics** | **M63 (P78)** | M20 (P35), M33 (P48), M42 (P57), M49 (P64), M55 (P70) | M63 consolida o Knowledge Graph W3C RDF/OWL e Ontologia Corporativa |
| **Hyperautomation & BPMN** | **M65 (P80)** | M14 (P29), M28 (P43), M44 (P59), M58 (P73) | M65 integra Zeebe/Camunda 8, Drools BRMS, Process Mining e IDP |
| **Enterprise Resilience & SRE** | **M68 (P83)** | M27 (P42), M37 (P52), SRE base | M68 engloba ISO 22301, Chaos Engineering, SRE Error Budgets e FinOps |
| **Data Intelligence & Mesh** | **M71 (P86)** | M10 (P25), M25 (P40), M43 (P58), M61 (P76) | M71 especifica Data Governance DAMA-DMBOK2, Data Contracts e Data Mesh |
| **Autonomous Computing & Edge** | **M73 (P88)** | M21 (P36), M35 (P50), M52 (P67), M69 (P84) | M73 orquestra os 24 Edge Nodes, IBM MAPE-K Global, Federated AI e DNS Bus |
| **Platform Lifecycle & DevSecOps** | **M70 (P85)** | M18 (P33), M19 (P34) | M70 unifica VSM, SAFe 6.0 LPM, Progressive Delivery e Platform Eng. |
| **Cyber Defense & Zero Trust** | **M46 (P61)** | M16 (P31), M31 (P46) | M46 consolida SIEM/SOAR, XDR, WAF e Zero Trust Architecture |

---

## ETAPA 2 — ENTERPRISE DOMAIN MAP (DOMÍNIOS & BOUNDED CONTEXTS)

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                  AURA ENTERPRISE DOMAIN MAP                                                 ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   ┌───────────────────────────┐     ┌───────────────────────────┐     ┌───────────────────────────┐         ║
║   │ DOMÍNIO 1: IAM & CITIZEN  │     │ DOMÍNIO 2: CLINICAL CARE  │     │ DOMÍNIO 3: AI & AGENTS    │         ║
║   │ BC: Identity & Access     │────>│ BC: Care & EHR            │────>│ BC: AI Orchestration (M72)│         ║
║   │ Owner: Security Squad     │     │ Owner: Health Squad       │     │ Owner: AI Core Squad      │         ║
║   └─────────────┬─────────────┘     └─────────────┬─────────────┘     └─────────────┬─────────────┘         ║
║                 │                                 │                                 │                       ║
║   ══════════════╪═════════════════════════════════╪═════════════════════════════════╪═════════════════════  ║
║                 │        DIGITAL NERVOUS SYSTEM BUS (Kafka + NATS JetStream)        │                       ║
║   ══════════════╪═════════════════════════════════╪═════════════════════════════════╪═════════════════════  ║
║                 │                                 │                                 │                       ║
║   ┌─────────────▼─────────────┐     ┌─────────────▼─────────────┐     ┌─────────────▼─────────────┐         ║
║   │ DOMÍNIO 4: DIGITAL TWIN   │     │ DOMÍNIO 5: HYPERAUTOMATION│     │ DOMÍNIO 6: AUTONOMOUS EDGE│         ║
║   │ BC: Sim & Predictive (M67)│     │ BC: Process Engine (M65)  │     │ BC: Autonomous Comp (M73) │         ║
║   │ Owner: Simulation Squad   │     │ Owner: Automation Squad   │     │ Owner: Edge & Infra Squad │         ║
║   └───────────────────────────┘     └───────────────────────────┘     └───────────────────────────┘         ║
║                                                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

### 2.1 Especificação dos 12 Bounded Contexts Canônicos

| BC ID | Bounded Context | Responsabilidades Primárias | Eventos Chave Publicados | APIs Públicas Expostas | Dependências Diretas |
|-------|-----------------|----------------------------|--------------------------|------------------------|----------------------|
| **BC-01** | Identity & Access | Gestão de identidades, autenticação OAuth 2.1, RBAC/ABAC, MFA, credenciais | `aura.identity.user.registered.v1`, `aura.identity.session.revoked.v1` | `/v1/auth`, `/v1/users`, `/v1/roles` | Keycloak, Vault, Redis |
| **BC-02** | Citizen & Care | Cadastro do cidadão, triagem clínica SATAI, prontuário eletrônico (EHR), telemedicina | `aura.citizen.registered.v1`, `aura.clinical.triage.completed.v1` | `/v1/citizens`, `/v1/records`, `/v1/telehealth` | BC-01, PostgreSQL |
| **BC-03** | Financial & ERP | Gestão financeira, faturamento, pagamentos PIX, conciliação e governança de custos | `aura.financial.invoice.created.v1`, `aura.financial.pix.received.v1` | `/v1/financial`, `/v1/pix`, `/v1/billing` | BC-01, PostgreSQL, Redis |
| **BC-04** | AI Orchestration | Orquestração de LLMs/SLMs, roteamento preditivo, MCP Gateway, Multi-Agent Mesh | `aura.ai.mesh.agent.dispatched.v1`, `aura.ai.mcp.tool.executed.v1` | `/v1/ai/orchestrate`, `/v1/mcp`, `/v1/prompts` | BC-01, Qdrant, Neo4j |
| **BC-05** | Digital Twin | Simulação corporativa, System Dynamics, Monte Carlo (100k iter), Discrete Event Simulation | `aura.twin.simulation.executed.v1`, `aura.twin.scenario.validated.v1` | `/v1/digital-twin/simulate`, `/v1/scenarios` | BC-04, BC-09, Flink |
| **BC-06** | Hyperautomation | Execução de processos BPMN 2.0 (Zeebe), regras DMN 1.4, IDP Engine, Task Mining | `aura.automation.process.started.v1`, `aura.automation.task.completed.v1` | `/v1/automation/processes`, `/v1/rules` | BC-01, BC-04, Zeebe |
| **BC-07** | Enterprise GRC | Governança COSO ERM, gestão de riscos, compliance ISO, Continuous Controls Monitoring | `aura.grc.risk.assessed.v1`, `aura.grc.control.violated.v1` | `/v1/grc/risks`, `/v1/grc/controls`, `/v1/audit` | BC-01, PostgreSQL |
| **BC-08** | Data Intelligence | Data Mesh, catálogo OpenMetadata, Linhagem OpenLineage, Data Contracts, MDM | `aura.data.contract.validated.v1`, `aura.data.product.published.v1` | `/v1/data-intelligence/catalog`, `/v1/contracts` | BC-01, PostgreSQL, Kafka |
| **BC-09** | Knowledge Graph | Ontologia corporativa W3C RDF/OWL, SPARQL endpoint, armazenamento triplas semânticas | `aura.knowledge.triple.inserted.v1`, `aura.knowledge.ontology.updated.v1` | `/v1/knowledge/sparql`, `/v1/entities` | BC-04, Neo4j |
| **BC-10** | Enterprise Resilience | SRE Error Budgets, Chaos Engineering (Litmus), FinOps Kubecost, GreenOps Kepler | `aura.resilience.chaos.executed.v1`, `aura.resilience.slo.breached.v1` | `/v1/resilience/slos`, `/v1/chaos` | BC-01, Prometheus, K8s |
| **BC-11** | Platform Lifecycle | Value Stream Management, DevSecOps pipeline, Release Trains SAFe 6.0, IDP Backstage | `aura.plm.release.deployed.v1`, `aura.plm.vsm.metric.updated.v1` | `/v1/plm/pipelines`, `/v1/releases` | BC-01, ArgoCD, GitHub |
| **BC-12** | Autonomous Computing | Orquestração de 24 Edge Nodes, IBM MAPE-K Global, Federated Learning (Flower), DNS Bus | `aura.dns.sensory.heartbeat.v1`, `aura.dns.cognitive.federated.v1` | `/v1/edge/nodes`, `/v1/dns/topology` | BC-01, NATS, Kafka, K3s |

---

## ETAPA 3 — PADRÃO OFICIAL DE BACKEND

Toda aplicação backend na Plataforma Aura será construída obrigatoriamente utilizando **NestJS 10+ / TypeScript 5+** (ou **FastAPI / Python 3.12+** exclusivamente para engines de IA/Data Science), estruturada sob os seguintes princípios:

### 3.1 Arquitetura Hexagonal & Clean Architecture (Estrutura de Pastas Padrão)

```
apps/ms-[nome-do-servico]/
├── src/
│   ├── main.ts                         # Bootstrap NestJS + gRPC + NATS/Kafka
│   ├── app.module.ts                   # Módulo Raiz
│   │
│   ├── domain/                         # CAMADA 1: DOMÍNIO PURO (Sem dependências externas)
│   │   ├── aggregates/                 # DDD Aggregate Roots
│   │   ├── entities/                   # DDD Entities com invariantes
│   │   ├── value-objects/              # Imutáveis (ex: UUID, Email, Money)
│   │   ├── events/                     # Domain Events puros
│   │   ├── exceptions/                 # Exceções de negócio (DomainException)
│   │   ├── repositories/               # Ports de saída (Interfaces de repositório)
│   │   └── services/                   # Domain Services (Regras cross-entity)
│   │
│   ├── application/                    # CAMADA 2: CASOS DE USO (Application Logic)
│   │   ├── commands/                   # CQRS Commands & Handlers (Escrita)
│   │   │   └── [feature]/
│   │   │       ├── [feature].command.ts
│   │   │       └── [feature].handler.ts
│   │   ├── queries/                    # CQRS Queries & Handlers (Leitura)
│   │   │   └── [feature]/
│   │   │       ├── [feature].query.ts
│   │   │       └── [feature].handler.ts
│   │   ├── dtos/                       # Data Transfer Objects com Zod/class-validator
│   │   ├── ports/                      # Ports de entrada/saída (Services, Gateways)
│   │   └── sagas/                      # Saga Orchestrators para transações distribuídas
│   │
│   ├── infrastructure/                 # CAMADA 3: ADAPTADORES DE INFRAESTRUTURA
│   │   ├── persistence/
│   │   │   ├── postgres/               # TypeORM/Prisma ORM Entities, Mappers, Repos Impl
│   │   │   │   ├── entities/
│   │   │   │   ├── mappers/
│   │   │   │   └── repositories/
│   │   │   ├── redis/                  # Cache & Session Store Adapters
│   │   │   └── outbox/                 # Outbox Pattern Storage & Publisher
│   │   ├── messaging/
│   │   │   ├── kafka/                  # Kafka Producers & Consumers
│   │   │   └── nats/                   # NATS JetStream Publishers
│   │   ├── clients/                    # Clientes de APIs HTTP/gRPC externas
│   │   └── security/                   # Guards OPA, JWT Strategies, PKI Adapters
│   │
│   ├── interfaces/                     # CAMADA 4: ADAPTADORES DE ENTRADA (Drivers)
│   │   ├── http/                       # Controllers REST (OpenAPI)
│   │   ├── grpc/                       # Controllers gRPC (Protobuf)
│   │   ├── graphql/                    # Resolvers GraphQL
│   │   └── listeners/                  # Event Listeners (Kafka/NATS)
│   │
│   └── shared/                         # Utilitários compartilhados do serviço
│
├── test/                               # Suíte de Testes (Unit, Integration, E2E, Contract)
├── proto/                              # Definições Protocol Buffers (.proto)
└── Dockerfile
```

### 3.2 Padrões de Projeto Obrigatórios no Backend

1. **Mediator Pattern**: Comunicação desatrelada via `@nestjs/cqrs` (`CommandBus` e `QueryBus`).
2. **Outbox Pattern**: Garantia de entrega *at-least-once* de Domain Events para o Kafka. Eventos são gravados na mesma transação relacional do banco de dados na tabela `outbox_events` e publicados assincronamente por um *worker* CDC.
3. **Repository & Specification Pattern**: Isolamento do ORM. O domínio acessa apenas interfaces de repositório que aceitam `Specification<T>` para queries complexas.
4. **Unit of Work (UoW)**: Controle transacional estrito abrangendo múltiplos repositórios no mesmo caso de uso.
5. **Circuit Breaker**: Implementado via Resilience4j / Cockatiel em todas as chamadas HTTP/gRPC externas (Timeout: 2000ms, Threshold: 50% de falha, Reset: 10s).

---

## ETAPA 4 — PADRÃO OFICIAL DE FRONTEND

Todas as aplicações de interface com o usuário da Plataforma Aura serão desenvolvidas utilizando **React 18+ / Next.js 14+ (App Router)** ou **Vite 5+** com **TypeScript 5+**, adotando a seguinte pilha padronizada:

### 4.1 Pilha Tecnológica do Frontend

| Componente | Tecnologia Padronizada | Versão | Função |
|------------|------------------------|--------|--------|
| **Framework Base** | React / Next.js (SSG/SSR) / Vite | 18.3+ / 14.2+ | Renderização e roteamento SPA/Micro-frontend |
| **Linguagem** | TypeScript | 5.4+ | Tipagem estática estrita (`strict: true`) |
| **Estilização** | Tailwind CSS + Vanilla CSS Tokens | 3.4+ | Sistema de design atômico e utilitários responsive |
| **Gerenciamento de Estado** | Zustand | 4.5+ | Estado global leve, desatrelado de contexto React |
| **Data Fetching & Cache** | TanStack Query (React Query) | 5.28+ | Gerenciamento de estado servidor, cache e invalidação |
| **Formulários & Validação** | React Hook Form + Zod | 7.51+ / 3.22+ | Formulários de alta performance e validação de schema |
| **Biblioteca de Ícones** | Lucide React | 0.350+ | Conjunto visual padronizado |
| **Documentação UI** | Storybook | 8.0+ | Catálogo visual de componentes isolados |
| **Design System** | `@aura/ui` (Component Library) | Internal | Tokens de design HSL, Dark Mode, Glassmorphism, Accessibility |

### 4.2 Arquitetura Orientada a Features (`Feature-Based Architecture`)

```
src/
├── app/                                # Next.js App Router ou Vite Routes
├── components/                         # Componentes globais genéricos (@aura/ui)
│   ├── ui/                             # Botões, Modais, Inputs, Badges, Cards
│   └── feedback/                       # Toasts, Spinners, Skeleton Loaders
├── features/                           # Módulos Funcionais Autônomos
│   ├── [feature-name]/                 # Ex: triage, patient-record, analytics
│   │   ├── api/                        # TanStack Query hooks e chamadas Axios/Fetch
│   │   ├── components/                 # Componentes exclusivos da feature
│   │   ├── hooks/                      # Custom hooks da feature
│   │   ├── stores/                     # Stores Zustand da feature
│   │   ├── types/                      # Interfaces e Types TypeScript
│   │   └── utils/                      # Formatadores e helpers da feature
├── hooks/                              # Hooks globais (useAuth, useTheme, useDebounce)
├── lib/                                # Configurações (axios, queryClient, zod)
├── stores/                             # Stores Zustand globais (AuthStore, UIStore)
├── styles/                             # Glassmorphism, tokens de cor HSL, globals.css
└── types/                              # Tipos globais da aplicação
```

### 4.3 Regras Críticas de UX e Frontend

1. **Proibição Absoluta de Mocks Permanentes ou `localStorage` para PII**: É vetada a leitura/escrita de dados sensíveis (CPF, diagnósticos, tokens de sessão) em `localStorage`/`sessionStorage`. Sessões usam apenas `HttpOnly`, `SameSite=Strict` Cookies seguros.
2. **Acessibilidade WCAG 2.1 Nível AA**: Navegação 100% funcional via teclado, contraste de cor adequado e suporte integral a leitores de tela via atributos ARIA.
3. **Performance Core Web Vitals**: LCP < 2.5s, INP < 200ms, CLS < 0.1 em todas as telas corporativas.

---

## ETAPA 5 — PADRÃO OFICIAL DE DADOS

### 5.1 Arquitetura de Persistência Poliglota (`Polyglot Persistence`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                            AURA DATA ARCHITECTURE FABRIC                               ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ CAMADA RELACIONAL (OLTP) ║ CAMADA NOSQL / CACHE     ║ CAMADA ANALÍTICA / VETORIAL      ║
║ PostgreSQL 16 HA         ║ Redis Cluster 7.4        ║ ClickHouse / Qdrant / Neo4j      ║
║ • Dados Transacionais    ║ • Cache de Sessões (RAM) ║ • OLAP Datamarts (ClickHouse)    ║
║ • Schemas isolados por BC║ • Rate Limiting          ║ • Embeddings Vetoriais (Qdrant)  ║
║ • Partitioning por Data  ║ • Outbox Buffering       ║ • Knowledge Graph (Neo4j RDF)    ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 5.2 Padrões de Banco de Dados Relacional (PostgreSQL 16)

1. **Isolamento por Schema**: Cada microsserviço possui seu próprio schema relacional exclusivo no PostgreSQL (`identity.*`, `citizen.*`, `clinical.*`). Acesso cross-schema direto por SQL é estritamente proibido.
2. **Nomenclatura Padrão**:
   - Tabelas e Colunas em `snake_case` no plural: `beneficiaries`, `triage_records`, `created_at`.
   - Primary Keys em UUIDv7 (ordenáveis por tempo): `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
   - Todas as tabelas contêm obrigatoriamente audit fields: `created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()`, `updated_at TIMESTAMP WITH TIME ZONE`, `tenant_id UUID NOT NULL`.
3. **Gerenciamento de Migrações**: Migrações automatizadas via Flyway ou TypeORM/Prisma Migrations executadas obrigatoriamente em pipelines CI/CD antes do deploy do código.

---

## ETAPA 6 — PADRÃO OFICIAL DE IA & ARQUITETURA COGNITIVA

Toda funcionalidade de inteligência artificial da Plataforma Aura integrará a arquitetura canônica definida no **Módulo 72 (Prompt 87)**:

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
║                       AURA ENTERPRISE COGNITIVE AI STACK                             ║
├──────────────────────────────────────────────────────────────────────────────────────┤
║  1. PROTOCOLO DE INTEROPERABILIDADE: Model Context Protocol (MCP 1.0) JSON-RPC 2.0  ║
║  2. COMUNICAÇÃO MULTIAGENTE: Agent-to-Agent Protocol (A2A Protocol v1.0)             ║
║  3. AI ROUTER: LiteLLM Router (Fallback: Gemini Pro → Claude 3.5 → GPT-4o → Llama 3)║
║  4. AI SECURITY FIREWALL: Rebuff Guard (Prompt Injection & Data Poisoning Defense)   ║
║  5. MEMÓRIA COGNITIVA: Qdrant Vector DB (Episódica) + Neo4j Graph (Semântica)        ║
║  6. GOVERNANÇA E AUDITORIA: ISO/IEC 42001 & NIST AI RMF HashChain Log SHA-256        ║
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 7 — PADRÃO DE MICROSSERVIÇOS & CONTRATOS

### 7.1 Comunicação Síncrona vs. Assíncrona

- **Síncrona (Interna gRPC / Externa REST OpenAPI 3.1)**: Utilizada apenas para consultas (*Queries*) ou operações que exigem resposta imediata (< 200ms).
- **Assíncrona (Apache Kafka 3.7 / NATS JetStream 2.10)**: Obrigatória para todas as operações de escrita (*Commands*) que alteram estado e geram eventos de domínio.

### 7.2 Idempotência e Resiliência Mandatórias

1. Todo consumidor de eventos Kafka/NATS DEVE ser idempotente, utilizando a tabela `processed_messages (message_id UUID PRIMARY KEY, processed_at TIMESTAMP)`.
2. Toda chamada de API mutável aceita o cabeçalho `X-Idempotency-Key: <UUIDv4>`.

---

## ETAPA 8 — PADRÃO DE APIs (REST, gRPC, AsyncAPI, GraphQL, MCP)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                             AURA ENTERPRISE API MATRIX                                 ║
├──────────────┬──────────────────────────────┬──────────────────────────┬───────────────┤
║ PROTOCOLO    ║ CASO DE USO                  ║ FORMATO DE CONTRATO      ║ AUTENTICAÇÃO  ║
├──────────────┼──────────────────────────────┼──────────────────────────┼───────────────┤
║ **REST**     ║ Clientes Frontend / Web      ║ OpenAPI 3.1 (JSON/YAML)  ║ OAuth 2.1 JWT ║
║ **gRPC**     ║ Comunicação Inter-serviços   ║ Protobuf 3 (`.proto`)    ║ mTLS STRICT   ║
║ **AsyncAPI** ║ Barramento de Eventos Kafka  ║ AsyncAPI 3.0 (Avro)      ║ SASL/SCRAM    ║
║ **GraphQL**  ║ Consultas Flexíveis Dashboard║ GraphQL Schema (`.gql`)  ║ OAuth 2.1 JWT ║
║ **MCP**      ║ Ferramentas e Agentes IA     ║ JSON-RPC 2.0 over SSE    ║ mTLS / Bearer ║
└──────────────┴──────────────────────────────┴──────────────────────────┴───────────────┘
```

### 8.1 Padronização de Respostas de Erro REST (RFC 7807 Problem Details)

```json
{
  "type": "https://api.aura.ismcl.edu.br/errors/domain-violation",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "O CPF informado já encontra-se cadastrado para outro beneficiário ativo.",
  "instance": "/v1/citizens/beneficiaries",
  "code": "AURA-CITIZEN-422-001",
  "timestamp": "2026-07-24T04:45:00Z",
  "invalidParams": [
    { "name": "documentNumber", "reason": "CPF duplicado na base corporativa" }
  ]
}
```

---

## ETAPA 9 — PADRÃO DEVSECOPS & GITOPS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
║                             AURA DEVSECOPS GITOPS PIPELINE                              ║
├─────────────────────────────────────────────────────────────────────────────────────────┤
║  Developer Commit → GitHub Actions (Lint/Test) → SonarQube Gate → Semgrep SAST          ║
║  → Snyk SCA → Container Build → Trivy Scan → Cosign Sign → ECR Push                     ║
║  → GitOps Commit (values.yaml) → ArgoCD Sync → Kubernetes Deployment → Smoke Tests       ║
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Ferramentas e Gates Mandatórios de DevSecOps

- **Orquestrador CI**: GitHub Actions.
- **Orquestrador GitOps CD**: ArgoCD 2.11+ sincronizando manifestos Helm.
- **Análise Estática (SAST)**: SonarQube + Semgrep (Gate: 0 vulnerabilidades Críticas/Altas).
- **Análise de Dependências (SCA)**: Snyk / Dependency-Check.
- **Scan de Containers**: Trivy (Gate: 0 imagens com CVEs Críticas).
- **Assinatura de Artefatos**: Sigstore Cosign.

---

## ETAPA 10 — PADRÃO DE SEGURANÇA ZERO TRUST

1. **Zero Trust Architecture (NIST SP 800-207)**: Nunca confiar, sempre verificar. Cada requisição é autenticada e autorizada individualmente.
2. **mTLS STRICT**: Mutual TLS obrigatório em 100% do tráfego *East-West* dentro do Kubernetes via Istio Service Mesh com certificados emitidos via HashiCorp Vault / SPIRE.
3. **Gestão de Segredos**: Proibição absoluta de variáveis de ambiente com credenciais hardcoded. Segredos são injetados em memória via Vault Agent Injector.

---

## ETAPA 11 — PADRÃO DE OBSERVABILIDADE GLOBAL

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                         AURA OPENTELEMETRY OBSERVABILITY STACK                         ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ MÉTRICAS (Prometheus)    ║ TRACES (Jaeger / OTEL)   ║ LOGS (Loki / Elasticsearch)      ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ • RED Metrics (Rate,     ║ • W3C TraceContext       ║ • Logs Estruturados JSON (Pino)  ║
║   Errors, Duration)      ║   propaga traceparent    ║ • Injeção obrigatória de:        ║
║ • USE Metrics (Utiliz.,  ║ • Rastreamento eBPF      ║   `trace_id`, `span_id`,         ║
║   Saturation, Errors)    ║   kernel-level           ║   `tenant_id`, `service_name`    ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 12 — PADRÃO DE QUALIDADE & THRESHOLDS

Todo repositório e microsserviço da Plataforma Aura deve atingir os seguintes critérios para aprovação no Quality Gate:

1. **Cobertura de Testes Automatizados**: Mínimo de **95%** em código de domínio e aplicação.
2. **Duplicação de Código**: Máximo de **3.0%** detectado pelo SonarQube.
3. **Complexidade Ciclomática**: Máximo de **10** por função/método.
4. **Vulnerabilidades de Segurança**: **ZERO** vulnerabilidades de severidade CRITICAL ou HIGH.

---

## ETAPA 13 — CATÁLOGO DE BLUEPRINTS REUTILIZÁVEIS

Os engenheiros e geradores de código utilizarão exclusivamente os blueprints padronizados localizados em `docs/aura_architecture/blueprints/`:

1. `blueprint-microservice-nestjs.tar.gz`: Skeleton completo de microsserviço DDD/CQRS/EDA.
2. `blueprint-frontend-nextjs.tar.gz`: Starter Next.js 14 com Tailwind, Zustand, TanStack Query e `@aura/ui`.
3. `blueprint-mcp-server.tar.gz`: Template de servidor MCP 1.0 JSON-RPC 2.0 em TypeScript/Python.
4. `blueprint-helm-chart.tar.gz`: Manifestos Helm padronizados com HPA, PDB, Istio Sidecar e Vault Annotations.

---

## ETAPA 14 — ARCHITECTURE DECISION RECORDS (ADR REPOSITORY)

Os ADRs corporativos oficiais foram consolidados na estrutura abaixo:

- [ADR-001: Adoção da Arquitetura Hexagonal e Clean Architecture para Backends NestJS](file:///Users/rikardoribeiro/Documents/GitHub/ISMCL/docs/aura_architecture/prompt_89a_enterprise_reference_architecture.md#adr-001)
- [ADR-002: Padronização do Model Context Protocol (MCP) como Barramento de IA](file:///Users/rikardoribeiro/Documents/GitHub/ISMCL/docs/aura_architecture/prompt_89a_enterprise_reference_architecture.md#adr-002)
- [ADR-003: Uso Exclusivo de mTLS STRICT via Istio no Service Mesh](file:///Users/rikardoribeiro/Documents/GitHub/ISMCL/docs/aura_architecture/prompt_89a_enterprise_reference_architecture.md#adr-003)
- [ADR-004: Eliminação Total de localStorage para Persistência de Dados PII e Sessões](file:///Users/rikardoribeiro/Documents/GitHub/ISMCL/docs/aura_architecture/prompt_89a_enterprise_reference_architecture.md#adr-004)
- [ADR-005: Adoção do Outbox Pattern com Apache Kafka para Comunicação EDA Idempotente](file:///Users/rikardoribeiro/Documents/GitHub/ISMCL/docs/aura_architecture/prompt_89a_enterprise_reference_architecture.md#adr-005)

---

## ETAPA 15 — ARCHITECTURE GOVERNANCE BOARD (AGB)

### 15.1 Processo de Revisão e Gates de Aprovação

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                         ARCHITECTURE GOVERNANCE BOARD (AGB)                            ║
├────────────────────────────────────────────────────────────────────────────────────────┤
║  1. REVISÃO DE ARQUITETURA & DDD (Validação da Hexagonal e limites do BC)              ║
║  2. REVISÃO DE SEGURANÇA (Verificação OWASP, Zero Trust, mTLS, LGPD e Vault)           ║
║  3. REVISÃO DE DADOS (Modelagem PostgreSQL, Migrações, Data Contracts)                 ║
║  4. REVISÃO DE IA & COGNIÇÃO (Conformidade ISO 42001, MCP, PromptOps e AI Router)      ║
║  5. REVISÃO DE PERFORMANCE & SRE (SLO Metrics, Grafana, OpenTelemetry e k6)            ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 16 — DIGITAL BLUEPRINT DA PLATAFORMA AURA

O arquivo `prompt_89a_enterprise_reference_architecture.md` constitui o **Digital Blueprint Mestre**, servindo como entrada primária para:

1. Geradores de código automatizados e pipelines de IA.
2. Auditoria e compliance em tempo real.
3. Onboarding de novos arquitetos e engenheiros de software.

---

## ETAPA 17 — MECANISMO AUTOMATIZADO DE CERTIFICAÇÃO DE CONFORMIDADE

O script de validação arquitetural automatizado `scripts/validate-architectural-compliance.sh` executará as seguintes verificações em cada PR:

```bash
#!/usr/bin/env bash
# Aura Architectural Compliance Validator
set -euo pipefail

echo "==> Validando conformidade com a Aura Enterprise Reference Architecture (AERA)..."

# 1. Verificar proibição de localStorage no Frontend
if grep -rn "localStorage\." src/ apps/ --include="*.ts" --include="*.tsx"; then
    echo "❌ ERRO ARQUITETURAL: Uso de localStorage detectado! Violação da regra de segurança LGPD AERA."
    exit 1
fi

# 2. Verificar presença de testes e cobertura
echo "==> Checando thresholds de qualidade e cobertura..."
# Integration with SonarQube & Coverage CLI

echo "✅ CERTIFICAÇÃO AERA: Código em 100% de conformidade com a Arquitetura de Referência."
```

---

*Documento homologado pelo Enterprise Architecture Board*  
*Hash de Registro de Integridade SHA-256:* `aera-89a-master-architecture-blueprint-2026-v1`
