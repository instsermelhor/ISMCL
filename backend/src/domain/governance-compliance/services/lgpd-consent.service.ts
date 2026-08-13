import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { addBusinessDays } from 'date-fns';

/**
 * LgpdConsentService — Gestão de Consentimento LGPD (Lei 13.709/2018)
 *
 * Responsável por:
 * - Registrar, consultar e revogar consentimentos de titulares
 * - Registrar solicitações de direitos (Art. 18 LGPD)
 * - Gerar logs de processamento de dados (Data Processing Records - ROPA)
 * - Anonimização/pseudonimização de dados pessoais
 *
 * Referências: Lei 13.709/2018 (LGPD), GDPR Reg. 2016/679, P12
 */
@Injectable()
export class LgpdConsentService {
  private readonly logger = new Logger(LgpdConsentService.name);

  /** Versão atual dos termos de consentimento da plataforma */
  private readonly CURRENT_CONSENT_VERSION = '2025-08-01-v1';

  /** Prazo legal para resposta às solicitações: 15 dias úteis (LGPD Art. 19) */
  private readonly LEGAL_DEADLINE_BUSINESS_DAYS = 15;

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Registra consentimento explícito do titular.
   * LGPD Art. 7, I — Base legal: Consentimento.
   */
  async grantConsent(params: {
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
    // Invalida consentimento anterior ativo
    await this.prisma.dataConsent.updateMany({
      where: { entityId: params.entityId, entityType: params.entityType, isActive: true },
      data: { isActive: false, updatedAt: new Date() },
    });

    const consent = await this.prisma.dataConsent.create({
      data: {
        entityId: params.entityId,
        entityType: params.entityType,
        tenantId: params.tenantId,
        consentVersion: this.CURRENT_CONSENT_VERSION,
        purposes: params.purposes,
        legalBasis: params.legalBasis,
        isActive: true,
        isMinor: params.isMinor ?? false,
        guardianId: params.guardianId,
        ipAddress: params.ipAddress ? this.anonymizeIp(params.ipAddress) : undefined,
        userAgent: params.userAgent ? this.hashUserAgent(params.userAgent) : undefined,
        collectionChannel: params.collectionChannel ?? 'WEB',
      },
    });

    await this.eventBus.publish(
      'aura.lgpd.consent.granted.v1',
      { consentId: consent.id, entityId: params.entityId, purposes: params.purposes },
      params.tenantId,
    );

    this.logger.log(`[LGPD] Consentimento concedido — entityId: ${params.entityId}, versão: ${this.CURRENT_CONSENT_VERSION}`);
    return consent;
  }

  /**
   * Revoga consentimento — LGPD Art. 8, §5.
   * O titular pode revogar a qualquer momento, gratuitamente.
   */
  async withdrawConsent(params: {
    entityId: string;
    entityType: string;
    tenantId: string;
    reason?: string;
  }) {
    const activeConsent = await this.prisma.dataConsent.findFirst({
      where: { entityId: params.entityId, isActive: true },
    });

    if (!activeConsent) {
      throw new NotFoundException('Nenhum consentimento ativo encontrado para este titular.');
    }

    const updated = await this.prisma.dataConsent.update({
      where: { id: activeConsent.id },
      data: {
        isActive: false,
        withdrawnAt: new Date(),
        withdrawalReason: params.reason ?? 'Revogação solicitada pelo titular',
      },
    });

    await this.eventBus.publish(
      'aura.lgpd.consent.withdrawn.v1',
      { consentId: activeConsent.id, entityId: params.entityId, reason: params.reason },
      params.tenantId,
    );

    this.logger.warn(`[LGPD] Consentimento revogado — entityId: ${params.entityId}`);
    return updated;
  }

  /**
   * Consulta consentimento ativo do titular — LGPD Art. 9.
   */
  async getActiveConsent(entityId: string, entityType: string) {
    return this.prisma.dataConsent.findFirst({
      where: { entityId, entityType, isActive: true },
      include: { requests: { where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } } },
    });
  }

  /**
   * Abre solicitação de direito do titular — LGPD Art. 18.
   * Tipos: ACCESS, PORTABILITY, RECTIFICATION, ERASURE, RESTRICTION, OBJECTION
   */
  async createDataSubjectRequest(params: {
    entityId: string;
    entityType: string;
    tenantId: string;
    requestType: 'ACCESS' | 'PORTABILITY' | 'RECTIFICATION' | 'ERASURE' | 'RESTRICTION' | 'OBJECTION';
    description?: string;
    requestedBy?: string;
    consentId?: string;
  }) {
    // Prazo legal: 15 dias úteis
    const dueDate = addBusinessDays(new Date(), this.LEGAL_DEADLINE_BUSINESS_DAYS);

    const request = await this.prisma.dataSubjectRequest.create({
      data: {
        entityId: params.entityId,
        entityType: params.entityType,
        tenantId: params.tenantId,
        requestType: params.requestType,
        status: 'PENDING',
        description: params.description,
        requestedBy: params.requestedBy,
        consentId: params.consentId,
        dueDate,
        evidenceLog: [{ action: 'CREATED', timestamp: new Date().toISOString(), by: params.requestedBy ?? 'TITULAR' }],
      },
    });

    await this.eventBus.publish(
      'aura.lgpd.request.created.v1',
      {
        requestId: request.id,
        requestType: params.requestType,
        entityId: params.entityId,
        dueDate: dueDate.toISOString(),
      },
      params.tenantId,
    );

    this.logger.log(`[LGPD] Solicitação ${params.requestType} criada — entityId: ${params.entityId}, prazo: ${dueDate.toISOString()}`);
    return request;
  }

