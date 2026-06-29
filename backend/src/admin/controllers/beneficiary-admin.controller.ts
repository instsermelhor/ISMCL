import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Post as HttpPost } from '@nestjs/common';
import { PortalAccessGuard } from '../../auth/guards/portal-access.guard.ts';
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
export class BeneficiaryAdminController {
  
  /**
   * Retorna os dados mestre do beneficiário, incluindo dados sociais e documentação administrativa.
   * IMPORTANTE: Esta rota propositalmente NÃO retorna Prontuários (Records).
   */
  @Get(':id')
  async getBeneficiaryDetails(@Param('id') id: string, @Req() req: Request) {
    // 1. Log de auditoria (Registro de quem do admin acessou o cadastro)
    await this.auditService.log({
      actorId: req.user['id'],
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
  async registerBeneficiary(@Body() data: any, @Req() req: Request) {
    // Insere no banco utilizando SSOT (Single Source of Truth)
    return await this.beneficiaryService.createBeneficiary(data, req.user['id']);
  }
}

// Mock services para evitar erros de compilação na demonstração
class AuditService { async log(data: any) {} }
class BeneficiaryService { 
  async getFullAdministrativeProfile(id: string) { return {}; }
  async createBeneficiary(data: any, userId: string) { return {}; }
}
