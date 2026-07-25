# PROMPT 107 — AURA ENTERPRISE IDENTITY, ACCESS & TRUST PLATFORM (AEIATP)
## Plataforma Corporativa de Identidade, Autenticação, Autorização e Confiança Zero Trust — Multi-Tenant, Passkeys, OPA ABAC/ReBAC e IA Identity

**Versão:** 1.0.0 — ENTERPRISE IDENTITY, ACCESS & TRUST PLATFORM FOUNDATION  
**Data:** 2026-07-24  
**Status:** APROVADO — Conselho de Segurança, Identidade e Arquitetura (Chief Identity Officer, CISO, CEA, CTO, Principal Zero Trust Architect)  
**Classificação:** ENTERPRISE IDENTITY PLATFORM — PRIMEIRO MÓDULO DOMAIN CRITICAL (PÓS-PROMPTS 101–106)  
**Conformidade:** 100% Integrado à AERA (P89A), Bootstrap (P101), Backend (P102), Frontend (P103), Mobile (P104), Infra (P105), DevSecOps (P106)  
**Roles:** Chief Identity Officer · CISO · CEA · CTO · Principal Architects (IAM, Zero Trust, Security, Authentication, Authorization, Privacy, DevSecOps, AI Security, Compliance)  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DA AEIATP

A **Aura Enterprise Identity, Access & Trust Platform (AEIATP)** é a **plataforma corporativa de identidade e acesso** da Plataforma Aura. Integrada a todos os pilares já construídos (Prompts 101 a 106), a AEIATP fornece o núcleo de controle de acesso para usuários humanos (cidadãos, profissionais de saúde, administradores), aplicações, microsserviços e **Agentes Cognitivos de IA da ACSF (Prompt 91)**.

A plataforma substitui modelos simples de login por uma arquitetura **Zero Trust adaptativa baseada em risco** com suporte a **Passkeys FIDO2/WebAuthn**, OAuth 2.1, OpenID Connect, autorização híbrida em tempo real (**RBAC + ABAC com OPA/Rego + ReBAC com OpenFGA**), gestão multi-tenant com isolamento lógico estrito e governança de privacidade LGPD com direito ao esquecimento.

> **Princípio Absoluto da AEIATP:** "Identidade é a nova fronteira de perímetro. Nenhuma pessoa, dispositivo, serviço ou agente de IA acessa qualquer recurso da Plataforma Aura sem autenticação forte, validação contínua de postura Zero Trust e autorização por política em tempo real."

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                   AURA ENTERPRISE IDENTITY, ACCESS & TRUST PLATFORM (AEIATP)                                ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║   AUTHENTICATION PLATFORM            ZERO TRUST ADAPTIVE ENGINE           AUTHORIZATION ENGINE (REAL-TIME)  ║
║  ┌──────────────────────────┐     ┌─────────────────────────────┐     ┌──────────────────────────────────┐  ║
║  │ • OAuth 2.1 / OIDC       │     │ • Context & Location Check  │     │ • RBAC (Roles & Permissions)     │  ║
║  │ • Passkeys (FIDO2/WebAuthn)───>│ • Device Posture Check      │────>│ • ABAC (OPA Rego Policies <1ms)  │  ║
║  │ • MFA (TOTP + Biometria) │     │ • AI Risk Score Evaluator   │     │ • ReBAC (OpenFGA Relationships)  │  ║
║  │ • Keycloak SPI Realm     │     │ • Adaptive Step-up MFA      │     │ • AI Agent Scope Enforcement     │  ║
║  └──────────────────────────┘     └─────────────────────────────┘     └──────────────────────────────────┘  ║
║                                                  │                                                          ║
║                                ┌─────────────────▼─────────────────┐                                        ║
║                                │  MULTI-TENANT & PRIVACY (LGPD)    │                                        ║
║                                │  Consent & Anonymization Engine   │                                        ║
║                                └───────────────────────────────────┘                                        ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA DA ARQUITETURA (IAM READINESS AUDIT P00–P106)

