import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AECMContextValue,
  ECMDocument,
  DigitalArchiveRecord,
  DisposalRecord,
  RetentionRule,
  ECMAuditEntry,
  SearchFilter,
  SecurityClassification,
} from '../types/aecm';

const INITIAL_RETENTION_RULES: RetentionRule[] = [
  { id: 'ret-001', code: 'RET-ADM-01', category: 'administrative', currentPhaseYears: 5, intermediatePhaseYears: 5, finalDestination: 'disposal', legalBasis: 'Tabela Geral de Temporalidade de Documentos de Gestão', description: 'Documentos administrativos gerais de rotina' },
  { id: 'ret-002', code: 'RET-AST-01', category: 'assistential', currentPhaseYears: 20, intermediatePhaseYears: 0, finalDestination: 'permanent_guard', legalBasis: 'Resolução CFM nº 1.821/2007 e Lei nº 13.787/2018', description: 'Prontuários e laudos assistenciais de atendimentos' },
  { id: 'ret-003', code: 'RET-FIN-01', category: 'financial', currentPhaseYears: 10, intermediatePhaseYears: 10, finalDestination: 'disposal', legalBasis: 'Lei nº 5.172/1966 (CTN) e Código Civil Art. 205', description: 'Comprovantes financeiros, doações e prestações de contas' },
  { id: 'ret-004', code: 'RET-LEG-01', category: 'legal', currentPhaseYears: 10, intermediatePhaseYears: 20, finalDestination: 'permanent_guard', legalBasis: 'Código Civil e Estatuto das Organizações da Sociedade Civil', description: 'Contratos institucionais, estatuto social e atas de assembleia' },
];

