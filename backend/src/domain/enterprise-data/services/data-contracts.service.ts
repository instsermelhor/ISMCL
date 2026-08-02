import { Injectable, Logger } from '@nestjs/common';
import { PublishDataContractDto, DataDomain } from '../dto/enterprise-data.dto';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface DataContractRecord {
  contractId: string;
  contractName: string;
  version: string;
  domain: DataDomain;
  schemaDefinition: Record<string, any>;
  producerService: string;
  consumerServices: string[];
  status: 'ACTIVE' | 'DEPRECATED' | 'BROKEN';
  publishedAt: string;
}

/**
 * DataContractsService — P172 EDGP
 *
 * Contratos de Dados (Data Contracts).
 * Define esquemas, regras de validação, compatibilidade e versionamento estrito
 * entre microsserviços produtores e consumidores de dados na Plataforma Aura.
 */
@Injectable()
export class DataContractsService {
  private readonly logger = new Logger(DataContractsService.name);
  private readonly contracts: Map<string, DataContractRecord> = new Map();

  constructor(
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async publishContract(dto: PublishDataContractDto, publishedBy = 'SYSTEM'): Promise<DataContractRecord> {
    const contractId = `CTR-${dto.contractName}-${dto.version}`;
    const now = new Date().toISOString();

    const record: DataContractRecord = {
      contractId,
      contractName: dto.contractName,
      version: dto.version,
      domain: dto.domain,
      schemaDefinition: dto.schemaDefinition,
      producerService: dto.producerService,
      consumerServices: dto.consumerServices ?? [],
      status: 'ACTIVE',
      publishedAt: now,
    };

    this.contracts.set(contractId, record);

    await this.auditSvc.recordAudit('DATA_CONTRACT_PUBLISHED', contractId, publishedBy, {
      contractName: dto.contractName,
      version: dto.version,
      producer: dto.producerService,
    });

    await this.eventBus.publish(
      'aura.edgp.data.contract.published.v1',
      { contractId, contractName: dto.contractName, version: dto.version, producerService: dto.producerService },
      'EDGP',
      { subject: contractId },
    );

    this.logger.log(`[DataContracts] Contrato de dados publicado "${contractId}" (Produtor: ${dto.producerService})`);
    return record;
  }

  validatePayloadAgainstContract(contractId: string, payload: Record<string, any>): { isValid: boolean; errors: string[] } {
    const contract = this.contracts.get(contractId);
    if (!contract) return { isValid: false, errors: [`Contrato "${contractId}" não encontrado.`] };

    const errors: string[] = [];
    const requiredFields = contract.schemaDefinition['required'] ?? [];

    for (const field of requiredFields) {
      if (payload[field] === undefined || payload[field] === null) {
        errors.push(`Campo obrigatório ausente: "${field}"`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getContract(contractId: string): DataContractRecord | undefined {
    return this.contracts.get(contractId);
  }

  listContracts(domain?: DataDomain): DataContractRecord[] {
    const all = Array.from(this.contracts.values());
    return domain ? all.filter((c) => c.domain === domain) : all;
  }
}
