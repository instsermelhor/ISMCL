import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  BeneficiarySearchDto,
  UpdateBeneficiaryDto,
  BeneficiaryResponsePayload,
  TimelineEventDto,
} from '../dto/beneficiary.dto';

const MCSI_LEVEL_4_ROLES = new Set([
  'SUPER_USER_UNIVERSAL',
  'SUPER_ADMIN',
  'ADMIN',
  'GESTOR',
  'DIRECTOR',
  'DPO',
]);

@Injectable()
export class BeneficiaryService {
  private readonly logger = new Logger(BeneficiaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Verifica se o papel do usuário possui permissão para visualizar registros MCSI-4.
   */
  hasMcsiLevel4Permission(role?: string): boolean {
    if (!role) return false;
    return MCSI_LEVEL_4_ROLES.has(role.toUpperCase());
  }

  /**
   * Busca paginada de beneficiários com enforcement de MCSI Nível 4 (GAP-P1-01).
   */
  async search(
    dto: BeneficiarySearchDto,
    actorRole: string,
    tenantId = 'default',
  ): Promise<{ data: BeneficiaryResponsePayload[]; total: number; page: number; limit: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const canSeeMcsi4 = this.hasMcsiLevel4Permission(actorRole);

    const where: any = {};

    if (dto.name) {
      where.fullName = { contains: dto.name, mode: 'insensitive' };
    }

    if (dto.cpf) {
      where.documentCpf = { contains: dto.cpf };
    }

    if (dto.status) {
      where.status = dto.status;
    }

    // Regra MCSI Nível 4: se o usuário não tem permissão elevada, esconde beneficiários com sensitivityLevel = 4
    if (!canSeeMcsi4) {
      where.OR = [
        { protectedProfile: null },
        { protectedProfile: { sensitivityLevel: { lt: 4 } } },
      ];
    } else if (dto.mcsiLevel !== undefined) {
      where.protectedProfile = { sensitivityLevel: dto.mcsiLevel };
    }

    const [items, total] = await Promise.all([
      this.prisma.beneficiary.findMany({
        where,
        skip,
        take: limit,
        include: {
          protectedProfile: {
            select: {
              sensitivityLevel: true,
              specialCategory: true,
              internalCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.beneficiary.count({ where }),
    ]);

    const data: BeneficiaryResponsePayload[] = items.map((item: any) => ({
      id: item.id,
      fullName: item.fullName,
      documentCpf: canSeeMcsi4 ? item.documentCpf : this.maskCpf(item.documentCpf),
      status: item.status,
      mcsiLevel: item.protectedProfile?.sensitivityLevel ?? 0,
      specialCategory: item.protectedProfile?.specialCategory ?? undefined,
      internalCode: item.protectedProfile?.internalCode ?? undefined,
      createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
    }));

    return { data, total, page, limit };
  }

  /**
   * Busca um beneficiário por ID com proteção MCSI-4 (retorna 404 se não autorizado).
   */
  async findById(
    id: string,
    actorRole: string,
    actorId?: string,
  ): Promise<BeneficiaryResponsePayload> {
    const beneficiary = await this.prisma.beneficiary.findUnique({
      where: { id },
      include: {
        protectedProfile: {
          select: {
            sensitivityLevel: true,
            specialCategory: true,
            internalCode: true,
          },
        },
      },
    });

    if (!beneficiary) {
      throw new NotFoundException(`Beneficiário com ID ${id} não encontrado.`);
    }

    const sensitivityLevel = beneficiary.protectedProfile?.sensitivityLevel ?? 0;
    const canSeeMcsi4 = this.hasMcsiLevel4Permission(actorRole);

    // GAP-P1-01: Se for MCSI Nível 4 e o usuário não for autorizado, simula HTTP 404
    if (sensitivityLevel >= 4 && !canSeeMcsi4) {
      this.logger.warn(
        `[MCSI-4 Protection] ⛔ Acesso bloqueado para beneficiário ${id} por papel ${actorRole}. Retornando 404.`,
      );
      throw new NotFoundException(`Beneficiário com ID ${id} não encontrado.`);
    }

    return {
      id: beneficiary.id,
      fullName: beneficiary.fullName,
      documentCpf: canSeeMcsi4 ? beneficiary.documentCpf : this.maskCpf(beneficiary.documentCpf),
      status: beneficiary.status,
      mcsiLevel: sensitivityLevel,
      specialCategory: beneficiary.protectedProfile?.specialCategory ?? undefined,
      internalCode: beneficiary.protectedProfile?.internalCode ?? undefined,
      createdAt: beneficiary.createdAt instanceof Date ? beneficiary.createdAt.toISOString() : String(beneficiary.createdAt),
    };
  }

  /**
   * Atualiza dados de um beneficiário.
   */
  async update(
    id: string,
    dto: UpdateBeneficiaryDto,
    actorId: string,
    actorRole: string,
    actorName = 'System User',
    ipAddress = '0.0.0.0',
    userAgent = 'SYSTEM',
  ): Promise<BeneficiaryResponsePayload> {
    // Garante que o registro existe e que o usuário tem acesso
    await this.findById(id, actorRole, actorId);

    const updated = await this.prisma.beneficiary.update({
      where: { id },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        protectedProfile: {
          select: {
            sensitivityLevel: true,
            specialCategory: true,
            internalCode: true,
          },
        },
      },
    });

    await this.auditService.log({
      actorId,
      actorName,
      role: actorRole,
      action: 'BENEFICIARY_UPDATED',
      targetEntity: 'BENEFICIARY',
      targetEntityId: id,
      justification: `Atualização de cadastro do beneficiário ${id}`,
      ipAddress,
      userAgent,
    });

    await this.eventBus.publish(
      'aura.beneficiary.updated.v1',
      { beneficiaryId: id, updatedFields: Object.keys(dto), updatedBy: actorId },
      'default',
      { subject: id },
    );

    return {
      id: updated.id,
      fullName: updated.fullName,
      documentCpf: updated.documentCpf,
      status: updated.status,
      mcsiLevel: updated.protectedProfile?.sensitivityLevel ?? 0,
      specialCategory: updated.protectedProfile?.specialCategory ?? undefined,
      internalCode: updated.protectedProfile?.internalCode ?? undefined,
      createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : String(updated.createdAt),
    };
  }

  /**
   * Retorna a linha do tempo agregada do beneficiário.
   */
  async getTimeline(
    id: string,
    actorRole: string,
    actorId?: string,
  ): Promise<TimelineEventDto[]> {
    // Valida permissão/existência via findById
    await this.findById(id, actorRole, actorId);

    const [cases, appointments, evolutions] = await Promise.all([
      this.prisma.case.findMany({
        where: { beneficiaryId: id },
        select: { id: true, caseNumber: true, title: true, createdAt: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.findMany({
        where: { beneficiaryId: id },
        select: { id: true, scheduledAt: true, status: true, appointmentType: true },
        take: 10,
        orderBy: { scheduledAt: 'desc' },
      }),
      this.prisma.clinicalEvolution.findMany({
        where: { beneficiaryId: id },
        select: { id: true, clinicalDate: true, status: true },
        take: 10,
        orderBy: { clinicalDate: 'desc' },
      }),
    ]);

    const timeline: TimelineEventDto[] = [];

    cases.forEach((c: any) => {
      timeline.push({
        type: 'CASE',
        id: c.id,
        title: `Caso #${c.caseNumber ?? c.id}: ${c.title ?? 'Atendimento'}`,
        occurredAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : String(c.createdAt),
      });
    });

    appointments.forEach((a: any) => {
      timeline.push({
        type: 'APPOINTMENT',
        id: a.id,
        title: `Agendamento (${a.appointmentType ?? 'Geral'}) - Status: ${a.status}`,
        occurredAt: a.scheduledAt instanceof Date ? a.scheduledAt.toISOString() : String(a.scheduledAt),
      });
    });

    evolutions.forEach((e: any) => {
      timeline.push({
        type: 'EVOLUTION',
        id: e.id,
        title: `Evolução Clínica (${e.status})`,
        occurredAt: e.clinicalDate instanceof Date ? e.clinicalDate.toISOString() : String(e.clinicalDate),
      });
    });

    return timeline.sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );
  }

  private maskCpf(cpf?: string | null): string | null {
    if (!cpf) return null;
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return '***.***.***-**';
    return `${digits.slice(0, 3)}.***.***-${digits.slice(9)}`;
  }
}
