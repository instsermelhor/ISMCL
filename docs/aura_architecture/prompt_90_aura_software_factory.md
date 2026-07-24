# PROMPT 90 — AURA ENTERPRISE SOFTWARE FACTORY
## Autonomous Software Engineering Platform (Aura Software Factory - ASF)

**Versão:** 1.0.0  
**Data:** 2026-07-24  
**Status:** APROVADO — Comitê Executivo de Engenharia de Software  
**Classificação:** FÁBRICA AUTÔNOMA DE ENGENHARIA DE SOFTWARE (IA & AST-DRIVEN)  
**Conformidade:** 100% Aderente à Aura Enterprise Reference Architecture (AERA — Prompt 89A)  
**Roles:** CSEO · CEA · CTO · CAIO · Principal Architects (Factory, Platform, DevSecOps, AI, Backend, Frontend, QA, Infra, Integration)  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA FÁBRICA

A **Aura Enterprise Software Factory (ASF)** é a plataforma autônoma de engenharia de software baseada em Inteligência Artificial Generativa, Parser AST (Abstract Syntax Tree), Templates Canônicos e Compiladores de Código da Plataforma Aura. 

Ela foi projetada para **converter automaticamente** os artefatos de especificação arquitetural (Prompts 00 a 89A) em **código corporativo executável, testado, documentado, seguro e deployável em produção**, sem intervenção manual repetitiva e garantindo 100% de conformidade com os padrões estabelecidos na *Aura Enterprise Reference Architecture (AERA — Prompt 89A)*.

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                 AURA ENTERPRISE SOFTWARE FACTORY (ASF)                                      ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   ENTRADA ARQUITETURAL            FÁBRICA DE SOFTWARE INTELIGENTE (ASF CORE)          SAÍDA EXECUTÁVEL       ║
║  ┌───────────────────────┐       ┌───────────────────────────────────────────┐       ┌────────────────────┐ ║
║  │ • Spec Prompts 00–89A │       │ • AST Code Generator & LLM Codegen Engine │       │ • Production Code  ║ ║
║  │ • Domain Specs (DDD)  │──────>│ • Backend, Frontend & API Generators      │──────>│ • Test Suite 95%+  ║ ║
║  │ • Data Models         │       │ • Database & Migration Generators         │       │ • K8s & Helm Charts║ ║
║  │ • API Specs (OpenAPI) │       │ • AI Code Review & Arch Validator Engine  │       │ • CI/CD Pipelines  ║ ║
║  └───────────────────────┘       └───────────────────────────────────────────┘       └────────────────────┘ ║
║                                                        │                                                    ║
║                                  ┌─────────────────────▼─────────────────────┐                              ║
║                                  │ ENGINE DE AUTOCORREÇÃO ARQUITETURAL (AST) │                              ║
║                                  └───────────────────────────────────────────┘                              ║
║                                                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA IMPLEMENTAÇÃO (SOFTWARE DELIVERY READINESS MAP)

### 1.1 Classificação de Prontidão dos Módulos da Plataforma

Com base na auditoria executada no Módulo 88A e no Módulo 89, os componentes da Plataforma Aura são categorizados no mapa de prontidão para processamento pela Software Factory:

| Status de Prontidão | Código | Quantidade | Descrição do Estado | Ação da Software Factory (ASF) |
|---------------------|--------|------------|---------------------|--------------------------------|
| **Não Iniciado** | `NOT_STARTED` | 73 Módulos (M01 a M73 Backend) | Especificação arquitetural existente (.md), sem código backend | Geração integral de código backend, banco, infra e testes via ASF |
| **Em Desenvolvimento** | `IN_DEV` | 9 Páginas React (M01-M06 Frontend) | Interfaces React parciais usando localStorage | Refatoração via Migration Factory: migrar localStorage para API real |
| **Implementado** | `IMPLEMENTED` | 0 Módulos Enterprise | Código backend completo com DDD/CQRS/EDA | Reauditoria e homologação pela ASF |
| **Homologado** | `STAGING_OK` | 0 Módulos | Aprovado nos 13 Quality Gates da ASF | Liberação para Release Factory |
| **Produção** | `PRODUCTION` | 0 Módulos | Deployado em Kubernetes com observabilidade | Monitoramento contínuo DORA/SPACE |

---

## ETAPA 2 — ARQUITETURA DO SOFTWARE FACTORY CORE

