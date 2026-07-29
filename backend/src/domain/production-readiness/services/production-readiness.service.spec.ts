import { ProductionReadinessService } from './production-readiness.service';
import { GoLiveManagementService } from './golive-management.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  CertificationVerdict,
  GoLiveStatus,
  ApprovalAuthority,
} from '../dto/production-readiness.dto';

describe('ProductionReadinessService', () => {
  let service: ProductionReadinessService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new ProductionReadinessService(eventBusMock as EventBusService);
  });

  it('should run readiness checklist with 100% pass rate and PRODUCTION_READY status', async () => {
    const report = await service.runReadinessChecklist();
    expect(report.overallStatus).toBe('PRODUCTION_READY');
    expect(report.failed).toBe(0);
    expect(report.blocked).toBe(0);
    expect(report.testCoveragePercent).toBeGreaterThanOrEqual(95);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.production.readiness.validated.v1',
      expect.objectContaining({ overallStatus: 'PRODUCTION_READY' }),
      'default',
      expect.anything(),
    );
  });

  it('should issue a certification record with SHA-256 signature and CERT code', async () => {
    const cert = await service.issueCertification({
      domainName: 'ObservabilityModule',
      verdict: CertificationVerdict.APPROVED,
    });

    expect(cert.certCode).toMatch(/^CERT-\d{4}-\d{4,6}$/);
    expect(cert.verdict).toBe(CertificationVerdict.APPROVED);
    expect(cert.digitalSignature).toHaveLength(64); // SHA-256
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.production.certification.issued.v1',
      expect.objectContaining({ domainName: 'ObservabilityModule', verdict: CertificationVerdict.APPROVED }),
      'default',
      expect.anything(),
    );
  });

  it('should accumulate certifications in the catalog', async () => {
    await service.issueCertification({ domainName: 'EHRModule', verdict: CertificationVerdict.APPROVED });
    await service.issueCertification({ domainName: 'AIModule', verdict: CertificationVerdict.APPROVED });
    expect(service.listCertifications()).toHaveLength(2);
  });
});

describe('GoLiveManagementService', () => {
  let service: GoLiveManagementService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new GoLiveManagementService(eventBusMock as EventBusService);
  });

  it('should schedule a go-live with rollback plan and SCHEDULED status', async () => {
    const record = await service.scheduleGoLive({
      releaseName: 'Aura v1.0.0-GA',
      scheduledAt: '2026-09-01T02:00:00Z',
      releaseManager: 'SRE Lead',
    });

    expect(record.status).toBe(GoLiveStatus.SCHEDULED);
    expect(record.rollbackPlanRef).toContain('ROLLBACK-PLAN');
    expect(record.isAllApproved).toBe(false);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.production.golive.scheduled.v1',
      expect.objectContaining({ releaseName: 'Aura v1.0.0-GA' }),
      'default',
      expect.anything(),
    );
  });

  it('should accumulate executive approvals and detect all-approved state after 6 authorities', async () => {
    const record = await service.scheduleGoLive({
      releaseName: 'Aura v1.0.0-GA',
      scheduledAt: '2026-09-01T02:00:00Z',
    });

    const authorities = [
      { authority: ApprovalAuthority.BOARD_OF_DIRECTORS, approverName: 'Dr. Ana Ferreira' },
      { authority: ApprovalAuthority.CISO, approverName: 'Carlos CISO' },
      { authority: ApprovalAuthority.CHIEF_ARCHITECT, approverName: 'Paulo Architect' },
      { authority: ApprovalAuthority.COMPLIANCE_OFFICER, approverName: 'Luiza CCO' },
      { authority: ApprovalAuthority.OPERATIONS_DIRECTOR, approverName: 'Renato Ops' },
      { authority: ApprovalAuthority.AUDIT_COMMITTEE, approverName: 'Marina Audit' },
    ];

    let lastApproval: any;
    for (const auth of authorities) {
      lastApproval = await service.grantExecutiveApproval({ goLiveId: record.goLiveId, ...auth });
      expect(lastApproval.digitalSignature).toHaveLength(64);
    }

    const updated = service.getGoLive(record.goLiveId);
    expect(updated.isAllApproved).toBe(true);
    expect(updated.approvals).toHaveLength(6);
  });

  it('should execute deployment validation and mark go-live as COMPLETED', async () => {
    const record = await service.scheduleGoLive({
      releaseName: 'Aura v1.0.0-GA',
      scheduledAt: '2026-09-01T02:00:00Z',
    });

    // Grant all 6 approvals
    const authorities = [
      ApprovalAuthority.BOARD_OF_DIRECTORS, ApprovalAuthority.CISO,
      ApprovalAuthority.CHIEF_ARCHITECT, ApprovalAuthority.COMPLIANCE_OFFICER,
      ApprovalAuthority.OPERATIONS_DIRECTOR, ApprovalAuthority.AUDIT_COMMITTEE,
    ];
    for (const [i, authority] of authorities.entries()) {
      await service.grantExecutiveApproval({ goLiveId: record.goLiveId, authority, approverName: `Approver ${i + 1}` });
    }

    const validation = await service.runDeploymentValidation(record.goLiveId);
    expect(validation.allSystemsOperational).toBe(true);
    expect(validation.checks).toHaveLength(10);
    expect(service.getGoLive(record.goLiveId).status).toBe(GoLiveStatus.COMPLETED);
  });

  it('should rollback and mark go-live as ROLLED_BACK', async () => {
    const record = await service.scheduleGoLive({
      releaseName: 'Aura v1.0.0-BETA',
      scheduledAt: '2026-08-15T03:00:00Z',
    });

    const result = await service.executeRollback(record.goLiveId, 'Falha crítica em integração bancária');
    expect(result.rolled).toBe(true);
    expect(service.getGoLive(record.goLiveId).status).toBe(GoLiveStatus.ROLLED_BACK);
  });
});
