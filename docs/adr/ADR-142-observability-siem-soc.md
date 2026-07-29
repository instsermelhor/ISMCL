# ADR-142: Aura Enterprise Observability, Cybersecurity, SIEM & SOC Platform (AEOCSAP)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief Information Security Officer (CISO), Chief Risk Officer (CRO), Chief Audit Executive (CAE), Principal SIEM Architect  
**Referência:** Prompt 142 (AEOCSAP), P106 AEDSO, P118 AECS, LGPD Art. 7/11, MCSI, Zero Trust

---

## Contexto

A Plataforma Aura exige uma camada corporativa de cibersegurança, observabilidade e auditoria contínua que não apenas registre eventos, mas monitore continuamente a operação, detecte anomalias em tempo real, responda automaticamente a incidentes (SOAR) e gere evidências para auditorias internas e externas (ANPD/LGPD).

## Decisão

### 1. Centralized Logging com Assinatura Digital SHA-256 (Imutabilidade)

**Decisão:** O `LoggingTelemetryService` consolida logs estruturados em JSON de todos os microsserviços. Cada log é assinado digitalmente com hash SHA-256 do payload (`digitalSignature`), garantindo imutabilidade e não-repúdio perante auditorias.

### 2. Rastreamento Distribuído (Correlation ID, Trace ID, Span ID)

**Decisão:** Toda requisição no ecossistema recebe um `correlationId` único propagado entre os microsserviços NestJS/Fastify, permitindo a reconstrução ponta a ponta da cadeia de chamadas.

### 3. SIEM com Correlação de Eventos e Detecção de Ameaças

**Decisão:** O `SiemThreatDetectionService` correlaciona eventos de autenticação, APIs, banco de dados, IA e prontuário. Detecta automaticamente:
- `BRUTE_FORCE` (força bruta)
- `DATA_EXFILTRATION` (leitura massiva de prontuários - LGPD Art. 11)
- `PRIVILEGE_ESCALATION` (tentativa de elevação para SUPER_ADMIN)
- `ANOMALOUS_ACCESS` (acesso anômalo/geográfico)

### 4. SOC Automation (SOAR) com Playbooks de Contenção Automática

**Decisão:** O `SocAutomationService` implementa o ciclo de vida de incidentes (`INC-YYYY-XXXXX`) e executa playbooks automáticos:
- `REVOKE_SESSION`: Revogação imediata de JWT
- `BLOCK_IP`: Adição de IP ao bloqueio do WAF/Firewall
- `ISOLATE_USER`: Suspensão temporária do usuário no IAM
- Preservação imutável da trilha de evidências para perícia

### 5. Continuous Audit Service (Auditoria Contínua LGPD/MCSI/Zero Trust)

**Decisão:** O `ContinuousAuditService` audita continuamente 4 dimensões regulatórias (LGPD Art. 11, Zero Trust MFA, MCSI Imutabilidade, IA Responsável) e produz um Score de Conformidade Global (0 a 100%).

### 6. Event-Driven Telemetry Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.observability.log.created.v1`
- `aura.observability.threat.detected.v1`
- `aura.observability.incident.created.v1`
- `aura.observability.incident.resolved.v1`
- `aura.observability.audit.executed.v1`

## Consequências

- ✅ Monitoramento em tempo real da saúde da plataforma e ameaças de cibersegurança.
- ✅ Resposta automática a incidentes críticos em segundos (SOAR) sem intervenção manual imediata.
- ✅ Conformidade regulatória contínua e auditável com evidências preservadas.

---

*Homologado pelo Information Security & Governance Board — AEOCSAP Prompt 142*
