import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';
import { ExecutiveGovernanceAuditService } from './services/executive-governance-audit.service';
import { MissionIntelligenceService } from './services/mission-intelligence.service';
import { InstitutionalCommandCenterService } from './services/institutional-command-center.service';
import { AutonomousGovernanceOrchestratorService } from './services/autonomous-governance-orchestrator.service';
import { StrategicAlignmentService } from './services/strategic-alignment.service';
import { InstitutionalPolicyEnforcementService } from './services/institutional-policy-enforcement.service';
import { EnterpriseDecisionCoordinationService } from './services/enterprise-decision-coordination.service';
import { CrossDomainIntelligenceService } from './services/cross-domain-intelligence.service';
import { MissionPerformanceAnalyticsService } from './services/mission-performance-analytics.service';
import { InstitutionalResilienceCoordinationService } from './services/institutional-resilience-coordination.service';
import { MissionIntelligenceController } from './controllers/mission-intelligence.controller';

/**
 * MissionIntelligenceModule — Fase XI · Prompt 160 (AEMIAG)
 *
 * Plataforma Corporativa de Inteligência de Missão, Governança Autônoma e Comando
 * Institucional da Plataforma Aura. Camada suprema de comando executivo composta por
 * 10 microsserviços desacoplados com orientação a eventos (CloudEvents v1.0.3).
 */
@Module({
  imports: [EventBusModule],
  controllers: [MissionIntelligenceController],
  providers: [
    ExecutiveGovernanceAuditService,
    MissionIntelligenceService,
    InstitutionalCommandCenterService,
    AutonomousGovernanceOrchestratorService,
    StrategicAlignmentService,
    InstitutionalPolicyEnforcementService,
    EnterpriseDecisionCoordinationService,
    CrossDomainIntelligenceService,
    MissionPerformanceAnalyticsService,
    InstitutionalResilienceCoordinationService,
  ],
  exports: [
    MissionIntelligenceService,
    InstitutionalCommandCenterService,
    AutonomousGovernanceOrchestratorService,
    StrategicAlignmentService,
    InstitutionalPolicyEnforcementService,
    EnterpriseDecisionCoordinationService,
    CrossDomainIntelligenceService,
    MissionPerformanceAnalyticsService,
    InstitutionalResilienceCoordinationService,
    ExecutiveGovernanceAuditService,
  ],
})
export class MissionIntelligenceModule {}
