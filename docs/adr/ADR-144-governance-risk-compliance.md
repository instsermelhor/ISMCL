# ADR-144: Aura Enterprise Governance, Risk, Compliance & Strategic Management Platform (AEGRC)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Executive Officer (CEO), Chief Governance Officer (CGO), Chief Compliance Officer (CCO), Chief Risk Officer (CRO), Chief Audit Executive (CAE)  
**Referência:** Prompt 144 (AEGRC), P107 AEIAT, P116 AEGRC, LGPD, MCSI, Zero Trust

---

## Contexto

O Instituto Ser Melhor exige uma camada corporativa unificada de Governança, Gestão de Riscos (ERM), Compliance, Controles Internos, Planejamento Estratégico, OKRs e Deliberações de Comitês com rastreabilidade total, não-repúdio, integridade e conformidade regulatória contínua.

## Decisão

### 1. Enterprise Risk Management (ERM) & Risk Score (Probabilidade × Impacto)

**Decisão:** O `EnterpriseRiskGovernanceService` implementa gestão de riscos categorizados em 9 dimensões: `STRATEGIC`, `OPERATIONAL`, `ASSISTENTIAL`, `TECHNOLOGY`, `FINANCIAL`, `LEGAL`, `REPUTATIONAL`, `CONTINUITY`, `THIRD_PARTY`.
- Cálculo automático do Risk Score (1 a 25) derivado de Probabilidade (1–5) × Impacto (1–5).
- Níveis de Risco: `LOW` (1–4), `MODERATE` (5–9), `HIGH` (10–16), `CRITICAL` (17–25).
- Plano de resposta e atribuição obrigatória de Risk Owner para cada risco.

### 2. Gestão de Controles Internos & Mapeamento de Riscos

**Decisão:** Os Controles Internos são estruturados em 4 tipologias: `PREVENTIVE`, `DETECTIVE`, `CORRECTIVE`, `COMPENSATORY`, vinculados aos riscos corporativos para garantir eficácia operacional e mitigation permanente.

### 3. Segregação de Funções (SoD) na Gestão de Políticas Institucionais

**Decisão:** As políticas, normas e manuais possuem ciclo de vida rigoroso: `DRAFT -> UNDER_REVIEW -> APPROVED -> PUBLISHED -> DEPRECATED`.
- Impossibilidade de autopublicação: a aprovação e publicação de políticas são estritamente restritas a detentores de perfil `SUPER_ADMIN` ou Conselho Governamental (Segregação de Funções - SoD).
- Assinatura digital SHA-256 no momento da emissão da versão.

### 4. Planejamento Estratégico, OKRs e Integração com BI & Workflow Engine

**Decisão:** O `StrategicPlanningGrcService` gerencia Objetivos Estratégicos e OKRs (Objectives and Key Results) com acompanhamento periódico de KRs mensuráveis.
- Deliberações de comitês geram automaticamente instâncias de tarefas no Workflow Engine (P139) para garantir execução operacional com prazos e responsáveis definidos.
- Assinatura digital de atas e deliberações para garantia de integridade jurídica.

### 5. Event-Driven Governance Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.governance.risk.registered.v1`
- `aura.governance.policy.published.v1`
- `aura.governance.okr.registered.v1`
- `aura.governance.committee.decision.v1`

## Consequências

- ✅ Governança institucional transparente, auditável e orientada por dados em tempo real.
- ✅ Gestão proativa de riscos clínicos, reputacionais, tecnológicos e de conformidade LGPD/MCSI.
- ✅ Alinhamento estratégico total entre a Diretoria, Comitês e a operação assistencial do Instituto Ser Melhor.

---

*Homologado pelo Board de Governança Institucional — AEGRC Prompt 144*
