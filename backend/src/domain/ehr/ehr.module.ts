import { Module } from '@nestjs/common';
import { EhrController } from './controllers/ehr.controller';
import { ElectronicHealthRecordService } from './services/electronic-health-record.service';
import { ClinicalNotesService } from './services/clinical-notes.service';
import { ClinicalTimelineService } from './services/clinical-timeline.service';
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
 * - FhirAdapter (HL7 FHIR R4)
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P136 (AIEHSR)
 */
@Module({
  imports: [EventBusModule],
  controllers: [EhrController],
  providers: [
    ElectronicHealthRecordService,
    ClinicalNotesService,
    ClinicalTimelineService,
    FhirAdapter,
    PrismaService,
  ],
  exports: [
    ElectronicHealthRecordService,
    ClinicalNotesService,
    ClinicalTimelineService,
    FhirAdapter,
  ],
})
export class EhrModule {}
