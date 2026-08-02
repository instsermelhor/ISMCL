import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { LifecycleAuditService } from './services/lifecycle-audit.service';
import { PlatformLifecycleService } from './services/platform-lifecycle.service';
import { ArchitectureSustainabilityService } from './services/architecture-sustainability.service';
import { TechnicalDebtManagementService } from './services/technical-debt-management.service';
import { DependencyGovernanceService } from './services/dependency-governance.service';
import { TechnologyEvolutionService } from './services/technology-evolution.service';
import { ArchitectureComplianceService } from './services/architecture-compliance.service';
import { VersionManagementService } from './services/version-management.service';
import { ModernizationPlanningService } from './services/modernization-planning.service';
import { PlatformHealthAssessmentService } from './services/platform-health-assessment.service';

// Controller
import { PlatformLifecycleController } from './controllers/platform-lifecycle.controller';

/**
 * PlatformLifecycleModule — Prompt 162 (EPLM)
 *
 * Enterprise Platform Lifecycle Management, Architecture Sustainability
 * & Technology Evolution Platform (Fase XII — Instituto Ser Melhor).
 *
 * Integra-se com: GovernanceComplianceModule (P161), MissionIntelligenceModule (P160),
 * ArchitectureGovernanceModule (P148), UnifiedOperationsModule (P156).
 */
@Module({
  imports: [EventBusModule],
  controllers: [PlatformLifecycleController],
  providers: [
    LifecycleAuditService,
    PlatformLifecycleService,
    ArchitectureSustainabilityService,
    TechnicalDebtManagementService,
    DependencyGovernanceService,
    TechnologyEvolutionService,
    ArchitectureComplianceService,
    VersionManagementService,
    ModernizationPlanningService,
    PlatformHealthAssessmentService,
  ],
  exports: [
    LifecycleAuditService,
    PlatformLifecycleService,
    PlatformHealthAssessmentService,
    TechnicalDebtManagementService,
    VersionManagementService,
  ],
})
export class PlatformLifecycleModule {}
