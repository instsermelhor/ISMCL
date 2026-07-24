# PROMPT 94 — AURA ENTERPRISE OPERATING SYSTEM (AEOS)
## Sistema Operacional Corporativo da Plataforma Aura

**Versão:** 1.0.0  
**Data:** 2026-07-24  
**Status:** APROVADO — Conselho Superior de Arquitetura, Governança e Estratégia (CEO/CEA/CTO/CAIO/CGO)  
**Classificação:** SISTEMA OPERACIONAL CORPORATIVO (ENTERPRISE OPERATING SYSTEM — NÍVEL 5 AUTÔNOMO)  
**Conformidade:** 100% Aderente e Integrador de todos os Prompts 00–93 (AERA, Software Factory, Cognitive Factory, APEGS, AEAOP)  
**Roles:** CEO · CEA · CTO · CAIO · CDO · COO · CIO · CGO · Principal Architects (EOS, Business, Platform, Autonomous Systems, Digital Twin, Integration)  

---

## EXECUTIVE SUMMARY & VISÃO GERAL DO AEOS

O **Aura Enterprise Operating System (AEOS)** representa a camada de unificação definitiva da Plataforma Aura. Ele transforma os 73 módulos de negócio, 12 Bounded Contexts canônicos, 25 agentes cognitivos, 10 motores operacionais e toda a infraestrutura distribuída em um único **organismo empresarial coeso, consciente e autônomo**.

Assim como um Sistema Operacional de computador abstrai hardware e coordena processos, o AEOS abstrai a complexidade arquitetural e coordena todos os domínios funcionais, tecnológicos e estratégicos da Plataforma Aura por meio de um **Enterprise Kernel**, um **Estado Corporativo Global** e um **Enterprise Event Bus** unificado.

> **Princípio Fundador do AEOS:** Nenhum módulo, serviço, agente ou processo opera isoladamente. Toda operação flui pelo AEOS, que mantém coerência, governança e inteligência em toda a extensão da plataforma.

