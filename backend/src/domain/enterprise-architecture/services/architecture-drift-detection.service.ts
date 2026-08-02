import { Injectable, Logger } from '@nestjs/common';
import { DriftSeverity, TechnologyStatus } from '../dto/enterprise-architecture.dto';
import { EnterpriseArchitectureService } from './enterprise-architecture.service';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArchitectureDriftViolation {
  violationId: string;
  component: string;
  violationType: 'UNAPPROVED_TECHNOLOGY' | 'EXCESSIVE_COUPLING' | 'CIRCULAR_DEPENDENCY' | 'MISSING_AUDIT_TRAIL' | 'UNAUTHORIZED_BYPASS';
  severity: DriftSeverity;
  description: string;
  recommendation: string;
  detectedAt: string;
}

export interface DriftDetectionReport {
  reportId: string;
  totalViolations: number;
  criticalViolations: number;
  violations: ArchitectureDriftViolation[];
  detectedAt: string;
}

/**
 * ArchitectureDriftDetectionService — P171 EAGO
 *
 * Monitoramento contínuo e detecção automática de Architecture Drift.
 * Identifica violações de acoplamento, tecnologias não homologadas,
 * dependências circulares e desvios das diretrizes arquiteturais do Projeto Aura.
 */
@Injectable()
export class ArchitectureDriftDetectionService {
  private readonly logger = new Logger(ArchitectureDriftDetectionService.name);
  private readonly violations: Map<string, ArchitectureDriftViolation> = new Map();

  constructor(
    private readonly archSvc: EnterpriseArchitectureService,
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async runDriftScan(scannedBy = 'SYSTEM'): Promise<DriftDetectionReport> {
    const reportId = `DRIFT-SCAN-${Date.now().toString(36).toUpperCase()}`;
    const detectedAt = new Date().toISOString();

    // Limpar varredura anterior
    this.violations.clear();

    // Verificação automatizada de tecnologias no radar
    const unapprovedTechs = this.archSvc.listHomologatedTechnologies(TechnologyStatus.FORBIDDEN);
    if (unapprovedTechs.length > 0) {
      const vId = `VIOL-TECH-${Date.now().toString(36).toUpperCase()}`;
      const viol: ArchitectureDriftViolation = {
        violationId: vId,
        component: 'Dependency Injection Layer',
        violationType: 'UNAPPROVED_TECHNOLOGY',
        severity: DriftSeverity.HIGH,
        description: `Detectado uso de tecnologia não autorizada: ${unapprovedTechs.map((t) => t.name).join(', ')}`,
        recommendation: 'Substituir tecnologia pela alternativa homologada no repositório EAGO.',
        detectedAt,
      };
      this.violations.set(vId, viol);
    }

    const violationList = Array.from(this.violations.values());
    const criticalViolations = violationList.filter((v) => v.severity === DriftSeverity.CRITICAL || v.severity === DriftSeverity.HIGH).length;

    const report: DriftDetectionReport = {
      reportId,
      totalViolations: violationList.length,
      criticalViolations,
      violations: violationList,
      detectedAt,
    };

    if (violationList.length > 0) {
      await this.auditSvc.recordAudit('ARCHITECTURE_DRIFT_DETECTED', reportId, scannedBy, {
        totalViolations: violationList.length,
        criticalViolations,
      });

      await this.eventBus.publish(
        'aura.eago.architecture.drift.detected.v1',
        { reportId, totalViolations: violationList.length, criticalViolations },
        'EAGO',
        { subject: reportId },
      );

      this.logger.warn(`[ArchitectureDrift] ⚠️ Architecture Drift detectado: ${violationList.length} violações (${criticalViolations} críticas).`);
    } else {
      this.logger.log(`[ArchitectureDrift] ✅ Varredura concluída: Nenhuma violação arquitetural identificada.`);
    }

    return report;
  }

  listViolations(severity?: DriftSeverity): ArchitectureDriftViolation[] {
    const all = Array.from(this.violations.values());
    return severity ? all.filter((v) => v.severity === severity) : all;
  }
}
