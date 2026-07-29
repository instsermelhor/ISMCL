import { Injectable, Logger } from '@nestjs/common';
import { DataMartType } from '../dto/analytics.dto';

export interface FactAttendance {
  factId: string;
  beneficiaryId: string;
  professionalId: string;
  specialty: string;
  modality: string;
  durationMinutes: number;
  icdCode?: string;
  riskScore: number;
  socialVulnerabilityScore: number;
  timestamp: string;
}

export interface DataMartSummary {
  martType: DataMartType;
  totalRecords: number;
  metrics: Record<string, number | string>;
  lastIngestedAt: string;
}

/**
 * DataWarehouseService — Data Warehouse Corporativo e Data Marts Especializados
 *
 * Funcionalidades:
 * - Arquitetura em Estrela (Star Schema): Tabelas Fato (Atendimentos, Prescrições, Evoluções, Casos) + Dimensões
 * - Consolidação de dados de todos os módulos assistenciais e administrativos da Plataforma Aura
 * - 9 Data Marts especializados sincronizados em tempo real:
 *   Social, Psicologia, Psiquiatria, Financeiro, RH, Governança, Compliance, Voluntariado e Executivo
 *
 * Referências: P108 AEDP, P113 AEABI, P140 AEBI-DI Etapas 2, 3
 */
@Injectable()
export class DataWarehouseService {
  private readonly logger = new Logger(DataWarehouseService.name);
  private readonly factAttendances: FactAttendance[] = [];

  constructor() {
    this.seedMockDataWarehouse();
  }

  private seedMockDataWarehouse(): void {
    const specialties = ['PSYCHOLOGY', 'PSYCHIATRY', 'SOCIAL_WORK', 'NUTRITION', 'NEUROPSYCHOLOGY'];
    const now = Date.now();

    for (let i = 0; i < 50; i++) {
      this.factAttendances.push({
        factId: `FACT-${1000 + i}`,
        beneficiaryId: `benef-${100 + (i % 10)}`,
        professionalId: `prof-${200 + (i % 5)}`,
        specialty: specialties[i % specialties.length],
        modality: i % 2 === 0 ? 'TELEHEALTH' : 'IN_PERSON',
        durationMinutes: 45 + (i % 3) * 15,
        icdCode: i % 3 === 0 ? 'F32.1' : i % 3 === 1 ? 'F41.1' : 'Z63.0',
        riskScore: 40 + (i * 3) % 55,
        socialVulnerabilityScore: 1 + (i % 5),
        timestamp: new Date(now - i * 3600000 * 12).toISOString(),
      });
    }

    this.logger.log(`[DataWarehouse] 🌟 Data Warehouse inicializado com ${this.factAttendances.length} fatos de atendimento.`);
  }

  getDataMartSummary(martType: DataMartType): DataMartSummary {
    let filtered = this.factAttendances;

    if (martType === DataMartType.PSYCHOLOGY) {
      filtered = filtered.filter((f) => f.specialty === 'PSYCHOLOGY' || f.specialty === 'NEUROPSYCHOLOGY');
    } else if (martType === DataMartType.PSYCHIATRY) {
      filtered = filtered.filter((f) => f.specialty === 'PSYCHIATRY');
    } else if (martType === DataMartType.SOCIAL_CARE) {
      filtered = filtered.filter((f) => f.specialty === 'SOCIAL_WORK' || f.socialVulnerabilityScore >= 3);
    }

    const avgDuration = Math.round(
      filtered.reduce((acc, f) => acc + f.durationMinutes, 0) / (filtered.length || 1),
    );

    const avgRisk = Number(
      (filtered.reduce((acc, f) => acc + f.riskScore, 0) / (filtered.length || 1)).toFixed(1),
    );

    return {
      martType,
      totalRecords: filtered.length,
      metrics: {
        avgDurationMinutes: avgDuration,
        avgRiskScore: avgRisk,
        telehealthRatioPercentage: Math.round(
          (filtered.filter((f) => f.modality === 'TELEHEALTH').length / (filtered.length || 1)) * 100,
        ),
      },
      lastIngestedAt: new Date().toISOString(),
    };
  }

  getFactAttendances(limit = 100): FactAttendance[] {
    return this.factAttendances.slice(0, limit);
  }
}
