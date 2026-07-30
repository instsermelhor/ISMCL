# ADR 152: Aura Cognitive Orchestration Platform — Multi-Agent Intelligence & Autonomous Decision Support (ACOP)

## Status
Accepted / Implemented — **Fase III — Prompt 152**

## Contexto

O Prompt 151 inaugurou a Fase II com o Centro de Inteligência Institucional (AIIC), transformando a Plataforma Aura de uma solução operacional reativa para um ecossistema preditivo e analítico.

O Prompt 152 inaugura a **Fase III** do Projeto Aura, implementando o **Centro de Orquestração Cognitiva (ACOP)** — a camada de coordenação inteligente que unifica todas as inteligências artificiais do ecossistema.

O Instituto Ser Melhor necessitava de uma arquitetura que:
- Coordenasse 14 agentes especializados sem decisões isoladas
- Garantisse rastreabilidade XAI para toda decisão automatizada
- Persitisse aprendizados institucionais para aperfeiçoamento contínuo
- Controlasse o ciclo de vida completo dos modelos de IA
- Mantivesse supervisão humana obrigatória em decisões críticas

## Decisão

Implementar o `CognitiveOrchestrationModule` como um conjunto de **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3), com os seguintes componentes:

### 1. CognitiveOrchestratorService (Orquestrador Central)
- Coordena todo o fluxo de orquestração end-to-end
- Integra routing → collaboration → reasoning → recommendation → memory → audit
- Publica `aura.cognitive.orchestration.started.v1` e `aura.cognitive.orchestration.completed.v1`
- Nenhum agente atua isoladamente em processos críticos

### 2. MultiAgentCoordinationService (Coordenação Multi-Agente)
- Registra e gerencia 14 agentes especializados por domínio
- Estratégias de resolução de conflitos: MAJORITY_VOTE, CONFIDENCE_WEIGHTED, DOMAIN_AUTHORITY, ESCALATE_HUMAN
- Publica `aura.cognitive.task.assigned.v1`
- Conflitos éticos são SEMPRE escalados para supervisão humana

### 3. AITaskRoutingService (Roteamento Inteligente)
- Seleção de agentes por capability matching + load balancing
- Suporte a restrições de latência e custo por requisição
- Score ponderado: capabilities × 10 − load × 2
- Publica `aura.cognitive.agent.selected.v1`

### 4. InstitutionalReasoningEngine (Motor de Raciocínio)
- Consolida 6 fontes: KnowledgeGraph, RulesEngine, CognitiveMemory, ECM, BI_Analytics, PolicyCatalog
- Score de confiança ponderado por qualidade das evidências
- Trilha de auditoria completa em cada execução
- Publica `aura.cognitive.reasoning.completed.v1`

### 5. AutonomousRecommendationService (Recomendações Autônomas)
- Toda recomendação exige aprovação humana (Human-in-the-Loop)
- Contém: justificativa, evidências, impacto estimado, confiança, validador
- Feedback humano retroalimenta memória cognitiva para aprendizado contínuo
- Publica `aura.cognitive.recommendation.generated/approved/rejected.v1`

### 6. ModelRegistryLifecycleService (Ciclo de Vida de Modelos)
- Registro com verificação de integridade (checksum SHA-256)
- Ciclo: REGISTERED → STAGING → PRODUCTION → RETIRED/REPLACED
- Toda promoção para PRODUCTION exige humanApproverId
- Publica `aura.cognitive.model.registered.v1` e `aura.cognitive.model.transitioned.v1`

### 7. AICollaborationService (Colaboração Multi-Agente)
- Sessões de colaboração com múltiplas rodadas de síntese
- Detecção automática de conflitos por análise de confiança
- Status: CONSENSUS_REACHED (score ≥ 0.85) ou ESCALATED
- Publica `aura.cognitive.collaboration.session_started.v1`

### 8. CognitiveMemoryService (Memória Cognitiva Institucional)
- Armazena decisões, padrões, feedbacks e aprendizados por tenant/entidade
- Tipos: short_term, long_term, working
- Busca vetorial por embedding (vectorEmbeddingRef)
- Publica `aura.cognitive.memory.updated.v1`

### 9. AIPerformanceMonitoringService (Monitoramento de Performance)
- Métricas por modelo: latência, custo, hallucination risk, bias score
- Estatísticas agregadas em tempo real
- Detecção automática de drift (driftIndex > 0.25)
- Publica `aura.cognitive.performance_recorded` e `aura.cognitive.performance.changed.v1`

### 10. CognitiveAuditService (Auditoria Cognitiva Imutável)
- Assinatura SHA-256 de toda entrada de auditoria
- logId no formato `COG-AUD-{YEAR}-{SEQ}`
- Campos XAI: agentType, cognitiveLevel, explanationSummary, confidenceScore
- Campos HITL: humanInTheLoopRequired, humanApproved, humanReviewerId

