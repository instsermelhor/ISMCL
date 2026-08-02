# ADR 158: Aura Enterprise Knowledge Intelligence Platform, Organizational Memory & Knowledge Governance (AEKIP)

## Status
Accepted / Implemented — **Fase IX — Prompt 158**

## Contexto

Com o Digital Twin Organizacional (P157 ADT) implementado para simulações e planejamento futuro, a Plataforma Aura necessita de uma **Plataforma Corporativa de Inteligência do Conhecimento (AEKIP)** responsável por capturar, organizar, relacionar, versionar, preservar e disseminar todo o conhecimento produzido pelo Instituto Ser Melhor.

Sem uma gestão unificada do conhecimento, a instituição sofria com:
- Dispersão de documentos, POPs, políticas e protocolos entre diferentes departamentos
- Perda de memória organizacional após a conclusão de projetos ou rotação de equipes
- Dificuldade para encontrar respostas rápidas sobre procedimentos operacionais e assistenciais
- Falta de relacionamento semântico entre pessoas, documentos, processos, módulos e regras de conformidade
- Ausência de versionamento rigoroso e auditoria SHA-256 no ciclo de vida documental

## Decisão

Implementar o módulo `EnterpriseKnowledgeModule` em `backend/src/domain/enterprise-knowledge/` composto por **10 microsserviços desacoplados**, orientados por eventos (CloudEvents v1.0.3) e integrados à pesquisa semântica com arquitetura RAG (Retrieval-Augmented Generation).

### 1. KnowledgeAuditService (Auditoria SHA-256 Imutável)
- Registra e assina criptograficamente todas as operações de criação, leitura, atualização, aprovação, publicação e arquivamento
- Publica: `aura.knowledge.audit.completed.v1`

### 2. EnterpriseKnowledgeService (Hub Central de Conhecimento)
- Gerencia o ciclo CRUD completo de documentos, políticas, normas, POPs, protocolos, artigos, pesquisas, treinamentos, decisões, ADRs e FAQs
- Versionamento automático a cada alteração (v1, v2, v3...)
- Publica: `aura.knowledge.item.created.v1`, `aura.knowledge.item.updated.v1`, `aura.knowledge.item.published.v1`

### 3. OrganizationalMemoryService (Memória Organizacional)
- Registra decisões institucionais, lições aprendidas, incidentes resolvidos, auditorias e melhorias de processo
- Preserva a memória histórica da instituição ao longo do tempo
- Publica: `aura.knowledge.memory.updated.v1`

### 4. KnowledgeGraphService (Grafo Corporativo de Conhecimento)
- Mapeia nós (Pessoas, Processos, Documentos, Projetos, Módulos, Agentes de IA) e arestas de relacionamento semântico
- Permite navegação em grafo e descoberta de conexões entre conhecimentos
- Publica: `aura.knowledge.graph.updated.v1`

### 5. KnowledgeLifecycleService (Ciclo de Vida Documental)
- Transições formais: DRAFT → UNDER_REVIEW → APPROVED → PUBLISHED → ARCHIVED
- Publica: `aura.knowledge.item.approved.v1`, `aura.knowledge.item.archived.v1`

### 6. SemanticKnowledgeEngineService (Motor Semântico)
- Extração automática de conceitos, entidades e categorização de domínio
- Geração de embeddings semânticos simulados para busca e RAG

### 7. EnterpriseSearchService (Pesquisa Semântica & RAG)
- Busca por linguagem natural, similaridade semântica e intenção
- Arquitetura RAG integrada para gerar respostas sintéticas com contexto documental
- Publica: `aura.knowledge.search.executed.v1`

### 8. InstitutionalTaxonomyService (Taxonomia Corporativa)
- Classificação por Área, Tema, Público, Criticidade, Confidencialidade e Vigência
- Validade recomendada em meses por tipo de documento (6 a 24 meses)

### 9. KnowledgeGovernanceService (Governança do Conhecimento)
- Monitora conteúdos vencidos (>6 meses sem revisão) e itens sem proprietário responsável
- Emite alertas operacionais de governança

### 10. KnowledgeRecommendationService (Recomendações Inteligentes)
- Recomendações proativas de documentos, protocolos e treinamentos com base no perfil e departamento do usuário
- Publica: `aura.knowledge.recommendation.generated.v1`

## Catálogo de Eventos (AsyncAPI 2.6.0)

| Evento | Publicado por |
|--------|--------------|
| `aura.knowledge.item.created.v1` | EnterpriseKnowledgeService |
| `aura.knowledge.item.updated.v1` | EnterpriseKnowledgeService |
| `aura.knowledge.item.approved.v1` | KnowledgeLifecycleService |
| `aura.knowledge.item.published.v1` | EnterpriseKnowledgeService |
| `aura.knowledge.item.archived.v1` | KnowledgeLifecycleService |
| `aura.knowledge.search.executed.v1` | EnterpriseSearchService |
| `aura.knowledge.recommendation.generated.v1` | KnowledgeRecommendationService |
| `aura.knowledge.memory.updated.v1` | OrganizationalMemoryService |
| `aura.knowledge.graph.updated.v1` | KnowledgeGraphService |
| `aura.knowledge.audit.completed.v1` | KnowledgeAuditService |

## Princípios de Governança e Segurança

- **LGPD & Privacy by Design**: O Grafo de Conhecimento relaciona apenas cargos, papéis e competências profissionais. Dados pessoais nominais de beneficiários nunca são incluídos.
- **RAG com Citação Obrigatória**: Toda resposta gerada via RAG obrigatoriamente cita o documento fonte oficial e seu ID.
- **Versionamento Imutável**: Nenhuma atualização sobrescreve versões anteriores — o histórico é preservado na íntegra.
- **Auditoria Criptográfica**: Assinatura SHA-256 em todas as operações de conhecimento.

## Consequências

- Estabelece a **Fase IX — Gestão Corporativa do Conhecimento e Memória Institucional** do Projeto Aura
- O Instituto Ser Melhor passa a ter uma base de conhecimento semântica, pesquisável e auditável em tempo real
- A memória organizacional é preservada contra perda de conhecimento por rotação de equipes ou término de projetos
- Pesquisa por linguagem natural com RAG agiliza o acesso a POPs, normas e protocolos em operações de campo