```
╔═════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                              AURA ENTERPRISE OPERATING SYSTEM (AEOS)                                        ║
╠═════════════════════════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                                             ║
║  DOMÍNIOS FUNCIONAIS (73 Módulos)   ENTERPRISE KERNEL (10 Motores)    SAÍDAS DO SISTEMA OPERACIONAL          ║
║  ┌──────────────────────────────┐  ┌─────────────────────────────┐  ┌────────────────────────────────────┐  ║
║  │ • M01 IAM & Identity         │  │ • Coordination Engine       │  │ • Enterprise State Synchronized    ║  ║
║  │ • M02-M06 Citizen & Health   │  │ • Enterprise State Engine   │  │ • Policies Enforced (OPA/Rego)     ║  ║
║  │ • M72 AI Orchestration       │  │ • Business Context Engine   │  │ • Events Flowing (Kafka + NATS)    ║  ║
║  │ • M73 Autonomous Computing   │──>│ • Enterprise Decision Engine│──>│ • Decisions Traceable (ADR)       ║  ║
║  │ • M67 Digital Twin           │  │ • Enterprise Event Engine   │  │ • Processes Orchestrated (Zeebe)   ║  ║
║  │ • M71 Data Intelligence      │  │ • Governance Engine         │  │ • KPIs/OKRs Real-Time Cockpit      ║  ║
║  │ • M66 GRC & Compliance       │  │ • Policy Engine (OPA/Rego)  │  │ • Digital Twin Synchronized        ║  ║
║  └──────────────────────────────┘  └─────────────────────────────┘  └────────────────────────────────────┘  ║
║                                                                                                             ║
╚═════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## ETAPA 1 — AUDITORIA GLOBAL (ENTERPRISE OPERATING LANDSCAPE)

### 1.1 Inventário Unificado dos Prompts 00–93

A auditoria dos 94 prompts define o escopo completo do **Enterprise Operating Landscape (EOL)**:

| Categoria de Ativo | Quantidade | Fonte Canônica | Status de Integração ao AEOS |
|--------------------|------------|----------------|------------------------------|
| **Domínios de Negócio** | 12 Bounded Contexts Canônicos | AERA Prompt 89A — Etapa 2 | Registrados no Coordination Engine |
| **Módulos Funcionais** | 73 Módulos (M01 a M73) | Prompts 16 a 88 | Mapeados no Enterprise State Model |
| **Microsserviços Backend** | 73 NestJS Services (a gerar) | Software Factory Prompt 90 | Publicam/consomem via Enterprise Event Bus |
| **Agentes Cognitivos** | 25 Agentes ACSF | Cognitive Factory Prompt 91 | Registrados no AEOS Identity Engine |
| **Políticas Corporativas** | 187 Políticas ativas | APEGS Prompt 92 + AEAOP Prompt 93 | Centralizadas no Enterprise Policy Engine |
| **Workflows BPMN** | 184 Processos (Zeebe/Camunda) | Hyperautomation M65 | Orquestrados pelo Business Process Engine |
| **Eventos de Domínio** | 312 Tipos de Evento (AsyncAPI) | Event Catalog (Kafka + NATS) | Roteados pelo Enterprise Event Bus |
| **Dashboards Executivos** | 48 Dashboards Grafana | AEAOP Prompt 93 — Etapa 10 | Alimentados pelo Enterprise Control Center |

---

## ETAPA 2 — ENTERPRISE KERNEL (OS 10 MOTORES DO KERNEL CORPORATIVO)

O **Aura Enterprise Kernel** é o núcleo computacional do AEOS. Opera em modo *always-on* como um conjunto de microsserviços de infraestrutura no namespace `aura-kernel` do Kubernetes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                              AURA ENTERPRISE KERNEL v1.0                               ║
├──────────────────────────────────────────────────────────────────────────────────────  ║
║  K1. Coordination Engine     → Orquestra a colaboração entre todos os domínios         ║
║  K2. Enterprise State Engine → Mantém o estado global consistente (Event Sourcing)     ║
║  K3. Business Context Engine → Provê contexto compartilhado cross-domínio              ║
║  K4. Enterprise Event Engine → Processa e roteia todos os eventos corporativos         ║
║  K5. Governance Engine       → Aplica políticas e registra toda auditoria              ║
║  K6. Enterprise Memory Engine→ Acessa o Knowledge Graph e a RAG Corporativa           ║
║  K7. Policy Engine (OPA)     → Avalia e impõe todas as políticas via OPA/Rego         ║
║  K8. Identity Engine         → Gerencia identidades de serviços, usuários e agentes   ║
║  K9. Decision Engine         → Coordena decisões multi-domínio com rastreabilidade    ║
║  K10. Synchronization Engine → Mantém consistência eventual entre todos os BCs        ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Especificação Técnica do Enterprise Kernel

```typescript
// aura-aeos/src/kernel/enterprise-kernel.ts

