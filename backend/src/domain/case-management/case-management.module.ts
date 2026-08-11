import { Module } from '@nestjs/common';
import { CaseManagementController } from './controllers/case-management.controller';
import { CaseManagementService } from './services/case-management.service';
import { CaseTimelineService } from './services/case-timeline.service';
import { GoalManagementService } from './services/goal-management.service';
import { MultidisciplinaryCoordinationService } from './services/multidisciplinary-coordination.service';
import { CaseAlertSchedulerService } from './services/case-alert-scheduler.service';
import { PrismaService } from '../../prisma/prisma.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * CaseManagementModule — Módulo Corporativo de Gestão de Casos (AECMP)
 *
 * Integra:
 * - CaseManagementService
 * - CaseTimelineService
 * - GoalManagementService
 * - MultidisciplinaryCoordinationService
 * - CaseAlertSchedulerService (Scheduler de Alertas de Casos — GAP-P2-05)
 *
 * Referências: P110 (AEWBPM), P123 (AEDA), P135 (AECMP), GAP-P2-05
 */
@Module({
  imports: [EventBusModule],
  controllers: [CaseManagementController],
  providers: [
    CaseManagementService,
    CaseTimelineService,
    GoalManagementService,
    MultidisciplinaryCoordinationService,
    CaseAlertSchedulerService,
    PrismaService,
  ],
  exports: [
    CaseManagementService,
    CaseTimelineService,
    GoalManagementService,
    MultidisciplinaryCoordinationService,
    CaseAlertSchedulerService,
  ],
})
export class CaseManagementModule {}