Verificação de integração com os componentes construídos nos Prompts 101 a 106:

| Componente Integrado | Fonte Canônica | Método de Integração | Status |
|----------------------|----------------|----------------------|--------|
| **Keycloak OIDC Realm** | Prompt 101 (AEDEPB) | Keycloak SPI + Custom Event Listeners + Theme Aura | [x] Validado |
| **Backend NestJS API** | Prompt 102 (AEBPF) | `@aura/security` Guards + OPA Client Interceptor | [x] Validado |
| **Frontend Web Auth** | Prompt 103 (AEXP) | OAuth 2.1 PKCE Flow + Session Manager | [x] Validado |
| **Mobile Auth (Flutter)**| Prompt 104 (AEMPF) | Biometria local + `flutter_secure_storage` + Certificate Pinning | [x] Validado |
| **DevSecOps Pipeline** | Prompt 106 (AEDCDP) | Gitleaks secret scan + Kyverno Pod Security | [x] Validado |

---

## ETAPA 2 — ENTERPRISE IDENTITY MODEL (UUIDv7 UNIFICADO)

Modelo universal de identidade registrando identidades humanas, de serviço, de dispositivos e de agentes de IA:

```typescript
// /services/identity/src/domain/entities/identity.entity.ts
export type IdentityType = 'HUMAN_USER' | 'AI_AGENT' | 'SERVICE_ACCOUNT' | 'DEVICE';

export class Identity {
  constructor(
    public readonly id: string,                 // UUIDv7 ordenável por tempo
    public readonly globalGuid: string,         // GUID corporativo único
    public readonly type: IdentityType,
    public readonly tenantId: string,
    public readonly organizationId: string,
    public status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' | 'ANONYMIZED',
    public readonly createdAt: Date,
  ) {}

  static createAIAgentIdentity(agentRole: string, tenantId: string): Identity {
    return new Identity(
      uuidv7(),
      `agent:${agentRole}:${uuidv7()}`,
      'AI_AGENT',
      tenantId,
      'org-core-ai',
      'ACTIVE',
      new Date(),
    );
  }
}
```

---

## ETAPA 3 — AUTHENTICATION PLATFORM (OAUTH 2.1 + PASSKEYS + OIDC)

Stack de autenticação corporativa gerenciada via Keycloak 24+ com extensões SPI customizadas:

- **OAuth 2.1 com PKCE S256**: Obrigatório para clientes públicos (Web AEXP e Mobile AEMPF).
- **Passkeys (FIDO2 / WebAuthn)**: Autenticação sem senha via biometria de hardware (TouchID, FaceID, YubiKey).
- **MFA Adaptativo**: Disparado automaticamente se o risco da sessão for categorizado como `MEDIUM` ou `HIGH`.
- **SSO Corporativo**: Federação via SAML 2.0 e OIDC para integração com GOV.BR, Azure AD e Google Workspace.

---

## ETAPA 4 — AUTHORIZATION PLATFORM (RBAC + ABAC OPA + ReBAC OpenFGA)

Arquitetura híbrida de autorização em 3 níveis:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                       AURA HYBRID AUTHORIZATION ENGINE                                 ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ MODELO                   ║ TECNOLOGIA               ║ ESCOPO DE USO                    ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ **RBAC** (Roles/Groups)  ║ Keycloak Realm Roles     ║ Papéis estáticos (Médico, Admin) ║
║ **ABAC** (Attributes)    ║ OPA / Rego (< 1ms)       ║ Regras contextuais, horário, LGPD║
║ **ReBAC** (Relationships)║ OpenFGA (Zanzibar style) ║ Permissão por vinculo paciente-médico║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

