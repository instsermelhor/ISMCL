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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Public } from '../../../shared/decorators/public.decorator';
import { AuthenticationService } from '../services/authentication.service';
import { IdentityService } from '../services/identity.service';
import { SessionManagementService } from '../services/session-management.service';
import { MfaService } from '../services/mfa.service';
import { PolicyEngine } from '../policies/policy.engine';
import {
  LoginDto,
  RegisterUserDto,
  RefreshTokenDto,
  VerifyMfaDto,
  EvaluatePolicyDto,
} from '../dto/auth.dto';
import { BaseResponseDto } from '../../../shared/dto/base-response.dto';
import { JwtAuthGuard, AuraJwtPayload } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../shared/guards/roles.guard';
import { Roles, AuraRole } from '../../../shared/decorators/roles.decorator';

/**
 * AuthController — Endpoints REST de Autenticação, IAM e Controle de Sessão
 *
 * Implementa OAuth 2.1, OIDC, MFA, Registro de Usuário e Avaliação de Políticas Zero Trust.
 *
 * Referências: P107 (AEIATP), P125 (AEAP), P132 (AIFI Etapa 11)
 */
@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthenticationService,
    private readonly identityService: IdentityService,
    private readonly sessionService: SessionManagementService,
    private readonly mfaService: MfaService,
    private readonly policyEngine: PolicyEngine,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Autenticação de Usuário (OAuth 2.1 / Password Flow)',
    description: 'Valida as credenciais, executa checagem adaptativa de MFA e retorna os tokens JWT.',
  })
  @ApiResponse({ status: 200, description: 'Autenticação bem-sucedida ou solicitação de MFA' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const ipAddress = req.ip ?? '127.0.0.1';
    const userAgent = req.headers['user-agent'] ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.authService.login(dto, ipAddress, userAgent, tenantId);
    return BaseResponseDto.ok(result, requestId, undefined, 'Operação de autenticação concluída.');
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cadastro Único Institucional',
    description: 'Registra uma nova identidade digital com garantia de unicidade de CPF e E-mail.',
  })
  @ApiResponse({ status: 201, description: 'Identidade registrada com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail ou CPF já cadastrado' })
  async register(@Body() dto: RegisterUserDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const result = await this.identityService.registerUser(dto, tenantId);
    return BaseResponseDto.created(result, requestId, 'Identidade criada com sucesso.');
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovação de Access Token via Refresh Token' })
  async refresh(@Body() dto: RefreshTokenDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const tokens = await this.authService.refreshToken(dto.refreshToken, tenantId);
    return BaseResponseDto.ok(tokens, requestId, undefined, 'Tokens renovados com sucesso.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout Individual de Sessão' })
  async logout(@Req() req: FastifyRequest & { user: AuraJwtPayload }) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const sessionId = (req.user as AuraJwtPayload & { sessionId?: string })?.sessionId;

    if (sessionId) {
      await this.sessionService.revokeSession(sessionId);
    }

    return BaseResponseDto.ok({ loggedOut: true }, requestId, undefined, 'Sessão encerrada.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('logout-global')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout Global (Revoga todas as sessões ativas do usuário)' })
  async logoutGlobal(@Req() req: FastifyRequest & { user: AuraJwtPayload }) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const userId = req.user.sub;

    const count = await this.sessionService.revokeAllUserSessions(userId);
    return BaseResponseDto.ok(
      { revokedSessionsCount: count },
      requestId,
      undefined,
      `Logout global executado. ${count} sessões foram revogadas.`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Get('mfa/setup')
  @ApiOperation({ summary: 'Geração de Segredo TOTP / QR-Code para Configuração de MFA' })
  async setupMfa(@Req() req: FastifyRequest & { user: AuraJwtPayload }) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const result = this.mfaService.generateMfaSetup(req.user.email);
    return BaseResponseDto.ok(result, requestId, undefined, 'Configuração MFA gerada.');
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validação de Token MFA TOTP' })
  async verifyMfa(
    @Body() dto: VerifyMfaDto,
    @Req() req: FastifyRequest & { user: AuraJwtPayload },
  ) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const user = await this.identityService.findById(req.user.sub);

    const isValid = this.mfaService.verifyTotp(user.mfaSecret ?? '', dto.code);
    return BaseResponseDto.ok({ valid: isValid }, requestId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AuraRole.SUPER_ADMIN, AuraRole.ADMIN, AuraRole.AUDITOR)
  @ApiBearerAuth('access-token')
  @Post('policies/evaluate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avaliação de Políticas Zero Trust via Policy Engine (Admin/Auditor)' })
  async evaluatePolicy(@Body() dto: EvaluatePolicyDto, @Req() req: FastifyRequest) {
    const requestId = (req as FastifyRequest & { requestId?: string }).requestId ?? 'unknown';
    const tenantId = (req.headers['x-tenant-id'] as string) ?? 'default';

    const decision = this.policyEngine.evaluate(
      {
        id: dto.userId,
        tenantId,
        roles: [AuraRole.PROFESSIONAL],
        permissions: ['medical_record:read'],
      },
      {
        id: dto.resource,
        type: 'medical_record',
        tenantId,
        classification: 'RESTRICTED',
      },
      dto.action,
      {
        ipAddress: req.ip ?? '127.0.0.1',
        userAgent: req.headers['user-agent'] ?? 'unknown',
        isTrustedDevice: true,
        requestTime: new Date(),
        riskScore: 10,
        mfaVerified: true,
      },
    );

    return BaseResponseDto.ok(decision, requestId, undefined, 'Avaliação de política concluída.');
  }
}
