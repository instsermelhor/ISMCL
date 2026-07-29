# ADR-139: Aura Enterprise Workflow, Rules & Process Automation Platform (AEWRP)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Enterprise Architect (CEA), Chief Process Officer (CPO), Principal BPM Architect, Principal Rules Engine Architect  
**Referência:** Prompt 139 (AEWRP), P110 AEWBPM, P112 AEDIP, BPMN 2.0 OMG Spec

---

## Contexto

A Plataforma Aura necessita de uma camada de orquestração que governe todos os processos institucionais, clínicos, administrativos e sociais de forma parametrizável, sem necessidade de alteração de código-fonte. O princípio orientador é: "Nenhuma regra de negócio deverá permanecer fixa no código quando puder ser parametrizada."

## Decisão

### 1. BPMN 2.0 como Padrão de Modelagem de Processos

**Decisão:** O `WorkflowEngineService` adota BPMN 2.0 (OMG Spec) como linguagem de modelagem. Suporta: START_EVENT, END_EVENT, USER_TASK, SERVICE_TASK, GATEWAY_XOR (exclusivo), GATEWAY_AND (paralelo), GATEWAY_OR (inclusivo), INTERMEDIATE_TIMER e CALL_ACTIVITY (subprocesso reutilizável).

### 2. Roteamento Condicional Dinâmico em Gateways XOR

**Decisão:** Gateways XOR avaliam condições do tipo `"context.riskScore > 70"` em tempo de execução usando o contexto da instância. O primeiro caminho cuja condição for verdadeira é ativado. Há sempre um caminho padrão (fallback).

### 3. Rules Engine 100% Parametrizável pelo SUPER_ADMIN

**Decisão:** O `RulesEngineService` permite criação e edição de regras de negócio sem alteração de código. Regras possuem: condições AND compostas com operadores (EQUALS, GT, LT, CONTAINS, IN...), prioridade de avaliação, ação resultante (ALLOW, DENY, ROUTE, NOTIFY, CREATE_TASK, ESCALATE, EMIT_DOCUMENT...) e parâmetros configuráveis. O motor avalia todas as regras ativas por ordem de prioridade.

### 4. Decision Engine com Log de Auditoria Imutável

**Decisão:** Toda avaliação de regras gera um `DecisionResult` com: contexto de entrada, lista de regras correspondidas, ação dominante e timestamp. O log é auditável e persistido em memória (preparado para migração para banco em produção).

### 5. SLA Monitor com Detecção Automática de Vencimentos

**Decisão:** O `TaskManagementService` detecta tarefas com `dueAt` vencido e emite `aura.workflow.sla.exceeded.v1`, alterando o status para `OVERDUE`. Em produção, o monitor é disparado pelo `@Cron` do `@nestjs/schedule`.

### 6. 3 Workflows Padrão Pré-Carregados (BPMN 2.0)

**Decisão:** O bootstrap da plataforma carrega automaticamente:
- **Fluxo de Triagem e Acolhimento**: Avaliação de risco → gateway XOR → abertura de caso ou agendamento de rotina.
- **Fluxo de Atendimento Clínico**: Confirmação → sessão → prontuário → prescrição condicional.
- **Fluxo de Revisão Documental**: Gateway AND paralelo → revisão clínica + social → co-assinatura.

### 7. Event-Driven Workflow Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.workflow.started.v1`
- `aura.workflow.completed.v1`
- `aura.workflow.task.created.v1`
- `aura.workflow.task.completed.v1`
- `aura.workflow.sla.exceeded.v1`

## Consequências

- ✅ Toda regra de negócio é parametrizável pelo SUPER_ADMIN sem alteração de código.
- ✅ Processos BPMN 2.0 com gateways condicionais e paralelos em produção.
- ✅ SLA automaticamente monitorado com alertas e escalonamento automático.

---

*Homologado pelo Business Process Governance Board — AEWRP Prompt 139*
