import { Injectable, Logger } from '@nestjs/common';
import { ContinuousAuditService } from './continuous-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface RegulatoryRequirement {
  requirementId: string;
  legalNormName: string; // e.g. "LGPD Art. 7 - Hipóteses de Tratamento"
  applicableDomains: string[];
  mappedModules: string[];
  complianceStatus: 'COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NON_COMPLIANT';
  lastReviewedAt: string;
}

/**
 * RegulatoryMonitoringService — Monitoramento Regulatório (P161 AGCC)
 *
 * Mapeia e relaciona requisitos legais e regulatórios aplicáveis a processos,
 * documentos, APIs, modelos de IA e bancos de dados do Instituto Ser Melhor.
 */
@Injectable()
export class RegulatoryMonitoringService {
  private readonly logger = new Logger(RegulatoryMonitoringService.name);
  private requirementsStore: Map<string, RegulatoryRequirement> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: ContinuousAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRequirements();
  }

  private seedRequirements(): void {
    const seeds: RegulatoryRequirement[] = [
      {
        requirementId: 'REQ-LGPD-ART7',
        legalNormName: 'LGPD Art. 7 — Hipóteses de Tratamento de Dados',
        applicableDomains: ['ASSISTENTIAL', 'OPERATIONAL'],
        mappedModules: ['enterprise-knowledge', 'institutional-intelligence'],
        complianceStatus: 'COMPLIANT',
        lastReviewedAt: new Date().toISOString(),
      },
      {
        requirementId: 'REQ-SUAS-NORM-01',
        legalNormName: 'Norma Operacional Básica do SUAS (NOB/SUAS)',
        applicableDomains: ['ASSISTENTIAL', 'GOVERNANCE'],
        mappedModules: ['enterprise-interoperability', 'mission-intelligence'],
        complianceStatus: 'COMPLIANT',
        lastReviewedAt: new Date().toISOString(),
      },
    ];

    for (const r of seeds) {
      this.requirementsStore.set(r.requirementId, r);
    }
  }

  listRequirements(): RegulatoryRequirement[] {
    return Array.from(this.requirementsStore.values());
  }
}
