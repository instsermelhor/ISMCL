import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { ProductionReadinessService } from '../services/production-readiness.service';
import { GoLiveManagementService } from '../services/golive-management.service';
import {
  RunReadinessChecklistDto,
  IssueCertificationDto,
  ScheduleGoLiveDto,
  GrantExecutiveApprovalDto,
} from '../dto/production-readiness.dto';

/**
 * ProductionReadinessController — APIs REST do Programa de Production Readiness & Go-Live (APRCG)
 *
 * Expõe endpoints para o Programa Oficial de Homologação e Go-Live: Checklist de Produção,
 * Enterprise Certification, Agendamento de Go-Live, Aprovações Executivas das 6 autoridades,
 * Smoke Tests pós-implantação e Rollback Engine.
 *
 * Referências: P149 APRCG Etapa 11, OpenAPI 3.1, LGPD, MCSI
 */
@ApiTags('Production Readiness, Go-Live & Enterprise Certification (APRCG)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'production-readiness', version: '1' })
export class ProductionReadinessController {
  constructor(
    private readonly readinessService: ProductionReadinessService,
    private readonly goLiveService: GoLiveManagementService,
  ) {}

  // ── Production Readiness Checklist ──────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('checklist/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Checklist Completo de Production Readiness (12 Categorias)' })
  async runChecklist(
    @Body() dto: RunReadinessChecklistDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.readinessService.runReadinessChecklist(dto.targetDomain, tenantId);
    return BaseResponseDto.ok(report, requestId, undefined, `Checklist concluído: ${report.overallStatus}`);
  }

  // ── Enterprise Certification ──────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('certifications')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir Certificado Corporativo de Domínio (CERT-2026-XXXXX) com Assinatura SHA-256' })
  async issueCertification(
    @Body() dto: IssueCertificationDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const cert = await this.readinessService.issueCertification(dto, tenantId);
    return BaseResponseDto.created(cert, requestId, `Certificado ${cert.certCode} emitido para ${cert.domainName} [${cert.verdict}].`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('certifications')
  @ApiOperation({ summary: 'Listar Catálogo de Certificações Corporativas Emitidas' })
  async listCertifications(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.readinessService.listCertifications(), requestId);
  }

  // ── Go-Live Management ────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('go-live/schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agendar Go-Live com Janela de Implantação e Plano de Rollback' })
  async scheduleGoLive(
    @Body() dto: ScheduleGoLiveDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.goLiveService.scheduleGoLive(dto, tenantId);
    return BaseResponseDto.created(record, requestId, `Go-Live "${dto.releaseName}" agendado para ${dto.scheduledAt}.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('go-live')
  @ApiOperation({ summary: 'Listar Catálogo de Go-Lives Agendados e Executados' })
  async listGoLives(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.goLiveService.listGoLives(), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('go-live/:goLiveId')
  @ApiOperation({ summary: 'Consultar Status e Aprovações de um Go-Live Específico' })
  async getGoLive(@Param('goLiveId') goLiveId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.goLiveService.getGoLive(goLiveId), requestId);
  }

  // ── Executive Approvals ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('go-live/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conceder Aprovação Executiva Formal (SHA-256) — Diretoria, CISO, Architect, Compliance, Ops, Audit' })
  async grantApproval(
    @Body() dto: GrantExecutiveApprovalDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const approval = await this.goLiveService.grantExecutiveApproval(dto, tenantId);
    return BaseResponseDto.ok(approval, requestId, undefined, `Aprovação concedida por ${dto.authority} — ${dto.approverName}.`);
  }

  // ── Deployment Validation ─────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('go-live/:goLiveId/validate-deployment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Smoke Tests Automatizados Pós-Implantação (10 Verificações de Sistema)' })
  async validateDeployment(
    @Param('goLiveId') goLiveId: string,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const result = await this.goLiveService.runDeploymentValidation(goLiveId, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, result.allSystemsOperational ? '✅ Todos os sistemas operacionais.' : '⚠️ Atenção: Verificações com falha.');
  }

  // ── Rollback Engine ───────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('go-live/:goLiveId/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Rollback Emergencial do Go-Live com Registro Auditável' })
  async executeRollback(
    @Param('goLiveId') goLiveId: string,
    @Body('reason') reason: string,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const result = await this.goLiveService.executeRollback(goLiveId, reason, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, result.message);
  }
}
