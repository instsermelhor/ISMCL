import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { RecordAttendanceDto, AppointmentStatus } from '../dto/scheduling.dto';
import { SchedulingService } from './scheduling.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AttendanceRecord {
  recordId: string;
  appointmentId: string;
  beneficiaryId: string;
  professionalId: string;
  caseId?: string;
  status: AppointmentStatus;
  checkInAt?: string;
  startedAt?: string;
  finishedAt?: string;
  effectiveDurationMinutes?: number;
  justification?: string;
  ehrIntegrated: boolean;
  caseIntegrated: boolean;
  recordedAt: string;
}

/**
 * AttendanceControlService — Controle de Presença e Registro do Atendimento
 *
 * Funcionalidades:
 * - Check-in do beneficiário e do profissional
 * - Marcação de início e encerramento do atendimento
 * - Registro de faltas, cancelamentos e abandonos com justificativa
 * - Integração automática ao Prontuário Eletrônico (EHR) e Gestão de Casos
 * - Publicação do evento CloudEvents `aura.scheduling.attendance.recorded.v1`
 *
 * Referências: P135 AECMP (Gestão de Casos), P136 AIEHSR (Prontuário), P137 AISTCOP Etapa 9
 */
@Injectable()
export class AttendanceControlService {
  private readonly logger = new Logger(AttendanceControlService.name);
  private readonly records = new Map<string, AttendanceRecord>();

  constructor(
    private readonly schedulingService: SchedulingService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Realiza o check-in do beneficiário ao chegar para o atendimento.
   */
  async checkIn(appointmentId: string, tenantId = 'default'): Promise<AttendanceRecord> {
    const apt = this.schedulingService.findOrThrow(appointmentId);
    if (apt.status !== AppointmentStatus.CONFIRMED && apt.status !== AppointmentStatus.PENDING) {
      throw new BadRequestException('Check-in disponível apenas para agendamentos pendentes ou confirmados.');
    }

    const existingRecord = [...this.records.values()].find((r) => r.appointmentId === appointmentId);
    if (existingRecord) return existingRecord;

    const recordId = randomUUID();
    const now = new Date().toISOString();

    const record: AttendanceRecord = {
      recordId,
      appointmentId,
      beneficiaryId: apt.beneficiaryId,
      professionalId: apt.professionalId,
      caseId: apt.caseId,
      status: AppointmentStatus.IN_PROGRESS,
      checkInAt: now,
      ehrIntegrated: false,
      caseIntegrated: false,
      recordedAt: now,
    };

    this.records.set(recordId, record);
    this.logger.log(`[Attendance] ✅ Check-in realizado para agendamento ${apt.sequentialCode}`);

    return record;
  }

  /**
   * Registra o encerramento e o resultado do atendimento.
   */
  async recordAttendance(dto: RecordAttendanceDto, tenantId = 'default'): Promise<AttendanceRecord> {
    const apt = this.schedulingService.findOrThrow(dto.appointmentId);
    const now = new Date().toISOString();

    const existingRecord = [...this.records.values()].find((r) => r.appointmentId === dto.appointmentId);

    const recordId = existingRecord?.recordId ?? randomUUID();
    const record: AttendanceRecord = {
      ...(existingRecord ?? {
        recordId,
        appointmentId: dto.appointmentId,
        beneficiaryId: apt.beneficiaryId,
        professionalId: apt.professionalId,
        caseId: apt.caseId,
        checkInAt: now,
        recordedAt: now,
      }),
      status: dto.status,
      finishedAt: now,
      effectiveDurationMinutes: dto.effectiveDurationMinutes,
      justification: dto.justification,
      // Sinaliza integração automática com EHR e Gestão de Casos
      ehrIntegrated: dto.status === AppointmentStatus.COMPLETED,
      caseIntegrated: dto.status === AppointmentStatus.COMPLETED,
    } as AttendanceRecord;

    this.records.set(recordId, record);

    this.logger.log(
      `[Attendance] 📋 Atendimento ${apt.sequentialCode} registrado como ${dto.status} ` +
        (dto.status === AppointmentStatus.COMPLETED ? '✅' : '⚠️'),
    );

    await this.eventBus.publish(
      'aura.scheduling.attendance.recorded.v1',
      {
        recordId,
        appointmentId: dto.appointmentId,
        beneficiaryId: apt.beneficiaryId,
        professionalId: apt.professionalId,
        caseId: apt.caseId,
        status: dto.status,
        finishedAt: now,
        ehrIntegrated: record.ehrIntegrated,
        caseIntegrated: record.caseIntegrated,
      },
      tenantId,
      { subject: dto.appointmentId },
    );

    return record;
  }

  getRecordByAppointment(appointmentId: string): AttendanceRecord | undefined {
    return [...this.records.values()].find((r) => r.appointmentId === appointmentId);
  }
}
