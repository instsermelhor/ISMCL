import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { AuditLogService } from '../../shared/services/audit-log.service.ts';

/**
 * SERVIÇO ADMINISTRATIVO: MOTOR DE MATCHING DE CASOS
 * Responsável por cruzar beneficiários na fila de triagem com voluntários 
 * disponíveis e capacitados, gerando um "Caso" oficial (que destrava sigilo e prontuário).
 */
@Injectable()
export class CaseMatchingService {
  constructor(
    @Inject('db') private readonly db: any, // Prisma Client Injetado
    @Inject('AuditLogService') private readonly audit: AuditLogService
  ) {}

  /**
   * Realiza o Match entre um Beneficiário (na fila de um Projeto) e um Voluntário ativo.
   */
  async createCaseMatch(
    beneficiaryId: string, 
    projectId: string, 
    volunteerId: string, 
    adminId: string,
    priorityLevel: 'NORMAL' | 'HIGH' | 'URGENT' = 'NORMAL'
  ) {
    // 1. Validar Beneficiário
    const beneficiary = await this.db.beneficiary.findUnique({ where: { id: beneficiaryId } });
    if (!beneficiary) {
      throw new NotFoundException('Beneficiário não encontrado no Cadastro Mestre.');
    }

    // 2. Validar Voluntário e sua Capacitação (Vínculo com o Projeto)
    const volunteer = await this.db.volunteer.findUnique({ 
      where: { id: volunteerId },
      include: { projects: true }
    });
    
    if (!volunteer || volunteer.status !== 'ACTIVE') {
      throw new BadRequestException('Voluntário inativo, pendente de aprovação ou não encontrado.');
    }
    
    const isAllocatedToProject = volunteer.projects.some((p: any) => p.projectId === projectId);
    if (!isAllocatedToProject) {
      throw new BadRequestException('Violação de Regra: Este profissional não está capacitado ou alocado para atuar neste projeto social específico.');
    }

    // 3. Criar o Vínculo Oficial (Caso) - Transaction
    // Isso é o que permite ao voluntário enxergar o paciente no Portal Clínico (ABAC)
    const newCase = await this.db.$transaction(async (prisma: any) => {
      
      const createdCase = await prisma.case.create({
        data: {
          beneficiaryId,
          projectId,
          status: 'ACTIVE',
          priority: priorityLevel,
          assignedVolunteers: {
            create: [{ volunteerId, role: 'PRIMARY_CLINICIAN' }]
          }
        }
      });

      // 4. Consumir a Fila de Triagem (Tirar o beneficiário da fila de espera)
      await prisma.triageQueue.deleteMany({
        where: { beneficiaryId, projectId }
      });

      return createdCase;
    });

    // 5. Trilha de Auditoria Rigorosa
    await this.audit.logStrict({
      actorId: adminId,
      portalOrigin: 'ADMIN',
      actionType: 'CREATE_CLINICAL_CASE_MATCH',
      targetEntity: 'CASE',
      targetEntityId: newCase.id,
      justification: `Match de Acolhimento realizado para o projeto ${projectId}`
    });

    return newCase;
  }
}
