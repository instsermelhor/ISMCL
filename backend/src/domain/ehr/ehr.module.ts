import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { EhrController } from './controllers/ehr.controller';
import { ElectronicHealthRecordService } from './services/electronic-health-record.service';
import { ClinicalNotesService } from './services/clinical-notes.service';
import { ClinicalTimelineService } from './services/clinical-timeline.service';
import { EhrCryptoService } from './services/ehr-crypto.service';
import { FhirAdapter } from './fhir/fhir.adapter';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * EhrModule — Módulo do Prontuário Eletrônico Integrado (AIEHSR)
 *
 * Integra:
 * - ElectronicHealthRecordService
 * - ClinicalNotesService
 * - ClinicalTimelineService
 * - EhrCryptoService (Criptografia AES-256-GCM em Repouso)
 * - FhirAdapter (HL7 FHIR R4)
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P136 (AIEHSR)
 */
@Module({
  imports: [EventBusModule, CacheModule],
  controllers: [EhrController],
  providers: [
    ElectronicHealthRecordService,
    ClinicalNotesService,
    ClinicalTimelineService,
    EhrCryptoService,
    FhirAdapter,
    PrismaService,
  ],
  exports: [
    ElectronicHealthRecordService,
    ClinicalNotesService,
    ClinicalTimelineService,
    EhrCryptoService,
    FhirAdapter,
  ],
})
export class EhrModule {}
