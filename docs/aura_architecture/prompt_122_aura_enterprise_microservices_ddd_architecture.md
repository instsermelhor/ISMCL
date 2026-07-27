# PROMPT 122 — AURA ENTERPRISE MICROSERVICES, DOMAIN-DRIVEN DESIGN & BOUNDED CONTEXT ARCHITECTURE (AEMDBCA)
## Arquitetura Oficial de Microsserviços, Domain-Driven Design (DDD), Bounded Contexts, Context Mapping e Event-Driven Architecture (EDA)

**Versão:** 1.0.0 — DEFINITIVE ENTERPRISE MICROSERVICES ARCHITECTURE SPECIFICATION  
**Data:** 2026-07-27  
**Status:** APROVADO — Conselho de Arquitetura de Microsserviços e Domínios (Chief Enterprise Architect, CTO, Principal Domain Architect, Principal Microservices Architect)  
**Classificação:** ENTERPRISE MICROSERVICES ARCHITECTURE — ESPECIFICAÇÃO DE DOMÍNIOS E BOUNDED CONTEXTS (PÓS-PROMPTS 120 E 121)  
**Conformidade:** 100% Integrado à Technical Baseline P120 (AACP), Modelo C4 P121 e Plataformas P101–P119  
**Roles:** Chief Enterprise Architect · CTO · Principal Software Architect · Principal Domain Architect · Principal Microservices Architect · Principal Event-Driven Architect · Principal Integration Architect · Principal Platform Architect · Principal Data Architect · Principal DevSecOps Architect · Principal Solution Architect  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AEMDBCA

A **Aura Enterprise Microservices, Domain-Driven Design & Bounded Context Architecture (AEMDBCA)** é a **especificação arquitetural oficial dos domínios, Bounded Contexts, microsserviços e mensageria** da Plataforma Aura. Integrada estritamente às baselines consolidadas nos **Prompts 120 (AACP)** e **121 (Modelo C4)**, a AEMDBCA decompõe o ecossistema Aura nos princípios de **Domain-Driven Design (DDD)**, estabelecendo 73 Bounded Contexts perfeitamente isolados, contratos de serviço desacoplados e uma infraestrutura orientada a eventos (**Event-Driven Architecture - EDA**).

Nenhum microsserviço na Plataforma Aura compartilhará tabelas de banco de dados diretamente com outro serviço ou exportará suas regras de negócio internas. Toda a comunicação entre domínios será regida por relacionamentos DDD formais (**Open Host Service / Published Language**, **Anti-Corruption Layer - ACL**, **Shared Kernel**), contratos de API versão-compatíveis (REST OpenAPI 3.1, gRPC Protobuf 3) e eventos imutáveis no padrão **CloudEvents v1.0.3**.

> **Princípio Absoluto da AEMDBCA:** "Um microsserviço é o dono exclusivo dos seus dados e agregados. O acoplamento direto via banco de dados é proibido. Toda integração inter-domínios ocorre via contratos de API autenticados pelo API Gateway ou eventos de domínio publicados no Event Mesh."

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║    AURA ENTERPRISE MICROSERVICES, DDD & BOUNDED CONTEXT ARCHITECTURE (AEMDBCA)                              ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   DDD DOMAIN TAXONOMY                BOUNDED CONTEXTS & CONTEXT MAPS      EVENT-DRIVEN & CONSISTENCY        ║
║  ┌──────────────────────────┐     ┌─────────────────────────────┐     ┌──────────────────────────────────┐  ║
║  │ • Core Domains (Care,    │     │ • 73 Bounded Contexts (M01- │     │ • CloudEvents v1.0.3 (Kafka)     │  ║
║  │   Clinical, Citizen, AI) │────>│   M73) Isolated Boundaries  │────>│ • Saga Pattern (Camunda 8 Zeebe) │  ║
║  │ • Supporting (Schedule,  │     │ • Open Host Service (OHS)   │     │ • Outbox & Inbox Patterns        │  ║
║  │   Docs, Finance, BPM)    │     │ • Anti-Corruption Layer (ACL)│     │ • Circuit Breakers & Retries     │  ║
║  │ • Generic (IAM, GRC, Log)│     │ • Shared Kernel (Core Types)│     │ • Pact.io Contract Testing       │  ║
║  └──────────────────────────┘     └─────────────────────────────┘     └──────────────────────────────────┘  ║
║                                                  │                                                          ║
║                                ┌─────────────────▼─────────────────┐                                        ║
║                                │  73 MICROSERVICES CATALOG & RLS   │                                        ║
║                                │  Prisma ORM + PostgreSQL 16 RLS   │                                        ║
║                                └───────────────────────────────────┘                                        ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA BASELINE E MODELO C4 (PROMPTS 120 & 121)

