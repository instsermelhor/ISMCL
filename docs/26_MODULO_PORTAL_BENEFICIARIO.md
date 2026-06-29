# Módulo 09 — Portal do Beneficiário
## Especificação Técnica Completa — Instituto Ser Melhor — Projeto Aura

---

## 1. Visão Geral

O **Portal do Beneficiário** é a interface digital primária entre o Instituto Ser Melhor e seus beneficiários, responsáveis legais e famílias. Concebido como uma **plataforma de relacionamento contínuo**, vai além de um simples canal de consultas: é o ponto de convergência de todos os serviços digitais prestados pelo Instituto.

### 1.1 Princípios Norteadores

| Princípio | Descrição |
|---|---|
| **Segurança** | Integração total com o MCSI — dados mascarados, sessões protegidas, auditoria completa |
| **Acessibilidade** | WCAG 2.1 AA, leitor de tela, alto contraste, ajuste de fonte, navegação por teclado |
| **Acolhimento** | Design cálido, linguagem simples, sem jargão técnico ou clínico |
| **Privacidade** | Dados mínimos necessários; prontuário clínico nunca exposto automaticamente |
| **Extensibilidade** | Arquitetura preparada para futuras funcionalidades sem alterações estruturais |

---

## 2. Perfis de Acesso

```
┌─────────────────────────────────────────────────────┐
│                  PORTAL DO BENEFICIÁRIO             │
├─────────────────────────────────────────────────────┤
│  BENEFICIARY        → Beneficiário maior de idade   │
│  PARENT_FATHER      → Pai                           │
│  PARENT_MOTHER      → Mãe                           │
│  LEGAL_GUARDIAN     → Tutor / Responsável Legal     │
│  JUDICIAL_GUARDIAN  → Guardião Judicial             │
│  FOSTER_FAMILY      → Família Acolhedora            │
│  LEGAL_REP          → Representante Legal           │
└─────────────────────────────────────────────────────┘
```

### 2.1 Matriz de Permissões por Perfil

| Funcionalidade | Beneficiário | Pai/Mãe | Resp. Legal | Guardião Judicial | Família Acolhedora |
|---|:---:|:---:|:---:|:---:|:---:|
| Visualizar agenda | ✅ | ✅ | ✅ | ✅ | ✅ (restrito) |
| Confirmar consulta | ✅ | ✅ | ✅ | ✅ | ❌ |
| Reagendar/cancelar | ✅ | ✅ | ✅ | ✅ | ❌ |
| Entrar em teleconsulta | ✅ | ✅ | ✅ | ❌ | ❌ |
| Download documentos | ✅ | ✅ | ✅ | ✅ | ❌ |
| Enviar mensagens | ✅ | ✅ | ✅ | ❌ | ❌ |
| Abrir solicitações | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver PIC | ✅* | ✅* | ✅* | ✅* | ❌ |
| Ver projetos | ✅ | ✅ | ✅ | ✅ | ✅ |
| Usar assistente | ✅ | ✅ | ✅ | ✅ | ✅ |

*Somente se autorizado pelos profissionais

---

## 3. Arquitetura Funcional

```
┌──────────────────────────────────────────────────────────────────┐
│                    PORTAL DO BENEFICIÁRIO                        │
│  React SPA + BeneficiaryPortalContext                            │
├─────────┬───────────┬──────────┬──────────┬──────────┬──────────┤
│  Home   │  Agenda   │  Docs    │  Mensag. │ Solic.   │ Projetos │
│  Panel  │  Panel    │  Panel   │  Panel   │ Panel    │  Panel   │
├─────────┴───────────┴──────────┴──────────┴──────────┴──────────┤
│         PIC Panel        │     Assistente Virtual Panel         │
├──────────────────────────┴──────────────────────────────────────┤
│                   BeneficiaryPortalContext                       │
│  (State Management + Mock Data + Business Rules)                 │
├─────────────────────────────────────────────────────────────────┤
│                    INTEGRAÇÃO COM MÓDULOS                        │
│  AuthContext │ SecurityContext (MCSI) │ Agenda │ Prontuário     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 Diagrama C4 — Contexto

```
[Beneficiário/Família] ─── HTTPS ──► [Portal Beneficiário] ─┬─► [Módulo Agenda]
                                                              ├─► [Módulo Prontuário]
                                                              ├─► [Módulo Teleconsulta]
                                                              ├─► [MCSI - Segurança]
                                                              ├─► [Sistema de Notificações]
                                                              └─► [Gestão de Casos]
```

---

## 4. Modelo de Dados

### 4.1 Entidades Principais

```typescript
// Beneficiário no Portal
PortalBeneficiary {
  id: UUID
  name: string
  cpf: string (mascarado)
  birthDate: string
  profileType: BeneficiaryProfileType
  isProtected: boolean
  sensitivityLevel: 0|1|2|3|4
  linkedBeneficiaries: LinkedBeneficiary[]
  programs: string[]
}

