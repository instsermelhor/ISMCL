// =============================================================================
// AECM-KG — Aura Enterprise Content Management, Digital Archives & Knowledge Governance
// Tipos e Interfaces TypeScript — Prompt 145
// =============================================================================

export type DocumentCategory =
  | 'administrative'
  | 'assistential'
  | 'financial'
  | 'legal'
  | 'institutional'
  | 'contract'
  | 'policy'
  | 'pop';

export type SecurityClassification =
  | 'public'
  | 'internal'
  | 'restricted'
  | 'confidential'
  | 'highly_confidential';

export type DocumentStatus =
  | 'draft'
  | 'under_review'
  | 'published'
  | 'archived'
  | 'disposed';

export interface DocumentVersion {
  id: string;
  versionNumber: string; // e.g. "1.0", "1.1"
  contentUrl: string;
  fileSize: number; // in bytes
  mimeType: string;
  hash: string; // SHA-256
  changesDescription: string;
  createdAt: string;
  createdByName: string;
}

export interface RetentionRule {
  id: string;
  code: string; // e.g. RET-ADM-01
  category: DocumentCategory;
  currentPhaseYears: number; // tempo em fase corrente
  intermediatePhaseYears: number; // tempo em fase intermediária
  finalDestination: 'permanent_guard' | 'disposal';
  legalBasis: string;
  description: string;
}

export interface DocumentMetadata {
  author: string;
  owner: string;
  orgUnit: string;
  keywords: string[];
  expirationDate?: string;
  customFields?: Record<string, string>;
}

export interface ECMDocument {
  id: string; // UUID
  code: string; // e.g. DOC-2025-001
  title: string;
  description: string;
  category: DocumentCategory;
  classification: SecurityClassification;
  status: DocumentStatus;
  currentVersion: string;
  versions: DocumentVersion[];
  metadata: DocumentMetadata;
  retentionRuleId?: string;
  currentPhaseEndDate?: string;
  intermediatePhaseEndDate?: string;
  isDigitallySigned: boolean;
  signedBy?: string[];
  digitalSignatureHash?: string;
  checksum: string; // SHA-256 for long-term preservation
  ocrText?: string;
  vectorEmbeddingId?: string; // para busca semântica
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DigitalArchiveRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  category: DocumentCategory;
  archivedAt: string;
  archivedBy: string;
  checksum: string;
  redundancyLocation: string; // e.g. "AWS S3 Glacier Deep Archive (sa-east-1)"
  preservationStatus: 'verified' | 'integrity_warning' | 'migrated';
  lastIntegrityCheck: string;
}

export interface DisposalRecord {
  id: string;
  documentId: string;
  documentTitle: string;
  documentCode: string;
  category: DocumentCategory;
  disposedAt: string;
  disposedBy: string;
  authorizedBy: string;
  disposalMethod: 'secure_digital_wipe' | 'physical_shredding';
  auditCertificateHash: string;
}

export interface SearchFilter {
  query: string;
  category?: DocumentCategory | 'all';
  classification?: SecurityClassification | 'all';
  status?: DocumentStatus | 'all';
  useOCR?: boolean;
  useSemanticSearch?: boolean;
}

export type AECMEventType =
  | 'DocumentClassified'
  | 'DocumentVersionCreated'
  | 'DocumentArchived'
  | 'DocumentRestored'
  | 'RetentionPolicyApplied'
  | 'DocumentDisposed'
  | 'MetadataUpdated'
  | 'SearchExecuted'
  | 'InformationOwnerChanged'
  | 'GovernancePolicyApplied';

export interface ECMAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: AECMEventType;
  documentId: string;
  documentTitle: string;
  description: string;
  hash: string;
}

export interface AECMContextValue {
  documents: ECMDocument[];
  archiveRecords: DigitalArchiveRecord[];
  disposalRecords: DisposalRecord[];
  retentionRules: RetentionRule[];
  auditLog: ECMAuditEntry[];
  
  // Actions
  addDocument: (doc: Omit<ECMDocument, 'id' | 'code' | 'checksum' | 'createdAt' | 'updatedAt' | 'versions'>) => void;
  addVersion: (documentId: string, versionNumber: string, changesDescription: string, author: string) => void;
  updateClassification: (documentId: string, classification: SecurityClassification) => void;
  archiveDocument: (documentId: string, actor: string) => void;
  disposeDocument: (documentId: string, authorizedBy: string, actor: string) => void;
  searchDocuments: (filter: SearchFilter) => ECMDocument[];
}
