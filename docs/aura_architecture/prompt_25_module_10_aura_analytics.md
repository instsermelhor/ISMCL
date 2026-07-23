# MÓDULO 10 — BUSINESS INTELLIGENCE (BI), ANALYTICS, DATA WAREHOUSE, DASHBOARDS EXECUTIVOS, IA ANALÍTICA E GOVERNANÇA DE DADOS
## AURA INTELLIGENCE PLATFORM — PROMPT 25
### Plataforma Integrada Aura · Instituto Ser Melhor (ISMCL)
**Papel Assumido**: Chief Data Officer (CDO) · Chief Analytics Officer (CAO) · Enterprise Data Architect · Principal Data Engineer · Principal Backend & Frontend Engineer · Business Intelligence Architect · Machine Learning Architect · Especialista em Data Lakehouse, Data Governance, LGPD, DDD, Clean Architecture, CQRS e Enterprise Decision Intelligence

---

## SUMÁRIO EXECUTIVO

O **Módulo 10 — Aura Intelligence Platform (BI & Analytics)** é a **Central Corporativa de Inteligência Analítica e Governança de Dados** do Instituto Ser Melhor. Ele consolida os dados transacionais de todos os microserviços previamente projetados (Módulos 01 a 09) em uma infraestrutura analítica de alta performance baseada em **Data Lakehouse**, **Data Warehouse Dimensional (Kimball)** e **Data Marts Especializados**.

Fornece em tempo real (via Change Data Capture - CDC e Event Streaming) a **Única Fonte da Verdade (Single Source of Truth - SSOT)** para todos os indicadores estratégicos, operacionais, clínicos, sociais, financeiros e institucionais. Não altera dados dos bancos OLTP transacionais, servindo como motor de decisão executiva, auditoria e inteligência preditiva com IA.

---

## ETAPA 1 — AUDITORIA ARQUITETURAL COMPLETA (PROMPTS 00 A 24)

### 1.1 Inventário de Origens Transacionais (OLTP) Auditadas

| Módulo Transacional | Banco / Schema | Eventos de Ingestão CDC / RabbitMQ |
|---|---|---|
| **Módulo 01 — IAM** | `auth` | `user.created`, `login.failed`, `mfa.activated` |
| **Módulo 02 — CadÚnico** | `citizen` | `person.created`, `person.updated`, `consent.granted` |
| **Módulo 03 — SATAI** | `triage` | `triage.completed`, `risk.elevated`, `iipscore.calculated` |
| **Módulo 04 — Care Coordination** | `care` | `case.opened`, `appointment.scheduled`, `case.discharged` |
| **Módulo 05 — PEU** | `health_record` | `record.opened`, `note.signed`, `risk.activated` |
| **Módulo 06 — Telecare** | `telecare` | `session.started`, `session.completed`, `quality.degraded` |
| **Módulo 07 — Clinical Docs** | `clinical_docs` | `document.signed`, `document.revoked`, `delivery.sent` |
| **Módulo 08 — Social Impact** | `social_impact` | `enrollment.created`, `pid.updated`, `benefit.granted` |
| **Módulo 09 — CRM Social** | `aura_crm` | `profile.created`, `interaction.created`, `nps.submitted` |

### 1.2 Vulnerabilidades Críticas e Correções Mandatórias

> [!CAUTION]
> **VULN-ANA-001 — VIOLAÇÃO P07 (PERFORMANCE E CONTENÇÃO OLTP)**: Consultas analíticas pesadas (ex: cálculo de SROI, médias de atendimento, agregadores de receita e relatórios anuais) sendo executadas diretamente nos bancos OLTP transacionais.
> **Correção**: Proibir consultas OLAP nos bancos operacionais. Toda análise e dashboard DEVE consultar exclusivamente o Data Warehouse no schema `aura_dw` alimentado por CDC assíncrono.

> [!CAUTION]
> **VULN-ANA-002 — VIOLAÇÃO P06 (SEGURANÇA / LGPD NA ANALÍTICA)**: Exposição de nomes, CPFs e prontuários em relatórios estatísticos ou dashboards executivos compartilhados com conselhos ou doadores.
> **Correção**: Implementação da camada **AnonymizationEngine** que aplica pseudonimização irreversible e k-anonimato ($k \ge 5$) em todos os Data Marts analíticos consumidos por dashboards estratégicos.

