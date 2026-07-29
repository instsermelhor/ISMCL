# ADR-141: Aura Enterprise Artificial Intelligence, Knowledge & RAG Platform (AEAI-KP)

**Status:** ACEITO  
**Data:** 2026-07-29  
**Autores:** Chief AI Officer (CAIO), Chief Knowledge Officer (CKO), Principal AI Architect, Principal RAG Architect  
**Referência:** Prompt 141 (AEAI-KP), P111 AEAI, P115 AEDM, LGPD Art. 11, MCSI

---

## Contexto

A Plataforma Aura exige uma camada cognitiva oficial capaz de prover assistentes inteligentes especializados, recuperação contextual de conhecimento (RAG) e governança rigorosa sobre o uso de Inteligência Artificial. Toda IA deve ser transparente, rastreável e alinhada às políticas de IA Responsável do Instituto Ser Melhor.

## Decisão

### 1. AI Gateway Unificado com Fallback Multi-Provedor LLM

**Decisão:** O `AiGatewayService` abstrai múltiplos provedores (Gemini 1.5/2.0, OpenAI GPT-4o, Anthropic Claude 3.5, Local Llama 3). Executa fallback automático em cadeia caso um provedor apresente indisponibilidade ou alta latência: `Gemini (Primário) → Claude (Secundário) → Local Llama (Resiliência)`. Evitando qualquer lock-in com fornecedor.

### 2. RAG (Retrieval-Augmented Generation) com Citação Obrigatória de Fontes

**Decisão:** O `RagKnowledgeService` executa buscas semânticas em Banco Vetorial Corporativo sobre POPs, Protocolos Assistenciais, Políticas Institucionais e FAQs. Todas as respostas geradas via RAG citam obrigatoriamente as fontes de origem utilizadas (`sourcesUsed`), garantindo transparência e verificabilidade.

### 3. Governança Corporativa de Prompts (Prompt Governance)

**Decisão:** O `PromptGovernanceService` gerencia o ciclo de vida dos prompts (`DRAFT → HOMOLOGATING → APPROVED`). NENHUM prompt pode ser utilizado em produção sem aprovação institucional do `SUPER_ADMIN`. Inclui guardrails de segurança contra alucinações e vieses.

### 4. 10 Assistentes Inteligentes Especializados

**Decisão:** O `AiAssistantService` disponibiliza assistentes específicos para cada papel no ecossistema:
- Beneficiário, Psicólogo, Psiquiatra, Assistente Social, Voluntário, Administrativo, Financeiro, Jurídico, Diretoria e Super Administrador.

### 5. Diretrizes de IA Responsável & Revisão Humana (Human-in-the-Loop)

**Decisão:** Todas as interações dos assistentes voltados a saúde e direito (`PSYCHOLOGIST`, `PSYCHIATRIST`, `SOCIAL_WORKER`, `LEGAL`) recebem classificação de risco `HIGH` e ativam obrigatoriamente a flag `requiresHumanReview = true`, incluindo o aviso explícito de que a decisão final cabe ao profissional humano responsável.

### 6. Event-Driven AI Lifecycle (CloudEvents v1.0.3)

**Decisão:** Eventos publicados:
- `aura.ai.knowledge.retrieved.v1`
- `aura.ai.assistant.invoked.v1`

## Consequências

- ✅ Zero lock-in de provedor com resiliência total via fallback automático.
- ✅ Respostas de IA confiáveis, fundamentadas em POPs/Protocolos institucionais com citação de fontes.
- ✅ Conformidade ética e jurídica com revisão humana obrigatória em saúde.

---

*Homologado pelo AI & Knowledge Governance Board — AEAI-KP Prompt 141*
