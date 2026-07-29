# ADR 151: Aura Institutional Intelligence Center & Decision Support Platform (AIIC)

## Status
Accepted / Implemented (Phase II - Prompt 151)

## Context
O Prompt 150 marcou a conclusão da arquitetura corporativa operacional do Projeto Aura (Prompts 120–150). O Prompt 151 inaugura a Fase II do ecossistema com a implementação do Centro de Inteligência Institucional (AIIC - Institutional Intelligence Center).

O Instituto Ser Melhor necessitava de uma camada analítica e decisional de nível executivo e estratégico que consolidasse dados operacionais, assistenciais, financeiros, sociais, humanos e de governança em tempo real. Esta camada devia oferecer análises preditivas, simulação de cenários, recomendação explicável, grafação de conhecimento e governança estrita de modelos de IA com supervisão Human-in-the-Loop.

## Decision
Implementar o microsserviço `InstitutionalIntelligenceModule` com a seguinte arquitetura descentralizada e orientada por eventos:

1. **Pre-Implementation Audit (Etapa 1)**: Validação prévia de integridade de dados e conformidade ética de IA para os Prompts 120–150.
2. **Unified Organizational View (Institutional Intelligence Service)**: Consolidação de visão 360° da instituição com publicação do evento `aura.institutional.insight.generated.v1`.
3. **Decision Intelligence Service**: Suporte à decisão estratégica via simulação de cenários com cálculo de confiança e análises de impacto em tempo real (`aura.institutional.decision.simulated.v1`).
4. **Predictive Analytics Service**: Modelos preditivos para evasão de beneficiários, sobrecarga de profissionais, riscos assistenciais e riscos financeiros (`aura.institutional.prediction.calculated.v1`).
5. **Recommendation Engine Service**: Sugestões inteligentes explicáveis para encaminhamento, treinamentos e protocolos com circuito fechado de feedback loop (`aura.institutional.recommendation.created.v1`).
6. **Institutional Knowledge Graph Service**: Grafo semântico conectando pessoas, projetos, atendimentos, documentos e competências (`aura.institutional.knowledgegraph.updated.v1`).
7. **AI Governance Service**: Catálogo de governança de modelos de IA com rastreamento de F1-Score, viés, explicabilidade SHAP e aprovação obrigatória Human-in-the-Loop (`aura.institutional.aimodel.approved.v1`).
8. **Continuous Optimization Service**: Detecção automática de gargalos operacionais e geração de planos de ação priorizados (`aura.institutional.optimization.suggested.v1`).
9. **REST Controller with OpenAPI 3.1 & CloudEvents v1.0.3**: 10 endpoints REST devidamente autorizados por JWT e RBAC (`SUPER_ADMIN`, `ADMIN`, `DIRECTOR`, `SPECIALIST`).

## Consequences
- Transição da Plataforma Aura de uma solução reativa/operacional para um ecossistema preditivo e autoadaptativo.
- Conformidade total com LGPD, MCSI, Zero Trust e princípios de IA ética com explicabilidade auditável.
- Garantia de que nenhuma decisão crítica seja tomada exclusivamente por inteligência artificial sem validação por um especialista humano.
