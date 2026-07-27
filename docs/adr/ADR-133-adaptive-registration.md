# ADR-133: Aura Adaptive Intelligent Registration Platform (AAIRP)

**Status:** ACEITO  
**Data:** 2026-07-27  
**Autores:** Chief Solution Architect, Chief Enterprise Architect (CEA), Principal Workflow Architect  
**Referência:** Prompt 133 (AAIRP), Technical Baseline P120, OSS P129, Prompt 131 AFPI, Prompt 132 AIFI

---

## Contexto

A qualificação, elegibilidade e acolhimento de todos os sujeitos do ecossistema Aura (Beneficiários, Profissionais, Voluntários, Responsáveis Legais e Parceiros) dependem de um processo de cadastro flexível e dinâmico. Formulários estáticos (hardcoded) geram retrabalho, lentidão na homologação de programas sociais e incapacidade de adaptar perguntas à realidade socioeconômica de cada indivíduo.

## Decisão

### 1. Separação em Motores Desacoplados

**Decisão:** O domínio `@domain/registration` foi concebido com 4 motores e serviços especializados:
- **DynamicFormsEngine:** Schemas de formulários (abas, grupos, máscaras, visibilidade condicional) configuráveis via API/Admin UI.
- **AdaptiveQuestionnaireEngine:** Questionários com salto condicional de perguntas com base em perfil demográfico (idade, gênero) e histórico de respostas.
- **EligibilityEngine:** Avaliação de regras de elegibilidade (renda per capita, faixas atuariais, vulnerabilidades).
- **RiskClassificationService:** Matriz de risco multidimensional (clínica, psicossocial, vulnerabilidade) com alertas imediatos para casos CRÍTICOS.
- **ConsentManagementService & ResponsibleGuardianService:** Conformidade LGPD (Art. 7/11) e vinculação jurídica de tutela/curatela.

### 2. Form schemas sem Código Fixo

**Decisão:** Nenhum formulário é gravado em código estático. Todo schema é retornado via `/api/v1/registration/forms/schema/:profileType`.

### 3. Event-Driven Registration Lifecycle

**Decisão:** Publicação de eventos padronizados no formato CloudEvents v1.0.3:
- `aura.registration.started.v1`
- `aura.registration.completed.v1`
- `aura.registration.risk.classified.v1`
- `aura.consent.granted.v1`
- `aura.consent.revoked.v1`
- `aura.registration.guardian.linked.v1`

## Consequências

- ✅ Super Administradores podem adicionar novos campos e regras de validação sem necessidade de deploy de código.
- ✅ Elegibilidade e Matriz de Risco funcionam como pré-triagem automatizada para o Prontuário Clínico (M05) e ERP Social (M08).
- ✅ Total conformidade com a LGPD e o MCSI.

---

*Homologado pelo Architecture Review Board (ARB) — AAIRP Prompt 133*
