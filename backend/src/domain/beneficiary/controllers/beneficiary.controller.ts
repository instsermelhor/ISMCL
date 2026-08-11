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
import { BeneficiaryService } from '../services/beneficiary.service';
import {
  BeneficiarySearchDto,
  UpdateBeneficiaryDto,
} from '../dto/beneficiary.dto';

/**
 * BeneficiaryController — APIs REST para Gestão Completa de Beneficiários
 *
 * Implementa consulta, detalhamento, atualização de cadastro e linha do tempo
 * com proteção MCSI Nível 4 (GAP-P1-01) integrada.
 *
 * Referências: PRD-AURA-001, REMEDIATION-AURA-001 (R2-04), GAP-P2-04
 */
@ApiTags('Beneficiary Management Domain')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('access-token')
@Controller({ path: 'beneficiaries', version: '1' })
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

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
  @ApiOperation({
    summary: 'Buscar Beneficiários [com filtro RLS MCSI Nível 4]',
    description:
      'Retorna lista paginada de beneficiários. Registros com MCSI Nível 4 são ocultados automaticamente para usuários sem papel elevado.',
  })
  async search(@Query() dto: BeneficiarySearchDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.beneficiaryService.search(dto, actorRole, tenantId);

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
  @ApiOperation({
    summary: 'Obter Detalhes do Beneficiário por ID [com proteção MCSI Nível 4]',
    description:
      'Retorna o perfil completo do beneficiário. Se for MCSI Nível 4 e o usuário não for autorizado, lança HTTP 404 (GAP-P1-01).',
  })
  @ApiParam({ name: 'id', description: 'ID único do beneficiário (UUID)' })
  async findById(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;

    const data = await this.beneficiaryService.findById(id, actorRole, user.sub);
    return BaseResponseDto.ok(data, requestId);
  }

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
  )
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar Dados do Beneficiário' })
  @ApiParam({ name: 'id', description: 'ID único do beneficiário' })
  @ApiBody({ type: UpdateBeneficiaryDto })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBeneficiaryDto,
    @Req() req: FastifyRequest,
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;
    const ipAddress = (req.headers['x-forwarded-for'] as string) ?? req.ip ?? '0.0.0.0';
    const userAgent = req.headers['user-agent'] ?? 'SYSTEM';

    const data = await this.beneficiaryService.update(
      id,
      dto,
      user.sub,
      actorRole,
      user.name ?? user.email ?? user.sub,
      ipAddress,
      userAgent,
    );

    return BaseResponseDto.ok(data, requestId, undefined, 'Cadastro do beneficiário atualizado.');
  }

  @Roles(
    AuraRole.SUPER_ADMIN,
    AuraRole.ADMIN,
    AuraRole.DIRECTOR,
    AuraRole.COORDINATOR,
    AuraRole.MANAGER,
    AuraRole.PROFESSIONAL,
  )
  @Get(':id/timeline')
  @ApiOperation({
    summary: 'Linha do Tempo Multidimensional do Beneficiário',
    description:
      'Agrega eventos históricos de casos, agendamentos e evoluções em ordem cronológica inversa.',
  })
  @ApiParam({ name: 'id', description: 'ID do beneficiário' })
  async getTimeline(@Param('id') id: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = (req as any).user as AuraJwtPayload;
    const actorRole = (user?.roles?.[0] ?? (user as any)?.role ?? 'STAFF') as string;

    const timeline = await this.beneficiaryService.getTimeline(id, actorRole, user.sub);
    return BaseResponseDto.ok(timeline, requestId);
  }
}
