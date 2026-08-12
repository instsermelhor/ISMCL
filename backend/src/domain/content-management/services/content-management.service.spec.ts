import { EnterpriseContentManagementService } from './enterprise-content-management.service';
import { RetentionSearchService } from './retention-search.service';
import { EventBusService } from '../../../events/event-bus.service';
import {
  DocumentCategory,
  InformationClassification,
  DocumentStatus,
} from '../dto/content-management.dto';

describe('EnterpriseContentManagementService', () => {
  let service: EnterpriseContentManagementService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    service = new EnterpriseContentManagementService(eventBusMock as EventBusService);
  });

  it('should have pre-seeded institutional documents with SHA-256 checksums', () => {
    const docs = service.listDocuments();
    expect(docs.length).toBeGreaterThanOrEqual(3);
    const pop = docs.find((d) => d.category === DocumentCategory.POP);
    expect(pop).toBeDefined();
    expect(pop?.versions[0].sha256Checksum).toHaveLength(64);
  });

  it('should create a new document with UUID and issue CloudEvent', async () => {
    const doc = await service.createDocument({
      title: 'Relatório Trimestral de Impacto Social 2026',
      category: DocumentCategory.INSTITUTIONAL,
      classification: InformationClassification.INTERNAL,
      content: 'Resumo executivo do impacto gerado nas comunidades atendidas.',
    }, 'user-admin-001');

    expect(doc.documentId).toBeDefined();
    expect(doc.documentCode).toMatch(/^DOC-\d{4}-\d{4,5}$/);
    expect(doc.currentVersion).toBe(1);
    expect(doc.versions[0].sha256Checksum).toHaveLength(64);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ecm.document.created.v1',
      expect.objectContaining({ title: expect.stringContaining('Impacto Social') }),
      'default',
      expect.anything(),
    );
  });

  it('should create a new version preserving version history', async () => {
    const docs = service.listDocuments();
    const docToUpdate = docs[0];

    const updated = await service.createNewVersion(docToUpdate.documentId, {
      content: 'Conteúdo atualizado e revisado pela Diretoria.',
      changeSummary: 'Revisão semestral de conformidade.',
    }, 'user-editor-001');

    expect(updated.currentVersion).toBe(2);
    expect(updated.versions.length).toBe(2);
    expect(updated.versions[1].createdBy).toBe('user-editor-001');
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ecm.document.version.created.v1',
      expect.objectContaining({ versionNumber: 2 }),
      'default',
      expect.anything(),
    );
  });
});

describe('RetentionSearchService', () => {
  let ecmService: EnterpriseContentManagementService;
  let searchService: RetentionSearchService;
  let eventBusMock: Partial<EventBusService>;

  beforeEach(() => {
    eventBusMock = { publish: jest.fn().mockResolvedValue({} as any) };
    ecmService = new EnterpriseContentManagementService(eventBusMock as EventBusService);
    searchService = new RetentionSearchService(ecmService, eventBusMock as EventBusService);
  });

  it('should search documents by query term and return relevance scores', async () => {
    const searchResult = await searchService.searchDocuments({ query: 'Estatuto' });
    expect(searchResult.totalFound).toBeGreaterThanOrEqual(1);
    expect(searchResult.results[0].relevanceScore).toBeGreaterThan(0.7);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ecm.search.executed.v1',
      expect.objectContaining({ query: 'estatuto' }),
      'default',
      expect.anything(),
    );
  });

  it('should archive document into Digital Archive', async () => {
    const docs = ecmService.listDocuments();
    const target = docs[0];

    const archived = await searchService.archiveDocument(target.documentId, 'user-archivist-001');
    expect(archived.status).toBe(DocumentStatus.ARCHIVED);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ecm.document.archived.v1',
      expect.objectContaining({ documentCode: target.documentCode }),
      'default',
      expect.anything(),
    );
  });

  it('should safely dispose document with SHA-256 audit signature', async () => {
    const docs = ecmService.listDocuments();
    const target = docs[1];

    const record = await searchService.disposeDocument(target.documentId, {
      reason: 'Cumprimento da Tabela de Temporalidade — Prazo de retenção de 5 anos expirado.',
    }, 'user-super-admin-001');

    expect(record.auditSignature).toHaveLength(64); // SHA-256
    expect(record.documentCode).toBe(target.documentCode);
    expect(eventBusMock.publish).toHaveBeenCalledWith(
      'aura.ecm.document.disposed.v1',
      expect.objectContaining({ disposedBy: 'user-super-admin-001' }),
      'default',
      expect.anything(),
    );
  });
});