## Arquitetura de Eventos (CloudEvents v1.0.3)

| Evento | Publicado por | Gatilho |
|--------|--------------|---------|
| `aura.cognitive.orchestration.started.v1` | CognitiveOrchestratorService | Início de orquestração |
| `aura.cognitive.orchestration.completed.v1` | CognitiveOrchestratorService | Conclusão de orquestração |
| `aura.cognitive.task.assigned.v1` | MultiAgentCoordinationService | Atribuição de tarefa |
| `aura.cognitive.agent.selected.v1` | AITaskRoutingService | Seleção de agente |
| `aura.cognitive.reasoning.completed.v1` | InstitutionalReasoningEngine | Raciocínio concluído |
| `aura.cognitive.recommendation.generated.v1` | AutonomousRecommendationService | Nova recomendação |
| `aura.cognitive.recommendation.approved.v1` | AutonomousRecommendationService | Aprovação humana |
| `aura.cognitive.recommendation.rejected.v1` | AutonomousRecommendationService | Rejeição humana |
| `aura.cognitive.model.registered.v1` | ModelRegistryLifecycleService | Registro de modelo |
| `aura.cognitive.model.transitioned.v1` | ModelRegistryLifecycleService | Transição de estado |
| `aura.cognitive.collaboration.session_started.v1` | AICollaborationService | Início de sessão |
| `aura.cognitive.memory.updated.v1` | CognitiveMemoryService | Atualização de memória |
| `aura.cognitive.performance_recorded` | AIPerformanceMonitoringService | Telemetria registrada |
| `aura.cognitive.performance.changed.v1` | AIPerformanceMonitoringService | Drift detectado |

## Princípios de Governança

- **Zero Trust**: Toda chamada ao orquestrador requer JWT válido + RBAC
- **LGPD**: Dados de beneficiários são sempre associados ao tenantId, nunca expostos em logs globais
- **XAI (Explainable AI)**: Toda decisão inclui explanationSummary, evidenceChain e auditTrail
- **Human-in-the-Loop**: Recomendações críticas e promoção de modelos exigem aprovação humana explícita
- **Auditoria Imutável**: SHA-256 de cada entrada garante não-repúdio

## Agentes Especializados Registrados

| # | Domínio | Tipo de Agente | Capacidades-Chave |
|---|---------|---------------|-------------------|
| 1 | PSYCHOLOGY | CLINICAL_ASSISTANT | tcc, phq9_scoring, anxiety_assessment |
| 2 | PSYCHIATRY | CLINICAL_ASSISTANT | medication_review, risk_assessment, suicide_prevention |
| 3 | SOCIAL_WORK | SOCIAL_ASSISTANT | social_vulnerability, benefit_eligibility, family_assessment |
| 4 | LEGAL | LEGAL_ADVISOR | legal_advice, contract_review, lgpd_compliance |
| 5 | FINANCE | FINANCIAL_ANALYST | budget_analysis, cost_forecasting, financial_risk |
| 6 | HUMAN_RESOURCES | HR_ADVISOR | hr_onboarding, performance_review, training_recommendation |
| 7 | COMPLIANCE | COMPLIANCE_OFFICER | lgpd_compliance, policy_audit, regulatory_check |
| 8 | AUDIT | AUDIT_INSPECTOR | audit_trail_analysis, anomaly_detection, fraud_detection |
| 9 | SECURITY | SECURITY_GUARDIAN | threat_detection, zero_trust_validation, incident_response |
| 10 | CASE_MANAGEMENT | CASE_COORDINATOR | case_routing, sla_management, triage |
| 11 | BI_ANALYTICS | BI_ANALYST | data_analysis, kpi_monitoring, trend_detection |
| 12 | ECM_DOCUMENTS | ECM_MANAGER | document_classification, content_extraction, summarization |
| 13 | CORPORATE_UNIVERSITY | TRAINING_FACILITATOR | training_recommendation, skill_gap_analysis |
| 14 | GOVERNANCE | GOVERNANCE_SUPERVISOR | governance_review, risk_scoring, strategic_alignment |

## Consequências

- Estabelece a Fase III da Plataforma Aura como um **Ecossistema Cognitivo Autônomo**
- Elimina decisões de IA isoladas — todo agente opera sob supervisão do Orquestrador Central
- Memória cognitiva garante aprendizado contínuo com base em feedback humano real
- A trilha de auditoria imutável (SHA-256) garante rastreabilidade total para fins legais e regulatórios
- Conformidade integral com LGPD, IA Responsável, Explainable AI (XAI) e Zero Trust
