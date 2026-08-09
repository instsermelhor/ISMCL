import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { ContinuousAuditService } from './services/continuous-audit.service';
import { ComplianceEvidenceService } from './services/compliance-evidence.service';
import { ContinuousComplianceService } from './services/continuous-compliance.service';
import { AutonomousGovernanceService } from './services/autonomous-governance.service';
import { PolicyValidationService } from './services/policy-validation.service';
import { RegulatoryMonitoringService } from './services/regulatory-monitoring.service';
import { InstitutionalAssuranceService } from './services/institutional-assurance.service';
import { EnterpriseRiskValidationService } from './services/enterprise-risk-validation.service';
import { GovernanceRecommendationService } from './services/governance-recommendation.service';
import { GovernanceDashboardService } from './services/governance-dashboard.service';

// Controller
import { GovernanceComplianceController } from './controllers/governance-compliance.controller';
import { LgpdController } from './controllers/lgpd.controller';

// LGPD — P12
import { LgpdConsentService } from './services/lgpd-consent.service';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * GovernanceComplianceModule — Prompt 161 (AGCC)
 *
 * Plataforma de Governança Autônoma, Conformidade Contínua e Garantia Institucional
 * da Plataforma Aura (Fase XI — Instituto Ser Melhor).
 *
 * Integra-se com: MissionIntelligenceModule (P160), DecisionIntelligenceModule (P159),
 * EnterpriseKnowledgeModule (P158), DigitalTwinModule (P157),
 * UnifiedOperationsModule (P156) e ArchitectureGovernanceModule (P148).
 */
@Module({
  imports: [EventBusModule],
  controllers: [GovernanceComplianceController, LgpdController],
  providers: [
    ContinuousAuditService,
    ComplianceEvidenceService,
    ContinuousComplianceService,
    AutonomousGovernanceService,
    PolicyValidationService,
    RegulatoryMonitoringService,
    InstitutionalAssuranceService,
    EnterpriseRiskValidationService,
    GovernanceRecommendationService,
    GovernanceDashboardService,
    LgpdConsentService,
    PrismaService,
  ],
  exports: [
    ContinuousAuditService,
    ContinuousComplianceService,
    AutonomousGovernanceService,
    EnterpriseRiskValidationService,
    GovernanceDashboardService,
    LgpdConsentService,
  ],
})
export class GovernanceComplianceModule {}
