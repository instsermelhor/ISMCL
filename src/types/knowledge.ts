import type { InstitutionalRole } from './iam';

// ----------------------------------------------------------------
// Categorias do Centro Corporativo de Conhecimento (Prompt 179 - ETAPA 4)
// ----------------------------------------------------------------

export type KnowledgeCategory =
  | 'relacional'
  | 'digital'
  | 'base_conhecimento'
  | 'documentacao_oficial'
  | 'protocolos'
  | 'pops'
  | 'normativos'
  | 'modelos'
  | 'fluxogramas'
  | 'materiais_tecnicos'
  | 'juridica'
  | 'clinica'
  | 'social'
  | 'institucional'
  | 'financeira'
  | 'capacitacao'
  | 'universidade_corporativa'
  | 'ia'
  | 'central_pesquisas';

export type SecurityClassification = 'publica' | 'interna' | 'confidencial' | 'restrita';

export type DocumentStatus = 'draft' | 'under_review' | 'approved' | 'archived' | 'expired';

export interface KnowledgeVersion {
  versionNumber: string; // e.g. "1.0", "1.1", "2.0"
  createdAt: string;
  createdBy: string;
  authorRole: InstitutionalRole;
  approvedBy?: string;
  approvedAt?: string;
  changelog: string;
  fileUrl?: string;
  fileSizeKb?: number;
}

// Node & Edges para o Grafo Relacional de Conhecimento (Prompt 179 - ETAPA 8)
export interface KnowledgeRelation {
  id: string;
  sourceDocId: string;
  targetDocId: string;
  targetTitle: string;
  relationType:
    | 'fundamenta'
    | 'regulamenta'
    | 'deriva_de'
    | 'complementa'
    | 'aplica_em_caso'
    | 'treina_em'
    | 'normatiza'
    | 'integrado_ia';
  description: string;
}

export interface KnowledgeDocument {
  id: string;
  code: string; // e.g. "DOC-REL-001", "POP-CLI-012"
  title: string;
  summary: string;
  fullContent?: string;
  category: KnowledgeCategory;
  department: string;
  classification: SecurityClassification;
  status: DocumentStatus;
  currentVersion: string;
  versions: KnowledgeVersion[];
  allowedRoles: InstitutionalRole[];
  allowedDepartments?: string[];
  tags: string[];
  keywords: string[];
  author: string;
  authorRole: InstitutionalRole;
  approver?: string;
  validUntil?: string; // YYYY-MM-DD
  downloadAllowed: boolean;
  watermarkRequired: boolean;
  printAllowed: boolean;
  shareExpirationDays?: number;
  relations: KnowledgeRelation[];
  viewCount: number;
  downloadCount: number;
  updatedAt: string;
}

export interface KnowledgeAuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: InstitutionalRole;
  action:
    | 'view'
    | 'download'
    | 'create'
    | 'new_version'
    | 'approve'
    | 'change_permission'
    | 'search_rag'
    | 'export_graph';
  documentId?: string;
  documentTitle?: string;
  ipAddress: string;
  details: string;
}

export interface KnowledgeMetrics {
  totalDocuments: number;
  activeCategories: number;
  totalViews: number;
  totalDownloads: number;
  pendingReviewsCount: number;
  expiredCount: number;
  topSearchedTerms: { term: string; count: number }[];
  usageByDepartment: { department: string; docCount: number; views: number }[];
  usageByRole: Record<string, number>;
  ragQueryCount: number;
  knowledgeGraphNodesCount: number;
  knowledgeGraphEdgesCount: number;
}

export interface RAGQueryResult {
  query: string;
  answer: string;
  confidenceScore: number; // 0.0 to 1.0
  relevantDocIds: string[];
  citationSnippets: { docId: string; docTitle: string; snippet: string }[];
}
