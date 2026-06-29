# ESPECIFICAÇÃO TÉCNICA — MÓDULO DE GESTÃO DE PROFISSIONAIS, VOLUNTÁRIOS E EQUIPE TÉCNICA
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026

---

## 1. ARQUITETURA FUNCIONAL DO MÓDULO

O módulo gerencia o ciclo de vida completo dos profissionais e voluntários do Instituto. Ele atua como o **Cadastro Mestre de Recursos Humanos** e o **Motor de Autorização Clínica (ABAC/RBAC)**.

*   **Core RH:** Gestão de dados pessoais, documentos, certificados e vínculos (Voluntário, CLT, PJ).
*   **Core Clínico/Técnico:** Registro de conselho (CRP, CRM, OAB), especialidades, públicos atendidos e modalidades.
*   **Motor de Agenda:** Definição de grade de horários, bloqueios, férias e carga horária dedicada.
*   **Gestor de Permissões:** Controle rigoroso do que o profissional pode ver ou editar. (Isolamento de pacientes).
*   **Dashboard de Produtividade:** Métricas de horas doadas, pacientes atendidos e taxa de comparecimento (No-Show).

## 2. REGRAS DE NEGÓCIO COMPLETAS

1.  **Isolamento Absoluto (Segurança Clínica):** Um profissional SÓ pode acessar prontuários e dados de pacientes que lhe foram explicitamente vinculados (via Caso).
2.  **Multidisciplinaridade Segura:** Se um paciente tem um Psicólogo e um Assistente Social, ambos podem ver o Caso, mas notas restritas de psicoterapia não são visíveis ao assistente social (salvo configuração explícita e consentida).
3.  **Validade de Documentos:** Se o CRP ou documento obrigatório expirar, o sistema alerta o profissional com 30 dias de antecedência. No dia do vencimento, novos agendamentos são bloqueados até a regularização.
4.  **Carga Horária e Match:** O sistema de Triagem (Matching) só pode alocar um novo paciente a um voluntário se houver disponibilidade na sua grade semanal configurada e compatibilidade de especialidade.
5.  **Inatividade:** Profissionais inativos não podem logar no sistema. O desligamento bloqueia acessos imediatamente, mas preserva a trilha de autoria nos prontuários passados.

## 3. MODELO DE BANCO DE DADOS (PRISMA SCHEMA CONCEPT)

O modelo centraliza tudo em `Professional` (ou expande a `User`/`Volunteer` existente), conectado às tabelas auxiliares.

```prisma
model Professional {
  id                  String   @id @default(uuid())
  userId              String   @unique // Vinculo com credenciais de login
  fullName            String
  socialName          String?
  cpf                 String   @unique
  birthDate           DateTime
  gender              String?
  phone               String
  email               String   @unique
  
  // Vínculo
  bondType            String   // VOLUNTEER, EMPLOYEE, PARTNER
  status              String   // PENDING, ACTIVE, SUSPENDED, INACTIVE
  joinedAt            DateTime @default(now())
  terminatedAt        DateTime?
  
  // Dados Clínicos/Técnicos
  profession          String   // PSYCHOLOGIST, SOCIAL_WORKER, etc
  specialties         String[]
  councilNumber       String?  // CRP, CRM
  councilState        String?
  councilStatus       String?
  
  // Relacionamentos
  documents           ProfessionalDocument[]
  availabilities      Availability[]
  assignedCases       CaseVolunteer[] // Pacientes sob seus cuidados
  auditLogs           AuditLog[]
}

model ProfessionalDocument {
  id                  String   @id @default(uuid())
  professionalId      String
  type                String   // ID, DIPLOMA, COUNCIL_REGISTRY, ADDRESS
  fileUrl             String
  validUntil          DateTime?
  status              String   // PENDING, VERIFIED, REJECTED
}

model Availability {
  id                  String   @id @default(uuid())
  professionalId      String
  dayOfWeek           Int      // 0-6
  startTime           String   // HH:mm
  endTime             String   // HH:mm
  modality            String   // ONLINE, IN_PERSON, HYBRID
}
```

## 4. DIAGRAMA DE ENTIDADES E RELACIONAMENTOS (MER)

*   `User` (Auth) 1:1 `Professional`
*   `Professional` 1:N `ProfessionalDocument` (Diplomas, Docs)
*   `Professional` 1:N `Availability` (Grade de Horários)
*   `Professional` N:N `Project` (Via `VolunteerProject` - Onde atua)
*   `Professional` N:N `Case` (Via `CaseVolunteer` - Pacientes atendidos)
*   `Professional` 1:N `Appointment` (Agendamentos da Agenda)
*   `Professional` 1:N `EmrEvolution` (Evoluções registradas)

## 5. FLUXO DE AUTENTICAÇÃO

