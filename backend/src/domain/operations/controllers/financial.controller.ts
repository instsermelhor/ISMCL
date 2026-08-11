import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { FinancialApprovalGuard, FinancialLimit } from '../../../shared/guards/financial-approval.guard';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { FinancialApprovalService } from '../services/financial-approval.service';
import {
  CreateFinancialTransactionDto,
  ApproveFinancialTransactionDto,
  RejectFinancialTransactionDto,
} from '../dto/financial-approval.dto';

/**
 * FinancialController — Endpoints de Transações Financeiras com Enforcement de Alçada
 *
 * Implementa o motor de aprovação financeira com:
 * - Validação declarativa de alçada via @FinancialLimit (FinancialApprovalGuard)
 * - Dupla aprovação obrigatória para transações > R$ 10.000,00
 * - Audit log imutável com hash chain (integração GAP-P1-03)
 * - Eventos assíncronos via EventBus (integração GAP-P2-01)
 *
 * Referências: PRD-AURA-001, REMEDIATION-AURA-001 (R2-03), GAP-P2-03
 */
@ApiTags('Financial Operations & Approval Engine')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'financial', version: '1' })
export class FinancialController {
  constructor(private readonly financialApproval: FinancialApprovalService) {}

  // ── Criação de Transação ─────────────────────────────────────────────────

  /**
   * POST /v1/financial/transactions
   *
   * Cria uma nova solicitação de transação financeira.
   * O FinancialApprovalGuard valida imediatamente se o papel do solicitante
   * possui alçada para o valor informado no campo `amount` do body.
   */
  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
    AuraRole.OPERATOR,
  )
  @UseGuards(FinancialApprovalGuard)
  @FinancialLimit('amount')
  @Post('transactions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar Solicitação de Transação Financeira [com enforcement de alçada]',
    description:
      'Abre uma nova transação financeira. O papel do solicitante é validado no backend contra o valor informado. Transações > R$ 10.000 exigem dupla aprovação de gestores distintos.',
  })
  @ApiBody({ type: CreateFinancialTransactionDto })
  async createTransaction(
    @Body() dto: CreateFinancialTransactionDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const record = await this.financialApproval.createTransaction(
      dto,
      user.sub,
      user.name ?? user.email ?? user.sub,
      tenantId,
    );

    return BaseResponseDto.created(
      record,
      requestId,
      `Transação ${record.id} criada com sucesso. Status: ${record.status}.`,
    );
  }

  // ── Aprovação de Transação ───────────────────────────────────────────────

  /**
   * POST /v1/financial/transactions/:id/approve
   *
   * Aprova uma transação pendente.
   * O enforcement completo (alçada + dupla aprovação + anti-self-approval) é
   * executado no backend pelo FinancialApprovalService.
   */
  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
  )
  @Post('transactions/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Aprovar Transação Financeira [enforcement backend de alçada + dupla aprovação]',
    description:
      'Executa o motor de alçada no backend: valida papel, limite máximo e dupla aprovação para transações > R$ 10.000. Tentativas de bypass são auditadas (GAP-P1-03).',
  })
  @ApiParam({ name: 'id', description: 'ID da transação financeira' })
  @ApiBody({ type: ApproveFinancialTransactionDto })
  async approveTransaction(
    @Param('id') id: string,
    @Body() dto: ApproveFinancialTransactionDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'] ?? 'SYSTEM';

    const record = await this.financialApproval.approveTransaction(
      id,
      dto,
      user.sub,
      actorRole,
      user.name ?? user.email ?? user.sub,
      ipAddress,
      userAgent,
    );

    return BaseResponseDto.ok(
      record,
      requestId,
      undefined,
      `Transação ${id} processada. Status atual: ${record.status}.`,
    );
  }

  // ── Rejeição de Transação ────────────────────────────────────────────────

  /**
   * POST /v1/financial/transactions/:id/reject
   *
   * Rejeita uma transação financeira pendente com justificativa obrigatória.
   */
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('transactions/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rejeitar Transação Financeira',
    description: 'Rejeita a transação financeira informando o motivo. Emite evento no EventBus.',
  })
  @ApiParam({ name: 'id', description: 'ID da transação financeira' })
  @ApiBody({ type: RejectFinancialTransactionDto })
  async rejectTransaction(
    @Param('id') id: string,
    @Body() dto: RejectFinancialTransactionDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;

    const record = await this.financialApproval.rejectTransaction(
      id,
      dto,
      user.sub,
      actorRole,
      user.name ?? user.email ?? user.sub,
    );

    return BaseResponseDto.ok(record, requestId, undefined, `Transação ${id} rejeitada.`);
  }

  // ── Consulta de Transações ───────────────────────────────────────────────

  /**
   * GET /v1/financial/transactions
   *
   * Lista todas as transações financeiras para auditoria e monitoramento.
   */
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('transactions')
  @ApiOperation({
    summary: 'Listar Transações Financeiras (Auditoria)',
    description: 'Retorna todas as transações em ordem cronológica inversa para fins de auditoria.',
  })
  async listTransactions(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const records = await this.financialApproval.listTransactions();
    return BaseResponseDto.ok(records, requestId);
  }

  /**
   * GET /v1/financial/transactions/:id
   *
   * Retorna os detalhes de uma transação específica, incluindo trilha de aprovações.
   */
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('transactions/:id')
  @ApiOperation({
    summary: 'Detalhar Transação Financeira',
    description: 'Retorna os detalhes completos da transação, incluindo lista de aprovadores e status atual.',
  })
  @ApiParam({ name: 'id', description: 'ID da transação financeira' })
  async getTransactionById(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const record = await this.financialApproval.getTransactionById(id);
    return BaseResponseDto.ok(record, requestId);
  }

  // ── Verificação de Alçada (Utilitário) ──────────────────────────────────

  /**
   * GET /v1/financial/authority-check
   *
   * Endpoint utilitário para que o frontend consulte se o papel do usuário
   * autenticado possui alçada para um determinado valor (dry-run, sem criar transação).
   */
  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
    AuraRole.OPERATOR,
  )
  @Get('authority-check')
  @ApiOperation({
    summary: 'Verificar Alçada Financeira do Usuário Autenticado',
    description:
      'Retorna os limites de alçada do papel do usuário atual sem criar nenhuma transação. Útil para o frontend validar previamente se o usuário pode iniciar uma transação.',
  })
  async checkMyAuthority(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;

    const check = this.financialApproval.checkAuthority(actorRole, 0);

    return BaseResponseDto.ok(
      {
        actorRole: actorRole.toUpperCase(),
        maxLimitBRL: check.maxLimitAllowed,
        dualApprovalThresholdBRL: 10000.0,
        dualApprovalRequired: false,
      },
      requestId,
    );
  }
}
