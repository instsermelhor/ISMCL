# ADR-134: Aura Intelligent Welcome, Screening & Case Intake Platform (AIWSP)

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Clinical Information Officer (CCIO), Chief Social Care Officer (CSCO), Principal Healthcare Architect  
**Referência:** Prompt 134 (AIWSP), Technical Baseline P120, OSS P129, Prompt 131 AFPI, Prompt 132 AIFI, Prompt 133 AAIRP

---

## Contexto

A transformação do cadastro qualificado (Prompt 133) em uma jornada assistencial humanizada, ágil e protegida exige uma plataforma inteligente de acolhimento e triagem. O Projeto Aura integra atendimento psicológico, psiquiátrico, social e emergencial em um único fluxo de recepção digital e presencial.

## Decisão

### 1. Motores Inteligentes de Admissão Assistencial

**Decisão:** O domínio `@domain/intake` foi estruturado com 3 motores e 4 serviços desacoplados:
- **CrisisDetectionEngine:** Monitora relatos e marcadores estruturados para acionamento imediato do `PROTOCOLO_EMERGENCIA_PSICOSSOCIAL_V1`.
- **PriorityClassificationEngine:** Define o nível de prioridade (ROUTINE, PRIORITY, URGENT, EMERGENCY, CRITICAL) e SLAs de atendimento em horas.
- **ReferralRecommendationEngine:** Recomenda o direcionamento automático para Psicologia, Psiquiatria, Serviço Social ou Emergência.
- **WelcomeService:** Orquestra a recepção digital e o fluxo humanizado.
- **CaseOpeningService:** Cria o Caso Assistencial Imutável com identificador `AURA-YYYY-XXXXX` e linha do tempo.
- **InitialCarePlanService:** Gera o plano assistencial inicial com metas e frequências recomendadas.

### 2. Protocolos de Crise Automatizados

**Decisão:** Situações envolvendo ideação suicida, automutilação, violência doméstica e abuso acionam alertas vermelhos imediatos, notificando equipes de plantão sem depender de triagem manual diferida.

### 3. Event-Driven Intake Architecture

**Decisão:** Comunicação orientada a eventos no padrão CloudEvents v1.0.3:
- `aura.intake.welcome.started.v1`
- `aura.intake.screening.completed.v1`
- `aura.intake.crisis.detected.v1`
- `aura.intake.case.created.v1`
- `aura.intake.careplan.created.v1`

## Consequências

- ✅ Acolhimento humanizado integrado ao Prontuário Eletrônico (Prompt 135) e ERP Social.
- ✅ Redução drástica do tempo de resposta (SLA de 30 minutos em casos de crise).
- ✅ Total auditabilidade e rastreabilidade da linha do tempo assistencial.

---

*Homologado pelo Clinical & Social Governance Board — AIWSP Prompt 134*
