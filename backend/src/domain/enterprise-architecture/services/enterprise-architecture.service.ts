import { Injectable, Logger } from '@nestjs/common';
import {
  RegisterArchitectureArtifactDto,
  ArchitectureDomain,
  TechnologyStatus,
} from '../dto/enterprise-architecture.dto';
import { ArchitectureAuditService } from './architecture-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ArchitectureArtifact {
  artifactId: string;
  name: string;
  domain: ArchitectureDomain;
  description: string;
  format: string;
  author: string;
  version: number;
  versionHistory: Array<{ version: number; updatedAt: string; updatedBy: string; sha256Hash: string }>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface HomologatedTechnology {
  techId: string;
  name: string;
  category: string;
  status: TechnologyStatus;
  allowedDomains: ArchitectureDomain[];
  rationale: string;
  approvedBy: string;
  approvedAt: string;
}

/**
 * EnterpriseArchitectureService — P171 EAGO
 *
 * Repositório central corporativo de arquitetura cobrindo 8 domínios:
 * Negócios, Aplicações, Dados, Tecnologia, Segurança, IA, Integrações e Infraestrutura.
 * Controla também o catálogo de tecnologias homologadas e versionamento de artefatos.
 */
@Injectable()
export class EnterpriseArchitectureService {
  private readonly logger = new Logger(EnterpriseArchitectureService.name);
  private readonly artifacts: Map<string, ArchitectureArtifact> = new Map();
  private readonly technologies: Map<string, HomologatedTechnology> = new Map();

  constructor(
    private readonly auditSvc: ArchitectureAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultHomologatedStack();
  }

  private initDefaultHomologatedStack(): void {
    const stack: Array<Omit<HomologatedTechnology, 'techId' | 'approvedAt'>> = [
      { name: 'TypeScript', category: 'Language', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.APPLICATION], rationale: 'Tipagem estática estrita e padronização.', approvedBy: 'CEA' },
      { name: 'NestJS', category: 'Framework', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.APPLICATION], rationale: 'Arquitetura modular orientada a DI.', approvedBy: 'CEA' },
      { name: 'Prisma ORM', category: 'Database ORM', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.DATA], rationale: 'Type-safety e migrações declarativas.', approvedBy: 'CEA' },
      { name: 'PostgreSQL', category: 'Relational DB', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.DATA], rationale: 'Robustez e conformidade ACID.', approvedBy: 'CEA' },
      { name: 'AsyncAPI 2.6.0', category: 'Event Spec', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.INTEGRATION], rationale: 'Padronização de contratos de eventos.', approvedBy: 'CEA' },
      { name: 'Swagger / OpenAPI 3.0', category: 'API Spec', status: TechnologyStatus.HOMOLOGATED, allowedDomains: [ArchitectureDomain.INTEGRATION], rationale: 'Documentação automática de REST APIs.', approvedBy: 'CEA' },
    ];

    stack.forEach((tech) => {
      const techId = `TECH-${tech.name.replace(/\s+/g, '-').toUpperCase()}`;
      this.technologies.set(techId, {
        ...tech,
        techId,
        approvedAt: new Date().toISOString(),
      });
    });
  }

  async registerArtifact(dto: RegisterArchitectureArtifactDto, registeredBy = 'SYSTEM'): Promise<ArchitectureArtifact> {
    const artifactId = `ARCH-${dto.domain}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();
    const payload = JSON.stringify({ name: dto.name, domain: dto.domain, description: dto.description });
    const sha256Hash = require('crypto').createHash('sha256').update(payload).digest('hex');

    const artifact: ArchitectureArtifact = {
      artifactId,
      name: dto.name,
      domain: dto.domain,
      description: dto.description,
      format: dto.format,
      author: dto.author ?? registeredBy,
      version: 1,
      versionHistory: [{ version: 1, updatedAt: now, updatedBy: registeredBy, sha256Hash }],
      metadata: dto.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    };

    this.artifacts.set(artifactId, artifact);

    await this.auditSvc.recordAudit('ARCHITECTURAL_ARTIFACT_REGISTERED', artifactId, registeredBy, {
      name: dto.name,
      domain: dto.domain,
      format: dto.format,
    });

    this.logger.log(`[EnterpriseArchitecture] Artefato "${artifactId}" registrado: "${dto.name}" (${dto.domain})`);
    return artifact;
  }

  async registerHomologatedTechnology(
    name: string,
    category: string,
    status: TechnologyStatus,
    allowedDomains: ArchitectureDomain[],
    rationale: string,
    approvedBy: string,
  ): Promise<HomologatedTechnology> {
    const techId = `TECH-${name.replace(/\s+/g, '-').toUpperCase()}`;
    const tech: HomologatedTechnology = {
      techId,
      name,
      category,
      status,
      allowedDomains,
      rationale,
      approvedBy,
      approvedAt: new Date().toISOString(),
    };

    this.technologies.set(techId, tech);

    await this.auditSvc.recordAudit('TECHNOLOGY_HOMOLOGATED', techId, approvedBy, {
      name,
      category,
      status,
      allowedDomains,
    });

    this.logger.log(`[EnterpriseArchitecture] Tecnologia "${name}" cadastrada no radar com status ${status}.`);
    return tech;
  }

  getArtifact(artifactId: string): ArchitectureArtifact | undefined {
    return this.artifacts.get(artifactId);
  }

  listArtifacts(domain?: ArchitectureDomain): ArchitectureArtifact[] {
    const all = Array.from(this.artifacts.values());
    return domain ? all.filter((a) => a.domain === domain) : all;
  }

  listHomologatedTechnologies(status?: TechnologyStatus): HomologatedTechnology[] {
    const all = Array.from(this.technologies.values());
    return status ? all.filter((t) => t.status === status) : all;
  }

  isTechnologyHomologated(techName: string): boolean {
    const tech = Array.from(this.technologies.values()).find(
      (t) => t.name.toLowerCase() === techName.toLowerCase(),
    );
    return tech ? tech.status === TechnologyStatus.HOMOLOGATED : false;
  }
}