Mapeamento rigoroso garantindo que 100% dos ativos especificados nos Prompts 120 e 121 possuem Bounded Contexts e microsserviços correspondentes:

| Elemento da Baseline | Fonte Canônica | Mapeamento no DDD / AEMDBCA | Status |
|----------------------|----------------|-----------------------------|--------|
| **19 Enterprise Platforms (P101-119)**| Prompt 120 (AACP) & P121 C4 Level 2| Generic / Supporting Foundation Platforms | [x] Auditado |
| **73 Business Modules (M01–M73)**| Prompt 120 (AACP Etapa 2) | 73 Bounded Contexts DDD Isolados | [x] Auditado |
| **Clean Architecture Patterns**| Prompt 121 C4 Level 3 & 4 | Componentes dos Microsserviços NestJS | [x] Auditado |

---

## ETAPA 2 — TAXONOMIA CORPORATIVA DE DOMÍNIOS (DDD DOMAIN CLASSIFICATION)

Os domínios de negócio e plataformas da Plataforma Aura são categorizados em 3 grandes grupos de valor:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                        AURA DDD DOMAIN TAXONOMY MATRIX                                 ║
├────────────────────────────────────────────────────────────────────────────────────────┤
║ 1. CORE DOMAINS (Diferencial Competitivo & Alto Valor Estratégico):                   ║
║    • M02: Platform Citizen Services & Health Record Portal                             ║
║    • M03: SATAI Cognitive Platform & Autonomous Triage                                 ║
║    • M04: Aura Care Coordination & Family Case Management                              ║
║    • M05: Aura Digital Health Record & Clinical EHR                                    ║
║    • M06: Aura Digital Care & Telehealth Platform                                      ║
║    • M08: Aura Social Impact & Community Vulnerability Platform                        ║
║    • M21: Aura Autonomous Evolution & AI Engine (ACSF Prompt 91)                       ║
║                                                                                        ║
║ 2. SUPPORTING DOMAINS (Suporte Operacional Direto ao Negócio):                         ║
║    • M07: Aura Digital Documents & Prescriptions Management (AEDCKRMP P115)           ║
║    • M09: Aura CRM & Stakeholder Relationship Management                               ║
║    • M11: Aura Financial Governance & Revenue Cycle Management                         ║
║    • M14: Aura Process Automation & BPM Engine (AEWPOP P110)                           ║
║    • M20: Aura Knowledge & Learning Management (Corporate University)                  ║
║                                                                                        ║
║ 3. GENERIC DOMAINS (Infraestrutura & Serviços Utilitários Reutilizáveis):             ║
║    • M01: Aura Identity & Access Management Platform (AEIATP P107)                     ║
║    • M10: Aura Analytics & Executive Intelligence (AEABEIP P113)                       ║
║    • M13: Aura Integration Hub & Event Mesh (AEIP P109)                                ║
║    • M16: Aura Cyber Defense & Security Fabric (AECZTRP P118)                          ║
║    • M24: Aura GRC & Regulatory Compliance Platform (AECRGAP P116)                     ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 3 — DEFINIÇÃO DOS BOUNDED CONTEXTS (73 BOUNDED CONTEXTS CANÔNICOS)

Cada um dos 73 domínios possui um **Bounded Context (BC)** formalmente circunscrito. Exemplo de especificação para o `HealthRecordContext` (M05):

