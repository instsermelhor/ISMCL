import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard';
import { SetMetadata } from '@nestjs/common';
import { Request } from 'express';

export const RequirePortal = (portal: 'ADMIN' | 'CLINIC') => SetMetadata('portal', portal);

/**
 * ADMIN CONTROLLER - GESTÃO DE BENEFICIÁRIOS
 * Exclusivo para o portal administrativo (admin.institutosermelhor.org.br)
 */
@Controller('admin/beneficiaries')
@UseGuards(PortalAccessGuard)
@RequirePortal('ADMIN')
// Mock services para evitar erros de compilação na demonstração
class AuditService { async log(_data: unknown) {} }
class BeneficiaryService {
  async getFullAdministrativeProfile(_id: string) { return {}; }
  async createBeneficiary(_data: unknown, _userId: string) { return {}; }
}

export class BeneficiaryAdminController {
  private readonly auditService = new AuditService();
  private readonly beneficiaryService = new BeneficiaryService();

  /**
   * Retorna os dados mestre do beneficiário, incluindo dados sociais e documentação administrativa.
   * IMPORTANTE: Esta rota propositalmente NÃO retorna Prontuários (Records).
   */
  @Get(':id')
  async getBeneficiaryDetails(@Param('id') id: string, @Req() req: Request) {
    // 1. Log de auditoria (Registro de quem do admin acessou o cadastro)
    await this.auditService.log({
      actorId: (req as any).user?.['id'],
      action: 'READ_ADMIN_PROFILE',
      targetEntityId: id,
    });

    // 2. Busca Cadastro Mestre, Endereço, Família, Situação Social
    const profile = await this.beneficiaryService.getFullAdministrativeProfile(id);
    return profile;
  }

  /**
   * Cadastro completo de um novo beneficiário (Acolhimento)
   */
  @Post()
  async registerBeneficiary(@Body() data: unknown, @Req() req: Request) {
    // Insere no banco utilizando SSOT (Single Source of Truth)
    return await this.beneficiaryService.createBeneficiary(data, (req as any).user?.['id']);
  }
}
