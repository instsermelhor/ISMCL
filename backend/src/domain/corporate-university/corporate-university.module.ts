import { Module } from '@nestjs/common';
import { CorporateUniversityController } from './controllers/corporate-university.controller';
import { CorporateUniversityService } from './services/corporate-university.service';
import { AssessmentCertificationService } from './services/assessment-certification.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * CorporateUniversityModule — Universidade Corporativa, LMS, Gestão de Competências e Certificações Digitais (ACU-LMS)
 *
 * Integra:
 * - CorporateUniversityService (Catálogo LMS + Matrículas + Trilhas Adaptativas por Papel)
 * - AssessmentCertificationService (Avaliações Automáticas + Certificados Digitais com Assinatura SHA-256 e QR Code)
 *
 * Referências: P146 ACU-LMS
 */
@Module({
  imports: [EventBusModule],
  controllers: [CorporateUniversityController],
  providers: [
    CorporateUniversityService,
    AssessmentCertificationService,
  ],
  exports: [
    CorporateUniversityService,
    AssessmentCertificationService,
  ],
})
export class CorporateUniversityModule {}
