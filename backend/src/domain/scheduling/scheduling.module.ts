import { Module } from '@nestjs/common';
import { SchedulingController } from './controllers/scheduling.controller';
import { SchedulingService } from './services/scheduling.service';
import { TelehealthService } from './services/telehealth.service';
import { NotificationService } from './services/notification.service';
import { AttendanceControlService } from './services/attendance-control.service';
import { SmartQueueEngine } from './engines/smart-queue.engine';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * SchedulingModule — Módulo de Agenda, Teleconsulta e Orquestração de Atendimentos (AISTCOP)
 *
 * Integra:
 * - SchedulingService (ciclo de vida do agendamento)
 * - TelehealthService (salas virtuais seguras)
 * - NotificationService (multicanal: WhatsApp, E-mail, Push, SMS)
 * - AttendanceControlService (controle de presença → EHR/Casos)
 * - SmartQueueEngine (priorização SLA)
 *
 * Referências: P110 (AEWBPM), P135 AECMP, P136 AIEHSR, P137 AISTCOP
 */
@Module({
  imports: [EventBusModule],
  controllers: [SchedulingController],
  providers: [
    SchedulingService,
    TelehealthService,
    NotificationService,
    AttendanceControlService,
    SmartQueueEngine,
  ],
  exports: [
    SchedulingService,
    TelehealthService,
    NotificationService,
    AttendanceControlService,
    SmartQueueEngine,
  ],
})
export class SchedulingModule {}
