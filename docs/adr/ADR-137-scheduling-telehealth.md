# ADR-137: Aura Intelligent Scheduling, Telehealth & Care Orchestration Platform (AISTCOP)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Technology Officer (CTO), Chief Clinical Information Officer (CCIO), Principal Scheduling Architect, Principal Telehealth Architect  
**Referência:** Prompt 137 (AISTCOP), P120 Technical Baseline, P135 AECMP, P136 AIEHSR

---

## Contexto

A Plataforma Aura necessita de uma camada operacional de atendimento que orquestre toda a execução assistencial: desde o agendamento de uma consulta presencial ou teleconsulta até o registro de presença que alimenta automaticamente o Prontuário Eletrônico e a Gestão de Casos. O desafio central é coordenar múltiplas modalidades de atendimento, profissionais com disponibilidades distintas e a infraestrutura de teleconsulta de forma totalmente event-driven.

## Decisão

### 1. Código Sequencial Único por Agendamento

**Decisão:** Todos os agendamentos são identificados por um código sequencial imutável no formato `AGD-YYYY-XXXXX`, garantindo rastreabilidade e referência humana sem expor UUIDs internos.

### 2. Validação de Conflito de Horário

**Decisão:** O `SchedulingService` valida sobreposição temporal para o mesmo profissional antes de criar qualquer agendamento, lançando `ConflictException` quando o intervalo `[scheduledAt, scheduledAt + durationMinutes]` colide com um agendamento existente ativo.

### 3. Smart Queue Engine com SLA de Prioridade

**Decisão:** O `SmartQueueEngine` ordena os beneficiários combinando score de risco (60%) e vulnerabilidade (40%), atribuindo automaticamente o nível de prioridade (`CRITICAL=30min`, `EMERGENCY=2h`, `URGENT=24h`, `HIGH=48h`, `ROUTINE=120h`) e o prazo de SLA correspondente.

### 4. Salas Virtuais Efêmeras com Token Temporário

**Decisão:** Cada teleconsulta recebe uma `VirtualRoom` com token base64url único, URL de acesso segura, tempo máximo de sessão configurável e log imutável de participantes (JOIN/LEAVE). A sala é encerrada automaticamente após `maxDurationMinutes`.

### 5. Notificações Multicanal Automáticas

**Decisão:** O `NotificationService` dispara automaticamente notificações (WhatsApp Business API, E-mail, Push, SMS, Portal) em todos os eventos de agendamento: criação, confirmação, cancelamento, remarcação e lembretes de 24h e 1h.

### 6. Integração Automática EHR e Gestão de Casos

**Decisão:** O `AttendanceControlService` sinaliza `ehrIntegrated = true` e `caseIntegrated = true` ao registrar o status `COMPLETED`, disparando o evento `aura.scheduling.attendance.recorded.v1` para que os módulos EHR (P136) e Case Management (P135) atualizem seus registros automaticamente.

### 7. Event-Driven Scheduling Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.scheduling.appointment.created.v1`
- `aura.scheduling.appointment.confirmed.v1`
- `aura.scheduling.appointment.cancelled.v1`
- `aura.scheduling.appointment.rescheduled.v1`
- `aura.scheduling.attendance.recorded.v1`
- `aura.scheduling.notification.sent.v1`
- `aura.telehealth.room.created.v1`
- `aura.telehealth.room.closed.v1`

## Consequências

- ✅ Coordenação operacional completa entre Agenda, Teleconsulta, EHR e Gestão de Casos.
- ✅ Zero conflitos de agenda para o mesmo profissional por validação automática.
- ✅ Filas assistenciais com SLA garantido por nível de prioridade clínica.

---

*Homologado pelo Clinical Operations Governance Board — AISTCOP Prompt 137*
