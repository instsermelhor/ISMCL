import { Module } from '@nestjs/common';
import { OperationsController } from './controllers/operations.controller';
import { FinancialController } from './controllers/financial.controller';
import { SocialProgramsController } from './controllers/social-programs.controller';
import { CloudPlatformService } from './services/cloud-platform.service';
import { DevSecOpsPipelineService } from './services/devsecops-pipeline.service';
import { DisasterRecoveryService } from './services/disaster-recovery.service';
import { FinOpsManagementService } from './services/finops-management.service';
import { SocialProgramsService } from './services/social-programs.service';
import { FinancialApprovalService } from './services/financial-approval.service';
import { AuditService } from '../../audit/audit.service';
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
 * - FinancialApprovalService (Motor de Alçada Financeira — GAP-P2-03)
 *
 * Referências: P105 AECN, P106 AEDSO, P127 AECC, P143 ACNPDREO, P189 ASPS
 */
@Module({
  imports: [EventBusModule],
  controllers: [OperationsController, FinancialController, SocialProgramsController],
  providers: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
    SocialProgramsService,
    FinancialApprovalService,
    AuditService,
  ],
  exports: [
    CloudPlatformService,
    DevSecOpsPipelineService,
    DisasterRecoveryService,
    FinOpsManagementService,
    SocialProgramsService,
    FinancialApprovalService,
  ],
})
export class OperationsModule {}
