import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  HttpCode, HttpStatus, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ACTGGatewayService } from '../services/actg-gateway.service';
import { ACTGAdminService } from '../services/actg-admin.service';
import { ProviderHealthService } from '../services/provider-health.service';
import { WebhookProcessorService } from '../services/webhook-processor.service';
import { NotificationOrchestratorService } from '../services/notification-orchestrator.service';
import {
  CreateAppointmentChannelDto,
  CancelExternalMeetingDto,
  SendNotificationDto,
  WebhookPayloadDto,
  UpdateCommunicationProviderDto,
  CreateCommunicationAccountDto,
  UpdateCommunicationAccountDto,
  CreateCommunicationTemplateDto,
  UpdateCommunicationTemplateDto,
  ChannelType,
  NotificationChannel,
} from '../dto/actg.dto';
import { FallbackPolicy } from '../services/fallback-engine.service';

/**
 * ACTGController — API REST do Aura Communication & Teleattendance Gateway
 *
 * Rotas versionadas sob /api/v1/actg
 *
 * Referência: ADR-188, Prompt 188 — Item 38
 */
@ApiTags('ACTG — Communication & Teleattendance Gateway')
@ApiBearerAuth()
@Controller('api/v1/actg')
export class ACTGController {
  private readonly logger = new Logger(ACTGController.name);

  constructor(
    private readonly gateway: ACTGGatewayService,
    private readonly adminService: ACTGAdminService,
    private readonly providerHealth: ProviderHealthService,
    private readonly webhookProcessor: WebhookProcessorService,
    private readonly notificationOrchestrator: NotificationOrchestratorService,
  ) {}

  // ── Provider Health ────────────────────────────────────────────────────────

  @Get('provider-health')
  @ApiOperation({ summary: 'Lista o status de saúde de todos os provedores de comunicação' })
  @ApiResponse({ status: 200, description: 'Status dos provedores retornado com sucesso' })
  getProviderHealth() {
    return this.providerHealth.getAllStatuses();
  }

  @Get('provider-health/:channelType')
  @ApiOperation({ summary: 'Executa health check em tempo real para um provedor específico' })
  async checkProviderHealth(@Param('channelType') channelType: string) {
    return this.providerHealth.checkProvider(channelType);
  }

  // ── Admin Management Endpoints ─────────────────────────────────────────────

  @Get('admin/providers')
  @ApiOperation({ summary: 'Lista todos os provedores de comunicação cadastrados' })
  getAdminProviders() {
    return this.adminService.listProviders();
  }

  @Patch('admin/providers/:id')
  @ApiOperation({ summary: 'Atualiza estado/configuração de um provedor' })
  updateAdminProvider(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationProviderDto,
  ) {
    return this.adminService.updateProvider(id, dto);
  }

  @Get('admin/accounts')
  @ApiOperation({ summary: 'Lista todas as contas de comunicação atreladas ao Vault' })
  getAdminAccounts() {
    return this.adminService.listAccounts();
  }

  @Post('admin/accounts')
  @ApiOperation({ summary: 'Cria uma nova conta de comunicação vinculando ao caminho no Vault' })
  createAdminAccount(@Body() dto: CreateCommunicationAccountDto) {
    return this.adminService.createAccount(dto);
  }

  @Patch('admin/accounts/:id')
  @ApiOperation({ summary: 'Atualiza uma conta de comunicação existente' })
  updateAdminAccount(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationAccountDto,
  ) {
    return this.adminService.updateAccount(id, dto);
  }

  @Get('admin/templates')
  @ApiOperation({ summary: 'Lista todos os templates de comunicação' })
  getAdminTemplates() {
    return this.adminService.listTemplates();
  }

  @Post('admin/templates')
  @ApiOperation({ summary: 'Cria um novo template de comunicação' })
  createAdminTemplate(@Body() dto: CreateCommunicationTemplateDto) {
    return this.adminService.createTemplate(dto);
  }

  @Patch('admin/templates/:id')
  @ApiOperation({ summary: 'Atualiza um template de comunicação' })
  updateAdminTemplate(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationTemplateDto,
  ) {
    return this.adminService.updateTemplate(id, dto);
  }

  // ── Appointment Channels ───────────────────────────────────────────────────

  @Post('appointments/:appointmentId/channels')
  @ApiOperation({ summary: 'Cria ou seleciona o canal de comunicação para um agendamento' })
  @ApiResponse({ status: 201, description: 'Canal de comunicação criado e sessão externa provisionada' })
  async createChannel(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CreateAppointmentChannelDto,
  ) {
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60_000);

    const fallbackPolicy: FallbackPolicy = {
      mcsiLevel: 0,
      allowAutoFallback: true,
      fallbackChannels: [ChannelType.GOOGLE_MEET, ChannelType.TEAMS, ChannelType.WHATSAPP_BUSINESS],
    };

    const session = await this.gateway.createSession(
      appointmentId,
      dto,
      now,
      end,
      'Atendimento Aura',
      fallbackPolicy,
    );

    this.logger.log(`[ACTG API] Canal criado para agendamento ${appointmentId}: ${session.channelType}`);
    return session;
  }

  @Get('appointments/:appointmentId/channels')
  @ApiOperation({ summary: 'Retorna o canal de comunicação de um agendamento' })
  getChannel(@Param('appointmentId') appointmentId: string) {
    return this.gateway.getSessionByAppointmentId(appointmentId);
  }

  @Get('appointments/:appointmentId/join-url')
  @ApiOperation({ summary: 'Retorna a URL de acesso ao atendimento (One-Click Join)' })
  @ApiResponse({ status: 200, description: 'URL de acesso retornada — requer autorização' })
  getJoinUrl(
    @Param('appointmentId') appointmentId: string,
    @Query('participantId') participantId: string,
  ) {
    const url = this.gateway.getJoinUrl(appointmentId, participantId);
    return { joinUrl: url };
  }

  @Delete('appointments/:appointmentId/channels')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela o canal de comunicação de um agendamento' })
  async cancelChannel(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: CancelExternalMeetingDto,
  ) {
    await this.gateway.cancelSession(appointmentId, dto.reason);
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  @Post('notifications')
  @ApiOperation({ summary: 'Dispara uma notificação multicanal para um agendamento' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    await this.notificationOrchestrator.notify(dto.eventType, {
      appointmentId: dto.appointmentId,
      recipientId: 'system',
      recipientType: 'BENEFICIARY',
      recipientName: 'Beneficiário',
      appointmentDate: new Date().toLocaleDateString('pt-BR'),
      appointmentTime: new Date().toLocaleTimeString('pt-BR'),
      professionalName: 'Profissional',
      channelType: 'PORTAL',
      allowedChannels: dto.channels ?? [NotificationChannel.PORTAL],
      mcsiLevel: 0,
    });
    return { status: 'notified' };
  }

  // ── Webhooks ───────────────────────────────────────────────────────────────

  @Post('webhooks/:providerType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recebe webhooks de provedores externos (Google, Teams, Meta)' })
  async processWebhook(
    @Param('providerType') providerType: string,
    @Body() dto: WebhookPayloadDto,
  ) {
    return this.webhookProcessor.process(providerType, dto.payload, dto.signature);
  }
}