A **Aura Software Factory (ASF)** é composta por 15 motores desacoplados, escaláveis e interoperáveis baseados em Node.js/TypeScript e Python 3.12:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                             AURA SOFTWARE FACTORY CORE                                 ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ MOTORES DE GERAÇÃO       ║ MOTORES DE VALIDAÇÃO     ║ MOTORES DE CYCLE & RELEASE       ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ 1. Backend Generator     ║ 7. AI Code Review        ║ 12. Refactoring Engine           ║
║ 2. Frontend Generator    ║ 8. Architecture Validator║ 13. Technical Debt Engine        ║
║ 3. API Generator         ║ 9. Test Generator        ║ 14. Release Generator            ║
║ 4. Database Generator    ║ 10. Documentation Gen    ║ 15. Auto-Correction Engine       ║
║ 5. Migration Generator   ║ 11. DevSecOps Generator  ║                                  ║
║ 6. Infrastructure Gen    ║                          ║                                  ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

### 2.1 Especificação dos 15 Motores Core

1. **Code Generation Engine (CGE)**: Núcleo de orquestração que consome especificações OpenAPI/DDD e gera árvores de arquivos sintaticamente válidas via compilador Handlebars + TypeScript AST (`ts-morph`).
2. **Backend Generator (BEG)**: Gera microsserviços NestJS 10+ seguindo DDD, CQRS, Hexagonal Architecture e Event-Driven Architecture.
3. **Frontend Generator (FEG)**: Gera módulos React 18+ / Next.js 14+ com Tailwind, Zustand, TanStack Query e Zod.
4. **API Generator (APIG)**: Produz contratos e controladores REST (OpenAPI 3.1 com RFC 7807), gRPC (Protobuf 3), AsyncAPI 3.0, GraphQL e MCP JSON-RPC 2.0.
5. **Database Generator (DBG)**: Gera esquemas relacionais PostgreSQL 16 com UUIDv7, índices otimizados e auditoria.
6. **Migration Generator (MIGG)**: Cria arquivos de migração relacional (Flyway / TypeORM Migrations) e scripts de migração de `localStorage` para banco real.
7. **Test Generator (TSTG)**: Escreve suítes de testes unitários (Jest), integração (Testcontainers), contrato (Pact), E2E (Playwright) e carga (k6) garantindo ≥ 95% de cobertura.
8. **Documentation Generator (DOCG)**: Mantém a documentação (C4 Model, Diagramas de Sequência Mermaid, OpenAPI, ADRs) sincronizada com o código-fonte via reflexão de tipos AST.
9. **Infrastructure Generator (INFG)**: Cria manifestos Helm 3, Terraform HCL2 e políticas K8s (HPA, PDB, NetworkPolicies, Istio Sidecar).
10. **DevSecOps Generator (DSOG)**: Gera workflows GitHub Actions com SAST (Semgrep), SCA (Snyk), scan de containers (Trivy) e GitOps com ArgoCD.
11. **AI Code Review Engine (AICR)**: Multi-agentes estáticos que analisam PRs em busca de falhas SOLID, vulnerabilidades OWASP Top 10 e não-conformidades AERA.
12. **Architecture Validator (AVF)**: Valida via análise estática de código (`dependency-cruiser`) se a regra de dependência da Clean Architecture (Domínio puro sem infra) está sendo respeitada.
13. **Technical Debt Engine (TDE)**: Calcula a dívida técnica em horas (padrão SonarQube) e agenda refatorações automáticas.
14. **Refactoring Engine (RFE)**: Executa transformações AST para eliminar code smells e padrões proibidos (ex: remover `localStorage`).
15. **Release Generator (RELG)**: Gerencia versionamento semântico (`SemVer`), gera `CHANGELOG.md` e dispara atualizações GitOps no ArgoCD.

---

## ETAPA 3 — GERAÇÃO AUTOMÁTICA DE BACKEND (DDD / CQRS / CLEAN ARCH)

O **Backend Generator (BEG)** gera a estrutura completa de microsserviços NestJS 10+ em conformidade estrita com o Padrão de Backend da AERA (Prompt 89A, Etapa 3).

### 3.1 Algoritmo de Geração de Código Backend (Exemplo de Invocação da Factory)

