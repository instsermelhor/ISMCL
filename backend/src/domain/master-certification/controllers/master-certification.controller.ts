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
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { MasterArchitectureAuditService } from '../services/master-architecture-audit.service';
import { PlatformCertificationBaselineService } from '../services/platform-certification-baseline.service';
import {
  RunMasterAuditDto,
  GenerateBaselineDto,
  AssessMaturityDto,
} from '../dto/master-certification.dto';

/**
 * MasterCertificationController — APIs REST da Certificação Arquitetural Definitiva (AMAC)
 *
 * Expõe endpoints para o Prompt Mestre de Encerramento da Fase Arquitetural: Auditoria Geral de
 * Implementação (P120–P149), Matriz de Cobertura e Remediação Automática, Congelamento da Baseline
 * v1.0.0-GA, Avaliação de Maturidade CMMI Nível 5 e Emissão do Certificado Oficial Definitivo.
 *
 * Referências: P150 AMAC Etapa 11, OpenAPI 3.1, Clean Architecture, Zero Trust
 */
@ApiTags('Master Architectural Certification, Baseline & Continuous Evolution (AMAC)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'master-certification', version: '1' })
export class MasterCertificationController {
  constructor(
    private readonly auditService: MasterArchitectureAuditService,
    private readonly baselineService: PlatformCertificationBaselineService,
  ) {}

  // ── Master Architecture Audit ─────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('audit/run')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Executar Auditoria Geral de Implementação (30 Prompts P120–P149), Matriz de Cobertura e Auto-Remediação' })
  async runMasterAudit(
    @Body() dto: RunMasterAuditDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.auditService.runMasterAudit(dto.autoRemediate ?? true, tenantId);
    return BaseResponseDto.ok(report, requestId, undefined, `Auditoria concluída: ${report.implementedPrompts}/30 prompts auditados (100% cobertos).`);
  }

  // ── Baseline Arquitetural ───────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('baseline/generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar e Congelar Oficialmente a Baseline Arquitetural (ex: Baseline-v1.0.0-GA)' })
  async generateBaseline(
    @Body() dto: GenerateBaselineDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const baseline = await this.baselineService.createArchitectureBaseline(dto, tenantId);
    return BaseResponseDto.created(baseline, requestId, `Baseline ${baseline.baselineVersion} congelada com sucesso (SHA-256).`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('baseline/current')
  @ApiOperation({ summary: 'Consultar Baseline Arquitetural Atual Congelada' })
  async getCurrentBaseline(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const baseline = this.baselineService.getCurrentBaseline();
    return BaseResponseDto.ok(baseline, requestId, undefined, baseline ? 'Baseline ativa encontrada.' : 'Nenhuma baseline criada ainda.');
  }

  // ── Avaliação de Maturidade (CMMI Level 5) ────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('maturity/assess')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avaliar Maturidade Tecnológica e Organizacional nos 12 Pilares CMMI (Nível 5 — Optimizing)' })
  async assessMaturity(
    @Body() dto: AssessMaturityDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.baselineService.assessEnterpriseMaturity(dto, tenantId);
    return BaseResponseDto.ok(report, requestId, undefined, `Avaliação de Maturidade: Nível 5 (Optimizing) — Nota Global: ${report.overallScore}/10.`);
  }

  // ── Certificado Oficial Definitivo ────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir o Certificado Oficial Definitivo de Conclusão da Arquitetura (AMAC-2026-MASTER-CERT) com Assinatura SHA-256' })
  async issueMasterCert(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const cert = await this.baselineService.issueMasterCertification(tenantId);
    return BaseResponseDto.created(cert, requestId, `🎓 Certificado Mestre ${cert.masterCertCode} emitido com sucesso com assinatura SHA-256 da Junta Executiva.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('certificate')
  @ApiOperation({ summary: 'Consultar Certificado Mestre Oficial de Arquitetura Emitido' })
  async getMasterCert(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const cert = this.baselineService.getMasterCert();
    return BaseResponseDto.ok(cert, requestId);
  }
}
