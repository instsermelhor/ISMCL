import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  RegisterDataAssetDto,
  DataClassification,
} from '../dto/analytics.dto';

export interface DataAsset {
  assetId: string;
  assetName: string;
  description: string;
  classification: DataClassification;
  owner: string;
  retentionMonths: number;
  qualityMetrics: {
    completenessPercentage: number;
    consistencyPercentage: number;
    timelinessPercentage: number;
    validityPercentage: number;
  };
  lineage: {
    sourceModules: string[];
    transformationEngine: string;
    destinationDataMarts: string[];
  };
  createdAt: string;
}

/**
 * DataGovernanceService — Governança de Dados, Catálogo e Qualidade (Data Governance)
 *
 * Funcionalidades:
 * - Catálogo e Dicionário de Dados Corporativo
 * - Linhagem de Dados (Data Lineage: Módulo Origem → EventBus → DW → Data Mart → Dashboard)
 * - Métricas de Qualidade de Dados (Completude, Consistência, Atualidade, Validade)
 * - Classificação de sensibilidade LGPD e controle de retenção
 * - Alinhado à MCSI (Matriz de Classificação de Segurança da Informação)
 *
 * Referências: P108 AEDP, P116 AEGRC, P140 AEBI-DI Etapa 9
 */
@Injectable()
export class DataGovernanceService {
  private readonly logger = new Logger(DataGovernanceService.name);
  private readonly catalog = new Map<string, DataAsset>();

  constructor() {
    this.seedDefaultCatalog();
  }

  private seedDefaultCatalog(): void {
    const defaults: RegisterDataAssetDto[] = [
      { assetName: 'fact_attendance', description: 'Tabela Fato de Atendimentos Presenciais e Teleconsultas', classification: DataClassification.SENSITIVE_HEALTH, owner: 'DPO / Coordenação Clínica', retentionMonths: 240 },
      { assetName: 'fact_prescription', description: 'Tabela Fato de Prescrições e Documentos Emitidos', classification: DataClassification.SENSITIVE_HEALTH, owner: 'DPO / Diretoria Médica', retentionMonths: 240 },
      { assetName: 'fact_workflow_execution', description: 'Tabela Fato de Instâncias de Workflows e SLAs', classification: DataClassification.INTERNAL, owner: 'Equipe de Processos', retentionMonths: 60 },
      { assetName: 'dim_beneficiary', description: 'Dimensão Beneficiário (Pseudonimizada)', classification: DataClassification.RESTRICTED, owner: 'Encarregado LGPD', retentionMonths: 120 },
    ];

    for (const d of defaults) {
      const assetId = randomUUID();
      this.catalog.set(assetId, {
        assetId,
        ...d,
        retentionMonths: d.retentionMonths ?? 60,
        qualityMetrics: {
          completenessPercentage: 98.4,
          consistencyPercentage: 99.1,
          timelinessPercentage: 97.8,
          validityPercentage: 99.5,
        },
        lineage: {
          sourceModules: ['IntakeModule', 'EhrModule', 'SchedulingModule', 'DocumentsModule'],
          transformationEngine: 'Aura Event-Driven Ingestion Engine',
          destinationDataMarts: ['SOCIAL_CARE', 'PSYCHOLOGY', 'PSYCHIATRY', 'EXECUTIVE'],
        },
        createdAt: new Date().toISOString(),
      });
    }

    this.logger.log(`[DataGovernance] 🛡️ Catálogo de dados inicializado com ${this.catalog.size} ativos auditados.`);
  }

  registerAsset(dto: RegisterDataAssetDto): DataAsset {
    const assetId = randomUUID();
    const asset: DataAsset = {
      assetId,
      ...dto,
      retentionMonths: dto.retentionMonths ?? 60,
      qualityMetrics: {
        completenessPercentage: 95.0,
        consistencyPercentage: 96.0,
        timelinessPercentage: 95.0,
        validityPercentage: 98.0,
      },
      lineage: {
        sourceModules: ['DomainServices'],
        transformationEngine: 'Aura Data Pipeline',
        destinationDataMarts: ['EXECUTIVE'],
      },
      createdAt: new Date().toISOString(),
    };

    this.catalog.set(assetId, asset);
    this.logger.log(`[DataGovernance] 📝 Ativo registrado no catálogo: "${dto.assetName}" (${dto.classification})`);
    return asset;
  }

  getCatalog(): DataAsset[] {
    return [...this.catalog.values()].sort((a, b) => a.assetName.localeCompare(b.assetName));
  }

  getOverallQualityScore(): number {
    const assets = [...this.catalog.values()];
    if (assets.length === 0) return 100;
    const total = assets.reduce((sum, a) => {
      const q = a.qualityMetrics;
      return sum + (q.completenessPercentage + q.consistencyPercentage + q.timelinessPercentage + q.validityPercentage) / 4;
    }, 0);
    return Number((total / assets.length).toFixed(1));
  }
}
