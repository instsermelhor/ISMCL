import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { CertificationEvidenceService } from './certification-evidence.service';
import { EnterpriseReadinessService } from './enterprise-readiness.service';
import { ProductionCertificationService } from './production-certification.service';
import { FunctionalValidationService } from './functional-validation.service';
import { NonfunctionalValidationService } from './nonfunctional-validation.service';
import { ComplianceCertificationService } from './compliance-certification.service';
import { ReleaseGovernanceService } from './release-governance.service';
import { DeploymentApprovalService } from './deployment-approval.service';
import { ProductionRiskAssessmentService } from './production-risk-assessment.service';
import { EnterpriseReadinessDashboardService } from './enterprise-readiness-dashboard.service';

import {
  ApprovalDecision,
  CertificationStatus,
  ProductionRiskLevel,
  ReadinessDomain,
  ReleaseStatus,
} from '../dto/enterprise-readiness.dto';

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Prompt 163 — ERCP: Enterprise Readiness & Production Governance Platform', () => {
  let evidenceService: CertificationEvidenceService;
  let readinessService: EnterpriseReadinessService;
  let productionCertService: ProductionCertificationService;
  let functionalService: FunctionalValidationService;
  let nonfunctionalService: NonfunctionalValidationService;
  let complianceService: ComplianceCertificationService;
  let releaseService: ReleaseGovernanceService;
  let approvalService: DeploymentApprovalService;
  let riskService: ProductionRiskAssessmentService;
  let dashboardService: EnterpriseReadinessDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationEvidenceService,
        EnterpriseReadinessService,
        ProductionCertificationService,
        FunctionalValidationService,
        NonfunctionalValidationService,
        ComplianceCertificationService,
        ReleaseGovernanceService,
        DeploymentApprovalService,
        ProductionRiskAssessmentService,
        EnterpriseReadinessDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    evidenceService = module.get(CertificationEvidenceService);
    readinessService = module.get(EnterpriseReadinessService);
    productionCertService = module.get(ProductionCertificationService);
    functionalService = module.get(FunctionalValidationService);
    nonfunctionalService = module.get(NonfunctionalValidationService);
    complianceService = module.get(ComplianceCertificationService);
    releaseService = module.get(ReleaseGovernanceService);
    approvalService = module.get(DeploymentApprovalService);
    riskService = module.get(ProductionRiskAssessmentService);
    dashboardService = module.get(EnterpriseReadinessDashboardService);

    jest.clearAllMocks();
  });

  // ── 1. CertificationEvidenceService ───────────────────────────────────────

  describe('CertificationEvidenceService', () => {
    it('should record an evidence entry with SHA-256 signature', async () => {
      const entry = await evidenceService.recordEvidence('TEST_ACTION', 'module-a', 'CISO', { key: 'val' });
      expect(entry.auditId).toMatch(/^CERT-EVID-/);
      expect(entry.sha256Signature).toHaveLength(64);
      expect(entry.performedBy).toBe('CISO');
    });

    it('should publish aura.readiness.certification.evidence.generated.v1 event', async () => {
      await evidenceService.recordEvidence('AUDIT', 'module-b', 'CQO');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.readiness.certification.evidence.generated.v1',
        expect.objectContaining({ action: 'AUDIT', subject: 'module-b' }),
        'SYSTEM',
        expect.any(Object),
      );
    });

    it('should retrieve evidences by subject', async () => {
      await evidenceService.recordEvidence('A', 'sub-1', 'U1');
      await evidenceService.recordEvidence('B', 'sub-2', 'U1');
      const res = evidenceService.getEvidences('sub-1');
      expect(res).toHaveLength(1);
      expect(res[0].subject).toBe('sub-1');
    });
  });

  // ── 2. EnterpriseReadinessService ──────────────────────────────────────────

  describe('EnterpriseReadinessService', () => {
    it('should evaluate readiness score and mark as ready if >= 95%', async () => {
      const result = await readinessService.assessReadiness({
        moduleName: 'platform-lifecycle',
        version: '1.2.0',
      });
      expect(result.assessmentId).toMatch(/^READY-/);
      expect(result.overallReadinessIndexPercent).toBeGreaterThanOrEqual(95);
      expect(result.isProductionReady).toBe(true);
    });

    it('should publish aura.readiness.assessment.completed.v1', async () => {
      await readinessService.assessReadiness({ moduleName: 'governance', version: '1.0.0' });
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.readiness.assessment.completed.v1',
        expect.objectContaining({ moduleName: 'governance', isProductionReady: true }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 3. FunctionalValidationService ─────────────────────────────────────────

  describe('FunctionalValidationService', () => {
    it('should validate functional requirements with 100% coverage', async () => {
      const res = await functionalService.runFunctionalValidation({ moduleName: 'core-api' });
      expect(res.validationId).toMatch(/^FUNC-VAL-/);
      expect(res.coveragePercent).toBe(100);
      expect(res.failedCount).toBe(0);
    });
  });

  // ── 4. NonfunctionalValidationService ──────────────────────────────────────

  describe('NonfunctionalValidationService', () => {
    it('should validate NFR metrics (latency, availability, security)', async () => {
      const res = await nonfunctionalService.runNonfunctionalValidation({ moduleName: 'analytics' });
      expect(res.validationId).toMatch(/^NFR-VAL-/);
      expect(res.overallNFRScore).toBeGreaterThanOrEqual(90);
      expect(res.latencyP99Ms).toBeLessThan(200);
      expect(res.availabilityPercent).toBeGreaterThan(99.9);
    });
  });

  // ── 5. ComplianceCertificationService ──────────────────────────────────────

  describe('ComplianceCertificationService', () => {
    it('should issue compliance certificate for LGPD, Zero Trust, Privacy by Design', async () => {
      const cert = await complianceService.certifyCompliance({
        moduleName: 'user-management',
        version: '2.0.0',
      });
      expect(cert.certificateId).toMatch(/^CERT-COMP-/);
      expect(cert.status).toBe(CertificationStatus.CERTIFIED);
      expect(cert.lgpdCompliant).toBe(true);
      expect(cert.zeroTrustCompliant).toBe(true);
    });
  });

  // ── 6. ReleaseGovernanceService ────────────────────────────────────────────

  describe('ReleaseGovernanceService', () => {
    it('should submit a release candidate in CANDIDATE state', async () => {
      const rc = await releaseService.submitReleaseCandidate({
        releaseTag: 'v2.0.0-rc1',
        commitMessage: 'feat: major overhaul',
      });
      expect(rc.releaseId).toMatch(/^RC-/);
      expect(rc.status).toBe(ReleaseStatus.CANDIDATE);
    });

    it('should approve a release candidate', async () => {
      const rc = await releaseService.submitReleaseCandidate({
        releaseTag: 'v2.0.0-rc2',
        commitMessage: 'feat: readiness platform',
      });
      const approved = await releaseService.approveRelease(rc.releaseId, 'CEO', 'Homologado');
      expect(approved?.status).toBe(ReleaseStatus.APPROVED);
    });

    it('should block a release candidate', async () => {
      const rc = await releaseService.submitReleaseCandidate({
        releaseTag: 'v2.0.0-rc3',
        commitMessage: 'feat: risky change',
      });
      const blocked = await releaseService.blockRelease(rc.releaseId, 'CISO', 'Security flaw detected');
      expect(blocked?.status).toBe(ReleaseStatus.BLOCKED);
    });
  });

  // ── 7. ProductionRiskAssessmentService ─────────────────────────────────────

  describe('ProductionRiskAssessmentService', () => {
    it('should assess risk for production deployment', async () => {
      const risk = await riskService.assessProductionRisk({ releaseTag: 'v1.5.0' });
      expect(risk.riskId).toMatch(/^PROD-RISK-/);
      expect(risk.overallRiskLevel).toBe(ProductionRiskLevel.LOW);
      expect(risk.mitigationRequired).toBe(false);
    });
  });

  // ── 8. DeploymentApprovalService ───────────────────────────────────────────

  describe('DeploymentApprovalService', () => {
    it('should approve deployment if test coverage >= 95%', async () => {
      const approval = await approvalService.generateDeploymentApproval('v1.5.0', 96, 'CTO');
      expect(approval.approvalId).toMatch(/^DEPLOY-APPR-/);
      expect(approval.decision).toBe(ApprovalDecision.APPROVED);
      expect(approval.technicalOpinion).toContain('aprovado para produção');
    });

    it('should reject deployment if test coverage < 95%', async () => {
      const approval = await approvalService.generateDeploymentApproval('v1.5.0-bad', 80, 'CTO');
      expect(approval.decision).toBe(ApprovalDecision.REJECTED);
      expect(approval.technicalOpinion).toContain('BLOQUEADO');
    });
  });

  // ── 9. ProductionCertificationService ─────────────────────────────────────

  describe('ProductionCertificationService', () => {
    it('should issue final production certification for all modules', async () => {
      const cert = await productionCertService.certifyForProduction(['module1', 'module2']);
      expect(cert.certificationId).toMatch(/^PROD-CERT-/);
      expect(cert.isFullyProductionCertified).toBe(true);
      expect(cert.overallCertificationScorePercent).toBe(99);
    });
  });

  // ── 10. EnterpriseReadinessDashboardService ────────────────────────────────

  describe('EnterpriseReadinessDashboardService', () => {
    it('should generate real-time executive dashboard', async () => {
      const dash = await dashboardService.generateDashboard();
      expect(dash.dashboardId).toMatch(/^ERCP-DASH-/);
      expect(dash.overallReadinessIndexPercent).toBeGreaterThanOrEqual(90);
      expect(dash.complianceStatus).toContain('FULLY_CERTIFIED');
    });
  });
});
