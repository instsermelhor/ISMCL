import { Module } from '@nestjs/common';
import { MasterCertificationController } from './controllers/master-certification.controller';
import { MasterArchitectureAuditService } from './services/master-architecture-audit.service';
import { PlatformCertificationBaselineService } from './services/platform-certification-baseline.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * MasterCertificationModule — Programa Mestre de Certificação Arquitetural, Baseline e Evolução Contínua (AMAC)
 *
 * Integra:
 * - MasterArchitectureAuditService (Auditoria Geral dos 30 Prompts, Matriz de Cobertura & Auto-Remediação)
 * - PlatformCertificationBaselineService (Congelamento de Baseline v1.0.0-GA, CMMI Nível 5 & Certificado Mestre AMAC-2026-MASTER-CERT SHA-256)
 *
 * Referências: Prompt 150 AMAC
 */
@Module({
  imports: [EventBusModule],
  controllers: [MasterCertificationController],
  providers: [MasterArchitectureAuditService, PlatformCertificationBaselineService],
  exports: [MasterArchitectureAuditService, PlatformCertificationBaselineService],
})
export class MasterCertificationModule {}