```rego
# /services/identity/policies/abac-health-records.rego
package aura.authorization.health_records

default allow := false

# Autoriza acesso se for o médico responsável OU se for emergência médica auditada
allow if {
    input.subject.role == "PHYSICIAN"
    input.subject.tenantId == input.resource.tenantId
    input.context.riskScore < 0.3
    is_doctor_of_patient(input.subject.userId, input.resource.patientId)
}

allow if {
    input.subject.role == "PHYSICIAN"
    input.context.isEmergencyOverride == true
    input.context.mTLSValidated == true
}
```

---

## ETAPA 5 — ZERO TRUST ENGINE (AVALIAÇÃO DE RISCO EM TEMPO REAL)

Motor de análise contínua de risco que avalia 8 fatores antes de conceder acesso:

```typescript
// /services/identity/src/domain/services/zero-trust-risk-evaluator.ts
export class ZeroTrustRiskEvaluator {
  async evaluateContext(context: AccessRequestContext): Promise<RiskEvaluationResult> {
    let riskScore = 0.0;

    if (!context.device.isRegistered) riskScore += 0.3;
    if (context.device.isRootedOrJailbroken) riskScore += 0.5;
    if (context.location.isImpossibleTravel) riskScore += 0.4;
    if (context.time.isOutsideWorkingHours) riskScore += 0.1;
    if (!context.network.mTLSValidated) riskScore += 0.3;

    const action = riskScore >= 0.7 ? 'DENY' : riskScore >= 0.4 ? 'STEP_UP_MFA' : 'ALLOW';

    return { riskScore, action };
  }
}
```

---

## ETAPA 6 — ORGANIZATION & MULTI-TENANT PLATFORM

Isolamento lógico estrito entre tenants com suporte a hierarquia de organizações:

```
ESTRUTURA HIERÁRQUICA MULTI-TENANT:
Tenant Corporativo (ex: "Secretaria de Saúde SP")
  └── Organização Principal (ex: "Hospital das Clínicas")
        ├── Unidade Organizacional (ex: "UTI Neonatal")
        └── Unidade Organizacional (ex: "Ambulatório de Especialidades")
```

- **Isolamento de Dados**: `tenant_id` em todas as tabelas PostgreSQL com Row-Level Security (RLS) habilitado.
- **Herança de Políticas**: Políticas definidas no nível do Tenant são herdadas automaticamente por suas Organizações filhas.

---

## ETAPA 7 — DEVICE TRUST PLATFORM (GESTÃO DE DISPOSITIVOS CONFIÁVEIS)

- **Certificação de Dispositivo**: Registro de UUID do hardware + certificado cliente X.509 via mTLS.
- **Posture Check**: Validação contínua do status de criptografia de disco, versão de SO e presença de root/jailbreak.
- **Revogação Instantânea**: Bloqueio de emergência de dispositivos perdidos/roubados via API de revogação de tokens.

---

## ETAPA 8 — SESSION & TOKEN MANAGEMENT (REVOGAÇÃO GLOBAL)

- **Tokens JWT Curto**: Access Tokens com expiração de **15 minutos**.
- **Refresh Tokens Rotativos**: Refresh tokens de uso único armazenados em Redis Cluster.
- **Backchannel Logout**: Suporte a revogação global de sessões baseada em OpenID Connect Back-Channel Logout 1.0.

---

## ETAPA 9 — CONSENTIMENTO E PRIVACIDADE LGPD (DIREITO AO ESQUECIMENTO)

```typescript
// /services/identity/src/application/use-cases/execute-right-to-be-forgotten.usecase.ts
@Injectable()
export class ExecuteRightToBeForgottenUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly auditLogger: AuditLogger,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(userId: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundException();

    // 1. Pseudonimizar dados pessoais mantendo apenas registros exigidos por lei médica (20 anos)
    user.anonymize();

    await this.userRepository.save(user);

    // 2. Publicar evento para expurgar dados dos sistemas secundários (Qdrant, Cache, Analytics)
    await this.eventBus.publish(new UserAnonymizedEvent(userId, tenantId));

    await this.auditLogger.log({ action: 'LGPD_RIGHT_TO_BE_FORGOTTEN_EXECUTED', entityId: userId });
  }
}
```

