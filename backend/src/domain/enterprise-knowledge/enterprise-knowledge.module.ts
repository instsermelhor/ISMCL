import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { KnowledgeAuditService } from './services/knowledge-audit.service';
import { EnterpriseKnowledgeService } from './services/enterprise-knowledge.service';
import { OrganizationalMemoryService } from './services/organizational-memory.service';
import { KnowledgeGraphService } from './services/knowledge-graph.service';
import { KnowledgeLifecycleService } from './services/knowledge-lifecycle.service';
import { SemanticKnowledgeEngineService } from './services/semantic-knowledge-engine.service';
import { EnterpriseSearchService } from './services/enterprise-search.service';
import { InstitutionalTaxonomyService } from './services/institutional-taxonomy.service';
import { KnowledgeGovernanceService } from './services/knowledge-governance.service';
import { KnowledgeRecommendationService } from './services/knowledge-recommendation.service';
import { EnterpriseKnowledgeController } from './controllers/enterprise-knowledge.controller';

/**
 * EnterpriseKnowledgeModule — Fase IX · Prompt 158 (AEKIP)
 *
 * Plataforma Corporativa de Inteligência do Conhecimento, Memória Organizacional
 * e Governança do Conhecimento da Plataforma Aura. Composta por 10 microsserviços
 * desacoplados com orientação a eventos (CloudEvents v1.0.3).
 */
@Module({
  imports: [EventBusModule],
  controllers: [EnterpriseKnowledgeController],
  providers: [
    KnowledgeAuditService,
    EnterpriseKnowledgeService,
    OrganizationalMemoryService,
    KnowledgeGraphService,
    KnowledgeLifecycleService,
    SemanticKnowledgeEngineService,
    EnterpriseSearchService,
    InstitutionalTaxonomyService,
    KnowledgeGovernanceService,
    KnowledgeRecommendationService,
  ],
  exports: [
    EnterpriseKnowledgeService,
    OrganizationalMemoryService,
    KnowledgeGraphService,
    KnowledgeLifecycleService,
    SemanticKnowledgeEngineService,
    EnterpriseSearchService,
    InstitutionalTaxonomyService,
    KnowledgeGovernanceService,
    KnowledgeRecommendationService,
    KnowledgeAuditService,
  ],
})
export class EnterpriseKnowledgeModule {}
