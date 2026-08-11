import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { CaseManagementService } from '../services/case-management.service';
import { CaseTimelineService } from '../services/case-timeline.service';
import { GoalManagementService } from '../services/goal-management.service';
import { MultidisciplinaryCoordinationService } from '../services/multidisciplinary-coordination.service';
import { CaseAlertSchedulerService } from '../services/case-alert-scheduler.service';
import {
  UpdateCaseStatusDto,
  AssignMultidisciplinaryTeamDto,
  AddGoalDto,
  UpdateGoalProgressDto,
  EvaluateOutcomeDto,
  CloseCaseDto,
} from '../dto/case-management.dto';

/**
 * CaseManagementController — APIs REST da Plataforma Corporativa de Gestão de Casos (AECMP)
 *
 * Expõe endpoints para acompanhamento longitudinal, linha do tempo imutável, metas,
 * equipe multidisciplinar, medição de resolutividade, alta, reabertura de casos e alertas automáticos.
 *
 * Referências: P110 (AEWBPM), P125 (AEAP), P135 (AECMP Etapa 11), GAP-P2-05
 */
@ApiTags('CaseManagement')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'case-management', version: '1' })
export class CaseManagementController {
  constructor(
    private readonly caseManagementService: CaseManagementService,
    private readonly timelineService: CaseTimelineService,
    private readonly goalService: GoalManagementService,
    private readonly coordinationService: MultidisciplinaryCoordinationService,
    private readonly alertScheduler: CaseAlertSchedulerService,
  ) {}

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get('cases/:id/timeline')
  @ApiOperation({ summary: 'Consultar Linha do Tempo Longitudinal do Caso' })
  async getTimeline(@Param('id') caseId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const timeline = await this.timelineService.getTimeline(caseId);

    return BaseResponseDto.ok(timeline, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('team/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Designar Equipe Multidisciplinar Responsável pelo Caso' })
  async assignTeam(@Body() dto: AssignMultidisciplinaryTeamDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.coordinationService.assignTeam(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Equipe multidisciplinar designada.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Post('goals')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar Nova Meta Assistencial no Caso' })
  async addGoal(@Body() dto: AddGoalDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.goalService.addGoal(dto, tenantId);
    return BaseResponseDto.created(result, requestId, 'Meta assistencial cadastrada.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Patch('goals/progress')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar Evolução Percentual de Meta (0-100%)' })
  async updateGoalProgress(@Body() dto: UpdateGoalProgressDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.goalService.updateProgress(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Progresso da meta atualizado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Post('outcome/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Medir Resolutividade e Resultados do Plano Assistencial' })
  async evaluateOutcome(@Body() dto: EvaluateOutcomeDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.caseManagementService.evaluateOutcome(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Resultados avaliados com sucesso.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('cases/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerrar Caso Assistencial (Alta / Conclusão)' })
  async closeCase(@Body() dto: CloseCaseDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.caseManagementService.closeCase(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Caso assistencial encerrado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('cases/:id/reopen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir Caso Assistencial Previamante Encerrado' })
  async reopenCase(
    @Param('id') caseId: string,
    @Body('reason') reason: string,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.caseManagementService.reopenCase(caseId, reason ?? 'Reabertura técnica', tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Caso assistencial reaberto.');
  }

  // ── Alertas Automáticos de Casos (GAP-P2-05) ─────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('alerts/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disparar Varredura Manual de Alertas de Casos (GAP-P2-05)',
    description:
      'Executa a varredura manual de casos sem movimentação (>15d), metas vencidas, encaminhamentos sem retorno (>30d) e PICs sem revisão (>60d).',
  })
  async triggerAlertScan(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const summary = await this.alertScheduler.checkAndGenerateAlerts(tenantId);
    return BaseResponseDto.ok(
      summary,
      requestId,
      undefined,
      `Varredura concluída. ${summary.totalAlertsGenerated} novos alertas gerados.`,
    );
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('cases/:id/alerts')
  @ApiOperation({ summary: 'Consultar Alertas Ativos de um Caso Assistencial' })
  async getCaseAlerts(@Param('id') caseId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const alerts = await this.alertScheduler.getActiveAlertsForCase(caseId);
    return BaseResponseDto.ok(alerts, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Patch('alerts/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marcar Alerta de Caso como Resolvido' })
  async resolveAlert(@Param('id') alertId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const alert = await this.alertScheduler.resolveAlert(alertId);
    return BaseResponseDto.ok(alert, requestId, undefined, 'Alerta de caso marcado como resolvido.');
  }
}
