import { Injectable, Logger } from '@nestjs/common';
import { AIAuditService } from './ai-audit.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface ModelOpsDeployment {
  deploymentId: string;
  assetId: string;
  version: string;
  stage: 'TRAINING' | 'VALIDATION' | 'STAGING' | 'PRODUCTION' | 'ROLLBACK' | 'ARCHIVED';
  metrics: { accuracy: number; latencyMs: number; throughputRps: number };
  deployedAt: string;
  deployedBy: string;
}

@Injectable()
export class ModelOpsService {
  private readonly logger = new Logger(ModelOpsService.name);
  private readonly deployments: Map<string, ModelOpsDeployment> = new Map();

  constructor(
    private readonly auditSvc: AIAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async deploy(assetId: string, version: string, stage: ModelOpsDeployment['stage'], deployedBy: string): Promise<ModelOpsDeployment> {
    const deploymentId = `DEPLOY-${assetId}-${stage}-${Date.now().toString(36).toUpperCase()}`;
    const deployment: ModelOpsDeployment = {
      deploymentId, assetId, version, stage,
      metrics: { accuracy: 0.96, latencyMs: 45, throughputRps: 120 },
      deployedAt: new Date().toISOString(), deployedBy,
    };
    this.deployments.set(deploymentId, deployment);
    await this.auditSvc.recordAudit('MODEL_DEPLOYED', deploymentId, deployedBy, { assetId, version, stage });
    this.logger.log(`[ModelOps] Deploy ${assetId} v${version} → ${stage} (${deploymentId})`);
    return deployment;
  }

  async rollback(deploymentId: string, rolledBackBy: string): Promise<ModelOpsDeployment> {
    const d = this.deployments.get(deploymentId);
    if (!d) throw new Error(`Deployment "${deploymentId}" não encontrado.`);
    d.stage = 'ROLLBACK';
    await this.auditSvc.recordAudit('MODEL_ROLLBACK', deploymentId, rolledBackBy, { assetId: d.assetId });
    this.logger.warn(`[ModelOps] ⚠️ Rollback executado: ${deploymentId}`);
    return d;
  }

  getDeployment(deploymentId: string): ModelOpsDeployment | undefined { return this.deployments.get(deploymentId); }

  listDeployments(assetId?: string): ModelOpsDeployment[] {
    const all = Array.from(this.deployments.values());
    return assetId ? all.filter((d) => d.assetId === assetId) : all;
  }
}
