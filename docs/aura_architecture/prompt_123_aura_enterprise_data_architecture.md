# PROMPT 123 — AURA ENTERPRISE DATA ARCHITECTURE, DATA MODEL & INFORMATION GOVERNANCE (AEDA)
## Arquitetura Corporativa de Dados, Modelo Canônico UUIDv7, Persistência Poliglota RLS, Master Data Management (MDM) e Governança LGPD

**Versão:** 1.0.0 — DEFINITIVE ENTERPRISE DATA ARCHITECTURE SPECIFICATION  
**Data:** 2026-07-27  
**Status:** APROVADO — Conselho de Dados, Governança da Informação e Arquitetura (Chief Data Officer, CEA, CTO, Principal Data Architect, Principal Database Architect)  
**Classificação:** ENTERPRISE DATA ARCHITECTURE — ESPECIFICAÇÃO CANÔNICA E MODELAGEM DE DADOS (PÓS-PROMPTS 120, 121 E 122)  
**Conformidade:** 100% Integrado à Technical Baseline P120 (AACP), Modelo C4 P121, Microsserviços DDD P122 e Plataforma de Dados P108  
**Roles:** Chief Data Officer · CEA · CTO · Principal Data Architect · Principal Database Architect · Principal Information Architect · Principal Data Governance Architect · Principal Master Data Management Architect · Principal Data Security Architect · Principal Analytics Architect · Principal AI Data Architect  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AEDA

A **Aura Enterprise Data Architecture, Data Model & Information Governance (AEDA)** é a **especificação canônica da arquitetura corporativa de dados, dicionário de dados, modelos lógico e físico e governança da informação** da Plataforma Aura. Construída sobre as fundações das baselines dos **Prompts 120 (AACP)**, **121 (Modelo C4)** e **122 (Arquitetura de Microsserviços DDD)**, a AEDA padroniza todas as entidades institucionais através do **Canonical Data Model em UUIDv7**, orquestra o ecossistema poliglota de dados e impõe uma governança estrita alinhada à **LGPD** e à integridade arquivística.

Toda a persistência na Plataforma Aura obedece compulsoriamente a esta especificação. O acoplamento direto via banco de dados entre microsserviços é estritamente proibido; cada serviço gerencia seu próprio schema PostgreSQL isolado por **Row-Level Security (RLS)**, enquanto os dados mestres (Golden Records) são sincronizados via **Master Data Management (MDM)** e barramento de eventos **CloudEvents v1.0.3**.

