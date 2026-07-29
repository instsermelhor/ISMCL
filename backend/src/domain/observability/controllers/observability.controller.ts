import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { LoggingTelemetryService } from '../services/logging-telemetry.service';
import { SiemThreatDetectionService } from '../services/siem-threat-detection.service';
import { SocAutomationService } from '../services/soc-automation.service';
import { ContinuousAuditService } from '../services/continuous-audit.service';
import {
  IngestLogDto,
  CreateIncidentDto,
  ExecutePlaybookDto,
} from '../dto/observability.dto';

/**
 * ObservabilityController — APIs REST de Observabilidade, SIEM, SOC e Auditoria Contínua (AEOCSAP)
 *
 * Expõe endpoints para ingestão e consulta de logs assinados, métricas,
 * alertas SIEM, execução de Playbooks SOAR do SOC, resposta a incidentes e auditoria contínua LGPD/MCSI.
 *
 * Referências: P142 AEOCSAP Etapa 13, OpenAPI 3.1
 */
@ApiTags('Observability, Cybersecurity, SIEM & SOC Platform')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'observability', version: '1' })
export class ObservabilityController {
  constructor(
    private readonly loggingService: LoggingTelemetryService,
    private readonly siemService: SiemThreatDetectionService,
    private readonly socService: SocAutomationService,
    private readonly auditService: ContinuousAuditService,
  ) {}

  // ── Centralized Logging & Telemetry ────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ingestão de Log Estruturado Assinado Digitalmente (SHA-256)' })
  async ingestLog(@Body() dto: IngestLogDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const log = await this.loggingService.ingestLog(dto, tenantId);
    return BaseResponseDto.created(log, requestId, 'Log registrado e assinado digitalmente.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('logs')
  @ApiOperation({ summary: 'Consultar Logs Centralizados da Plataforma Aura' })
  async getLogs(@Query('module') module: string, @Query('limit') limit: number, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const logs = this.loggingService.getLogs(limit ? Number(limit) : 50, module);
    return BaseResponseDto.ok(logs, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('metrics')
  @ApiOperation({ summary: 'Resumo de Métricas de Sistema e Telemetria' })
  async getMetrics(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.loggingService.getMetricsSummary(), requestId);
  }

  // ── SIEM & SOC Automation ──────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('siem/threats')
  @ApiOperation({ summary: 'Listar Ameaças e Eventos Anômalos Detectados pelo SIEM' })
  async getThreats(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.siemService.getThreatAlerts(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('incidents')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Incidente de Cibersegurança [SOC]' })
  async createIncident(@Body() dto: CreateIncidentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const incident = await this.socService.createIncident(dto, tenantId);
    return BaseResponseDto.created(incident, requestId, `Incidente ${incident.incidentCode} registrado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('soc/playbooks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Playbook SOAR de Resposta Automática (Revogação JWT, Bloqueio IP)' })
  async executePlaybook(
    @Body() dto: ExecutePlaybookDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const incident = await this.socService.executePlaybook(dto, req.user.sub, tenantId);
    return BaseResponseDto.ok(incident, requestId, undefined, `Playbook ${dto.action} executado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('incidents')
  @ApiOperation({ summary: 'Listar Incidentes de Cibersegurança' })
  async listIncidents(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.socService.listIncidents(), requestId);
  }

  // ── Auditoria Contínua & Conformidade ──────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('audit/report')
  @ApiOperation({ summary: 'Executar e Obter Relatório de Auditoria Contínua LGPD/MCSI/Zero Trust' })
  async getAuditReport(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.auditService.runContinuousAudit(tenantId);
    return BaseResponseDto.ok(report, requestId);
  }
}