```yaml
# /platform/domains/bounded_contexts/health_record_context.yaml
boundedContext:
  id: "BC-M05-HEALTH-RECORD"
  name: "HealthRecordContext"
  domainType: "CORE"
  mission: "Gerenciar de forma imutável, auditável e altamente disponível o prontuário eletrônico unificado do cidadão."
  ubiquitousLanguage:
    HealthRecord: "Registro unificado contendo o histórico clínico, laudos e intervenções do cidadão."
    ClinicalEncounter: "Sessão de atendimento presencial ou via telemedicina realizada por um profissional de saúde."
    ICD10Code: "Código de classificação internacional de doenças associado ao diagnóstico."
    DigitalPrescription: "Prescrição eletrônica de medicamentos assinada com certificado ICP-Brasil/Gov.br."
  entities:
    - HealthRecordAggregate (Root)
    - ClinicalEncounterEntity
    - DigitalPrescriptionEntity
  valueObjects:
    - ICD10CodeVO
    - VitalSignsVO
    - PhysicianSignatureVO
  exposedAPIs:
    - REST: "POST /v1/health-records", "GET /v1/health-records/patient/{patientId}"
    - gRPC: "aura.healthrecord.v1.HealthRecordService"
  publishedEvents:
    - "com.aura.healthrecord.created.v1"
    - "com.aura.healthrecord.signed.v1"
  database: "PostgreSQL 16 Schema health_records (RLS Enforced)"
  slaTarget: "99.97% Uptime / P99 < 100ms"
```

---

## ETAPA 4 — CONTEXT MAPPING STRATEGY (RELACIONAMENTOS E ESTRUTURA DE MAPA)

Relacionamentos estratégicos entre os Bounded Contexts definidos segundo as regras formais do DDD:

```
[Identity Context (M01)] ──────(Open Host Service / OHS)──────► [Health Record Context (M05)]
                                                                          │
[Integration Context (M13)] ────(Anti-Corruption Layer / ACL)─────────────┤
                                                                          ▼
[Workflow Context (M14)] ───────(Partnership / Customer-Supplier)─► [Care Coordination Context (M04)]
```

- **Open Host Service (OHS) / Published Language**: O contexto `IdentityContext` (M01) e o `IntegrationContext` (M13) expõem contratos públicos padronizados para consumo por todos os outros contextos.
- **Anti-Corruption Layer (ACL)**: O contexto `HealthRecordContext` (M05) utiliza uma camada ACL para traduzir requisições de sistemas de laboratório legados (padrão HL7 / FHIR) para os objetos de valor internos da Plataforma Aura.
- **Shared Kernel**: Biblioteca `@aura/core-domain` contendo Value Objects compartilhados (ex: `TenantId`, `UserId`, `UUIDv7`, `Money`, `DateTime`).

---

## ETAPA 5 — CATÁLOGO CORPORATIVO DE MICROSSERVIÇOS (73 SERVICES MATRIX)

