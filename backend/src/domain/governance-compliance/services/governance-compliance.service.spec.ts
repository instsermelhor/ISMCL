import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { ContinuousAuditService } from './continuous-audit.service';
import { ComplianceEvidenceService } from './compliance-evidence.service';
import { ContinuousComplianceService } from './continuous-compliance.service';
import { AutonomousGovernanceService } from './autonomous-governance.service';
import { PolicyValidationService } from './policy-validation.service';
import { RegulatoryMonitoringService } from './regulatory-monitoring.service';
import { InstitutionalAssuranceService } from './institutional-assurance.service';
import { EnterpriseRiskValidationService } from './enterprise-risk-validation.service';
import { GovernanceRecommendationService } from './governance-recommendation.service';
import { GovernanceDashboardService } from './governance-dashboard.service';

import {
  ComplianceFramework,
  ComplianceLevel,
  RiskCategory,
  RiskSeverity,
} from '../dto/governance-compliance.dto';

// ── EventBusService Mock ──────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('Prompt 161 — AGCC: Autonomous Governance & Continuous Compliance Platform', () => {
  let auditService: ContinuousAuditService;
  let evidenceService: ComplianceEvidenceService;
  let complianceService: ContinuousComplianceService;
  let autonomousService: AutonomousGovernanceService;
  let policyService: PolicyValidationService;
  let regulatoryService: RegulatoryMonitoringService;
  let assuranceService: InstitutionalAssuranceService;
  let riskService: EnterpriseRiskValidationService;
  let recommendationService: GovernanceRecommendationService;
  let dashboardService: GovernanceDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContinuousAuditService,
        ComplianceEvidenceService,
        ContinuousComplianceService,
        AutonomousGovernanceService,
        PolicyValidationService,
        RegulatoryMonitoringService,
        InstitutionalAssuranceService,
        EnterpriseRiskValidationService,
        GovernanceRecommendationService,
        GovernanceDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditService           = module.get(ContinuousAuditService);
    evidenceService        = module.get(ComplianceEvidenceService);
    complianceService      = module.get(ContinuousComplianceService);
    autonomousService      = module.get(AutonomousGovernanceService);
    policyService          = module.get(PolicyValidationService);
    regulatoryService      = module.get(RegulatoryMonitoringService);
    assuranceService       = module.get(InstitutionalAssuranceService);
    riskService            = module.get(EnterpriseRiskValidationService);
    recommendationService  = module.get(GovernanceRecommendationService);
    dashboardService       = module.get(GovernanceDashboardService);

    jest.clearAllMocks();
  });

  // ── 1. ContinuousAuditService ────────────────────────────────────────────────

  describe('ContinuousAuditService', () => {
    it('should record an audit check entry with SHA-256 signature', async () => {
      const entry = await auditService.recordAuditCheck(
        'COMPLIANCE_CHECK', 'LGPD_CHECK', 'CCO', { module: 'enterprise-knowledge' },
      );
      expect(entry).toBeDefined();
      expect(entry.auditId).toMatch(/^CAG-/);
      expect(entry.sha256Signature).toBeDefined();
      expect(entry.sha256Signature).toHaveLength(64); // SHA-256 hex = 64 chars
      expect(entry.scope).toBe('COMPLIANCE_CHECK');
    });

    it('should publish CloudEvent aura.governance.audit.completed.v1', async () => {
      await auditService.recordAuditCheck('RISK_ASSESSMENT', 'RISK_001', 'CRO', {});
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.audit.completed.v1',
        expect.objectContaining({ scope: 'RISK_ASSESSMENT' }),
        'SYSTEM',
        expect.any(Object),
      );
    });

    it('should accumulate entries in the audit trail', async () => {
      await auditService.recordAuditCheck('SCOPE_A', 'CHECK_1', 'CCO', {});
      await auditService.recordAuditCheck('SCOPE_A', 'CHECK_2', 'CCO', {});
      const trail = auditService.getAuditTrail('SCOPE_A');
      expect(trail.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter audit trail by scope', async () => {
      await auditService.recordAuditCheck('SCOPE_X', 'CHK_X', 'CCO', {});
      await auditService.recordAuditCheck('SCOPE_Y', 'CHK_Y', 'CCO', {});
      const scopeX = auditService.getAuditTrail('SCOPE_X');
      expect(scopeX.every((e) => e.scope === 'SCOPE_X')).toBe(true);
    });
  });

  // ── 2. ComplianceEvidenceService ─────────────────────────────────────────────

  describe('ComplianceEvidenceService', () => {
    it('should record a compliance evidence for LGPD', async () => {
      const evidence = await evidenceService.recordEvidence({
        framework: ComplianceFramework.LGPD,
        title: 'Relatório LGPD Art. 7',
        description: 'Verificação de hipóteses de tratamento de dados',
        metadata: { dpoVerified: true },
      });
      expect(evidence.evidenceId).toMatch(/^EVID-COMP-/);
      expect(evidence.framework).toBe(ComplianceFramework.LGPD);
      expect(evidence.registeredAt).toBeDefined();
    });

    it('should record evidence for ZERO_TRUST framework', async () => {
      const evidence = await evidenceService.recordEvidence({
        framework: ComplianceFramework.ZERO_TRUST,
        title: 'Certificado mTLS',
        description: 'Comunicação mTLS ativa em 100% dos microsserviços',
      });
      expect(evidence.framework).toBe(ComplianceFramework.ZERO_TRUST);
    });

    it('should list evidences filtering by framework', () => {
      const lgpdEvidences = evidenceService.listEvidences(ComplianceFramework.LGPD);
      expect(Array.isArray(lgpdEvidences)).toBe(true);
    });

    it('should list all evidences when no framework filter is applied', () => {
      const allEvidences = evidenceService.listEvidences();
      expect(allEvidences.length).toBeGreaterThan(0);
    });

    it('should publish aura.governance.evidence.registered.v1 event', async () => {
      await evidenceService.recordEvidence({
        framework: ComplianceFramework.SECURITY_BY_DESIGN,
        title: 'Security Hardening Certificate',
        description: 'All containers run as non-root with seccomp profiles',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.evidence.registered.v1',
        expect.objectContaining({ framework: ComplianceFramework.SECURITY_BY_DESIGN }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 3. ContinuousComplianceService ───────────────────────────────────────────

  describe('ContinuousComplianceService', () => {
    it('should run a LGPD compliance check and return a result', async () => {
      const result = await complianceService.runComplianceCheck({
        framework: ComplianceFramework.LGPD,
      });
      expect(result.checkId).toMatch(/^COMP-CHK-/);
      expect(result.framework).toBe(ComplianceFramework.LGPD);
      expect(result.complianceScorePercent).toBeGreaterThanOrEqual(90);
    });

    it('should return FULLY_COMPLIANT level when score >= 95', async () => {
      const result = await complianceService.runComplianceCheck({
        framework: ComplianceFramework.ZERO_TRUST,
      });
      expect(result.complianceLevel).toBe(ComplianceLevel.FULLY_COMPLIANT);
    });

    it('should accept a target module scope', async () => {
      const result = await complianceService.runComplianceCheck({
        framework: ComplianceFramework.PRIVACY_BY_DESIGN,
        targetModule: 'enterprise-knowledge',
      });
      expect(result.targetModule).toBe('enterprise-knowledge');
    });

    it('should publish aura.governance.compliance.validated.v1 event', async () => {
      await complianceService.runComplianceCheck({ framework: ComplianceFramework.SEGREGATION_OF_DUTIES });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.compliance.validated.v1',
        expect.objectContaining({ framework: ComplianceFramework.SEGREGATION_OF_DUTIES }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 4. AutonomousGovernanceService ───────────────────────────────────────────

  describe('AutonomousGovernanceService', () => {
    it('should run an autonomous ecosystem check', async () => {
      const overview = await autonomousService.runAutonomousCheck();
      expect(overview.checkId).toMatch(/^AGOV-CHK-/);
      expect(overview.evaluatedMicroservicesCount).toBeGreaterThan(0);
      expect(overview.overallHealthScorePercent).toBeGreaterThanOrEqual(90);
    });

    it('should report zero deviations in a healthy ecosystem', async () => {
      const overview = await autonomousService.runAutonomousCheck();
      expect(overview.detectedDeviationsCount).toBe(0);
    });

    it('should publish aura.governance.check.executed.v1 event', async () => {
      await autonomousService.runAutonomousCheck();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.check.executed.v1',
        expect.objectContaining({ overallHealthScorePercent: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 5. PolicyValidationService ───────────────────────────────────────────────

  describe('PolicyValidationService', () => {
    it('should validate a compliant policy successfully', async () => {
      const result = await policyService.validatePolicy({
        policyId: 'POL-LGPD-2026-001',
        title: 'Política de Retenção de Dados de Beneficiários',
        contentSummary: 'Prazo máximo de 5 anos',
        frameworks: ['LGPD'],
      });
      expect(result.policyId).toBe('POL-LGPD-2026-001');
      expect(result.isValid).toBe(true);
      expect(result.conflictsDetected).toHaveLength(0);
    });

    it('should return 100% architectural compliance for valid policy', async () => {
      const result = await policyService.validatePolicy({
        policyId: 'POL-SEC-2026-002',
        title: 'Política de Classificação de Dados',
        contentSummary: 'Dados classificados em público, interno, confidencial e restrito',
      });
      expect(result.architecturalCompliancePercent).toBe(100);
    });

    it('should include validatedAt timestamp in result', async () => {
      const result = await policyService.validatePolicy({
        policyId: 'POL-TEST-001',
        title: 'Test Policy',
        contentSummary: 'Test summary',
      });
      expect(result.validatedAt).toBeDefined();
      expect(new Date(result.validatedAt).getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  // ── 6. RegulatoryMonitoringService ───────────────────────────────────────────

  describe('RegulatoryMonitoringService', () => {
    it('should list pre-seeded regulatory requirements', () => {
      const requirements = regulatoryService.listRequirements();
      expect(Array.isArray(requirements)).toBe(true);
      expect(requirements.length).toBeGreaterThan(0);
    });

    it('should include LGPD Art. 7 in seeded requirements', () => {
      const requirements = regulatoryService.listRequirements();
      const lgpd = requirements.find((r) => r.requirementId === 'REQ-LGPD-ART7');
      expect(lgpd).toBeDefined();
      expect(lgpd!.complianceStatus).toBe('COMPLIANT');
    });

    it('should include SUAS norm in requirements list', () => {
      const requirements = regulatoryService.listRequirements();
      const suas = requirements.find((r) => r.requirementId === 'REQ-SUAS-NORM-01');
      expect(suas).toBeDefined();
      expect(suas!.applicableDomains).toContain('ASSISTENTIAL');
    });
  });

  // ── 7. InstitutionalAssuranceService ─────────────────────────────────────────

  describe('InstitutionalAssuranceService', () => {
    it('should run an institutional assurance check', async () => {
      const result = await assuranceService.runAssuranceCheck();
      expect(result.assuranceId).toMatch(/^ASSUR-/);
      expect(result.overallAssuranceScorePercent).toBeGreaterThanOrEqual(90);
    });

    it('should return individual dimension scores', async () => {
      const result = await assuranceService.runAssuranceCheck();
      expect(result.processIntegrityScorePercent).toBeDefined();
      expect(result.dataQualityScorePercent).toBeDefined();
      expect(result.evidenceConsistencyPercent).toBeDefined();
      expect(result.missionFulfillmentScorePercent).toBeDefined();
    });

    it('should publish aura.governance.assurance.completed.v1 event', async () => {
      await assuranceService.runAssuranceCheck();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.assurance.completed.v1',
        expect.objectContaining({ overallAssuranceScorePercent: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 8. EnterpriseRiskValidationService ───────────────────────────────────────

  describe('EnterpriseRiskValidationService', () => {
    it('should assess and register a new enterprise risk', async () => {
      const record = await riskService.assessRisk({
        category: RiskCategory.TECHNOLOGICAL,
        riskName: 'Saturação de CPU em Pods de IA',
        severity: RiskSeverity.HIGH,
        mitigationStrategy: 'Autoscaling via KEDA baseado em métricas Prometheus',
      });
      expect(record.riskId).toMatch(/^RSK-/);
      expect(record.severity).toBe(RiskSeverity.HIGH);
      expect(record.status).toBe('MONITORED');
    });

    it('should list all risks in the corporate matrix', () => {
      const risks = riskService.listRisks();
      expect(Array.isArray(risks)).toBe(true);
      expect(risks.length).toBeGreaterThan(0);
    });

    it('should filter risks by category', async () => {
      await riskService.assessRisk({
        category: RiskCategory.REGULATORY,
        riskName: 'Mudança no Art. 46 LGPD',
        severity: RiskSeverity.MEDIUM,
      });
      const regulatory = riskService.listRisks(RiskCategory.REGULATORY);
      expect(regulatory.every((r) => r.category === RiskCategory.REGULATORY)).toBe(true);
    });

    it('should publish aura.governance.risk.validation.completed.v1 event', async () => {
      await riskService.assessRisk({
        category: RiskCategory.FINANCIAL,
        riskName: 'Variação de Custo de Infraestrutura Cloud',
        severity: RiskSeverity.LOW,
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.risk.validation.completed.v1',
        expect.objectContaining({ riskName: 'Variação de Custo de Infraestrutura Cloud' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 9. GovernanceRecommendationService ───────────────────────────────────────

  describe('GovernanceRecommendationService', () => {
    it('should generate a governance recommendation', async () => {
      const rec = await recommendationService.generateRecommendation({
        title: 'Implementar Revisão Periódica da Matriz de Riscos',
        rationale: 'A matriz de riscos deve ser revisada semestralmente pela Diretoria',
        priority: 'HIGH',
        suggestedOwner: 'CRO',
      });
      expect(rec.recommendationId).toMatch(/^REC-GOV-/);
      expect(rec.status).toBe('PROPOSED');
      expect(rec.suggestedOwner).toBe('CRO');
    });

    it('should list all active recommendations', () => {
      const recs = recommendationService.listRecommendations();
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should default priority to MEDIUM when not specified', async () => {
      const rec = await recommendationService.generateRecommendation({
        title: 'Revisão de Escopos RBAC',
        rationale: 'Garantir segregação de funções em novos perfis',
      });
      expect(rec.priority).toBe('MEDIUM');
    });

    it('should publish aura.governance.recommendation.generated.v1 event', async () => {
      await recommendationService.generateRecommendation({
        title: 'Auditoria Trimestral de Acessos Privilegiados',
        rationale: 'Requisito de Zero Trust e LGPD',
        priority: 'HIGH',
        suggestedOwner: 'CISO',
      });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.recommendation.generated.v1',
        expect.objectContaining({ title: 'Auditoria Trimestral de Acessos Privilegiados' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 10. GovernanceDashboardService ───────────────────────────────────────────

  describe('GovernanceDashboardService', () => {
    it('should generate the governance executive dashboard', async () => {
      const dashboard = await dashboardService.generateGovernanceDashboard();
      expect(dashboard.dashboardId).toMatch(/^GOV-DASH-/);
      expect(dashboard.overallComplianceScorePercent).toBeGreaterThanOrEqual(90);
      expect(dashboard.lgpdComplianceStatus).toContain('FULLY_COMPLIANT');
    });

    it('should include risk and recommendation counts in dashboard', async () => {
      const dashboard = await dashboardService.generateGovernanceDashboard();
      expect(dashboard.totalActiveRisksCount).toBeGreaterThanOrEqual(0);
      expect(dashboard.pendingRecommendationsCount).toBeGreaterThanOrEqual(0);
    });

    it('should include Zero Trust compliance status', async () => {
      const dashboard = await dashboardService.generateGovernanceDashboard();
      expect(dashboard.zeroTrustComplianceStatus).toContain('ENFORCED');
    });

    it('should publish aura.governance.dashboard.updated.v1 event', async () => {
      await dashboardService.generateGovernanceDashboard();
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.governance.dashboard.updated.v1',
        expect.objectContaining({ overallComplianceScorePercent: expect.any(Number) }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 11. Cross-Service Integration Tests ──────────────────────────────────────

  describe('Cross-Service Integration: Audit SHA-256 Integrity', () => {
    it('SHA-256 signatures from different records should be unique', async () => {
      const e1 = await auditService.recordAuditCheck('SCOPE_A', 'CHK_1', 'CCO', { data: 1 });
      const e2 = await auditService.recordAuditCheck('SCOPE_A', 'CHK_2', 'CCO', { data: 2 });
      expect(e1.sha256Signature).not.toBe(e2.sha256Signature);
    });

    it('Full compliance cycle: check → evidence → audit trail should all succeed', async () => {
      const complianceResult = await complianceService.runComplianceCheck({
        framework: ComplianceFramework.LGPD,
      });
      const evidence = await evidenceService.recordEvidence({
        framework: ComplianceFramework.LGPD,
        title: `Evidência do Check ${complianceResult.checkId}`,
        description: 'Gerada automaticamente após verificação de conformidade',
      });
      const trail = auditService.getAuditTrail();
      expect(complianceResult.complianceLevel).toBe(ComplianceLevel.FULLY_COMPLIANT);
      expect(evidence.evidenceId).toBeDefined();
      expect(trail.length).toBeGreaterThan(0);
    });

    it('Risk assessment should be captured in audit trail', async () => {
      await riskService.assessRisk({
        category: RiskCategory.REPUTATIONAL,
        riskName: 'Risco de Vazamento de Dados',
        severity: RiskSeverity.CRITICAL,
      });
      const trail = auditService.getAuditTrail('ASSESS_RISK');
      expect(trail.length).toBeGreaterThan(0);
    });
  });
});
