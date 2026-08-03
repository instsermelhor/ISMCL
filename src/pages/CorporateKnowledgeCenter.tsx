import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  Search,
  Network,
  Shield,
  FileText,
  Lock,
  GitBranch,
  Brain,
  History,
  CheckCircle2,
  AlertTriangle,
  Download,
  Eye,
  PlusCircle,
  Clock,
  User,
  Tag,
  Share2,
  FileCheck,
  Building,
  Sparkles,
  BarChart3,
  ListFilter,
  Check,
} from 'lucide-react';
import { useKnowledge } from '../contexts/KnowledgeContext';
import { KNOWLEDGE_CATEGORIES_INFO } from '../data/knowledge-mock';
import type { KnowledgeCategory, SecurityClassification, KnowledgeDocument } from '../types/knowledge';
import { useIAM } from '../contexts/IAMContext';

type TabType = 'libraries' | 'graph' | 'rag' | 'versioning' | 'audit' | 'metrics';

const CLASSIFICATION_STYLES: Record<SecurityClassification, { label: string; bg: string; text: string; border: string }> = {
  publica: { label: 'Pública', bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  interna: { label: 'Interna', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  confidencial: { label: 'Confidencial', bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  restrita: { label: 'Restrita (C-Level)', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
};

export default function CorporateKnowledgeCenter() {
  const { currentUser } = useIAM();
  const {
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
    approveDocument,
    addRelation,
  } = useKnowledge();

  const [activeTab, setActiveTab] = useState<TabType>('libraries');
  const [selectedDocForModal, setSelectedDocForModal] = useState<KnowledgeDocument | null>(null);
  const [ragInput, setRagInput] = useState('');
  
  // Novo Documento Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDocData, setNewDocData] = useState({
    code: 'DOC-NEW-001',
    title: '',
    summary: '',
    fullContent: '',
    category: 'relacional' as KnowledgeCategory,
    department: 'Diretoria Técnica',
    classification: 'interna' as SecurityClassification,
    tags: 'Geral, POP',
    keywords: 'documento, novo',
  });

  // Grafo Modal State
  const [showRelationModal, setShowRelationModal] = useState(false);
  const [sourceDocId, setSourceDocId] = useState('');
  const [targetDocId, setTargetDocId] = useState('');
  const [relationType, setRelationType] = useState<'fundamenta' | 'regulamenta' | 'deriva_de' | 'complementa'>('fundamenta');

  // Filtragem dos documentos
  const filteredDocs = accessibleDocuments.filter((doc) => {
    const matchCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchSearch =
      searchTerm === '' ||
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const handleRAGSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ragInput.trim()) return;
    queryRAG(ragInput);
  };

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocData.title.trim()) return;
    addDocument({
      code: newDocData.code || `DOC-${Date.now().toString().slice(-4)}`,
      title: newDocData.title,
      summary: newDocData.summary || 'Resumo do documento corporativo.',
      fullContent: newDocData.fullContent || newDocData.summary,
      category: newDocData.category,
      department: newDocData.department,
      classification: newDocData.classification,
      status: 'draft',
      currentVersion: '1.0',
      allowedRoles: ['super_admin', 'director', 'manager', 'coordinator', 'professional'],
      tags: newDocData.tags.split(',').map((t) => t.trim()),
      keywords: newDocData.keywords.split(',').map((k) => k.trim()),
      author: currentUser?.name ?? 'Super Admin',
      authorRole: currentUser?.roles[0] ?? 'super_admin',
      downloadAllowed: true,
      watermarkRequired: newDocData.classification === 'confidencial' || newDocData.classification === 'restrita',
      printAllowed: false,
    });
    setShowAddModal(false);
    setNewDocData({
      code: 'DOC-NEW-001',
      title: '',
      summary: '',
      fullContent: '',
      category: 'relacional',
      department: 'Diretoria Técnica',
      classification: 'interna',
      tags: 'Geral, POP',
      keywords: 'documento, novo',
    });
  };

  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceDocId || !targetDocId) return;
    const targetDoc = accessibleDocuments.find((d) => d.id === targetDocId);
    if (!targetDoc) return;
    addRelation({
      sourceDocId,
      targetDocId,
      targetTitle: targetDoc.title,
      relationType,
      description: `Relação ${relationType} estabelecida via Centro Corporativo de Conhecimento.`,
    });
    setShowRelationModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-8 font-sans">
      {/* ── HEADER INSTITUCIONAL (PROMPT 179) ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25">
              <Network className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Centro Corporativo de Conhecimento
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  PROMPT 179 · RBAC/ABAC
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Biblioteca Relacional Corporativa, Repositório Digital, Motor RAG e Grafo de Conhecimento da Plataforma Aura
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Cadastrar Documento
          </button>
        </div>
      </div>

      {/* ── TAB BAR NAVEGAÇÃO ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'libraries', label: '📚 18 Bibliotecas Corporativas', icon: BookOpen },
          { id: 'graph', label: '🕸️ Grafo Relacional de Conhecimento', icon: Network },
          { id: 'rag', label: '🔍 Pesquisa Inteligente & Engine RAG', icon: Brain },
          { id: 'versioning', label: '📜 Versionamento & Governança', icon: History },
          { id: 'audit', label: '🔒 Trilha de Auditoria Imutável', icon: Shield },
          { id: 'metrics', label: '📊 Dashboards & Indicadores', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── CONTEÚDO DAS ABAS ────────────────────────────────────────── */}

      {/* TAB 1: 📚 18 BIBLIOTECAS CORPORATIVAS */}
      {activeTab === 'libraries' && (
        <div className="space-y-6">
          {/* Filtros e Busca */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por título, código, palavras-chave ou tags corporativas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto custom-scrollbar pb-1 md:pb-0">
              <ListFilter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as KnowledgeCategory | 'all')}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
              >
                <option value="all">Todas as 18 Bibliotecas</option>
                {Object.entries(KNOWLEDGE_CATEGORIES_INFO).map(([key, cat]) => (
                  <option key={key} value={key}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid de Atalhos para as 18 Categorias */}
          {selectedCategory === 'all' && !searchTerm && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(KNOWLEDGE_CATEGORIES_INFO).map(([key, cat]) => {
                const count = accessibleDocuments.filter((d) => d.category === key).length;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedCategory(key as KnowledgeCategory)}
                    className="p-3.5 rounded-2xl bg-slate-900/40 border border-slate-800/80 hover:border-violet-500/40 hover:bg-slate-900 text-left transition-all group cursor-pointer"
                  >
                    <div className="text-2xl mb-1.5">{cat.icon}</div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-violet-300 truncate">
                      {cat.label}
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-1">{count} documentos</p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Lista de Documentos Filtrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const catInfo = KNOWLEDGE_CATEGORIES_INFO[doc.category];
              const classStyle = CLASSIFICATION_STYLES[doc.classification];
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl bg-slate-900/40 border border-slate-800/80 p-5 flex flex-col justify-between hover:border-violet-500/30 transition-all space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                        {doc.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${classStyle.bg} ${classStyle.text} ${classStyle.border}`}
                      >
                        {classStyle.label}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-2">{doc.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-3">{doc.summary}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-2.5 h-2.5 text-slate-400" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-2 text-[11px]">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate max-w-[120px]">{doc.author}</span>
                      <span className="text-slate-600">• v{doc.currentVersion}</span>
                    </div>

                    <button
                      onClick={() => {
                        viewDocument(doc.id);
                        setSelectedDocForModal(doc);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20 hover:bg-violet-600 text-violet-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Visualizar
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: 🕸️ GRAFO RELACIONAL DE CONHECIMENTO (PROMPT 179 ETAPA 8) */}
      {activeTab === 'graph' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-violet-400" />
                  Grafo Relacional Ontológico de Conhecimento
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Nodos e conexões entre documentos oficiais, protocolos clínicos, legislação Maria da Penha, POPs e intervenções assistenciais.
                </p>
              </div>
              <button
                onClick={() => setShowRelationModal(true)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                <GitBranch className="w-4 h-4" />
                Criar Nova Conexão no Grafo
              </button>
            </div>

            {/* Simulação Visual do Grafo de Nodos */}
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800/80 min-h-[380px] relative overflow-hidden flex flex-col justify-center items-center">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px]" />

              <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Node Origem Principal */}
                <div className="p-4 rounded-2xl bg-violet-950/60 border border-violet-500/40 text-center space-y-2 shadow-xl shadow-violet-950/40">
                  <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/20 px-2 py-0.5 rounded">
                    DOC-REL-001
                  </span>
                  <h4 className="text-xs font-extrabold text-white">Matriz Intersetorial de Atendimento</h4>
                  <p className="text-[10px] text-slate-400">Grafo Mãe de Conexões</p>
                </div>

                {/* Conexões / Arestas */}
                <div className="space-y-3 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-violet-300 bg-slate-900 border border-violet-500/30 px-3 py-1 rounded-full">
                    <span>fundamenta</span>
                    <Share2 className="w-3 h-3 text-violet-400" />
                  </div>
                  <div className="w-full h-0.5 bg-gradient-to-r from-violet-500 to-pink-500" />
                  <div className="flex items-center gap-2 text-[10px] font-mono text-pink-300 bg-slate-900 border border-pink-500/30 px-3 py-1 rounded-full">
                    <span>regulamenta</span>
                    <Share2 className="w-3 h-3 text-pink-400" />
                  </div>
                </div>

                {/* Nodes Destino */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-pink-500/30 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-pink-400">POP-CLI-005</span>
                    <p className="text-xs font-bold text-white">Escuta Ativa e Manejo de Crise</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-400">DOC-JUR-002</span>
                    <p className="text-xs font-bold text-white">Juizado de Violência Doméstica</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 🔍 BUSCA INTELIGENTE & MOTOR RAG (PROMPT 179 ETAPA 9) */}
      {activeTab === 'rag' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-cyan-400" />
                Motor de Busca Semântica RAG & Assistente Institucional
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Recuperação de Informação Auditada (RAG) com citações exatas de normativos, POPs e artigos científicos.
              </p>
            </div>

            <form onSubmit={handleRAGSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Faça uma pergunta sobre procedimentos, prazos ou condutas técnicas..."
                  value={ragInput}
                  onChange={(e) => setRagInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
              <button
                type="submit"
                disabled={isQueryingRAG}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isQueryingRAG ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Consultar RAG
                  </>
                )}
              </button>
            </form>

            {/* Resultado RAG */}
            {ragResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Resposta Sintetizada pela IA Aura (RAG Engine)
                  </span>
                  <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Confiança: {(ragResult.confidenceScore * 100).toFixed(0)}%
                  </span>
                </div>

                <p className="text-xs text-slate-200 leading-relaxed">{ragResult.answer}</p>

                <div className="space-y-2 pt-2 border-t border-cyan-500/20">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Fontes Auditadas e Citações Oficiais:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ragResult.citationSnippets.map((c) => (
                      <div key={c.docId} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <p className="font-bold text-violet-300">{c.docTitle}</p>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{c.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: 📜 VERSIONAMENTO & GOVERNANÇA (PROMPT 179 ETAPA 7) */}
      {activeTab === 'versioning' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              Controle Estrito de Versionamento e Histórico de Aprovações
            </h3>
            <p className="text-xs text-slate-400">
              Nenhuma versão anterior de documento é sobrescrita. Todos os registros mantêm auditoria imutável de autores e vigências.
            </p>

            <div className="space-y-4 pt-2">
              {accessibleDocuments.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {doc.code}
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">{doc.title}</h4>
                    </div>
                    {doc.status === 'draft' && (
                      <button
                        onClick={() => approveDocument(doc.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aprovar Documento
                      </button>
                    )}
                  </div>

                  {/* Histórico de Versões */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <p className="text-[11px] font-bold text-slate-400">Histórico de Versões:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {doc.versions.map((ver) => (
                        <div key={ver.versionNumber} className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg text-xs">
                          <div className="flex items-center gap-3">
                            <span className="font-mono font-bold text-amber-300">v{ver.versionNumber}</span>
                            <span className="text-slate-300">{ver.changelog}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Por: {ver.createdBy} em {new Date(ver.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: 🔒 TRILHA DE AUDITORIA IMUTÁVEL (PROMPT 179 ETAPA 12) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Trilha de Auditoria Imutável (Logs de Acesso e Operações)
            </h3>
            <p className="text-xs text-slate-400">
              Registros criptografados de visualizações, downloads, pesquisas RAG, uploads e alterações de permissão.
            </p>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Usuário &amp; Perfil</th>
                    <th className="p-3">Ação</th>
                    <th className="p-3">Documento / Detalhes</th>
                    <th className="p-3">IP / Origem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-white">{log.userName}</div>
                        <div className="text-[10px] text-violet-400 uppercase font-semibold">{log.userRole}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-200 line-clamp-1">{log.documentTitle ?? log.details}</div>
                        {log.documentId && <div className="text-[10px] text-slate-500 font-mono">ID: {log.documentId}</div>}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[11px]">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 📊 DASHBOARDS & METRICAS (PROMPT 179 ETAPA 13) */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Total de Documentos</p>
              <h3 className="text-2xl font-black text-white">{metrics.totalDocuments}</h3>
              <span className="text-[10px] text-violet-400 font-semibold">18 Bibliotecas Ativas</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Visualizações Totais</p>
              <h3 className="text-2xl font-black text-emerald-400">{metrics.totalViews}</h3>
              <span className="text-[10px] text-emerald-500 font-semibold">Auditoria Rastreável</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Downloads Auditados</p>
              <h3 className="text-2xl font-black text-cyan-400">{metrics.totalDownloads}</h3>
              <span className="text-[10px] text-cyan-500 font-semibold">Com Marca d'Água</span>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1">
              <p className="text-xs text-slate-400">Consultas RAG / IA</p>
              <h3 className="text-2xl font-black text-pink-400">{metrics.ragQueryCount}</h3>
              <span className="text-[10px] text-pink-500 font-semibold">Respostas Sintetizadas</span>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CADASTRAR DOCUMENTO ──────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-xl space-y-4 text-left">
            <h3 className="text-base font-bold text-white">Cadastrar Novo Documento Corporativo</h3>

            <form onSubmit={handleCreateDoc} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Código Identificador</label>
                <input
                  type="text"
                  value={newDocData.code}
                  onChange={(e) => setNewDocData({ ...newDocData, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título do Documento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: POP-CLI-010: Diretrizes de Atendimento Urgente..."
                  value={newDocData.title}
                  onChange={(e) => setNewDocData({ ...newDocData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={newDocData.category}
                    onChange={(e) => setNewDocData({ ...newDocData, category: e.target.value as KnowledgeCategory })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                  >
                    {Object.entries(KNOWLEDGE_CATEGORIES_INFO).map(([key, cat]) => (
                      <option key={key} value={key}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Classificação LGPD/Segurança</label>
                  <select
                    value={newDocData.classification}
                    onChange={(e) => setNewDocData({ ...newDocData, classification: e.target.value as SecurityClassification })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
                  >
                    <option value="publica">Pública</option>
                    <option value="interna">Interna</option>
                    <option value="confidencial">Confidencial</option>
                    <option value="restrita">Restrita (C-Level)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resumo Executivo</label>
                <textarea
                  rows={3}
                  value={newDocData.summary}
                  onChange={(e) => setNewDocData({ ...newDocData, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs hover:bg-violet-500 cursor-pointer"
                >
                  Salvar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VISUALIZAR DOCUMENTO DETALHADO ───────────────────────── */}
      {selectedDocForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded">
                  {selectedDocForModal.code}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedDocForModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
                {selectedDocForModal.fullContent || selectedDocForModal.summary}
              </p>

              <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400">
                <div>
                  <strong>Autor:</strong> {selectedDocForModal.author} ({selectedDocForModal.authorRole})
                </div>
                <div>
                  <strong>Versão Atual:</strong> v{selectedDocForModal.currentVersion}
                </div>
                <div>
                  <strong>Departamento:</strong> {selectedDocForModal.department}
                </div>
                <div>
                  <strong>Aprovador:</strong> {selectedDocForModal.approver ?? 'Em aprovação'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDocForModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
