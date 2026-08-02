import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { DataGovernanceAuditService } from './services/data-governance-audit.service';
import { EnterpriseDataGovernanceService } from './services/enterprise-data-governance.service';
import { MasterDataManagementService } from './services/master-data-management.service';
import { DataFabricService } from './services/data-fabric.service';
import { MetadataCatalogService } from './services/metadata-catalog.service';
import { DataLineageService } from './services/data-lineage.service';
import { DataQualityService } from './services/data-quality.service';
import { DataContractsService } from './services/data-contracts.service';
import { DataOpsService } from './services/dataops.service';
import { DataStewardshipService } from './services/data-stewardship.service';

// Controller
import { EnterpriseDataController } from './controllers/enterprise-data.controller';

/**
 * EnterpriseDataModule — P172 EDGP (Fase XXII)
 *
 * Plataforma Corporativa de Governança de Dados, Data Fabric e Master Data (EDGP).
 * Conecta Governança de Dados (DAMA-DMBOK2), Master Data Management (Golden Records),
 * Camada Data Fabric Unificada, Catálogo de Metadados, Rastreabilidade (Data Lineage),
 * Monitoramento de Qualidade em 7 Dimensões, Contratos de Dados (Data Contracts),
 * Pipelines DataOps, Ações de Data Stewards e Auditoria Imutável SHA-256.
 *
 * Componentes:
 * - DataGovernanceAuditService       — Trilha imutável SHA-256
 * - EnterpriseDataGovernanceService   — Domínios de dados, Owners, Stewards e retenção
 * - MasterDataManagementService       — MDM, deduplicação e Golden Records
 * - DataFabricService                 — Camada unificada de abstração de dados
 * - MetadataCatalogService            — Catálogo de metadados e pesquisa semântica
 * - DataLineageService                — Linhagem e rastreabilidade de ponta a ponta
 * - DataQualityService                — Qualidade em 7 dimensões (score 0-100)
 * - DataContractsService              — Validação de esquemas e contratos de dados
 * - DataOpsService                    — Pipelines automatizados e controle de qualidade
 * - DataStewardshipService            — overrides operacionais dos Data Stewards
 */
@Module({
  imports: [EventBusModule],
  providers: [
    DataGovernanceAuditService,
    EnterpriseDataGovernanceService,
    MasterDataManagementService,
    DataFabricService,
    MetadataCatalogService,
    DataLineageService,
    DataQualityService,
    DataContractsService,
    DataOpsService,
    DataStewardshipService,
  ],
  controllers: [EnterpriseDataController],
  exports: [
    DataGovernanceAuditService,
    EnterpriseDataGovernanceService,
    MasterDataManagementService,
    DataFabricService,
    MetadataCatalogService,
    DataLineageService,
    DataQualityService,
    DataContractsService,
    DataOpsService,
    DataStewardshipService,
  ],
})
export class EnterpriseDataModule {}