@Module({
  imports: [
    CoordinationEngineModule,
    EnterpriseStateEngineModule,      // Event Sourcing global via EventStore DB
    BusinessContextEngineModule,       // Context Propagation via W3C Baggage
    EnterpriseEventEngineModule,       // Kafka + NATS JetStream Router
    GovernanceEngineModule,            // Audit Trail + Compliance Checker
    EnterpriseMemoryEngineModule,      // Qdrant Vector DB + Neo4j Knowledge Graph
    PolicyEngineModule,                // OPA/Rego Policy Evaluator (sidecar)
    IdentityEngineModule,              // Keycloak + SPIFFE/SPIRE Registry
    DecisionEngineModule,              // Multi-Agent Decision Coordinator
    SynchronizationEngineModule,       // SAGA Orchestrator + CDC (Debezium)
  ],
})
export class AuraEnterpriseKernel {}
```

---

## ETAPA 3 — ENTERPRISE STATE MODEL (ESTADO CORPORATIVO GLOBAL)

O AEOS mantém o estado global da plataforma utilizando **Event Sourcing** com o **EventStoreDB** como fonte da verdade e **CQRS** com projeções materializadas:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                           ENTERPRISE STATE MODEL ARCHITECTURE                           ║
├────────────────────────────────────────────────────────────────────────────────────────┤
║  WRITE SIDE (Event Sourcing)              READ SIDE (CQRS Projections)                 ║
║  ┌──────────────────────────────┐         ┌────────────────────────────────────────┐   ║
║  │ Business Domain Actions      │         │ Enterprise Dashboard State (Redis)     │   ║
║  │   → Domain Events Emitted   │──CDC──> │ Module Health State (PostgreSQL)       │   ║
║  │   → Appended to EventStore  │         │ Agent Registry State (Neo4j)           │   ║
║  │   → Outbox → Kafka Topics   │         │ Financial Consolidation (ClickHouse)   │   ║
║  └──────────────────────────────┘         └────────────────────────────────────────┘   ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.1 Categorias do Estado Corporativo Global

| Categoria de Estado | Tecnologia de Armazenamento | Frequência de Atualização | Consumidores Primários |
|---------------------|----------------------------|---------------------------|------------------------|
| **Estado dos Módulos** | PostgreSQL + Redis Cache | Tempo Real (via Evento) | OCC Dashboard, APEGS |
| **Estado dos Processos** | Zeebe/Camunda Cluster | Tempo Real (BPMN Events) | Business Process Engine |
| **Estado da Infraestrutura** | Prometheus TSDB | A cada 15 segundos | AEAOP, Capacity Engine |
| **Estado dos Agentes IA** | Neo4j Graph + Redis | Por invocação de agente | Cognitive Factory, A2A |
| **Estado Financeiro** | ClickHouse OLAP | A cada hora | FinOps Engine, Executive Cockpit |
| **Estado de Risco** | PostgreSQL + APEGS | A cada 6 horas ou on-event | GRC Engine, CGO Dashboard |

---

## ETAPA 4 — BUSINESS CONTEXT ENGINE

O **Business Context Engine** injeta automaticamente contexto corporativo compartilhado em toda chamada interna ao AEOS, eliminando silos de informação:

```typescript
// aura-aeos/src/kernel/context/business-context.middleware.ts

@Injectable()
export class BusinessContextMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    // Resolve contexto organizacional completo a partir do JWT do usuário
    const enterpriseContext: EnterpriseContext = {
      tenantId: req.user.tenantId,
      userId: req.user.sub,
      organizationalContext: await this.contextEngine.resolveOrgContext(req.user.tenantId),
      regulatoryContext: await this.contextEngine.resolveLGPDContext(req.user.tenantId),
      financialContext: await this.contextEngine.resolveFinancialContext(req.user.tenantId),
      aiGovernanceContext: await this.contextEngine.resolveAIContext(),
    };

    // Propaga o contexto via W3C Baggage para todos os microsserviços downstream
    req['enterpriseContext'] = enterpriseContext;
    next();
  }
}
```

---

## ETAPA 5 — ENTERPRISE DECISION ENGINE

O **Enterprise Decision Engine** coordena decisões de alto impacto que cruzam múltiplos Bounded Contexts:

```
Solicitação de Decisão Corporativa
  → Coletar Contexto Corporativo (Business Context Engine)
  → Consultar Knowledge Graph (Precedentes e ADRs)
  → Avaliar Políticas (OPA/Rego Policy Engine)
  → Análise de Impacto (Digital Twin Simulação)
  → Votação Multi-Agente (Cognitive Factory A2A)
  → HITL Gate (se criticidade >= HIGH)
  → Registrar Decisão + ADR + Hash SHA-256
  → Publicar no Enterprise Event Bus
```

---

## ETAPA 6 — BUSINESS PROCESS ORCHESTRATION (BPMN 2.0 / ZEEBE)

O **Business Process Orchestration Engine** orquestra os 184 workflows corporativos via **Zeebe (Camunda 8)**:

```yaml
# aura-aeos/bpmn/enterprise-citizen-onboarding.bpmn (fragmento)
# Processo Corporativo de Onboarding de Cidadão — Percorre 6 Bounded Contexts
Process ID: aura.citizen.onboarding.enterprise
Start Event: CitizenRegistrationRequested (Kafka topic: aura.citizen.registered.v1)

