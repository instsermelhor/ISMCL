# ADR-147: Aura Enterprise Integration Platform, API Management & Interoperability Hub (AEIP)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Integration Officer (CIO), Chief Enterprise Architect (CEA), Principal Integration Architect, Principal API Architect  
**Referência:** Prompt 147 (AEIP), P109 AEIP, LGPD, MCSI, Zero Trust

---

## Contexto

O Instituto Ser Melhor requer uma plataforma corporativa aberta de integração, interoperabilidade e gerenciamento de APIs (APIM), permitindo a comunicação desacoplada entre sistemas internos e externos (Governo, Bancos, Provedores de IA, Storage Cloud e Plataformas de Comunicação).

## Decisão

### 1. Hub Central de Integração & Protocol Mediation

**Decisão:** O `IntegrationHubService` centraliza todas as comunicações, eliminando acoplamentos diretos ponto-a-ponto entre microsserviços e garantindo mediação de protocolos (REST, GraphQL, gRPC, WebSocket).

### 2. Connector Framework & Governança de Homologação

**Decisão:** Conectores corporativos possuem ciclo de vida formal. Todo novo conector instalado inicia em status `HOMOLOGATING`, sendo exigida aprovação formal de governança (`SUPER_ADMIN`) antes de transicionar para `ACTIVE` em Produção.

### 3. API Management Platform (APIM)

**Decisão:** O `ApiWebhookManagementService` controla a publicação de APIs (`API-2026-XXXXX`), impondo cotas diárias de requisições (`dailyQuota`) e limitações de taxa por segundo (`rateLimitPerSec`).

### 4. Webhook Platform com HMAC SHA-256

**Decisão:** Todos os webhooks registrados disparam eventos com payloads assinados criptograficamente via HMAC SHA-256, garantindo autenticidade e proteção contra injeção e adulteração de payloads.

### 5. Data Synchronization Engine

**Decisão:** Sincronizações de dados entre a Plataforma Aura e parceiros externos suportam 3 modos: `REALTIME` (Streaming), `BATCH` (Lotes Agendados) e `INCREMENTAL` (Deltas).

### 6. Event-Driven Integration Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.integration.api.published.v1`
- `aura.integration.connector.installed.v1`
- `aura.integration.connector.approved.v1`
- `aura.integration.sync.completed.v1`
- `aura.integration.webhook.registered.v1`

## Consequências

- ✅ Eliminação de dependências diretas entre microsserviços internos e APIs de parceiros externos.
- ✅ Homologação técnica e de segurança obrigatória para 100% dos conectores antes da entrada em Produção.
- ✅ Garantia de integridade e não-repúdio em todos os Webhooks e trocas de dados.

---

*Homologado pelo Integration & Architecture Governance Board — AEIP Prompt 147*
