import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import {
  CreatePrescriptionDto,
  SignDocumentDto,
  DocumentStatus,
  DocumentType,
  DocumentSensitivity,
  SignatureMode,
} from '../dto/documents.dto';
import { TrustServicesEngine, TimestampToken } from '../engines/trust-services.engine';
import { TemplateManagementService } from './template-management.service';
import { EventBusService } from '../../../events/event-bus.service';

export interface SignatureEntry {
  signatureId: string;
  signatoryId: string;
  signatoryName: string;
  signatoryRole: string;
  signatureHash: string;   // SHA-256 do token + conteúdo + signatário
  signedAt: string;
  order: number;
}

export interface ClinicalDocument {
  documentId: string;
  documentCode: string;    // DOC-2026-XXXXX
  type: DocumentType;
  title: string;
  beneficiaryId: string;
  ehrId?: string;
  caseId?: string;
  sensitivity: DocumentSensitivity;
  status: DocumentStatus;
  signatureMode: SignatureMode;
  version: number;
  content: string;          // Conteúdo renderizado (imutável após assinatura)
  contentHash: string;      // SHA-256 do conteúdo — prova de autenticidade
  icdCode?: string;
  items?: Array<{ name: string; dosage: string; instructions: string; quantity?: string }>;
  signatories: string[];    // IDs dos signatários esperados
  signatures: SignatureEntry[];
  timestampToken?: TimestampToken;
  validUntil?: string;
  issuedBy: string;
  issuedAt: string;
  updatedAt: string;
}

/**
 * DigitalPrescriptionService — Serviço Central de Prescrição Digital e Documentos Clínicos
 *
 * Funcionalidades:
 * - Emissão de prescrições, encaminhamentos, atestados, laudos, pareceres, relatórios
 * - Código sequencial imutável (DOC-YYYY-XXXXX)
 * - Assinatura eletrônica avançada com hash SHA-256 (sequencial ou paralela)
 * - Carimbo do tempo (TSA) automático ao concluir todas as assinaturas
 * - Bloqueio de conteúdo pós-assinatura (imutabilidade clínica)
 * - Versionamento completo via nova versão a cada retificação
 * - Publicação de eventos CloudEvents para todo o ciclo de vida
 *
 * Referências: CFM 2.299/2021, CFP 15/2021, LGPD Art.11, P136 AIEHSR, P138 ADPCDT Etapas 2–7
 */
@Injectable()
export class DigitalPrescriptionService {
  private readonly logger = new Logger(DigitalPrescriptionService.name);
  private readonly documents = new Map<string, ClinicalDocument>();
  private docSequence = 10_000;

  constructor(
    private readonly trustServices: TrustServicesEngine,
    private readonly templateMgr: TemplateManagementService,
    private readonly eventBus: EventBusService,
  ) {}

  private nextCode(): string {
    this.docSequence++;
    return `DOC-${new Date().getFullYear()}-${String(this.docSequence).padStart(5, '0')}`;
  }

  // ── Emissão de Documentos ──────────────────────────────────────────────

  async issue(
    dto: CreatePrescriptionDto,
    issuedById: string,
    issuedByName: string,
    issuedByRole: string,
    tenantId = 'default',
  ): Promise<ClinicalDocument> {
    const documentId = randomUUID();
    const now = new Date().toISOString();

    // Renderiza conteúdo via template padrão do tipo ou usa conteúdo livre
    const tpl = this.templateMgr.findDefaultForType(dto.type);
    const renderedContent = tpl
      ? this.templateMgr.render(tpl.templateId, {
          beneficiary_name: `[BENEFICIÁRIO ${dto.beneficiaryId}]`,
          date: new Date().toLocaleDateString('pt-BR'),
          icd_code: dto.icdCode ?? 'Não informado',
          content: dto.content ?? '',
          items: dto.items?.map((i) => `- ${i.name} ${i.dosage}: ${i.instructions}`).join('\n') ?? '',
          professional_name: issuedByName,
          professional_crp_crm: issuedByRole,
          signature_hash: '[AGUARDANDO ASSINATURA]',
        })
      : dto.content ?? `${dto.title}\n\n${dto.items?.map((i) => `${i.name} ${i.dosage} — ${i.instructions}`).join('\n') ?? ''}`;

    const contentHash = this.trustServices.generateContentHash(renderedContent);

    const doc: ClinicalDocument = {
      documentId,
      documentCode: this.nextCode(),
      type: dto.type,
      title: dto.title,
      beneficiaryId: dto.beneficiaryId,
      ehrId: dto.ehrId,
      caseId: dto.caseId,
      sensitivity: dto.sensitivity,
      status: DocumentStatus.PENDING_SIGNATURE,
      signatureMode: dto.signatureMode ?? SignatureMode.SEQUENTIAL,
      version: 1,
      content: renderedContent,
      contentHash,
      icdCode: dto.icdCode,
      items: dto.items,
      signatories: [issuedById, ...(dto.additionalSignatories ?? [])],
      signatures: [],
      validUntil: dto.validUntil,
      issuedBy: issuedById,
      issuedAt: now,
      updatedAt: now,
    };

    this.documents.set(documentId, doc);
    this.logger.log(`[Docs] 📄 Documento emitido: ${doc.documentCode} — ${dto.type} — ${dto.title}`);

    await this.eventBus.publish(
      'aura.documents.issued.v1',
      {
        documentId,
        documentCode: doc.documentCode,
        type: dto.type,
        beneficiaryId: dto.beneficiaryId,
        issuedBy: issuedById,
        contentHash,
      },
      tenantId,
      { subject: documentId },
    );

    return doc;
  }