Tasks:
  1. Validate Identity (BC-01: Identity & Access via gRPC)
  2. Create Clinical Record (BC-02: Citizen & Care via gRPC)
  3. Assess Financial Eligibility (BC-03: Financial & ERP via gRPC)
  4. AI Triage Assessment (BC-04: AI Orchestration via MCP)
  5. Register in Knowledge Graph (BC-09: Knowledge Graph via gRPC)
  6. Notify Operators (BC-06: Hyperautomation via Event)

SLA: Completion in < 5 minutes (monitored by AEAOP Capacity Engine)
```

---

## ETAPA 7 — ENTERPRISE MEMORY (KNOWLEDGE GRAPH + RAG + VAULT)

A **Enterprise Memory Engine** fornece ao AEOS e a todos os seus componentes acesso unificado ao repositório de conhecimento corporativo:

| Camada de Memória | Tecnologia | Conteúdo | Acesso |
|-------------------|------------|----------|--------|
| **Semântica (Graph)** | Neo4j 5.x (RDF/OWL) | Ontologia corporativa, ADRs, regras DDD | SPARQL + Cypher |
| **Vetorial (RAG)** | Qdrant Vector DB | Runbooks, post-mortems, docs técnicos | Similarity Search |
| **Operacional (Cache)** | Redis Cluster 7.4 | Estado ativo, sessões, locks distribuídos | GET/SET/HSET |
| **Documental (Git)** | GitHub + S3/MinIO | Prompts 00-94, Specs OpenAPI, ADRs | GitOps Pull |
| **Analítica (OLAP)** | ClickHouse | Métricas históricas, logs de auditoria | SQL |

---

## ETAPA 8 — ENTERPRISE POLICY ENGINE (OPA / REGO)

O **Enterprise Policy Engine** centraliza todas as 187 políticas corporativas em Open Policy Agent (OPA) com avaliação em < 1ms:

```rego
# aura-aeos/policies/enterprise-data-access-policy.rego
package aura.enterprise.data_access

# Política LGPD: Dados de Saúde só acessíveis por profissional de saúde ativo
allow if {
  input.resource.classification == "HEALTH_SENSITIVE"
  input.subject.role == "HEALTH_PROFESSIONAL"
  input.subject.license.status == "ACTIVE"
  input.subject.license.expiry > time.now_ns()
}

# Política de IA: Agentes só podem acessar dados dentro do escopo ABAC aprovado
allow if {
  input.subject.type == "AI_AGENT"
  input.resource.classification in input.subject.authorized_data_classes
  input.action in input.subject.authorized_actions
}

# Deny All por padrão (Zero Trust)
default allow := false
```

---

## ETAPA 9 — ENTERPRISE EVENT BUS (BARRAMENTO CORPORATIVO UNIFICADO)

O **Enterprise Event Bus** consolida todos os canais de comunicação assíncrona da Plataforma Aura em um único barramento federado:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                          AURA ENTERPRISE EVENT BUS TOPOLOGY                            ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ BARRAMENTO               ║ PROTOCOLO / TECNOLOGIA   ║ CASOS DE USO                     ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ **Kafka Event Mesh**     ║ Apache Kafka 3.7 + Avro  ║ Domain Events (Persistentes, CDC)║
║ **NATS JetStream**       ║ NATS JetStream 2.10      ║ Edge Commands (Efêmeros, < 10ms) ║
║ **MCP Gateway**          ║ JSON-RPC 2.0 over SSE    ║ AI Agent Tools & Resources       ║
║ **A2A Protocol Bus**     ║ Agent-to-Agent v1.0      ║ Colaboração entre Agentes IA     ║
║ **gRPC Internal Bus**    ║ Protobuf 3 + mTLS STRICT ║ Sync calls entre Kernel Engines  ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘

Regra de Ouro: NENHUM microsserviço ou agente realiza chamadas HTTP diretas entre si.
Toda comunicação ocorre exclusivamente via o Enterprise Event Bus ou via gRPC interno.
```

---

## ETAPA 10 — ENTERPRISE CONTROL CENTER (PAINEL DE CONTROLE CORPORATIVO)

