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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Public } from '../../../shared/decorators/public.decorator';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { WelcomeService } from '../services/welcome.service';
import { CaseOpeningService } from '../services/case-opening.service';
import { InitialCarePlanService } from '../services/initial-care-plan.service';
import { CrisisDetectionEngine } from '../engines/crisis-detection.engine';
import {
  StartWelcomeDto,
  SubmitScreeningDto,
  TriggerCrisisProtocolDto,
} from '../dto/intake.dto';

/**
 * IntakeController — APIs REST do Acolhimento, Triagem e Admissão de Casos (AIWSP)
 *
 * Expõe endpoints para recepção digital, triagem multidisciplinar, detecção de crises,
 * abertura de casos e planos iniciais de atendimento.
 *
 * Referências: P110 (AEWBPM), P125 (AEAP), P134 (AIWSP Etapa 11)
 */
@ApiTags('Intake')
@Controller({ path: 'intake', version: '1' })
export class IntakeController {
  constructor(
    private readonly welcomeService: WelcomeService,
    private readonly caseService: CaseOpeningService,
    private readonly carePlanService: InitialCarePlanService,
    private readonly crisisEngine: CrisisDetectionEngine,
  ) {}

  @Public()
  @Post('welcome/start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar Recepção e Acolhimento Digital',
    description: 'Registra a demanda inicial trazida pelo beneficiário e gera a sessão de acolhimento.',
  })
  async startWelcome(@Body() dto: StartWelcomeDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.welcomeService.startWelcome(dto, tenantId);
    return BaseResponseDto.created(result, requestId, 'Sessão de acolhimento iniciada.');
  }

  @Public()
  @Post('screening/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Enviar Triagem Multidisciplinar e Processar Admissão',
    description: 'Executa detecção de crises, priorização SLA, abertura de caso assistencial e geração do plano inicial.',
  })
  async submitScreening(@Body() dto: SubmitScreeningDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.welcomeService.submitScreening(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Triagem e admissão de caso concluídas.');
  }

  @Public()
  @Post('crisis/trigger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acionamento Manual de Protocolo de Emergência / Crise' })
  async triggerCrisisProtocol(@Body() dto: TriggerCrisisProtocolDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.crisisEngine.evaluate(
      dto.intakeId,
      dto.details,
      dto.crisisTypes,
      tenantId,
    );

    return BaseResponseDto.ok(result, requestId, undefined, 'Protocolo de emergência acionado.');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @ApiBearerAuth('access-token')
  @Get('cases/:id')
  @ApiOperation({ summary: 'Consultar Detalhes e Linha do Tempo do Caso Assistencial' })
  async getCase(@Param('id') caseId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const assistentialCase = await this.caseService.getCaseById(caseId);

    return BaseResponseDto.ok(assistentialCase, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL, AuraRole.COORDINATOR)
  @ApiBearerAuth('access-token')
  @Get('cases/:id/care-plan')
  @ApiOperation({ summary: 'Consultar Plano Inicial de Atendimento do Caso' })
  async getCarePlan(@Param('id') caseId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const carePlan = await this.carePlanService.getCarePlanByCaseId(caseId);

    return BaseResponseDto.ok(carePlan, requestId);
  }
}