// Consulta
PortalAppointment {
  id: UUID
  date: string
  time: string
  professional: string
  specialty: string
  type: PRESENCIAL|TELECONSULTA|DOMICILIAR|GRUPO
  status: CONFIRMED|PENDING|CANCELLED|COMPLETED|RESCHEDULING
  teleconsultUrl?: string
  canConfirm: boolean
  canCancel: boolean
  canReschedule: boolean
}

// Documento
PortalDocument {
  id: UUID
  title: string
  type: DocumentType
  issuedBy: string
  issuedAt: string
  isAuthorized: boolean  // Controlado pelo profissional
  validationCode?: string
}

// Mensagem Segura
PortalMessage {
  id: UUID
  from: string
  fromRole: string
  subject: string
  body: string
  sentAt: ISO8601
  status: READ|UNREAD
  canReply: boolean
}

// Notificação
PortalNotification {
  id: UUID
  type: AGENDA|DOCUMENTO|MENSAGEM|PROJETO|CAMPANHA|CADASTRO|SISTEMA
  title: string
  body: string
  createdAt: ISO8601
  isRead: boolean
  actionRoute?: string
}

// Plano Individual de Cuidado
IndividualCarePlan {
  id: UUID
  beneficiaryName: string
  startDate: string
  reviewDate: string
  isAuthorized: boolean  // Controlado pelo profissional
  objectives: string[]
  orientations: string[]
  goals: CareGoal[]
}
```

---

## 5. Fluxos de Navegação

### 5.1 Fluxo de Acesso ao Portal

```
Login (CPF/E-mail + Senha + MFA)
        │
        ▼
Validação MCSI
        │
        ├─ isProtected? ──► Aplicar Restrições de Nível 3-4
        │
        └─ Perfil detectado ──► Renderizar permissões corretas
                │
                ▼
        Dashboard Personalizado
        ├── Home (resumo)
        ├── Agenda
        ├── Documentos
        ├── Mensagens
        ├── Solicitações
        ├── Projetos
        ├── PIC (se autorizado)
        └── Assistente Virtual
```

### 5.2 Fluxo de Teleconsulta

```
[Agenda] ─► Ver consulta tipo TELECONSULTA
        │
        ├── status != CONFIRMED ──► Confirmar primeiro
        │
        └── status = CONFIRMED ──► [Botão "Entrar"]
                │
                ▼
        Teste de câmera/microfone
                │
                ▼
        Sala virtual (/telehealth/:id)
                │
                ├── Chat durante atendimento
                ├── Documentos compartilhados pelo profissional
                ├── Registro de presença automático
                └── Encerramento seguro → Redirecionamento ao Portal
```

### 5.3 Fluxo de Documentos

```
[Documentos]
        │
        ├── isAuthorized = true ──► Visualizar + Download + Código de validação
        │
        └── isAuthorized = false ──► Exibir doc com indicação "Restrito"
                                     Não permite acesso ao conteúdo
                                     Registro de tentativa em auditoria
```

### 5.4 Fluxo Beneficiário Protegido

```
Detecção sensitivityLevel >= 3
        │
        ▼
