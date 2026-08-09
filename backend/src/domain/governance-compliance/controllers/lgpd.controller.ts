import {
  Controller, Get, Post, Patch, Body, Param, Query,
  HttpCode, HttpStatus, VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LgpdConsentService } from '../services/lgpd-consent.service';

/**
 * LgpdController — API REST de Privacidade & Direitos do Titular (LGPD)
 *
 * Endpoints:
 * POST   /lgpd/consent              — Registrar consentimento
 * DELETE /lgpd/consent/:entityId    — Revogar consentimento (Art. 8, §5)
 * GET    /lgpd/consent/:entityId    — Consultar consentimento ativo (Art. 9)
 * POST   /lgpd/requests             — Abrir solicitação de direito (Art. 18)
 * GET    /lgpd/requests/:entityId   — Listar solicitações do titular
 * POST   /lgpd/anonymize            — Anonimizar dados pessoais (Art. 18, IV)
 * GET    /lgpd/check-consent        — Verificar consentimento por finalidade
 *
 * Referências: Lei 13.709/2018 (LGPD), P12
 */
@ApiTags('LGPD — Privacidade & Direitos do Titular')
@ApiBearerAuth()
@Controller({ path: 'lgpd', version: VERSION_NEUTRAL })
export class LgpdController {
  constructor(private readonly lgpdService: LgpdConsentService) {}

  // ─── Consentimento ──────────────────────────────────────────

  @Post('consent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar consentimento explícito do titular (LGPD Art. 7, I)' })
  @ApiResponse({ status: 201, description: 'Consentimento registrado com sucesso' })
  async grantConsent(@Body() body: {
    entityId: string;
    entityType: 'BENEFICIARY' | 'PROFESSIONAL' | 'USER' | 'VISITOR';
    purposes: string[];
    legalBasis: string;
    tenantId: string;
    ipAddress?: string;
    userAgent?: string;
    collectionChannel?: string;
    isMinor?: boolean;
    guardianId?: string;
  }) {
    return this.lgpdService.grantConsent(body);
  }

  @Patch('consent/:entityId/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revogar consentimento (LGPD Art. 8, §5)' })
  @ApiResponse({ status: 200, description: 'Consentimento revogado com sucesso' })
  async withdrawConsent(
    @Param('entityId') entityId: string,
    @Body() body: { entityType: string; tenantId: string; reason?: string },
  ) {
    return this.lgpdService.withdrawConsent({ entityId, ...body });
  }

  @Get('consent/:entityId')
  @ApiOperation({ summary: 'Consultar consentimento ativo do titular (LGPD Art. 9)' })
  @ApiResponse({ status: 200, description: 'Consentimento ativo retornado' })
  async getConsent(
    @Param('entityId') entityId: string,
    @Query('entityType') entityType: string,
  ) {
    return this.lgpdService.getActiveConsent(entityId, entityType ?? 'BENEFICIARY');
  }

  @Get('check-consent')
  @ApiOperation({ summary: 'Verificar se titular possui consentimento válido para uma finalidade' })
  async checkConsent(
    @Query('entityId') entityId: string,
    @Query('purpose') purpose: string,
  ) {
    const hasConsent = await this.lgpdService.hasValidConsent(entityId, purpose);
    return { entityId, purpose, hasConsent };
  }

  // ─── Direitos do Titular (Art. 18) ──────────────────────────

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Abrir solicitação de direito do titular (LGPD Art. 18)' })
  @ApiResponse({ status: 201, description: 'Solicitação criada — prazo legal: 15 dias úteis' })
  async createRequest(@Body() body: {
    entityId: string;
    entityType: string;
    tenantId: string;
    requestType: 'ACCESS' | 'PORTABILITY' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'OBJECTION';
    description?: string;
    requestedBy?: string;
    consentId?: string;
  }) {
    return this.lgpdService.createDataSubjectRequest(body);
  }

  @Get('requests/:entityId')
  @ApiOperation({ summary: 'Listar solicitações de direitos do titular' })
  async getRequests(
    @Param('entityId') entityId: string,
    @Query('tenantId') tenantId: string,
  ) {
    return this.lgpdService.getDataSubjectRequests(entityId, tenantId ?? 'default');
  }

  // ─── Anonimização (Art. 12 & Art. 18, IV) ───────────────────

  @Post('anonymize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Anonimizar / pseudonimizar dados pessoais (LGPD Art. 18, IV)' })
  @ApiResponse({ status: 200, description: 'Anonimização executada com sucesso' })
  async anonymize(@Body() body: {
    entityId: string;
    entityType: string;
    tenantId: string;
    requestId?: string;
    performedBy?: string;
    technique?: 'PSEUDONYMIZATION' | 'FULL_ERASURE';
  }) {
    return this.lgpdService.anonymizeEntity(body);
  }
}
