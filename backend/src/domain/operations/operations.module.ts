import { Module } from '@nestjs/common';
import { OperationsController } from './controllers/operations.controller';
import { CloudPlatformService } from './services/cloud-platform.service';
import { DevSecOpsPipelineService } from './services/devsecops-pipeline.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { FinOpsManagementService } from './services/finops-management.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * OperationsModule — Plataforma Cloud Native, DevSecOps, Resiliência e Operações Corporativas (ACNPDREO)
 *
 * Integra:
 * - CloudPlatformService (Orquestração K8s + Service Mesh mTLS + Secret Vault)
 * - DevSecOpsPipelineService (Pipelines GitOps + Build + SAST + SBOM + Assinatura Cosign + Rollback)
 * - DisasterRecoveryService (Backup Corporativo + DR Drills RPO <= 5min / RTO <= 15min)
 * - FinOpsManagementService (Gestão de Custos e Otimização de Infraestrutura)
 *
 * Referências: P105 AECN, P106 AEDSO, P127 AECC, P143 ACNPDREO
 */
@Module({
  imports: [EventBusModule],
  controllers: [OperationsController],
  providers: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
  ],
  exports: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
  ],
})
export class OperationsModule {}
