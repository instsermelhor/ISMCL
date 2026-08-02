import { Injectable, Logger } from '@nestjs/common';
import { AssessEnterpriseRiskDto, RiskCategory, RiskSeverity } from '../dto/governance-compliance.dto';
import { ContinuousAuditService } from './continuous-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface EnterpriseRiskRecord {
  riskId: string;
  category: RiskCategory;
  riskName: string;
  severity: RiskSeverity;
  probabilityPercent: number;
  mitigationStrategy: string;
  status: 'MONITORED' | 'MITIGATED' | 'ESCALATED';
  assessedAt: string;
}

/**
 * EnterpriseRiskValidationService — Validação Contínua dos Riscos (P161 AGCC)
 *
 * Mantém e atualiza continuamente a matriz corporativa de riscos (estratégicos,
 * operacionais, tecnológicos, regulatórios, financeiros, reputacionais e assistenciais).
 */
@Injectable()
export class EnterpriseRiskValidationService {
  private readonly logger = new Logger(EnterpriseRiskValidationService.name);
  private riskMatrix: Map<string, EnterpriseRiskRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: ContinuousAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedRisks();
  }

  private seedRisks(): void {
    const seeds: AssessEnterpriseRiskDto[] = [
      {
        category: RiskCategory.TECHNOLOGICAL,
        riskName: 'Saturação de Fila no Kafka durante Picos',
        severity: RiskSeverity.MEDIUM,
        mitigationStrategy: 'Configuração de autoscaling de brokers e redundância',
      },
      {
        category: RiskCategory.ASSISTENTIAL,
        riskName: 'Aumento de Demanda por Atendimento no Polo Sul',
        severity: RiskSeverity.HIGH,
        mitigationStrategy: 'Redistribuição preventiva de profissionais (ADIP P159)',
      },
    ];

    for (const dto of seeds) {
      const id = `RSK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.riskMatrix.set(id, {
        riskId: id,
        ...dto,
        probabilityPercent: dto.severity === RiskSeverity.HIGH ? 35 : 15,
        mitigationStrategy: dto.mitigationStrategy ?? 'Monitoramento contínuo',
        status: 'MONITORED',
        assessedAt: new Date().toISOString(),
      });
    }
  }

  async assessRisk(dto: AssessEnterpriseRiskDto): Promise<EnterpriseRiskRecord> {
    const seq = Math.random().toString(36).substring(2, 8).toUpperCase();
    const riskId = `RSK-${Date.now()}-${seq}`;

    const record: EnterpriseRiskRecord = {
      riskId,
      category: dto.category,
      riskName: dto.riskName,
      severity: dto.severity,
      probabilityPercent: dto.severity === RiskSeverity.CRITICAL ? 65 : 25,
      mitigationStrategy: dto.mitigationStrategy ?? 'Plano de contingência padrão',
      status: 'MONITORED',
      assessedAt: new Date().toISOString(),
    };

    this.riskMatrix.set(riskId, record);

    await this.audit.recordAuditCheck('ASSESS_RISK', riskId, 'CRO', {
      riskName: dto.riskName, severity: dto.severity, category: dto.category,
    });

    await this.eventBus.publish(
      'aura.governance.risk.validation.completed.v1',
      { riskId, riskName: dto.riskName, severity: dto.severity },
      this.SYSTEM_TENANT,
      { subject: riskId },
    );

    this.logger.log(`[EnterpriseRiskValidation] Assessed risk: ${riskId} (${dto.severity})`);
    return record;
  }

  listRisks(category?: RiskCategory): EnterpriseRiskRecord[] {
    return Array.from(this.riskMatrix.values()).filter(
      (r) => !category || r.category === category,
    );
  }
}
