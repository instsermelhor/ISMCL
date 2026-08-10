import { Module } from '@nestjs/common';
import { OperationsController } from './controllers/operations.controller';
import { SocialProgramsController } from './controllers/social-programs.controller';
import { CloudPlatformService } from './services/cloud-platform.service';
import { DevSecOpsPipelineService } from './services/devsecops-pipeline.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { FinOpsManagementService } from './services/finops-management.service';
import { SocialProgramsService } from './services/social-programs.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * OperationsModule — Plataforma Cloud Native, DevSecOps, Resiliência e Operações Corporativas (ACNPDREO)
 *
 * Integra:
 * - CloudPlatformService (Orquestração K8s + Service Mesh mTLS + Secret Vault)
 * - DevSecOpsPipelineService (Pipelines GitOps + Build + SAST + SBOM + Assinatura Cosign + Rollback)
 * - DisasterRecoveryService (Backup Corporativo + DR Drills RPO <= 5min / RTO <= 15min)
 * - FinOpsManagementService (Gestão de Custos e Otimização de Infraestrutura)
 * - SocialProgramsService (ASPS — Programas Sociais: CGI ↔ Página Pública)
 *
 * Referências: P105 AECN, P106 AEDSO, P127 AECC, P143 ACNPDREO, P189 ASPS
 */
@Module({
  imports: [EventBusModule],
  controllers: [OperationsController, SocialProgramsController],
  providers: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
    SocialProgramsService,
  ],
  exports: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
    SocialProgramsService,
  ],
})
export class OperationsModule {}