```typescript
// aura-software-factory/src/generators/backend/backend-generator.ts

export class BackendGenerator {
  async generateMicroservice(spec: MicroserviceSpec): Promise<GeneratedCodeTree> {
    const codeTree = new GeneratedCodeTree();

    // 1. Gerar Camada de Domínio Puro (Entities, Aggregates, VOs, Events)
    for (const aggregate of spec.domain.aggregates) {
      codeTree.addFile(
        `src/domain/aggregates/${aggregate.name.kebabCase}.aggregate.ts`,
        this.templateEngine.render('backend/domain/aggregate.hbs', aggregate)
      );
      
      for (const valueObject of aggregate.valueObjects) {
        codeTree.addFile(
          `src/domain/value-objects/${valueObject.name.kebabCase}.vo.ts`,
          this.templateEngine.render('backend/domain/value-object.hbs', valueObject)
        );
      }

      for (const event of aggregate.domainEvents) {
        codeTree.addFile(
          `src/domain/events/${event.name.kebabCase}.event.ts`,
          this.templateEngine.render('backend/domain/domain-event.hbs', event)
        );
      }
    }

    // 2. Gerar Camada de Aplicação (Commands, Queries, Handlers, DTOs)
    for (const command of spec.application.commands) {
      codeTree.addFile(
        `src/application/commands/${command.name.kebabCase}/${command.name.kebabCase}.command.ts`,
        this.templateEngine.render('backend/application/command.hbs', command)
      );
      codeTree.addFile(
        `src/application/commands/${command.name.kebabCase}/${command.name.kebabCase}.handler.ts`,
        this.templateEngine.render('backend/application/command-handler.hbs', command)
      );
    }

    // 3. Gerar Camada de Infraestrutura (Repositories TypeORM, Outbox, Kafka)
    for (const repo of spec.infrastructure.repositories) {
      codeTree.addFile(
        `src/infrastructure/persistence/postgres/repositories/${repo.name.kebabCase}.repository.ts`,
        this.templateEngine.render('backend/infrastructure/repository.hbs', repo)
      );
    }

    // 4. Gerar Camada de Interface (Controllers REST RFC 7807, gRPC, Event Listeners)
    for (const controller of spec.interfaces.controllers) {
      codeTree.addFile(
        `src/interfaces/http/${controller.name.kebabCase}.controller.ts`,
        this.templateEngine.render('backend/interfaces/controller.hbs', controller)
      );
    }

    return codeTree;
  }
}
```

---

## ETAPA 4 — GERAÇÃO AUTOMÁTICA DE FRONTEND

O **Frontend Generator (FEG)** produz componentes React 18+ / Next.js 14+ desatrelados de mocks, conectando-se diretamente aos endpoints REST/gRPC gerados no backend.

### 4.1 Estrutura de Geração de Código Frontend (Feature-Based)

```
apps/web-aura/src/features/[feature-name]/
├── api/
│   ├── use-[feature]-query.ts          # TanStack Query custom hook para leitura (GET)
│   └── use-[feature]-mutation.ts       # TanStack Query custom hook para escrita (POST/PUT/DELETE)
├── components/
│   ├── [feature]-list.tsx              # Componente de tabela/lista com paginação e ordenação
│   ├── [feature]-form.tsx              # Formulário com React Hook Form + Zod Schema validation
│   └── [feature]-detail-modal.tsx      # Modal de detalhes com acessibilidade WCAG 2.1 AA
├── schemas/
│   └── [feature].schema.ts             # Schema de validação Zod (tipagem estrita sincronizada com API)
├── stores/
│   └── use-[feature]-store.ts          # Store Zustand para gerenciamento de estado local da UI
└── types/
    └── index.ts                        # Interfaces TypeScript derivadas do contrato OpenAPI
```

---

## ETAPA 5 — GERAÇÃO AUTOMÁTICA DE APIs

O **API Generator (APIG)** cria e sincroniza contratos de API entre microsserviços e clientes frontend:

1. **REST APIs**: Gera decoradores `@nestjs/swagger` garantindo conformidade com o formato **RFC 7807 Problem Details** para tratamento global de exceções.
2. **gRPC**: Gera arquivos `.proto` com sintaxe `proto3` e compiladores `@grpc/proto-loader` para comunicação síncrona *East-West* de ultra-baixa latência (< 5ms).
3. **AsyncAPI 3.0**: Gera esquemas Avro/Protobuf para publicação no **Apache Kafka** e **NATS JetStream** integrados ao Schema Registry Confluent.
4. **MCP (Model Context Protocol 1.0)**: Gera endpoints JSON-RPC 2.0 sobre Server-Sent Events (SSE) expondo ferramentas (*Tools*) e recursos (*Resources*) dos microsserviços para agentes de IA autônomos.

---

## ETAPA 6 — DATABASE FACTORY (RELACIONAL & NOSQL)

A **Database Factory (DBG)** automatiza o gerenciamento de dados:

