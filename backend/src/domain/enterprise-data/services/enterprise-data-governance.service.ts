import { Injectable, Logger } from '@nestjs/common';
import { DefineDataDomainDto, DataDomain, DataSensitivity } from '../dto/enterprise-data.dto';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DataDomainDefinition {
  domain: DataDomain;
  owner: string;
  steward: string;
  description: string;
  defaultSensitivity: DataSensitivity;
  retentionYears: number;
  sharingPolicy: string;
  definedAt: string;
  updatedAt: string;
}

/**
 * EnterpriseDataGovernanceService — P171 EDGP
 *
 * Governança Corporativa de Dados alinhada ao DAMA-DMBOK2.
 * Define domínios institucionais de dados, atribuição de Data Owners e Data Stewards,
 * políticas de classificação de sensibilidade (LGPD), retenção e compartilhamento.
 */
@Injectable()
export class EnterpriseDataGovernanceService {
  private readonly logger = new Logger(EnterpriseDataGovernanceService.name);
  private readonly domainStore: Map<DataDomain, DataDomainDefinition> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.initDefaultDomains();
  }

  private initDefaultDomains(): void {
    const defaults: DefineDataDomainDto[] = [
      { domain: DataDomain.BENEFICIARIES, owner: 'Dra. Maria Silva (Diretora Social)', steward: 'Steward-Beneficiários', description: 'Dados cadastrais e histórico de beneficiários', defaultSensitivity: DataSensitivity.RESTRICTED, retentionYears: 10 },
      { domain: DataDomain.HEALTH_CARE, owner: 'Dr. Roberto Souza (Diretor Clínico)', steward: 'Steward-Saúde', description: 'Atendimentos psicossociais e prontuários', defaultSensitivity: DataSensitivity.RESTRICTED, retentionYears: 20 },
      { domain: DataDomain.VOLUNTEERS, owner: 'Coord. Ana Paula', steward: 'Steward-Voluntariado', description: 'Cadastro e atividades de voluntários', defaultSensitivity: DataSensitivity.CONFIDENTIAL, retentionYears: 5 },
      { domain: DataDomain.FINANCIAL, owner: 'CFO Instituto Ser Melhor', steward: 'Steward-Financeiro', description: 'Doações, repasses públicos e contabilidade', defaultSensitivity: DataSensitivity.CONFIDENTIAL, retentionYears: 10 },
    ];

    defaults.forEach((d) => this.defineDomainSync(d));
  }

  async defineDomain(dto: DefineDataDomainDto, definedBy = 'CDO'): Promise<DataDomainDefinition> {
    const def = this.defineDomainSync(dto);

    await this.auditSvc.recordAudit('DATA_DOMAIN_DEFINED', dto.domain, definedBy, {
      owner: dto.owner,
      steward: dto.steward,
      sensitivity: dto.defaultSensitivity,
    });

    await this.eventBus.publish(
      'aura.edgp.data.governance.policy.applied.v1',
      { domain: dto.domain, owner: dto.owner, sensitivity: dto.defaultSensitivity },
      'EDGP',
      { subject: dto.domain },
    );

    this.logger.log(`[EnterpriseDataGovernance] Domínio "${dto.domain}" configurado — Owner: ${dto.owner}`);
    return def;
  }

  getDomain(domain: DataDomain): DataDomainDefinition | undefined {
    return this.domainStore.get(domain);
  }

  listDomains(): DataDomainDefinition[] {
    return Array.from(this.domainStore.values());
  }

  private defineDomainSync(dto: DefineDataDomainDto): DataDomainDefinition {
    const now = new Date().toISOString();
    const existing = this.domainStore.get(dto.domain);

    const def: DataDomainDefinition = {
      domain: dto.domain,
      owner: dto.owner,
      steward: dto.steward,
      description: dto.description,
      defaultSensitivity: dto.defaultSensitivity,
      retentionYears: dto.retentionYears ?? 10,
      sharingPolicy: dto.defaultSensitivity === DataSensitivity.RESTRICTED ? 'RBAC/ABAC com aprovação expressa do Data Owner' : 'Compartilhamento interno livre',
      definedAt: existing?.definedAt ?? now,
      updatedAt: now,
    };

    this.domainStore.set(dto.domain, def);
    return def;
  }
}
