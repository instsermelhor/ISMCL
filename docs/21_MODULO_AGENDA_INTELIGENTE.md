# ESPECIFICAÇÃO TÉCNICA — MÓDULO 03 — AGENDA INTELIGENTE E CENTRAL DE AGENDAMENTOS
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Coordenação da Operação Diária, Agendamentos, Triagem, Priorização e Recursos

---

## 1. ARQUITETURA FUNCIONAL COMPLETA

O módulo de Agenda Inteligente atua como o sistema nervoso central do Instituto Ser Melhor. Ele não é um simples calendário, mas um "Motor de Orquestração" que cruza três pilares fundamentais: **Necessidade do Beneficiário** (Fila, Triagem, Urgência), **Disponibilidade do Profissional** (Grade, Vínculo, Projetos) e **Recursos Institucionais** (Salas físicas, Salas de Teleatendimento).

**Módulos Lógicos Internos:**
*   **Motor de Match e Escalonamento:** Cruza a Fila de Espera com slots vagos, aplicando regras de prioridade social.
*   **Gestor de Frequência e Check-in:** Controla presenças, no-shows (faltas), cancelamentos e dispara lembretes (Email, SMS, WhatsApp).
*   **Gerenciador de Recursos (Resource Manager):** Evita overbooking de salas físicas e gerencia a criação/destruição de links de Teleatendimento.
*   **AI Scheduler Assistant:** Algoritmo que sugere os melhores horários, identifica conflitos e alerta sobre pacientes em risco sem agendamento futuro.

---

## 2. REGRAS DE NEGÓCIO

1.  **Conflitos e Overbooking:** É estritamente proibido o agendamento de um mesmo profissional ou recurso (ex: Sala 2) no mesmo horário. O sistema deve bloquear a transação com *Pessimistic Locking*.
2.  **Sigilo ABAC (Attribute-Based Access Control):** O Profissional só vê o nome/motivo na sua própria agenda. Na Agenda Institucional (vista por outros que não o Admin/Coordenação), o horário aparece apenas como "Ocupado".
3.  **Prioridade Social:** Vagas de cancelamento de última hora devem ser oferecidas automaticamente (por SMS/WhatsApp) primeiro para a Fila de Espera com tag `URGÊNCIA MÁXIMA` e compatibilidade de especialidade.
4.  **Limites de Carga Horária:** O sistema recusa agendamentos se o profissional exceder sua carga semanal voluntária previamente acordada, exceto sob "Override" da Coordenação.
5.  **Teleatendimento:** Todo agendamento marcado como `ONLINE` gera um identificador único de sala WebRTC imediatamente. O link expira 60 minutos após o fim previsto da sessão.
6.  **Reagendamentos e Faltas (No-Show):** Duas faltas consecutivas sem aviso rebaixam a prioridade do beneficiário na fila, exigindo uma reavaliação da Assistência Social.
7.  **Intervalo Clínico:** Todo agendamento padrão adiciona automaticamente um buffer (ex: 10 minutos) ao final para registro de evolução no prontuário, impedindo que a próxima consulta seja "colada".

---

## 3. MODELO DE BANCO DE DADOS (PRISMA SCHEMA CONCEPT)

```prisma
model Appointment {
  id                  String   @id @default(uuid())
  title               String?  // Ex: "Primeiro Atendimento - Triagem"
  type                String   // THERAPY, PSYCHIATRY, SOCIAL_WORK, TRIAGE, EVENT
  modality            String   // ONLINE, IN_PERSON, HYBRID
  
  status              String   @default("SCHEDULED") // SCHEDULED, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW
  priority            String   @default("NORMAL")    // URGENT, HIGH, NORMAL, LOW
  
  scheduledStart      DateTime
  scheduledEnd        DateTime
  
  // Relacionamentos Principais
  beneficiaryId       String?
  professionalId      String
  projectId           String?
  resourceRoomId      String?  // Para salas físicas
  
  // Teleatendimento
  meetingLink         String?  // Link gerado automaticamente
  
  // Rastreabilidade
  cancellationReason  String?
  cancelledBy         String?
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model ResourceRoom {
  id                  String   @id @default(uuid())
  name                String   // Ex: Consultório 1
  type                String   // CLINICAL, AUDITORIUM, MEETING
  isActive            Boolean  @default(true)
}

model WaitlistQueue {
  id                  String   @id @default(uuid())
  beneficiaryId       String
  requestedSpecialty  String   // Ex: PSYCHOLOGY
  priorityScore       Int      // Algoritmo de IA calcula o peso
  status              String   @default("WAITING") // WAITING, INVITED, RESOLVED
  enteredAt           DateTime @default(now())
}
```

---

## 4. DIAGRAMA DE ENTIDADES E RELACIONAMENTOS (MER)

*   **`Appointment`** é a entidade central.
*   **1:N** com `Beneficiary` (Um paciente tem várias consultas).
*   **1:N** com `Professional` (Um profissional tem várias consultas).
*   **1:N** com `Project` (Consultas vinculadas a um projeto social específico).
*   **1:N** com `ResourceRoom` (Salas possuem várias agendas alocadas).
*   **1:1** com `TelehealthSession` (Detalhes técnicos do WebRTC e Logs de conexão).
*   **1:N** com `AuditLog` (Toda mudança de status gera um log).

---

## 5. DIAGRAMA UML (MÁQUINA DE ESTADOS DO AGENDAMENTO)

```
[DRAFT] --> [SCHEDULED] (Dispara Lembrete -72h)
[SCHEDULED] --> [CONFIRMED] (Check-in via WhatsApp/Email do paciente)
[SCHEDULED] --> [CANCELLED] (Libera vaga para Fila de Espera)
[CONFIRMED] --> [COMPLETED] (Sessão finalizada e Evolução salva)
[CONFIRMED] --> [NO_SHOW] (Paciente não compareceu)
```

