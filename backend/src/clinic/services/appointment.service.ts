import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly db: PrismaService,
    private readonly audit: AuditService
  ) {}

  /**
   * Agendamento Padrão - com validação de Overbooking
   */
  async scheduleAppointment(data: {
    beneficiaryId: string;
    professionalId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    type: string;
    modality: string;
    projectId?: string;
    resourceRoomId?: string;
    adminId: string;
  }) {
    // 1. Pessimistic Locking (simulado por verificação de conflito atômica no banco)
    // Verifica se o profissional já tem agenda no horário
    const profConflict = await this.db.appointment.findFirst({
      where: {
        professionalId: data.professionalId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        OR: [
          {
            scheduledStart: { lt: data.scheduledEnd },
            scheduledEnd: { gt: data.scheduledStart }
          }
        ]
      }
    });

    if (profConflict) {
      throw new ConflictException('O profissional já possui um agendamento neste horário.');
    }

    // 2. Verifica Conflito de Sala Física
    if (data.resourceRoomId && data.modality !== 'ONLINE') {
      const roomConflict = await this.db.appointment.findFirst({
        where: {
          resourceRoomId: data.resourceRoomId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          OR: [
            {
              scheduledStart: { lt: data.scheduledEnd },
              scheduledEnd: { gt: data.scheduledStart }
            }
          ]
        }
      });

      if (roomConflict) {
        throw new ConflictException('A sala selecionada já está ocupada neste horário.');
      }
    }

    // 3. Cria Agendamento
    const appointment = await this.db.appointment.create({
      data: {
        beneficiaryId: data.beneficiaryId,
        professionalId: data.professionalId,
        scheduledStart: data.scheduledStart,
        scheduledEnd: data.scheduledEnd,
        type: data.type,
        modality: data.modality,
        projectId: data.projectId,
        resourceRoomId: data.resourceRoomId,
        status: 'SCHEDULED',
        meetingLink: data.modality === 'ONLINE' ? `https://meet.institutosermelhor.org/${crypto.randomUUID()}` : null
      }
    });

    // 4. Log de Auditoria
    await this.audit.logStrict({
      actorId: data.adminId,
      portalOrigin: 'ADMIN',
      actionType: 'CREATE',
      targetEntity: 'APPOINTMENT',
      targetEntityId: appointment.id,
      metadata: { action: 'SCHEDULED_APPOINTMENT' }
    });

    return appointment;
  }

  /**
   * Executa Match da Fila de Espera após um Cancelamento
   */
  async matchWaitlist(cancelledAppointmentId: string) {
    const cancelled = await this.db.appointment.findUnique({ where: { id: cancelledAppointmentId } });
    if (!cancelled || cancelled.status !== 'CANCELLED') return null;

    // Busca o top 1 da fila compatível
    const topCandidate = await this.db.waitlistQueue.findFirst({
      where: { status: 'WAITING' },
      orderBy: [
        { priorityScore: 'desc' },
        { enteredAt: 'asc' }
      ]
    });

    if (topCandidate) {
      // Dispara Lógica de Notificação (Simulado)
      console.log(`[AI SCHEDULER] Vaga sugerida para Beneficiário: ${topCandidate.beneficiaryId}`);
    }
    
    return topCandidate;
  }
}
