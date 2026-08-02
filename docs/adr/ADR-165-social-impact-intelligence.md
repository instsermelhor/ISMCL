# ADR-165: Aura Social Impact Intelligence, Outcome Measurement & Institutional Accountability Platform (SIIP)

**Status:** ACCEPTED  
**Fase:** XV — Mensuração de Impacto Social, Avaliação de Efetividade e Prestação de Contas  
**Data:** 2026-08-02  
**Responsáveis:** CEO, CSO, CSIO, CDO, CAIO, CGO, CCO  
**Prompt de Origem:** P165 — SIIP  

---

## Contexto

Após os Prompts 120–164, o Projeto Aura conta com orquestração de IA, governança autônoma, homologação para produção, observabilidade e gerenciamento do ciclo de vida.

Para cumprir plenamente a missão do **Instituto Ser Melhor**, é imperativo mensurar cientificamente e de maneira imutavelmente auditável o **impacto social real** produzido sobre os beneficiários e a comunidade, fornecendo evidências para prestação de contas, transparência, captação de recursos e investimento social.

---

## Decisão

Implementar o módulo `social-impact` em `backend/src/domain/social-impact/`, composto por **10 microsserviços desacoplados** orientados por eventos (CloudEvents v1.0.3).

---

## Arquitetura dos 10 Microsserviços

1. `SocialImpactAuditService`: Trilha imutável em SHA-256 e consistência estatística de dados de impacto.
2. `SocialImpactService`: Framework de mensuração em 10 dimensões (Acolhimento, Saúde Mental, Assistência Social, Desenvolvimento Humano, Educação, Proteção Social, Voluntariado, Gestão, Sustentabilidade Financeira, Comunidade).
3. `OutcomeMeasurementService`: Análise longitudinal de resultados e qualidade de vida.
4. `ProgramEvaluationService`: Avaliação comparativa de efetividade, eficiência, alcance e **Social Return on Investment (SROI)**.
5. `InstitutionalIndicatorsService`: Matriz parametrizada de KPIs quantitativos e qualitativos.
6. `ESGMetricsService`: Scorecard de métricas ESG auditáveis (Social, Governança, Inclusão, Acessibilidade).
7. `BeneficiaryEvolutionService`: Acompanhamento de beneficiários com pseudonimização LGPD estrita.
8. `EvidenceConsolidationService`: Consolidação automática de dados do ERP Social, Prontuários (EHR), BI e Digital Twin.
9. `AccountabilityService`: Geração automatizada de relatórios institucionais para financiadores, auditorias e conselhos.
10. `ImpactDashboardService`: Painel executivo consolidado com filtros temporais e territoriais.

---

## Privacidade & LGPD

Todas as análises de impacto e acompanhamentos longitudinais utilizam exclusivamente **IDs pseudonimizados** (`pseudonymizedBeneficiaryId`), garantindo a preservação total do anonimato dos assistidos em relatórios públicos e de prestação de contas.

---

## Consequências

Esta decisão estabelece o motor definitivo de mensuração de valor social do Instituto Ser Melhor, demonstrando com rigor científico o retorno social sobre o investimento (SROI) e a efetividade das ações da instituição.
