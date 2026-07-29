import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { IntegrationHubService } from '../services/integration-hub.service';
import { ApiWebhookManagementService } from '../services/api-webhook-management.service';
import {
  RegisterApiDto,
  RegisterWebhookDto,
  InstallConnectorDto,
  TriggerSyncDto,
} from '../dto/integration.dto';

/**
 * IntegrationController — APIs REST da Plataforma Corporativa de Integração, Gerenciamento de APIs e Webhooks (AEIP)
 *
 * Expõe endpoints para gerenciamento de APIs (APIM), hub central de conectores corporativos (Governo, Bancos, IA, Cloud),
 * governança de homologação, sincronização de dados e gerenciamento de webhooks com assinatura HMAC SHA-256.
 *
 * Referências: P147 AEIP Etapa 11, OpenAPI 3.1, LGPD, MCSI
 */
@ApiTags('Enterprise Integration Platform & API Management (AEIP)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'integration', version: '1' })
export class IntegrationController {
  constructor(
    private readonly hubService: IntegrationHubService,
    private readonly apimService: ApiWebhookManagementService,
  ) {}

  // ── API Management (APIM) ──────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('apis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Nova API Gerenciada no Catálogo APIM' })
  async registerApi(
    @Body() dto: RegisterApiDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const api = await this.apimService.registerApi(dto, tenantId);
    return BaseResponseDto.created(api, requestId, `API ${api.apiCode} registrada com sucesso.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('apis')
  @ApiOperation({ summary: 'Listar Catálogo de APIs Gerenciadas Corporativas' })
  async listApis(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.apimService.listApis(), requestId);
  }

  // ── Connector Framework & Sync ─────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('connectors')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Instalar Conector Corporativo (Entra em Homologação)' })
  async installConnector(
    @Body() dto: InstallConnectorDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const connector = await this.hubService.installConnector(dto, tenantId);
    return BaseResponseDto.created(connector, requestId, `Conector ${connector.connectorCode} instalado em homologação.`);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('connectors/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Homologar e Aprovar Conector para Produção [SUPER_ADMIN]' })
  async approveConnector(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const connector = await this.hubService.approveConnector(id, tenantId);
    return BaseResponseDto.ok(connector, requestId, undefined, `Conector ${connector.connectorCode} homologado e aprovado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('connectors')
  @ApiOperation({ summary: 'Listar Conectores Corporativos Instalados' })
  async listConnectors(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.hubService.listConnectors(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('sync/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disparar Sincronização Corporativa de Dados (Realtime / Batch / Incremental)' })
  async triggerSynchronization(
    @Body() dto: TriggerSyncDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const job = await this.hubService.triggerSynchronization(dto, tenantId);
    return BaseResponseDto.ok(job, requestId, undefined, `Sincronização concluída. Registros processados: ${job.recordsProcessed}`);
  }

  // ── Webhooks & Integration Dashboard ─────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('webhooks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Destino de Webhook (Assinatura HMAC SHA-256)' })
  async registerWebhook(
    @Body() dto: RegisterWebhookDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const webhook = await this.apimService.registerWebhook(dto, tenantId);
    return BaseResponseDto.created(webhook, requestId, `Webhook ${webhook.targetName} registrado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('webhooks')
  @ApiOperation({ summary: 'Listar Webhooks Ativos e Estatísticas de Disparo' })
  async listWebhooks(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.apimService.listWebhooks(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('metrics')
  @ApiOperation({ summary: 'Dashboard de Métricas do Integration Hub & API Management' })
  async getMetrics(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.apimService.getMetrics(), requestId);
  }
}
