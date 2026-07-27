# ADR-135: Aura Enterprise Case Management Platform (AECMP)

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Clinical Information Officer (CCIO), Chief Social Care Officer (CSCO), Principal Case Management Architect  
**Referência:** Prompt 135 (AECMP), Technical Baseline P120, OSS P129, Prompt 131 AFPI, Prompt 132 AIFI, Prompt 133 AAIRP, Prompt 134 AIWSP

---

## Contexto

A transformação dos atendimentos pontuais em uma gestão longitudinal integrada do cuidado exige uma plataforma corporativa de acompanhamento de casos. O Projeto Aura diferencia-se por articular equipes multidisciplinares (Psicologia, Psiquiatria, Serviço Social e Rede Parceira) com metas quantificáveis e linha do tempo imutável.

## Decisão

### 1. Linha do Tempo Imutável e Auditável

**Decisão:** O domínio `@domain/case-management` foi projetado em torno do **CaseTimelineService**, garantindo que 100% dos eventos assistenciais, prescrições, reuniões da equipe multidisciplinar e alterações de status sejam gravados em ordem cronológica com imutabilidade e rastreabilidade total.

### 2. Gestão de Metas e Resolutividade Quantificável

**Decisão:** Cada caso possui metas categorizadas (Clínicas, Psicossociais, Educacionais, Familiares) cujo progresso é medido de 0% a 100%. A resolutividade global do caso é calculada com base na evolução média e taxa de adesão ao plano de cuidados.

### 3. Event-Driven Case Lifecycle

**Decisão:** Publicação de eventos padronizados no formato CloudEvents v1.0.3:
- `aura.case.assigned.v1`
- `aura.case.status.updated.v1`
- `aura.case.goal.completed.v1`
- `aura.case.outcome.measured.v1`
- `aura.case.closed.v1`
- `aura.case.reopened.v1`

## Consequências

- ✅ Acompanhamento longitudinal humanizado por toda a jornada do beneficiário.
- ✅ Transparência total entre a equipe multidisciplinar de saúde e assistência social.
- ✅ Possibilidade de calcular o indicador de resolutividade assistencial em tempo real.

---

*Homologado pelo Case Management & Clinical Governance Board — AECMP Prompt 135*