> [!WARNING]
> **VULN-ANA-003 — DIVERGÊNCIA DE REGRAS DE KPI (FALTA DE SSOT)**: Métricas calculadas de formas diferentes por equipes distintas (ex: "Taxa de Evasão" calculada no CRM de forma divergente dos Programas Sociais).
> **Correção**: Criação do **Catálogo Corporativo de Métricas (Metric Catalog)** onde cada KPI possui uma definição matemática e computacional única e versionada.

> [!WARNING]
> **VULN-ANA-004 — LATÊNCIA EM DECISÕES OPERACIONAIS**: Carga de BI realizada por batch único noturno (ETL 24h), gerando atrasos em alertas de filas de triagem e risco de suicídio.
> **Correção**: Arquitetura híbrida **Lambda/Kappa** com CDC streaming (Debezium + RabbitMQ) atualizando tabelas fato operacionais em tempo quase real (< 5 segundos).

---

## ETAPA 2 — ARQUITETURA ANALÍTICA CORPORATIVA

### 2.1 Visão Geral do Data Lakehouse & Data Warehouse

```
┌─────────────────────────────────────────────────────────────────────────┐
│  FONTES OLTP (Módulos 01 a 09 — PostgreSQL Schemas Transacionais)       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Debezium CDC + RabbitMQ Events
┌────────────────────────────────────▼────────────────────────────────────┐
│  CAMADA BRONZE (Data Lake S3 / Parquet)                                  │
│  - Eventos brutos append-only em formato JSON/Parquet                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Apache Spark / DuckDB Transformation
┌────────────────────────────────────▼────────────────────────────────────┐
│  CAMADA SILVER (Data Warehouse OBT — One Big Table / Staging Clean)     │
│  - Limpeza, deduplicação, validação de schemas, mascaramento LGPD       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Modelagem Dimensional Kimball
┌────────────────────────────────────▼────────────────────────────────────┐
│  CAMADA GOLD (Data Warehouse Dimensional — Schema `aura_dw`)            │
│  - 12 Tabelas Fato (Star / Snowflake) + 14 Tabelas Dimensão              │
│  - Data Marts: Clínico, Social, CRM, Financeiro, Operacional            │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Cache Redis + Materialized Views
┌────────────────────────────────────▼────────────────────────────────────┐
│  CONSUMO ANALÍTICO (NestJS `ms-analytics` → Frontend Dashboard React)    │
│  - Dashboards Executivos, Rest APIs, Exportações PDF/Excel, IA Preditiva│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 3 — MODELAGEM DIMENSIONAL COMPLETA (KIMBALL STAR SCHEMA)

### 3.1 Tabelas Fato (12 Fact Tables)

| Tabela Fato | Grão | Medidas Principais |
|---|---|---|
| `FactAttendance` | 1 atendimento concluído | Duração (min), tempo espera (min), pontuação de risco, custo |
| `FactAppointment` | 1 agendamento realizado | Taxa absenteísmo, antecedência agendamento, reagendamentos |
| `FactTelemedicine` | 1 teleconsulta | Duração chamada, latência média (ms), perda pacotes (%), consentimento gravação |
| `FactProgram` | 1 matrícula em ciclo | % evolução no PID, presenças, taxa conclusão, motivo desligamento |
| `FactBeneficiary` | 1 snapshot mensal por pessoa | Delta IIPScore, número atendimentos, total benefícios recebidos |
| `FactVolunteer` | 1 registro de trabalho voluntário | Horas doadas, atendimentos realizados, taxa assiduidade |
| `FactDonation` | 1 transação de doação | Valor bruto (R$), canal pagamento, custo captação, LTV |
| `FactCRM` | 1 interação registrada | Tempo de resposta (min), pontuação CSAT/NPS, sentimento |
| `FactDocument` | 1 documento oficial emitido | Tempo emissão (s), tipo documento, tipo assinatura (ICP) |
| `FactPrescription` | 1 item prescrevido | Quantidade, classe terapêutica, alertas de interação disparados |
| `FactClinicalRecord` | 1 evolução assinada | Contagem CID-11, tamanho narrativa, tempo até assinatura |
| `FactSocialImpact` | 1 ciclo de avaliação de impacto | Valor SROI (R$), delta vulnerabilidade familiar, custo per capita |

### 3.2 Tabelas Dimensão (14 Dimension Tables)

- `DimDate` (Dia, Mês, Ano, Trimestre, DiaSemana, FeriadoOficial, Quinzena)
- `DimTime` (Hora, Minuto, Turno: Manhã/Tarde/Noite/Madrugada)
- `DimProfessional` (ID, Nome, Especialidade, Conselho, Vínculo: Voluntário/Contratado, DataAdmissão)
- `DimBeneficiary` (ID Pseudonimizado, FaixaEtária, Gênero, Bairro, RendaFamiliarCat, Escolaridade)
- `DimOrganization` (ID, Unidade, Região, CapacidadeAtendimento)
- `DimProgram` (ID, Código, NomePrograma, Categoria, TeoriaMudançaCode)
- `DimRegion` (ID, Bairro, Zona Urbana, CoordenadasGeo)
- `DimService` (ID, TipoAtendimento, Especialidade, Modalidade: Presencial/Telehealth)
- `DimRisk` (ID, NívelRisco: Baixo/Médio/Alto/Emergencial, IIPScoreRange)
- `DimDiagnosis` (ID, CodigoCID11, DescricaoCID, CategoriaDiagnostic)
- `DimGender` (ID, DescricaoIdentidadeGenero)
- `DimAgeGroup` (ID, Faixa: 0-5, 6-12, 13-17, 18-29, 30-59, 60+)
- `DimVulnerability` (ID, CategoriaVulnerabilidade: Habitacional, Fome, Violência, Desemprego)
- `DimCampaign` (ID, NomeCampanha, CanalOrigem, TipoDoacao)

---

## ETAPA 4 — PIPELINE DE DADOS (CDC & STREAMING)

- **Engine CDC**: Debezium conectando aos conectores PostgreSQL WAL (Write-Ahead Logging) dos schemas operacionais.
- **Transformação Incremental**: Ingestão via RabbitMQ no microserviço `ms-analytics` para atualização em tempo real ($< 5\text{s}$) de `Materialized Views` no schema `aura_dw`.

---

## ETAPA 5 — BANCO ANALÍTICO (POSTGRESQL 16 OLAP — SCHEMA `aura_dw`)

```sql
-- =========================================================================
-- AURA INTELLIGENCE PLATFORM — SCHEMA aura_dw (OLAP / DATA WAREHOUSE)
-- PostgreSQL 16
-- =========================================================================

