# Plano de Implementação — Integração de Prontuários, Agenda e Escalas

Este plano descreve as etapas para realizar a integração total entre os módulos da plataforma (Prontuário Clínico, Casos Kanban, Agenda Centralizada e Escalas de Profissionais) utilizando o `localStorage` como barramento de dados unificado.

## Ações Propostas

### 1. Persistência de Casos no Kanban (`Records.tsx`)
- Criar a chave `clinical_cases_list` no `localStorage`.
- Carregar os casos do `localStorage` no estado inicial, usando os dados mock como seed.
- Atualizar a lista de profissionais no modal de designação para ler dinamicamente de `professionals_list`.
- Corrigir o redirecionamento de prontuário substituindo o ID fixo `/patients/1` pelo ID real do paciente do caso (`/patients/${case.patientId}`).

### 2. Integração da Agenda com Disponibilidade dos Profissionais (`ProfessionalProfile.tsx` e `Calendar.tsx`)
- Ler os horários definidos pelo profissional no `ProfessionalProfile.tsx` (salvos sob `professional_details_[id]`) e disponibilizá-los dinamicamente no seletor de horários de `Calendar.tsx`.
- Permitir que a agenda no `Calendar.tsx` utilize datas dinâmicas em vez da data fixa estática `'2026-06-28'`.

### 3. Exibição Reativa de Consultas no Prontuário (`PatientRecord.tsx`)
- Atualizar a aba "Agenda & Consultas" do prontuário do paciente (`PatientRecord.tsx`) para ler e filtrar os agendamentos da chave `appointments_list` pelo ID do paciente.
- Adicionar a criação de evolução clínica a partir de consultas realizadas.

---

## Modificações por Arquivo

- **`src/pages/Records.tsx`**: Persistir casos, ler profissionais dinamicamente, corrigir rotas.
- **`src/pages/Calendar.tsx`**: Tornar data dinâmica e ler disponibilidade de `professional_details_[id]`.
- **`src/pages/PatientRecord.tsx`**: Renderizar agendamentos reais em tempo real filtrados por paciente de `appointments_list`.

---

## Plano de Verificação

- **TypeScript**: Executar `npx tsc --noEmit` para garantir conformidade de tipos.
- **Build**: Executar `npm run build` para validar o empacotamento completo.
