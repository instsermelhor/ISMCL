import { Controller, Post, Get, Body, Param, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
import { CaseMatchingService } from '../services/case-matching.service.ts';
import { CaseManagementService } from '../services/case-management.service.ts';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

interface MatchPayload {
  beneficiaryId: string;
  projectId: string;
  professionalId: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

interface OpenCasePayload {
  beneficiaryId: string;
  projectId: string;
  origin: string;
  reason: string;
  classification: string;
  priority: string;
}

interface AssignPayload {
  professionalId: string;
  role: string;
}

interface DischargePayload {
  closureReason: string;
  evolutionSummary: string;
  resultsAchieved: string;
  finalInstructions: string;
}

interface ReopenPayload {
  priority: string;
  classification: string;
  reason: string;
}

/**
 * ADMIN CONTROLLER - GESTÃO E COORDENAÇÃO DE CASOS
 * Acessível exclusivamente pelo portal administrativo (coordenadores e supervisores).
 */
@Controller('admin/cases')
@UseGuards(PortalAccessGuard)
@RequirePortal('ADMIN')
export class CaseAdminController {
  constructor(
    private readonly caseMatchingService: CaseMatchingService,
    private readonly caseManagementService: CaseManagementService
  ) {}

  /**
   * Ponto final do Acolhimento: O Coordenador designa o paciente para um profissional (Match).
   */
  @Post('match')
  async createMatch(@Body() data: MatchPayload, @Req() req: Request) {
    const adminId = (req as any).user['id'];
    
    const clinicalCase = await this.caseMatchingService.createCaseMatch(
      data.beneficiaryId,
      data.projectId,
      data.professionalId,
      adminId,
      data.priority
    );

    return {
      success: true,
      message: 'Match realizado com sucesso e agenda do profissional destravada.',
      data: clinicalCase
    };
  }

  /**
   * Abertura explícita de um caso pelo coordenador.
   */
  @Post('open')
  async openCase(@Body() data: OpenCasePayload, @Req() req: Request) {
    const adminId = (req as any).user['id'];
    const newCase = await this.caseManagementService.openCase({
      ...data,
      openedById: adminId
    });

    return {
      success: true,
      message: 'Caso clínico/social aberto com sucesso.',
      data: newCase
    };
  }

  /**
   * Designa novos profissionais para a equipe multidisciplinar de um caso.
   */
  @Post(':id/assign')
  async assignProfessional(
    @Param('id') caseId: string,
    @Body() data: AssignPayload,
    @Req() req: Request
  ) {
    const adminId = (req as any).user['id'];
    const assignment = await this.caseManagementService.assignProfessional({
      caseId,
      professionalId: data.professionalId,
      role: data.role,
      assignedById: adminId
    });

    return {
      success: true,
      message: 'Profissional alocado com sucesso à equipe do caso.',
      data: assignment
    };
  }

  /**
   * Registra a alta (fechamento) de um caso.
   */
  @Post(':id/discharge')
  async dischargeCase(
    @Param('id') caseId: string,
    @Body() data: DischargePayload,
    @Req() req: Request
  ) {
    const adminId = (req as any).user['id'];
    const closedCase = await this.caseManagementService.dischargeCase({
      caseId,
      closedById: adminId,
      closureReason: data.closureReason,
      evolutionSummary: data.evolutionSummary,
      resultsAchieved: data.resultsAchieved,
      finalInstructions: data.finalInstructions
    });

    return {
      success: true,
      message: 'Caso encerrado com sucesso. Alta institucional emitida.',
      data: closedCase
    };
  }

  /**
   * Reabre um caso clínico encerrado.
   */
  @Post(':id/reopen')
  async reopenCase(
    @Param('id') caseId: string,
    @Body() data: ReopenPayload,
    @Req() req: Request
  ) {
    const adminId = (req as any).user['id'];
    const reopenedCase = await this.caseManagementService.reopenCase({
      caseId,
      reopenedById: adminId,
      priority: data.priority,
      classification: data.classification,
      reason: data.reason
    });

    return {
      success: true,
      message: 'Caso clínico reaberto com sucesso para acompanhamento.',
      data: reopenedCase
    };
  }

  /**
   * Retorna os indicadores institucionais.
   */
  @Get('stats')
  async getStats() {
    return await this.caseManagementService.getDashboardStats();
  }
}
