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
import { RegistrationService } from '../services/registration.service';
import { DynamicFormsEngine } from '../engines/dynamic-forms.engine';
import { EligibilityEngine } from '../engines/eligibility.engine';
import { RiskClassificationService } from '../services/risk-classification.service';
import { ConsentManagementService } from '../services/consent-management.service';
import { ResponsibleGuardianService } from '../services/responsible-guardian.service';
import {
  StartRegistrationDto,
  SubmitRegistrationDto,
  EvaluateEligibilityDto,
  ClassifyRiskDto,
  GrantConsentDto,
  LinkGuardianDto,
  TargetProfileType,
} from '../dto/registration.dto';

/**
 * RegistrationController — Endpoints REST da Plataforma de Cadastro Adaptativo (AAIRP)
 *
 * Expõe APIs para cadastro inteligente, formulários dinâmicos, questionários adaptativos,
 * elegibilidade, matriz de risco, consentimentos LGPD e vínculo de responsáveis legais.
 *
 * Referências: P110 (AEWBPM), P125 (AEAP), P133 (AAIRP Etapa 11)
 */
@ApiTags('Registration')
@Controller({ path: 'registration', version: '1' })
export class RegistrationController {
  constructor(
    private readonly registrationService: RegistrationService,
    private readonly dynamicFormsEngine: DynamicFormsEngine,
    private readonly eligibilityEngine: EligibilityEngine,
    private readonly riskService: RiskClassificationService,
    private readonly consentService: ConsentManagementService,
    private readonly guardianService: ResponsibleGuardianService,
  ) {}

  @Public()
  @Post('start')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar Novo Cadastro Adaptativo',
    description: 'Cria uma sessão de cadastro adaptativo e retorna o schema do formulário dinâmico correspondente ao perfil.',
  })
  async startRegistration(@Body() dto: StartRegistrationDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.registrationService.startRegistration(dto, tenantId);
    return BaseResponseDto.created(result, requestId, 'Sessão de cadastro iniciada.');
  }

  @Public()
  @Post('step')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar Respostas de Etapa do Cadastro (Questionário Adaptativo)' })
  async submitStep(@Body() dto: SubmitRegistrationDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.registrationService.submitStep(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Respostas registradas.');
  }

  @Public()
  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalizar Cadastro Adaptativo e Executar Avaliações' })
  async completeRegistration(@Param('id') registrationId: string, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.registrationService.completeRegistration(registrationId, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Cadastro concluído com sucesso.');
  }

  @Public()
  @Get('forms/schema/:profileType')
  @ApiOperation({ summary: 'Obter Schema de Formulário Dinâmico por Perfil' })
  getFormSchema(@Param('profileType') profileType: TargetProfileType, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const schema = this.dynamicFormsEngine.getFormSchema(profileType);
    return BaseResponseDto.ok(schema, requestId);
  }

  @Public()
  @Post('eligibility/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avaliação de Elegibilidade Social e Clínica' })
  evaluateEligibility(@Body() dto: EvaluateEligibilityDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const result = this.eligibilityEngine.evaluate(dto);
    return BaseResponseDto.ok(result, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.PROFESSIONAL)
  @ApiBearerAuth('access-token')
  @Post('risk/classify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Classificação Multidimensional de Risco (Profissional/Admin)' })
  async classifyRisk(@Body() dto: ClassifyRiskDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.riskService.classifyRisk(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Matriz de risco gerada.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('consent/grant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Registrar Aceite de Termo de Consentimento LGPD' })
  async grantConsent(@Body() dto: GrantConsentDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.consentService.grantConsent(dto, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Consentimento LGPD registrado.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('guardian/link')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular Responsável Legal a Dependente' })
  async linkGuardian(@Body() dto: LinkGuardianDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.guardianService.linkGuardian(dto, tenantId);
    return BaseResponseDto.created(result, requestId, 'Vínculo de responsável legal registrado.');
  }
}