---

## 6. FLUXOS DE NAVEGAÇÃO

1. **Dashboard Institucional:** Agenda Geral (Visão Master) -> Filtros (Por Profissional, Sala, Projeto) -> Click no Slot (Abre Modal de Detalhes).
2. **Dashboard do Profissional:** Minha Agenda (Timeline do Dia) -> Botão Iniciar Sessão (Abre Teleatendimento + Prontuário em Split-screen).
3. **Fila de Espera:** Lista de Espera ranqueada por Inteligência Artificial -> Botão "Alocar Vaga" -> Sugestão Automática de Match -> Confirmação.

---

## 7. FLUXOS FUNCIONAIS DETALHADOS

### 7.1. Fluxo de Agendamento
Admin/Coordenação clica num Slot Vago -> Seleciona Beneficiário -> Sistema checa conflitos e carga horária -> Confirma tipo (Online/Presencial) -> Salva -> Gera Link (se Online) -> Dispara notificação de confirmação.

### 7.2. Fluxo de Confirmação (Check-in)
24h antes da consulta, o sistema via API do WhatsApp dispara: "Olá [Nome], confirmamos sua consulta amanhã às 14h? Responda 1 para SIM, 2 para CANCELAR". Se 1: Status = `CONFIRMED`.

### 7.3. Fluxo de Reagendamento
Beneficiário solicita (ou profissional muda na interface) -> O antigo Appointment muda para `CANCELLED` (motivo: Reagendado) -> Novo Appointment é criado -> Auditoria vincula os dois IDs.

### 7.4. Fluxo de Cancelamento
Appointment muda para `CANCELLED` -> AI Scheduler identifica a lacuna -> Busca na `WaitlistQueue` o perfil compatível de maior `priorityScore` -> Envia SMS automático de "Vaga de Encaixe" para o top 1 da fila.

---

## 8. WIREFRAMES E PROTÓTIPOS (TEXTUAIS)

**Tela 1: Central de Agendamentos (Admin)**
*   **View:** Calendário robusto estilo FullCalendar. Alternância entre visão Mensal/Semanal/Diária.
*   **Sidebar Esquerda:** Minicalendário e Filtros Dinâmicos (Checkboxes: 🟢 Psicologia, 🔵 Serviço Social, 🟡 Eventos). Filtro por Sala e Profissional.
*   **Interação:** Drag & Drop de eventos. Ao soltar, valida regra de negócio de conflito.

**Tela 2: Dashboard do Profissional (Minha Agenda)**
*   **View:** Timeline diária vertical (estilo agenda de consultório).
*   **Cards de Consulta:** Mostram o horário, foto do beneficiário, badge de status (CONFIRMADO, AGUARDANDO) e tipo (Presencial/Online).
*   **Ação:** Botão verde grande "Acessar Sala" que unifica a visão de vídeo e o prontuário ao lado.

**Tela 3: Gestão de Fila de Espera Inteligente**
*   **View:** Tabela Kanban/Lista priorizada.
*   **Colunas:** Beneficiário, Especialidade Requerida, Score de Urgência (IA), Tempo de Espera.
*   **Ação:** Botão mágico (Ícone de varinha de IA) "Encontrar Vaga" -> Abre modal sugerindo os 3 melhores horários cruzando a grade de voluntários.

---

## 9. BACKLOG DE DESENVOLVIMENTO (ÉPICOS E FEATURES)

### ÉPICO 1: Motor Principal da Agenda
*   **Feature 1:** CRUD de Agendamentos com validação Preditiva (Bloqueio de Overbooking).
*   **Feature 2:** Componente de Calendário Front-end Interativo (Drag & Drop, Redimensionamento).
*   **Feature 3:** Gestor de Recursos (Cadastro e vinculação de Salas Físicas).

### ÉPICO 2: Inteligência e Fila de Espera
*   **Feature 4:** Algoritmo de Priorização (Cálculo de `priorityScore` baseado em urgência e tempo).
*   **Feature 5:** Match Fila-Vaga (Sugestão de ocupação de buracos gerados por cancelamento).

### ÉPICO 3: Notificações e Confirmações
*   **Feature 6:** CronJob de Lembretes (Disparo 24h e 2h antes).
*   **Feature 7:** Endpoint de Webhook para recepção do Check-in (Integração WhatsApp/SMS).

---

## 10. PLANO DE TESTES

1.  **Testes Funcionais (E2E):** Tentar agendar dois pacientes para o mesmo médico no mesmo segundo (Testar Pessimistic Locking). Garantir falha graciosa.
2.  **Testes de Integração:** Verificar se o agendamento de uma consulta ONLINE realmente cria o payload correto na tabela do Teleatendimento e se o link expira corretamente.
3.  **Testes de Carga:** Simular 50 profissionais logados atualizando a agenda simultaneamente; o WebSockets/Polling da UI deve refletir o estado sem timeout do banco.
4.  **Testes de Segurança:** Logar como Profissional A e tentar (via manipulação de URL) ler a agenda do Profissional B. A camada de Guarda (RBAC/ABAC) deve devolver `403 Forbidden`.
5.  **Testes de Usabilidade:** Garantir que o Drag & Drop funciona com precisão em telas touch (tablets), muito usados em clínicas sociais.

---
**Status:** Documentação validada. Aguardando comando para iniciar a implementação da interface React (Frontend) e Rotas/Serviços (Backend) associados ao Módulo de Agenda Inteligente.
