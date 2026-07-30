import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AutonomousEvolutionEngineService } from './autonomous-evolution-engine.service';
import { ContinuousImprovementService } from './continuous-improvement.service';
import { AdaptiveProcessOptimizationService } from './adaptive-process-optimization.service';
import { InnovationManagementService } from './innovation-management.service';
import { ChangeImpactAnalysisService } from './change-impact-analysis.service';
import { InstitutionalLearningService } from './institutional-learning.service';
import { StrategicRecommendationService } from './strategic-recommendation.service';
import { GovernanceApprovalService } from './governance-approval.service';
import { EvolutionKnowledgeBaseService } from './evolution-knowledge-base.service';
import { ContinuousEvolutionAuditService } from './continuous-evolution-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  ApprovalStatus,
  EvolutionType,
  ImpactDimension,
  ImprovementCategory,
  InnovationPhase,
  LearningCategory,
  StrategicCategory,
} from '../dto/autonomous-evolution.dto';

// ── Mock Factories ─────────────────────────────────────────────────────────────

const mockEventBusService = {
  emit: jest.fn().mockResolvedValue(undefined),
  publish: jest.fn().mockResolvedValue({ id: 'evt-evo-mock-001', type: 'mock.event', data: {} }),
  subscribe: jest.fn(),
  getDlq: jest.fn().mockReturnValue([]),
  replayDlq: jest.fn().mockResolvedValue(0),
};

