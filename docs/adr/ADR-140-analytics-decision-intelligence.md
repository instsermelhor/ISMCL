# ADR-140: Aura Enterprise Business Intelligence, Analytics & Decision Intelligence Platform (AEBI-DI)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Data Officer (CDO), Chief Analytics Officer (CAO), Principal BI Architect, Principal AI Architect  
**Referência:** Prompt 140 (AEBI-DI), P108 AEDP, P113 AEABI, LGPD Art. 11, MCSI

---

## Contexto

Após a implementação dos módulos assistenciais, clínicos e operacionais (P131–P139), a Plataforma Aura necessita de uma camada analítica e de inteligência decisional (Decision Intelligence) para transformar eventos em indicadores em tempo real, previsões preditivas e insights estratégicos para a governança do Instituto Ser Melhor.

## Decisão

### 1. Enterprise Data Warehouse com Arquitetura em Estrela (Star Schema)

**Decisão:** O `DataWarehouseService` consolida fatos de atendimento, prescrições, evoluções de prontuário, agendamentos e tarefas em tabelas fato (`fact_attendance`, `fact_prescription`, `fact_workflow_execution`) e dimensões (`dim_beneficiary`, `dim_professional`, `dim_time`).

### 2. Data Marts Especializados Desacoplados

**Decisão:** Criação de 9 Data Marts independentes atualizados via EventBus:
`SOCIAL_CARE`, `PSYCHOLOGY`, `PSYCHIATRY`, `FINANCIAL`, `HUMAN_RESOURCES`, `GOVERNANCE`, `COMPLIANCE`, `VOLUNTEER` e `EXECUTIVE`.

### 3. KPI Engine com Recálculo Dinâmico em Tempo Real

**Decisão:** O `KpiEngineService` provê cadastro e recálculo dinâmico de KPIs parametrizáveis pelo `SUPER_ADMIN`. Inclui detecção de tendência (`UPWARD`, `DOWNWARD`, `STABLE`), % de atingimento da meta e classificação em `OPTIMAL`, `WARNING` ou `CRITICAL`. Emitindo eventos `aura.analytics.kpi.calculated.v1`.

### 4. Análises Preditivas com IA Explicável (XAI)

**Decisão:** O `PredictiveAnalyticsService` implementa modelos de Inteligência Artificial Explicável (Explainable AI) para:
- `DROPOUT_RISK`: Risco de abandono do acompanhamento assistencial.
- `DEMAND_FORECAST`: Previsão de demanda futura por especialidade.
- `RESOURCE_OVERLOAD`: Identificação prévia de sobrecarga de profissionais/salas.
- `RECURRENCE_RISK`: Risco de reincidência de vulnerabilidade social.

Cada predição traz lista de fatores ponderados (`explanations`) e ação recomendada auditável.

### 5. Governança de Dados e Linhagem (Data Lineage)

**Decisão:** O `DataGovernanceService` mantêm o Catálogo de Dados Corporativo, o Dicionário de Dados, a Linhagem do dado (Módulo Origem → EventBus → DW → Data Mart → Dashboard) e métricas automáticas de qualidade (Completude, Consistência, Atualidade, Validade). Respeitando a classificação LGPD (Art. 11) e MCSI.

### 6. Event-Driven Analytics Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.analytics.kpi.calculated.v1`
- `aura.analytics.predictive.executed.v1`

## Consequências

- ✅ Visão estratégica consolidada no Cockpit Executivo em tempo real.
- ✅ Decisões baseadas em dados (Data-Driven Decision Making) com modelos preditivos explicáveis (XAI).
- ✅ Governança de dados completa com conformidade LGPD e MCSI.

---

*Homologado pelo Analytics & Data Governance Board — AEBI-DI Prompt 140*