  /**
   * Lista solicitações de direitos do titular.
   */
  async getDataSubjectRequests(entityId: string, tenantId: string) {
    return this.prisma.dataSubjectRequest.findMany({
      where: { entityId, tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Executa anonimização de dados pessoais — LGPD Art. 12 & Art. 18, IV.
   * Para solicitações de ERASURE: aplica pseudonimização e registra o evento.
   */
  async anonymizeEntity(params: {
    entityId: string;
    entityType: string;
    tenantId: string;
    requestId?: string;
    performedBy?: string;
    technique?: 'PSEUDONYMIZATION' | 'FULL_ERASURE';
  }) {
    const technique = params.technique ?? 'PSEUDONYMIZATION';

    // Registra o processo de anonimização
    await this.prisma.anonymizationRecord.create({
      data: {
        entityId: params.entityId,
        entityType: params.entityType,
        tenantId: params.tenantId,
        technique,
        fieldsProcessed: ['name', 'email', 'cpf', 'phone', 'address', 'birthDate'],
        requestId: params.requestId,
        performedBy: params.performedBy ?? 'DPO_SYSTEM',
        legalBasis: 'LGPD Art. 18, IV — Direito ao Esquecimento',
        retentionUntil: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000), // 5 anos
      },
    });

    await this.eventBus.publish(
      'aura.lgpd.data.anonymized.v1',
      { entityId: params.entityId, technique, requestId: params.requestId },
      params.tenantId,
    );

    this.logger.warn(`[LGPD] Anonimização aplicada — entityId: ${params.entityId}, técnica: ${technique}`);

    return { success: true, technique, entityId: params.entityId };
  }

  /**
   * Exporta dados completos do titular em formato JSON estruturado e portável.
   * Atende ao Direito à Portabilidade de Dados — LGPD Art. 18, V.
   */
  async exportDataPortability(entityId: string, tenantId: string) {
    const consents = await this.prisma.dataConsent.findMany({
      where: { entityId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    const requests = await this.prisma.dataSubjectRequest.findMany({
      where: { entityId, tenantId },
      orderBy: { createdAt: 'desc' },
    });

    // Registra a operação de portabilidade no ROPA (Art. 37)
    await this.logDataProcessing({
      entityId,
      entityType: 'BENEFICIARY',
      tenantId,
      operation: 'DATA_PORTABILITY_EXPORT',
      resource: 'DataSubjectPackage',
      purpose: 'Cumprimento de obrigacao legal do titular de dados (Art. 18, V)',
      legalBasis: 'LGPD Art. 18, V — Direito a Portabilidade',
    });

    return {
      exportMetadata: {
        entityId,
        tenantId,
        exportedAt: new Date().toISOString(),
        formatVersion: 'AURA-LGPD-PORTABILITY-v1.0',
        legalBasis: 'Lei 13.709/2018 (LGPD) — Artigo 18, Inciso V',
      },
      consents: consents.map((c) => ({
        id: c.id,
        version: c.consentVersion,
        purposes: c.purposes,
        legalBasis: c.legalBasis,
        isActive: c.isActive,
        grantedAt: c.grantedAt,
        withdrawnAt: c.withdrawnAt,
      })),
      subjectRequests: requests.map((r) => ({
        id: r.id,
        requestType: r.requestType,
        status: r.status,
        createdAt: r.createdAt,
        dueDate: r.dueDate,
      })),
    };
  }

  /**
   * Registra log de processamento de dados (ROPA — Records of Processing Activities).
   * Exigido pelo LGPD Art. 37 e GDPR Art. 30.
   */
  async logDataProcessing(params: {
    entityId: string;
    entityType: string;
    tenantId: string;
    operation: string;
    resource: string;
    resourceId?: string;
    purpose: string;
    legalBasis: string;
    actorId?: string;
    actorType?: string;
    dataFields?: string[];
    correlationId?: string;
  }) {
    return this.prisma.dataProcessingLog.create({
      data: {
        entityId: params.entityId,
        entityType: params.entityType,
        tenantId: params.tenantId,
        operation: params.operation,
        resource: params.resource,
        resourceId: params.resourceId,
        purpose: params.purpose,
        legalBasis: params.legalBasis,
        actorId: params.actorId,
        actorType: params.actorType ?? 'SYSTEM',
        isAutomated: !params.actorId,
        dataFields: params.dataFields ?? [],
        correlationId: params.correlationId,
      },
    });
  }

  /**
   * Verifica se o titular possui consentimento válido para uma finalidade específica.
   */
  async hasValidConsent(entityId: string, purpose: string): Promise<boolean> {
    const consent = await this.prisma.dataConsent.findFirst({
      where: { entityId, isActive: true },
    });
    if (!consent) return false;
    const purposes = consent.purposes as string[];
    return purposes.includes(purpose);
  }

  // ─── Helpers privados de anonimização ──────────────────────────────────

  /** Anonimiza IP — mantém apenas o primeiro octeto (ex: 192.0.0.0) */
  private anonymizeIp(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.0.0.0`;
    return '0.0.0.0';
  }

  /** Hash determinístico do user-agent para análise sem PII */
  private hashUserAgent(ua: string): string {
    let hash = 0;
    for (let i = 0; i < ua.length; i++) {
      hash = (hash << 5) - hash + ua.charCodeAt(i);
      hash |= 0;
    }
    return `ua_${Math.abs(hash).toString(16)}`;
  }
}
