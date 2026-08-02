import { Test, TestingModule } from '@nestjs/testing';
import { EventBusService } from '../../../events/event-bus.service';

import { SocialImpactAuditService } from './social-impact-audit.service';
import { SocialImpactService } from './social-impact.service';
import { OutcomeMeasurementService } from './outcome-measurement.service';
import { ProgramEvaluationService } from './program-evaluation.service';
import { InstitutionalIndicatorsService } from './institutional-indicators.service';
import { ESGMetricsService } from './esg-metrics.service';
import { BeneficiaryEvolutionService } from './beneficiary-evolution.service';
import { EvidenceConsolidationService } from './evidence-consolidation.service';
import { AccountabilityService } from './accountability.service';
import { ImpactDashboardService } from './impact-dashboard.service';

import {
  AccountabilityReportType,
  ImpactDimension,
} from '../dto/social-impact.dto';

// ── Mock ─────────────────────────────────────────────────────────────────────

const mockEventBus = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ── Suite ─────────────────────────────────────────────────────────────────────

describe('Prompt 165 — SIIP: Social Impact Intelligence & Accountability Platform', () => {
  let auditService: SocialImpactAuditService;
  let socialImpactService: SocialImpactService;
  let outcomeService: OutcomeMeasurementService;
  let evaluationService: ProgramEvaluationService;
  let indicatorsService: InstitutionalIndicatorsService;
  let esgService: ESGMetricsService;
  let evolutionService: BeneficiaryEvolutionService;
  let consolidationService: EvidenceConsolidationService;
  let accountabilityService: AccountabilityService;
  let dashboardService: ImpactDashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialImpactAuditService,
        SocialImpactService,
        OutcomeMeasurementService,
        ProgramEvaluationService,
        InstitutionalIndicatorsService,
        ESGMetricsService,
        BeneficiaryEvolutionService,
        EvidenceConsolidationService,
        AccountabilityService,
        ImpactDashboardService,
        { provide: EventBusService, useValue: mockEventBus },
      ],
    }).compile();

    auditService = module.get(SocialImpactAuditService);
    socialImpactService = module.get(SocialImpactService);
    outcomeService = module.get(OutcomeMeasurementService);
    evaluationService = module.get(ProgramEvaluationService);
    indicatorsService = module.get(InstitutionalIndicatorsService);
    esgService = module.get(ESGMetricsService);
    evolutionService = module.get(BeneficiaryEvolutionService);
    consolidationService = module.get(EvidenceConsolidationService);
    accountabilityService = module.get(AccountabilityService);
    dashboardService = module.get(ImpactDashboardService);

    jest.clearAllMocks();
  });

  // ── 1. SocialImpactAuditService ────────────────────────────────────────────

  describe('SocialImpactAuditService', () => {
    it('should record an audit entry with SHA-256 signature', async () => {
      const entry = await auditService.recordAudit('TEST_ACTION', 'subject-1', 'CSIO');
      expect(entry.auditId).toMatch(/^SIIP-AUD-/);
      expect(entry.sha256Signature).toHaveLength(64);
    });

    it('should publish aura.impact.social.impact.audit.completed.v1 event', async () => {
      await auditService.recordAudit('ACTION', 'sub', 'CGO');
      expect(mockEventBus.publish).toHaveBeenCalledWith(
        'aura.impact.social.impact.audit.completed.v1',
        expect.objectContaining({ action: 'ACTION' }),
        'SYSTEM',
        expect.any(Object),
      );
    });
  });

  // ── 2. SocialImpactService ──────────────────────────────────────────────────

  describe('SocialImpactService', () => {
    it('should calculate social impact across a dimension', async () => {
      const res = await socialImpactService.calculateImpact({
        dimension: ImpactDimension.MENTAL_HEALTH,
        period: '2026-Q1',
      });
      expect(res.calculationId).toMatch(/^IMPACT-/);
      expect(res.impactScorePercent).toBeGreaterThan(90);
      expect(res.beneficiariesImpactedCount).toBeGreaterThan(0);
    });
  });

  // ── 3. OutcomeMeasurementService ───────────────────────────────────────────

  describe('OutcomeMeasurementService', () => {
    it('should measure outcomes for a social program', async () => {
      const res = await outcomeService.measureProgramOutcomes('Programa Acolher');
      expect(res.measurementId).toMatch(/^OUTCOME-/);
      expect(res.averageQualityOfLifeImprovementPercent).toBeGreaterThan(0);
    });
  });

  // ── 4. ProgramEvaluationService ────────────────────────────────────────────

  describe('ProgramEvaluationService', () => {
    it('should evaluate program SROI and efficiency', async () => {
      const res = await evaluationService.evaluateProgram({
        programId: 'Programa Acolher',
        beneficiariesServed: 1500,
      });
      expect(res.evaluationId).toMatch(/^PROG-EVAL-/);
      expect(res.socialReturnOnInvestmentSROI).toBeGreaterThan(1.0);
      expect(res.costPerOutcomeBrl).toBeDefined();
    });
  });

  // ── 5. InstitutionalIndicatorsService ─────────────────────────────────────

  describe('InstitutionalIndicatorsService', () => {
    it('should list seeded institutional KPIs', () => {
      const list = indicatorsService.listIndicators();
      expect(list.length).toBeGreaterThan(0);
    });
  });

  // ── 6. ESGMetricsService ────────────────────────────────────────────────────

  describe('ESGMetricsService', () => {
    it('should calculate ESG scorecard with audit certification', async () => {
      const scorecard = await esgService.calculateESGMetrics();
      expect(scorecard.scorecardId).toMatch(/^ESG-/);
      expect(scorecard.overallESGIndexPercent).toBeGreaterThan(90);
      expect(scorecard.isAuditCertified).toBe(true);
    });
  });

  // ── 7. BeneficiaryEvolutionService ─────────────────────────────────────────

  describe('BeneficiaryEvolutionService', () => {
    it('should record beneficiary evolution with pseudonymized ID and calculate delta', async () => {
      const rec = await evolutionService.recordEvolution({
        pseudonymizedBeneficiaryId: 'BENEF-PSEUDO-1234',
        programName: 'Acolhimento',
        initialQualityOfLifeScore: 40,
        currentQualityOfLifeScore: 80,
      });
      expect(rec.recordId).toMatch(/^EVOL-/);
      expect(rec.deltaImprovementPercent).toBe(100);
    });
  });

  // ── 8. EvidenceConsolidationService ────────────────────────────────────────

  describe('EvidenceConsolidationService', () => {
    it('should consolidate evidence packages from multiple systems', async () => {
      const pkg = await consolidationService.consolidateEvidences();
      expect(pkg.packageId).toMatch(/^EVID-PKG-/);
      expect(pkg.sourcesConsolidated).toContain('EHR_CLINICAL');
      expect(pkg.sourcesConsolidated).toContain('ERP_SOCIAL');
      expect(pkg.dataIntegrityScorePercent).toBeGreaterThan(99);
    });
  });

  // ── 9. AccountabilityService ───────────────────────────────────────────────

  describe('AccountabilityService', () => {
    it('should generate an accountability report with SHA-256 signature', async () => {
      const rep = await accountabilityService.generateAccountabilityReport({
        reportType: AccountabilityReportType.SPONSOR_REPORT,
        targetAudience: 'Financiador Privado Alpha',
      });
      expect(rep.reportId).toMatch(/^ACC-REP-/);
      expect(rep.auditSignatureSha256).toHaveLength(64);
    });
  });

  // ── 10. ImpactDashboardService ─────────────────────────────────────────────

  describe('ImpactDashboardService', () => {
    it('should generate real-time impact dashboard data', async () => {
      const dash = await dashboardService.generateImpactDashboard();
      expect(dash.dashboardId).toMatch(/^IMPACT-DASH-/);
      expect(dash.overallSocialImpactIndexPercent).toBeGreaterThan(90);
      expect(dash.averageSROIMultiplier).toBeGreaterThan(1.0);
    });
  });
});
