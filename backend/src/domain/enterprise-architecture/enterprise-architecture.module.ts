import { Module } from '@nestjs/common';
import { EventBusModule } from '../../events/event-bus.module';

// Services
import { ArchitectureAuditService } from './services/architecture-audit.service';
import { EnterpriseArchitectureService } from './services/enterprise-architecture.service';
import { ArchitectureGovernanceService } from './services/architecture-governance.service';
import { ArchitectureComplianceService } from './services/architecture-compliance.service';
import { ArchitectureReviewBoardService } from './services/architecture-review-board.service';
import { ArchitectureDecisionRecordService } from './services/architecture-decision-record.service';
import { ArchitectureRepositoryService } from './services/architecture-repository.service';
import { ArchitectureDriftDetectionService } from './services/architecture-drift-detection.service';
import { ArchitectureEvolutionService } from './services/architecture-evolution.service';
import { SolutionReviewService } from './services/solution-review.service';

// Controller
import { EnterpriseArchitectureController } from './controllers/enterprise-architecture.controller';

/**
 * EnterpriseArchitectureModule — P171 EAGO (Fase XXI)
 *
 * Escritório Corporativo de Governança da Arquitetura, Conformidade Contínua
 * e Evolução Arquitetural (EAGO).
 * Preserva, monitora, valida e evolui continuamente toda a arquitetura corporativa
 * do ecossistema Plataforma Aura (TOGAF, C4 Model, ISO/IEC 42010, ArchiMate, ADRs).
 *
 * Componentes:
 * - ArchitectureAuditService          — Trilha imutável de auditoria SHA-256
 * - EnterpriseArchitectureService      — Repositório central (8 domínios) e radar tecnológico
 * - ArchitectureGovernanceService      — Propostas, decisões, exceções e políticas
 * - ArchitectureComplianceService      — Score de conformidade (LGPD, Security, Zero Trust)
 * - ArchitectureReviewBoardService     — Conselho ARB (sessões, votos e pareceres)
 * - ArchitectureDecisionRecordService  — Ciclo de vida completo dos ADRs
 * - ArchitectureRepositoryService     — Catálogo oficial de artefatos (C4/UML/ArchiMate)
 * - ArchitectureDriftDetectionService  — Detecção automatizada de desvios e violações
 * - ArchitectureEvolutionService     — Roadmap de evolução e marcos tecnológicos
 * - SolutionReviewService              — Avaliação de soluções pré-implementação
 */
@Module({
  imports: [EventBusModule],
  providers: [
    ArchitectureAuditService,
    EnterpriseArchitectureService,
    ArchitectureGovernanceService,
    ArchitectureComplianceService,
    ArchitectureReviewBoardService,
    ArchitectureDecisionRecordService,
    ArchitectureRepositoryService,
    ArchitectureDriftDetectionService,
    ArchitectureEvolutionService,
    SolutionReviewService,
  ],
  controllers: [EnterpriseArchitectureController],
  exports: [
    ArchitectureAuditService,
    EnterpriseArchitectureService,
    ArchitectureGovernanceService,
    ArchitectureComplianceService,
    ArchitectureReviewBoardService,
    ArchitectureDecisionRecordService,
    ArchitectureRepositoryService,
    ArchitectureDriftDetectionService,
    ArchitectureEvolutionService,
    SolutionReviewService,
  ],
})
export class EnterpriseArchitectureModule {}
