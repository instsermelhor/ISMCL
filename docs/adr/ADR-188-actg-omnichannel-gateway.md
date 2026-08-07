# ADR-188: ACTG — Aura Communication & Teleattendance Gateway

**Status:** ACEITO  
**Data:** 2026-08-07  
**Autores:** Chief Enterprise Architect, CTO, CISO, CPO, Principal Full Stack & Integration Architect, Principal API Architect, Especialista em Omnichannel  
**Referência:** Prompt 188 (ACTG Omnichannel), ADR-137 (AISTCOP), ADR-131 (Foundation), ADR-147 (Enterprise Integration)

---

## Contexto

O Projeto Aura necessitava de uma camada de orquestração omnichannel que permitisse que consultas, acolhimentos, acompanhamentos e demais atendimentos pudessem ocorrer por múltiplos canais (WhatsApp Business Platform, Google Meet, Microsoft Teams e futuros provedores), sem que esses canais se tornassem sistemas paralelos de gestão. O desafio central era: a pessoa assistida não deve precisar entender qual tecnologia está por trás do atendimento — ela agenda no Aura, recebe a comunicação pelo canal disponível e acessa a consulta pelo meio mais adequado.

O ADR-137 (AISTCOP) já havia estabelecido o ciclo de vida de agendamentos e teleconsulta WebRTC nativa. O ADR-188 expande essa base sem substituí-la, adicionando abstração de múltiplos provedores externos.

## Decisão

### 1. Aura como Único System of Record (Princípio Fundamental)

**Decisão:** O Aura Appointment ID (AGD-YYYY-XXXXX) é a fonte universal da verdade para todos os atendimentos. Nenhum provedor externo (WhatsApp, Google Meet, Teams) pode se tornar o sistema primário de agenda, cadastro, prontuário, gestão de casos, permissões ou auditoria. Provedores externos são **canais de execução**, nunca sistemas de registro.

### 2. Camada ACTG com Interface Canônica de Provedor

**Decisão:** Criar o módulo `ActgModule` com a interface `ICommunicationProvider` que abstrai todos os provedores. Cada conector implementa: `createSession`, `updateSession`, `cancelSession`, `checkHealth`, `sendNotification` (opcional), `processWebhook` (opcional). Novos provedores são adicionados implementando a interface — sem alterar o `ACTGGatewayService` (Open/Closed Principle).

### 3. Provedores Iniciais com APIs Oficialmente Suportadas

**Decisão:** Implementar três conectores baseados exclusivamente em APIs oficiais:
- **WhatsApp Business Platform (Meta Cloud API v19.0):** Canal de notificação e envio de links. A API oficial não suporta criação programática de videochamadas entre conta empresarial e usuário — o WhatsApp funciona como canal de notificação e envio de link de acesso ao provedor de vídeo.
- **Google Meet (Google Calendar API v3 com `conferenceData`):** Criação, atualização e cancelamento de reuniões com link Meet gerado automaticamente.
- **Microsoft Teams (Microsoft Graph API `/onlineMeetings`):** Criação, atualização e cancelamento via OAuth 2.0 Client Credentials Flow.

### 4. Idempotência Universal

**Decisão:** Toda criação de `ExternalMeeting` usa `idempotencyKey` único (`actg:{appointmentId}:{channelType}:{uuid}`), armazenado com constraint `@unique` no banco. Toda notificação usa `idempotencyKey` composta (`{recipientId}:{appointmentId}:{eventType}:{channel}`) para prevenir duplicidade mesmo em retentativas.

### 5. Fallback Inteligente com Respeito ao MCSI

**Decisão:** O `FallbackEngineService` seleciona canais alternativos respeitando: (a) preferência do beneficiário, (b) disponibilidade via `ProviderHealthService`, (c) política institucional, (d) **classificação MCSI do caso — níveis 3 e 4 nunca têm canal alterado automaticamente**. A regra MCSI é inviolável: atendimentos de alto risco requerem decisão institucional explícita para mudança de canal.

