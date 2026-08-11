import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { RecurringDonationGatewayService } from '../services/recurring-donation-gateway.service';
import {
  CreateRecurringDonationDto,
  CancelSubscriptionDto,
  PaymentWebhookPayloadDto,
} from '../dto/recurring-donation.dto';

/**
 * DonationController — Endpoints para Doações Recorrentes e Gateway de Pagamento
 *
 * Gerencia doações via cartão de crédito, PIX recorrente e boleto, oferecendo:
 * - Início de assinatura de doação recorrente
 * - Recebimento de Webhooks do Gateway de Pagamento com idempotência Redis (GAP-P3-03)
 * - Cancelamento de assinaturas ativas
 * - Consulta de doações ativas para o portal público e financeiro
 *
 * Referências: REMEDIATION-AURA-001 (R3-03 / GAP-P3-03), PRD-AURA-001 (FR-054)
 */
@ApiTags('Financial Donations & Payment Gateway')
@Controller({ path: 'financial/donations', version: '1' })
export class DonationController {
  constructor(
    private readonly donationGateway: RecurringDonationGatewayService,
  ) {}

  // ── Iniciar Doação Recorrente ─────────────────────────────────────────────

  /**
   * POST /v1/financial/donations/recurring
   *
   * Endpoint público/autenticado para registro de novas doações recorrentes.
   */
  @Post('recurring')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar Nova Doação Recorrente (Cartão / PIX Recorrente / Boleto)',
    description:
      'Cria uma assinatura de doação recorrente no Gateway de Pagamento, associa ao Doador e atualiza a campanha de destino.',
  })
  @ApiBody({ type: CreateRecurringDonationDto })
  async createRecurringDonation(
    @Body() dto: CreateRecurringDonationDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const subscription = await this.donationGateway.createSubscription(dto, tenantId);

    return BaseResponseDto.created(
      subscription,
      requestId,
      `Doação recorrente registrada com sucesso (ID: ${subscription.id}). Próxima cobrança: ${subscription.nextBillingDate}.`,
    );
  }

  // ── Webhook do Gateway de Pagamento ──────────────────────────────────────

  /**
   * POST /v1/financial/donations/webhook
   *
   * Endpoint público para recepção de webhooks do Gateway de Pagamento (Stripe, Asaas, Efí, etc.).
   * Processamento idempotente via Redis TTL 8d.
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Notificações do Gateway de Pagamentos [Idempotente Redis]',
    description:
      'Recebe atualizações de pagamento (sucesso, falha, cancelamento). Chave de idempotência no Redis previne duplicidade.',
  })
  @ApiBody({ type: PaymentWebhookPayloadDto })
  async processPaymentWebhook(
    @Body() payload: PaymentWebhookPayloadDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.donationGateway.processWebhookEvent(payload, tenantId);

    return BaseResponseDto.ok(result, requestId, undefined, result.message);
  }

  // ── Listar Assinaturas Recorrentes ──────────────────────────────────────

  /**
   * GET /v1/financial/donations/subscriptions
   *
   * Endpoint restrito para consulta de assinaturas recorrentes ativas.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.OPERATOR)
  @ApiBearerAuth('access-token')
  @Get('subscriptions')
  @ApiOperation({
    summary: 'Listar Doações Recorrentes (Painel Financeiro)',
    description: 'Retorna a lista de assinaturas recorrentes com status e próximas datas de cobrança.',
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status: ACTIVE, PAUSED, CANCELLED' })
  async listSubscriptions(
    @Query('status') status?: string,
    @Req() req?: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string })?.requestId ?? 'unknown';
    const list = await this.donationGateway.listSubscriptions(status);
    return BaseResponseDto.ok(list, requestId);
  }

  // ── Cancelar Assinatura Recorrente ─────────────────────────────────────

  /**
   * DELETE /v1/financial/donations/subscriptions/:id
   *
   * Endpoint para cancelamento de assinatura recorrente.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @ApiBearerAuth('access-token')
  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancelar Doação Recorrente',
    description: 'Cancela a assinatura no Gateway de Pagamento e desativa a recorrência do doador.',
  })
  @ApiParam({ name: 'id', description: 'ID da assinatura recorrente' })
  async cancelSubscription(
    @Param('id') id: string,
    @Body() dto: CancelSubscriptionDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const sub = await this.donationGateway.cancelSubscription(id, dto, tenantId);

    return BaseResponseDto.ok(
      sub,
      requestId,
      undefined,
      `Assinatura ${id} cancelada com sucesso.`,
    );
  }
}
