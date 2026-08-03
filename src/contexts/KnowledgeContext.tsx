import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  KnowledgeDocument,
  KnowledgeCategory,
  KnowledgeAuditLog,
  KnowledgeMetrics,
  RAGQueryResult,
  KnowledgeRelation,
  KnowledgeVersion,
} from '../types/knowledge';
import {
  INITIAL_KNOWLEDGE_DOCUMENTS,
  INITIAL_KNOWLEDGE_AUDIT_LOGS,
  INITIAL_KNOWLEDGE_METRICS,
} from '../data/knowledge-mock';
import { useIAM } from './IAMContext';
import type { InstitutionalRole } from '../types/iam';

interface KnowledgeContextType {
  documents: KnowledgeDocument[];
  accessibleDocuments: KnowledgeDocument[];
  auditLogs: KnowledgeAuditLog[];
  metrics: KnowledgeMetrics;
  selectedCategory: KnowledgeCategory | 'all';
  setSelectedCategory: (cat: KnowledgeCategory | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  ragResult: RAGQueryResult | null;
  isQueryingRAG: boolean;
  
  // Ações
  queryRAG: (query: string) => Promise<RAGQueryResult>;
  viewDocument: (id: string) => KnowledgeDocument | undefined;
  addDocument: (doc: Omit<KnowledgeDocument, 'id' | 'viewCount' | 'downloadCount' | 'updatedAt' | 'relations' | 'versions'>) => void;
  addVersion: (docId: string, version: Omit<KnowledgeVersion, 'createdAt'>) => void;
  approveDocument: (docId: string) => void;
  addRelation: (relation: Omit<KnowledgeRelation, 'id'>) => void;
  logAction: (action: KnowledgeAuditLog['action'], details: string, docId?: string, docTitle?: string) => void;
}

const KnowledgeContext = createContext<KnowledgeContextType | undefined>(undefined);

export const KnowledgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useIAM();
  // FIX BUG SEGURANÇA #5 (Prompt 181 — Auditoria Forense):
  // Fallback anterior era 'super_admin', concedendo acesso máximo a usuários não autenticados.
  // Corrigido para 'beneficiary' (acesso mínimo por princípio de menor privilégio).
  const userRole: InstitutionalRole = currentUser?.roles?.[0] ?? 'beneficiary';

  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    try {
      const local = localStorage.getItem('@aura_knowledge_docs');
      const parsed = local ? JSON.parse(local) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_KNOWLEDGE_DOCUMENTS;
    } catch {
      return INITIAL_KNOWLEDGE_DOCUMENTS;
    }
  });

  const [auditLogs, setAuditLogs] = useState<KnowledgeAuditLog[]>(() => {
    try {
      const local = localStorage.getItem('@aura_knowledge_logs');
      const parsed = local ? JSON.parse(local) : null;
      return Array.isArray(parsed) ? parsed : INITIAL_KNOWLEDGE_AUDIT_LOGS;
    } catch {
      return INITIAL_KNOWLEDGE_AUDIT_LOGS;
    }
  });

  const [metrics, setMetrics] = useState<KnowledgeMetrics>(INITIAL_KNOWLEDGE_METRICS);
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [ragResult, setRagResult] = useState<RAGQueryResult | null>(null);
  const [isQueryingRAG, setIsQueryingRAG] = useState(false);

  // Salvar no localStorage
  useEffect(() => {
    localStorage.setItem('@aura_knowledge_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('@aura_knowledge_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Filtragem RBAC/ABAC por papel institucional
  const accessibleDocuments = documents.filter((doc) => {
    // Super Admin e Presidente possuem acesso universal
    if (userRole === 'super_admin' || userRole === 'president' || userRole === 'auditor') {
      return true;
    }
    // Verificar se a role do usuário está na lista de permissões do documento
    return doc.allowedRoles.includes(userRole);
  });

  const logAction = (
    action: KnowledgeAuditLog['action'],
    details: string,
    documentId?: string,
    documentTitle?: string
  ) => {
    const newLog: KnowledgeAuditLog = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: currentUser?.id ?? 'usr-sys',
      userName: currentUser?.name ?? 'Usuário Sistema',
      userRole: userRole,
      action,
      documentId,
      documentTitle,
      ipAddress: '127.0.0.1 (VPN Corporativa)',
      details,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const viewDocument = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, viewCount: d.viewCount + 1 } : d))
      );
      logAction('view', `Visualização do documento [${doc.code}] por ${currentUser?.name ?? 'Usuário'}`, doc.id, doc.title);
    }
    return doc;
  };

  const addDocument = (
    docData: Omit<KnowledgeDocument, 'id' | 'viewCount' | 'downloadCount' | 'updatedAt' | 'relations' | 'versions'>
  ) => {
    const initialVersion: KnowledgeVersion = {
      versionNumber: docData.currentVersion || '1.0',
      createdAt: new Date().toISOString(),
      createdBy: docData.author,
      authorRole: docData.authorRole,
      changelog: 'Criação inicial do documento no Centro Corporativo.',
    };

    const newDoc: KnowledgeDocument = {
      ...docData,
      id: `doc-${Date.now()}`,
      viewCount: 0,
      downloadCount: 0,
      updatedAt: new Date().toISOString(),
      versions: [initialVersion],
      relations: [],
    };

    setDocuments((prev) => [newDoc, ...prev]);
    logAction('create', `Criação do documento [${newDoc.code}] na categoria ${newDoc.category}`, newDoc.id, newDoc.title);
  };

  const addVersion = (docId: string, versionData: Omit<KnowledgeVersion, 'createdAt'>) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          const newVer: KnowledgeVersion = {
            ...versionData,
            createdAt: new Date().toISOString(),
          };
          return {
            ...d,
            currentVersion: versionData.versionNumber,
            versions: [newVer, ...d.versions],
            updatedAt: new Date().toISOString(),
          };
        }
        return d;
      })
    );
    logAction('new_version', `Nova versão ${versionData.versionNumber} adicionada. Motivo: ${versionData.changelog}`, docId);
  };

  const approveDocument = (docId: string) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              status: 'approved',
              approver: currentUser?.name ?? 'Super Admin',
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
    logAction('approve', `Documento aprovado por ${currentUser?.name ?? 'Super Admin'}`, docId);
  };

  const addRelation = (relData: Omit<KnowledgeRelation, 'id'>) => {
    const newRel: KnowledgeRelation = {
      ...relData,
      id: `rel-${Date.now()}`,
    };
    setDocuments((prev) =>
      prev.map((d) => (d.id === relData.sourceDocId ? { ...d, relations: [...d.relations, newRel] } : d))
    );
    logAction(
      'create',
      `Nova relação no Grafo entre [${relData.sourceDocId}] e [${relData.targetDocId}] (${relData.relationType})`,
      relData.sourceDocId
    );
  };

  // Motor de Busca Semântica RAG (Simulação para IA e Knowledge Base)
  const queryRAG = async (query: string): Promise<RAGQueryResult> => {
    setIsQueryingRAG(true);
    logAction('search_rag', `Consulta RAG efetuada: "${query}"`);

    await new Promise((resolve) => setTimeout(resolve, 800));

    const matchedDocs = accessibleDocuments.filter((d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.summary.toLowerCase().includes(query.toLowerCase()) ||
      d.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())) ||
      d.keywords.some((k) => k.toLowerCase().includes(query.toLowerCase()))
    );

    const result: RAGQueryResult = {
      query,
      answer: matchedDocs.length > 0
        ? `Com base na base corporativa de conhecimento, foram localizados ${matchedDocs.length} documentos oficiais com relevância para "${query}". O protocolo recomenda seguir as diretrizes estipuladas na Biblioteca Relacional com auditoria total.`
        : `Nenhum documento restrito coincidiu exatamente com "${query}". A IA Aura recomenda consultar a Biblioteca de POPs ou solicitar autorização de acesso ao Super Administrador.`,
      confidenceScore: matchedDocs.length > 0 ? 0.94 : 0.42,
      relevantDocIds: matchedDocs.map((m) => m.id),
      citationSnippets: matchedDocs.map((m) => ({
        docId: m.id,
        docTitle: m.title,
        snippet: m.summary,
      })),
    };

    setRagResult(result);
    setIsQueryingRAG(false);
    return result;
  };

  return (
    <KnowledgeContext.Provider
      value={{
        documents,
        accessibleDocuments,
        auditLogs,
        metrics,
        selectedCategory,
        setSelectedCategory,
        searchTerm,
        setSearchTerm,
        ragResult,
        isQueryingRAG,
        queryRAG,
        viewDocument,
        addDocument,
        addVersion,
        approveDocument,
        addRelation,
        logAction,
      }}
    >
      {children}
    </KnowledgeContext.Provider>
  );
};

export const useKnowledge = () => {
  const context = useContext(KnowledgeContext);
  if (!context) {
    throw new Error('useKnowledge deve ser usado dentro de um KnowledgeProvider');
  }
  return context;
};
