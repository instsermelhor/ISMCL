# ADR-162: Aura Enterprise Platform Lifecycle Management, Architecture Sustainability & Technology Evolution Platform (EPLM)

**Status:** ACCEPTED  
**Fase:** XII — Sustentabilidade Tecnológica e Gestão do Ciclo de Vida da Plataforma  
**Data:** 2026-08-02  
**Responsáveis:** CTO, CEA, CIO, CAIO, CGO, CINO  
**Prompt de Origem:** P162 — EPLM  
**Commits:** (a ser preenchido após merge)

---

## Contexto

Após os Prompts 120–161, a Plataforma Aura possui arquitetura corporativa, IA, governança autônoma, interoperabilidade, observabilidade, Digital Twin, Gestão do Conhecimento, Decision Intelligence, Comando Executivo (P160) e Conformidade Contínua (P161).

O desafio seguinte é garantir a **sustentabilidade tecnológica de longo prazo** do ecossistema: controlar o ciclo de vida de todos os componentes, gerenciar a dívida técnica, monitorar dependências, planejar a evolução tecnológica e medir continuamente a saúde da plataforma — independentemente de mudanças de equipe, fornecedores ou tecnologias.

---

## Problema

Como garantir que a Plataforma Aura permaneça tecnicamente sustentável, evolutiva e gerenciável durante os próximos anos, sem acumular dívida técnica crítica, dependências obsoletas ou componentes sem governança de ciclo de vida?

---

## Decisão

Implementar o módulo `platform-lifecycle` em `backend/src/domain/platform-lifecycle/`, composto por **10 microsserviços desacoplados** orientados por eventos (CloudEvents v1.0.3), responsáveis pelo controle completo do ciclo de vida, sustentabilidade arquitetural e evolução tecnológica.

---

## Arquitetura

### Módulo

```
backend/src/domain/platform-lifecycle/
├── dto/
│   └── platform-lifecycle.dto.ts               # 8 enums, 4 DTOs de requisição
├── services/
│   ├── lifecycle-audit.service.ts               # Auditoria SHA-256 imutável
│   ├── platform-lifecycle.service.ts            # Inventário e controle de componentes
│   ├── architecture-sustainability.service.ts   # Métricas: acoplamento, coesão, modularidade
│   ├── technical-debt-management.service.ts     # Identificação, classificação e priorização de dívida
│   ├── dependency-governance.service.ts         # Versões, licenças, vulnerabilidades, EOL
│   ├── technology-evolution.service.ts          # Roadmap tecnológico estratégico (ROI, risco)
│   ├── architecture-compliance.service.ts       # Conformidade com padrões arquiteturais
│   ├── version-management.service.ts            # Releases, hotfixes, versões suportadas, ADRs
│   ├── modernization-planning.service.ts        # Planos de refatoração e migração
│   ├── platform-health-assessment.service.ts    # Índice Corporativo de Saúde (PHI)
│   └── platform-lifecycle.service.spec.ts       # Jest (35+ casos, 95%+ cobertura)
├── controllers/
│   └── platform-lifecycle.controller.ts         # REST API (15+ endpoints)
└── platform-lifecycle.module.ts                 # NestJS Module
```

### Índice Corporativo de Saúde da Plataforma (PHI)

O PHI é um índice composto (0-100) calculado a partir de 8 dimensões:

| Dimensão | Fonte |
|----------|-------|
| Estabilidade | Histórico operacional (P156 AUOC) |
| Confiabilidade | SRE metrics (P156 AUOC) |
| Segurança | Zero Trust + LGPD compliance (P161 AGCC) |
| Desempenho | Observabilidade (P156 AUOC) |
| Cobertura de Testes | Jest coverage reports |
| Dívida Técnica | `TechnicalDebtManagementService` |
| Conformidade Arquitetural | `ArchitectureComplianceService` |
| Sustentabilidade | `ArchitectureSustainabilityService` |

### Canais de Eventos (AsyncAPI 2.6.0 / CloudEvents v1.0.3)