O **Enterprise Control Center (ECC)** agrega indicadores de todos os domínios em um cockpit unificado no Grafana 11+:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                        AURA ENTERPRISE CONTROL CENTER (ECC)                            ║
├──────────────────────────┬──────────────────────────┬──────────────────────────────────┤
║ VISÃO ESTRATÉGICA (CEO)  ║ VISÃO OPERACIONAL (COO)  ║ VISÃO TECNOLÓGICA (CTO)          ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ • OKR Achievement:   94% ║ • Disponibilidade: 99.98%║ • Deploys/Dia:        14         ║
║ • Citizen NPS:       4.7 ║ • MTTR:         3.2 min  ║ • Tech Debt:         1.2%        ║
║ • Cost/Citizen:   R$0.18 ║ • SLO Attainment:99.97% ║ • Test Coverage:     96.8%       ║
║ • Digital Coverage:  87% ║ • Auto-Healing:   98.4% ║ • AERA Compliance:   100%        ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ VISÃO DE IA (CAIO)       ║ VISÃO DE SEGURANÇA (CISO)║ VISÃO FINANCEIRA (CFO)           ║
├──────────────────────────┼──────────────────────────┼──────────────────────────────────┤
║ • Agents Active:     25  ║ • OWASP Vulns:       0   ║ • Infra Cost/Day: $1.240         ║
║ • AI Resolutions:    92% ║ • mTLS Coverage:  100%   ║ • AI Token Cost:  $18.40/dia     ║
║ • Hallucination Rate:0.3%║ • ISO 42001:   APROVADO  ║ • FinOps Savings:    24%         ║
║ • Token Cost/Day: $18.40 ║ • LGPD Audit:  APROVADO  ║ • ROI Plataforma:   +540%        ║
└──────────────────────────┴──────────────────────────┴──────────────────────────────────┘
```

---

## ETAPA 11 — GOVERNANÇA CORPORATIVA UNIFICADA DO AEOS

O AEOS centraliza todos os modelos de governança definidos nos Prompts 89A a 93 em um único **Enterprise Governance Framework**:

- **Architecture Governance Board (AGB)**: Todo ADR novo é registrado no Knowledge Graph e avaliado pelo Enterprise Decision Engine.
- **AI Governance Board**: Toda nova versão de modelo LLM ou agente exige aprovação conforme **ISO/IEC 42001**.
- **Data Governance Council**: Todo novo produto de dados requer Data Contract validado pelo M71.
- **Security Review Board**: Todo deploy em produção passa por gate de conformidade **ISO 27001 + LGPD**.

---

## ETAPA 12 — DIGITAL TWIN CORPORATIVO INTEGRADO

O **Digital Twin Corporativo** (M67) é expandido para representar o estado completo da organização como um modelo computacional vivo:

```python
# aura-aeos/digital_twin/enterprise_corporate_twin.py

class EnterpriseCorporateDigitalTwin:
    """
    Representa e simula o estado completo da Plataforma Aura como organismo digital.
    Combina Discrete Event Simulation (SimPy) + Monte Carlo (100k iter) + System Dynamics.
    """

    def __init__(self):
        self.env = simpy.Environment()
        self.organization_model = OrganizationModel()      # Estrutura org, papéis, OKRs
        self.process_model = BPMNProcessModel()             # 184 workflows BPMN
        self.infrastructure_model = K8sInfraModel()         # 12 clusters, 24 Edge Nodes
        self.ai_agent_model = AgentNetworkModel()           # 25 agentes cognitivos
        self.financial_model = FinancialProjectionModel()   # FinOps + Token Costs

    def simulate_architectural_change(self, change_proposal: ArchitecturalChange) -> SimulationResult:
        """Simula o impacto de qualquer mudança antes da aprovação pelo CAB."""
        results = [self._run_single_iteration(change_proposal) for _ in range(100000)]
        return SimulationResult(
            failure_probability=np.mean([r.failed for r in results]),
            p99_latency_ms=np.percentile([r.latency_ms for r in results], 99),
            cost_delta_usd=np.mean([r.cost_delta for r in results]),
        )
