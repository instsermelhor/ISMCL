# ADR-132: Aura Identity Fabric Implementation (AIFI) — IAM, Zero Trust & Session Management

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Identity Officer (CIDO), Chief Information Security Officer (CISO), Principal IAM Architect  
**Referência:** Prompt 132 (AIFI), Technical Baseline P120, OSS P129, Prompt 131 AFPI

---

## Contexto

A Plataforma Aura exige uma infraestrutura de identidade unificada e soberana (Identity Fabric) capaz de atender a múltiplos tipos de atores institucionais (Beneficiários, Profissionais de Saúde, Voluntários, Responsáveis Legais, Auditores e Administradores). Nenhum microsserviço de negócio (Prontuário, Social, Financeiro, Agenda) pode ser acessado sem ter suas requisições validadas pelo Identity Fabric.

## Decisão

### 1. Desacoplamento de Microsserviços de Identidade

**Decisão:** O núcleo de identidade foi estruturado no domínio `@domain/auth` contendo 6 serviços desacoplados:
- **IdentityService:** Gestão do ciclo de vida da conta e atribuição de UUID.
- **AuthenticationService:** OAuth 2.1, OIDC, JWT RS256 e emissão de tokens.
- **SessionManagementService:** Invalidação remota, limite de sessões simultâneas e dispositivos confiáveis.
- **MfaService:** TOTP RFC 6238, WebAuthn/Passkeys e Recovery Codes.
- **RolePermissionService:** Gestão de papéis (RBAC) e escopos granulares (ABAC).
- **PolicyEngine:** Motor centralizado de decisão Zero Trust.

### 2. Policy Engine Zero Trust

**Decisão:** Centralizar todas as decisões de autorização em um motor que avalia:
1. **Isolamento de Tenant:** Garantia absoluta de separação de dados.
2. **Sensibilidade do Recurso:** Exigência automática de MFA para dados RESTRICTED/HIGHLY_SENSITIVE (e.g. Prontuários Médicos).
3. **Análise de Risco Adaptativa:** Cálculo de score de risco baseado em IP, Fingerprint e MFA.

### 3. Event-Driven IAM

**Decisão:** Todas as alterações de estado da identidade publicam eventos no formato CloudEvents v1.0.3:
- `aura.identity.user.created.v1`
- `aura.identity.user.disabled.v1`
- `aura.auth.login.succeeded.v1`
- `aura.auth.login.failed.v1`
- `aura.identity.role.assigned.v1`

## Consequências

- ✅ Nenhuma operação é realizada sem `X-Request-ID` e `Authorization: Bearer <JWT>`.
- ✅ Em caso de incidente de segurança, o comando `logout-global` revoga instantaneamente 100% das sessões ativas do usuário.
- ✅ Conformidade nativa com a LGPD (Art. 46) e princípios de Minimização de Dados (Least Privilege & Need-to-Know).

---

*Homologado pelo Identity & Security Governance Board — AIFI Prompt 132*
