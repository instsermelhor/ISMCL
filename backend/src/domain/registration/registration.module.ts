import { Module } from '@nestjs/common';
import { RegistrationController } from './controllers/registration.controller';
import { RegistrationService } from './services/registration.service';
import { DynamicFormsEngine } from './engines/dynamic-forms.engine';
import { AdaptiveQuestionnaireEngine } from './engines/adaptive-questionnaire.engine';
import { EligibilityEngine } from './engines/eligibility.engine';
import { RiskClassificationService } from './services/risk-classification.service';
import { ConsentManagementService } from './services/consent-management.service';
import { ResponsibleGuardianService } from './services/responsible-guardian.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * RegistrationModule — Módulo de Cadastro Inteligente Adaptativo (AAIRP)
 *
 * Integra:
 * - RegistrationService
 * - DynamicFormsEngine
 * - AdaptiveQuestionnaireEngine
 * - EligibilityEngine
 * - RiskClassificationService
 * - ConsentManagementService
 * - ResponsibleGuardianService
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P133 (AAIRP)
 */
@Module({
  imports: [EventBusModule],
  controllers: [RegistrationController],
  providers: [
    RegistrationService,
    DynamicFormsEngine,
    AdaptiveQuestionnaireEngine,
    EligibilityEngine,
    RiskClassificationService,
    ConsentManagementService,
    ResponsibleGuardianService,
    PrismaService,
  ],
  exports: [
    RegistrationService,
    DynamicFormsEngine,
    AdaptiveQuestionnaireEngine,
    EligibilityEngine,
    RiskClassificationService,
    ConsentManagementService,
    ResponsibleGuardianService,
  ],
})
export class RegistrationModule {}