### 6. Segregação de Conteúdo por Nível MCSI

**Decisão:** Mensagens enviadas por canais externos (WhatsApp, e-mail) nunca incluirão classificação clínica, diagnóstico, CID, especialidade sensível ou qualquer dado que possa identificar a natureza do atendimento. Templates são selecionados por `mcsiMaxLevel`: templates `_NEUTRAL` para MCSI ≥ 2, templates `_STANDARD` para MCSI 0-1. Exemplo proibido: "Sua consulta sobre violência doméstica foi marcada." Exemplo correto: "Seu atendimento no Projeto Aura foi agendado."

### 7. Credenciais Exclusivamente no Backend/Vault

**Decisão:** Todas as credenciais de provedores (WHATSAPP_ACCESS_TOKEN, GOOGLE_SERVICE_ACCOUNT_TOKEN, TEAMS_CLIENT_SECRET) são gerenciadas via HashiCorp Vault ou AWS Secrets Manager, acessadas somente pelo backend via `ConfigService`. Nenhuma credencial é exposta no frontend, em repositórios ou em variáveis não-vaultadas em produção.

### 8. Modelo de Dados — 10 Novas Entidades ACTG

**Decisão:** Adicionar ao schema Prisma: `CommunicationProvider`, `CommunicationAccount`, `AppointmentChannel` (1:1 com `Appointment`), `ExternalMeeting`, `CommunicationEvent`, `WebhookEvent`, `NotificationLog`, `CommunicationPreference`, `ProviderHealthStatus`, `CommunicationTemplate`. O `Appointment` recebe `channelType` e relação `appointmentChannel`.

### 9. CloudEvents para Rastreabilidade Completa

**Decisão:** Novos eventos publicados via `EventBusService`:
- `aura.actg.session.created.v1`
- `aura.actg.session.updated.v1`
- `aura.actg.session.cancelled.v1`
- `aura.actg.session.completed.v1`
- `aura.actg.notification.sent.v1`
- `aura.actg.webhook.processed.v1`
- `aura.actg.provider.degraded.v1`
- `aura.actg.fallback.triggered.v1`

### 10. One-Click Join com Verificação de Autorização

**Decisão:** A URL de acesso ao atendimento (`joinUrl`) é revelada somente após verificação de autorização no backend. O frontend nunca armazena ou exibe a URL bruta antes da verificação. O componente `OneClickJoin` exibe apenas o botão "Entrar no Atendimento" e busca a URL segura do endpoint `/api/v1/actg/appointments/{id}/join-url` com autenticação JWT.

### 11. Arquitetura Extensível para Futuros Provedores

**Decisão:** Zoom, Webex e Jitsi são suportados como extensões futuras via `ProviderRegistryService.register()`. A adição de um novo provedor requer apenas: (1) implementar `ICommunicationProvider`, (2) registrar no `ProviderRegistryService`, (3) adicionar `ChannelType` ao enum. Sem alteração do `ACTGGatewayService`.

## Consequências

- ✅ Aura permanece como único System of Record — zero agendas paralelas em provedores externos.
- ✅ A pessoa assistida experimenta um único botão "Entrar no Atendimento" — tecnologia invisível.
- ✅ Provedores externos são plugáveis sem reescrita do orquestrador.
- ✅ Fallback inteligente nunca compromete atendimentos MCSI nível 3-4 sem aprovação.
- ✅ Idempotência universal previne duplicidade de sessões e notificações.
- ✅ Toda comunicação externa respeita privacidade e LGPD — sem dados clínicos em canais externos.
- ✅ CloudEvents garantem rastreabilidade e auditoria completa do ciclo de vida.
- ⚠️ Credenciais reais de provedores requerem configuração no Vault antes da ativação em produção.
- ⚠️ WhatsApp Business Platform não suporta videochamada programática — canal de notificação apenas.

---

*Homologado pelo Enterprise Architecture Governance Board — ACTG Prompt 188*
*Certificação: Aura Omnichannel Care Platform — Camada Assistencial Agnóstica de Plataforma*
