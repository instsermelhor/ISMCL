import { Injectable, Logger } from '@nestjs/common';
import { SocialImpactAuditService } from './social-impact-audit.service';

export interface InstitutionalIndicator {
  indicatorId: string;
  name: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: 'ON_TRACK' | 'NEEDS_ATTENTION' | 'EXCEEDED';
  updatedAt: string;
}

/**
 * InstitutionalIndicatorsService — Indicadores Institucionais (P165 SIIP)
 *
 * Gerencia a matriz de indicadores institucionais estratégicos quantitativos e qualitativos.
 */
@Injectable()
export class InstitutionalIndicatorsService {
  private readonly logger = new Logger(InstitutionalIndicatorsService.name);
  private indicatorMap: Map<string, InstitutionalIndicator> = new Map();

  constructor(private readonly auditService: SocialImpactAuditService) {
    this.seedIndicators();
  }

  private seedIndicators(): void {
    const seeds: InstitutionalIndicator[] = [
      {
        indicatorId: 'IND-BENEF-01',
        name: 'Beneficiários Atendidos Anualmente',
        category: 'SOCIAL_IMPACT',
        targetValue: 5000,
        currentValue: 4850,
        unit: 'pessoas',
        status: 'ON_TRACK',
        updatedAt: new Date().toISOString(),
      },
      {
        indicatorId: 'IND-SATIS-01',
        name: 'Índice de Satisfação dos Assistidos (NPS)',
        category: 'QUALITY',
        targetValue: 90,
        currentValue: 94,
        unit: 'score NPS',
        status: 'EXCEEDED',
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const ind of seeds) {
      this.indicatorMap.set(ind.indicatorId, ind);
    }
  }

  listIndicators(): InstitutionalIndicator[] {
    return Array.from(this.indicatorMap.values());
  }
}