const mockEventEmitter = {
  emit: jest.fn(),
  on: jest.fn(),
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('AAEE — Autonomous Evolution Engine Services (P153)', () => {
  let evolutionEngine: AutonomousEvolutionEngineService;
  let continuousImprovement: ContinuousImprovementService;
  let adaptiveOptimization: AdaptiveProcessOptimizationService;
  let innovationManagement: InnovationManagementService;
  let changeImpactAnalysis: ChangeImpactAnalysisService;
  let institutionalLearning: InstitutionalLearningService;
  let strategicRecommendation: StrategicRecommendationService;
  let governanceApproval: GovernanceApprovalService;
  let knowledgeBase: EvolutionKnowledgeBaseService;
  let evolutionAudit: ContinuousEvolutionAuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutonomousEvolutionEngineService,
        ContinuousImprovementService,
        AdaptiveProcessOptimizationService,
        InnovationManagementService,
        ChangeImpactAnalysisService,
        InstitutionalLearningService,
        StrategicRecommendationService,
        GovernanceApprovalService,
        EvolutionKnowledgeBaseService,
        ContinuousEvolutionAuditService,
        { provide: EventBusService, useValue: mockEventBusService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    evolutionEngine        = module.get<AutonomousEvolutionEngineService>(AutonomousEvolutionEngineService);
    continuousImprovement  = module.get<ContinuousImprovementService>(ContinuousImprovementService);
    adaptiveOptimization  = module.get<AdaptiveProcessOptimizationService>(AdaptiveProcessOptimizationService);
    innovationManagement  = module.get<InnovationManagementService>(InnovationManagementService);
    changeImpactAnalysis  = module.get<ChangeImpactAnalysisService>(ChangeImpactAnalysisService);
    institutionalLearning  = module.get<InstitutionalLearningService>(InstitutionalLearningService);
    strategicRecommendation = module.get<StrategicRecommendationService>(StrategicRecommendationService);
    governanceApproval     = module.get<GovernanceApprovalService>(GovernanceApprovalService);
    knowledgeBase         = module.get<EvolutionKnowledgeBaseService>(EvolutionKnowledgeBaseService);
    evolutionAudit        = module.get<ContinuousEvolutionAuditService>(ContinuousEvolutionAuditService);
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 1. ContinuousEvolutionAuditService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ContinuousEvolutionAuditService', () => {
    it('deve registrar auditoria de evolução assinada com SHA-256', async () => {
      const audit = await evolutionAudit.recordEvolutionAudit({
        componentName: 'test-component',
        actionName: 'TestActionExecuted',
        details: { foo: 'bar' },
        humanSupervisorId: 'SUPER-001',
      });

      expect(audit).toBeDefined();
      expect(audit.auditId).toMatch(/^AUD-EVO-/);
      expect(audit.logId).toMatch(/^EVO-AUD-2026-/);
      expect(audit.sha256Signature).toHaveLength(64);
      expect(audit.humanSupervisorId).toBe('SUPER-001');
    });

    it('deve filtrar trilha por nome de componente', async () => {
      await evolutionAudit.recordEvolutionAudit({
        componentName: 'component-a',
        actionName: 'ActionA',
        details: {},
      });

      const list = evolutionAudit.getEvolutionAuditTrail('component-a');
      expect(list.length).toBeGreaterThan(0);
      expect(list.every((l) => l.componentName === 'component-a')).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. EvolutionKnowledgeBaseService
  // ════════════════════════════════════════════════════════════════════════════

  describe('EvolutionKnowledgeBaseService', () => {
    it('deve armazenar e buscar registros de conhecimento com versionamento', async () => {
      const record = await knowledgeBase.storeKnowledge(
        'LESSON_LEARNED',
        'TEST_KEY_001',
        { lesson: 'Sempre validar limites de timeout em chamadas remotas' },
        ['timeout', 'resilience'],
      );

      expect(record).toBeDefined();
      expect(record.knowledgeId).toMatch(/^EKB-2026-/);
      expect(record.version).toBe(1);

      const searchResults = knowledgeBase.searchKnowledge('timeout');
      expect(searchResults.length).toBeGreaterThan(0);
    });

    it('deve retornar histórico de decisões arquiteturais (ADRs)', () => {
      const history = knowledgeBase.getDecisionHistory();
      expect(history).toBeInstanceOf(Array);
      expect(history.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. AutonomousEvolutionEngineService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AutonomousEvolutionEngineService', () => {
    it('deve detectar oportunidades de evolução e publicar CloudEvent', async () => {
      const opportunities = await evolutionEngine.detectEvolutionOpportunities({
        tenantId: 'TENANT-001',
        targetModules: ['cognitive-orchestration'],
      });

      expect(opportunities).toBeInstanceOf(Array);
      expect(opportunities.length).toBeGreaterThan(0);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.opportunity.detected.v1',
        expect.objectContaining({ urgency: expect.any(String) }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve executar ciclo completo de evolução autônoma', async () => {
      const summary = await evolutionEngine.generateEvolutionCycle('TENANT-001');

      expect(summary).toBeDefined();
      expect(summary.cycleId).toMatch(/^EVO-CYC-2026-/);
      expect(summary.opportunitiesDetected).toBeGreaterThan(0);
      expect(summary.cycleDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('deve filtrar oportunidades por tipo de evolução', () => {
      const opps = evolutionEngine.getOpportunities(EvolutionType.ARCHITECTURE);
      expect(opps.every((o) => o.type === EvolutionType.ARCHITECTURE)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. ContinuousImprovementService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ContinuousImprovementService', () => {
    it('deve criar plano estruturado de melhoria contínua', async () => {
      const plan = await continuousImprovement.createImprovementPlan({
        tenantId: 'TENANT-001',
        category: ImprovementCategory.BOTTLENECK_REDUCTION,
        title: 'Redução de Gargalo de Atendimento',
        description: 'Descrição detalhada do plano',
        findings: ['Gargalo identificado na triagem'],
        actionItems: ['Paralelizar atendimento'],
        targetKpi: 'SLA < 15 min',
        ownerId: 'HEAD-01',
      });

      expect(plan).toBeDefined();
      expect(plan.planId).toMatch(/^IMP-PLAN-2026-/);
      expect(plan.status).toBe('DRAFT');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.improvement_plan.created.v1',
        expect.objectContaining({ planId: plan.planId }),
        'TENANT-001',
        expect.anything(),
      );
    });

    it('deve identificar gargalos e redundâncias operacionais', async () => {
      const findings = await continuousImprovement.identifyBottlenecks('TENANT-001', 'intake');
      expect(findings).toBeInstanceOf(Array);
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. AdaptiveProcessOptimizationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('AdaptiveProcessOptimizationService', () => {
    it('deve analisar métricas de processo e retornar eficiência', async () => {
      const metrics = await adaptiveOptimization.analyzeProcessMetrics('PROC-INTAKE-001');

      expect(metrics).toBeDefined();
      expect(metrics.processId).toBe('PROC-INTAKE-001');
      expect(metrics.efficiencyRating).toBeDefined();
    });

    it('deve propor e aplicar otimização adaptativa com aprovação humana', async () => {
      const proposal = await adaptiveOptimization.proposeOptimization({
        tenantId: 'TENANT-001',
        processId: 'PROC-001',
        title: 'Ajuste de Concorrência',
        proposedParameters: { maxConcurrency: 8 },
        rationale: 'Alta demanda vespertina',
      });

      expect(proposal.status).toBe('PROPOSED');

      const applied = await adaptiveOptimization.applyParametricAdjustment(proposal.proposalId, 'SUPER-001');

      expect(applied.status).toBe('APPLIED');
      expect(applied.humanApproverId).toBe('SUPER-001');
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.process.optimized.v1',
        expect.objectContaining({ proposalId: proposal.proposalId }),
        'TENANT-001',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. InnovationManagementService
  // ════════════════════════════════════════════════════════════════════════════

  describe('InnovationManagementService', () => {
    it('deve gerenciar o ciclo completo de proposta de inovação', async () => {
      const proposal = await innovationManagement.submitProposal({
        tenantId: 'TENANT-001',
        title: 'Piloto de IA Multimodal',
        description: 'Análise de voz e texto integrada',
        domainArea: 'Psicologia',
        strategicAlignmentScore: 0.90,
        estimatedCostBrl: 20000.00,
        proposerId: 'PROP-001',
      });

      expect(proposal.phase).toBe(InnovationPhase.PROPOSAL);

      const evaluated = await innovationManagement.evaluateProposal({
        innovationId: proposal.innovationId,
        impactScore: 0.88,
        riskScore: 0.15,
        evaluationComments: 'Excelente alinhamento',
        evaluatorId: 'EVAL-001',
      });

      expect(evaluated.phase).toBe(InnovationPhase.EVALUATION);
      expect(evaluated.priorityScore).toBeGreaterThan(0);

      const pilotApproved = await innovationManagement.approvePilot(proposal.innovationId, 'CINO-001');
      expect(pilotApproved.phase).toBe(InnovationPhase.PILOT);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.innovation.approved.v1',
        expect.objectContaining({ innovationId: proposal.innovationId }),
        'TENANT-001',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 7. ChangeImpactAnalysisService
  // ════════════════════════════════════════════════════════════════════════════

  describe('ChangeImpactAnalysisService', () => {
    it('deve calcular matriz de impacto nas 10 dimensões obrigatórias', async () => {
      const impact = await changeImpactAnalysis.calculateImpact({
        changeId: 'CHG-2026-0001',
        changeDescription: 'Migração de base vetorial para PGVector',
        changeType: EvolutionType.ARCHITECTURE,
        affectedModules: ['cognitive-orchestration', 'institutional-intelligence'],
        technicalDetails: { schemaChanges: true },
      });

      expect(impact).toBeDefined();
      expect(impact.impactAnalysisId).toMatch(/^CHG-IMP-2026-/);
      expect(impact.impactMatrix).toHaveLength(10);

      const dimensions = impact.impactMatrix.map((m) => m.dimension);
      expect(dimensions).toContain(ImpactDimension.ARCHITECTURE);
      expect(dimensions).toContain(ImpactDimension.SECURITY);
      expect(dimensions).toContain(ImpactDimension.LGPD);
      expect(dimensions).toContain(ImpactDimension.INTEGRATIONS);
      expect(dimensions).toContain(ImpactDimension.WORKFLOWS);
      expect(dimensions).toContain(ImpactDimension.DATABASE);
      expect(dimensions).toContain(ImpactDimension.ARTIFICIAL_INTELLIGENCE);
      expect(dimensions).toContain(ImpactDimension.DOCUMENTATION);
      expect(dimensions).toContain(ImpactDimension.TRAINING);
      expect(dimensions).toContain(ImpactDimension.STRATEGIC_KPIS);

      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.change_impact.calculated.v1',
        expect.objectContaining({ impactAnalysisId: impact.impactAnalysisId }),
        'SYSTEM',
        expect.anything(),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 8. InstitutionalLearningService
  // ════════════════════════════════════════════════════════════════════════════

  describe('InstitutionalLearningService', () => {
    it('deve registrar aprendizado e atualizar automaticamente a Base de Conhecimento', async () => {
      const learning = await institutionalLearning.recordLearning({
        tenantId: 'TENANT-001',
        category: LearningCategory.IMPLEMENTED_IMPROVEMENT,
        title: 'Otimização de Roteamento ACOP',
        content: 'Redução de latência verificada pós-implantação.',
        lessonsLearned: ['Manter cache vetorial aquecido'],
        tags: ['acop', 'learning'],
      });

      expect(learning).toBeDefined();
      expect(learning.learningId).toMatch(/^LRN-2026-/);
      expect(learning.knowledgeBaseRef).toMatch(/^EKB-/);

      const queried = institutionalLearning.queryLessonsLearned(LearningCategory.IMPLEMENTED_IMPROVEMENT);
      expect(queried.length).toBeGreaterThan(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 9. StrategicRecommendationService
  // ════════════════════════════════════════════════════════════════════════════

  describe('StrategicRecommendationService', () => {
    it('deve gerar recomendação estratégica e processar revisão humana', async () => {
      const rec = await strategicRecommendation.generateStrategicRecommendation({
        tenantId: 'TENANT-001',
        category: StrategicCategory.TECHNOLOGY_MODERNIZATION,
        title: 'Expansão de Inferência Distribuída',
        description: 'Desc',
        rationale: 'Aumento na demanda por tokens',
        evidences: ['FinOps Report Q2'],
        expectedImpact: 'Economia de 40%',
        estimatedCostBrl: 30000.00,
        identifiedRisks: ['Risco de hardware'],
      });

      expect(rec).toBeDefined();
      expect(rec.recommendationId).toMatch(/^STR-REC-2026-/);
      expect(rec.status).toBe('PROPOSED');

      const reviewed = await strategicRecommendation.reviewRecommendation(rec.recommendationId, 'CEO-001', true, 'Aprovado pelo conselho');
      expect(reviewed.status).toBe('APPROVED');
      expect(reviewed.reviewerId).toBe('CEO-001');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. GovernanceApprovalService
  // ════════════════════════════════════════════════════════════════════════════

  describe('GovernanceApprovalService', () => {
    it('deve submeter e avançar solicitação de aprovação em multi-etapas', async () => {
      const approval = await governanceApproval.submitForApproval({
        changeId: 'CHG-2026-0001',
        title: 'Aprovação Arquitetural',
        impactAnalysisId: 'CHG-IMP-2026-0001',
        adrReference: 'ADR-153',
        requesterId: 'DEV-001',
      });

      expect(approval.status).toBe(ApprovalStatus.SUBMITTED);

      // Step 1: Technical Review
      const step1 = await governanceApproval.processApprovalStep({
        approvalId: approval.approvalId,
        approved: true,
        approverId: 'TECH-LEAD-01',
        approverRole: 'Technical Lead',
      });
      expect(step1.status).toBe(ApprovalStatus.TECHNICAL_REVIEW);

      // Step 2: Security Review
      const step2 = await governanceApproval.processApprovalStep({
        approvalId: approval.approvalId,
        approved: true,
        approverId: 'CISO-01',
        approverRole: 'CISO',
      });
      expect(step2.status).toBe(ApprovalStatus.SECURITY_REVIEW);

      // Step 3: Governance Approval
      const step3 = await governanceApproval.processApprovalStep({
        approvalId: approval.approvalId,
        approved: true,
        approverId: 'GOV-HEAD-01',
        approverRole: 'Governance Head',
      });
      expect(step3.status).toBe(ApprovalStatus.GOVERNANCE_APPROVED);
      expect(mockEventBusService.publish).toHaveBeenCalledWith(
        'aura.evolution.governance.approval_granted.v1',
        expect.objectContaining({ approvalId: approval.approvalId }),
        'SYSTEM',
        expect.anything(),
      );
    });

    it('deve registrar rejeição quando aprovador recusa a mudança', async () => {
      const approval = await governanceApproval.submitForApproval({
        changeId: 'CHG-REJECT',
        title: 'Mudança de Risco',
        impactAnalysisId: 'IMP-001',
        adrReference: 'ADR-153',
      });

      const rejected = await governanceApproval.processApprovalStep({
        approvalId: approval.approvalId,
        approved: false,
        approverId: 'CISO-01',
        approverRole: 'CISO',
        comments: 'Risco de segurança excessivo',
      });

      expect(rejected.status).toBe(ApprovalStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Risco de segurança excessivo');
    });
  });
});
