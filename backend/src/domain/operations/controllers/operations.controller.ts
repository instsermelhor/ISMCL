import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { CloudPlatformService } from '../services/cloud-platform.service';
import { DevSecOpsPipelineService } from '../services/devsecops-pipeline.service';
import { DisasterRecoveryService } from '../services/disaster-recovery.service';
import { FinOpsManagementService } from '../services/finops-management.service';
import {
  ScaleClusterDto,
  RotateSecretDto,
  TriggerPipelineDto,
  TriggerBackupDto,
} from '../dto/operations.dto';

/**
 * OperationsController — APIs REST de Cloud Native Platform, DevSecOps e Operações Corporativas (ACNPDREO)
 *
 * Expõe endpoints para Enterprise Operations Center (EOC), orquestração K8s,
 * rotação de segredos no Vault, pipelines GitOps, backups, testes de DR e FinOps.
 *
 * Referências: P143 ACNPDREO Etapa 13, OpenAPI 3.1
 */
@ApiTags('Cloud Native Platform, DevSecOps & Enterprise Operations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'operations', version: '1' })
export class OperationsController {
  constructor(
    private readonly cloudPlatform: CloudPlatformService,
    private readonly devSecOps: DevSecOpsPipelineService,
    private readonly drService: DisasterRecoveryService,
    private readonly finOps: FinOpsManagementService,
  ) {}

  // ── Enterprise Operations Center (EOC) ──────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('eoc')
  @ApiOperation({ summary: 'Visão Consolidada do Enterprise Operations Center (EOC)' })
  async getEocDashboard(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const workloads = this.cloudPlatform.listWorkloads();
    const secrets = this.cloudPlatform.listSecrets();
    const finOpsSummary = await this.finOps.getFinOpsSummary();

    const eoc = {
      title: 'Enterprise Operations Center (EOC) — Plataforma Aura',
      clusterStatus: 'HEALTHY',
      activeWorkloadsCount: workloads.length,
      managedSecretsCount: secrets.length,
      workloads,
      finOpsSummary,
      generatedAt: new Date().toISOString(),
    };

    return BaseResponseDto.ok(eoc, requestId);
  }

  // ── Kubernetes Workloads ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('workloads')
  @ApiOperation({ summary: 'Listar Workloads Kubernetes (Deployments, Réplicas, CPU, Memória)' })
  async listWorkloads(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.cloudPlatform.listWorkloads(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('scale')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Escalonar réplicas de Workload Kubernetes (HPA) [SUPER_ADMIN]' })
  async scaleWorkload(@Body() dto: ScaleClusterDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const workload = await this.cloudPlatform.scaleWorkload(dto, tenantId);
    return BaseResponseDto.ok(workload, requestId, undefined, `Workload ${dto.deploymentName} escalonado para ${dto.replicas} réplicas.`);
  }

  // ── Secret Vault & Rotação ─────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Get('secrets')
  @ApiOperation({ summary: 'Listar Segredos Gerenciados no Secret Vault [SUPER_ADMIN]' })
  async listSecrets(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.cloudPlatform.listSecrets(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('secrets/rotate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotacionar Segredo no Secret Vault [SUPER_ADMIN]' })
  async rotateSecret(@Body() dto: RotateSecretDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const secret = await this.cloudPlatform.rotateSecret(dto, tenantId);
    return BaseResponseDto.ok(secret, requestId, undefined, `Segredo ${dto.secretName} rotacionado (v${secret.version}).`);
  }

  // ── DevSecOps & Pipelines GitOps ───────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('pipelines/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Disparar Pipeline GitOps DevSecOps (Build, Test, SAST, Deploy)' })
  async triggerPipeline(@Body() dto: TriggerPipelineDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.devSecOps.triggerPipeline(dto, tenantId);
    return BaseResponseDto.ok(record, requestId, undefined, `Pipeline para ${dto.serviceName} concluído com sucesso.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Get('pipelines/history')
  @ApiOperation({ summary: 'Histórico de Deploys e Pipelines GitOps' })
  async getPipelineHistory(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.devSecOps.getHistory(), requestId);
  }

  // ── Backup & Disaster Recovery ─────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('backups/trigger')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Disparar Backup Corporativo' })
  async triggerBackup(@Body() dto: TriggerBackupDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const backup = await this.drService.triggerBackup(dto, tenantId);
    return BaseResponseDto.created(backup, requestId, `Backup ${backup.backupId} gerado com sucesso.`);
  }

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('dr/drill')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Simulação de Disaster Recovery (DR Drill / RPO / RTO) [SUPER_ADMIN]' })
  async runDrDrill(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const drill = await this.drService.runDrill(tenantId);
    return BaseResponseDto.ok(drill, requestId, undefined, 'Simulação de Failover de DR executada.');
  }

  // ── FinOps ─────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('finops')
  @ApiOperation({ summary: 'Consultar Resumo FinOps de Infraestrutura e Custos' })
  async getFinOpsSummary(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const summary = await this.finOps.getFinOpsSummary(tenantId);
    return BaseResponseDto.ok(summary, requestId);
  }
}
