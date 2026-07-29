import { CloudPlatformService } from './cloud-platform.service';
import { DevSecOpsPipelineService } from './devsecops-pipeline.service';
import { DisasterRecoveryService } from './disaster-recovery.service';
import { FinOpsManagementService } from './finops-management.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  EnvironmentType,
  DeploymentStrategy,
  SecretType,
  BackupType,
} from '../dto/operations.dto';

describe('CloudPlatformService', () => {
  let service: CloudPlatformService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new CloudPlatformService(eventBusMock as EventBusService);
  });

  it('should list pre-loaded K8s workloads and scale replicas', async () => {
    const workloads = service.listWorkloads();
    expect(workloads.length).toBeGreaterThanOrEqual(5);

    const scaled = await service.scaleWorkload({
      deploymentName: 'aura-backend-core',
      replicas: 6,
    });

    expect(scaled.replicas).toBe(6);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.operations.cluster.scaled.v1',
      expect.objectContaining({ deploymentName: 'aura-backend-core', newReplicas: 6 }),
      'default',
      expect.anything(),
    );
  });

  it('should rotate a managed secret and issue new fingerprint', async () => {
    const secret = await service.rotateSecret({
      secretName: 'JWT_SIGNING_PRIVATE_KEY',
      type: SecretType.JWT_SIGNING_KEY,
    });

    expect(secret.version).toBe(2); // Inicia em 1, rotacionado passa a 2
    expect(secret.fingerprint).toHaveLength(16);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.operations.secret.rotated.v1',
      expect.objectContaining({ secretName: 'JWT_SIGNING_PRIVATE_KEY' }),
      'default',
      expect.anything(),
    );
  });
});

describe('DevSecOpsPipelineService', () => {
  let service: DevSecOpsPipelineService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new DevSecOpsPipelineService(eventBusMock as EventBusService);
  });

  it('should trigger GitOps pipeline with SBOM and Cosign signature', async () => {
    const record = await service.triggerPipeline({
      serviceName: 'aura-backend-core',
      environment: EnvironmentType.PRODUCTION,
      strategy: DeploymentStrategy.CANARY,
      imageTag: 'v1.4.0-cbf70ef',
    });

    expect(record.deploymentId).toBeDefined();
    expect(record.status).toBe('SUCCESS');
    expect(record.sbomGenerated).toBe(true);
    expect(record.artifactSigned).toBe(true);
    expect(record.steps.length).toBe(7);
  });
});

describe('DisasterRecoveryService', () => {
  let service: DisasterRecoveryService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new DisasterRecoveryService(eventBusMock as EventBusService);
  });

  it('should trigger backup and execute DR drill meeting RPO/RTO targets', async () => {
    const backup = await service.triggerBackup({
      type: BackupType.FULL_DATABASE,
      environment: EnvironmentType.PRODUCTION,
    });

    expect(backup.backupId).toBeDefined();
    expect(backup.status).toBe('COMPLETED');

    const drill = await service.runDrill();
    expect(drill.status).toBe('PASSED');
    expect(drill.rpoActualMinutes).toBeLessThanOrEqual(drill.rpoTargetMinutes);
    expect(drill.rtoActualMinutes).toBeLessThanOrEqual(drill.rtoTargetMinutes);
  });
});

describe('FinOpsManagementService', () => {
  let service: FinOpsManagementService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new FinOpsManagementService(eventBusMock as EventBusService);
  });

  it('should generate FinOps summary with optimization recommendations', async () => {
    const summary = await service.getFinOpsSummary();
    expect(summary.totalMonthlyCost).toBeGreaterThan(0);
    expect(summary.costByCategory.length).toBeGreaterThan(0);
    expect(summary.optimizationRecommendations.length).toBeGreaterThan(0);
  });
});
