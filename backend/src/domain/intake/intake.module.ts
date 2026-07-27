import { Module } from '@nestjs/common';
import { IntakeController } from './controllers/intake.controller';
import { WelcomeService } from './services/welcome.service';
import { CaseOpeningService } from './services/case-opening.service';
import { InitialCarePlanService } from './services/initial-care-plan.service';
import { CrisisDetectionEngine } from './engines/crisis-detection.engine';
import { PriorityClassificationEngine } from './engines/priority-classification.engine';
import { ReferralRecommendationEngine } from './engines/referral-recommendation.engine';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * IntakeModule — Módulo de Acolhimento, Triagem e Admissão de Casos (AIWSP)
 *
 * Integra:
 * - WelcomeService
 * - CaseOpeningService
 * - InitialCarePlanService
 * - CrisisDetectionEngine
 * - PriorityClassificationEngine
 * - ReferralRecommendationEngine
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P134 (AIWSP)
 */
@Module({
  imports: [EventBusModule],
  controllers: [IntakeController],
  providers: [
    WelcomeService,
    CaseOpeningService,
    InitialCarePlanService,
    CrisisDetectionEngine,
    PriorityClassificationEngine,
    ReferralRecommendationEngine,
    PrismaService,
  ],
  exports: [
    WelcomeService,
    CaseOpeningService,
    InitialCarePlanService,
    CrisisDetectionEngine,
    PriorityClassificationEngine,
    ReferralRecommendationEngine,
  ],
})
export class IntakeModule {}