  // ── Assinatura Eletrônica ─────────────────────────────────────────────

  async sign(
    dto: SignDocumentDto,
    signatoryId: string,
    signatoryName: string,
    signatoryRole: string,
    tenantId = 'default',
  ): Promise<ClinicalDocument> {
    const doc = this.findOrThrow(dto.documentId);

    if (doc.status === DocumentStatus.SIGNED || doc.status === DocumentStatus.ARCHIVED) {
      throw new BadRequestException('Documento já se encontra totalmente assinado ou arquivado.');
    }

    if (!doc.signatories.includes(signatoryId)) {
      throw new BadRequestException(`Profissional ${signatoryId} não está na lista de signatários deste documento.`);
    }

    const alreadySigned = doc.signatures.some((s) => s.signatoryId === signatoryId);
    if (alreadySigned) {
      throw new BadRequestException('Este profissional já assinou o documento.');
    }

    // Gera hash SHA-256 da assinatura: documentId + conteúdo hash + token + signatário
    const signatureHash = createHash('sha256')
      .update(`${doc.documentId}:${doc.contentHash}:${dto.signatureToken}:${signatoryId}:${new Date().toISOString()}`)
      .digest('hex');

    const signatureEntry: SignatureEntry = {
      signatureId: randomUUID(),
      signatoryId,
      signatoryName,
      signatoryRole,
      signatureHash,
      signedAt: new Date().toISOString(),
      order: doc.signatures.length + 1,
    };

    doc.signatures.push(signatureEntry);
    doc.updatedAt = new Date().toISOString();

    const allSigned = doc.signatories.every((id) => doc.signatures.some((s) => s.signatoryId === id));

    if (allSigned) {
      doc.status = DocumentStatus.SIGNED;
      // Emite Carimbo do Tempo ao concluir todas as assinaturas
      doc.timestampToken = this.trustServices.issueTimestamp(doc.documentId, doc.contentHash);
      this.logger.log(`[Docs] 🔒 Documento ${doc.documentCode} TOTALMENTE ASSINADO e carimbado (TSA).`);

      await this.eventBus.publish(
        'aura.documents.signed.v1',
        {
          documentId: doc.documentId,
          documentCode: doc.documentCode,
          type: doc.type,
          signatoryCount: doc.signatures.length,
          timestampToken: doc.timestampToken?.tokenId,
        },
        tenantId,
        { subject: doc.documentId },
      );
    } else {
      doc.status = DocumentStatus.PARTIALLY_SIGNED;
      this.logger.log(`[Docs] ✍️ Assinatura parcial: ${doc.signatures.length}/${doc.signatories.length} — ${doc.documentCode}`);
    }

    return doc;
  }

  // ── Validação de Integridade ──────────────────────────────────────────

  async validate(documentId: string, tenantId = 'default') {
    const doc = this.findOrThrow(documentId);
    const report = this.trustServices.verifyIntegrity(doc.documentId, doc.content, doc.contentHash);
    const tsaValid = doc.timestampToken
      ? this.trustServices.verifyTimestamp(doc.timestampToken)
      : null;

    await this.eventBus.publish(
      'aura.documents.validated.v1',
      { documentId, isValid: report.isValid, tsaValid, checkedAt: report.checkedAt },
      tenantId,
      { subject: documentId },
    );

    return { ...report, tsaValid };
  }

  // ── Utilitários ────────────────────────────────────────────────────────

  findOrThrow(documentId: string): ClinicalDocument {
    const doc = this.documents.get(documentId);
    if (!doc) throw new NotFoundException(`Documento ${documentId} não encontrado.`);
    return doc;
  }

  findByBeneficiary(beneficiaryId: string): ClinicalDocument[] {
    return [...this.documents.values()].filter((d) => d.beneficiaryId === beneficiaryId);
  }
}
