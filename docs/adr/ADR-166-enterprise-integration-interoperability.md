# ADR-166: Aura Enterprise Integration, Interoperability & Digital Ecosystem Platform (EIIP)

**Status:** ACCEPTED  
**Fase:** XVI — Interoperabilidade Externa, Ecossistema Digital e Governança de Integrações  
**Data:** 2026-08-02  
**Responsáveis:** CInO, CEA, CTO, CIO, CISO, CGO, CAIO  
**Prompt de Origem:** P166 — EIIP  

---

## Contexto

Após os Prompts 120–165, a Plataforma Aura é um ecossistema digital maduro, auditável e focado em mensuração de impacto social e prestação de contas.

O objetivo desta fase é transformar a plataforma em um **hub seguro de integração institucional e ecossistema digital aberto, porém rigidamente governado**, capaz de se conectar a órgãos governamentais (SUAS, CadÚnico, e-SUS), fornecedores de saúde, plataformas financeiras, provedores de identidade e parceiros autorizados.

---

## Decisão

Implementar o módulo `enterprise-integration` em `backend/src/domain/enterprise-integration/`, composto por **10 microsserviços desacoplados** orientados por eventos (CloudEvents v1.0.3).

---

## Arquitetura dos 10 Microsserviços

1. `IntegrationAuditService`: Trilha imutável em SHA-256 de todas as trocas de mensagens e chamadas de API externas.
2. `EnterpriseIntegrationService`: Hub central de integração com parceiros públicos e privados.
3. `APIGatewayService`: API Gateway corporativo com rate limiting, quotas diárias, mTLS e versionamento.
4. `ExternalConnectorService`: Conectores institucionais padronizados (REST, GraphQL, gRPC, Webhooks, Kafka, SAML, OAuth 2.1).
5. `InteroperabilityService`: Tradução e conversão de schemas (FHIR, OpenAPI 3.0, AsyncAPI 2.6, e-SUS).
6. `EventExchangeService`: Barramento corporativo de eventos com ordenação, retries, idempotência e Dead-Letter Queues (DLQ).
7. `PartnerIntegrationService`: Credenciamento, isolamento lógico e gestão de SLAs de parceiros institucionais.
8. `IntegrationGovernanceService`: Governança, revisão e aprovação formal do ciclo de vida das integrações.
9. `IntegrationMonitoringService`: Monitoramento em tempo real de latência, disponibilidade, throughput e erros por parceiro.
10. `IntegrationSecurityService`: Aplicação estrita de mTLS, OAuth 2.1, JWT, assinaturas digitais e rotação de chaves.

---

## Segurança e Zero Trust

- **mTLS Obrigatório:** Conexões externas com parceiros exigem autenticação mTLS de canal.
- **Isolamento de Credenciais:** Nenhuma chave ou segredo reside em código-fonte (Key Vault / Environment Secrets com rotação de 30 dias).
- **Escopos Mínimos:** Autorização via OAuth 2.1 granular por parceiro (`read:beneficiary_status`, etc.).

---

## Consequências

Esta decisão estabelece o Hub Corporativo de Interoperabilidade Externa do Instituto Ser Melhor, permitindo a cooperação segura com redes de saúde, desenvolvimento social e governo com visibilidade total e controle auditável.