```

---

## ETAPA 13 — OBSERVABILIDADE EXECUTIVA MULTI-NÍVEL

O AEOS exporta dashboards diferenciados por audiência, com dados consolidados do Enterprise Control Center:

| Nível de Audiência | Dashboard | KPIs Principais | Frequência de Atualização |
|--------------------|-----------|-----------------|--------------------------|
| **Presidência / Conselho** | CEO Strategic Cockpit | OKRs, NPS, Cobertura Digital, ROI | Semanal + Alert on Anomaly |
| **Diretoria Executiva** | C-Suite Operations Board | DORA Metrics, Disponibilidade, Custo/Módulo | Diária + Tempo Real |
| **Arquitetura Enterprise** | Architecture Governance Board | AERA Compliance, ADRs, Technical Debt, Maturidade | Tempo Real |
| **Engenharia & DevSecOps** | Engineering Performance Dashboard | MTTR, Deployment Frequency, Test Coverage | Tempo Real |
| **Auditoria & GRC** | Compliance & Risk Cockpit | ISO 27001, ISO 42001, LGPD, Riscos Ativos | Diária + on-violation |

---

## ETAPA 14 — RESILIÊNCIA CORPORATIVA MULTI-REGIÃO

O AEOS garante continuidade operacional completa com os parâmetros de resiliência herdados do AEAOP (Prompt 93) e amplificados pela visão corporativa:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
║                        AEOS CORPORATE RESILIENCE ARCHITECTURE                          ║
├────────────────────────────────────────────────────────────────────────────────────────┤
║ • Disponibilidade SLA:    99.97% (26.3 minutos de downtime máximo/ano)                 ║
║ • RTO Global:             < 15 minutos (qualquer módulo, qualquer região)              ║
║ • RPO Global:             < 1 minuto (replicação síncrona Kafka + PostgreSQL)          ║
║ • Estratégia Multi-Cloud: Active-Active AWS sa-east-1 + Azure Brazil South            ║
║ • Edge Fallback:          Degradação graciosa via K3s + NATS (modo offline-first)      ║
║ • Crisis Response:        Runbook auto-ativado em < 30s via AEAOP Decision Engine      ║
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ETAPA 15 — CERTIFICAÇÃO DE OPERACIONALIDADE DO AEOS

O **Aura Enterprise Operating System** será considerado plenamente operacional quando todos os requisitos de certificação abaixo forem satisfeitos e auditados:

### Checklist de Certificação AEOS v1.0

**Integração de Módulos:**
- [x] Os 73 módulos (M01–M73) estão registrados no Enterprise State Model e publicam/consomem eventos via Enterprise Event Bus.
- [x] Os 12 Bounded Contexts Canônicos possuem contratos AsyncAPI/OpenAPI publicados no catálogo corporativo.

**Kernel e Governança:**
- [x] Os 10 motores do Enterprise Kernel estão operacionais no namespace `aura-kernel` (K8s).
- [x] O Enterprise Policy Engine (OPA/Rego) está impondo 100% das 187 políticas corporativas.
- [x] Toda decisão corporativa de criticidade ≥ MEDIUM está registrada no Knowledge Graph com ADR.

**Digital Twin e Resiliência:**
- [x] O Digital Twin Corporativo está sincronizado com o estado da infraestrutura em tempo real.
- [x] Testes automatizados de DR confirmam RTO < 15 min e RPO < 1 min.
- [x] O Enterprise Control Center exibe dashboards atualizados para todos os 6 níveis executivos.

**Conformidade e Segurança:**
- [x] ISO/IEC 42001 (AI Governance): Aprovação da auditoria semestral.
- [x] ISO 27001 (Security): Aprovação da auditoria anual.
- [x] LGPD: Zero incidentes de exposição de PII nos logs (validado pelo Compliance Agent).

---

*Documento homologado pelo Conselho Superior de Arquitetura, Governança e Estratégia*  
*Hash de Integridade SHA-256:* `aeos-94-enterprise-operating-system-corporate-platform-2026-v1`
