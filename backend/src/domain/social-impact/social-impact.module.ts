import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { SocialImpactAuditService } from './services/social-impact-audit.service';
import { SocialImpactService } from './services/social-impact.service';
import { OutcomeMeasurementService } from './services/outcome-measurement.service';
import { ProgramEvaluationService } from './services/program-evaluation.service';
import { InstitutionalIndicatorsService } from './services/institutional-indicators.service';
import { ESGMetricsService } from './services/esg-metrics.service';
import { BeneficiaryEvolutionService } from './services/beneficiary-evolution.service';
import { EvidenceConsolidationService } from './services/evidence-consolidation.service';
import { AccountabilityService } from './services/accountability.service';
import { ImpactDashboardService } from './services/impact-dashboard.service';

// Controller
import { SocialImpactController } from './controllers/social-impact.controller';

/**
 * SocialImpactModule — Prompt 165 (SIIP)
 *
 * Social Impact Intelligence, Outcome Measurement & Institutional Accountability Platform
 * (Fase XV — Instituto Ser Melhor).
 *
 * Plataforma de mensuração de impacto social, avaliação de efetividade (SROI), ESG
 * e prestação de contas automatizada.
 *
 * Integra-se com: AutonomousOperationsModule (P164), EnterpriseReadinessModule (P163),
 * DecisionIntelligenceModule (P159), MissionIntelligenceModule (P160).
 */
@Module({
  imports: [EventBusModule],
  controllers: [SocialImpactController],
  providers: [
    SocialImpactAuditService,
    SocialImpactService,
    OutcomeMeasurementService,
    ProgramEvaluationService,
    InstitutionalIndicatorsService,
    ESGMetricsService,
    BeneficiaryEvolutionService,
    EvidenceConsolidationService,
    AccountabilityService,
    ImpactDashboardService,
  ],
  exports: [
    SocialImpactAuditService,
    SocialImpactService,
    ProgramEvaluationService,
    ESGMetricsService,
    AccountabilityService,
  ],
})
export class SocialImpactModule {}
