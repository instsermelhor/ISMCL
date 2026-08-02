import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { StrategyAuditService } from './services/strategy-audit.service';
import { StrategicPlanningService } from './services/strategic-planning.service';
import { OKRManagementService } from './services/okr-management.service';
import { BalancedScorecardService } from './services/balanced-scorecard.service';
import { InstitutionalKpiService } from './services/institutional-kpi.service';
import { StrategicPortfolioService } from './services/strategic-portfolio.service';
import { BudgetAlignmentService } from './services/budget-alignment.service';
import { StrategicRiskService } from './services/strategic-risk.service';
import { PerformanceEvaluationService } from './services/performance-evaluation.service';
import { ExecutiveDashboardService } from './services/executive-dashboard.service';

// Controller
import { EnterpriseStrategyController } from './controllers/enterprise-strategy.controller';

/**
 * EnterpriseStrategyModule — P168 ESGP (Fase XVIII)
 *
 * Plataforma Corporativa de Estratégia, Governança e Gestão de Desempenho.
 * Conecta planejamento estratégico, OKRs, Balanced Scorecard, KPIs institucionais,
 * portfólio estratégico, alinhamento orçamentário, riscos estratégicos e
 * avaliação contínua de desempenho em um único ecossistema de governança.
 *
 * Componentes:
 * - StrategyAuditService          — Auditoria imutável SHA-256
 * - StrategicPlanningService      — Missão, visão, valores, objetivos + versionamento
 * - OKRManagementService          — OKRs em cascata (institucional → equipe)
 * - BalancedScorecardService      — BSC com 6 perspectivas customizadas
 * - InstitutionalKpiService       — Catálogo corporativo de KPIs
 * - StrategicPortfolioService     — Portfólio de programas, projetos e iniciativas
 * - BudgetAlignmentService        — Alinhamento orçamento ↔ estratégia
 * - StrategicRiskService          — Riscos estratégicos com matriz 4×4
 * - PerformanceEvaluationService  — OPI com IA preditiva e recomendações
 * - ExecutiveDashboardService     — Dashboard executivo consolidado
 */
@Module({
  imports: [EventBusModule],
  providers: [
    StrategyAuditService,
    StrategicPlanningService,
    OKRManagementService,
    BalancedScorecardService,
    InstitutionalKpiService,
    StrategicPortfolioService,
    BudgetAlignmentService,
    StrategicRiskService,
    PerformanceEvaluationService,
    ExecutiveDashboardService,
  ],
  controllers: [EnterpriseStrategyController],
  exports: [
    StrategyAuditService,
    StrategicPlanningService,
    OKRManagementService,
    BalancedScorecardService,
    InstitutionalKpiService,
    StrategicPortfolioService,
    BudgetAlignmentService,
    StrategicRiskService,
    PerformanceEvaluationService,
    ExecutiveDashboardService,
  ],
})
export class EnterpriseStrategyModule {}