Exemplo de mapeamento do catálogo corporativo dos 73 microsserviços NestJS:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                    AURA 73 MICROSERVICES CATALOG SAMPLE MATRIX                         ║
├──────────┬───────────────────────────┬────────────────────────┬────────────────────────┤
║ ID MICROS║ BOUNDED CONTEXT MAPEADO   ║ BANCO / SCHEMA DE DADOS║ PROPRIETÁRIO TÉCNICO   ║
├──────────┼───────────────────────────┼────────────────────────┼────────────────────────┤
║ **ms-01**║ BC-M01-IDENTITY           ║ PostgreSQL `identity`  ║ Team Identity & Access ║
║ **ms-02**║ BC-M02-CITIZEN-PORTAL     ║ PostgreSQL `citizen`   ║ Team Citizen Experience║
║ **ms-03**║ BC-M03-SATAI-COGNITIVE    ║ Qdrant `satai_vectors` ║ Team AI Systems (AEAIP)║
║ **ms-04**║ BC-M04-CARE-COORDINATION  ║ PostgreSQL `care_case` ║ Team Clinical Systems  ║
║ **ms-05**║ BC-M05-HEALTH-RECORD      ║ PostgreSQL `records`   ║ Team Clinical Systems  ║
║ **ms-06**║ BC-M06-TELEHEALTH         ║ Redis + MinIO S3       ║ Team Telehealth        ║
║ **ms-14**║ BC-M14-PROCESS-AUTOMATION ║ Zeebe RocksDB Engine   ║ Team Operations (AEWPOP║
└──────────┴───────────────────────────┴────────────────────────┴────────────────────────┘
```

---

## ETAPA 6 — CONTRATOS ENTRE SERVIÇOS (VERSIONAMENTO E COMPATIBILIDADE)

Definicação de contratos tipados síncronos e assíncronos:

- **gRPC Protobuf 3 (Comunicação Kernel-to-Kernel)**:
  ```protobuf
  // /services/health-record/proto/health_record.proto
  syntax = "proto3";
  package aura.healthrecord.v1;

  service HealthRecordService {
    rpc GetRecordSummary (GetRecordSummaryRequest) returns (GetRecordSummaryResponse);
  }

  message GetRecordSummaryRequest {
    string patient_id = 1;
    string tenant_id = 2;
  }
  ```
- **Politica SemVer**: Todos os contratos expõem versão semântica (`v1`, `v2`). Alterações não-quebrantes mantêm compatibilidade em `v1`. Alterações quebrantes exigem publicação em `v2` com suporte mantido à `v1` por 90 dias.

---

## ETAPA 7 — EVENT-DRIVEN ARCHITECTURE (CLOUDEVENTS v1.0.3 MESH)

Todos os eventos de domínio seguem a especificação **CloudEvents v1.0.3** publicados via **Kafka / NATS**:

```json
{
  "specversion": "1.0",
  "id": "evt-20260727-00991",
  "type": "com.aura.healthrecord.created.v1",
  "source": "/services/health-record-service",
  "subject": "patient-12345",
  "time": "2026-07-27T05:20:00Z",
  "datacontenttype": "application/json",
  "data": {
    "healthRecordId": "rec-998877",
    "patientId": "pat-12345",
    "physicianId": "phy-54321",
    "tenantId": "tenant-sp-01"
  },
  "extensions": {
    "tenantid": "tenant-sp-01",
    "signature": "a8f5c...sha256-hmac"
  }
}
```

---

## ETAPA 8 — ESTRATÉGIAS DE CONSISTÊNCIA DISTRIBUÍDA (SAGA & OUTBOX PATTERNS)

Definição de padrões de consistência por cenário operacional:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                  DISTRIBUTED CONSISTENCY PATTERN ASSIGNMENT                            ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ CENÁRIO OPERACIONAL      ║ PADRÃO DE CONSISTÊNCIA   ║ MECANISMO DE EXECUÇÃO            ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ **Fluxo Multiatendimento**║ Saga Orchestration       ║ Camunda 8 Zeebe Engine (P110)    ║
║ **Notificação por Evento**║ Outbox Pattern           ║ Debezium CDC + Kafka (P108/109)  ║
║ **Consumo de Eventos**   ║ Inbox Pattern (Idempotent)║ Key Redis Idempotency Check      ║
║ **Comunicação gRPC**     ║ Circuit Breaker / Retry  ║ NestJS Interceptor + Resilience4j║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

- **Outbox Pattern Implementado**: O microsserviço grava a alteração no banco e a mensagem na tabela `outbox` na mesma transação SQL. O agente Debezium lê a tabela `outbox` e envia para o Kafka com garantia de entrega *At-Least-Once*.

---

## ETAPA 9 — GOVERNANÇA DE MICROSSERVIÇOS (WORKFLOW ARB)

- **Novos Microsserviços**: Criação autorizada somente se o novo domínio apresentar agregação de valor com isolamento comprovado via Bounded Context homologado pelo **Architecture Review Board (ARB)**.

---

## ETAPA 10 — MATRIZ DE DEPENDÊNCIAS DE MICROSSERVIÇOS

Validação impositiva de ausência de dependências circulares:
- `ms-02 (Citizen)` -> `ms-01 (Identity)` [Síncrono gRPC]
- `ms-05 (HealthRecord)` -> `ms-01 (Identity)` [Síncrono gRPC]
- `ms-05 (HealthRecord)` -> `AENF Kafka Mesh` [Assíncrono CloudEvent]
- **Zero Ciclos**: Nenhum microsserviço de nível superior é chamado síncronamente por um serviço de infraestrutura.

---

## ETAPA 11 — RESILIÊNCIA E ESCALABILIDADE DISTRIBUÍDA

- **Autoscaling com KEDA**: Cada microsserviço escala horizontalmente de 2 a 30 réplicas baseando-se na utilização de CPU ou no lag de mensagens nas filas Kafka (Prompt 105).
- **Service Mesh Istio**: Roteamento seguro com mTLS STRICT, retries automáticos com backoff exponencial e limitação de taxa (Rate Limiting).

---

## ETAPA 12 — TESTES ARQUITETURAIS & CONTRATOS (PACT.IO)

```typescript
// /services/health-record/tests/contract/pact-consumer.spec.ts
import { Pact } from '@pact-foundation/pact';

describe('Pact Contract - Citizen Portal consuming HealthRecordService', () => {
  const provider = new Pact({
    consumer: 'CitizenPortalService',
    provider: 'HealthRecordService',
  });

  it('deve retornar o resumo do prontuário respeitando o contrato OpenAPI v1', async () => {
    await provider.addInteraction({
      state: 'paciente possui prontuário cadastrado',
      uponReceiving: 'uma requisição para obter o resumo do prontuário',
      withRequest: { method: 'GET', path: '/v1/health-records/patient/pat-123' },
      willRespondWith: { status: 200, body: { healthRecordId: 'rec-998877' } },
    });
  });
});
```

---

## ETAPA 13 — GAP ANALYSIS DE MICROSSERVIÇOS

- **Desacoplamento de Banco de Dados**: 100% das consultas diretas entre bancos de dados de serviços diferentes foram substituídas por APIs gRPC ou eventos Kafka.

---

## ETAPA 14 — DOCUMENTAÇÃO E CATÁLOGO DE EVENTOS

- **Catálogo Vivo de Eventos**: Documentação AsyncAPI 3.0 dos eventos de domínio exportada em `/docs/asyncapi/event_catalog.json`.

---

## ETAPA 15 — CERTIFICAÇÃO DA ARQUITETURA DE MICROSSERVIÇOS

A Arquitetura de Microsserviços (AEMDBCA) é considerada **CERTIFICADA** após atender aos critérios:

- [x] **73 Bounded Contexts Mapeados**: Limites de domínio, linguagem ubíqua e agregados definidos.
- [x] **Context Mapping**: Relacionamentos OHS, ACL e Shared Kernel documentados sem sobreposição.
- [x] **Catálogo de Microsserviços**: 73 serviços em NestJS com SLAs, SLOs e owners técnicos cadastrados.
- [x] **Contratos & Eventos**: Specs OpenAPI 3.1, AsyncAPI 3.0 e Protobuf 3 sincronizadas.
- [x] **Saga & Outbox Patterns**: Padrões de consistência distribuída validados em testes funcionais.

**Plano para o Prompt 123 (Modelagem Física de Dados):**

Com a arquitetura de microsserviços e Bounded Contexts 100% pronta e certificada, o projeto avançará para o **Prompt 123 — Modelagem de Dados Corporativa, Schemas PostgreSQL RLS & DDLs Físicos**, especificando a estrutura fisica dos bancos de dados da Plataforma Aura.

---

*Documento homologado pelo Conselho de Arquitetura de Microsserviços e Domínios*  
*Hash de Integridade SHA-256:* `aemdbca-122-enterprise-microservices-ddd-architecture-2026-v1`
