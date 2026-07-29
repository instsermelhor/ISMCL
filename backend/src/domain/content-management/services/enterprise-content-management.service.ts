import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import {
  CreateDocumentDto,
  UpdateDocumentVersionDto,
  DocumentCategory,
  InformationClassification,
  DocumentStatus,
} from '../dto/content-management.dto';
import { EventBusService } from '../../../events/event-bus.service';

export interface DocumentVersion {
  versionNumber: number;
  content: string;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
  sha256Checksum: string;
}

export interface EcmDocument {
  documentId: string;
  documentCode: string; // DOC-2026-XXXXX
  title: string;
  category: DocumentCategory;
  classification: InformationClassification;
  department: string;
  keywords: string[];
  ownerId: string;
  status: DocumentStatus;
  currentVersion: number;
  versions: DocumentVersion[];
  retentionYears: number;
  retentionUntil: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * EnterpriseContentManagementService — Gestão Documental Corporativa e Versionamento ECM
 *
 * Funcionalidades:
 * - Ciclo de vida completo de documentos (Criar → Versionar → Arquivar → Descartar)
 * - Identificadores únicos UUID e códigos auditáveis (`DOC-2026-XXXXX`)
 * - Classificação de Segurança da Informação (Público a Altamente Confidencial)
 * - Versionamento imutável com preservação de todo o histórico e checksum SHA-256 por versão
 * - Emissão de CloudEvents `aura.ecm.document.created.v1` e `aura.ecm.document.version.created.v1`
 *
 * Referências: P115 AEDM, P145 AECM-KG Etapas 2, 3, 4, 5
 */
@Injectable()
export class EnterpriseContentManagementService {
  private readonly logger = new Logger(EnterpriseContentManagementService.name);
  private readonly documents = new Map<string, EcmDocument>();
  private docSequence = 1000;

  constructor(private readonly eventBus: EventBusService) {
    this.seedDefaultDocuments();
  }

  private seedDefaultDocuments(): void {
    const defaults: Array<{ title: string; category: DocumentCategory; classification: InformationClassification; content: string }> = [
      {
        title: 'Estatuto Social do Instituto Ser Melhor (ISMCL)',
        category: DocumentCategory.INSTITUTIONAL,
        classification: InformationClassification.PUBLIC,
        content: 'Constituição oficial da Associação Privada sem Fins Lucrativos Instituto Ser Melhor de Cultura e Lazer.',
      },
      {
        title: 'Procedimento Operacional Padrão (POP) — Triagem e Acolhimento',
        category: DocumentCategory.POP,
        classification: InformationClassification.INTERNAL,
        content: 'Diretrizes para escuta qualificada, aplicação de escala de vulnerabilidade e encaminhamento aos casos.',
      },
      {
        title: 'Contrato de Prestação de Serviços Tecnológicos — Plataforma Aura',
        category: DocumentCategory.CONTRACT,
        classification: InformationClassification.CONFIDENTIAL,
        content: 'Termos de governança, infraestrutura cloud e suporte técnico continuado da Plataforma Aura.',
      },
    ];

    for (const d of defaults) {
      const docId = randomUUID();
      const now = new Date();
      this.docSequence++;
      const docCode = `DOC-${now.getFullYear()}-${this.docSequence}`;
      const sha = createHash('sha256').update(d.content).digest('hex');

      const v1: DocumentVersion = {
        versionNumber: 1,
        content: d.content,
        changeSummary: 'Criação inicial do documento no repositório ECM corporativo.',
        createdBy: 'system-ecm-bootstrap',
        createdAt: now.toISOString(),
        sha256Checksum: sha,
      };

      const retentionUntil = new Date(now.getTime() + 5 * 365 * 86_400_000).toISOString();

      this.documents.set(docId, {
        documentId: docId,
        documentCode: docCode,
        title: d.title,
        category: d.category,
        classification: d.classification,
        department: 'Diretoria Executiva',
        keywords: ['ecm', 'institucional', 'governança'],
        ownerId: 'system-ecm-owner',
        status: DocumentStatus.PUBLISHED,
        currentVersion: 1,
        versions: [v1],
        retentionYears: 5,
        retentionUntil,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    this.logger.log(`[ECM] 📂 Repositório inicializado com ${this.documents.size} documentos corporativos.`);
  }

  // ── Document Operations ───────────────────────────────────────────────

  async createDocument(dto: CreateDocumentDto, ownerId: string, tenantId = 'default'): Promise<EcmDocument> {
    this.docSequence++;
    const documentId = randomUUID();
    const now = new Date();
    const documentCode = `DOC-${now.getFullYear()}-${this.docSequence}`;
    const sha = createHash('sha256').update(dto.content).digest('hex');

    const v1: DocumentVersion = {
      versionNumber: 1,
      content: dto.content,
      changeSummary: 'Versão inicial criada.',
      createdBy: ownerId,
      createdAt: now.toISOString(),
      sha256Checksum: sha,
    };

    const retentionYears = dto.retentionYears ?? 5;
    const retentionUntil = new Date(now.getTime() + retentionYears * 365 * 86_400_000).toISOString();

    const doc: EcmDocument = {
      documentId,
      documentCode,
      title: dto.title,
      category: dto.category,
      classification: dto.classification,
      department: dto.department ?? 'Geral',
      keywords: dto.keywords ?? [],
      ownerId,
      status: DocumentStatus.PUBLISHED,
      currentVersion: 1,
      versions: [v1],
      retentionYears,
      retentionUntil,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    this.documents.set(documentId, doc);
    this.logger.log(`[ECM] 📄 Documento criado: ${documentCode} [${dto.category}] — "${dto.title}" (${dto.classification})`);

    await this.eventBus.publish(
      'aura.ecm.document.created.v1',
      { documentId, documentCode, title: dto.title, category: dto.category, classification: dto.classification, ownerId },
      tenantId,
      { subject: documentId },
    );

    return doc;
  }

  async createNewVersion(documentId: string, dto: UpdateDocumentVersionDto, updatedBy: string, tenantId = 'default'): Promise<EcmDocument> {
    const doc = this.findDocumentOrThrow(documentId);
    const now = new Date().toISOString();
    const newVersionNumber = doc.currentVersion + 1;
    const sha = createHash('sha256').update(dto.content).digest('hex');

    const newVersion: DocumentVersion = {
      versionNumber: newVersionNumber,
      content: dto.content,
      changeSummary: dto.changeSummary,
      createdBy: updatedBy,
      createdAt: now,
      sha256Checksum: sha,
    };

    doc.versions.push(newVersion);
    doc.currentVersion = newVersionNumber;
    doc.updatedAt = now;

    this.logger.log(`[ECM] 🔄 Nova versão v${newVersionNumber} criada para documento ${doc.documentCode} por ${updatedBy}`);

    await this.eventBus.publish(
      'aura.ecm.document.version.created.v1',
      { documentId: doc.documentId, documentCode: doc.documentCode, versionNumber: newVersionNumber, updatedBy },
      tenantId,
      { subject: doc.documentId },
    );

    return doc;
  }

  // ── Accessors & Utilities ─────────────────────────────────────────────

  findDocumentOrThrow(id: string): EcmDocument {
    const doc = this.documents.get(id) ?? [...this.documents.values()].find((d) => d.documentCode === id);
    if (!doc) throw new NotFoundException(`Documento ${id} não encontrado no repositório ECM.`);
    return doc;
  }

  listDocuments(): EcmDocument[] {
    return [...this.documents.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
