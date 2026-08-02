import { Injectable, Logger } from '@nestjs/common';
import { DataContractsService } from './data-contracts.service';
import { DataQualityService } from './data-quality.service';
import { DataGovernanceAuditService } from './data-governance-audit.service';
import { EventBusService } from '../../../events/event-bus.service';
import { DataDomain } from '../dto/enterprise-data.dto';

export interface DataOpsPipelineRun {
  runId: string;
  pipelineName: string;
  domain: DataDomain;
  contractId: string;
  status: 'SUCCESS' | 'VALIDATION_FAILED' | 'RUNNING';
  validationErrors: string[];
  recordsProcessed: number;
  executedAt: string;
}

/**
 * DataOpsService — P172 EDGP
 *
 * Pipelines DataOps com validação automática antes da publicação de dados.
 * Garante que qualquer dataset publicado passe por validação de contratos de dados (Data Contracts)
 * e verificação de regras de qualidade antes de ser consumido pela plataforma.
 */
@Injectable()
export class DataOpsService {
  private readonly logger = new Logger(DataOpsService.name);
  private readonly pipelineRuns: Map<string, DataOpsPipelineRun> = new Map();

  constructor(
    private readonly contractSvc: DataContractsService,
    private readonly qualitySvc: DataQualityService,
    private readonly auditSvc: DataGovernanceAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async runPipeline(
    pipelineName: string,
    domain: DataDomain,
    contractId: string,
    payloadBatch: any[],
    executedBy = 'DATAOPS_ENGINE',
  ): Promise<DataOpsPipelineRun> {
    const runId = `DOP-RUN-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const allErrors: string[] = [];

    // 1. Validar lote contra contrato de dados
    for (let i = 0; i < payloadBatch.length; i++) {
      const validation = this.contractSvc.validatePayloadAgainstContract(contractId, payloadBatch[i]);
      if (!validation.isValid) {
        allErrors.push(`Registro #${i + 1}: ${validation.errors.join('; ')}`);
      }
    }

    // 2. Avaliar score de qualidade do domínio
    const qualityReport = await this.qualitySvc.evaluateQuality(domain, 'DATAOPS');
    if (qualityReport.overallScore < 70) {
      allErrors.push(`Score de qualidade do domínio (${qualityReport.overallScore}/100) abaixo do limite mínimo DataOps (70).`);
    }

    const status = allErrors.length === 0 ? 'SUCCESS' : 'VALIDATION_FAILED';

    const run: DataOpsPipelineRun = {
      runId,
      pipelineName,
      domain,
      contractId,
      status,
      validationErrors: allErrors,
      recordsProcessed: payloadBatch.length,
      executedAt: now,
    };

    this.pipelineRuns.set(runId, run);

    await this.auditSvc.recordAudit('DATAOPS_PIPELINE_EXECUTED', runId, executedBy, {
      pipelineName,
      status,
      recordsProcessed: payloadBatch.length,
      errorsCount: allErrors.length,
    });

    if (status === 'SUCCESS') {
      this.logger.log(`[DataOps] Pipeline "${pipelineName}" executada com SUCESSO (${payloadBatch.length} registros).`);
    } else {
      this.logger.error(`[DataOps] Pipeline "${pipelineName}" FALHOU na validação DataOps! ${allErrors.length} erro(s).`);
    }

    return run;
  }

  getPipelineRun(runId: string): DataOpsPipelineRun | undefined {
    return this.pipelineRuns.get(runId);
  }

  listRuns(): DataOpsPipelineRun[] {
    return Array.from(this.pipelineRuns.values());
  }
}
