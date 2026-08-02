import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { CertificationEvidenceService } from './services/certification-evidence.service';
import { EnterpriseReadinessService } from './services/enterprise-readiness.service';
import { ProductionCertificationService } from './services/production-certification.service';
import { FunctionalValidationService } from './services/functional-validation.service';
import { NonfunctionalValidationService } from './services/nonfunctional-validation.service';
import { ComplianceCertificationService } from './services/compliance-certification.service';
import { ReleaseGovernanceService } from './services/release-governance.service';
import { DeploymentApprovalService } from './services/deployment-approval.service';
import { ProductionRiskAssessmentService } from './services/production-risk-assessment.service';
import { EnterpriseReadinessDashboardService } from './services/enterprise-readiness-dashboard.service';

// Controller
import { EnterpriseReadinessController } from './controllers/enterprise-readiness.controller';

/**
 * EnterpriseReadinessModule — Prompt 163 (ERCP)
 *
 * Enterprise Readiness, Certification & Production Governance Platform
 * (Fase XIII — Instituto Ser Melhor).
 *
 * Nenhum módulo, API ou microsserviço pode ir para produção sem
 * aprovação formal baseada em evidências técnicas, funcionais,
 * regulatórias e institucionais emitidas por este módulo.
 *
 * Integra-se com: PlatformLifecycleModule (P162),
 * GovernanceComplianceModule (P161), MissionIntelligenceModule (P160).
 */
@Module({
  imports: [EventBusModule],
  controllers: [EnterpriseReadinessController],
  providers: [
    CertificationEvidenceService,
    EnterpriseReadinessService,
    ProductionCertificationService,
    FunctionalValidationService,
    NonfunctionalValidationService,
    ComplianceCertificationService,
    ReleaseGovernanceService,
    DeploymentApprovalService,
    ProductionRiskAssessmentService,
    EnterpriseReadinessDashboardService,
  ],
  exports: [
    CertificationEvidenceService,
    EnterpriseReadinessService,
    ComplianceCertificationService,
    ReleaseGovernanceService,
    DeploymentApprovalService,
  ],
})
export class EnterpriseReadinessModule {}