Aplicar automaticamente:
├── Mascaramento de CPF/dados pessoais
├── Sessões reduzidas (timeout menor)
├── Restrição de downloads
├── Auditoria ampliada (todos os acessos logados)
├── Proibição de compartilhamento
└── Alertas ao MCSI
```

---

## 6. Componentes Implementados

### 6.1 Estrutura de Arquivos

```
src/
├── contexts/
│   └── BeneficiaryPortalContext.tsx   ← State + Mock Data + Business Logic
├── pages/
│   └── BeneficiaryPortal.tsx          ← UI Completa (Portal)
```

### 6.2 Seções do Portal

| Seção | Componente | Funcionalidades |
|---|---|---|
| **Home** | `HomePanel` | Boas-vindas, métricas rápidas, próxima consulta, notificações, docs recentes, projetos |
| **Agenda** | `AgendaPanel` | Filtro próximos/histórico, confirmar/reagendar/cancelar, botão teleconsulta |
| **Documentos** | `DocumentsPanel` | Busca, filtro por tipo, visualizar, download, código de validação |
| **Mensagens** | `MessagesPanel` | Lista, leitura, resposta, composição |
| **Solicitações** | `RequestsPanel` | Lista, status, nova solicitação com categorias |
| **Projetos** | `ProjectsPanel` | Progresso, próximas atividades, frequência |
| **PIC** | `CarePlanPanel` | Objetivos, orientações, metas com status |
| **Assistente** | `AssistantPanel` | Chat contextual com respostas inteligentes |

---

## 7. Integração com MCSI

### 7.1 Regras de Segurança Aplicadas

| Regra | Implementação |
|---|---|
| Mascaramento de CPF | CPF sempre exibido mascarado: `***.***.***-XX` |
| Controle de documentos | `isAuthorized: boolean` — somente docs aprovados pelo profissional |
| PIC autorizado | `isAuthorized: boolean` — somente se liberado pelo profissional |
| Beneficiário protegido | `isProtected + sensitivityLevel` → restrições automáticas |
| Auditoria de acessos | Todo download/visualização deve ser registrado |
| Sessões protegidas | Timeout automático + MFA integrado |

---

## 8. Acessibilidade

### 8.1 Funcionalidades Implementadas

| Recurso | Status |
|---|---|
| Modo escuro | ✅ Implementado (toggle no portal) |
| Modo claro | ✅ Padrão |
| Ajuste de fonte | ✅ Normal / Grande / Extra Grande |
| Alto contraste | ✅ Implementado (CSS `contrast-150`) |
| Linguagem simples | ✅ Textos revisados sem jargão técnico |
| Responsividade | ✅ Layout adaptativo mobile/desktop |
| Navegação por teclado | ✅ Todos os elementos são focáveis |

---

## 9. Assistente Virtual

### 9.1 Escopo Permitido

✅ Responder dúvidas sobre uso do portal
✅ Informar horários e agendamentos
✅ Orientar sobre envio de documentos
✅ Explicar procedimentos administrativos
✅ Encaminhar para atendimento humano

### 9.2 Escopo Proibido

❌ Fornecer diagnósticos
❌ Interpretar exames ou prescrições
❌ Tomar decisões clínicas
❌ Substituir orientações dos profissionais
❌ Acessar dados de outros beneficiários

---

## 10. Notificações

### 10.1 Canais

| Canal | Configuração |
|---|---|
| **In-app** | Sempre ativo — painel de notificações no portal |
| **E-mail** | Configurável pelo beneficiário |
| **WhatsApp Business** | Somente com autorização explícita do beneficiário |
| **SMS** | Somente quando configurado pelo Instituto |

### 10.2 Tipos de Notificações

| Tipo | Ícone | Gatilho |
|---|---|---|
| AGENDA | Calendar | Agendamento, alteração, lembrete 24h |
| DOCUMENTO | FileText | Novo documento autorizado |
| MENSAGEM | MessageCircle | Nova mensagem recebida |
| PROJETO | Star | Nova atividade, atualização |
| CAMPANHA | Zap | Campanhas institucionais |
| CADASTRO | User | Atualização cadastral confirmada |
| SISTEMA | Shield | Alertas de segurança e sistema |

---

## 11. Extensibilidade Futura

O portal foi projetado para incorporar sem alterações estruturais:

- [ ] Biblioteca de conteúdos educativos
- [ ] Trilhas de psicoeducação e cursos
- [ ] Formulários eletrônicos dinâmicos
- [ ] Programas de prevenção
- [ ] Pesquisas de satisfação (NPS)
- [ ] Acompanhamento de indicadores pessoais
- [ ] App móvel nativo (Android e iOS) — mesma API
- [ ] Carteira digital institucional
- [ ] Assinatura eletrônica de termos (ICP-Brasil)
- [ ] Integração com novos serviços digitais

---

## 12. Plano de Testes

### 12.1 Testes Funcionais

- [ ] Login com CPF/email/senha
- [ ] MFA obrigatório
- [ ] Visualização de agenda por status
- [ ] Confirmar/reagendar/cancelar consulta
- [ ] Ingresso em teleconsulta
- [ ] Download de documento autorizado
- [ ] Bloqueio de documento não autorizado
- [ ] Envio de mensagem
- [ ] Abertura de solicitação
- [ ] Visualização do PIC autorizado
- [ ] Bloqueio do PIC não autorizado
- [ ] Assistente: resposta contextual
- [ ] Notificações: marcar como lida

### 12.2 Testes de Segurança

- [ ] Bloqueio após 5 tentativas de login
- [ ] Timeout de sessão automático
- [ ] Mascaramento de dados sensíveis
- [ ] Restrições de beneficiário protegido
- [ ] Auditoria de todos os acessos a documentos

### 12.3 Testes de Acessibilidade

- [ ] WCAG 2.1 AA com axe-core
- [ ] Navegação completa por teclado
- [ ] Leitura com NVDA/VoiceOver
- [ ] Alto contraste
- [ ] Ajuste de fonte (até 200%)

### 12.4 Testes de Usabilidade

- [ ] Teste com usuários de baixa familiaridade digital
- [ ] Tempo médio para encontrar funcionalidade < 3 cliques
- [ ] Clareza dos textos de erro e orientação

---

## 13. Rota e Acesso

- **URL do Portal**: `/portal-beneficiario`
- **Menu**: Administração → Portal Beneficiário (ícone: 😊)
- **Contexto**: `BeneficiaryPortalProvider` (auto-contido)
- **Autenticação**: Protegida por `ProtectedRoute` (herdado)

---

*Documento técnico — Instituto Ser Melhor — Projeto Aura — Módulo 09*
*Versão 1.0 — Junho 2026*