const INITIAL_DOCUMENTS: ECMDocument[] = [
  {
    id: 'f83c12d4-72a1-4e92-[#1]',
    code: 'DOC-2025-001',
    title: 'Estatuto Social Atualizado do Instituto Ser Melhor',
    description: 'Documento constitutivo consolidado do Instituto Ser Melhor contendo diretrizes contratuais e governança.',
    category: 'legal',
    classification: 'public',
    status: 'published',
    currentVersion: '2.0',
    versions: [
      { id: 'v1', versionNumber: '1.0', contentUrl: '/docs/estatuto_v1.pdf', fileSize: 1048576, mimeType: 'application/pdf', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', changesDescription: 'Versão de fundação', createdAt: '2023-01-10T10:00:00Z', createdByName: 'Diretoria Executiva' },
      { id: 'v2', versionNumber: '2.0', contentUrl: '/docs/estatuto_v2.pdf', fileSize: 1258291, mimeType: 'application/pdf', hash: '8743b12c419e7a4b081639d67a90940562e84ca6c9b4566c483a9914619b098', changesDescription: 'Revisão conforme Assembleia de 2025', createdAt: '2025-02-15T14:30:00Z', createdByName: 'Jurídico' }
    ],
    metadata: { author: 'Dra. Maria Augusta', owner: 'Conselho Deliberativo', orgUnit: 'Presidência', keywords: ['estatuto', 'governança', 'institucional'], expirationDate: '2030-12-31' },
    retentionRuleId: 'ret-004',
    isDigitallySigned: true,
    signedBy: ['Dra. Maria Augusta Pereira', 'Prof. Carlos Eduardo'],
    digitalSignatureHash: 'sig_7c3aed90218f43',
    checksum: '8743b12c419e7a4b081639d67a90940562e84ca6c9b4566c483a9914619b098',
    ocrText: 'ESTATUTO SOCIAL DO INSTITUTO SER MELHOR Capitulo I Da Denominacao e Sede Artigo 1...',
    createdAt: '2023-01-10T10:00:00Z',
    updatedAt: '2025-02-15T14:30:00Z',
    createdBy: 'Presidência'
  },
  {
    id: 'a92b33c1-11d2-4b33-[#2]',
    code: 'DOC-2025-002',
    title: 'Relatório de Atendimento Assistencial — Q1/2025',
    description: 'Relatório consolidado de atendimentos psicológicos e sociais realizados no primeiro trimestre.',
    category: 'assistential',
    classification: 'restricted',
    status: 'published',
    currentVersion: '1.0',
    versions: [
      { id: 'v1', versionNumber: '1.0', contentUrl: '/docs/relatorio_q1.pdf', fileSize: 2097152, mimeType: 'application/pdf', hash: '9b2c83a17e08927163a87123549e0018274a1082c5b364817a5849d1029e018a', changesDescription: 'Emissão oficial', createdAt: '2025-04-05T09:00:00Z', createdByName: 'Coordenação Assistencial' }
    ],
    metadata: { author: 'Dra. Roberta Santos', owner: 'Equipe Técnica', orgUnit: 'Assistência Social', keywords: ['relatório', 'assistencial', 'psicologia', 'Q1'] },
    retentionRuleId: 'ret-002',
    isDigitallySigned: true,
    signedBy: ['Dra. Roberta Santos'],
    checksum: '9b2c83a17e08927163a87123549e0018274a1082c5b364817a5849d1029e018a',
    ocrText: 'RELATORIO DE ATENDIMENTOS PSICOSSOCIAIS Q1 2025 Total de familias atendidas 312...',
    createdAt: '2025-04-05T09:00:00Z',
    updatedAt: '2025-04-05T09:00:00Z',
    createdBy: 'Coord. Assistencial'
  },
  {
    id: 'c77f88e1-99a0-4112-[#3]',
    code: 'DOC-2025-003',
    title: 'Manual de Segurança da Informação e Privacidade (LGPD)',
    description: 'Diretrizes de proteção de dados corporativos e procedimentos operacionais padronizados.',
    category: 'pop',
    classification: 'internal',
    status: 'published',
    currentVersion: '1.1',
    versions: [
      { id: 'v1', versionNumber: '1.1', contentUrl: '/docs/manual_lgpd.pdf', fileSize: 3145728, mimeType: 'application/pdf', hash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', changesDescription: 'Atualização de procedimentos de resposta a incidentes', createdAt: '2025-01-20T11:00:00Z', createdByName: 'CISO / DPO' }
    ],
    metadata: { author: 'CISO / DPO', owner: 'TI & Compliance', orgUnit: 'Segurança da Informação', keywords: ['LGPD', 'privacidade', 'segurança', 'POP'] },
    retentionRuleId: 'ret-001',
    isDigitallySigned: false,
    checksum: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    ocrText: 'MANUAL DE SEGURANCA DA INFORMACAO LGPD Regras para controle de acessos e privacidade...',
    createdAt: '2025-01-20T11:00:00Z',
    updatedAt: '2025-01-20T11:00:00Z',
    createdBy: 'CISO'
  }
];

const AECMContext = createContext<AECMContextValue | null>(null);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export function AECMProvider({ children }: { children: React.ReactNode }) {
  const [documents, setDocuments] = useState<ECMDocument[]>(() => loadStorage('aecm_documents', INITIAL_DOCUMENTS));
  const [archiveRecords, setArchiveRecords] = useState<DigitalArchiveRecord[]>(() => loadStorage('aecm_archives', []));
  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(() => loadStorage('aecm_disposals', []));
  const [retentionRules] = useState<RetentionRule[]>(INITIAL_RETENTION_RULES);
  const [auditLog, setAuditLog] = useState<ECMAuditEntry[]>(() => loadStorage('aecm_audit_log', []));

  useEffect(() => { localStorage.setItem('aecm_documents', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem('aecm_archives', JSON.stringify(archiveRecords)); }, [archiveRecords]);
  useEffect(() => { localStorage.setItem('aecm_disposals', JSON.stringify(disposalRecords)); }, [disposalRecords]);
  useEffect(() => { localStorage.setItem('aecm_audit_log', JSON.stringify(auditLog)); }, [auditLog]);

  const addAudit = useCallback((action: ECMAuditEntry['action'], documentId: string, documentTitle: string, description: string, actor: string) => {
    const entry: ECMAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      documentId,
      documentTitle,
      description,
      hash: Math.random().toString(36).substring(2, 10),
    };
    setAuditLog(prev => [entry, ...prev]);
    window.dispatchEvent(new CustomEvent('aecm:event', { detail: entry }));
  }, []);

  const addDocument = useCallback((doc: Omit<ECMDocument, 'id' | 'code' | 'checksum' | 'createdAt' | 'updatedAt' | 'versions'>) => {
    const id = `doc-${Date.now()}`;
    const code = `DOC-${new Date().getFullYear()}-${String(documents.length + 1).padStart(3, '0')}`;
    const checksum = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const newDoc: ECMDocument = {
      ...doc,
      id,
      code,
      checksum,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      versions: [
        {
          id: `v1-${Date.now()}`,
          versionNumber: '1.0',
          contentUrl: `/docs/${code}.pdf`,
          fileSize: 1048576,
          mimeType: 'application/pdf',
          hash: checksum,
          changesDescription: 'Criação inicial do documento',
          createdAt: new Date().toISOString(),
          createdByName: doc.createdBy,
        }
      ]
    };

    setDocuments(prev => [newDoc, ...prev]);
    addAudit('DocumentClassified', id, newDoc.title, `Novo documento '${newDoc.title}' cadastrado com classificação ${newDoc.classification}`, doc.createdBy);
  }, [documents.length, addAudit]);

  const addVersion = useCallback((documentId: string, versionNumber: string, changesDescription: string, author: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== documentId) return doc;
      const newHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const newVersion = {
        id: `v-${Date.now()}`,
        versionNumber,
        contentUrl: `/docs/${doc.code}_v${versionNumber}.pdf`,
        fileSize: 1500000,
        mimeType: 'application/pdf',
        hash: newHash,
        changesDescription,
        createdAt: new Date().toISOString(),
        createdByName: author,
      };

      addAudit('DocumentVersionCreated', doc.id, doc.title, `Nova versão ${versionNumber} criada por ${author}`, author);
      return {
        ...doc,
        currentVersion: versionNumber,
        checksum: newHash,
        versions: [newVersion, ...doc.versions],
        updatedAt: new Date().toISOString(),
      };
    }));
  }, [addAudit]);

  const updateClassification = useCallback((documentId: string, classification: SecurityClassification) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== documentId) return doc;
      addAudit('DocumentClassified', doc.id, doc.title, `Classificação de segurança alterada para ${classification}`, 'Sistema / CISO');
      return { ...doc, classification, updatedAt: new Date().toISOString() };
    }));
  }, [addAudit]);

  const archiveDocument = useCallback((documentId: string, actor: string) => {
    setDocuments(prev => prev.map(doc => {
      if (doc.id !== documentId) return doc;
      const archiveRecord: DigitalArchiveRecord = {
        id: `arc-${Date.now()}`,
        documentId: doc.id,
        documentTitle: doc.title,
        category: doc.category,
        archivedAt: new Date().toISOString(),
        archivedBy: actor,
        checksum: doc.checksum,
        redundancyLocation: 'AWS S3 Glacier Deep Archive (sa-east-1)',
        preservationStatus: 'verified',
        lastIntegrityCheck: new Date().toISOString(),
      };
      setArchiveRecords(p => [archiveRecord, ...p]);
      addAudit('DocumentArchived', doc.id, doc.title, `Documento movido para Arquivo Digital por ${actor}`, actor);
      return { ...doc, status: 'archived', updatedAt: new Date().toISOString() };
    }));
  }, [addAudit]);

  const disposeDocument = useCallback((documentId: string, authorizedBy: string, actor: string) => {
    setDocuments(prev => {
      const doc = prev.find(d => d.id === documentId);
      if (doc) {
        const disposal: DisposalRecord = {
          id: `disp-${Date.now()}`,
          documentId: doc.id,
          documentTitle: doc.title,
          documentCode: doc.code,
          category: doc.category,
          disposedAt: new Date().toISOString(),
          disposedBy: actor,
          authorizedBy,
          disposalMethod: 'secure_digital_wipe',
          auditCertificateHash: Math.random().toString(36).substring(2, 18),
        };
        setDisposalRecords(p => [disposal, ...p]);
        addAudit('DocumentDisposed', doc.id, doc.title, `Documento descartado com laudo emitido e assinado por ${authorizedBy}`, actor);
      }
      return prev.filter(d => d.id !== documentId);
    });
  }, [addAudit]);

  const searchDocuments = useCallback((filter: SearchFilter): ECMDocument[] => {
    const q = filter.query.toLowerCase().trim();
    return documents.filter(doc => {
      if (filter.category && filter.category !== 'all' && doc.category !== filter.category) return false;
      if (filter.classification && filter.classification !== 'all' && doc.classification !== filter.classification) return false;
      if (filter.status && filter.status !== 'all' && doc.status !== filter.status) return false;

      if (!q) return true;

      const titleMatch = doc.title.toLowerCase().includes(q);
      const descMatch = doc.description.toLowerCase().includes(q);
      const codeMatch = doc.code.toLowerCase().includes(q);
      const authorMatch = doc.metadata.author.toLowerCase().includes(q);
      const keywordMatch = doc.metadata.keywords.some(k => k.toLowerCase().includes(q));
      const ocrMatch = filter.useOCR && doc.ocrText ? doc.ocrText.toLowerCase().includes(q) : false;

      return titleMatch || descMatch || codeMatch || authorMatch || keywordMatch || ocrMatch;
    });
  }, [documents]);

  const value = useMemo<AECMContextValue>(() => ({
    documents,
    archiveRecords,
    disposalRecords,
    retentionRules,
    auditLog,
    addDocument,
    addVersion,
    updateClassification,
    archiveDocument,
    disposeDocument,
    searchDocuments,
  }), [documents, archiveRecords, disposalRecords, retentionRules, auditLog, addDocument, addVersion, updateClassification, archiveDocument, disposeDocument, searchDocuments]);

  return <AECMContext.Provider value={value}>{children}</AECMContext.Provider>;
}

export function useAECM() {
  const context = useContext(AECMContext);
  if (!context) throw new Error('useAECM must be used within AECMProvider');
  return context;
}
