import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { AuditLogService } from '../../shared/services/audit-log.service.ts';

@Injectable()
export class CaseManagementService {
  constructor(
    @Inject('db') private readonly db: any,
    @Inject('AuditLogService') private readonly audit: AuditLogService
  ) {}

  /**
   * Abre um novo Caso Clínico/Social para um Beneficiário em um Projeto.
   */
  async openCase(data: {
    beneficiaryId: string;
    projectId: string;
    openedById: string;
    origin: string;
    reason: string;
    classification: string;
    priority: string;
  }) {
    // 1. Validar se já existe um caso ativo nesse mesmo projeto
    const activeCase = await this.db.case.findFirst({
      where: {
        beneficiaryId: data.beneficiaryId,
        projectId: data.projectId,
        status: 'ACTIVE'
      }
    });

    if (activeCase) {
      throw new BadRequestException('Este beneficiário já possui um caso ativo vinculado a este projeto social.');
    }

    // 2. Transação para criar caso e consumir a fila de triagem (se houver)
    const newCase = await this.db.$transaction(async (prisma: any) => {
      const created = await prisma.case.create({
        data: {
          beneficiaryId: data.beneficiaryId,
          projectId: data.projectId,
          status: 'ACTIVE',
          priority: data.priority,
          openedById: data.openedById,
          origin: data.origin,
          reason: data.reason,
          classification: data.classification
        }
      });

      // Se veio da triagem, remove da fila
      if (data.origin === 'TRIAGE') {
        await prisma.triageQueue.deleteMany({
          where: {
            beneficiaryId: data.beneficiaryId,
            projectId: data.projectId
          }
        });
      }

      return created;
    });

    // 3. Logar a ação na auditoria
    await this.audit.logStrict({
      actorId: data.openedById,
      portalOrigin: 'ADMIN',
      actionType: 'OPEN_CASE',
      targetEntity: 'CASE',
      targetEntityId: newCase.id,
      justification: `Abertura de caso para o beneficiário. Origem: ${data.origin}`
    });

    return newCase;
  }

  /**
   * Vincula um profissional à equipe multidisciplinar de um caso.
   */
  async assignProfessional(data: {
    caseId: string;
    professionalId: string;
    role: string;
    assignedById: string;
  }) {
    const clinicalCase = await this.db.case.findUnique({
      where: { id: data.caseId },
      include: { project: true }
    });

    if (!clinicalCase) {
      throw new NotFoundException('Caso não encontrado.');
    }

    // Validar se o profissional está ativo e capacitado (vinculado ao projeto)
    const professional = await this.db.professional.findUnique({
      where: { id: data.professionalId },
      include: { projects: true }
    });

    if (!professional || professional.status !== 'ACTIVE') {
      throw new BadRequestException('Profissional selecionado está inativo ou não cadastrado.');
    }

    const isLinkedToProject = professional.projects.some((p: any) => p.projectId === clinicalCase.projectId);
    if (!isLinkedToProject) {
      throw new BadRequestException('Violação: O profissional não está alocado para atuar no projeto correspondente a este caso.');
    }

    const assigned = await this.db.caseProfessional.create({
      data: {
        caseId: data.caseId,
        professionalId: data.professionalId,
        role: data.role
      }
    });

    // Auditoria
    await this.audit.logStrict({
      actorId: data.assignedById,
      portalOrigin: 'ADMIN',
      actionType: 'ASSIGN_PROFESSIONAL_TO_CASE',
      targetEntity: 'CASE',
      targetEntityId: data.caseId,
      justification: `Profissional ${data.professionalId} alocado como ${data.role}`
    });

    return assigned;
  }