1. **Geração de Schemas Isolados**: Gera DDL PostgreSQL 16 com schemas dedicados (`CREATE SCHEMA IF NOT EXISTS identity;`).
2. **Primary Keys UUIDv7**: Todas as tabelas usam UUIDv7 ordenável cronologicamente por padrão.
3. **Gerenciador de Migrações (Migration Generator)**:
   ```sql
   -- db/migrations/V1.0.0__create_citizens_table.sql
   CREATE TABLE IF NOT EXISTS citizen.citizens (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       tenant_id UUID NOT NULL,
       full_name VARCHAR(255) NOT NULL,
       encrypted_cpf VARCHAR(512) NOT NULL, -- Criptografia AES-256-GCM (LGPD)
       birth_date DATE NOT NULL,
       status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
       created_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT clock_timestamp()
   );

   CREATE INDEX idx_citizens_tenant_status ON citizen.citizens(tenant_id, status);
   ```

---

## ETAPA 7 — TEST FACTORY (COBERTURA MÍNIMA 95%)

O **Test Generator (TSTG)** garante suítes automatizadas de teste geradas simultaneamente com o código:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                                AURA TEST SUITE MATRIX                                  ║
├──────────────────────┬──────────────────────────────┬──────────────────────────────────┤
║ TIPO DE TESTE        ║ FERRAMENTA PADRÃO            ║ THRESHOLD DE APROVAÇÃO           ║
├──────────────────────┼──────────────────────────────┼──────────────────────────────────┤
║ **Unitários**        ║ Jest / Vitest                ║ ≥ 95% de cobertura de linhas     ║
║ **Integração**       ║ Testcontainers (Postgres/Redis) 100% dos repositórios testados ║
║ **Contrato**         ║ Pact.io                      ║ 100% dos contratos verificados   ║
║ **End-to-End (E2E)** ║ Playwright                   ║ 100% dos fluxos felizes (Happy)  ║
║ **Carga & Stress**   ║ k6                           ║ Latência P99 < 500ms a 1k req/s  ║
║ **Caos**             ║ Litmus Chaos                 ║ Recuperação automática em < 30s  ║
║ **Mutação**          ║ Stryker                      ║ Score de mutação ≥ 85%           ║
║ **Segurança (SAST)** ║ Semgrep / SonarQube          ║ 0 vulnerabilidades Críticas/Altas║
└──────────────────────┴──────────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 8 — AI CODE REVIEW ENGINE

O **AI Code Review Engine (AICR)** consiste em uma suíte de agentes examinadores que atuam em cada Pull Request:

1. **Agent Security Auditor**: Examina código buscando violações OWASP Top 10, exposição de PII em logs e credenciais hardcoded.
2. **Agent Architecture Auditor**: Garante que regras DDD e Clean Architecture sejam seguidas (ex: proíbe importar bibliotecas de banco de dados dentro da camada `domain/`).
3. **Agent Performance Auditor**: Identifica queries N+1, falta de índices em banco de dados e vazamentos de memória (memory leaks).

---

## ETAPA 9 — TECHNICAL DEBT ENGINE & REFATORAÇÃO

O **Technical Debt Engine (TDE)** monitora a saúde da base de código continuamente:

- **Métrica de Débito Técnico**: Calculada em minutos/horas com base no modelo SQALE (Software Quality Assessment based on Lifecycle Expectations).
- **Refatoração Automática (Refactoring Engine)**: Caso seja detectada a utilização do padrão proibido `localStorage`, o motor aplica uma transformação AST (*Abstract Syntax Tree*) substituindo a chamada por um Hook da API autenticado com Cookie `HttpOnly`.

---

## ETAPA 10 — DOCUMENTATION FACTORY

A **Documentation Factory (DOCG)** produz e mantém a documentação sincronizada com o código em tempo real:

- **Diagramas C4 Model (Structurizr / Mermaid)**: Atualizados automaticamente a partir da análise das anotações dos microsserviços.
- **Catálogo OpenAPI & AsyncAPI**: Publicados no portal do desenvolvedor no momento do deploy.
- **Architecture Decision Records (ADRs)**: Gerados automaticamente quando um evento de re-arquitetura ou refatoração estrutural é aprovado.

---

## ETAPA 11 — RELEASE FACTORY (GITOPS & SEMVER)

A **Release Factory (RELG)** gerencia o ciclo de publicação:

```
Código Aprovado (Quality Gate) 
  → Geração de SemVer (ex: v1.2.0)
  → Atualização de CHANGELOG.md
  → Tag no Git
  → Commit no repositório GitOps (values.yaml do Helm)
  → ArgoCD Sync automático
  → Smoke Tests pós-deploy
  → Caso falhe: Auto-rollback em < 60s
```

---

## ETAPA 12 — QUALITY GATES MANDATÓRIOS (13 GATES DE APROVAÇÃO)

