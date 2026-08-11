import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditService } from '../../../audit/audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ProfessionalSearchDto,
  UpdateProfessionalDto,
  ProfessionalResponsePayload,
  AvailabilitySlot,
} from '../dto/professional.dto';

@Injectable()
export class ProfessionalService {
  private readonly logger = new Logger(ProfessionalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Busca paginada de profissionais de saúde/atendimento.
   */
  async search(
    dto: ProfessionalSearchDto,
    tenantId = 'default',
  ): Promise<{ data: ProfessionalResponsePayload[]; total: number; page: number; limit: number }> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.name) {
      where.OR = [
        { fullName: { contains: dto.name, mode: 'insensitive' } },
        { socialName: { contains: dto.name, mode: 'insensitive' } },
      ];
    }

    if (dto.profession) {
      where.profession = dto.profession;
    }

    if (dto.specialty) {
      where.specialty = { contains: dto.specialty, mode: 'insensitive' };
    }

    if (dto.bondType) {
      where.bondType = dto.bondType;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.professional.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.professional.count({ where }),
    ]);

    const data: ProfessionalResponsePayload[] = items.map((item: any) => ({
      id: item.id,
      fullName: item.fullName,
      socialName: item.socialName,
      email: item.email,
      phone: item.phone,
      bondType: item.bondType,
      status: item.status,
      profession: item.profession,
      specialty: item.specialty,
      councilNumber: item.councilNumber,
      councilState: item.councilState,
      councilStatus: item.councilStatus,
      joinedAt: item.joinedAt instanceof Date ? item.joinedAt.toISOString() : String(item.joinedAt),
    }));

    return { data, total, page, limit };
  }

  /**
   * Detalhes de um profissional por ID.
   */
  async findById(id: string): Promise<ProfessionalResponsePayload> {
    const prof = await this.prisma.professional.findUnique({
      where: { id },
      include: {
        availabilities: true,
      },
    });

    if (!prof) {
      throw new NotFoundException(`Profissional com ID ${id} não encontrado.`);
    }

    const availabilities: AvailabilitySlot[] = (prof.availabilities ?? []).map((a: any) => ({
      id: a.id,
      dayOfWeek: a.dayOfWeek ?? null,
      startTime: a.startTime ?? null,
      endTime: a.endTime ?? null,
      isAvailable: a.isAvailable ?? true,
      notes: a.notes ?? null,
    }));

    return {
      id: prof.id,
      fullName: prof.fullName,
      socialName: prof.socialName,
      email: prof.email,
      phone: prof.phone,
      bondType: prof.bondType,
      status: prof.status,
      profession: prof.profession,
      specialty: prof.specialty,
      councilNumber: prof.councilNumber,
      councilState: prof.councilState,
      councilStatus: prof.councilStatus,
      joinedAt: prof.joinedAt instanceof Date ? prof.joinedAt.toISOString() : String(prof.joinedAt),
      availabilities,
    };
  }

  /**
   * Atualiza dados de um profissional com auditoria.
   */
  async update(
    id: string,
    dto: UpdateProfessionalDto,
    actorId: string,
    actorRole: string,
    actorName = 'System User',
    ipAddress = '0.0.0.0',
    userAgent = 'SYSTEM',
  ): Promise<ProfessionalResponsePayload> {
    await this.findById(id);

    const updated = await this.prisma.professional.update({
      where: { id },
      data: {
        ...(dto.socialName !== undefined && { socialName: dto.socialName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profession !== undefined && { profession: dto.profession }),
        ...(dto.specialty !== undefined && { specialty: dto.specialty }),
        ...(dto.councilNumber !== undefined && { councilNumber: dto.councilNumber }),
        ...(dto.councilState !== undefined && { councilState: dto.councilState }),
        ...(dto.councilStatus !== undefined && { councilStatus: dto.councilStatus }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    await this.auditService.log({
      actorId,
      actorName,
      role: actorRole,
      action: 'PROFESSIONAL_UPDATED',
      targetEntity: 'PROFESSIONAL',
      targetEntityId: id,
      justification: `Atualização de perfil do profissional ${id}`,
      ipAddress,
      userAgent,
    });

    await this.eventBus.publish(
      'aura.professional.updated.v1',
      { professionalId: id, updatedFields: Object.keys(dto), updatedBy: actorId },
      'default',
      { subject: id },
    );

    return this.findById(id);
  }

  /**
   * Consulta os horários de disponibilidade do profissional para agendamento ACTG.
   */
  async getAvailability(id: string): Promise<AvailabilitySlot[]> {
    const prof = await this.findById(id);
    return prof.availabilities ?? [];
  }
}