| Canal | Publicador | Trigger |
|-------|-----------|---------|
| `aura.lifecycle.version.released.v1` | PlatformLifecycleService / VersionManagementService | Registro/release de componente |
| `aura.lifecycle.technical.debt.detected.v1` | TechnicalDebtManagementService | Novo item de dívida registrado |
| `aura.lifecycle.dependency.updated.v1` | DependencyGovernanceService | Avaliação de dependência |
| `aura.lifecycle.architecture.assessment.completed.v1` | ArchitectureSustainabilityService | Assessment de sustentabilidade |
| `aura.lifecycle.technology.roadmap.generated.v1` | TechnologyEvolutionService | Roadmap gerado |
| `aura.lifecycle.modernization.plan.created.v1` | ModernizationPlanningService | Plano de modernização criado |
| `aura.lifecycle.platform.health.calculated.v1` | PlatformHealthAssessmentService | PHI calculado |
| `aura.lifecycle.audit.completed.v1` | LifecycleAuditService | Auditoria SHA-256 registrada |
| `aura.lifecycle.component.deprecated.v1` | PlatformLifecycleService | Componente depreciado |
| `aura.lifecycle.architecture.compliance.completed.v1` | ArchitectureComplianceService | Compliance arquitetural verificado |

---

## Alternativas Consideradas

### Alternativa A: Controle manual via planilhas e wikis (Rejeitada)
**Motivo:** Não é rastreável, não é auditável, não escala e não garante atualização contínua.

### Alternativa B: Integração com ferramenta de CMDB de terceiros (Rejeitada)
**Motivo:** Cria dependência de fornecedor externo, não integra com o ecossistema de eventos Aura e não segue os princípios de soberania tecnológica do Instituto.

### Alternativa C: Módulo EPLM nativo orientado por eventos (Adotada ✅)
**Motivo:** Alinha com a arquitetura existente, integra-se ao EventBus, é auditável via SHA-256, escala de forma independente e preserva a governança institucional.

---

## Implicações

### Positivas
- Inventário completo e auditável de todos os componentes do ecossistema Aura.
- Dívida técnica classificada por criticidade, impacto e esforço — com priorização automática.
- Dependências monitoradas com alertas de versões obsoletas, vulnerabilidades e EOL.
- Roadmap tecnológico estratégico com análise de ROI e cronograma.
- PHI (Platform Health Index) como indicador executivo único de saúde do ecossistema.
- Planejamento de modernização com estratégias (Refactor, Replace, Replatform, Retire, Retain, Migrate).

### Riscos e Mitigações
| Risco | Severidade | Mitigação |
|-------|-----------|-----------|
| Inventário desatualizado por falta de disciplina de registro | MEDIUM | Integração com pipelines CI/CD para auto-registro de componentes |
| Falsa sensação de segurança com PHI alto mas dívida oculta | MEDIUM | PHI penaliza cada item de dívida CRITICAL/HIGH em -10 e -3 pontos |
| Planos de modernização não executados | LOW | Aprovação formal obrigatória + rastreamento no centro executivo (P160 AEMIAG) |
| Dependências sem avaliação de licença | LOW | Auditoria de licença obrigatória no workflow de `assessDependency` |

---

## Integrações Nativas (Prompts 120–161)

| Módulo | Código | Relação com EPLM |
|--------|--------|-----------------|
| Architecture Governance | P148 | Padrões arquiteturais para `ArchitectureComplianceService` |
| Unified Operations / AIOps | P156 | Dados de estabilidade e performance para PHI |
| Decision Intelligence | P159 | XAI aplicado a recomendações de modernização |
| Mission Intelligence | P160 | PHI alimenta o painel executivo de comando |
| Governance & Compliance | P161 | Conformidade contínua validada por `ArchitectureComplianceService` |

---

## Verificação e Certificação

### Testes Automatizados
- **Framework:** Jest + NestJS Testing Module
- **Cobertura:** 95%+ (35+ casos de teste)
- **Cenários:** SHA-256 audit, PHI composto, compliance 100%, dívida técnica prioritizada, dependências com risco, versões cronológicas, roadmap ROI, modernização e integração cross-service

### TypeScript
- Verificação estrita de tipos em todos os serviços
- Sem `any` implícito

---

## Consequências

Este ADR consolida a **Fase XII — Sustentabilidade Tecnológica** da Plataforma Aura, estabelecendo o controle permanente do ciclo de vida, da saúde arquitetural e da evolução tecnológica do ecossistema digital do Instituto Ser Melhor por meio de um módulo nativo, orientado por eventos e integrado a toda a plataforma.
