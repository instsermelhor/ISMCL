import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { AutomationAuditService } from './automation-audit.service';
import { HyperautomationService } from './hyperautomation.service';
import { IntelligentWorkflowService } from './intelligent-workflow.service';
import { RpaOrchestrationService } from './rpa-orchestration.service';
import { AutonomousAgentService } from './autonomous-agent.service';
import { ProcessMiningService } from './process-mining.service';
import { DecisionAutomationService } from './decision-automation.service';
import { HumanInTheLoopService } from './human-in-the-loop.service';
import { AutomationGovernanceService } from './automation-governance.service';
import { AutomationAnalyticsService } from './automation-analytics.service';

import {
  AutomationDomain,
  AutomationStatus,
  AgentType,
  RpaTaskStatus,
  DecisionOutcome,
  HumanLoopAction,
} from '../dto/enterprise-hyperautomation.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P174 EHCOP — Enterprise Hyperautomation, Cognitive Orchestration & Autonomous Agents', () => {
  let auditSvc: AutomationAuditService;
  let hyperSvc: HyperautomationService;
  let workflowSvc: IntelligentWorkflowService;
  let rpaSvc: RpaOrchestrationService;
  let agentSvc: AutonomousAgentService;
  let miningSvc: ProcessMiningService;
  let decisionSvc: DecisionAutomationService;
  let loopSvc: HumanInTheLoopService;
  let govSvc: AutomationGovernanceService;
  let analyticsSvc: AutomationAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(AutomationAuditService);
    hyperSvc = module.get(HyperautomationService);
    workflowSvc = module.get(IntelligentWorkflowService);
    rpaSvc = module.get(RpaOrchestrationService);
    agentSvc = module.get(AutonomousAgentService);
    miningSvc = module.get(ProcessMiningService);
    decisionSvc = module.get(DecisionAutomationService);
    loopSvc = module.get(HumanInTheLoopService);
    govSvc = module.get(AutomationGovernanceService);
    analyticsSvc = module.get(AutomationAnalyticsService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── AutomationAuditService ────────────────────────────────────────────────
  describe('AutomationAuditService', () => {
    it('deve registrar auditoria de automação com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('AUTOMATION_TEST', 'AUTO-001', 'CAO', { domain: 'FINANCIAL' });
      expect(entry.auditId).toMatch(/^EHCOP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });
  });

  // ── HyperautomationService ────────────────────────────────────────────────
  describe('HyperautomationService', () => {
    it('deve criar, aprovar, publicar e executar automação completa', async () => {
      const auto = await hyperSvc.createAutomation({
        automationId: 'AUTO-VOLUNTEER-ONBOARDING',
        name: 'Onboarding Automático de Voluntários',
        domain: AutomationDomain.VOLUNTEERING,
        description: 'Automatiza triagem, cadastro e integração de voluntários.',
        owner: 'Coordenadora de Voluntariado',
      }, 'CAO');

      expect(auto.status).toBe(AutomationStatus.DRAFT);

      await hyperSvc.approveAutomation('AUTO-VOLUNTEER-ONBOARDING', 'CGO');
      const published = await hyperSvc.publishAutomation('AUTO-VOLUNTEER-ONBOARDING', 'CAO');
      expect(published.status).toBe(AutomationStatus.ACTIVE);

      const result = await hyperSvc.executeAutomation('AUTO-VOLUNTEER-ONBOARDING', 'SCHEDULER');
      expect(result.status).toBe('SUCCESS');
      expect(result.stepsExecuted).toBeGreaterThan(0);
    });

    it('deve rejeitar execução de automação não-ativa', async () => {
      await hyperSvc.createAutomation({
        automationId: 'AUTO-DRAFT-ONLY',
        name: 'Automação em Rascunho',
        domain: AutomationDomain.ADMINISTRATIVE,
        description: 'Teste',
        owner: 'Admin',
      }, 'CAO');

      await expect(hyperSvc.executeAutomation('AUTO-DRAFT-ONLY', 'USER')).rejects.toThrow(/ATIVA/);
    });
  });

  // ── IntelligentWorkflowService ────────────────────────────────────────────
  describe('IntelligentWorkflowService', () => {
    it('deve registrar e executar workflow com steps automatizados e humanos', async () => {
      const wf = await workflowSvc.registerWorkflow(
        'WF-BENEFIT-ELIGIBILITY',
        'Fluxo de Eligibilidade de Benefício',
        [
          { stepId: 'S1', name: 'Coleta de Dados', type: 'AUTOMATED', handler: 'DataCollector', timeoutSeconds: 30, retryPolicy: { maxRetries: 2, backoffMs: 1000 } },
          { stepId: 'S2', name: 'Análise de Elegibilidade', type: 'DECISION', handler: 'EligibilityEngine', timeoutSeconds: 10, retryPolicy: { maxRetries: 1, backoffMs: 500 } },
          { stepId: 'S3', name: 'Validação Assistente Social', type: 'HUMAN_TASK', handler: 'SocialWorker', timeoutSeconds: 3600, retryPolicy: { maxRetries: 0, backoffMs: 0 } },
        ],
        ['BENEFIT_REQUEST_SUBMITTED'],
      );

      expect(wf.workflowId).toBe('WF-BENEFIT-ELIGIBILITY');
      expect(wf.steps).toHaveLength(3);

      const exec = await workflowSvc.executeWorkflow('WF-BENEFIT-ELIGIBILITY', 'EventBus');
      expect(exec.status).toBe('SUSPENDED'); // aguarda passo humano
      expect(exec.pendingStep).toBe('S3');
    });
  });

  // ── RpaOrchestrationService ───────────────────────────────────────────────
  describe('RpaOrchestrationService', () => {
    it('deve enfileirar e executar tarefa RPA com registro completo', async () => {
      const task = await rpaSvc.enqueueTask({
        taskId: 'RPA-REPORTS-JUL-2026',
        taskName: 'Geração de Relatórios Sociais — Julho 2026',
        robotName: 'ReportBot-v3.2',
        domain: AutomationDomain.SOCIAL_ASSISTANCE,
        parameters: { month: '2026-07', format: 'PDF' },
      }, 'SCHEDULER');

      expect(task.status).toBe(RpaTaskStatus.QUEUED);
      expect(rpaSvc.getQueueDepth()).toBe(1);

      const completed = await rpaSvc.executeTask('RPA-REPORTS-JUL-2026');
      expect(completed.status).toBe(RpaTaskStatus.COMPLETED);
      expect(completed.durationMs).toBeGreaterThan(0);
      expect(rpaSvc.getQueueDepth()).toBe(0);
    });
  });

  // ── AutonomousAgentService ────────────────────────────────────────────────
  describe('AutonomousAgentService', () => {
    it('deve ativar agente de compliance e registrar ação com limite de permissões', async () => {
      const agent = await agentSvc.activateAgent({
        agentType: AgentType.COMPLIANCE,
        mission: 'Verificação semanal de conformidade LGPD',
        permissions: { contextual_memory: false, max_actions: 3 },
      }, 'CISO');

      expect(agent.agentId).toMatch(/^AGENT-COMPLIANCE-/);
      expect(agent.status).toBe('ACTIVE');

      const action = await agentSvc.recordAgentAction(agent.agentId, 'Verificação de domínio BENEFICIARIES: CONFORME', 'SUCCESS');
      expect(action.outcome).toBe('SUCCESS');

      await agentSvc.recordAgentAction(agent.agentId, 'Verificação de domínio FINANCIAL: CONFORME', 'SUCCESS');
      await agentSvc.recordAgentAction(agent.agentId, 'Verificação de domínio HEALTH_CARE: CONFORME', 'SUCCESS');

      // 4ª ação deve lançar erro (limite = 3)
      await expect(agentSvc.recordAgentAction(agent.agentId, 'Ação extra', 'SUCCESS')).rejects.toThrow(/limite/);
      expect(agentSvc.getAgent(agent.agentId)?.status).toBe('SUSPENDED');
    });
  });

  // ── ProcessMiningService ──────────────────────────────────────────────────
  describe('ProcessMiningService', () => {
    it('deve minerar processo financeiro e identificar oportunidades de automação', async () => {
      const result = await miningSvc.mineProcess('Conciliação Bancária Mensal', AutomationDomain.FINANCIAL, 'CAO');
      expect(result.miningId).toMatch(/^MINING-/);
      expect(result.automationOpportunities.length).toBeGreaterThan(0);
      expect(result.bottlenecks.length).toBeGreaterThan(0);
      expect(result.complianceRate).toBeGreaterThan(0);
    });
  });

  // ── DecisionAutomationService ─────────────────────────────────────────────
  describe('DecisionAutomationService', () => {
    it('deve aprovar automaticamente família em extrema pobreza', async () => {
      const decision = await decisionSvc.automateDecision({
        decisionId: 'DEC-BENEFIT-001',
        decisionName: 'Elegibilidade Cesta Básica',
        contextData: { monthlyIncome: 500, householdSize: 5, activeRegistration: true },
        ruleSetId: 'RULE-BENEFIT-ELIGIBILITY-V2',
      }, 'SISTEMA');

      expect(decision.outcome).toBe(DecisionOutcome.APPROVED);
      expect(decision.confidenceScore).toBeGreaterThan(80);
      expect(decision.appliedRules.length).toBeGreaterThan(0);
      expect(decision.explanation).toBeTruthy();
    });

    it('deve escalonar para humano em caso limítrofe', async () => {
      const decision = await decisionSvc.automateDecision({
        decisionId: 'DEC-BENEFIT-002',
        decisionName: 'Elegibilidade Cesta Básica — Caso Limítrofe',
        contextData: { monthlyIncome: 2000, householdSize: 5, activeRegistration: true },
        ruleSetId: 'RULE-BENEFIT-ELIGIBILITY-V2',
      }, 'SISTEMA');

      expect(decision.outcome).toBe(DecisionOutcome.ESCALATED_HUMAN);
    });

    it('deve rejeitar cadastro inativo', async () => {
      const decision = await decisionSvc.automateDecision({
        decisionId: 'DEC-BENEFIT-003',
        decisionName: 'Elegibilidade — Cadastro Inativo',
        contextData: { monthlyIncome: 300, householdSize: 3, activeRegistration: false },
      }, 'SISTEMA');

      expect(decision.outcome).toBe(DecisionOutcome.REJECTED);
    });
  });

  // ── HumanInTheLoopService ─────────────────────────────────────────────────
  describe('HumanInTheLoopService', () => {
    it('deve solicitar e resolver aprovação humana para caso crítico', async () => {
      const loop = await loopSvc.requestHumanApproval(
        'LOOP-BENEFIT-EDGE-001',
        'Análise de Elegibilidade — Caso Especial',
        { beneficiaryId: 'B-9999', income: 450, household: 6 },
        'SUPERVISED',
      );

      expect(loop.status).toBe('PENDING');
      expect(loopSvc.listPendingLoops()).toHaveLength(1);

      const resolved = await loopSvc.resolveLoop({
        loopId: 'LOOP-BENEFIT-EDGE-001',
        action: HumanLoopAction.APPROVE,
        reviewerName: 'Assistente Social Dra. Carla',
        justification: 'Visita domiciliar confirmou vulnerabilidade.',
      });

      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolution?.action).toBe(HumanLoopAction.APPROVE);
    });
  });

  // ── AutomationGovernanceService ───────────────────────────────────────────
  describe('AutomationGovernanceService', () => {
    it('deve registrar política de governança e deprecar automação', async () => {
      const policy = await govSvc.registerPolicy('AUTO-VOLUNTEER-ONBOARDING', 'CGO_Principal', '1.0.0', false);
      expect(policy.policyId).toContain('AUTO-VOLUNTEER-ONBOARDING');
      expect(policy.status).toBe(AutomationStatus.APPROVED);

      await govSvc.deprecateAutomation('AUTO-VOLUNTEER-ONBOARDING', 'CAO', 'Substituída por versão 2.0');
      const updated = govSvc.listPolicies(AutomationStatus.DEPRECATED);
      expect(updated.length).toBeGreaterThan(0);
    });
  });

  // ── AutomationAnalyticsService ────────────────────────────────────────────
  describe('AutomationAnalyticsService', () => {
    it('deve gerar relatório executivo com ROA e indicadores de produtividade', async () => {
      const report = await analyticsSvc.generateAnalyticsReport('CAO');
      expect(report.reportId).toMatch(/^ANALYTICS-EHCOP-/);
      expect(report.returnOnAutomation).toBeGreaterThanOrEqual(0);
      expect(report.returnOnAutomation).toBeLessThanOrEqual(100);
      expect(report.timeSavedHours).toBeGreaterThan(0);
      expect(report.totalExecutions).toBeGreaterThan(0);
    });
  });
});
