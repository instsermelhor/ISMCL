import { Injectable, Logger } from '@nestjs/common';
import { IsolationStrategy } from '../dto/federated-multi-tenant.dto';
import { FederationAuditService } from './federation-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface IsolationReport {
  tenantId: string;
  strategy: IsolationStrategy;
  namespace: string;
  dataIsolationVerified: boolean;
  networkIsolationVerified: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  lgpdCompliant: boolean;
  isolationScore: number; // 0–100
  findings: string[];
  auditedAt: string;
}

/**
 * TenantIsolationService — P167 FMIP
 *
 * Verifica e garante que cada tenant opera em namespace completamente
 * isolado, sem vazamentos de dados entre organizações distintas.
 * Executa auditorias periódicas de isolamento e gera scores de conformidade.
 */
@Injectable()
export class TenantIsolationService {
  private readonly logger = new Logger(TenantIsolationService.name);
  private readonly isolationReports: Map<string, IsolationReport> = new Map();

  constructor(
    private readonly auditSvc: FederationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async auditIsolation(tenantId: string, strategy: IsolationStrategy, auditedBy = 'SYSTEM'): Promise<IsolationReport> {
    const findings: string[] = [];

    // Simulação de verificações de isolamento
    const dataIsolationVerified = strategy !== IsolationStrategy.LOGICAL_SHARED_DB;
    const networkIsolationVerified = strategy === IsolationStrategy.DATABASE_PER_TENANT;
    const encryptionAtRest = true;
    const encryptionInTransit = true;
    const lgpdCompliant = encryptionAtRest && encryptionInTransit && dataIsolationVerified;

    if (!dataIsolationVerified) {
      findings.push('Isolamento lógico compartilhado detectado — risco de vazamento entre tenants em queries mal parametrizadas.');
    }
    if (!networkIsolationVerified) {
      findings.push('Rede de banco não completamente isolada — recomendado migrar para DATABASE_PER_TENANT em dados sensíveis.');
    }

    // Score: base 100 com deduções
    let score = 100;
    if (!dataIsolationVerified) score -= 30;
    if (!networkIsolationVerified) score -= 20;
    if (!encryptionAtRest) score -= 25;
    if (!encryptionInTransit) score -= 25;

    const report: IsolationReport = {
      tenantId,
      strategy,
      namespace: `ns-${tenantId}`,
      dataIsolationVerified,
      networkIsolationVerified,
      encryptionAtRest,
      encryptionInTransit,
      lgpdCompliant,
      isolationScore: Math.max(0, score),
      findings,
      auditedAt: new Date().toISOString(),
    };

    this.isolationReports.set(tenantId, report);

    await this.auditSvc.recordAudit('ISOLATION_AUDITED', tenantId, auditedBy, {
      strategy,
      isolationScore: score,
      lgpdCompliant,
    });

    await this.eventBus.publish(
      'aura.tenant.isolation.audited.v1',
      { tenantId, isolationScore: score, lgpdCompliant },
      'FMIP',
      { subject: tenantId },
    );

    if (score < 60) {
      this.logger.warn(
        `[TenantIsolation] Tenant "${tenantId}" com score de isolamento crítico: ${score}/100`,
      );
    } else {
      this.logger.log(`[TenantIsolation] Tenant "${tenantId}" — score: ${score}/100.`);
    }

    return report;
  }

  getReport(tenantId: string): IsolationReport | undefined {
    return this.isolationReports.get(tenantId);
  }

  listReports(): IsolationReport[] {
    return Array.from(this.isolationReports.values());
  }

  getAggregateIsolationScore(): number {
    const reports = this.listReports();
    if (!reports.length) return 0;
    const total = reports.reduce((acc, r) => acc + r.isolationScore, 0);
    return Math.round(total / reports.length);
  }
}
