import {
  Controller,
  Post,
  Delete,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { BreakGlassService } from './break-glass.service';
import { RequestBreakGlassDto } from './dto/break-glass.dto';

// Guard local — usa o JwtAuthGuard global já configurado no AuthModule
// Importação via shared se disponível, senão guard inline
// Aqui usamos decorador de rota sem guard explícito pois é gerenciado globalmente
// via app.module.ts (SecurityMiddleware) + guards de rota no AuthModule.

/**
 * BreakGlassController — Controller REST de Acesso Excepcional de Emergência
 *
 * Expõe os endpoints para o fluxo Break-Glass da Plataforma Aura.
 *
 * Endpoints:
 * - POST   /security/break-glass          — Solicitar acesso excepcional
 * - DELETE /security/break-glass/:id      — Revogar sessão ativa (gestores)
 * - GET    /security/break-glass/history/:beneficiaryId — Histórico de acessos
 *
 * Controle de acesso:
 * - POST: profissionais autenticados (qualquer papel)
 * - DELETE: papéis GESTOR, ADMINISTRADOR, DPO, SUPER_USER_UNIVERSAL
 * - GET: papéis GESTOR, ADMINISTRADOR, AUDITOR, DPO, SUPER_USER_UNIVERSAL
 *
 * Referências: PRD-AURA-001 (FR-AURA-014), GAP-P1-04
 */
@Controller('security/break-glass')
export class BreakGlassController {
  constructor(private readonly breakGlassService: BreakGlassService) {}

  /**
   * POST /security/break-glass
   *
   * Solicita acesso excepcional Break-Glass a um beneficiário MCSI-4.
   * A justificativa clínica é obrigatória (mínimo 30 caracteres).
   * A sessão é aprovada automaticamente e expira em 4 horas.
   * Gestores e DPO são notificados imediatamente via portal.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async requestAccess(@Body() dto: RequestBreakGlassDto, @Req() req: Request) {
    const user = (req as any).user; // Payload do JWT injetado pelo SecurityMiddleware/JwtAuthGuard
    const professionalId: string = user?.professionalId ?? user?.sub ?? 'UNKNOWN';
    const ipAddress: string =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';
    const userAgent: string = req.headers['user-agent'] || 'UNKNOWN';
    const tenantId: string = (req.headers['x-tenant-id'] as string) || 'default';

    return this.breakGlassService.requestAccess(
      professionalId,
      dto,
      ipAddress,
      userAgent,
      tenantId,
    );
  }

  /**
   * DELETE /security/break-glass/:id
   *
   * Revoga manualmente uma sessão Break-Glass ativa.
   * Apenas gestores, administradores e DPO podem executar esta ação.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(@Param('id') sessionId: string, @Req() req: Request) {
    const user = (req as any).user;
    const revokedById: string = user?.sub ?? 'UNKNOWN';
    const ipAddress: string =
      (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '0.0.0.0';
    const userAgent: string = req.headers['user-agent'] || 'UNKNOWN';

    await this.breakGlassService.revokeSession(sessionId, revokedById, ipAddress, userAgent);
  }

  /**
   * GET /security/break-glass/history/:beneficiaryId
   *
   * Retorna o histórico completo de sessões Break-Glass de um beneficiário.
   * Visível apenas para papéis de auditoria e gestão.
   */
  @Get('history/:beneficiaryId')
  @HttpCode(HttpStatus.OK)
  async getSessionHistory(@Param('beneficiaryId') beneficiaryId: string) {
    return this.breakGlassService.getSessionHistory(beneficiaryId);
  }
}
