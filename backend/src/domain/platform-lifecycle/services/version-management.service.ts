import { Injectable, Logger } from '@nestjs/common';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface VersionRecord {
  versionId: string;
  tag: string;           // e.g. "v2.1.0"
  releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX';
  commitHash: string;
  relatedAdrIds: string[];
  releasedAt: string;
  isActive: boolean;
}

/**
 * VersionManagementService — Gestão Corporativa de Versões (P162 EPLM)
 *
 * Controla releases, branches, hotfixes, versões suportadas,
 * compatibilidade entre módulos, rollback e histórico, relacionando
 * cada versão aos ADRs correspondentes.
 */
@Injectable()
export class VersionManagementService {
  private readonly logger = new Logger(VersionManagementService.name);
  private versions: Map<string, VersionRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedVersions();
  }

  private seedVersions(): void {
    const seeds: Omit<VersionRecord, 'versionId'>[] = [
      { tag: 'v1.0.0', releaseType: 'MAJOR', commitHash: 'a9382e2', relatedAdrIds: ['ADR-156', 'ADR-157'], releasedAt: '2026-07-01T00:00:00Z', isActive: false },
      { tag: 'v1.1.0', releaseType: 'MINOR', commitHash: 'ab73420', relatedAdrIds: ['ADR-160', 'ADR-161'], releasedAt: '2026-08-01T00:00:00Z', isActive: true },
    ];

    for (const v of seeds) {
      const id = `VER-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.versions.set(id, { versionId: id, ...v });
    }
  }

  async releaseVersion(tag: string, releaseType: 'MAJOR' | 'MINOR' | 'PATCH' | 'HOTFIX', commitHash: string, relatedAdrIds: string[] = []): Promise<VersionRecord> {
    const versionId = `VER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const record: VersionRecord = {
      versionId,
      tag,
      releaseType,
      commitHash,
      relatedAdrIds,
      releasedAt: new Date().toISOString(),
      isActive: true,
    };

    this.versions.set(versionId, record);

    await this.audit.record('RELEASE_VERSION', 'PLATFORM', 'CTO', { tag, releaseType, commitHash });

    await this.eventBus.publish(
      'aura.lifecycle.version.released.v1',
      { versionId, tag, releaseType, commitHash },
      this.SYSTEM_TENANT,
      { subject: versionId },
    );

    this.logger.log(`[VersionManagement] Released: ${tag} (${releaseType}) → ${versionId}`);
    return record;
  }

  listVersions(): VersionRecord[] {
    return Array.from(this.versions.values()).sort((a, b) =>
      new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime(),
    );
  }
}
