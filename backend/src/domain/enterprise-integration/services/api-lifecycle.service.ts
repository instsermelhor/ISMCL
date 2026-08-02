import { Injectable, Logger } from '@nestjs/common';
import { RegisterAPIDto, APILifecycleStage } from '../dto/enterprise-integration.dto';
import { IntegrationAuditService } from './integration-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface APIRecord {
  apiId: string;
  name: string;
  version: string;
  basePath: string;
  owner: string;
  description: string;
  rateLimitRpm: number;
  stage: APILifecycleStage;
  registeredAt: string;
  updatedAt: string;
}

@Injectable()
export class APILifecycleService {
  private readonly logger = new Logger(APILifecycleService.name);
  private readonly apis: Map<string, APIRecord> = new Map();

  constructor(
    private readonly auditSvc: IntegrationAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async registerAPI(dto: RegisterAPIDto, registeredBy: string): Promise<APIRecord> {
    const record: APIRecord = {
      apiId: dto.apiId, name: dto.name, version: dto.version, basePath: dto.basePath,
      owner: dto.owner, description: dto.description ?? '', rateLimitRpm: dto.rateLimitRpm ?? 60,
      stage: APILifecycleStage.DRAFT, registeredAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    this.apis.set(dto.apiId, record);
    await this.auditSvc.recordAudit('API_REGISTERED', dto.apiId, registeredBy, { version: dto.version, basePath: dto.basePath });
    await this.eventBus.publish('aura.eiemp.api.registered.v1', { apiId: dto.apiId, name: dto.name, version: dto.version }, 'EIEMP', { subject: dto.apiId });
    this.logger.log(`[APILifecycle] API registrada: "${dto.name}" v${dto.version} (${dto.apiId})`);
    return record;
  }

  async publishAPI(apiId: string, publishedBy: string): Promise<APIRecord> {
    const api = this.getOrThrow(apiId);
    api.stage = APILifecycleStage.PUBLISHED;
    api.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('API_PUBLISHED', apiId, publishedBy, { version: api.version });
    await this.eventBus.publish('aura.eiemp.api.published.v1', { apiId, version: api.version }, 'EIEMP', { subject: apiId });
    this.logger.log(`[APILifecycle] API publicada: "${api.name}" v${api.version}`);
    return api;
  }

  async deprecateAPI(apiId: string, deprecatedBy: string, reason: string): Promise<APIRecord> {
    const api = this.getOrThrow(apiId);
    api.stage = APILifecycleStage.DEPRECATED;
    api.updatedAt = new Date().toISOString();
    await this.auditSvc.recordAudit('API_DEPRECATED', apiId, deprecatedBy, { reason, version: api.version });
    await this.eventBus.publish('aura.eiemp.api.version.deprecated.v1', { apiId, version: api.version, reason }, 'EIEMP', { subject: apiId });
    return api;
  }

  getAPI(apiId: string): APIRecord | undefined { return this.apis.get(apiId); }
  listAPIs(stage?: APILifecycleStage): APIRecord[] {
    const all = Array.from(this.apis.values());
    return stage ? all.filter((a) => a.stage === stage) : all;
  }

  private getOrThrow(apiId: string): APIRecord {
    const a = this.apis.get(apiId);
    if (!a) throw new Error(`API "${apiId}" nao encontrada.`);
    return a;
  }
}