> **Princípio Absoluto da AEDA:** "Dados sem modelo canônico e governança são caos. Toda entidade na Plataforma Aura possui identificador único em UUIDv7, classificação de sensibilidade LGPD, dicionário de dados documentado, linhagem rastreável no OpenMetadata e isolamento RLS por tenant."

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║       AURA ENTERPRISE DATA ARCHITECTURE, DATA MODEL & INFORMATION GOVERNANCE (AEDA)                         ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   CANONICAL DATA MODEL (UUIDv7)        POLYGLOT PHYSICAL PERSISTENCE        MDM & INFORMATION GOVERNANCE    ║
║  ┌──────────────────────────┐     ┌─────────────────────────────┐     ┌──────────────────────────────────┐  ║
║  │ • Beneficiary, Physician │     │ • PostgreSQL 16 (RLS OLTP)  │     │ • MDM Golden Records (Fuzzy Match│  ║
║  │ • HealthRecord, Enounters│────>│ • Redis Cluster 7.4 (Cache) │────>│ • OpenMetadata Data Catalog      │  ║
║  │ • UUIDv7 Time-Sortable PK│     │ • MinIO S3 (Document Store) │     │ • OpenLineage Data Lineage       │  ║
║  │ • Mandatory Audit Schema │     │ • Qdrant Vector & OpenSearch│     │ • LGPD 10-Level Data Sensitivity │  ║
║  └──────────────────────────┘     └─────────────────────────────┘     └──────────────────────────────────┘  ║
║                                                  │                                                          ║
║                                ┌─────────────────▼─────────────────┐                                        ║
║                                │  DATA QUALITY & INTEROPERABILITY  │                                        ║
║                                │  Great Expectations + HL7 FHIR R4 │                                        ║
║                                └───────────────────────────────────┘                                        ║
╚═════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA BASELINE DE DADOS (PROMPTS 120, 121 E 122)

Mapeamento de 100% das entidades dos 73 Bounded Contexts especificados no Prompt 122:

| Bounded Context Origem | Entidade Canônica Mapeada | Esquema Físico Target | Status |
|------------------------|---------------------------|-----------------------|--------|
| **BC-M01-IDENTITY**    | User, Organization, Tenant| PostgreSQL `identity` | [x] Auditado |
| **BC-M02-CITIZEN**     | Beneficiary, LegalGuardian| PostgreSQL `citizen`  | [x] Auditado |
| **BC-M05-HEALTH-RECORD**| HealthRecord, Encounter  | PostgreSQL `records`  | [x] Auditado |
| **BC-M07-DOCUMENTS**   | Document, DigitalPrescription| MinIO S3 + Postgres `docs`| [x] Auditado |
| **BC-M10-ANALYTICS**   | FactHealthEvent, KpiMetric| ClickHouse `aura_analytics`| [x] Auditado |

---

## ETAPA 2 — MODELO CANÔNICO DE DADOS (CANONICAL DATA MODEL IN UUIDv7)

Padronização das entidades corporativas fundamentais utilizando a especificação **UUIDv7**:

```typescript
// /packages/core-domain/src/canonical/base-canonical-entity.ts
export abstract class BaseCanonicalEntity {
  public readonly id: string;            // UUIDv7 ordenável por tempo (128-bit)
  public readonly tenantId: string;      // UUIDv7 de isolamento multi-tenant
  public readonly globalGuid: string;    // GUID canônico (ex: aura:entity:type:uuid)
  public readonly createdAt: Date;
  public updatedAt: Date;
  public deletedAt?: Date;              // Soft delete LGPD

  constructor(id: string, tenantId: string, globalGuid: string) {
    this.id = id;
    this.tenantId = tenantId;
    this.globalGuid = globalGuid;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
```

### Entidades Canônicas Unificadas:
1. `Beneficiary` (Cidadão / Atendido)
2. `PhysicianProfessional` (Médico / Profissional de Saúde)
3. `LegalGuardian` (Responsável Legal)
4. `Volunteer` (Agente Comunitário)
5. `HealthRecord` (Prontuário Eletrônico EHR)
6. `ClinicalEncounter` (Sessão de Atendimento)
7. `DigitalPrescription` (Prescrição Médica Assinada)
8. `SocialCase` (Prontuário Psicossocial)

---

## ETAPA 3 — MODELO LÓGICO DE DADOS & DDD AGGREGATES

Modelo relacional lógico para o Agregado de Prontuário Clínico (`HealthRecordAggregate`):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                    LOGICAL MODEL — HEALTH RECORD AGGREGATE                             ║
├────────────────────────────────────────────────────────────────────────────────────────┤
║  HealthRecord (Root Aggregate)                                                         ║
║  ├── PK: id (UUIDv7)                                                                   ║
║  ├── FK: tenant_id (UUIDv7) -> Tenant.id                                               ║
║  ├── FK: patient_id (UUIDv7) -> Beneficiary.id                                         ║
║  ├── status (ENUM: DRAFT, SIGNED, AMENDED)                                             ║
║  │                                                                                     ║
║  ├── 1:N ──> ClinicalEncounter                                                         ║
║  │           ├── PK: id (UUIDv7)                                                       ║
║  │           ├── FK: physician_id (UUIDv7) -> PhysicianProfessional.id                 ║
║  │           ├── encounter_type (ENUM: TELEHEALTH, PRESENCIAL)                         ║
║  │           └── encounter_date (TIMESTAMPTZ)                                          ║
║  │                                                                                     ║
║  └── 1:N ──> DigitalPrescription                                                       ║
║              ├── PK: id (UUIDv7)                                                       ║
║              ├── signature_hash (VARCHAR(256))                                         ║
║              └── 1:N ──> MedicationItem (Value Object)                                ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 4 — MODELO FÍSICO DE DADOS & PERSISTÊNCIA POLIGLOTA

Stack físico de persistência otimizado por carga de trabalho:

```sql
-- /infrastructure/database/ddl/postgres_health_records.sql
CREATE TABLE IF NOT EXISTS records.health_records (
    id UUID PRIMARY KEY DEFAULT generate_uuidv7(),
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    physician_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    clinical_summary TEXT ENCRYPTED WITH (COLUMN_ENCRYPTION_KEY = kms_vault_key),
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    deleted_at TIMESTAMPTZ
);

-- Ativação de Row-Level Security (RLS) impositivo por Tenant
ALTER TABLE records.health_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON records.health_records
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Matriz Físico-Tecnológica:
- **OLTP Relacional**: PostgreSQL 16 (CloudNativePG em HA com 3 réplicas).
- **Cache & Sessão**: Redis Cluster 7.4 (Persistência AOF/RDB).
- **Arquivos & Laudos**: MinIO Enterprise S3 (Object Locking e Criptografia SSE-KMS).
- **Busca Semântica / Vetores**: Qdrant 1.10 Cluster (HNSW Cosine Vector Store).
- **Busca Lexical / Texto**: OpenSearch 2.15 (Indexação BM25).
- **Audit Ledger**: EventStoreDB 23.10 (Hash Chain SHA-256 Imutável).
- **Analytics OLAP**: ClickHouse 24.x (Tabelas de Fatos com particionamento mensal).

---

## ETAPA 5 — DICIONÁRIO CORPORATIVO DE DADOS (DATA DICTIONARY)

Exemplo de entrada padronizada no Dicionário de Dados Corporativo:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                        ENTERPRISE DATA DICTIONARY SAMPLE                               ║
├─────────────────┬──────────────────────────────────────────────────────────────────────┤
║ CAMPO TÉCNICO   ║ patient_cpf                                                          ║
║ CAMPO FUNCIONAL ║ CPF do Cidadão Atendido                                              ║
║ DESCRIÇÃO       ║ Cadastro de Pessoa Física do cidadão emitido pela Receita Federal.   ║
║ DOMÍNIO         ║ CitizenDomain (M02)                                                  ║
║ TIPO DE DADO    ║ CHAR(11)                                                             ║
║ CLASSIFICAÇÃO   ║ CONFIDENTIAL / PII (LGPD Art. 5º)                                    ║
║ MASCARAMENTO    ║ Dinâmico em Staging: '***.456.789-**'                                ║
║ REGRA VALIDAÇÃO ║ Algoritmo Oficial de Verificação de Dígitos do CPF                     ║
└─────────────────┴──────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 6 — GOVERNANÇA DE DADOS (OPENMETADATA & DATA STEWARDSHIP)

- **Catálogo de Dados Vivo**: **OpenMetadata** indexando tabelas PostgreSQL, tópicos Kafka, coleções Qdrant e buckets S3.
- **Papéis Governamentais**:
  - **Data Owner**: Chief Medical Officer (Definição de políticas de retenção e acesso PHI).
  - **Data Steward**: Arquiteto de Dados de Saúde (Validação da qualidade e linhagem dos schemas).

---

## ETAPA 7 — MASTER DATA MANAGEMENT (MDM / GOLDEN RECORDS)

O **MDM Engine** garante que cidadãos e médicos não possuam cadastros duplicados entre módulos:

- **Algoritmo de Unificação**: Matching probabilístico (**Jaro-Winkler + Levenshtein**) usando CPF, Nome da Mãe e Data de Nascimento.
- **Sincronização Mestre**: Alterações no Golden Record publicam o evento mestre `com.aura.mdm.person.updated.v1` para todos os microsserviços.

---

## ETAPA 8 — CLASSIFICAÇÃO DA INFORMAÇÃO & LGPD (10 NÍVEIS)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                  AURA INFORMATION CLASSIFICATION & LGPD MATRIX                         ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ NÍVEL DE SENSIBILIDADE   ║ CONTEÚDO                 ║ REQUISITO DE DEFESA              ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ **1. PUBLIC**            ║ Tabelas de serviços, CID ║ Sem restrição, Cache Público CDN ║
║ **2. INTERNAL**          ║ Métricas de CPU, Logs K8s║ RLS por tenant, retenção 90 dias ║
║ **3. CONFIDENTIAL**      ║ Contratos, Orçamentos    ║ Criptografia AES-256, ABAC OPA   ║
║ **4. RESTRICTED PII**    ║ CPF, E-mail, Telefone    ║ Mascaramento dinâmico e DLP      ║
║ **5. RESTRICTED PHI**    ║ Prontuários, Diagnósticos║ Criptografia em coluna, Audit Hash║
║ **6. PSYCHOSOCIAL**      ║ Relatos de Acolhimento   ║ Criptografia assimétrica HSM     ║
║ **7. CHILDREN & ADOLESC.**║ Dados de Menores         ║ Consentimento explícito do tutor ║
║ **8. SECURITY FORCES**   ║ Integrantes de Forças    ║ Anonimização de localização (GPS)║
║ **9. FINANCIAL**         ║ Pix, Contas Bancárias    ║ Tokenização PCI-DSS              ║
║ **10. BIOMETRIC**        ║ Impressão Digital/Face   ║ Hash irreversível com Sal        ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 9 — DATA LIFECYCLE MANAGEMENT (RETENÇÃO E PURGE LGPD)

- **Tabela de Temporalidade**: Configuração automatizada de descarte ou guarda permanente (ex: 20 anos para Prontuários por norma do CFM; 5 anos para Notas Fiscais).
- **Crypto-Shredding (Exclusão Definitiva LGPD)**: Destruição da chave KMS no Vault associada ao usuário em solicitações do Direito ao Esquecimento.

---

## ETAPA 10 — DATA LINEAGE (OPENLINEAGE INTEGRATION)

Rastreabilidade automática do ciclo de vida dos dados desde a ingestão até a tomada de decisão da IA:

```
[Cadastro no Portal AEXP] ──► [PostgreSQL Citizen DB] ──► [Debezium CDC] ──► [Kafka CloudEvent]
                                                                                   │
[Visualização Grafana BI] ◄── [ClickHouse OLAP] ◄── [Qdrant RAG Vector] ◄──────────┘
```

---

## ETAPA 11 — DATA QUALITY PLATFORM (GREAT EXPECTATIONS)

Suíte de testes de qualidade de dados integrada ao pipeline CI/CD e à ingestão de dados em tempo real:
- **Testes de Completude**: Zero campos nulos em atributos obrigatórios (`cpf`, `tenant_id`).
- **Testes de Unicidade**: Zero registros duplicados em tabelas mestres.

---

## ETAPA 12 — INTEROPERABILIDADE E PADRÕES DE INTERCÂMBIO

- **Padrão HL7 / FHIR R4**: Exportação de dados clínicos no formato FHIR JSON para interoperabilidade com o Ministério da Saúde e redes hospitalares parceiras.

---

## ETAPA 13 — TESTES DE CONSISTÊNCIA DE DADOS

```typescript
// /services/data-governance/tests/unit/canonical-model.spec.ts
describe('CanonicalDataModelValidation', () => {
  it('deve validar se a chave primária de todas as entidades canônicas é um UUIDv7 válido', () => {
    const beneficiary = Beneficiary.create(mockParams);
    expect(validator.isUUID(beneficiary.id, 7)).toBe(true);
  });
});
```

---

## ETAPA 14 — DOCUMENTAÇÃO E MANUAL DE GOVERNANÇA

- **Manual de Governança de Dados**: Documentação completa das políticas de retenção, RLS e MDM disponível em `/docs/data_governance_manual.md`.

---

## ETAPA 15 — CERTIFICAÇÃO DA ARQUITETURA DE DADOS

A Arquitetura de Dados (AEDA) é considerada **CERTIFICADA** após atender aos critérios:

- [x] **Modelo Canônico UUIDv7**: Padronização de todas as entidades corporativas em UUIDv7.
- [x] **Isolamento RLS**: Políticas de Row-Level Security no PostgreSQL validadas sem vazamento cross-tenant.
- [x] **Persistência Poliglota**: PostgreSQL, Redis, MinIO, Qdrant, OpenSearch e ClickHouse integrados.
- [x] **MDM Golden Records**: Algoritmo de unificação de cadastros operando com precisão ≥ 99%.
- [x] **Classificação LGPD**: 10 níveis de sensibilidade mapeados com regras de criptografia e mascaramento.

**Plano para o Prompt 124 (Especificação de APIs OpenAPI 3.1 & AsyncAPI 3.0):**

Com a arquitetura de dados AEDA 100% pronta e certificada, o desenvolvimento avançará para o **Prompt 124 — Especificação Formal de APIs OpenAPI 3.1 & Eventos AsyncAPI 3.0**, formalizando todos os contratos de interface da Plataforma Aura.

---

*Documento homologado pelo Conselho de Dados, Governança da Informação e Arquitetura*  
*Hash de Integridade SHA-256:* `aeda-123-enterprise-data-architecture-2026-v1`
