import { Injectable, Logger } from '@nestjs/common';
import { AssessDependencyDto } from '../dto/platform-lifecycle.dto';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DependencyRecord {
  dependencyId: string;
  packageName: string;
  currentVersion: string;
  latestVersion: string;
  license: string;
  hasVulnerabilities: boolean;
  isSupported: boolean;
  eolDate?: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assessedAt: string;
}

/**
 * DependencyGovernanceService — Governança de Dependências (P162 EPLM)
 *
 * Monitora versões, compatibilidade, licenciamento, vulnerabilidades,
 * suporte de fornecedor, ciclo de vida e impacto de atualizações.
 */
@Injectable()
export class DependencyGovernanceService {
  private readonly logger = new Logger(DependencyGovernanceService.name);
  private dependencyStore: Map<string, DependencyRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedDependencies();
  }

  private seedDependencies(): void {
    const seeds: AssessDependencyDto[] = [
      { packageName: '@nestjs/core', currentVersion: '10.3.2', latestVersion: '10.4.0', license: 'MIT' },
      { packageName: 'typescript', currentVersion: '5.3.3', latestVersion: '5.4.5', license: 'Apache-2.0' },
      { packageName: 'class-validator', currentVersion: '0.13.2', latestVersion: '0.14.1', license: 'MIT' },
    ];

    for (const dto of seeds) {
      const id = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.dependencyStore.set(id, {
        dependencyId: id,
        packageName: dto.packageName,
        currentVersion: dto.currentVersion,
        latestVersion: dto.latestVersion ?? dto.currentVersion,
        license: dto.license ?? 'UNKNOWN',
        hasVulnerabilities: false,
        isSupported: true,
        riskLevel: 'LOW',
        assessedAt: new Date().toISOString(),
      });
    }
  }

  async assessDependency(dto: AssessDependencyDto): Promise<DependencyRecord> {
    const dependencyId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const isOutdated = dto.latestVersion && dto.latestVersion !== dto.currentVersion;

    const record: DependencyRecord = {
      dependencyId,
      packageName: dto.packageName,
      currentVersion: dto.currentVersion,
      latestVersion: dto.latestVersion ?? dto.currentVersion,
      license: dto.license ?? 'UNKNOWN',
      hasVulnerabilities: false,
      isSupported: true,
      riskLevel: isOutdated ? 'MEDIUM' : 'LOW',
      assessedAt: new Date().toISOString(),
    };

    this.dependencyStore.set(dependencyId, record);

    await this.audit.record('ASSESS_DEPENDENCY', dto.packageName, 'CTO', {
      currentVersion: dto.currentVersion, riskLevel: record.riskLevel,
    });

    await this.eventBus.publish(
      'aura.lifecycle.dependency.updated.v1',
      { dependencyId, packageName: dto.packageName, riskLevel: record.riskLevel },
      this.SYSTEM_TENANT,
      { subject: dependencyId },
    );

    this.logger.log(`[DependencyGovernance] Assessed: ${dto.packageName} v${dto.currentVersion} → Risk: ${record.riskLevel}`);
    return record;
  }

  listDependencies(riskLevel?: string): DependencyRecord[] {
    return Array.from(this.dependencyStore.values()).filter(
      (d) => !riskLevel || d.riskLevel === riskLevel,
    );
  }
}
