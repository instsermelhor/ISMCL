import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { KnowledgeAuditService } from './services/knowledge-audit.service';
import { EnterpriseKnowledgeService } from './services/enterprise-knowledge.service';
import { InstitutionalMemoryService } from './services/institutional-memory.service';
import { KnowledgeGraphService } from './services/knowledge-graph.service';
import { SemanticSearchService } from './services/semantic-search.service';
import { DigitalPreservationService } from './services/digital-preservation.service';
import { KnowledgeLifecycleService } from './services/knowledge-lifecycle.service';
import { LessonsLearnedService } from './services/lessons-learned.service';
import { OrganizationalLearningService } from './services/organizational-learning.service';
import { KnowledgeGovernanceService } from './services/knowledge-governance.service';

// Controller
import { EnterpriseKnowledgeController } from './controllers/enterprise-knowledge.controller';

/**
 * EnterpriseKnowledgeModule — P170 EKG (Fase XX)
 *
 * Plataforma Corporativa de Governança do Conhecimento, Memória Institucional
 * e Preservação Digital (EKG).
 * Conecta o Repositório Corporativo Unificado, Memória Institucional Cronológica,
 * Knowledge Graph Corporativo, Pesquisa Semântica/RAG, Preservação Digital de Longo Prazo,
 * Governança do Ciclo de Vida Documental, Lições Aprendidas, Aprendizado Organizacional,
 * IA Semântica com Respostas Fundamentadas e Auditoria Imutável SHA-256.
 *
 * Componentes:
 * - KnowledgeAuditService           — Auditoria imutável SHA-256
 * - EnterpriseKnowledgeService      — Repositório de documentos, POPs, políticas, manuais
 * - InstitutionalMemoryService      — Memória permanente e linha do tempo cronológica
 * - KnowledgeGraphService           — Grafo corporativo com 11 tipos de nós e travessia
 * - SemanticSearchService           — Pesquisa por linguagem natural e contexto RAG
 * - DigitalPreservationService      — Preservação, retenção, hashes e cadeia de custódia
 * - KnowledgeLifecycleService       — Ciclo de vida e aprovação mandatória
 * - LessonsLearnedService           — Lições aprendidas e causas raiz
 * - OrganizationalLearningService  — Competências e Índice de Aprendizado
 * - KnowledgeGovernanceService     — IA semântica, resumos e busca fundamentada
 */
@Module({
  imports: [EventBusModule],
  providers: [
    KnowledgeAuditService,
    EnterpriseKnowledgeService,
    InstitutionalMemoryService,
    KnowledgeGraphService,
    SemanticSearchService,
    DigitalPreservationService,
    KnowledgeLifecycleService,
    LessonsLearnedService,
    OrganizationalLearningService,
    KnowledgeGovernanceService,
  ],
  controllers: [EnterpriseKnowledgeController],
  exports: [
    KnowledgeAuditService,
    EnterpriseKnowledgeService,
    InstitutionalMemoryService,
    KnowledgeGraphService,
    SemanticSearchService,
    DigitalPreservationService,
    KnowledgeLifecycleService,
    LessonsLearnedService,
    OrganizationalLearningService,
    KnowledgeGovernanceService,
  ],
})
export class EnterpriseKnowledgeModule {}
