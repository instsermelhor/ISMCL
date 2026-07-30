import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText, Search, Shield, Archive, Clock, Trash2, Tag, Lock,
  Plus, CheckCircle2, AlertTriangle, Eye, FileCode, Check, RefreshCw,
  FolderOpen, Layers, Key, ShieldAlert, Sparkles, Filter, Download
} from 'lucide-react';
import { cn } from '../utils';
import { useAECM } from '../contexts/AECMContext';
import type {
  ECMDocument, DocumentCategory, SecurityClassification, DocumentStatus,
  SearchFilter
} from '../types/aecm';

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; color: string; bg: string }> = {
  administrative: { label: 'Administrativo', color: 'text-blue-400', bg: 'bg-blue-900/30' },
  assistential: { label: 'Assistencial', color: 'text-teal-400', bg: 'bg-teal-900/30' },
  financial: { label: 'Financeiro', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  legal: { label: 'Jurídico', color: 'text-violet-400', bg: 'bg-violet-900/30' },
  institutional: { label: 'Institucional', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  contract: { label: 'Contrato', color: 'text-pink-400', bg: 'bg-pink-900/30' },
  policy: { label: 'Política', color: 'text-indigo-400', bg: 'bg-indigo-900/30' },
  pop: { label: 'POP', color: 'text-orange-400', bg: 'bg-orange-900/30' },
};

const CLASSIFICATION_CONFIG: Record<SecurityClassification, { label: string; color: string; bg: string; border: string }> = {
  public: { label: 'Público', color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
  internal: { label: 'Uso Interno', color: 'text-blue-400', bg: 'bg-blue-900/20', border: 'border-blue-500/30' },
  restricted: { label: 'Restrito', color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/30' },
  confidential: { label: 'Confidencial', color: 'text-orange-400', bg: 'bg-orange-900/20', border: 'border-orange-500/30' },
  highly_confidential: { label: 'Altamente Confidencial', color: 'text-red-400', bg: 'bg-red-900/20', border: 'border-red-500/30' },
};

export function AECM() {
  const {
    documents, archiveRecords, disposalRecords, retentionRules, auditLog,
    addDocument, addVersion, updateClassification, archiveDocument, disposeDocument, searchDocuments
  } = useAECM();

  const [activeTab, setActiveTab] = useState<'repository' | 'search' | 'security' | 'archive' | 'retention' | 'disposal' | 'governance' | 'audit'>('repository');
  const [selectedDoc, setSelectedDoc] = useState<ECMDocument | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form para novo documento
  const [form, setForm] = useState({
    title: '', description: '', category: 'administrative' as DocumentCategory,
    classification: 'internal' as SecurityClassification, author: '', owner: '', orgUnit: '', keywords: ''
  });

  // Filtros de busca
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({
    query: '', category: 'all', classification: 'all', status: 'all', useOCR: true, useSemanticSearch: true
  });

  const searchResults = useMemo(() => searchDocuments(searchFilter), [searchFilter, searchDocuments]);

  const handleCreateDoc = (e: React.FormEvent) => {
    e.preventDefault();
    addDocument({
      title: form.title,
      description: form.description,
      category: form.category,
      classification: form.classification,
      status: 'published',
      currentVersion: '1.0',
      metadata: {
        author: form.author,
        owner: form.owner,
        orgUnit: form.orgUnit,
        keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      },
      isDigitallySigned: false,
      createdBy: form.author || 'Usuário Sistema',
    });
    setShowAddModal(false);
    setForm({ title: '', description: '', category: 'administrative', classification: 'internal', author: '', owner: '', orgUnit: '', keywords: '' });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0d1117] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#161b22]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-600/20 border border-teal-500/30">
            <Archive className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AECM-KG</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-teal-900/40 text-teal-400 border border-teal-500/30 font-semibold">Prompt 145</span>
            </div>
            <p className="text-xs text-slate-400">Enterprise Content Management, Digital Archives & Knowledge Governance</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-teal-900/20"
        >
          <Plus className="w-4 h-4" /> Novo Documento
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#161b22]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'repository', label: 'Repositório Unificado', icon: FolderOpen },
            { id: 'search', label: 'Pesquisa & OCR', icon: Search },
            { id: 'security', label: 'Classificação & Segurança', icon: ShieldAlert },
            { id: 'archive', label: 'Arquivo Digital', icon: Archive },
            { id: 'retention', label: 'Tabela de Temporalidade', icon: Clock },
            { id: 'disposal', label: 'Descarte Seguro', icon: Trash2 },
            { id: 'governance', label: 'Governança da Informação', icon: Lock },
            { id: 'audit', label: 'Auditoria ECM', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-teal-500 text-teal-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: REPOSITÓRIO UNIFICADO */}
        {activeTab === 'repository' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-teal-400">{documents.length}</div>
                <div className="text-xs text-slate-400 mt-1">Total de Documentos</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{documents.filter(d => d.isDigitallySigned).length}</div>
                <div className="text-xs text-slate-400 mt-1">Assinados Digitalmente</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">{documents.filter(d => d.classification === 'confidential' || d.classification === 'highly_confidential').length}</div>
                <div className="text-xs text-slate-400 mt-1">Confidenciais</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-violet-400">{archiveRecords.length}</div>
                <div className="text-xs text-slate-400 mt-1">No Arquivo Digital</div>
              </div>
            </div>

            <div className="space-y-3">
              {documents.map(doc => {
                const catCfg = CATEGORY_CONFIG[doc.category];
                const secCfg = CLASSIFICATION_CONFIG[doc.classification];
                return (
                  <div key={doc.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-400">{doc.code}</span>
                        <span className="text-sm font-semibold text-white truncate">{doc.title}</span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', catCfg.bg, catCfg.color)}>{catCfg.label}</span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-semibold border', secCfg.bg, secCfg.color, secCfg.border)}>{secCfg.label}</span>
                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-violet-900/30 text-violet-400">v{doc.currentVersion}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{doc.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        <span>Autor: {doc.metadata.author}</span>
                        <span>Proprietário: {doc.metadata.owner}</span>
                        <span>Criado em: {new Date(doc.createdAt).toLocaleDateString('pt-BR')}</span>
                        {doc.isDigitallySigned && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Assinado Digitalmente</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setSelectedDoc(doc)} className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-medium transition-colors flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> Detalhes
                      </button>
                      <button onClick={() => archiveDocument(doc.id, 'Usuário ECM')} className="px-3 py-1.5 rounded-xl bg-amber-600/20 text-amber-400 hover:bg-amber-600/30 text-xs font-medium transition-colors flex items-center gap-1.5 border border-amber-500/30">
                        <Archive className="w-3.5 h-3.5" /> Arquivar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: PESQUISA INTELIGENTE & OCR */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por título, código, conteúdo, OCR ou palavras-chave..."
                  value={searchFilter.query}
                  onChange={e => setSearchFilter(p => ({ ...p, query: e.target.value }))}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm text-white focus:border-teal-500 outline-none"
                />
              </div>

              <div className="flex flex-wrap gap-4 items-center justify-between text-xs text-slate-400">
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={searchFilter.useOCR} onChange={e => setSearchFilter(p => ({ ...p, useOCR: e.target.checked }))} className="accent-teal-500" />
                    Pesquisa OCR de Textos Digitalizados
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={searchFilter.useSemanticSearch} onChange={e => setSearchFilter(p => ({ ...p, useSemanticSearch: e.target.checked }))} className="accent-teal-500" />
                    Busca Semântica IA (Vetorial)
                  </label>
                </div>
                <div>{searchResults.length} documento(s) encontrado(s)</div>
              </div>
            </div>

            <div className="space-y-3">
              {searchResults.map(doc => (
                <div key={doc.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-teal-400">{doc.code}</span>
                      <span className="text-sm font-semibold text-white">{doc.title}</span>
                    </div>
                    <span className="text-xs text-slate-400">{doc.metadata.keywords.join(', ')}</span>
                  </div>
                  <p className="text-xs text-slate-300">{doc.description}</p>
                  {doc.ocrText && (
                    <div className="p-2.5 rounded-lg bg-black/30 text-xs text-slate-400 font-mono">
                      <span className="text-teal-400 font-semibold mr-2">[OCR Extracted]:</span> {doc.ocrText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CLASSIFICAÇÃO & SEGURANÇA */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300">
              Mapeamento das políticas de confidencialidade da informação com integração nativa ao IAM, RBAC, ABAC e MCSI.
            </div>

            <div className="space-y-3">
              {documents.map(doc => {
                const secCfg = CLASSIFICATION_CONFIG[doc.classification];
                return (
                  <div key={doc.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-white">{doc.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Proprietário: {doc.metadata.owner} | Unidade: {doc.metadata.orgUnit}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('px-3 py-1 rounded-full text-xs font-semibold border', secCfg.bg, secCfg.color, secCfg.border)}>{secCfg.label}</span>
                      <select
                        value={doc.classification}
                        onChange={e => updateClassification(doc.id, e.target.value as SecurityClassification)}
                        className="bg-black/40 border border-white/10 rounded-xl text-xs px-2.5 py-1.5 text-white outline-none focus:border-teal-500"
                      >
                        {Object.entries(CLASSIFICATION_CONFIG).map(([key, cfg]) => (
                          <option key={key} value={key}>{cfg.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: ARQUIVO DIGITAL */}
        {activeTab === 'archive' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-teal-900/20 border border-teal-500/30 flex items-center gap-3 text-xs text-teal-300">
              <Archive className="w-5 h-5 shrink-0" />
              Repositório de Preservação Digital de Longo Prazo com verificação de checksums SHA-256 e redundância na nuvem.
            </div>

            <div className="space-y-3">
              {archiveRecords.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm">Nenhum documento no arquivo digital até o momento.</div>
              ) : (
                archiveRecords.map(rec => (
                  <div key={rec.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{rec.documentTitle}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30">Preservação Verificada</span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-4 flex-wrap">
                      <span>Arquivado por: {rec.archivedBy} em {new Date(rec.archivedAt).toLocaleDateString('pt-BR')}</span>
                      <span>Local: {rec.redundancyLocation}</span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 truncate">SHA-256: {rec.checksum}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: TABELA DE TEMPORALIDADE */}
        {activeTab === 'retention' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {retentionRules.map(rule => (
                <div key={rule.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-400">{rule.code}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-white/10 text-slate-300 font-semibold">{rule.finalDestination === 'permanent_guard' ? 'Guarda Permanente' : 'Descarte Programado'}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">{rule.description}</div>
                  <div className="text-xs text-slate-400">Base Legal: {rule.legalBasis}</div>
                  <div className="flex gap-4 text-xs text-slate-400 pt-1">
                    <span>Fase Corrente: {rule.currentPhaseYears} ano(s)</span>
                    <span>Fase Intermediária: {rule.intermediatePhaseYears} ano(s)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: DESCARTE SEGURO */}
        {activeTab === 'disposal' && (
          <div className="space-y-6">
            <div className="space-y-3">
              {disposalRecords.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-sm">Nenhum laudo de descarte emitido ainda.</div>
              ) : (
                disposalRecords.map(disp => (
                  <div key={disp.id} className="p-4 rounded-2xl bg-red-900/10 border border-red-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-red-400">{disp.documentTitle} ({disp.documentCode})</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/40 text-red-300">Descarte Executado</span>
                    </div>
                    <div className="text-xs text-slate-400">Autorizado por: {disp.authorizedBy} | Método: {disp.disposalMethod}</div>
                    <div className="text-xs font-mono text-slate-500">Certificado de Eliminação: {disp.auditCertificateHash}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 7: GOVERNANÇA DA INFORMAÇÃO */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm font-bold text-teal-400">Matriz de Responsabilidade Documental</div>
                <p className="text-xs text-slate-400">Todo documento institucional possui proprietário formal atribuído.</p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <div className="text-sm font-bold text-teal-400">Conformidade com LGPD & MCSI</div>
                <p className="text-xs text-slate-400">Controles de eliminação e restrição integrados à segurança da informação.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDITORIA ECM */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLog.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento registrado ainda.</div>
            ) : (
              auditLog.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-teal-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Documento */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#161b22] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Cadastrar Novo Documento no ECM</h3>
              <form onSubmit={handleCreateDoc} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Título</label>
                  <input type="text" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrição</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Categoria</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as DocumentCategory }))} className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500">
                      {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Classificação de Segurança</label>
                    <select value={form.classification} onChange={e => setForm(p => ({ ...p, classification: e.target.value as SecurityClassification }))} className="w-full bg-[#161b22] border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500">
                      {Object.entries(CLASSIFICATION_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1">Autor</label>
                    <input type="text" value={form.author} onChange={e => setForm(p => ({ ...p, author: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Proprietário</label>
                    <input type="text" value={form.owner} onChange={e => setForm(p => ({ ...p, owner: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Unidade</label>
                    <input type="text" value={form.orgUnit} onChange={e => setForm(p => ({ ...p, orgUnit: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Palavras-chave (separadas por vírgula)</label>
                  <input type="text" value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-teal-500" placeholder="contrato, terceiros, financeiro" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition-colors">Cadastrar Documento</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
