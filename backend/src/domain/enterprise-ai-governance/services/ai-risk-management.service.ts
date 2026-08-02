import { Injectable, Logger } from '@nestjs/common';
import { RegisterAIRiskDto, AIRiskCategory, AIRiskLevel } from '../dto/enterprise-ai-governance.dto';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface AIRiskRecord {
  riskId: string;
  assetId: string;
  category: AIRiskCategory;
  level: AIRiskLevel;
  description: string;
  mitigationPlan: string;
  status: 'OPEN' | 'MITIGATING' | 'MITIGATED' | 'ACCEPTED';
  registeredAt: string;
}

@Injectable()
export class AIRiskManagementService {
  private readonly logger = new Logger(AIRiskManagementService.name);
  private readonly risks: Map<string, AIRiskRecord> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerRisk(dto: RegisterAIRiskDto, registeredBy: string): Promise<AIRiskRecord> {
    const riskId = `AIRISK-${dto.category}-${Date.now().toString(36).toUpperCase()}`;
    const record: AIRiskRecord = {
      riskId, assetId: dto.assetId, category: dto.category, level: dto.level,
      description: dto.description, mitigationPlan: dto.mitigationPlan,
      status: 'OPEN', registeredAt: new Date().toISOString(),
    };
    this.risks.set(riskId, record);
    await this.auditSvc.recordAudit('AI_RISK_DETECTED', riskId, registeredBy, { assetId: dto.assetId, category: dto.category, level: dto.level });
    await this.eventBus.publish('aura.eaigp.risk.detected.v1', { riskId, assetId: dto.assetId, category: dto.category, level: dto.level }, 'EAIGP', { subject: riskId });
    this.logger.warn(`[AIRisk] ⚠️ Risco detectado: ${dto.category}/${dto.level} em "${dto.assetId}" — ${riskId}`);
    return record;
  }

  async mitigateRisk(riskId: string, mitigatedBy: string): Promise<AIRiskRecord> {
    const r = this.risks.get(riskId);
    if (!r) throw new Error(`Risco "${riskId}" não encontrado.`);
    r.status = 'MITIGATED';
    await this.auditSvc.recordAudit('AI_RISK_MITIGATED', riskId, mitigatedBy, { category: r.category });
    return r;
  }

  getRisk(riskId: string): AIRiskRecord | undefined { return this.risks.get(riskId); }
  listRisks(category?: AIRiskCategory): AIRiskRecord[] {
    const all = Array.from(this.risks.values());
    return category ? all.filter((r) => r.category === category) : all;
  }
}