CREATE SCHEMA IF NOT EXISTS aura_dw;

-- ─────────────────────────────────────────────────────────────────────────
-- DIMENSÕES PRINCIPAIS
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE aura_dw.dim_date (
  date_key           INT PRIMARY KEY,              -- AAAAMMDD (ex: 20250728)
  full_date          DATE UNIQUE NOT NULL,
  day_of_month       INT NOT NULL,
  month_number       INT NOT NULL,
  month_name         VARCHAR(20) NOT NULL,
  year_number        INT NOT NULL,
  quarter            INT NOT NULL,
  day_of_week        INT NOT NULL,
  day_name           VARCHAR(20) NOT NULL,
  is_weekend         BOOLEAN NOT NULL,
  is_official_holiday BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE aura_dw.dim_beneficiary (
  beneficiary_key    UUID PRIMARY KEY,             -- ID Pseudonimizado
  age_group          VARCHAR(50) NOT NULL,
  gender_identity    VARCHAR(50) NOT NULL,
  city_district      VARCHAR(100) NOT NULL,
  income_bracket     VARCHAR(50) NOT NULL,
  education_level    VARCHAR(100) NOT NULL,
  housing_condition  VARCHAR(100) NOT NULL,
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aura_dw.dim_professional (
  professional_key   UUID PRIMARY KEY,
  profession_role    VARCHAR(100) NOT NULL,
  specialty          VARCHAR(100) NOT NULL,
  council_type       VARCHAR(20) NOT NULL,
  bond_type          VARCHAR(50) NOT NULL,          -- VOLUNTEER, EMPLOYEE
  organization_unit  VARCHAR(100) NOT NULL
);

CREATE TABLE aura_dw.dim_program (
  program_key        UUID PRIMARY KEY,
  program_code       VARCHAR(50) NOT NULL,
  program_name       VARCHAR(255) NOT NULL,
  category           VARCHAR(100) NOT NULL,
  target_audience    TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────
-- TABELAS FATO
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE aura_dw.fact_attendance (
  attendance_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key              INT NOT NULL REFERENCES aura_dw.dim_date(date_key),
  beneficiary_key       UUID NOT NULL REFERENCES aura_dw.dim_beneficiary(beneficiary_key),
  professional_key      UUID NOT NULL REFERENCES aura_dw.dim_professional(professional_key),
  program_key           UUID REFERENCES aura_dw.dim_program(program_key),
  duration_minutes      INT NOT NULL,
  waiting_time_minutes  INT NOT NULL,
  risk_score            DECIMAL(5,2) NOT NULL,
  unit_cost_brl         DECIMAL(10,2) NOT NULL,
  is_telehealth         BOOLEAN NOT NULL DEFAULT FALSE,
  was_completed         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aura_dw.fact_social_impact (
  impact_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key              INT NOT NULL REFERENCES aura_dw.dim_date(date_key),
  beneficiary_key       UUID NOT NULL REFERENCES aura_dw.dim_beneficiary(beneficiary_key),
  program_key           UUID NOT NULL REFERENCES aura_dw.dim_program(program_key),
  vulnerability_initial DECIMAL(5,2) NOT NULL,
  vulnerability_current DECIMAL(5,2) NOT NULL,
  vulnerability_delta   DECIMAL(5,2) NOT NULL,
  sroi_value_generated_brl DECIMAL(10,2) NOT NULL,
  pid_goals_achieved    INT NOT NULL,
  pid_goals_total       INT NOT NULL,
  recorded_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE aura_dw.fact_crm_interaction (
  interaction_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key              INT NOT NULL REFERENCES aura_dw.dim_date(date_key),
  beneficiary_key       UUID NOT NULL REFERENCES aura_dw.dim_beneficiary(beneficiary_key),
  source_module         VARCHAR(50) NOT NULL,
  channel               VARCHAR(50) NOT NULL,
  sentiment             VARCHAR(50) NOT NULL,
  response_time_minutes INT,
  nps_score_given       INT
);

-- ─────────────────────────────────────────────────────────────────────────
-- MATERIALIZED VIEWS PARA DASHBOARDS EM TEMPO REAL
-- ─────────────────────────────────────────────────────────────────────────
CREATE MATERIALIZED VIEW aura_dw.mv_executive_kpi_summary AS
SELECT 
  d.year_number,
  d.month_number,
  COUNT(DISTINCT fa.beneficiary_key) AS total_active_beneficiaries,
  COUNT(fa.attendance_id) AS total_attendances,
  SUM(fa.duration_minutes) / 60.0 AS total_hours_served,
  AVG(fsi.vulnerability_delta) AS avg_vulnerability_reduction,
  SUM(fsi.sroi_value_generated_brl) AS total_social_return_brl
FROM aura_dw.fact_attendance fa
JOIN aura_dw.dim_date d ON fa.date_key = d.date_key
LEFT JOIN aura_dw.fact_social_impact fsi ON fa.beneficiary_key = fsi.beneficiary_key AND fa.date_key = fsi.date_key
GROUP BY d.year_number, d.month_number;

CREATE UNIQUE INDEX idx_mv_exec_summary ON aura_dw.mv_executive_kpi_summary (year_number, month_number);

-- PROIBIR UPDATE E DELETE NA CAMADA FATO
REVOKE UPDATE, DELETE ON aura_dw.fact_attendance FROM PUBLIC;
REVOKE UPDATE, DELETE ON aura_dw.fact_social_impact FROM PUBLIC;
```

---

## ETAPA 6 — BACKEND ARCHITECTURE (`apps/ms-analytics`)

### 6.1 Estrutura do Microserviço NestJS

```
apps/ms-analytics/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── controllers/
│   │   ├── dashboard.controller.ts        -- Endpoints de consumo dos dashboards
│   │   ├── kpi.controller.ts              -- Single Source of Truth dos KPIs
│   │   ├── ai-prediction.controller.ts    -- IA Analítica e preditiva
│   │   ├── export.controller.ts           -- Exportação PDF/Excel/CSV
│   │   └── data-catalog.controller.ts    -- Catálogo de dados e lineage
│   ├── use-cases/
│   │   ├── queries/
│   │   │   ├── get-executive-dashboard/
│   │   │   ├── get-clinical-dashboard/
│   │   │   ├── get-social-impact-dashboard/
│   │   │   ├── get-financial-dashboard/
│   │   │   ├── get-operational-dashboard/
│   │   │   └── get-ai-insights/
│   │   └── commands/
│   │       ├── refresh-materialized-views/
│   │       └── run-anomaly-detection/
│   ├── services/
│   │   ├── query-engine.service.ts         -- Motor de busca otimizado com cache Redis
│   │   ├── anonymization.service.ts        -- k-anonimato e pseudonimização LGPD
│   │   └── shap-explainer.service.ts       -- Explicabilidade dos modelos preditivos
│   └── event-consumers/                    -- Ingestão CDC streaming
│       ├── cdc-attendance.consumer.ts
│       └── cdc-social-impact.consumer.ts
```

---

## ETAPA 7 — OPENAPI 3.0 — 22 ENDPOINTS (`/api/v1/analytics`)

| Método | Endpoint | Descrição | Roles / Acesso |
|---|---|---|---|
| `GET` | `/dashboards/executive` | **Dashboard Executivo Integrado (KPIs, SROI, Atendimentos)** | executive, cdo, cso |
| `GET` | `/dashboards/clinical` | Dashboard Clínico (Atendimentos, CID-11, PEU, Telemedicina) | chio, clinical_coordinator |
| `GET` | `/dashboards/social` | Dashboard de Impacto Social (PID, Teoria da Mudança, Vulnerabilidade) | csio, social_coordinator |
| `GET` | `/dashboards/financial` | Dashboard Financeiro & Governança (Doações, Custos per capita) | cfo, auditor |
| `GET` | `/dashboards/operational` | Dashboard Operacional (Filas, SLAs, Produtividade, Absenteísmo) | coo, manager |
| `GET` | `/dashboards/ai-predictive` | Dashboard de IA (Previsão de demanda, Evasão e Anomalias) | cdo, executive |
| `GET` | `/kpis` | **Consultar Catálogo Oficial de KPIs (SSOT)** | authenticated_user |
| `GET` | `/kpis/:code/history` | Série histórica comparativa de um KPI | manager, executive |
| `POST` | `/exports/report` | Exportar relatório analítico (PDF/A, Excel, CSV) | manager, executive |
| `GET` | `/ai/predictions/demand` | Previsão de demanda de atendimentos por região/mês | manager, coordinator |
| `GET` | `/ai/predictions/dropout` | Previsão de evasão de beneficiários por programa | social_coordinator |
| `GET` | `/ai/anomalies` | Detecção automática de anomalias operacionais/financeiras | auditor, cdo |
| `GET` | `/catalog/metrics` | Catálogo Corporativo de Métricas e Proprietários | all |
| `GET` | `/catalog/lineage/:kpiCode` | Linhagem de dados (Data Lineage) de uma métrica | cdo, data_engineer |
| `POST` | `/views/refresh` | Forçar atualização de Materialized Views | data_engineer, admin |
| `GET` | `/indicators/sroi-annual` | Demonstrativo de Retorno Social sobre Investimento (SROI) | csio, cfo, executive |
| `GET` | `/indicators/telehealth-quality` | Métricas de qualidade WebRTC (latência, jitter, quedas) | cto, tech_lead |
| `GET` | `/indicators/volunteer-hours` | Total de horas de voluntariado doadas por categoria | volunteer_coord |
| `GET` | `/indicators/prescriptions-catmat` | Medicamentos mais dispensados por código CATMAT | medical_director |
| `GET` | `/indicators/nps-cross-channel` | Matriz de NPS por canal e unidade de atendimento | ccco, manager |
| `POST` | `/anonymization/verify-k` | Verificar nível de k-anonimato em dataset | dpo, cdo |
| `GET` | `/tech/pipeline-health` | Dashboard técnico de saúde dos pipelines CDC | data_engineer, admin |

---

## ETAPA 8 — FRONTEND (`src/features/analytics/`)

### 8.1 Wireframes Textuais dos Dashboards Corporativos

#### TELA 1: Dashboard Executivo Strategist (`ExecutiveDashboardPage`)

```
╔══════════════════════════════════════════════════════════════════════════╗
║  📊 PAINEL EXECUTIVO CORPORATIVO · INSTITUTO SER MELHOR                   ║
║  Período: [Ano 2025 ▼]  Unidade: [Todas as Unidades ▼]  Filtro: [LGPD ✅]  ║
╠══════════════════════════════════════════════════════════════════════════╣
║  INDICADORES CHAVE DE DESEMPENHO (KPIs SSOT)                             ║
║  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────┐ ║
║  │ ATENDIDOS ATIVOS │ │ HORAS ATENDIMENTO│ │ RETORNO SOCIAL (SROI)    │ ║
║  │ 12.450           │ │ 48.200h          │ │ R$ 4,35 por R$ 1 invest. │ ║
║  │ 🟢 +14% vs 2024  │ │ 🟢 98% da meta   │ │ 🟢 Excelente Impacto     │ ║
║  └──────────────────┘ └──────────────────┘ └──────────────────────────┘ ║
╠══════════════════════════════════════════════════════════════════════════╣
║  EVOLUÇÃO DA REDUÇÃO DA VULNERABILIDADE SOCIAL (SATAI / PID)             ║
║  Score Médio de Vulnerabilidade: 72.0 ➔ 38.5 (-46.5% de vulnerabilidade)  ║
║  [ Grafico de Linha Temporal de Redução de Risco por Trimestre ]        ║
║                                                                          ║
║  DISTRIBUIÇÃO POR ÁREA ASSISTENCIAL                                      ║
║  [ Psicológica: 45% ] [ Assistência Social: 30% ] [ Telemedicina: 25% ]   ║
╠══════════════════════════════════════════════════════════════════════════╣
║  🤖 INSIGHT IA ANALÍTICA: "Projeção de alta de 22% na demanda de         ║
║     Telepsicologia para o próximo trimestre no Bairro Centro."           ║
╠══════════════════════════════════════════════════════════════════════════╣
║  [📄 Exportar Relatório PDF]  [📊 Exportar Excel]  [🔍 Ver Linhagem Dados]║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 9 — INTELIGÊNCIA ARTIFICIAL ANALÍTICA & SHAP EXPLICABILIDADE

- **Modelos Preditivos**:
  - `DemandForecastingModel`: XGBoost treinado no histórico de atendimentos (`FactAttendance`) para previsão de carga futura por unidade/especialidade.
  - `DropoutPredictorModel`: Random Forest prevendo probabilidade de evasão de programas com base em faltas e progresso de metas do PID.
- **Explicabilidade (SHAP Values)**: Cada previsão exibe os 3 principais fatores contribuintes (ex: "Evasão prevista em 82% devido a: 3 faltas consecutivas + ausência de benefício de transporte").

---

## ETAPA 10 — GOVERNANÇA DE DADOS & CATÁLOGO CORPORATIVO (SINGLE SOURCE OF TRUTH)

### 10.1 Catálogo Corporativo de Métricas Oficiais (Exemplo)

```json
[
  {
    "kpiCode": "KPI-SOC-SROI-01",
    "name": "Retorno Social sobre o Investimento (SROI)",
    "definition": "Razão entre o valor monetário indireto gerado pelo impacto social e o custo total operacional dos programas.",
    "formula": "SUM(FactSocialImpact.sroi_value_generated_brl) / SUM(FactAttendance.unit_cost_brl)",
    "owner": "Chief Social Innovation Officer (CSIO)",
    "refreshFrequency": "QUINZENAL",
    "sourceTables": ["aura_dw.fact_social_impact", "aura_dw.fact_attendance"]
  },
  {
    "kpiCode": "KPI-CLI-ABS-02",
    "name": "Taxa de Absenteísmo em Telemedicina",
    "definition": "Percentual de teleconsultas agendadas que resultaram em não comparecimento (no-show).",
    "formula": "COUNT(FactAppointment.is_missed = true) / COUNT(FactAppointment.id) * 100",
    "owner": "Chief Digital Health Officer (CDHO)",
    "refreshFrequency": "DIÁRIO",
    "sourceTables": ["aura_dw.fact_telemedicine", "aura_dw.dim_date"]
  }
]
```

---

## ETAPA 11 — REGRAS DE NEGÓCIO COMPLETAS (32 REGRAS)

| Código | Regra | Enforcement |
|---|---|---|
| `RN-BI-001` | Toda consulta analítica deve ser executada exclusivamente no Data Warehouse (`aura_dw`) | `INV-ANA-001` |
| `RN-BI-002` | Nenhum indicador corporativo pode ser calculado sem definição cadastrada no Catálogo de Métricas SSOT | `KpiService` |
| `RN-BI-003` | Tabelas fato no schema `aura_dw` são estritamente append-only — proibido UPDATE e DELETE | DDL constraint |
| `RN-BI-004` | Dados sensíveis (PHI/PII) pseudonimizados obrigatoriamente antes da gravação nas dimensões analíticas | `AnonymizationService` |
| `RN-BI-005` | k-anonimato ($k \ge 5$) exigido para visualização de relatórios geográficos ou por bairros | `AnonymizationService` |
| `RN-BI-006` | Ingestão CDC atualiza tabelas fato operacionais com latência máxima de 5 segundos | `EventConsumers` |
| `RN-BI-007` | Materialized Views de dashboards executivos atualizadas a cada 15 minutos via cron automático | `RefreshViewsWorker` |
| `RN-BI-008` | `relationship_audits` e `document_audits` integrados ao Data Warehouse para auditoria de segurança | `FactAudit` |
| `RN-BI-009` | Exportação de dados em lote (PDF/Excel) registrada na trilha de auditoria do BI com IP do usuário | `ExportController` |
| `RN-BI-010` | Modelo preditivo de IA deve ter explicabilidade SHAP registrada para cada previsão gerada | `ShapExplainerService` |
| `RN-BI-011` | Alteração de fórmula de KPI no Catálogo Oficial gera nova versão e notifica o Data Governance Board | `DataCatalogController` |
| `RN-BI-012` | Cache de consultas em Redis expira automaticamente em 5 minutos para dados operacionais | `QueryEngineService` |
| `RN-BI-013` | Acesso aos Data Marts Financeiros restrito a usuários com perfis autorizados (RBAC/ABAC) | `AbacGuard` |
| `RN-BI-014` | Dados históricos do Data Lake retidos em formato Parquet por 20 anos para fins legais | `LakeRetentionWorker` |
| `RN-BI-015` | SROI recalculado automaticamente a cada encerramento oficial de ciclo de programa social | `FactSocialImpact` |
| `RN-BI-016` | Relatórios consolidados anuais assinados digitalmente pelo CDO antes da publicação oficial | `ExportController` |
| `RN-BI-017` | Falha na pipeline de ingestão CDC dispara alerta imediato via PagerDuty/Slack para a equipe de Data Engineering | `PipelineHealthWorker` |
| `RN-BI-018` | Detecção de anomalia financeira (desvio $> 3\sigma$) bloqueia aprovações automáticas até revisão humana | `AnomalyDetectionWorker` |
| `RN-BI-019` | Consultas com tempo de execução $> 10$ segundos são interrompidas automaticamente | `QueryEngineService` |
| `RN-BI-020` | Dimensão de Tempo (`DimDate`) pré-populada para os próximos 50 anos com feriados nacionais e regionais | `DimDateSeed` |
| `RN-BI-021` | Gráfico comparativo obrigatoriamente inclui indicação da margem de erro ou intervalo de confiança | `FrontendDashboard` |
| `RN-BI-022` | Dados de voluntariado e doações agregados mensalmente para o Balanço Social Institucional | `FactDonation` |
| `RN-BI-023` | Matriz de permissão por linha (Row Level Security - RLS) restringe coordenadores à sua própria unidade | `PostgreSQL RLS` |
| `RN-BI-024` | Indicador de satisfação (NPS) ponderado pelo volume total de atendimentos de cada unidade | `NpsAnalyticsService` |
| `RN-BI-025` | Linhagem de dados (Data Lineage) mantida em grafo para rastreabilidade completa do dado bruto ao KPI | `DataCatalogService` |
| `RN-BI-026` | Proibida a exportação de microdados não anonimizados por usuários sem perfil de Data Steward | `ExportService` |
| `RN-BI-027` | Modelos de Machine Learning re-treinados mensalmente com os dados mais recentes do Data Lakehouse | `MlPipelineWorker` |
| `RN-BI-028` | Dashboard de Saúde do Sistema monitora uso de CPU, memória e throughput do Data Warehouse | `TechHealthDashboard` |
| `RN-BI-029` | Reconciliação diária de dados valida se o total de registros OLTP coincide com a contagem OLAP | `ReconciliationWorker` |
| `RN-BI-030` | Descrições de diagnósticos CID-11 mantidas em tabela dimensão separada sem vínculo direto ao nome do paciente | `DimDiagnosis` |
| `RN-BI-031` | Painéis estratégicos adaptados automaticamente para acessibilidade (leitores de tela e alto contraste) | `FrontendDashboard` |
| `RN-BI-032` | Alterações em esquemas dimensionais seguem estritamente padrão de migração desacoplada (SCD Type 2) | `DataEngineering` |

---

## ETAPA 12 — SEGURANÇA E PRIVACIDADE LGPD ANALÍTICA

- **Row Level Security (RLS)**: Aplicação de RLS no PostgreSQL `aura_dw` para segregação por unidade.
- **Column Level Security (CLS)**: Ocultação dinâmica de colunas financeiras ou de diagnóstico sensíveis conforme o perfil do usuário.
- **k-Anonimato**: Agrupamento mínimo de 5 indivíduos para exibição de métricas em mapas geográficos.

---

## ETAPA 13 — TESTES E OBSERVABILIDADE

### 13.1 Pirâmide de Testes (≥ 95% Cobertura)

- **Unitários**: `QueryEngineService`, `AnonymizationService`, `ShapExplainerService`.
- **Integração**: Pipeline CDC -> EventConsumer -> Inserção em `aura_dw.fact_attendance` -> Refresh da Materialized View.
- **E2E**: Visualização do Dashboard Executivo -> Aplicação de Filtro Temporal -> Exportação PDF Assinada.

### 13.2 Métricas Prometheus Analíticas

```
aura_dw_cdc_lag_seconds_gauge
aura_dw_query_duration_seconds_histogram
aura_dw_materialized_view_refresh_time_seconds
aura_dw_k_anonymity_violations_total
aura_dw_active_dashboard_users_count
```

---

## ETAPA 14 — AUDITORIA TÉCNICA E HOMOLOGAÇÃO

| Dimensão | Status | Evidência |
|---|---|---|
| `VULN-ANA-001` corrigida (Isolamento OLTP vs OLAP) | ✅ | Schema `aura_dw` isolado com ingestão por CDC |
| `VULN-ANA-002` corrigida (Mascaramento e k-anonimato) | ✅ | `AnonymizationEngine` ($k \ge 5$) nos Data Marts |
| `VULN-ANA-003` corrigida (SSOT de KPIs) | ✅ | Catálogo Corporativo de Métricas parametrizado |
| `VULN-ANA-004` corrigida (CDC streaming latência < 5s) | ✅ | Ingestão via Debezium + RabbitMQ |
| Imutabilidade das Tabelas Fato | ✅ | `REVOKE UPDATE, DELETE` no PostgreSQL |

---

## ETAPA 15 — DELIVERABLES E CONSOLIDAÇÃO DO ARTEFATO FINAL

### 15.1 Componentes e APIs para Consumo Imediato

| Componente | Tipo | Módulo Consumidor |
|---|---|---|
| `GET /dashboards/executive` | REST API | **Diretoria Executiva, Conselho Fiscal** |
| `GET /kpis` | REST API SSOT | **Todos os microserviços e Portais** |
| `ExecutiveDashboardPage` | React Component | **Painel Executivo Principal** |
| `AnonymizationService` | Shared Lib | **Exportações e Pesquisas Acadêmicas** |

---

## 🗺️ CONSOLIDAÇÃO FINAL DA PLATAFORMA INTEGRADA AURA (PROMPTS 00 A 25)

Com a conclusão do **Módulo 10 — Business Intelligence, Analytics & Governança de Dados**, a **Plataforma Corporativa Aura do Instituto Ser Melhor** possui a sua **ARQUITETURA ENTERPRISE DEFINITIVA E INTEGRADA (PROMPTS 00 A 25)**, contemplando:

1. **Prompt 00**: Governança Arquitetural Mestra
2. **Prompt 01**: Auditoria Arquitetural Integral
3. **Prompt 02**: Modelagem Completa do Domínio (DDD)
4. **Prompt 03**: Arquitetura Corporativa Definitiva
5. **Prompt 04**: Arquitetura Oficial de Dados
6. **Prompt 05**: Arquitetura Oficial de Integração
7. **Prompt 06**: Arquitetura Oficial de Segurança
8. **Prompt 07**: Arquitetura Oficial do Backend
9. **Prompt 08**: Arquitetura Oficial do Frontend
10. **Prompt 09**: Arquitetura Oficial de DevSecOps
11. **Prompt 10**: Arquitetura Oficial de Qualidade
12. **Prompt 11**: Governança Operacional Mestra
13. **Prompt 12**: Arquitetura Mestra de UX Enterprise
14. **Prompt 13**: Engenharia Mestra da IA e Multiagentes
15. **Prompt 14**: Engenharia Mestra dos Módulos de Negócio
16. **Prompt 15**: Plano Diretor de Execução (Master Execution Blueprint)
17. **Prompt 16 — Módulo 01**: Identidade, IAM e Autenticação (Aura Identity Platform)
18. **Prompt 17 — Módulo 02**: Cadastro Único & MDM 360° (Aura Citizen Platform)
19. **Prompt 18 — Módulo 03**: Triagem Inteligente SATAI (Aura Smart Triage Platform)
20. **Prompt 19 — Módulo 04**: Coordenação do Cuidado (Aura Care Coordination Platform)
21. **Prompt 20 — Módulo 05**: Prontuário Eletrônico Unificado PEU (Aura Unified Health Record Platform)
22. **Prompt 21 — Módulo 06**: Telemedicina e Omnichannel (Aura Digital Care Platform)
23. **Prompt 22 — Módulo 07**: Prescrição e Assinatura Digital ICP-Brasil (Aura Digital Documents Platform)
24. **Prompt 23 — Módulo 08**: Gestão Social & PID (Aura Social Impact Platform)
25. **Prompt 24 — Módulo 09**: CRM Social 360° (Aura Relationship Platform)
26. **Prompt 25 — Módulo 10**: Business Intelligence, Analytics & Governança de Dados (Aura Intelligence Platform)

---
*A Plataforma Aura está pronta para operação em nível enterprise de alta escala com conformidade ética, legal, clínica e social.*
