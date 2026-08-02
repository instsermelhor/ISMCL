# ADR 159: Aura Decision Intelligence, Evidence-Based Management & Executive Analytics Platform (ADIP)

## Status
Accepted / Implemented — **Fase X — Prompt 159**

## Contexto

Após a consolidação do Digital Twin Organizacional (P157 ADT) e da Plataforma Corporativa de Inteligência do Conhecimento (P158 AEKIP), a Plataforma Aura avança para a **Fase X: Gestão Baseada em Evidências e Inteligência para Apoio à Decisão (ADIP)**.

A instituição enfrentava os seguintes desafios decisórios:
- Recomendações e relatórios executivos não citavam evidências rastreáveis e auditáveis
- Falta de transparência no raciocínio dos modelos analíticos (caixa-preta)
- Ausência de simulação de trade-offs (custo vs. benefício social vs. tempo de execução vs. risco)
- Dificuldade para rastrear justificativas humanas em decisões que divergiram das recomendações automatizadas
- Riscos de automatização indevida em decisões assistenciais e clínicas críticas

## Decisão

Implementar o módulo `DecisionIntelligenceModule` em `backend/src/domain/decision-intelligence/` composto por **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3), com IA Explicável (XAI) e governança *Human-in-the-Loop* mandatória para decisões críticas.

### 1. DecisionAuditService (Auditoria SHA-256 Imutável)
- Registra e assina criptograficamente todas as recomendações prescritivas geradas e todas as avaliações/aprovações humanas
- Publica: `aura.decision.audit.completed.v1`

### 2. EvidenceManagementService (Gestão de Evidências)
- Coleta e vincula evidências rastreáveis provenientes de indicadores de BI, documentos do EKIP (P158), simulações do Digital Twin (P157) e observabilidade AUOC (P156)
- Publica: `aura.decision.evidence.collected.v1`

### 3. ExplainableAiDecisionService (IA Explicável — XAI)
- Gera relatórios de explicabilidade detalhando pontuação de confiança (%), nível de confiança, fatores primários de influência, regras aplicadas, limitações e alternativas consideradas
- Publica: `aura.decision.explainable.generated.v1`

### 4. PredictiveAnalyticsService (Analytics Preditivo)
- Executa projeções de demanda futura, riscos operacionais, necessidade de profissionais e evolução financeira
- Publica: `aura.decision.predictive.completed.v1`

### 5. PrescriptiveAnalyticsService (Analytics Prescritivo)
- Gera alternativas com matriz de trade-offs (custo, tempo, risco, benefício social)
- Publica: `aura.decision.prescriptive.completed.v1`

### 6. ExecutiveKpiIntelligenceService (Gestão Inteligente de KPIs)
- Monitora indicadores estratégicos corporativos e calcula desvios percentuais em relação à meta
- Publica: `aura.decision.kpi.alert.detected.v1`

### 7. DecisionRecommendationService (Motor de Recomendações)
- Combina evidências, simulações e o raciocínio XAI para emitir recomendações prescritivas categorizadas
- Publica: `aura.decision.recommendation.generated.v1`

### 8. DecisionGovernanceService (Governança Humana)
- Garante o modelo *Human-in-the-Loop*: nenhuma decisão crítica é automatizada sem aprovação e justificativa formal de gestor humano
- Publica: `aura.decision.approved.v1` e `aura.decision.rejected.v1`

### 9. ExecutiveAnalyticsService (Executive Analytics)
- Consolida dados para painéis executivos com suporte a drill-down e drill-through
- Publica: `aura.decision.executive.dashboard.updated.v1`

### 10. DecisionIntelligenceService (Hub Orquestrador)
- Centraliza o fluxo de tomada de decisão baseada em evidências, orquestrando os 9 serviços especialistas

## Catálogo de Eventos (AsyncAPI 2.6.0)

| Evento | Publicado por |
|--------|--------------|
| `aura.decision.recommendation.generated.v1` | DecisionRecommendationService |
| `aura.decision.evidence.collected.v1` | EvidenceManagementService |
| `aura.decision.predictive.completed.v1` | PredictiveAnalyticsService |
| `aura.decision.prescriptive.completed.v1` | PrescriptiveAnalyticsService |
| `aura.decision.executive.dashboard.updated.v1` | ExecutiveAnalyticsService |
| `aura.decision.explainable.generated.v1` | ExplainableAiDecisionService |
| `aura.decision.kpi.alert.detected.v1` | ExecutiveKpiIntelligenceService |
| `aura.decision.approved.v1` | DecisionGovernanceService |
| `aura.decision.rejected.v1` | DecisionGovernanceService |
| `aura.decision.audit.completed.v1` | DecisionAuditService |

## Princípios de Governança e Transparência

- **Human-in-the-Loop Mandatório**: Nenhuma recomendação substitui o julgamento humano em decisões assistenciais, clínicas ou estratégicas críticas.
- **XAI Transparente**: Explicabilidade completa com ponderação percentual de fatores de influência e explicitação de limitações do modelo.
- **Rastreabilidade de Evidências**: Toda recomendação prescreve opções obrigatoriamente embasadas em evidências auditáveis.
- **Auditoria Criptográfica**: Assinatura SHA-256 no ciclo completo de recomendação e decisão humana.

## Consequências

- Estabelece a **Fase X — Ecossistema Inteligente Orientado por Dados, Evidências e IA Explicável** do Projeto Aura
- O Instituto Ser Melhor passa a ter uma Plataforma Corporativa de Decision Intelligence transparente e auditável
- Gestores tomam decisões fundamentadas em evidências do Digital Twin (P157) e da Plataforma de Conhecimento (P158)
