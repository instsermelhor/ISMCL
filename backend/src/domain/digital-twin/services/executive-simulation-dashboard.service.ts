import { Injectable, Logger } from '@nestjs/common';
import { DigitalTwinCoreService } from './digital-twin-core.service';
import { StrategicScenarioModelingService } from './strategic-scenario-modeling.service';
import { InstitutionalForecastService } from './institutional-forecast.service';
import { DigitalTwinGovernanceService } from './digital-twin-governance.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ForecastHorizon } from '../dto/digital-twin.dto';

export interface ExecutiveSimulationDashboard {
  dashboardId: string;
  generatedAt: string;
  currentOrganizationalState: ReturnType<DigitalTwinCoreService['getCurrentState']>;
  activeScenarios: number;
  topScenarioName: string;
  forecastSustainabilityScore: number;
  naturalLanguageQuery?: string;
  naturalLanguageAnswer?: string;
  keyTrends: string[];
  topRisks: string[];
  topOpportunities: string[];
  executiveSummary: string;
}

/**
 * ExecutiveSimulationDashboardService — Painel Executivo do Digital Twin (P157 ADT)
 *
 * Consolida o estado atual do Digital Twin, cenários simulados, indicadores comparativos,
 * tendências, previsões, riscos e oportunidades em um painel executivo único.
 * Suporta consultas em linguagem natural (NLQ) sobre o estado do Digital Twin.
 */
@Injectable()
export class ExecutiveSimulationDashboardService {
  private readonly logger = new Logger(ExecutiveSimulationDashboardService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly twinCore: DigitalTwinCoreService,
    private readonly scenarioModeling: StrategicScenarioModelingService,
    private readonly forecastService: InstitutionalForecastService,
    private readonly governance: DigitalTwinGovernanceService,
    private readonly eventBus: EventBusService,
  ) {}

  async generateExecutiveDashboard(naturalLanguageQuery?: string): Promise<ExecutiveSimulationDashboard> {
    const year = new Date().getFullYear();
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const dashboardId = `DT-DASH-${year}-${seq}`;

    const currentState = this.twinCore.getCurrentState();
    const scenarios = this.scenarioModeling.listScenarios();

    // Gera previsão de 12 meses para o painel
    const forecast = await this.forecastService.generateForecast({ horizon: ForecastHorizon.TWELVE_MONTHS });

    const topScenario = scenarios[0];

    // Resposta NLQ simples baseada em palavras-chave
    let nlAnswer: string | undefined;
    if (naturalLanguageQuery) {
      const q = naturalLanguageQuery.toLowerCase();
      if (q.includes('beneficiário') || q.includes('atendimento')) {
        nlAnswer = `Atualmente ${currentState.organization.activeBeneficiaries.toLocaleString()} beneficiários ativos, com capacidade de ${currentState.organization.monthlyAttendanceCapacity.toLocaleString()} atendimentos/mês (${currentState.organization.currentOccupancyPercent}% de ocupação).`;
      } else if (q.includes('sustentab') || q.includes('financeiro')) {
        nlAnswer = `Score de sustentabilidade em 12 meses: ${forecast.sustainabilityScore}/100. Principal risco: ${forecast.keyRisks[0]}.`;
      } else if (q.includes('cenário') || q.includes('simulação')) {
        nlAnswer = `${scenarios.length} cenários ativos. Último criado: "${topScenario?.name ?? 'N/A'}".`;
      } else {
        nlAnswer = `O Instituto Ser Melhor opera com ${currentState.organization.totalStaff} profissionais, ${currentState.organization.activePrograms} programas ativos e NPS de ${currentState.indicators.nps}. Score de impacto social: ${currentState.indicators.socialImpactScore}.`;
      }
    }

    const dashboard: ExecutiveSimulationDashboard = {
      dashboardId,
      generatedAt: new Date().toISOString(),
      currentOrganizationalState: currentState,
      activeScenarios: scenarios.length,
      topScenarioName: topScenario?.name ?? 'N/A',
      forecastSustainabilityScore: forecast.sustainabilityScore,
      naturalLanguageQuery,
      naturalLanguageAnswer: nlAnswer,
      keyTrends: [
        'Crescimento de demanda de +0.8%/mês nos últimos 6 meses',
        'Taxa de automação operacional aumentando para 72.4%',
        'NPS estável em 74 pontos',
      ],
      topRisks: forecast.keyRisks,
      topOpportunities: forecast.keyOpportunities,
      executiveSummary: `Digital Twin atualizado em ${currentState.snapshotAt}. Estado: OPERACIONAL. ${scenarios.length} cenários estratégicos disponíveis. Sustentabilidade projetada 12 meses: ${forecast.sustainabilityScore}/100.`,
    };

    await this.governance.recordTwinAudit('executive-simulation-dashboard', 'ExecutiveDashboardGenerated', {
      dashboardId, activeScenarios: scenarios.length, forecastSustainabilityScore: forecast.sustainabilityScore,
    });

    await this.eventBus.publish(
      'aura.digitaltwin.executive.simulation.generated.v1',
      { dashboardId, activeScenarios: scenarios.length, forecastSustainabilityScore: forecast.sustainabilityScore },
      this.SYSTEM_TENANT,
      { subject: dashboardId },
    );

    this.logger.log(`[ExecutiveDashboard] ${dashboardId} generated → Sustainability: ${forecast.sustainabilityScore}`);
    return dashboard;
  }
}
