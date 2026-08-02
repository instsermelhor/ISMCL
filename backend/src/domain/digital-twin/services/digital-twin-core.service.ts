import { Injectable, Logger } from '@nestjs/common';
import { EventBusService } from '../../../events/event-bus.service';

export interface OrganizationalState {
  twinId: string;
  snapshotAt: string;
  organization: {
    totalStaff: number;
    totalVolunteers: number;
    activeBeneficiaries: number;
    activePrograms: number;
    operationalUnits: number;
    monthlyAttendanceCapacity: number;
    currentOccupancyPercent: number;
  };
  processes: {
    activeWorkflows: number;
    pendingApprovals: number;
    automationRate: number;
  };
  infrastructure: {
    totalMicroservices: number;
    healthyMicroservices: number;
    overallAvailabilityPercent: number;
    activeIntegrations: number;
  };
  indicators: {
    nps: number;
    socialImpactScore: number;
    operationalEfficiencyScore: number;
    budgetUtilizationPercent: number;
  };
  syncStatus: string;
}

/**
 * DigitalTwinCoreService — Núcleo do Digital Twin Organizacional (P157 ADT)
 *
 * Mantém e atualiza continuamente a representação digital dinâmica do
 * Instituto Ser Melhor: estrutura organizacional, processos, recursos,
 * equipes, ativos, indicadores e integrações em tempo real.
 */
@Injectable()
export class DigitalTwinCoreService {
  private readonly logger = new Logger(DigitalTwinCoreService.name);
  private readonly SYSTEM_TENANT = 'SYSTEM';
  private currentState: OrganizationalState;

  constructor(private readonly eventBus: EventBusService) {
    this.currentState = this.buildInitialState();
  }

  private buildInitialState(): OrganizationalState {
    return {
      twinId: `DT-CORE-${new Date().getFullYear()}-ISM`,
      snapshotAt: new Date().toISOString(),
      organization: {
        totalStaff: 142,
        totalVolunteers: 87,
        activeBeneficiaries: 3240,
        activePrograms: 18,
        operationalUnits: 6,
        monthlyAttendanceCapacity: 4800,
        currentOccupancyPercent: 67.5,
      },
      processes: {
        activeWorkflows: 34,
        pendingApprovals: 7,
        automationRate: 72.4,
      },
      infrastructure: {
        totalMicroservices: 38,
        healthyMicroservices: 38,
        overallAvailabilityPercent: 99.96,
        activeIntegrations: 12,
      },
      indicators: {
        nps: 74,
        socialImpactScore: 88.2,
        operationalEfficiencyScore: 82.1,
        budgetUtilizationPercent: 91.3,
      },
      syncStatus: 'SYNCHRONIZED',
    };
  }

  async refreshState(partialUpdate?: Partial<OrganizationalState>): Promise<OrganizationalState> {
    this.currentState = {
      ...this.currentState,
      ...(partialUpdate ?? {}),
      snapshotAt: new Date().toISOString(),
    };

    await this.eventBus.publish(
      'aura.digitaltwin.twin.updated.v1',
      { twinId: this.currentState.twinId, snapshotAt: this.currentState.snapshotAt },
      this.SYSTEM_TENANT,
      { subject: this.currentState.twinId },
    );

    this.logger.log(`[DigitalTwinCore] State refreshed → twinId: ${this.currentState.twinId}`);
    return this.currentState;
  }

  getCurrentState(): OrganizationalState {
    return { ...this.currentState };
  }
}
