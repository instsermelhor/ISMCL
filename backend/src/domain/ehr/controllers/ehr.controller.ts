import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { ElectronicHealthRecordService } from '../services/electronic-health-record.service';
import { ClinicalNotesService } from '../services/clinical-notes.service';
import { ClinicalTimelineService } from '../services/clinical-timeline.service';
import { FhirAdapter } from '../fhir/fhir.adapter';
import {
  CreateClinicalNoteDto,
  SignClinicalNoteDto,
  UpdateDraftClinicalNoteDto,
  BreakGlassEmergencyAccessDto,
  ClinicalSpecialtyCategory,
} from '../dto/ehr.dto';

/**
 * EhrController — APIs REST do Prontuário Eletrônico Integrado (AIEHSR)
 *
 * Expõe endpoints para prontuário longitudinal, evoluções SOAP, assinatura eletrônica,
 * linha do tempo clínica, exportação HL7 FHIR R4 e acesso emergencial Break Glass.
 *
 * Referências: P110 (AEWBPM), P125 (AEAP), P136 (AIEHSR Etapa 11)
 */
@ApiTags('EHR')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'ehr', version: '1' })
export class EhrController {
  constructor(
    private readonly ehrService: ElectronicHealthRecordService,
    private readonly notesService: ClinicalNotesService,
    private readonly timelineService: ClinicalTimelineService,
    private readonly fhirAdapter: FhirAdapter,
  ) {}

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get('beneficiary/:id')
  @ApiOperation({ summary: 'Obter ou Inicializar Prontuário Eletrônico do Beneficiário' })
  async getEhr(@Param('id') beneficiaryId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const ehr = await this.ehrService.getOrCreateEhr(beneficiaryId, tenantId);
    return BaseResponseDto.ok(ehr, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Post('notes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar Rascunho de Evolução Clínica/Psicológica/Social (SOAP)' })
  async createNote(
    @Body() dto: CreateClinicalNoteDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const note = await this.notesService.createNote(
      dto,
      req.user.sub,
      req.user.name,
      req.user.roles[0] ?? 'PROFESSIONAL',
      tenantId,
    );

    return BaseResponseDto.created(note, requestId, 'Rascunho de evolução registrado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Patch('notes/:id/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autosave / Salvar Rascunho de Evolução Clínica (GAP-P3-07)' })
  async saveDraft(
    @Param('id') noteId: string,
    @Body() dto: UpdateDraftClinicalNoteDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const note = await this.notesService.saveDraft(
      noteId,
      dto,
      req.user.sub,
      tenantId,
    );

    return BaseResponseDto.ok(note, requestId, undefined, 'Rascunho de evolução salvo com sucesso.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Patch('evolutions/:id/draft')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autosave / Salvar Rascunho de Evolução Clínica — Rota de Rascunho (GAP-P3-07)' })
  async saveEvolutionDraft(
    @Param('id') noteId: string,
    @Body() dto: UpdateDraftClinicalNoteDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    return this.saveDraft(noteId, dto, req);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Post('notes/sign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assinar Eletronicamente e Bloquear Evolução Clínica (SHA-256)' })
  async signNote(
    @Body() dto: SignClinicalNoteDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const note = await this.notesService.signNote(
      dto,
      req.user.sub,
      req.user.name,
      req.user.roles[0] ?? 'PROFESSIONAL',
      tenantId,
    );

    return BaseResponseDto.ok(note, requestId, undefined, 'Evolução assinada eletronicamente e bloqueada.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get(':id/timeline')
  @ApiOperation({ summary: 'Consultar Linha do Tempo Clínica com Filtros por Especialidade' })
  async getTimeline(
    @Param('id') ehrId: string,
    @Query('category') category?: ClinicalSpecialtyCategory,
    @Req() req?: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string })?.requestId ?? 'unknown';
    const timeline = await this.timelineService.getTimeline(ehrId, category);

    return BaseResponseDto.ok(timeline, requestId);
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @Get('fhir/patient/:id')
  @ApiOperation({ summary: 'Exportar Registro em Padrão Internacional HL7 FHIR R4 (Patient)' })
  async exportFhirPatient(@Param('id') beneficiaryId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const fhirResource = this.fhirAdapter.toFhirPatient({
      id: beneficiaryId,
      name: 'Maria das Dores Silva',
      cpf: '12345678901',
      email: 'maria.silva@sermelhor.org.br',
    });

    return BaseResponseDto.ok(fhirResource, requestId, undefined, 'Recurso HL7 FHIR R4 Patient gerado.');
  }

  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @Post('break-glass')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acesso Emergencial Break Glass (Exige justificativa e notifica o SOC)' })
  async breakGlass(
    @Body() dto: BreakGlassEmergencyAccessDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const log = await this.ehrService.executeBreakGlass(
      dto.ehrId,
      req.user.sub,
      dto.justification,
      tenantId,
    );

    return BaseResponseDto.ok(
      log,
      requestId,
      undefined,
      'Acesso emergencial Break Glass registrado e notificação emitida ao SOC.',
    );
  }
}
