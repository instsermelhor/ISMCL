# ESPECIFICAÇÃO DE APIS E DIAGRAMAS C4 (ARQUITETURA)
## PROJETO AURA - INSTITUTO SER MELHOR

**Data:** Junho 2026
**Foco:** Documentação de Interfaces (GraphQL/REST) e Visão Estrutural (C4)

---

## 1. DIAGRAMA C4 (Nível 2 - Container)
*Nota: Em Markdown estruturado (PlantUML-like)*

```text
+-----------------------------------------------------------------------------------------+
|                                    Projeto Aura (SaaS)                                  |
|                                                                                         |
|  +--------------------+        +--------------------+        +--------------------+     |
|  |   Portal Admin     |        |   Portal Clínico   |        | Portal Beneficiário|     |
|  |     (Next.js)      |        |     (React SPA)    |        | (Next.js/Mobile-Web|     |
|  +--------+-----------+        +--------+-----------+        +--------+-----------+     |
|           |                             |                             |                 |
|           +-----------+-----------------+-----------------------------+                 |
|                       | (HTTPS / WSS)                                                   |
|                       v                                                                 |
|               +-----------------+                                                       |
|               |  API GATEWAY &  | <--- Autentica e roteia (NestJS / Nginx Ingress)      |
|               |   OIDC SERVER   |                                                       |
|               +--------+--------+                                                       |
|                        |                                                                |
|      +-----------------+------------------+------------------+                          |
|      |                 |                  |                  |                          |
|      v                 v                  v                  v                          |
| +----------+     +------------+     +------------+     +-----------+                    |
| | IAM &    |     | SOCIAL CARE|     | CLINICAL & |     | TELEHEALTH|                    |
| | SECURITY |     |  (Casos)   |     |    EMR     |     |  (WebRTC) |                    |
| |(NestJS)  |     |(NestJS/GraphQL)  |(NestJS/REST|     |(LiveKit)  |                    |
| +----+-----+     +-----+------+     +-----+------+     +-----+-----+                    |
|      |                 |                  |                  |                          |
|      +-----------------+------------------+------------------+                          |
|                        |                                                                |
|                        v                                                                |
|              +-------------------+                                                      |
|              |  Bancos de Dados  |                                                      |
|              | - PostgreSQL (RDS)|                                                      |
|              | - Redis (Cache)   |                                                      |
|              | - Elasticsearch   |                                                      |
|              +-------------------+                                                      |
+-----------------------------------------------------------------------------------------+
```

---

## 2. DESIGN DE APIS

A plataforma adota um modelo híbrido: **GraphQL** para portais administrativos (onde há necessidade de agregação massiva de dados sociais, financeiros e estruturais) e **REST** estruturado para ações clínicas transacionais e webhooks.

### 2.1. Exemplo OpenAPI (REST) - Módulo Clínico (Prontuário)

Endpoint para o Profissional "Assinar e Fechar" uma evolução clínica.

```yaml
openapi: 3.0.3
info:
  title: Aura Clinical API
  version: 1.0.0
paths:
  /api/v1/clinic/evolutions/{id}/sign:
    post:
      summary: Assina eletronicamente e bloqueia a edição de uma evolução (EMR).
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - plainTextContent
              properties:
                plainTextContent:
                  type: string
                  description: "Conteúdo rico da evolução que será criptografado antes de salvar."
      responses:
        '200':
          description: Evolução assinada com sucesso.
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "SIGNED"
                  digitalSignatureHash:
                    type: string
                  signedAt:
                    type: string
                    format: date-time
        '403':
          description: Violação de ABAC (Usuário não vinculado ao caso ou não é autor).
```

### 2.2. Exemplo GraphQL Schema - Módulo Administrativo

Para montar a tela de detalhe de um Beneficiário com sua rede de proteção.

```graphql
# Aura Social Schema

type Beneficiary {
  id: ID!
  fullName: String!
  socialName: String
  documentCpf: String
  vulnerabilityStatus: VulnerabilityStatus!
  familyIncome: Float
  activeCases: [Case!]!
  externalReferrals: [ExternalReferral!]!
}

type Case {
  id: ID!
  title: String!
  status: CaseStatus!
  assignedVolunteers: [Volunteer!]!
  carePlan: String
}

type ExternalReferral {
  id: ID!
  institutionName: String!
  reason: String!
  status: ReferralStatus!
}

enum VulnerabilityStatus {
  HIGH_RISK
  STABLE
  FOOD_INSECURITY
}

type Query {
  # Retorna o perfil completo do beneficiário
  beneficiaryDetails(id: ID!): Beneficiary
  
  # Busca todos beneficiários em vulnerabilidade de risco
  highRiskBeneficiaries(limit: Int = 10, offset: Int = 0): [Beneficiary!]!
}
```

---

## 3. WEBHOOKS DE INTEGRAÇÃO (WHATSAPP E GATEWAYS)

### 3.1. Recebimento de Mensagem (WhatsApp Cloud API)
Quando um beneficiário responde "Sim" a um lembrete.
*   **POST** `/api/v1/webhooks/whatsapp`
*   O payload é validado via hash SHA-256 (garantindo origem da Meta).
*   A requisição apenas **insere na fila do RabbitMQ** para processamento assíncrono. O Gateway não tenta alterar o banco de dados diretamente, evitando gargalos em picos de mensagens (ex: campanhas institucionais).
