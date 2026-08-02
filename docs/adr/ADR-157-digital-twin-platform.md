# ADR 157: Aura Digital Twin, Strategic Simulation & Organizational Modeling Platform (ADT)

## Status
Accepted / Implemented — **Fase VIII — Prompt 157**

## Contexto

Com o Centro Unificado de Operações (P156 AUOC) em plena operação e a Plataforma Aura supervisionada de forma inteligente e resiliente, a Fase VIII introduz o Digital Twin Organizacional do Instituto Ser Melhor — uma representação digital dinâmica e sincronizada da organização real, capaz de simular cenários futuros, avaliar impactos multidimensionais e apoiar decisões estratégicas baseadas em evidências *antes* de sua implementação no ambiente produtivo.

A necessidade surgiu da demanda por planejamento estratégico antecipado e validação segura de mudanças:
- Simular expansões institucionais, novos programas e redistribuição de recursos *sem risco ao ambiente produtivo*
- Comparar cenários otimistas, esperados, conservadores e críticos com métricas objetivas
- Correlacionar falhas técnicas com impactos organizacionais e sociais antes que aconteçam
- Prever demanda, crescimento e sustentabilidade financeira em horizontes de 3 a 24 meses

## Decisão

Implementar o módulo `DigitalTwinModule` em `backend/src/domain/digital-twin/` composto por **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3) e com suporte a consultas em linguagem natural (NLQ) no painel executivo.

### 1. DigitalTwinGovernanceService (Governança & Auditoria SHA-256)
- Controla modelos, premissas, parâmetros, versões e aprovações do Digital Twin
- Trilha imutável SHA-256 de todas as execuções e simulações
- Publica: `aura.digitaltwin.audit.completed.v1`

### 2. DigitalTwinCoreService (Núcleo Organizacional)
- Mantém o estado virtual completo da organização: estrutura, processos, recursos, equipes, ativos, indicadores e infraestrutura
- Sincronização contínua com o estado real dos módulos operacionais
- Publica: `aura.digitaltwin.twin.updated.v1`

### 3. StrategicScenarioModelingService (Modelagem de Cenários)
- Cria e compara cenários: OPTIMISTIC, EXPECTED, CONSERVATIVE, CRITICAL, CUSTOM
- Avalia impactos operacionais, financeiros, assistenciais e sociais por cenário
- Publica: `aura.digitaltwin.scenario.created.v1` e `aura.digitaltwin.scenario.compared.v1`

### 4. OrganizationalSimulationService (Motor de Simulações)
- Simula mudanças organizacionais sem afetar o ambiente produtivo: aumento de demanda, redução de recursos, expansão, novos programas e redistribuição de profissionais
- Gera indicadores comparativos Antes vs. Depois de cada simulação
- Publica: `aura.digitaltwin.simulation.executed.v1`

### 5. ImpactAnalysisService (Análise Multidimensional de Impacto)
- Avalia efeitos de simulações em 10 dimensões: Beneficiários, Profissionais, Voluntários, Orçamento, Infraestrutura, Indicadores, Riscos, Conformidade, Desempenho e Impacto Social
- Gera score composto e recomendação executiva por análise
- Publica: `aura.digitaltwin.impact.analysis.completed.v1`

### 6. ResourceOptimizationService (Otimização de Recursos)
- Gera alternativas de alocação de equipes, capacidade e orçamento com análise de custo-benefício
- Recomenda a alternativa com melhor equilíbrio entre impacto e investimento
- Publica: `aura.digitaltwin.resource.optimization.calculated.v1`

### 7. InstitutionalForecastService (Previsões Institucionais)
- Projeta demanda, capacidade, orçamento e beneficiários em horizontes de 3, 6, 12 e 24 meses
- Identifica riscos de saturação e oportunidades de expansão
- Publica: `aura.digitaltwin.forecast.generated.v1`

### 8. PredictiveSimulationService (Simulação Preditiva)
- Modelos com intervalos de confiança (low/mid/high) e acurácia de previsão monitorada
- Recalibração contínua comparando previsão vs. resultados reais
- Publica: `aura.digitaltwin.forecast.generated.v1`

### 9. TwinSynchronizationService (Sincronização com Módulos Operacionais)
- Sincroniza o Digital Twin com AUOC (P156), ACOP (P152), AEIDIP (P155), AIIC (P151) e AAEE (P153)
- Publica: `aura.digitaltwin.sync.completed.v1`

### 10. ExecutiveSimulationDashboardService (Painel Executivo com NLQ)
- Painel consolidado: estado atual, cenários, previsões, tendências, riscos e oportunidades
- Suporte a consultas em linguagem natural (NLQ) sobre o estado do Digital Twin
- Publica: `aura.digitaltwin.executive.simulation.generated.v1`

## Catálogo de Eventos (AsyncAPI 2.6.0)

| Evento | Publicado por |
|--------|--------------|
| `aura.digitaltwin.twin.updated.v1` | DigitalTwinCoreService |
| `aura.digitaltwin.scenario.created.v1` | StrategicScenarioModelingService |
| `aura.digitaltwin.simulation.executed.v1` | OrganizationalSimulationService |
| `aura.digitaltwin.forecast.generated.v1` | InstitutionalForecastService / PredictiveSimulationService |
| `aura.digitaltwin.impact.analysis.completed.v1` | ImpactAnalysisService |
| `aura.digitaltwin.resource.optimization.calculated.v1` | ResourceOptimizationService |
| `aura.digitaltwin.scenario.compared.v1` | StrategicScenarioModelingService |
| `aura.digitaltwin.sync.completed.v1` | TwinSynchronizationService |
| `aura.digitaltwin.executive.simulation.generated.v1` | ExecutiveSimulationDashboardService |
| `aura.digitaltwin.audit.completed.v1` | DigitalTwinGovernanceService |

## Princípios de Governança e Privacidade

- **LGPD & Privacy by Design**: Todas as simulações operam exclusivamente com dados agregados — nunca com dados pessoais nominais de beneficiários.
- **Reprodutibilidade Garantida**: Cada simulação registra parâmetros versionados na trilha SHA-256, garantindo reprodutibilidade e auditabilidade total.
- **Validação Antes da Produção**: Nenhuma mudança operacional é implementada sem validação prévia no Digital Twin.
- **Sincronização Contínua**: O Digital Twin é atualizado automaticamente com telemetria dos módulos operacionais (AUOC P156).

## Consequências

- Estabelece a **Fase VIII — Excelência Operacional e Governança Corporativa Total** do Projeto Aura
- O Instituto Ser Melhor passa a ter capacidade de testar mudanças organizacionais virtualmente, eliminando riscos de implementação às cegas
- Cria base para planejamento estratégico baseado em evidências com cenários comparáveis e reproduzíveis
- Complementa o Digital Twin de Conformidade Arquitetural existente (P148 AEAGO) com representação operacional completa
