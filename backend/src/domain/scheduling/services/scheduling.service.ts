import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  CreateAppointmentDto,
  CancelAppointmentDto,
  RescheduleAppointmentDto,
  AppointmentStatus,
  AppointmentModality,
} from '../dto/scheduling.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface Appointment {
  appointmentId: string;
  sequentialCode: string;  // AGD-2026-XXXXX
  beneficiaryId: string;
  professionalId: string;
  caseId?: string;
  modality: AppointmentModality;
  status: AppointmentStatus;
  scheduledAt: string;
  durationMinutes: number;
  confirmedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  rescheduledAt?: string;
  rescheduleReason?: string;
  previousAppointmentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * SchedulingService — Serviço Central de Agendamento Assistencial
 *
 * Gerencia todo o ciclo de vida de um agendamento desde a criação até o encerramento,
 * incluindo confirmação, cancelamento, remarcação e reagendamento automático.
 *
 * Integra com o EventBus publicando CloudEvents padronizados para cada transição.
 *
 * Referências: P110 (AEWBPM Fluxo de Atendimento), P137 AISTCOP Etapas 2, 5
 */
@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  private readonly appointments = new Map<string, Appointment>();
  private sequenceNumber = 10_000;

  constructor(private readonly eventBus: EventBusService) {}

  private nextCode(): string {
    this.sequenceNumber++;
    return `AGD-${new Date().getFullYear()}-${String(this.sequenceNumber).padStart(5, '0')}`;
  }

  // ── Criação ────────────────────────────────────────────────────────────

  async create(dto: CreateAppointmentDto, tenantId = 'default'): Promise<Appointment> {
    // Verifica conflito de horário para o profissional
    for (const apt of this.appointments.values()) {
      if (
        apt.professionalId === dto.professionalId &&
        apt.status !== AppointmentStatus.CANCELLED &&
        apt.status !== AppointmentStatus.COMPLETED
      ) {
        const existingStart = new Date(apt.scheduledAt).getTime();
        const existingEnd = existingStart + apt.durationMinutes * 60_000;
        const newStart = new Date(dto.scheduledAt).getTime();
        const newEnd = newStart + dto.durationMinutes * 60_000;
        if (newStart < existingEnd && newEnd > existingStart) {
          throw new ConflictException(
            `Conflito de agenda: profissional ${dto.professionalId} já possui atendimento neste horário.`,
          );
        }
      }
    }

    const now = new Date().toISOString();
    const appointmentId = randomUUID();
    const appointment: Appointment = {
      appointmentId,
      sequentialCode: this.nextCode(),
      beneficiaryId: dto.beneficiaryId,
      professionalId: dto.professionalId,
      caseId: dto.caseId,
      modality: dto.modality,
      status: AppointmentStatus.PENDING,
      scheduledAt: dto.scheduledAt,
      durationMinutes: dto.durationMinutes,
      notes: dto.notes,
      createdAt: now,
      updatedAt: now,
    };

    this.appointments.set(appointmentId, appointment);
    this.logger.log(`[Scheduling] ✅ Agendamento criado: ${appointment.sequentialCode} — ${dto.modality}`);

    await this.eventBus.publish(
      'aura.scheduling.appointment.created.v1',
      {
        appointmentId,
        sequentialCode: appointment.sequentialCode,
        beneficiaryId: dto.beneficiaryId,
        professionalId: dto.professionalId,
        modality: dto.modality,
        scheduledAt: dto.scheduledAt,
      },
      tenantId,
      { subject: appointmentId },
    );

    return appointment;
  }

  // ── Confirmação ────────────────────────────────────────────────────────

  async confirm(appointmentId: string, tenantId = 'default'): Promise<Appointment> {
    const apt = this.findOrThrow(appointmentId);
    if (apt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Somente agendamentos PENDENTES podem ser confirmados.');
    }
    apt.status = AppointmentStatus.CONFIRMED;
    apt.confirmedAt = new Date().toISOString();
    apt.updatedAt = apt.confirmedAt;

    await this.eventBus.publish(
      'aura.scheduling.appointment.confirmed.v1',
      { appointmentId, sequentialCode: apt.sequentialCode, confirmedAt: apt.confirmedAt },
      tenantId,
      { subject: appointmentId },
    );

    return apt;
  }

  // ── Cancelamento ───────────────────────────────────────────────────────

  async cancel(dto: CancelAppointmentDto, tenantId = 'default'): Promise<Appointment> {
    const apt = this.findOrThrow(dto.appointmentId);
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(apt.status)) {
      throw new BadRequestException('Agendamento já encerrado ou cancelado.');
    }
    apt.status = AppointmentStatus.CANCELLED;
    apt.cancelledAt = new Date().toISOString();
    apt.cancelReason = dto.reason;
    apt.updatedAt = apt.cancelledAt;

    await this.eventBus.publish(
      'aura.scheduling.appointment.cancelled.v1',
      { appointmentId: dto.appointmentId, reason: dto.reason },
      tenantId,
      { subject: dto.appointmentId },
    );

    return apt;
  }

  // ── Remarcação ─────────────────────────────────────────────────────────

  async reschedule(dto: RescheduleAppointmentDto, tenantId = 'default'): Promise<Appointment> {
    const original = this.findOrThrow(dto.appointmentId);
    if ([AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED].includes(original.status)) {
      throw new BadRequestException('Não é possível remarcar um agendamento encerrado ou cancelado.');
    }

    // Cria novo agendamento derivado
    const newAptDto: CreateAppointmentDto = {
      beneficiaryId: original.beneficiaryId,
      professionalId: original.professionalId,
      caseId: original.caseId,
      modality: original.modality,
      scheduledAt: dto.newScheduledAt,
      durationMinutes: original.durationMinutes,
      notes: original.notes,
    };
    const newApt = await this.create(newAptDto, tenantId);
    newApt.previousAppointmentId = original.appointmentId;
    newApt.status = AppointmentStatus.RESCHEDULED;

    // Cancela o original
    original.status = AppointmentStatus.RESCHEDULED;
    original.rescheduledAt = new Date().toISOString();
    original.rescheduleReason = dto.reason;
    original.updatedAt = original.rescheduledAt;

    await this.eventBus.publish(
      'aura.scheduling.appointment.rescheduled.v1',
      {
        originalAppointmentId: dto.appointmentId,
        newAppointmentId: newApt.appointmentId,
        newScheduledAt: dto.newScheduledAt,
        reason: dto.reason,
      },
      tenantId,
      { subject: dto.appointmentId },
    );

    return newApt;
  }

  // ── Utilitários ────────────────────────────────────────────────────────

  findOrThrow(appointmentId: string): Appointment {
    const apt = this.appointments.get(appointmentId);
    if (!apt) throw new NotFoundException(`Agendamento ${appointmentId} não encontrado.`);
    return apt;
  }

  findByProfessional(professionalId: string): Appointment[] {
    return [...this.appointments.values()].filter((a) => a.professionalId === professionalId);
  }

  findByBeneficiary(beneficiaryId: string): Appointment[] {
    return [...this.appointments.values()].filter((a) => a.beneficiaryId === beneficiaryId);
  }
}
