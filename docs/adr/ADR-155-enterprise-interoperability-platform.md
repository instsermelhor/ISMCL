# ADR 155: Aura Enterprise Interoperability, Digital Ecosystem & Institutional Integration Platform (AEIDIP)

## Status
Accepted / Implemented — **Fase VI — Prompt 155**

## Contexto

Após a consolidação da orquestração cognitiva (P152 ACOP) e do motor de evolução autônoma (P153 AAEE), a Plataforma Aura exigia uma camada corporativa de interoperabilidade para permitir a integração segura, padronizada e auditável com órgãos públicos (SUS, e-SUS, RNDS, SUAS, CadÚnico, Gov.br), parceiros institucionais, tribunais de justiça, instituições de ensino, soluções de assinatura eletrônica (ICP-Brasil) e sistemas terceiros.

A solução necessitava de:
- Autenticação e autorização unificadas via API Gateway (OAuth2/OIDC/mTLS/JWT, rate limiting, quotas)
- Gestão de consentimentos alinhada estritamente à LGPD com revogação e auditoria imutável
- Suporte multi-protocolo (REST OpenAPI, GraphQL, gRPC, Webhooks, Event-Driven Messaging/Kafka)
- Resiliência corporativa com Circuit Breaker, Retry exponencial, Dead-Letter Queue (DLQ) e idempotência
- Conectores parametrizáveis para ecossistemas públicos e privados
- Governança automatizada e trilha imutável de auditoria externa com hashing SHA-256

## Decisão

Implementar o módulo `EnterpriseInteroperabilityModule` composto por **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3) e com documentação completa em OpenAPI e AsyncAPI 2.6.0.

### 1. EnterpriseIntegrationService (Orquestrador End-to-End)
- Orquestração central de fluxos de integração com parceiros externos
- Resiliência integrada: Circuit Breaker (CLOSED, OPEN, HALF_OPEN), Retry exponencial, DLQ, Idempotência
- Publica: `aura.interoperability.integration.created.v1` e `aura.interoperability.integration.updated.v1`

### 2. ApiGatewayManagementService (API Gateway Corporativo)
- Gestão de autenticação (OAuth2/OIDC/mTLS/JWT), autorização (RBAC/ABAC), rate-limiting, cota mensal por parceiro, versionamento de APIs
- Publica: `aura.interoperability.integration.validated.v1`

### 3. ExternalConnectorService (Conectores Especializados)
- Conectores parametrizáveis para: SUS/RNDS (FHIR HL7 R4), e-SUS, SUAS/CadÚnico, Gov.br SSO, ICP-Brasil, Open Banking, Armazenamento Documental S3
- Publica: `aura.interoperability.connection.established.v1`

### 4. InteroperabilityHubService (Hub Multi-Protocolo)
- Mediação, tradução e normalização de mensagens entre REST, GraphQL, gRPC, Webhooks e Kafka

### 5. ConsentManagementService (Gestão de Consentimento LGPD)
- Registro, revogação, escopo, finalidade, validade e validação prévia mandatória antes de qualquer transferência de dados pessoais
- Publica: `aura.interoperability.consent.granted.v1` e `aura.interoperability.consent.revoked.v1`

### 6. DataExchangeService (Intercâmbio Seguro de Dados)
- Execução de transações com criptografia em trânsito (TLS 1.3/mTLS) e repouso (AES-256), verificação de assinatura digital
- Publica: `aura.interoperability.data_exchange.completed.v1`

### 7. PartnerIntegrationService (Gestão de Parceiros Institucionais)
- Cadastro de parceiros, emissão de credenciais, certificados mTLS, SLAs e contratos
- Publica: `aura.interoperability.partner.registered.v1`

### 8. IntegrationMonitoringService (Monitoramento & Alertas)
- Telemetria em tempo real: disponibilidade, latência, throughput, consumo de cota e falhas
- Disparo automático de alertas em integrações degradadas
- Publica: `aura.interoperability.failure.detected.v1`

### 9. IntegrationGovernanceService (Governança Automatizada)
- Validação automatizada em 4 camadas: técnica, jurídica/LGPD, segurança e compatibilidade de versão

### 10. ExternalAuditService (Auditoria Imutável SHA-256)
- Registro e assinatura criptográfica SHA-256 de todas as trocas externas de informação
- Publica: `aura.interoperability.audit.completed.v1`

## Catálogo de Eventos (AsyncAPI 2.6.0)

| Evento | Publicado por | Gatilho |
|--------|--------------|---------|
| `aura.interoperability.integration.created.v1` | EnterpriseIntegrationService | Início do fluxo de integração |
| `aura.interoperability.integration.updated.v1` | EnterpriseIntegrationService | Atualização/Conclusão do fluxo |
| `aura.interoperability.integration.validated.v1` | ApiGatewayManagementService | Rota/Requisição aprovada |
| `aura.interoperability.connection.established.v1` | ExternalConnectorService | Conexão estabelecida |
| `aura.interoperability.consent.granted.v1` | ConsentManagementService | Consentimento concedido |
| `aura.interoperability.consent.revoked.v1` | ConsentManagementService | Consentimento revogado |
| `aura.interoperability.data_exchange.completed.v1` | DataExchangeService | Troca de dados executada |
| `aura.interoperability.partner.registered.v1` | PartnerIntegrationService | Parceiro cadastrado |
| `aura.interoperability.failure.detected.v1` | IntegrationMonitoringService | Alerta de falha/degradação |
| `aura.interoperability.audit.completed.v1` | ExternalAuditService | Auditoria concluída |

## Princípios de Governança e Segurança

- **Consentimento LGPD Mandatório**: Nenhuma transferência de dados pessoais ocorre sem validação prévia de consentimento ativo.
- **Zero Trust & mTLS**: Conexões de alta confidencialidade exigem autenticação mTLS de dois caminhos.
- **Resiliência Isolada**: O Circuit Breaker isola falhas em parceiros externos sem afetar os serviços internos da plataforma.
- **Rastreabilidade SHA-256**: Cada transação externa gera uma assinatura SHA-256 imutável na trilha de auditoria.

## Consequências

- Estabelece a Fase VI do Projeto Aura como um **Ecossistema Digital Interoperável e Integrado**
- Garante conformidade total com LGPD, regulamentações do SUS, e-SUS, SUAS e ITI (ICP-Brasil)
- Protege a plataforma contra sobrecargas externas via API Gateway (rate-limiting e quotas)
- Proporciona resiliência de nível enterprise com isolamento de falhas externas (Circuit Breaker/DLQ)
