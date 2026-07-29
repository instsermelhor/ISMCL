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
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { DigitalPrescriptionService } from '../services/digital-prescription.service';
import { TemplateManagementService } from '../services/template-management.service';
import { DocumentDeliveryService } from '../services/document-delivery.service';
import {
  CreatePrescriptionDto,
  SignDocumentDto,
  ValidateDocumentDto,
  DeliverDocumentDto,
  CreateTemplateDto,
} from '../dto/documents.dto';

/**
 * DocumentsController — APIs REST do Módulo de Prescrição Digital e Documentos Clínicos
 *
 * Expõe endpoints para emissão de documentos/prescrições, assinatura eletrônica,
 * validação de integridade, templates corporativos e distribuição segura.
 *
 * Referências: CFM 2.299/2021, CFP 15/2021, P138 ADPCDT Etapa 12
 */
@ApiTags('Digital Prescriptions & Clinical Documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'documents', version: '1' })
export class DocumentsController {
  constructor(
    private readonly prescriptionService: DigitalPrescriptionService,
    private readonly templateService: TemplateManagementService,
    private readonly deliveryService: DocumentDeliveryService,
  ) {}

  // ── Emissão ─────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emitir Documento Clínico ou Prescrição Digital (DOC-YYYY-XXXXX)' })
  async issue(
    @Body() dto: CreatePrescriptionDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const doc = await this.prescriptionService.issue(
      dto,
      req.user.sub,
      req.user.name,
      req.user.roles[0] ?? 'PROFESSIONAL',
      tenantId,
    );

    return BaseResponseDto.created(doc, requestId, `Documento ${doc.documentCode} emitido e aguardando assinatura.`);
  }

  // ── Assinatura ───────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Post('sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assinar Eletronicamente um Documento Clínico (SHA-256 + TSA)' })
  async sign(
    @Body() dto: SignDocumentDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const doc = await this.prescriptionService.sign(
      dto,
      req.user.sub,
      req.user.name,
      req.user.roles[0] ?? 'PROFESSIONAL',
      tenantId,
    );

    const msg =
      doc.status === 'SIGNED'
        ? `Documento ${doc.documentCode} totalmente assinado e carimbado (TSA).`
        : `Assinatura parcial registrada (${doc.signatures.length}/${doc.signatories.length}).`;

    return BaseResponseDto.ok(doc, requestId, undefined, msg);
  }

  // ── Validação ────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar Integridade e Autenticidade de Documento (SHA-256 + TSA)' })
  async validate(@Body() dto: ValidateDocumentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const report = await this.prescriptionService.validate(dto.documentId, tenantId);
    return BaseResponseDto.ok(report, requestId);
  }

  // ── Consulta ─────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get('beneficiary/:id')
  @ApiOperation({ summary: 'Listar todos os Documentos do Beneficiário' })
  async getByBeneficiary(@Param('id') beneficiaryId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.prescriptionService.findByBeneficiary(beneficiaryId), requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get(':id')
  @ApiOperation({ summary: 'Obter Documento Clínico por ID' })
  async getById(@Param('id') documentId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.prescriptionService.findOrThrow(documentId), requestId);
  }

  // ── Entrega ──────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Post('deliver')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Distribuir Documento Assinado (Portal, E-mail, WhatsApp, Download)' })
  async deliver(@Body() dto: DeliverDocumentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';
    const record = await this.deliveryService.deliver(dto, tenantId);
    return BaseResponseDto.ok(record, requestId, undefined, 'Documento distribuído com rastreabilidade completa.');
  }

  // ── Templates ────────────────────────────────────────────────────────────

  @Roles(AuraRole.SUPER_ADMIN)
  @Post('templates')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Template de Documento Clínico [SUPER_ADMIN]' })
  async createTemplate(
    @Body() dto: CreateTemplateDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tpl = await this.templateService.create(dto, req.user.sub);
    return BaseResponseDto.created(tpl, requestId, 'Template criado e disponível para emissão.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get('templates')
  @ApiOperation({ summary: 'Listar Templates de Documentos Clínicos' })
  async listTemplates(@Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    return BaseResponseDto.ok(this.templateService.listAll(), requestId);
  }
}
