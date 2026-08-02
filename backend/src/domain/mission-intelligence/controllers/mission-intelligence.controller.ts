import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';
import { MissionIntelligenceService } from '../services/mission-intelligence.service';
import { InstitutionalCommandCenterService } from '../services/institutional-command-center.service';
import { AutonomousGovernanceOrchestratorService } from '../services/autonomous-governance-orchestrator.service';
import { StrategicAlignmentService } from '../services/strategic-alignment.service';
import { InstitutionalPolicyEnforcementService } from '../services/institutional-policy-enforcement.service';
import { EnterpriseDecisionCoordinationService } from '../services/enterprise-decision-coordination.service';
import { CrossDomainIntelligenceService } from '../services/cross-domain-intelligence.service';
import { MissionPerformanceAnalyticsService } from '../services/mission-performance-analytics.service';
import { InstitutionalResilienceCoordinationService } from '../services/institutional-resilience-coordination.service';
import { ExecutiveGovernanceAuditService } from '../services/executive-governance-audit.service';
import {
  CoordinateDecisionDto,
  ExecuteGovernanceActionDto,
  RunCrossDomainAnalysisDto,
  SimulateResilienceScenarioDto,
  ValidateMissionAlignmentDto,
} from '../dto/mission-intelligence.dto';

@ApiTags('AEMIAG — Enterprise Mission Intelligence & Command Platform (P160)')
@ApiBearerAuth()
@Controller('api/v1/mission')
export class MissionIntelligenceController {
  constructor(
    private readonly missionCore: MissionIntelligenceService,
    private readonly commandCenter: InstitutionalCommandCenterService,
    private readonly governanceOrchestrator: AutonomousGovernanceOrchestratorService,
    private readonly alignmentService: StrategicAlignmentService,
    private readonly policyEnforcement: InstitutionalPolicyEnforcementService,
    private readonly decisionCoordination: EnterpriseDecisionCoordinationService,
    private readonly crossDomainService: CrossDomainIntelligenceService,
    private readonly performanceAnalytics: MissionPerformanceAnalyticsService,
    private readonly resilienceCoordination: InstitutionalResilienceCoordinationService,
    private readonly auditService: ExecutiveGovernanceAuditService,
  ) {}

  // ── 1. MISSION CORE & COMMAND CENTER ─────────────────────────────────────────

  @Get('state')
  @ApiOperation({ summary: 'Retorna a visão institucional consolidada do ecossistema Aura' })
  getMissionState() {
    return this.missionCore.getMissionState();
  }

  @Get('command-center')
  @ApiOperation({ summary: 'Painel executivo em tempo real do Centro de Comando Institucional' })
  async getCommandCenterDashboard() {
    return this.commandCenter.getCommandCenterDashboard();
  }

  // ── 2. STRATEGIC ALIGNMENT ──────────────────────────────────────────────────

  @Post('alignment/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valida o alinhamento estratégico de um projeto/iniciativa à missão' })
  async validateMissionAlignment(@Body() dto: ValidateMissionAlignmentDto) {
    return this.missionCore.validateMissionAlignment(dto);
  }

  @Get('alignment/check')
  @ApiOperation({ summary: 'Executa verificação contínua de alinhamento estratégico' })
  async checkStrategicAlignment() {
    return this.alignmentService.checkStrategicAlignment();
  }

  // ── 3. AUTONOMOUS GOVERNANCE & POLICIES ──────────────────────────────────────

  @Post('governance/orchestrate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Orquestra ação de governança autônoma (conformidade / políticas)' })
  async orchestrateGovernanceAction(@Body() dto: ExecuteGovernanceActionDto) {
    return this.governanceOrchestrator.orchestrateGovernanceAction(dto);
  }

  @Get('governance/policies/enforce')
  @ApiOperation({ summary: 'Fiscaliza e aplica políticas institucionais corporativas' })
  async enforceInstitutionalPolicies() {
    return this.policyEnforcement.enforceInstitutionalPolicies();
  }

  // ── 4. DECISION COORDINATION & CROSS-DOMAIN INTELLIGENCE ─────────────────────

  @Post('decisions/coordinate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Coordena decisão executiva ponta a ponta com lições aprendidas' })
  async coordinateDecision(@Body() dto: CoordinateDecisionDto) {
    return this.decisionCoordination.coordinateDecision(dto);
  }

  @Get('decisions/history')
  @ApiOperation({ summary: 'Retorna o histórico corporativo de decisões coordenadas' })
  getDecisionHistory() {
    return this.decisionCoordination.getDecisionHistory();
  }

  @Post('cross-domain/analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executa análise de inteligência transversal entre domínios' })
  async runCrossDomainAnalysis(@Body() dto: RunCrossDomainAnalysisDto) {
    return this.crossDomainService.runCrossDomainAnalysis(dto);
  }

  // ── 5. PERFORMANCE ANALYTICS & RESILIENCE ────────────────────────────────────

  @Get('performance')
  @ApiOperation({ summary: 'Retorna o analytics de desempenho orientado por missão e impacto social' })
  async calculateMissionPerformance() {
    return this.performanceAnalytics.calculateMissionPerformance();
  }

  @Post('resilience/simulate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simula cenário de estresse institucional/resiliência' })
  async simulateResilienceScenario(@Body() dto: SimulateResilienceScenarioDto) {
    return this.resilienceCoordination.simulateResilienceScenario(dto);
  }

  // ── 6. EXECUTIVE AUDIT TRAIL ────────────────────────────────────────────────

  @Get('audit/trail')
  @ApiOperation({ summary: 'Consulta a trilha imutável de auditoria de comando executivo (SHA-256)' })
  @ApiQuery({ name: 'component', required: false, type: String })
  getAuditTrail(@Query('component') component?: string) {
    return this.auditService.getAuditTrail(component);
  }
}
