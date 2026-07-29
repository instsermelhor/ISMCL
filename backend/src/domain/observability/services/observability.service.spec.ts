import { LoggingTelemetryService } from './logging-telemetry.service';
import { SiemThreatDetectionService } from './siem-threat-detection.service';
import { SocAutomationService } from './soc-automation.service';
import { ContinuousAuditService } from './continuous-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  LogLevel,
  ThreatType,
  IncidentSeverity,
  PlaybookAction,
} from '../dto/observability.dto';

describe('LoggingTelemetryService', () => {
  let service: LoggingTelemetryService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new LoggingTelemetryService(eventBusMock as EventBusService);
  });

  it('should ingest structured log with digital SHA-256 signature and correlation ID', async () => {
    const log = await service.ingestLog({
      level: LogLevel.SECURITY,
      module: 'AuthModule',
      message: 'Tentativa de login falha detectada.',
    });

    expect(log.logId).toBeDefined();
    expect(log.correlationId).toBeDefined();
    expect(log.digitalSignature).toHaveLength(64); // SHA-256 hex
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.observability.log.created.v1',
      expect.objectContaining({ logId: log.logId }),
      'default',
      expect.anything(),
    );
  });
});

describe('SiemThreatDetectionService', () => {
  let service: SiemThreatDetectionService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new SiemThreatDetectionService(eventBusMock as EventBusService);
  });

  it('should detect DATA_EXFILTRATION attempt on mass record read', async () => {
    const threat = await service.analyzeSecurityEvent(
      'EHR_MASS_READ_ACCESS',
      'EhrModule',
      '192.168.1.100',
      { accessedRecords: 120 },
    );

    expect(threat).not.toBeNull();
    expect(threat?.threatType).toBe(ThreatType.DATA_EXFILTRATION);
    expect(threat?.severity).toBe(IncidentSeverity.CRITICAL);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.observability.threat.detected.v1',
      expect.objectContaining({ threatType: ThreatType.DATA_EXFILTRATION }),
      'default',
      expect.anything(),
    );
  });
});

describe('SocAutomationService', () => {
  let service: SocAutomationService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new SocAutomationService(eventBusMock as EventBusService);
  });

  it('should create incident and execute SOAR playbook to revoke JWT session', async () => {
    const incident = await service.createIncident({
      title: 'Força Bruta Detectada no Admin',
      threatType: ThreatType.BRUTE_FORCE,
      severity: IncidentSeverity.HIGH,
      description: 'Múltiplas tentativas de login no painel.',
      affectedTarget: 'user-suspicious-01',
    });

    expect(incident.incidentCode).toMatch(/^INC-\d{4}-\d{4,5}$/);
    expect(incident.status).toBe('OPEN');

    const contained = await service.executePlaybook(
      {
        incidentId: incident.incidentId,
        action: PlaybookAction.REVOKE_SESSION,
        reason: 'Revogação preventiva de token JWT.',
      },
      'admin-soc-01',
    );

    expect(contained.status).toBe('CONTAINED');
    expect(contained.playbooksExecuted[0].result).toContain('revogadas');
  });
});

describe('ContinuousAuditService', () => {
  let service: ContinuousAuditService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new ContinuousAuditService(eventBusMock as EventBusService);
  });

  it('should run continuous audit and return compliance report', async () => {
    const report = await service.runContinuousAudit();

    expect(report.overallComplianceScore).toBeGreaterThanOrEqual(90);
    expect(report.status).toBe('COMPLIANT');
    expect(report.auditChecks.length).toBeGreaterThanOrEqual(4);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.observability.audit.executed.v1',
      expect.objectContaining({ score: expect.any(Number) }),
      'default',
      expect.anything(),
    );
  });
});
