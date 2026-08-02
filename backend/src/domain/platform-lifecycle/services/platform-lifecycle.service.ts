import { Injectable, Logger } from '@nestjs/common';
import {
  ComponentType,
  LifecyclePhase,
  RegisterComponentDto,
} from '../dto/platform-lifecycle.dto';
import { LifecycleAuditService } from './lifecycle-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ComponentRecord {
  componentId: string;
  name: string;
  type: ComponentType;
  version: string;
  phase: LifecyclePhase;
  registeredAt: string;
  metadata: Record<string, any>;
}

/**
 * PlatformLifecycleService — Gestão do Ciclo de Vida (P162 EPLM)
 *
 * Controla o inventário completo de componentes da Plataforma Aura:
 * microsserviços, bibliotecas, frameworks, bancos, pipelines e modelos de IA.
 */
@Injectable()
export class PlatformLifecycleService {
  private readonly logger = new Logger(PlatformLifecycleService.name);
  private componentRegistry: Map<string, ComponentRecord> = new Map();
  private readonly SYSTEM_TENANT = 'SYSTEM';

  constructor(
    private readonly audit: LifecycleAuditService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedComponents();
  }

  private seedComponents(): void {
    const seeds: RegisterComponentDto[] = [
      { name: 'mission-intelligence', type: ComponentType.MICROSERVICE, version: '1.0.0', phase: LifecyclePhase.PRODUCTION, metadata: { prompt: 'P160' } },
      { name: 'governance-compliance', type: ComponentType.MICROSERVICE, version: '1.0.0', phase: LifecyclePhase.PRODUCTION, metadata: { prompt: 'P161' } },
      { name: '@nestjs/core', type: ComponentType.FRAMEWORK, version: '10.3.2', phase: LifecyclePhase.PRODUCTION, metadata: { vendor: 'NestJS' } },
      { name: 'kafka-broker', type: ComponentType.INFRASTRUCTURE, version: '3.6.0', phase: LifecyclePhase.PRODUCTION, metadata: { provider: 'Apache Kafka' } },
      { name: 'postgresql', type: ComponentType.DATABASE, version: '15.4', phase: LifecyclePhase.PRODUCTION, metadata: { provider: 'PostgreSQL Global Dev Group' } },
    ];

    for (const dto of seeds) {
      const id = `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      this.componentRegistry.set(id, {
        componentId: id,
        name: dto.name,
        type: dto.type,
        version: dto.version,
        phase: dto.phase ?? LifecyclePhase.PRODUCTION,
        registeredAt: new Date().toISOString(),
        metadata: dto.metadata ?? {},
      });
    }
  }

  async registerComponent(dto: RegisterComponentDto): Promise<ComponentRecord> {
    const componentId = `COMP-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const record: ComponentRecord = {
      componentId,
      name: dto.name,
      type: dto.type,
      version: dto.version,
      phase: dto.phase ?? LifecyclePhase.DEVELOPMENT,
      registeredAt: new Date().toISOString(),
      metadata: dto.metadata ?? {},
    };

    this.componentRegistry.set(componentId, record);

    await this.audit.record('REGISTER_COMPONENT', dto.name, 'CEA', { version: dto.version, type: dto.type });

    await this.eventBus.publish(
      'aura.lifecycle.version.released.v1',
      { componentId, name: dto.name, version: dto.version, phase: record.phase },
      this.SYSTEM_TENANT,
      { subject: componentId },
    );

    this.logger.log(`[PlatformLifecycle] Registered: ${dto.name} v${dto.version} (${record.phase})`);
    return record;
  }

  listComponents(phase?: LifecyclePhase, type?: ComponentType): ComponentRecord[] {
    return Array.from(this.componentRegistry.values()).filter(
      (c) => (!phase || c.phase === phase) && (!type || c.type === type),
    );
  }

  async deprecateComponent(componentId: string, reason: string): Promise<ComponentRecord | null> {
    const component = this.componentRegistry.get(componentId);
    if (!component) return null;

    component.phase = LifecyclePhase.DEPRECATED;
    this.componentRegistry.set(componentId, component);

    await this.audit.record('DEPRECATE_COMPONENT', component.name, 'CEA', { reason });

    await this.eventBus.publish(
      'aura.lifecycle.component.deprecated.v1',
      { componentId, name: component.name, reason },
      this.SYSTEM_TENANT,
      { subject: componentId },
    );

    return component;
  }
}
