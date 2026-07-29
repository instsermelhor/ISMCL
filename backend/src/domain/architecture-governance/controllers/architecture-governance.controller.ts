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
import { ArchitectureRepositoryService } from '../services/architecture-repository.service';
import { DigitalTwinComplianceService } from '../services/digital-twin-compliance.service';
import {
  CreateAdrDto,
  AssessComplianceDto,
  RegisterTechnicalDebtDto,
} from '../dto/architecture-governance.dto';

/**
 * ArchitectureGovernanceController — APIs REST da Governança Arquitetural, Digital Twin e ADR Engine (AEAGO)
 *
 * Expõe endpoints para o Architecture Governance Office (AGO): Repositório central de arquitetura,
 * gestão de Architecture Decision Records (ADRs), espelhamento do Digital Twin, auditoria de conformidade
 * e gestão da dívida técnica.
 *
 * Referências: P148 AEAGO Etapa 11, OpenAPI 3.1, LGPD, MCSI
 */
@ApiTags('Enterprise Architecture Governance & Digital Twin (AEAGO)')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'architecture', version: '1' })
export class ArchitectureGovernanceController {
  constructor(
    private readonly repositoryService: ArchitectureRepositoryService,
    private readonly complianceService: DigitalTwinComplianceService,
  ) {}

  // ── Enterprise Architecture Repository ──────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('inventory')
  @ApiOperation({ summary: 'Consultar Inventário Vivo da Arquitetura Corporativa (28 Domínios)' })
  async getInventory(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.repositoryService.listInventory(), requestId);
  }

  // ── ADR Engine ─────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('adrs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar e Homologar Nova Decisão Arquitetural (ADR-2026-XXXXX)' })
  async createAdr(
    @Body() dto: CreateAdrDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const adr = await this.repositoryService.createAdr(dto, tenantId);
    return BaseResponseDto.created(adr, requestId, `ADR ${adr.adrCode} registrada com assinatura digital SHA-256.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR, AuraRole.PROFESSIONAL)
  @Get('adrs')
  @ApiOperation({ summary: 'Listar Catálogo Oficial de Architecture Decision Records (ADRs)' })
  async listAdrs(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.repositoryService.listAdrs(), requestId);
  }

  // ── Digital Twin & Compliance ──────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('digital-twin')
  @ApiOperation({ summary: 'Obter Estado em Tempo Real do Digital Twin Arquitetural' })
  async getDigitalTwin(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const twin = await this.complianceService.getDigitalTwinState(tenantId);
    return BaseResponseDto.ok(twin, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('compliance/audit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submeter Auditoria Contínua de Conformidade Arquitetural (Clean Architecture / DDD)' })
  async auditCompliance(
    @Body() dto: AssessComplianceDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.complianceService.auditCompliance(dto, tenantId);
    return BaseResponseDto.ok(report, requestId, undefined, `Auditoria concluída em ${report.moduleName}. Score: ${report.scorePercentage}%.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('compliance/reports')
  @ApiOperation({ summary: 'Listar Relatórios de Auditoria de Conformidade Arquitetural' })
  async listComplianceReports(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.complianceService.listAuditReports(), requestId);
  }

  // ── Technical Debt ─────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN)
  @Post('technical-debt')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar Dívida Técnica no Catálogo da Governança' })
  async registerTechnicalDebt(
    @Body() dto: RegisterTechnicalDebtDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const debt = await this.repositoryService.registerTechnicalDebt(dto, tenantId);
    return BaseResponseDto.created(debt, requestId, `Dívida Técnica registrada em ${debt.affectedModule}. Gravidade: ${debt.severity}.`);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.COORDINATOR)
  @Get('technical-debt')
  @ApiOperation({ summary: 'Listar Dívidas Técnicas Catalogadas e Estimativa de Remediação' })
  async listTechnicalDebts(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.repositoryService.listTechnicalDebts(), requestId);
  }
}