1.  Acesso à página de Login (MFA exigido para contas clínicas).
2.  Validação de credenciais via Auth Service (JWT/Session).
3.  Verificação do `status` do Profissional. Se `SUSPENDED` ou `INACTIVE`, bloqueia com mensagem de contato ao RH.
4.  Carga de Claims (Permissões RBAC e vínculos ABAC).
5.  Redirecionamento para o Dashboard do Profissional.

## 6. FLUXO DE CADASTRO (ONBOARDING)

1.  Candidato acessa landing page do Instituto e clica em "Seja Voluntário" ou RH cria perfil via Painel Admin.
2.  Preenchimento do formulário multietapas (Dados Pessoais -> Profissionais -> Especialidades -> Disponibilidade).
3.  Upload de Documentos (RG, Comprovantes, Carteira do Conselho).
4.  Submissão. O status fica como `PENDING_APPROVAL`.

## 7. FLUXO DE APROVAÇÃO

1.  Administrador / Coordenação recebe notificação de novo cadastro.
2.  Revisão dos dados e verificação de documentos anexos.
3.  Entrevista online/presencial (agendada fora ou dentro do app).
4.  Aprovação: Status muda para `ACTIVE`. Credenciais de acesso são enviadas por email.
5.  Reprovação: Status muda para `REJECTED`, email de feedback é enviado.

## 8. FLUXO DE ATENDIMENTO

1.  Profissional acessa "Meus Pacientes".
2.  Abre o Prontuário do Paciente (o sistema valida se ele pertence à equipe do caso).
3.  Inicia a Teleconsulta ou marca presença (presencial).
4.  Abre o Rascunho de Evolução (salvamento automático criptografado).
5.  Finaliza, Assina Eletronicamente e Tranca o registro.
6.  O dashboard do profissional contabiliza +1 atendimento e horas doadas.

## 9. FLUXO DE DESLIGAMENTO

1.  RH/Admin inicia o desligamento do profissional.
2.  Sistema lista todos os Casos (Pacientes) ativos com o profissional.
3.  Admin deve transferir os casos para a Fila de Triagem ou para outro profissional.
4.  Agenda futura é cancelada/remarcada.
5.  Status muda para `INACTIVE`. Acesso revogado. Assinaturas passadas são mantidas imutáveis.

## 10. MATRIZ DE PERMISSÕES (RBAC)

| Ação / Papel | Voluntário Clínico | Coordenador | RH / Admin |
| :--- | :---: | :---: | :---: |
| Editar próprio perfil | Sim | Sim | Sim |
| Ver Cadastro de Outros | Não | Sim (Sua equipe) | Sim (Todos) |
| Alterar Status (Ativar/Inativar)| Não | Não | Sim |
| Ver próprios Casos/Pacientes| Sim | Sim | Sim |
| Ver Pacientes não vinculados| Não | Não (salvo Triagem) | Não |
| Registrar Evolução | Sim | Sim | Não |
| Apagar Evolução assinada | NÃO | NÃO | NÃO |
| Ver métricas institucionais| Não | Sim (do projeto) | Sim |

## 11. WIREFRAMES (TEXTUAIS - ESTRUTURA DE TELAS)

**Tela 1: Diretório de Profissionais (Admin)**
*   Filtros: Status (Ativo, Pendente), Profissão, Projeto.
*   Tabela: Nome, Profissão, CRP/CRM, Casos Ativos, Horas, Status, [Ações].

**Tela 2: Perfil Completo do Profissional (Admin/RH)**
*   Abas: Dados Pessoais, Profissionais, Documentos, Grade/Disponibilidade, Pacientes Ativos, Indicadores.
*   Botões de Ação: Editar, Suspender, Aprovar.

**Tela 3: Dashboard do Profissional (Logado como Voluntário)**
*   Cards no topo: Próximos Atendimentos, Horas Doadas, Pacientes Ativos.
*   Lista Central: Agenda do Dia.
*   Sidebar: Meus Pacientes, Minha Agenda, Meus Documentos, Mensagens.

## 12. BACKLOG (ÉPICOS E HISTÓRIAS DE USUÁRIO)

*   **Épico 1: Gestão de Cadastro RH**
    *   *HU:* Como Admin, quero aprovar um novo voluntário verificando seus documentos, para garantir a segurança clínica.
    *   *HU:* Como Profissional, quero atualizar meus horários disponíveis, para que o Admin não agende pacientes em meus momentos offline.
*   **Épico 2: Compliance e Segurança**
    *   *HU:* Como Sistema, quero alertar o RH e o Profissional 30 dias antes do vencimento do CRP, para evitar exercício irregular.
*   **Épico 3: Isolamento Clínico e Atendimento**
    *   *HU:* Como Psicólogo, quero acessar apenas os prontuários dos pacientes alocados a mim, para garantir a LGPD e o sigilo.
*   **Épico 4: Gamificação e Retenção**
    *   *HU:* Como Voluntário, quero ver meu "Extrato de Impacto" (horas doadas), para celebrar minha contribuição social.
