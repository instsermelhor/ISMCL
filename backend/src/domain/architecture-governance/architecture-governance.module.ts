import { Module } from '@nestjs/common';
import { ArchitectureGovernanceController } from './controllers/architecture-governance.controller';
import { ArchitectureRepositoryService } from './services/architecture-repository.service';
import { DigitalTwinComplianceService } from './services/digital-twin-compliance.service';
import { EventBusModule } from '../../events/event-bus.module';

/**
 * ArchitectureGovernanceModule — Architecture Governance Office (AGO), Digital Twin & Management (AEAGO)
 *
 * Integra:
 * - ArchitectureRepositoryService (Repositório Vivo de Arquitetura + ADR Engine SHA-256 + Dívida Técnica)
 * - DigitalTwinComplianceService (Digital Twin Arquitetural + Auditoria de Conformidade Clean Architecture/DDD)
 *
 * Referências: P148 AEAGO
 */
@Module({
  imports: [EventBusModule],
  controllers: [ArchitectureGovernanceController],
  providers: [
    ArchitectureRepositoryService,
    DigitalTwinComplianceService,
  ],
  exports: [
    ArchitectureRepositoryService,
    DigitalTwinComplianceService,
  ],
})
export class ArchitectureGovernanceModule {}
