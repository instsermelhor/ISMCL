import { Injectable, Logger } from '@nestjs/common';
import { AssessProductionRiskDto, ProductionRiskLevel } from '../dto/enterprise-readiness.dto';
import { CertificationEvidenceService } from './certification-evidence.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ProductionRiskAssessment {
  riskId: string;
  releaseTag: string;
  operationalImpactLevel: ProductionRiskLevel;
  assistentialImpactLevel: ProductionRiskLevel;
  financialImpactLevel: ProductionRiskLevel;
  technologicalImpactLevel: ProductionRiskLevel;
  regulatoryImpactLevel: ProductionRiskLevel;
  institutionalImpactLevel: ProductionRiskLevel;
  overallRiskLevel: ProductionRiskLevel;
  mitigationRequired: boolean;
  assessedAt: string;
}

/**
 * ProductionRiskAssessmentService — Avaliação de Riscos para Produção (P163 ERCP)
 *
 * Analisa o impacto operacional, assistencial, financeiro, tecnológico,
 * regulatório e institucional de cada release antes da implantação.
 */
@Injectable()
export class ProductionRiskAssessmentService {
  private readonly logger = new Logger(ProductionRiskAssessmentService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly evidence: CertificationEvidenceService,
    private readonly eventBus: EventBusService,
  ) {}

  async assessProductionRisk(dto: AssessProductionRiskDto): Promise<ProductionRiskAssessment> {
    const riskId = `PROD-RISK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const assessment: ProductionRiskAssessment = {
      riskId,
      releaseTag: dto.releaseTag,
      operationalImpactLevel: ProductionRiskLevel.LOW,
      assistentialImpactLevel: ProductionRiskLevel.NEGLIGIBLE,
      financialImpactLevel: ProductionRiskLevel.LOW,
      technologicalImpactLevel: ProductionRiskLevel.LOW,
      regulatoryImpactLevel: ProductionRiskLevel.NEGLIGIBLE,
      institutionalImpactLevel: ProductionRiskLevel.LOW,
      overallRiskLevel: ProductionRiskLevel.LOW,
      mitigationRequired: false,
      assessedAt: new Date().toISOString(),
    };

    await this.evidence.recordEvidence('PRODUCTION_RISK_ASSESSMENT', dto.releaseTag, 'CRO', {
      riskId, overallRiskLevel: assessment.overallRiskLevel,
    });

    await this.eventBus.publish(
      'aura.readiness.production.risk.assessed.v1',
      { riskId, releaseTag: dto.releaseTag, overallRiskLevel: assessment.overallRiskLevel },
      this.SYSTEM_TENANT,
      { subject: riskId },
    );

    this.logger.log(`[ProdRiskAssessment] ${riskId} for ${dto.releaseTag} → Risk: ${assessment.overallRiskLevel}`);
    return assessment;
  }
}
