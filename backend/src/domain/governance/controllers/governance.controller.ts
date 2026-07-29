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
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { EnterpriseRiskGovernanceService } from '../services/enterprise-risk-governance.service';
import { StrategicPlanningGrcService } from '../services/strategic-planning-grc.service';
import {
  RegisterRiskDto,
  CreatePolicyDto,
  RegisterOkrDto,
  RecordCommitteeDecisionDto,
} from '../dto/governance.dto';

/**
 * GovernanceController — APIs REST de GRC, Gestão de Riscos, Compliance e Planejamento Estratégico (AEGRC)
 *
 * Expõe endpoints para gestão de riscos corporativos (ERM), políticas institucionais com
 * aprovação SoD, OKRs estratégicos, deliberações de comitês e GRC Dashboard executivo.
 *
 * Referências: P144 AEGRC Etapa 11, OpenAPI 3.1, LGPD, MCSI, Zero Trust
 */
@ApiTags('Enterprise Governance, Risk, Compliance & Strategic Management (GRC)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'governance', version: '1' })
export class GovernanceController {
  constructor(
    private readonly ermService: EnterpriseRiskGovernanceService,
    private readonly strategyService: StrategicPlanningGrcService,
  ) {}

  // ── GRC Dashboard ──────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('dashboard')
  @ApiOperation({ summary: 'GRC Dashboard Executivo — Riscos, Políticas, OKRs e Comitês em Tempo Real' })
  async getDashboard(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const risks = this.ermService.listRisks();
    const policies = this.ermService.listPolicies();
    const controls = this.ermService.listControls();
    const dashboard = this.strategyService.buildGrcDashboard(risks, policies, controls);
    return BaseResponseDto.ok(dashboard, requestId);
  }

  // ── Enterprise Risk Management ─────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('risks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Risco Corporativo (ERM) com Avaliação de Score e Nível' })
  async registerRisk(
    @Body() dto: RegisterRiskDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const risk = await this.ermService.registerRisk(dto, req.user.sub, tenantId);
    return BaseResponseDto.created(risk, requestId, `Risco ${risk.riskCode} [${risk.riskLevel}] registrado. Score: ${risk.riskScore}/25.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('risks')
  @ApiOperation({ summary: 'Listar Riscos Corporativos (ERM) — Ordenados por Risk Score Decrescente' })
  async listRisks(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.ermService.listRisks(), requestId);
  }

  // ── Policy Management ──────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('policies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Política Institucional (Inicia como DRAFT — requer aprovação SUPER_ADMIN)' })
  async createPolicy(
    @Body() dto: CreatePolicyDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const policy = await this.ermService.createPolicy(dto, req.user.sub);
    return BaseResponseDto.created(policy, requestId, `Política ${policy.policyCode} criada como DRAFT. Aguardando aprovação.`);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('policies/:policyId/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprovar e Publicar Política Institucional [SUPER_ADMIN — Segregação de Funções]' })
  async publishPolicy(
    @Param('policyId') policyId: string,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const policy = await this.ermService.publishPolicy(policyId, req.user.sub, tenantId);
    return BaseResponseDto.ok(policy, requestId, undefined, `Política ${policy.policyCode} PUBLICADA e assinada digitalmente.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('policies')
  @ApiOperation({ summary: 'Listar Políticas Institucionais Publicadas (LGPD, Código de Ética, MCSI)' })
  async listPolicies(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.ermService.listPolicies(), requestId);
  }

  // ── Internal Controls ──────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('controls')
  @ApiOperation({ summary: 'Listar Controles Internos (Preventivos, Detectivos, Corretivos, Compensatórios)' })
  async listControls(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.ermService.listControls(), requestId);
  }

  // ── OKR & Strategic Planning ───────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('okrs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar OKR Estratégico Institucional' })
  async registerOkr(
    @Body() dto: RegisterOkrDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const okr = await this.strategyService.registerOkr(dto, tenantId);
    return BaseResponseDto.created(okr, requestId, `OKR ${okr.okrCode} registrado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('okrs')
  @ApiOperation({ summary: 'Listar OKRs Estratégicos e Key Results' })
  async listOkrs(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.strategyService.listOkrs(), requestId);
  }

  // ── Corporate Committees ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('committees/decisions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Deliberação de Comitê Corporativo (Ata Digital Assinada + Workflow Task)' })
  async recordCommitteeDecision(
    @Body() dto: RecordCommitteeDecisionDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const decision = await this.strategyService.recordCommitteeDecision(dto, req.user.sub, tenantId);
    return BaseResponseDto.created(decision, requestId, `Deliberação ${decision.decisionCode} registrada com assinatura digital.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('committees/decisions')
  @ApiOperation({ summary: 'Listar Deliberações de Comitês Corporativos' })
  async listDecisions(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.strategyService.listDecisions(), requestId);
  }
}
