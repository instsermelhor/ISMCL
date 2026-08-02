import { Injectable, Logger } from '@nestjs/common';
import { RegisterPartnerDto, PartnerStatus } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface PartnerRecord {
  partnerId: string;
  partnerName: string;
  partnerType: string;
  technicalContact: string;
  requestedScopes: string[];
  grantedScopes: string[];
  status: PartnerStatus;
  apiKey?: string;
  sandboxUrl?: string;
  registeredAt: string;
}

@Injectable()
export class PartnerIntegrationService {
  private readonly logger = new Logger(PartnerIntegrationService.name);
  private readonly partners: Map<string, PartnerRecord> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerPartner(dto: RegisterPartnerDto, registeredBy: string): Promise<PartnerRecord> {
    const record: PartnerRecord = { partnerId: dto.partnerId, partnerName: dto.partnerName, partnerType: dto.partnerType, technicalContact: dto.technicalContact, requestedScopes: dto.requestedScopes ?? [], grantedScopes: [], status: PartnerStatus.PENDING, registeredAt: new Date().toISOString() };
    this.partners.set(dto.partnerId, record);
    await this.auditSvc.recordAudit('PARTNER_REGISTERED', dto.partnerId, registeredBy, { partnerType: dto.partnerType });
    this.logger.log(`[PartnerIntegration] Parceiro registrado: "${dto.partnerName}" (${dto.partnerId})`);
    return record;
  }

  async promoteToSandbox(partnerId: string, approvedBy: string): Promise<PartnerRecord> {
    const p = this.getOrThrow(partnerId);
    p.status = PartnerStatus.SANDBOX;
    p.sandboxUrl = `https://sandbox.aura.sermelhor.org.br/partners/${partnerId}`;
    p.apiKey = require('crypto').randomBytes(24).toString('hex');
    await this.auditSvc.recordAudit('PARTNER_SANDBOX_GRANTED', partnerId, approvedBy, { sandboxUrl: p.sandboxUrl });
    return p;
  }

  async activatePartner(partnerId: string, grantedScopes: string[], approvedBy: string): Promise<PartnerRecord> {
    const p = this.getOrThrow(partnerId);
    if (p.status !== PartnerStatus.SANDBOX) throw new Error(`Parceiro "${partnerId}" deve estar em SANDBOX para ativacao.`);
    p.status = PartnerStatus.ACTIVE;
    p.grantedScopes = grantedScopes;
    await this.auditSvc.recordAudit('PARTNER_ACTIVATED', partnerId, approvedBy, { grantedScopes });
    await this.eventBus.publish('aura.eiemp.partner.integrated.v1', { partnerId, partnerName: p.partnerName, grantedScopes }, 'EIEMP', { subject: partnerId });
    this.logger.log(`[PartnerIntegration] Parceiro ativado: "${p.partnerName}" com escopos [${grantedScopes.join(', ')}]`);
    return p;
  }

  getPartner(partnerId: string): PartnerRecord | undefined { return this.partners.get(partnerId); }
  listPartners(status?: PartnerStatus): PartnerRecord[] {
    const all = Array.from(this.partners.values());
    return status ? all.filter((p) => p.status === status) : all;
  }

  private getOrThrow(partnerId: string): PartnerRecord {
    const p = this.partners.get(partnerId);
    if (!p) throw new Error(`Parceiro "${partnerId}" nao encontrado.`);
    return p;
  }
}
