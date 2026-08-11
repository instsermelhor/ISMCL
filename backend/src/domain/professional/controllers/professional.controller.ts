import {
  Controller,
  Get,
  Patch,
  Query,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { ProfessionalService } from '../services/professional.service';
import {
  ProfessionalSearchDto,
  UpdateProfessionalDto,
} from '../dto/professional.dto';

/**
 * ProfessionalController — APIs REST para Gestão de Profissionais
 *
 * Expõe busca, consulta de perfil, atualização de dados e consulta
 * de disponibilidade para agendamentos e teleconsultas (ACTG).
 *
 * Referências: PRD-AURA-001, REMEDIATION-AURA-001 (R2-04), GAP-P2-04
 */
@ApiTags('Professional Management Domain')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'professionals', version: '1' })
export class ProfessionalController {
  constructor(private readonly professionalService: ProfessionalService) {}

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.DIRECTOR,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
    AuraRole.PROFESSIONAL,
    AuraRole.STAFF,
  )
  @Get()
  @ApiOperation({ summary: 'Buscar Profissionais (Paginado com Filtros)' })
  async search(@Query() dto: ProfessionalSearchDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.professionalService.search(dto, tenantId);

    return BaseResponseDto.paginated(
      result.data,
      requestId,
      result.page,
      result.limit,
      result.total,
    );
  }

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.DIRECTOR,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
    AuraRole.PROFESSIONAL,
    AuraRole.STAFF,
  )
  @Get(':id')
  @ApiOperation({ summary: 'Obter Perfil do Profissional por ID' })
  @ApiParam({ name: 'id', description: 'ID do profissional (UUID)' })
  async findById(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const data = await this.professionalService.findById(id);
    return BaseResponseDto.ok(data, requestId);
  }

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
    AuraRole.PROFESSIONAL,
  )
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar Perfil do Profissional' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  @ApiBody({ type: UpdateProfessionalDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionalDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'] ?? 'SYSTEM';

    const data = await this.professionalService.update(
      id,
      dto,
      user.sub,
      actorRole,
      user.name ?? user.email ?? user.sub,
      ipAddress,
      userAgent,
    );

    return BaseResponseDto.ok(data, requestId, undefined, 'Perfil do profissional atualizado.');
  }

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
    AuraRole.PROFESSIONAL,
    AuraRole.STAFF,
  )
  @Get(':id/availability')
  @ApiOperation({ summary: 'Consultar Horários de Disponibilidade para Agendamento' })
  @ApiParam({ name: 'id', description: 'ID do profissional' })
  async getAvailability(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const slots = await this.professionalService.getAvailability(id);
    return BaseResponseDto.ok(slots, requestId);
  }
}