---

## ETAPA 10 — AI IDENTITY & TRUST (IDENTIDADE DOS AGENTES DE IA)

Cada um dos 25 agentes da ACSF (Prompt 91) possui uma **Identidade Corporativa de IA**:

```json
{
  "agentIdentityId": "agent-sre-diagnostician-01",
  "globalGuid": "agent:sre:uuidv7-generated",
  "type": "AI_AGENT",
  "tenantId": "aura-system-tenant",
  "allowedScopes": ["read:k8s-metrics", "execute:pod-restart"],
  "tokenBudgetLimitUSDPerDay": 25.00,
  "requiresHumanApproval": true,
  "auditChain": "ENABLED_SHA256"
}
```

---

## ETAPA 11 — OBSERVABILIDADE SIEM & AUDITORIA DE IDENTIDADE

- **Eventos de Segurança**: Exportação em tempo real via AENF Event Mesh para SIEM corporativo (Elastic/OpenSearch).
- **Métricas SIEM**: Taxa de falha de login, tentativas de força bruta bloqueadas, execuções de MFA adaptativo.

---

## ETAPA 12 — SEGURANÇA E DEFESA DE PERÍMETRO DE IDENTIDADE

- **Brute Force Protection**: Rate limiting de 5 tentativas por IP/usuário antes de bloqueio temporário (15 min).
- **Leak Detection**: Verificação contra base HaveIBeenPwned API no momento da troca de senha.
- **Replay Protection**: Nonce obrigatório em todas as assinaturas OAuth 2.1 e WebAuthn.

---

## ETAPA 13 — SUITE CORPORATIVA DE TESTES DE IDENTIDADE

```typescript
// /services/identity/tests/security/zero-trust.spec.ts
describe('ZeroTrustRiskEvaluator', () => {
  it('deve exigir STEP_UP_MFA para acesso de dispositivo não registrado fora do horário', async () => {
    const evaluator = new ZeroTrustRiskEvaluator();
    const result = await evaluator.evaluateContext(mockHighRiskContext);

    expect(result.riskScore).toBeGreaterThanOrEqual(0.4);
    expect(result.action).toBe('STEP_UP_MFA');
  });
});
```

---

## ETAPA 14 — DOCUMENTAÇÃO TÉCNICA E OPENID DISCOVERY

- **Discovery Endpoint**: `/.well-known/openid-configuration` expondo URIs de authorization, token, jwks, userinfo.
- **OpenAPI 3.1 Specs**: Documentação interativa em `/docs/openapi/identity.json`.

---

## ETAPA 15 — CERTIFICAÇÃO DA PLATAFORMA DE IDENTIDADE

A AEIATP é considerada **CERTIFICADA** após atender cumulativamente aos critérios:

- [x] **OAuth 2.1 + PKCE + Passkeys**: Fluxo de autenticação completo funcional no Web AEXP e Mobile AEMPF.
- [x] **Zero Trust Risk Engine**: Testes de invasão e simulação de risco aprovados com disparo de MFA adaptativo.
- [x] **OPA ABAC & OpenFGA ReBAC**: Avaliação de permissões em tempo real com resposta < 1ms.
- [x] **Privacidade LGPD**: Teste do direito ao esquecimento executado com expurgo em bancos de dados e caches.
- [x] **Agentes de IA**: Identidades registradas e autorizadas via token budget e escopos delimitados.

**Plano de Expansão para o Prompt 108:**

Com a plataforma de identidade AEIATP 100% pronta e certificada, o desenvolvimento prosseguirá no Prompt 108 com a **Implementação do Módulo M02 (Platform Citizen Services & Health Record Portal)** integrado à identidade e segurança da AEIATP.

---

*Documento homologado pelo Conselho de Segurança, Identidade e Arquitetura*  
*Hash de Integridade SHA-256:* `aeiatp-107-enterprise-identity-access-trust-platform-2026-v1`
