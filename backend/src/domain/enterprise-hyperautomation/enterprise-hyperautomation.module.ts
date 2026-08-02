import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { AutomationAuditService } from './services/automation-audit.service';
import { HyperautomationService } from './services/hyperautomation.service';
import { IntelligentWorkflowService } from './services/intelligent-workflow.service';
import { RpaOrchestrationService } from './services/rpa-orchestration.service';
import { AutonomousAgentService } from './services/autonomous-agent.service';
import { ProcessMiningService } from './services/process-mining.service';
import { DecisionAutomationService } from './services/decision-automation.service';
import { HumanInTheLoopService } from './services/human-in-the-loop.service';
import { AutomationGovernanceService } from './services/automation-governance.service';
import { AutomationAnalyticsService } from './services/automation-analytics.service';

// Controller
import { EnterpriseHyperautomationController } from './controllers/enterprise-hyperautomation.controller';

/**
 * EnterpriseHyperautomationModule — P174 EHCOP (Fase XXIV)
 *
 * Plataforma Corporativa de Hyperautomation, Orquestração Cognitiva e Agentes Autônomos.
 * Conecta BPM, RPA, Decision Intelligence, Agentes de IA, Event-Driven Automation,
 * Process Mining e Human-in-the-Loop em um modelo unificado de automação auditável.
 *
 * Componentes:
 * - AutomationAuditService          — Trilha imutável SHA-256
 * - HyperautomationService          — Ciclo de vida de automações (Draft → Active)
 * - IntelligentWorkflowService      — Workflows inteligentes multi-etapa
 * - RpaOrchestrationService         — Orquestração de robôs RPA
 * - AutonomousAgentService          — 9 tipos de agentes autônomos especializados
 * - ProcessMiningService            — Mineração e análise de processos institucionais
 * - DecisionAutomationService       — Decisões explicáveis (XAI) baseadas em regras + IA
 * - HumanInTheLoopService           — Supervisão humana configurável por processo
 * - AutomationGovernanceService     — Governança e controle de ciclo de vida
 * - AutomationAnalyticsService      — KPIs executivos: ROA, produtividade, economia de tempo
 */
@Module({
  imports: [EventBusModule],
  providers: [
    AutomationAuditService,
    HyperautomationService,
    IntelligentWorkflowService,
    RpaOrchestrationService,
    AutonomousAgentService,
    ProcessMiningService,
    DecisionAutomationService,
    HumanInTheLoopService,
    AutomationGovernanceService,
    AutomationAnalyticsService,
  ],
  controllers: [EnterpriseHyperautomationController],
  exports: [
    AutomationAuditService,
    HyperautomationService,
    IntelligentWorkflowService,
    RpaOrchestrationService,
    AutonomousAgentService,
    ProcessMiningService,
    DecisionAutomationService,
    HumanInTheLoopService,
    AutomationGovernanceService,
    AutomationAnalyticsService,
  ],
})
export class EnterpriseHyperautomationModule {}
