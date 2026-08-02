import { Injectable, Logger } from '@nestjs/common';
import { EnterpriseArchitectureService, ArchitectureArtifact } from './enterprise-architecture.service';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArchitectureComponentCatalog {
  totalModules: number;
  modules: Array<{ moduleName: string; layer: string; path: string; isHomologated: boolean }>;
  lastCataloguedAt: string;
}

/**
 * ArchitectureRepositoryService — P171 EAGO
 *
 * Repositório especializado de arquitetura:
 * Armazena diagramas C4, especificações UML, ArchiMate, OpenAPI e AsyncAPI.
 * Mantém o catálogo oficial de componentes e microsserviços do ecossistema Aura.
 */
@Injectable()
export class ArchitectureRepositoryService {
  private readonly logger = new Logger(ArchitectureRepositoryService.name);

  constructor(
    private readonly architectureSvc: EnterpriseArchitectureService,
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  getCatalog(): ArchitectureComponentCatalog {
    // Módulos principais mapeados na arquitetura Aura (44 microsserviços)
    const modules = [
      { moduleName: 'EnterpriseStrategyModule', layer: 'Domain/Strategy', path: 'src/domain/enterprise-strategy', isHomologated: true },
      { moduleName: 'BusinessContinuityModule', layer: 'Domain/Resilience', path: 'src/domain/business-continuity', isHomologated: true },
      { moduleName: 'EnterpriseKnowledgeModule', layer: 'Domain/Knowledge', path: 'src/domain/enterprise-knowledge', isHomologated: true },
      { moduleName: 'EnterpriseArchitectureModule', layer: 'Domain/Governance', path: 'src/domain/enterprise-architecture', isHomologated: true },
      { moduleName: 'EventBusModule', layer: 'Events', path: 'src/events', isHomologated: true },
    ];

    return {
      totalModules: modules.length,
      modules,
      lastCataloguedAt: new Date().toISOString(),
    };
  }

  async getArtifactsByFormat(format: string): Promise<ArchitectureArtifact[]> {
    return this.architectureSvc.listArtifacts().filter(
      (a) => a.format.toLowerCase() === format.toLowerCase(),
    );
  }
}
