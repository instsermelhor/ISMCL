import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { AIAuditService } from './ai-audit.service';
import { AIGovernanceService } from './ai-governance.service';
import { AIRegistryService } from './ai-registry.service';
import { ModelOpsService } from './modelops.service';
import { LLMOpsService } from './llmops.service';
import { PromptGovernanceService } from './prompt-governance.service';
import { AIRiskManagementService } from './ai-risk-management.service';
import { AIExplainabilityService } from './ai-explainability.service';
import { AIEvaluationService } from './ai-evaluation.service';
import { CognitiveAgentGovernanceService } from './cognitive-agent-governance.service';

import {
  AIAssetType,
  AIAssetLifecycle,
  PromptStatus,
  AIRiskCategory,
  AIRiskLevel,
  ModelPerformanceRating,
} from '../dto/enterprise-ai-governance.dto';

const mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

describe('P175 EAIGP — Enterprise AI Governance, ModelOps, LLMOps & Cognitive Agent Management', () => {
  let auditSvc: AIAuditService;
  let govSvc: AIGovernanceService;
  let registrySvc: AIRegistryService;
  let modelOpsSvc: ModelOpsService;
  let llmOpsSvc: LLMOpsService;
  let promptSvc: PromptGovernanceService;
  let riskSvc: AIRiskManagementService;
  let xaiSvc: AIExplainabilityService;
  let evalSvc: AIEvaluationService;
  let cogAgentSvc: CognitiveAgentGovernanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIAuditService,
        AIGovernanceService,
        AIRegistryService,
        ModelOpsService,
        LLMOpsService,
        PromptGovernanceService,
        AIRiskManagementService,
        AIExplainabilityService,
        AIEvaluationService,
        CognitiveAgentGovernanceService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditSvc = module.get(AIAuditService);
    govSvc = module.get(AIGovernanceService);
    registrySvc = module.get(AIRegistryService);
    modelOpsSvc = module.get(ModelOpsService);
    llmOpsSvc = module.get(LLMOpsService);
    promptSvc = module.get(PromptGovernanceService);
    riskSvc = module.get(AIRiskManagementService);
    xaiSvc = module.get(AIExplainabilityService);
    evalSvc = module.get(AIEvaluationService);
    cogAgentSvc = module.get(CognitiveAgentGovernanceService);
  });

  afterEach(() => jest.clearAllMocks());

  // ── AIAuditService ────────────────────────────────────────────────────────
  describe('AIAuditService', () => {
    it('deve registrar auditoria de IA com assinatura SHA-256 válida', async () => {
      const entry = await auditSvc.recordAudit('AI_ASSET_REGISTERED', 'AURA-LLM-001', 'CAIO', { type: 'LLM' });
      expect(entry.auditId).toMatch(/^EAIGP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });
  });

  // ── AIRegistryService ─────────────────────────────────────────────────────
  describe('AIRegistryService', () => {
    it('deve registrar, homologar e publicar ativo de IA', async () => {
      const asset = await registrySvc.registerAsset({
        assetId: 'AURA-GEMINI-2.5',
        name: 'Gemini 2.5 Pro',
        type: AIAssetType.LLM,
        version: '2.5.0',
        owner: 'CAIO',
      }, 'CAIO');

      expect(asset.lifecycle).toBe(AIAssetLifecycle.DRAFT);

      await registrySvc.approveAsset('AURA-GEMINI-2.5', 'CGO');
      const published = await registrySvc.publishAsset('AURA-GEMINI-2.5', 'CAIO');
      expect(published.lifecycle).toBe(AIAssetLifecycle.PUBLISHED);
    });
  });

  // ── ModelOpsService ───────────────────────────────────────────────────────
  describe('ModelOpsService', () => {
    it('deve realizar deploy e rollback de modelo', async () => {
      const deploy = await modelOpsSvc.deploy('AURA-GEMINI-2.5', '2.5.0', 'PRODUCTION', 'MLOps');
      expect(deploy.stage).toBe('PRODUCTION');

      const rb = await modelOpsSvc.rollback(deploy.deploymentId, 'SRE');
      expect(rb.stage).toBe('ROLLBACK');
    });
  });

  // ── LLMOpsService ─────────────────────────────────────────────────────────
  describe('LLMOpsService', () => {
    it('deve configurar LLM e trocar de provedor transparentemente', async () => {
      const cfg = await llmOpsSvc.configureLLM(
        'AURA-GEMINI-2.5', 'Google', 0.7, 8192, 128000, false, [], 60, 0.5, 'CAIO',
      );
      expect(cfg.provider).toBe('Google');

      const updated = await llmOpsSvc.switchProvider(cfg.configId, 'VertexAI', 'CAIO');
      expect(updated.provider).toBe('VertexAI');
    });
  });

  // ── PromptGovernanceService ───────────────────────────────────────────────
  describe('PromptGovernanceService', () => {
    it('deve registrar, aprovar, ativar e atualizar prompt oficial', async () => {
      const p = await promptSvc.registerPrompt({
        promptId: 'PROMPT-BENEFIT-V1',
        objective: 'Triagem de Benefício',
        content: 'Você é um assistente...',
        version: '1.0.0',
        author: 'Dra. Ana',
      }, 'CAIO');

      expect(p.status).toBe(PromptStatus.DRAFT);
      await promptSvc.approvePrompt('PROMPT-BENEFIT-V1', 'CAIO');
      const active = await promptSvc.activatePrompt('PROMPT-BENEFIT-V1', 'CAIO');
      expect(active.status).toBe(PromptStatus.ACTIVE);

      const updated = await promptSvc.updatePrompt('PROMPT-BENEFIT-V1', 'Novo conteúdo', '1.1.0', 'CAIO');
      expect(updated.status).toBe(PromptStatus.PENDING_APPROVAL);
      expect(updated.version).toBe('1.1.0');
    });
  });

  // ── AIRiskManagementService ───────────────────────────────────────────────
  describe('AIRiskManagementService', () => {
    it('deve registrar e mitigar risco de IA', async () => {
      const risk = await riskSvc.registerRisk({
        assetId: 'AURA-GEMINI-2.5',
        category: AIRiskCategory.ETHICAL,
        level: AIRiskLevel.MEDIUM,
        description: 'Possível viés de linguagem',
        mitigationPlan: 'Amostragem contínua',
      }, 'EthicsOfficer');

      expect(risk.status).toBe('OPEN');

      const mitigated = await riskSvc.mitigateRisk(risk.riskId, 'EthicsOfficer');
      expect(mitigated.status).toBe('MITIGATED');
    });
  });

  // ── AIExplainabilityService ───────────────────────────────────────────────
  describe('AIExplainabilityService', () => {
    it('deve gerar explicação XAI completa para decisão automatizada', async () => {
      const xai = await xaiSvc.explainDecision({
        decisionId: 'DEC-001',
        modelUsed: 'Gemini 2.5',
        inputData: { income: 500, household: 4 },
        outputDecision: 'APPROVED',
        confidenceScore: 0.92,
      }, 'CAIO');

      expect(xai.explanationId).toMatch(/^XAI-DEC-001-/);
      expect(xai.humanReadableExplanation).toContain('APPROVED');
      expect(xai.factorsConsidered.length).toBeGreaterThan(0);
    });
  });

  // ── AIEvaluationService ───────────────────────────────────────────────────
  describe('AIEvaluationService', () => {
    it('deve avaliar desempenho do modelo com métricas de drift e alucinação', async () => {
      const report = await evalSvc.evaluateModel({ assetId: 'AURA-GEMINI-2.5', sampleSize: 1000 });
      expect(report.evaluationId).toMatch(/^EVAL-AURA-GEMINI-2.5-/);
      expect(report.rating).toBe(ModelPerformanceRating.GOOD);
      expect(report.accuracy).toBeGreaterThan(0.9);
    });
  });

  // ── AIGovernanceService ───────────────────────────────────────────────────
  describe('AIGovernanceService', () => {
    it('deve criar e revogar política de governança de IA', async () => {
      const pol = await govSvc.createPolicy('AURA-GEMINI-2.5', 'Política Padrão', true, 'SUPERVISED', ['LGPD_CLEARED'], 365, 'CGO');
      expect(pol.status).toBe('ACTIVE');

      const revoked = await govSvc.revokePolicy(pol.policyId, 'CGO', 'Revisão anual');
      expect(revoked.status).toBe('REVOKED');
    });
  });

  // ── CognitiveAgentGovernanceService ───────────────────────────────────────
  describe('CognitiveAgentGovernanceService', () => {
    it('deve avaliar conformidade de agente cognitivo', async () => {
      const rec = await cogAgentSvc.evaluateAgentCompliance('AGENT-SOC-01', 'Agente Social', 'Gemini 2.5', ['READ_SOC'], false, 'CAIO');
      expect(rec.governanceStatus).toBe('COMPLIANT');
    });
  });
});