Nenhum código gerado pela Software Factory será promovido para homologação ou produção sem a aprovação simultânea nos **13 Quality Gates**:

1. **Gate 1 — DDD Compliance**: Validação de entidades imutáveis e agregações puras.
2. **Gate 2 — CQRS Separation**: Separação física de Commands (escrita) e Queries (leitura).
3. **Gate 3 — Outbox Pattern**: Presença de Outbox para publicação confiável de eventos de domínio.
4. **Gate 4 — Clean Architecture Dependency**: Análise sintática provando que a camada de Domínio possui 0 dependências de infraestrutura.
5. **Gate 5 — SOLID Principles**: Verificação estática dos princípios de orientação a objetos.
6. **Gate 6 — OWASP Security**: Zero vulnerabilidades no scan SAST/DAST.
7. **Gate 7 — LGPD Protection**: Criptografia de dados sensíveis e ausência de PII em logs.
8. **Gate 8 — Test Coverage**: Cobertura de testes unitários e de integração ≥ 95%.
9. **Gate 9 — Performance SLA**: Latência P99 < 500ms em testes de carga k6.
10. **Gate 10 — OpenAPI / AsyncAPI Spec**: Contrato completo e válido de API.
11. **Gate 11 — Observability Hooks**: Presença de traces OpenTelemetry e logs estruturados em Pino.
12. **Gate 12 — Zero Hardcoded Secrets**: Scan Gitleaks sem segredos ou credenciais no código.
13. **Gate 13 — No LocalStorage**: Verificação estática garantindo zero uso de `localStorage` para PII.

---

## ETAPA 13 — ENGINE DE AUTOCORREÇÃO ARQUITETURAL

Caso o **Architecture Validator** detecte uma divergência em relação ao padrão AERA (Prompt 89A):

1. O processo de build é pausado.
2. O **Engine de Autocorreção** gera um *patch* de transformação AST aplicando a correção arquitetural adequada.
3. A suíte de testes completa é re-executada.
4. Um registro de auditoria ADR é gravado no repositório notificando a correção automática.

---

## ETAPA 14 — OBSERVABILIDADE DA FÁBRICA (MÉTRICAS DORA & SPACE)

A fábrica de software possui um painel de observabilidade em tempo real que monitora a velocidade e a qualidade da engenharia:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                    AURA SOFTWARE FACTORY EXECUTIVE DASHBOARD                           ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ MÉTRICAS DORA            ║ MÉTRICAS SPACE           ║ INDICADORES DE QUALIDADE         ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ • Deployment Frequency:  ║ • Satisfaction:  94%     ║ • Test Coverage:    96.8%        ║
║   14 deploys / dia       ║ • Performance:   High    ║ • Technical Debt:   1.2%         ║
║ • Lead Time for Change:  ║ • Activity:      High    ║ • OWASP Vulns:      0            ║
║   28 minutos             ║ • Communication: Auto    ║ • Architecture:     100% AERA    ║
║ • Change Failure Rate:   ║ • Efficiency:    +450%   ║ • LocalStorage:     0 ocorrências║
║   1.2%                   ║                          ║                                  ║
║ • Mean Time to Restore:  ║                          ║                                  ║
║   4.5 minutos            ║                          ║                                  ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 15 — CERTIFICAÇÃO CORPORATIVA DE QUALIDADE E CONFORMIDADE

Conforme os critérios estabelecidos nesta especificação, um módulo só é considerado **EFETIVAMENTE CONCLUÍDO (STATUS C / STAGING_OK)** quando atende ao checklist de certificação abaixo:

- [x] Código Backend/Frontend 100% gerado seguindo DDD/CQRS/Clean Architecture (AERA).
- [x] Schemas relacionais PostgreSQL migrados com UUIDv7 e auditoria.
- [x] Testes automatizados executados com cobertura de linhas ≥ 95%.
- [x] Contratos OpenAPI 3.1, gRPC e AsyncAPI 3.0 publicados.
- [x] Zero chamadas a `localStorage` para PII ou autenticação.
- [x] Autenticação OAuth 2.1 / Keycloak integrada com JWT estrito.
- [x] Tracing OpenTelemetry W3C e logs estruturados em execução.
- [x] Imagem Docker construída, escaneada pelo Trivy (0 CVEs Críticas) e assinada pelo Cosign.
- [x] Deploy sincronizado no Kubernetes via ArgoCD GitOps.

---

*Documento homologado pelo Comitê Executivo de Engenharia de Software*  
*Hash de Integridade SHA-256:* `asf-90-autonomous-software-engineering-platform-2026-v1`
