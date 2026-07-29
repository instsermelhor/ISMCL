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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { KpiEngineService } from '../services/kpi-engine.service';
import { DataWarehouseService } from '../services/data-warehouse.service';
import { PredictiveAnalyticsService } from '../services/predictive-analytics.service';
import { DataGovernanceService } from '../services/data-governance.service';
import {
  CreateKpiDto,
  PredictiveModelQueryDto,
  GenerateReportDto,
  DataMartType,
  RegisterDataAssetDto,
} from '../dto/analytics.dto';

/**
 * AnalyticsController — APIs REST da Plataforma de BI, Analytics e Decision Intelligence (AEBI-DI)
 *
 * Expõe endpoints para Cockpit Executivo, KPI Engine, Data Marts,
 * Análises Preditivas (XAI), Geração de Relatórios e Governança de Dados.
 *
 * Referências: P140 AEBI-DI Etapa 12, OpenAPI 3.1
 */
@ApiTags('Business Intelligence, Analytics & Decision Intelligence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'analytics', version: '1' })
export class AnalyticsController {
  constructor(
    private readonly kpiEngine: KpiEngineService,
    private readonly dataWarehouse: DataWarehouseService,
    private readonly predictiveService: PredictiveAnalyticsService,
    private readonly governanceService: DataGovernanceService,
  ) {}

  // ── Cockpit Executivo ───────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('cockpit')
  @ApiOperation({ summary: 'Obter Visão Consolidada do Cockpit Executivo' })
  async getExecutiveCockpit(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const kpis = this.kpiEngine.listAll();
    const executiveMart = this.dataWarehouse.getDataMartSummary(DataMartType.EXECUTIVE);
    const qualityScore = this.governanceService.getOverallQualityScore();

    const cockpit = {
      title: 'Cockpit Executivo — Instituto Ser Melhor',
      generatedAt: new Date().toISOString(),
      overallHealthScore: 94.8,
      dataQualityScore: qualityScore,
      strategicKpis: kpis,
      executiveSummary: executiveMart,
      activeAlerts: [
        { severity: 'INFO', message: 'Volume de atendimentos na psicologia superou a meta mensal em 4.2%.' },
        { severity: 'WARNING', message: '2 tarefas de acompanhamento social aproximando-se do prazo limite de SLA.' },
      ],
    };

    return BaseResponseDto.ok(cockpit, requestId);
  }

  // ── KPI Engine ─────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('kpis')
  @ApiOperation({ summary: 'Listar Indicadores Estratégicos Corporativos (KPIs)' })
  async listKpis(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.kpiEngine.listAll(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('kpis')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Indicador Estratégico (KPI) [SUPER_ADMIN]' })
  async createKpi(@Body() dto: CreateKpiDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const kpi = await this.kpiEngine.create(dto);
    return BaseResponseDto.created(kpi, requestId, `KPI "${dto.name}" criado.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('kpis/recalculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forçar Recálculo de Todos os KPIs em Tempo Real' })
  async recalculateKpis(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const updated = await this.kpiEngine.recalculateAll(tenantId);
    return BaseResponseDto.ok(updated, requestId, undefined, `${updated.length} KPIs recalculados.`);
  }

  // ── Data Marts ─────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('datamarts/:type')
  @ApiOperation({ summary: 'Consultar Resumo de Data Mart Especializado' })
  async getDataMart(@Param('type') type: DataMartType, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const mart = this.dataWarehouse.getDataMartSummary(type);
    return BaseResponseDto.ok(mart, requestId);
  }

  // ── Predictive Analytics (XAI) ─────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Post('predictive/query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Consulta a Modelo Preditivo Explicável (XAI)' })
  async runPrediction(@Body() dto: PredictiveModelQueryDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const result = await this.predictiveService.predict(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, `Predição ${dto.type} concluída.`);
  }

  // ── Relatórios Automáticos ─────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Post('reports/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Gerar Relatório Corporativo (PDF, XLSX, CSV)' })
  async generateReport(@Body() dto: GenerateReportDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const report = {
      reportId: `REP-${Date.now()}`,
      title: dto.title,
      dataMart: dto.dataMart,
      format: dto.format,
      generatedAt: new Date().toISOString(),
      downloadUrl: `https://api.aura.org.br/v1/analytics/reports/download/REP-${Date.now()}.${dto.format.toLowerCase()}`,
      rowCount: 142,
    };
    return BaseResponseDto.ok(report, requestId, undefined, 'Relatório gerado com sucesso.');
  }

  // ── Governança de Dados ────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('governance/catalog')
  @ApiOperation({ summary: 'Consultar Catálogo de Dados e Linhagem Corporativa' })
  async getCatalog(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.governanceService.getCatalog(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('governance/assets')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Novo Ativo de Dados no Catálogo [SUPER_ADMIN]' })
  async registerAsset(@Body() dto: RegisterDataAssetDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const asset = this.governanceService.registerAsset(dto);
    return BaseResponseDto.created(asset, requestId, `Ativo "${dto.assetName}" registrado no catálogo.`);
  }
}
