# ADR 156: Aura Unified Operations Center, Observability, AIOps & Resilience Platform (AUOC)

## Status
Accepted / Implemented — **Fase VII — Prompt 156**

## Contexto

Após a consolidação da Camada de Interoperabilidade Corporativa (P155 AEIDIP), a Plataforma Aura necessitava de um Centro Unificado de Operações (Unified Operations Center) capaz de supervisionar continuamente todos os componentes do ecossistema — microsserviços, banco de dados, filas, Event Bus, conectores externos, agentes de IA e integrações institucionais.

A plataforma carecia de:
- Observabilidade distribuída (Logs, Métricas Prometheus, Traces OpenTelemetry) centralizada e correlacionada
- Inteligência Operacional com AIOps para detecção automática de anomalias e análise de causa raiz explicável (XAI)
- Gerenciamento corporativo de incidentes com classificação P1-P4, metas de SLA e registro obrigatório de pós-mortem
- Análise preditiva de falhas de infraestrutura (Memory Exhaustion, CPU Throttling, Queue Overflow)
- Correlação entre falhas técnicas e impacto social, assistencial e financeiro do Instituto Ser Melhor
- Testes de resiliência e Chaos Engineering periódicos e auditados
- Autorremediação parametrizada e auditável (sem intervenção humana para operações não-destrutivas)
- Governança SRE com monitoramento contínuo de SLIs, SLOs, SLAs e Error Budgets

## Decisão

Implementar o módulo `UnifiedOperationsModule` composto por **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3), com cobertura total por suíte de testes Jest e documentação completa em AsyncAPI 2.6.0.

### 1. UnifiedOperationsService (Hub Central de Operações)
- Consolida em um único painel operacional (Unified Operational Dashboard) os dados de saúde de todos os microsserviços, incidentes ativos, anomalias detectadas e avaliações de SLO
- Publica: `aura.operations.health.updated.v1`

### 2. EnterpriseObservabilityService (Observabilidade Distribuída)
- Coleta e agrega Logs, Métricas (Prometheus/OTLP), Traces (OpenTelemetry/Jaeger) e Telemetria de Negócio
- Correlaciona automaticamente evidências de múltiplos microsserviços por janela temporal deslizante

### 3. AiOpsIntelligenceService (AIOps com XAI)
- Detecção de anomalias baseada em Z-Score e algoritmos de série temporal com raciocínio explicável (XAI)
- Classificação automática de severidade (P1–P4) e recomendação de remediação
- Publica: `aura.operations.anomaly.detected.v1`

### 4. IncidentManagementService (Gerenciamento de Incidentes P1–P4)
- Ciclo de vida completo: DETECTED → INVESTIGATING → IDENTIFIED → MONITORING → RESOLVED → CLOSED
- SLA automático por severidade: P1=15min, P2=60min, P3-P4=240min
- Registro mandatório de pós-mortem e lições aprendidas
- Publica: `aura.operations.incident.detected.v1` e `aura.operations.incident.resolved.v1`

### 5. ServiceHealthMonitoringService (Health Checks Ativos e Passivos)
- Verificações de liveness e readiness em microsserviços, banco de dados, Event Bus e conectores externos
- Publica: `aura.operations.health.updated.v1`

### 6. PredictiveFailureAnalysisService (Análise Preditiva)
- Previsão de Memory Exhaustion, CPU Throttling, Queue Overflow, SLO Breach e Disk Saturation
- Score de probabilidade e estimativa de tempo para falha (time-to-failure)
- Publica: `aura.operations.predictive_failure.generated.v1`

### 7. BusinessObservabilityService (Observabilidade de Negócio)
- Correlaciona falhas técnicas com impacto em atendimentos, beneficiários afetados e custo financeiro estimado
- Publica: `aura.operations.business_impact.calculated.v1`

### 8. ResilienceManagementService (Resiliência & Chaos Engineering)
- Testes de Chaos Engineering: Latency Injection, Service Outage, Packet Loss, Resource Exhaustion, Failover
- Verificação de autorrecuperação com score de resiliência
- Publica: `aura.operations.resilience_test.completed.v1`

### 9. OperationalAutomationService (Autorremediação Auditável)
- Autorremediação parametrizada: RESTART_SERVICE, PURGE_QUEUE, AUTO_SCALE_PODS, ISOLATE_COMPONENT, FLUSH_CACHE
- Todas as ações são assinadas SHA-256 e registradas na trilha imutável
- Publica: `aura.operations.remediation.executed.v1`

### 10. SreGovernanceService (Governança SRE & Auditoria SHA-256)
- Avaliação contínua de SLIs, SLOs, SLAs e cálculo de Error Budget residual
- Trilha imutável de auditoria operacional com assinatura criptográfica SHA-256
- Publica: `aura.operations.slo.breached.v1` e `aura.operations.audit.completed.v1`

## Catálogo de Eventos (AsyncAPI 2.6.0)

| Evento | Publicado por | Gatilho |
|--------|--------------|---------|
| `aura.operations.health.updated.v1` | UnifiedOperationsService / ServiceHealthMonitoringService | Atualização de saúde de serviço |
| `aura.operations.incident.detected.v1` | IncidentManagementService | Abertura de incidente |
| `aura.operations.incident.resolved.v1` | IncidentManagementService | Resolução de incidente |
| `aura.operations.anomaly.detected.v1` | AiOpsIntelligenceService | Anomalia detectada |
| `aura.operations.predictive_failure.generated.v1` | PredictiveFailureAnalysisService | Previsão de falha gerada |
| `aura.operations.remediation.executed.v1` | OperationalAutomationService | Autorremediação executada |
| `aura.operations.business_impact.calculated.v1` | BusinessObservabilityService | Impacto de negócio calculado |
| `aura.operations.resilience_test.completed.v1` | ResilienceManagementService | Teste de resiliência concluído |
| `aura.operations.slo.breached.v1` | SreGovernanceService | SLO violado |
| `aura.operations.audit.completed.v1` | SreGovernanceService | Auditoria operacional registrada |

## Princípios de Governança e Segurança

- **Zero Trust Operations**: Toda ação de autorremediação exige autorização prévia e é auditada com SHA-256.
- **Chaos Engineering Controlado**: Testes de caos executados exclusivamente em ambientes homologados com isolamento de dados de produção.
- **Observabilidade Correlacionada**: Logs, Métricas e Traces integrados por janela temporal deslizante com contexto correlacionado por microsserviço.
- **LGPD & Privacidade**: Dados de beneficiários nunca transitam em telemetria operacional — apenas contadores e indicadores agregados.

## Consequências

- Estabelece a Fase VII do Projeto Aura como um **Ecossistema Autossupervisionado e Altamente Resiliente**
- A plataforma passa a ter capacidade de detectar e remediar automaticamente falhas sem intervenção humana para ações não-destrutivas
- Garante visibilidade operacional completa do ecossistema com correlação de Logs/Métricas/Traces
- Proporciona governança SRE com Error Budget e SLO tracking contínuos
- Correlaciona tecnicamente falhas de TI com impacto social e institucional do Instituto Ser Melhor
