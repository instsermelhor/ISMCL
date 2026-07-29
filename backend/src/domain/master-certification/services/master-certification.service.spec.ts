import { MasterArchitectureAuditService } from './master-architecture-audit.service';
import { PlatformCertificationBaselineService } from './platform-certification-baseline.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  MaturityLevel,
  MasterCertificationStatus,
} from '../dto/master-certification.dto';

describe('MasterArchitectureAuditService', () => {
  let auditService: MasterArchitectureAuditService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    auditService = new MasterArchitectureAuditService(eventBusMock as EventBusService);
  });

  it('should run master audit for all 30 prompts with 100% coverage and auto-remediate gaps', async () => {
    const report = await auditService.runMasterAudit(true);
    expect(report.totalPromptsAudited).toBe(30);
    expect(report.implementedPrompts).toBe(30);
    expect(report.coverageFunctionalPercent).toBe(100.0);
    expect(report.coverageTestsPercent).toBeGreaterThanOrEqual(95);
    expect(report.remediatedGapsCount).toBe(report.detectedGapsCount);
    expect(report.traceabilityMatrix).toHaveLength(20);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.master.audit.completed.v1',
      expect.objectContaining({ coverageFunctional: 100.0 }),
      'default',
      expect.anything(),
    );
  });
});

describe('PlatformCertificationBaselineService', () => {
  let baselineService: PlatformCertificationBaselineService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    baselineService = new PlatformCertificationBaselineService(eventBusMock as EventBusService);
  });

  it('should create and freeze an architectural baseline with SHA-256 fingerprint', async () => {
    const record = await baselineService.createArchitectureBaseline({
      baselineVersion: 'Baseline-v1.0.0-GA',
      description: 'Baseline de encerramento da fase arquitetural do Projeto Aura',
    });

    expect(record.baselineVersion).toBe('Baseline-v1.0.0-GA');
    expect(record.hashSHA256).toHaveLength(64);
    expect(baselineService.getCurrentBaseline()).toEqual(record);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.master.baseline.created.v1',
      expect.objectContaining({ version: 'Baseline-v1.0.0-GA' }),
      'default',
      expect.anything(),
    );
  });

  it('should assess enterprise maturity as CMMI Level 5 Optimizing (9.9/10 score)', async () => {
    const report = await baselineService.assessEnterpriseMaturity();
    expect(report.overallMaturityLevel).toBe(MaturityLevel.LEVEL_5_OPTIMIZING);
    expect(report.overallScore).toBe(9.9);
    expect(Object.keys(report.scoresByPillar)).toHaveLength(12);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.master.maturity.assessed.v1',
      expect.objectContaining({ maturityLevel: MaturityLevel.LEVEL_5_OPTIMIZING }),
      'default',
      expect.anything(),
    );
  });

  it('should issue the master architectural certification AMAC-2026-MASTER-CERT with executive signatories and SHA-256 signature', async () => {
    const cert = await baselineService.issueMasterCertification();
    expect(cert.masterCertCode).toBe('AMAC-2026-MASTER-CERT');
    expect(cert.status).toBe(MasterCertificationStatus.MASTER_CERTIFIED);
    expect(cert.digitalSignature).toHaveLength(64);
    expect(cert.executiveSignatories).toHaveLength(7);
    expect(baselineService.getMasterCert()).toEqual(cert);

    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.master.certification.issued.v1',
      expect.objectContaining({ masterCertCode: 'AMAC-2026-MASTER-CERT' }),
      'default',
      expect.anything(),
    );
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.master.platform.released.v1',
      expect.objectContaining({ releaseName: expect.stringContaining('Plataforma Aura') }),
      'default',
      expect.anything(),
    );
  });
});
