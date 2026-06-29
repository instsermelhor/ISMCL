import { Controller, Post, Body, UseGuards, Req, SetMetadata } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
import { CaseMatchingService } from '../services/case-matching.service.ts';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

interface MatchPayload {
  beneficiaryId: string;
  projectId: string;
  professionalId: string;
  priority: 'NORMAL' | 'HIGH' | 'URGENT';
}

/**
 * ADMIN CONTROLLER - GESTÃO DE CASOS E FILAS
 * Acessível exclusivamente pelo RH / Coordenadores Sociais do Instituto.
 */
@Controller('admin/cases')
@UseGuards(PortalAccessGuard)
@RequirePortal('ADMIN')
export class CaseAdminController {
  constructor(private readonly caseMatchingService: CaseMatchingService) {}

  /**
   * Ponto final do Acolhimento: O Coordenador designa o paciente para um profissional.
   * Cria o vínculo estrutural (ABAC) que permitirá o atendimento sigiloso.
   */
  @Post('match')
  async createMatch(@Body() data: MatchPayload, @Req() req: Request) {
    const adminId = (req as any).user['id']; // Usuário admin logado
    
    const clinicalCase = await this.caseMatchingService.createCaseMatch(
      data.beneficiaryId,
      data.projectId,
      data.professionalId,
      adminId,
      data.priority
    );

    return {
      success: true,
      message: 'Match realizado com sucesso. O beneficiário foi retirado da fila e a agenda do profissional foi destravada.',
      data: clinicalCase
    };
  }
}
