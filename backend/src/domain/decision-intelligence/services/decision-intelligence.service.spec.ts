import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DecisionIntelligenceService } from './decision-intelligence.service';
import { DecisionRecommendationService } from './decision-recommendation.service';
import { DecisionGovernanceService } from './decision-governance.service';
import { EvidenceManagementService } from './evidence-management.service';
import { ExplainableAiDecisionService } from './explainable-ai-decision.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { PrescriptiveAnalyticsService } from './prescriptive-analytics.service';
import { ExecutiveKpiIntelligenceService } from './executive-kpi-intelligence.service';
import { ExecutiveAnalyticsService } from './executive-analytics.service';
import { DecisionAuditService } from './decision-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ConfidenceLevel,
  DecisionDomain,
  DecisionStatus,
  DecisionUrgency,
  EvidenceType,
  KpiStatus,
} from '../dto/decision-intelligence.dto';

// ── Mock Factory ───────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-adip-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
};

const mockEventEmitter = { emit: jest.fn(), on: jest.fn() };

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('ADIP — Decision Intelligence Platform Services (P159)', () => {
  let decisionHub: DecisionIntelligenceService;
  let recommendationService: DecisionRecommendationService;
  let governanceService: DecisionGovernanceService;
  let evidenceService: EvidenceManagementService;
  let xaiService: ExplainableAiDecisionService;
  let predictiveService: PredictiveAnalyticsService;
  let prescriptiveService: PrescriptiveAnalyticsService;
  let kpiService: ExecutiveKpiIntelligenceService;
  let executiveAnalytics: ExecutiveAnalyticsService;
  let auditService: DecisionAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionAuditService,
        EvidenceManagementService,
        ExplainableAiDecisionService,
        PredictiveAnalyticsService,
        PrescriptiveAnalyticsService,
        ExecutiveKpiIntelligenceService,
        DecisionRecommendationService,
        DecisionGovernanceService,
        ExecutiveAnalyticsService,
        DecisionIntelligenceService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    decisionHub           = module.get<DecisionIntelligenceService>(DecisionIntelligenceService);
    recommendationService = module.get<DecisionRecommendationService>(DecisionRecommendationService);
    governanceService     = module.get<DecisionGovernanceService>(DecisionGovernanceService);
    evidenceService       = module.get<EvidenceManagementService>(EvidenceManagementService);
    xaiService            = module.get<ExplainableAiDecisionService>(ExplainableAiDecisionService);
    predictiveService     = module.get<PredictiveAnalyticsService>(PredictiveAnalyticsService);
    prescriptiveService   = module.get<PrescriptiveAnalyticsService>(PrescriptiveAnalyticsService);
    kpiService            = module.get<ExecutiveKpiIntelligenceService>(ExecutiveKpiIntelligenceService);
    executiveAnalytics    = module.get<ExecutiveAnalyticsService>(ExecutiveAnalyticsService);
    auditService          = module.get<DecisionAuditService>(DecisionAuditService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. DecisionAuditService — Auditoria SHA-256 Imutável
  // ════════════════════════════════════════════════════════════════════════════

  describe('DecisionAuditService', () => {
    it('deve registrar auditoria SHA-256 e publicar CloudEvent', async () => {
      const entry = await auditService.recordDecisionAudit('CREATE', 'DEC-001', 'CEO-01', { detail: 'test' });

      expect(entry.auditId).toMatch(/^DAC-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.operation).toBe('CREATE');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.audit.completed.v1',
        expect.objectContaining({ auditId: entry.auditId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve filtrar trilha por ID de recomendação', async () => {
      await auditService.recordDecisionAudit('EVALUATE', 'DEC-100', 'GESTOR-01');
      await auditService.recordDecisionAudit('EVALUATE', 'DEC-200', 'GESTOR-02');

      const trail = auditService.getAuditTrail('DEC-100');
      expect(trail.length).toBeGreaterThan(0);
      expect(trail.every((e) => e.recommendationId === 'DEC-100')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EvidenceManagementService — Gestão de Evidências Rastreáveis
  // ════════════════════════════════════════════════════════════════════════════

  describe('EvidenceManagementService', () => {
    it('deve registrar evidência e publicar CloudEvent', async () => {
      const ev = await evidenceService.recordEvidence({
        evidenceType: EvidenceType.KNOWLEDGE_DOCUMENT,
        title: 'POP de Triagem Assistencial',
        description: 'POP KNOWLEDGE-2026-001 estipula fluxo de acolhimento',
        sourceEntityId: 'KNOWLEDGE-2026-001',
      });

      expect(ev.evidenceId).toMatch(/^EVID-/);
      expect(ev.evidenceType).toBe(EvidenceType.KNOWLEDGE_DOCUMENT);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.evidence.collected.v1',
        expect.objectContaining({ evidenceId: ev.evidenceId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve listar evidências pré-cadastradas (seed)', () => {
      const list = evidenceService.listEvidences();
      expect(list.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. ExplainableAiDecisionService — Relatórios XAI
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExplainableAiDecisionService', () => {
    it('deve gerar relatório XAI com grau de confiança, fatores de influência e limitações', () => {
      const report = xaiService.generateExplanation('DEC-001', ['EVID-001'], 'ASSISTENTIAL');

      expect(report.recommendationId).toBe('DEC-001');
      expect(report.confidenceScorePercent).toBeGreaterThan(90);
      expect(report.confidenceLevel).toBe(ConfidenceLevel.VERY_HIGH);
      expect(report.primaryInfluencingFactors.length).toBeGreaterThan(0);
      expect(report.appliedRules.length).toBeGreaterThan(0);
      expect(report.limitationsAndUncertainties.length).toBeGreaterThan(0);
      expect(report.consideredAlternatives.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. PredictiveAnalyticsService — Projeções de Risco e Demanda
  // ════════════════════════════════════════════════════════════════════════════

  describe('PredictiveAnalyticsService', () => {
    it('deve executar análise preditiva de 12 meses e publicar CloudEvent', async () => {
      const res = await predictiveService.runPredictiveAnalysis({
        domain: DecisionDomain.ASSISTENTIAL,
        timeHorizonMonths: 12,
      });

      expect(res.analysisId).toMatch(/^PRED-ANL-/);
      expect(res.projections).toHaveLength(12);
      expect(res.identifiedRisks.length).toBeGreaterThan(0);
      expect(res.recalibrationStatus).toBe('CALIBRATED');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.predictive.completed.v1',
        expect.objectContaining({ analysisId: res.analysisId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. PrescriptiveAnalyticsService — Trade-offs de Alternativas
  // ════════════════════════════════════════════════════════════════════════════

  describe('PrescriptiveAnalyticsService', () => {
    it('deve gerar 3 opções com trade-offs e recomendar a de melhor impacto/custo', async () => {
      const res = await prescriptiveService.runPrescriptiveAnalysis({
        decisionContextId: 'DEC-001',
        constraints: { maxBudgetBrl: 50000 },
      });

      expect(res.analysisId).toMatch(/^PRES-ANL-/);
      expect(res.options).toHaveLength(3);
      expect(res.recommendedOptionId).toBeTruthy();

      const recOption = res.options.find((o) => o.optionId === res.recommendedOptionId);
      expect(recOption?.isRecommended).toBe(true);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.prescriptive.completed.v1',
        expect.objectContaining({ analysisId: res.analysisId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. ExecutiveKpiIntelligenceService — Gestão Inteligente de KPIs
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExecutiveKpiIntelligenceService', () => {
    it('deve listar KPIs pré-cadastrados (seed)', () => {
      const kpis = kpiService.listKpis();
      expect(kpis.length).toBeGreaterThanOrEqual(4);
    });

    it('deve registrar KPI com desvio crítico e publicar alerta CloudEvent', async () => {
      const kpi = await kpiService.registerKpi({
        name: 'Tempo Médio de Atendimento Clínico',
        description: 'Mede tempo médio em minutos por atendimento',
        domain: DecisionDomain.CLINICAL,
        targetValue: 30,
        currentValue: 55, // Desvio significativo (>+80%)
        unit: 'min',
      });

      expect(kpi.kpiId).toMatch(/^KPI-/);
      expect(kpi.status).toBe(KpiStatus.CRITICAL_DEVIATION);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.kpi.alert.detected.v1',
        expect.objectContaining({ kpiId: kpi.kpiId, status: KpiStatus.CRITICAL_DEVIATION }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. DecisionRecommendationService — Motor de Recomendações Prescritivas
  // ════════════════════════════════════════════════════════════════════════════

  describe('DecisionRecommendationService', () => {
    it('deve criar recomendação com evidências e relatório XAI', async () => {
      const rec = await recommendationService.createRecommendation({
        title: 'Expansão de Horário de Atendimento',
        contextDescription: 'Gargalo no horário noturno',
        domain: DecisionDomain.OPERATIONAL,
        urgency: DecisionUrgency.MEDIUM,
      });

      expect(rec.recommendationId).toMatch(/^DEC-/);
      expect(rec.status).toBe(DecisionStatus.PROPOSED);
      expect(rec.evidences.length).toBeGreaterThan(0);
      expect(rec.xaiReport).toBeDefined();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.recommendation.generated.v1',
        expect.objectContaining({ recommendationId: rec.recommendationId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. DecisionGovernanceService — Governança Humana (Human-in-the-Loop)
  // ════════════════════════════════════════════════════════════════════════════

  describe('DecisionGovernanceService', () => {
    it('deve aprovar decisão com justificativa humana e publicar CloudEvent', async () => {
      const rec = await recommendationService.createRecommendation({
        title: 'Alocação de Recursos Emergenciais',
        contextDescription: 'Situação de surto leve',
        domain: DecisionDomain.CLINICAL,
        urgency: DecisionUrgency.HIGH,
      });

      const approved = await governanceService.approveDecision({
        recommendationId: rec.recommendationId,
        selectedOptionId: 'OPT-A',
        justification: 'Aprovado com base no parecer técnico da equipe de infectologia',
        evaluatedBy: 'GESTOR-CLINICO-01',
      });

      expect(approved.status).toBe(DecisionStatus.APPROVED);
      expect(approved.evaluatedBy).toBe('GESTOR-CLINICO-01');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.approved.v1',
        expect.objectContaining({ recommendationId: rec.recommendationId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve rejeitar decisão com justificativa humana e publicar CloudEvent', async () => {
      const rec = await recommendationService.createRecommendation({
        title: 'Aquisição de Novo Equipamento',
        contextDescription: 'Proposta de alto custo',
        domain: DecisionDomain.FINANCIAL,
        urgency: DecisionUrgency.LOW,
      });

      const rejected = await governanceService.rejectDecision({
        recommendationId: rec.recommendationId,
        selectedOptionId: 'REJECTED',
        justification: 'Rejeitado por restrição orçamentária no trimestre atual',
        evaluatedBy: 'CFO-01',
      });

      expect(rejected.status).toBe(DecisionStatus.REJECTED);
      expect(rejected.evaluatedBy).toBe('CFO-01');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.rejected.v1',
        expect.objectContaining({ recommendationId: rec.recommendationId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. ExecutiveAnalyticsService — Painel Executivo
  // ════════════════════════════════════════════════════════════════════════════

  describe('ExecutiveAnalyticsService', () => {
    it('deve gerar painel executivo consolidado e publicar CloudEvent', async () => {
      const dashboard = await executiveAnalytics.generateExecutiveDashboard();

      expect(dashboard.dashboardId).toMatch(/^DEC-DASH-/);
      expect(dashboard.totalRecommendationsProposed).toBeGreaterThan(0);
      expect(dashboard.kpiSummary.totalKpis).toBeGreaterThan(0);
      expect(dashboard.keyTrends.length).toBeGreaterThan(0);
      expect(dashboard.topRisks.length).toBeGreaterThan(0);
      expect(dashboard.strategicSummary).toBeTruthy();
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.decision.executive.dashboard.updated.v1',
        expect.objectContaining({ dashboardId: dashboard.dashboardId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. DecisionIntelligenceService — Hub Orquestrador
  // ════════════════════════════════════════════════════════════════════════════

  describe('DecisionIntelligenceService', () => {
    it('deve orquestrar o fluxo completo de decisão via processDecisionRequest', async () => {
      const rec = await decisionHub.processDecisionRequest({
        title: 'Reestruturação do Atendimento Preventivo',
        contextDescription: 'Ajuste de capacidade para o Polo Norte',
        domain: DecisionDomain.STRATEGIC,
        urgency: DecisionUrgency.MEDIUM,
      });

      expect(rec.recommendationId).toMatch(/^DEC-/);
      expect(rec.evidences.length).toBeGreaterThan(0);
      expect(rec.xaiReport.confidenceScorePercent).toBeGreaterThan(90);
    });
  });
});