  /**
   * Finaliza e dá alta para um caso.
   */
  async dischargeCase(data: {
    caseId: string;
    closedById: string;
    closureReason: string;
    evolutionSummary: string;
    resultsAchieved: string;
    finalInstructions: string;
  }) {
    const clinicalCase = await this.db.case.findUnique({
      where: { id: data.caseId }
    });

    if (!clinicalCase || clinicalCase.status === 'CLOSED') {
      throw new BadRequestException('Caso não existe ou já se encontra encerrado.');
    }

    const closedCase = await this.db.case.update({
      where: { id: data.caseId },
      data: {
        status: 'CLOSED',
        closedById: data.closedById,
        closedAt: new Date(),
        closureReason: data.closureReason,
        evolutionSummary: data.evolutionSummary, // Deve ser criptografado na aplicação
        resultsAchieved: data.resultsAchieved,
        finalInstructions: data.finalInstructions
      }
    });

    // Desativar todos os alertas ativos deste caso
    await this.db.caseAlert.updateMany({
      where: { caseId: data.caseId, status: 'ACTIVE' },
      data: { status: 'RESOLVED', resolvedAt: new Date() }
    });

    // Auditoria
    await this.audit.logStrict({
      actorId: data.closedById,
      portalOrigin: 'ADMIN',
      actionType: 'DISCHARGE_CASE',
      targetEntity: 'CASE',
      targetEntityId: data.caseId,
      justification: `Alta de caso efetuada. Motivo: ${data.closureReason}`
    });

    return closedCase;
  }

  /**
   * Reabre um caso clínico anteriormente arquivado/encerrado.
   */
  async reopenCase(data: {
    caseId: string;
    reopenedById: string;
    priority: string;
    classification: string;
    reason: string;
  }) {
    const clinicalCase = await this.db.case.findUnique({
      where: { id: data.caseId }
    });

    if (!clinicalCase || clinicalCase.status !== 'CLOSED') {
      throw new BadRequestException('Apenas casos encerrados (CLOSED) podem ser reabertos.');
    }

    const reopenedCase = await this.db.case.update({
      where: { id: data.caseId },
      data: {
        status: 'REOPENED',
        priority: data.priority,
        classification: data.classification,
        reason: data.reason,
        reopenedById: data.reopenedById,
        reopenedAt: new Date(),
        // Limpar metadados de alta para permitir fluxo ativo
        closedAt: null,
        closedById: null,
        closureReason: null,
        evolutionSummary: null,
        resultsAchieved: null,
        finalInstructions: null
      }
    });

    // Auditoria
    await this.audit.logStrict({
      actorId: data.reopenedById,
      portalOrigin: 'ADMIN',
      actionType: 'REOPEN_CASE',
      targetEntity: 'CASE',
      targetEntityId: data.caseId,
      justification: 'Caso reaberto após nova avaliação social'
    });

    return reopenedCase;
  }

  /**
   * Retorna os indicadores institucionais de gestão de casos para Dashboards.
   */
  async getDashboardStats() {
    const totalActive = await this.db.case.count({ where: { status: { in: ['ACTIVE', 'REOPENED'] } } });
    const totalClosed = await this.db.case.count({ where: { status: 'CLOSED' } });

    // Cálculo simplificado de tempo médio de acompanhamento
    const closedCases = await this.db.case.findMany({
      where: { status: 'CLOSED', closedAt: { not: null } },
      select: { createdAt: true, closedAt: true }
    });

    let avgDurationDays = 0;
    if (closedCases.length > 0) {
      const totalDays = closedCases.reduce((acc: number, c: any) => {
        const diffTime = Math.abs(c.closedAt.getTime() - c.createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);
      avgDurationDays = Math.round(totalDays / closedCases.length);
    }

    // Distribuição por prioridade
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'VERY_HIGH', 'EMERGENTIAL'];
    const distributionByPriority = await Promise.all(
      priorities.map(async (p) => ({
        priority: p,
        count: await this.db.case.count({ where: { priority: p, status: { in: ['ACTIVE', 'REOPENED'] } } })
      }))
    );

    return {
      activeCases: totalActive,
      closedCases: totalClosed,
      averageDurationDays: avgDurationDays,
      distributionByPriority
    };
  }
}
