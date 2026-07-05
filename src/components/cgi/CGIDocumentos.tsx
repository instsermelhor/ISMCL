import React, { useState } from 'react';
import {
  Search, Upload, Download, FileText, CheckCircle2, AlertTriangle,
  Clock, Edit3, Lock, RefreshCw, Plus, Shield, FileSignature, XCircle, Save,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { documentos as defaultDocumentos, type Documento, type DocStatus } from '../../data/cgi-mock';

const docStatusConfig: Record<DocStatus, { label: string; color: string; icon: React.ElementType }> = {
  vigente: { label: 'Vigente', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  a_vencer: { label: 'A Vencer', color: 'bg-amber-100 text-amber-700', icon: Clock },
  em_revisao: { label: 'Em Revisão', color: 'bg-blue-100 text-blue-700', icon: RefreshCw },
};

const categoriaIcons: Record<string, React.ElementType> = {
  'Institucional': FileText,
  'Parcerias': FileText,
  'Clínico': FileSignature,
  'Jurídico': Shield,
  'RH / Profissionais': FileText,
  'Financeiro': FileText,
};

// ─── Modal: Novo/Editar Documento ────────────────────────────
interface DocumentoModalProps {
  documento: Documento | null;
  onClose: () => void;
  onSave: (doc: Documento) => void;
}

function DocumentoModal({ documento, onClose, onSave }: DocumentoModalProps) {
  const isNew = !documento;
  const [titulo, setTitulo] = useState(documento?.titulo ?? '');
  const [categoria, setCategoria] = useState(documento?.categoria ?? 'Institucional');
  const [status, setStatus] = useState<DocStatus>(documento?.status ?? 'vigente');
  const [versao, setVersao] = useState(documento?.versao ?? '1.0');
  const [responsavel, setResponsavel] = useState(documento?.responsavel ?? 'Diretoria');
  const [emissao, setEmissao] = useState(documento?.emissao ?? new Date().toISOString().split('T')[0]);
  const [vencimento, setVencimento] = useState(documento?.vencimento ?? '');
  const [tamanho, setTamanho] = useState(documento?.tamanho ?? '1.5 MB');
  const [assinaturas, setAssinaturas] = useState(documento?.assinaturas ?? 0);
  const [assinaturasNecessarias, setAssinaturasNecessarias] = useState(documento?.assinaturasNecessarias ?? 0);
  const [saved, setSaved] = useState(false);

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all';

  function handleSave() {
    if (!titulo.trim()) return;
    const data: Documento = {
      id: documento?.id ?? `d${Date.now()}`,
      titulo,
      categoria,
      status,
      versao,
      responsavel,
      emissao,
      vencimento: vencimento || '—',
      tamanho,
      assinaturas,
      assinaturasNecessarias,
    };
    onSave(data);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{isNew ? 'Novo Documento' : 'Editar Documento'}</h3>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Título do Documento *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Estatuto Social" className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="Institucional">Institucional</option>
                <option value="Parcerias">Parcerias</option>
                <option value="Clínico">Clínico</option>
                <option value="Jurídico">Jurídico</option>
                <option value="RH / Profissionais">RH / Profissionais</option>
                <option value="Financeiro">Financeiro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as DocStatus)} className={`${inputCls} bg-white`}>
                <option value="vigente">Vigente</option>
                <option value="vencido">Vencido</option>
                <option value="a_vencer">A Vencer</option>
                <option value="em_revisao">Em Revisão</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Versão</label>
              <input type="text" value={versao} onChange={e => setVersao(e.target.value)} placeholder="Ex: 1.0" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Responsável</label>
              <input type="text" value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Ex: Financeiro" className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Emissão</label>
              <input type="date" value={emissao} onChange={e => setEmissao(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Vencimento</label>
              <input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tamanho</label>
              <input type="text" value={tamanho} onChange={e => setTamanho(e.target.value)} placeholder="Ex: 1.2 MB" className={inputCls} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Assinaturas</label>
              <input type="number" min={0} value={assinaturas} onChange={e => setAssinaturas(Number(e.target.value))} className={inputCls} />
            </div>
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Necessárias</label>
              <input type="number" min={0} value={assinaturasNecessarias} onChange={e => setAssinaturasNecessarias(Number(e.target.value))} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> {isNew ? 'Criar Documento' : 'Salvar Alterações'}</>}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────
export function CGIDocumentos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);

  const [documentosList, setDocumentosList] = useState<Documento[]>(() => {
    const saved = localStorage.getItem('cgi_documentos');
    return saved ? JSON.parse(saved) : defaultDocumentos;
  });

  React.useEffect(() => {
    if (!localStorage.getItem('cgi_documentos')) {
      localStorage.setItem('cgi_documentos', JSON.stringify(defaultDocumentos));
    }
  }, []);

  function persist(list: Documento[]) {
    setDocumentosList(list);
    localStorage.setItem('cgi_documentos', JSON.stringify(list));
  }

  function handleSaveDoc(doc: Documento) {
    const exists = documentosList.some(d => d.id === doc.id);
    let updated: Documento[];
    if (exists) {
      updated = documentosList.map(d => d.id === doc.id ? doc : d);
    } else {
      updated = [...documentosList, doc];
    }
    persist(updated);
  }

  function handleDownload(doc: Documento) {
    alert(`Iniciando download do documento: ${doc.titulo} (${doc.tamanho})`);
  }

  function handleExportAll() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(documentosList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "documentos_institucionais.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  const categorias = [...new Set(documentosList.map(d => d.categoria))];

  const filtered = documentosList.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.titulo.toLowerCase().includes(q) || d.responsavel.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchCat = categoriaFilter === 'all' || d.categoria === categoriaFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const kpis = [
    { label: 'Total', value: documentosList.length, color: 'text-slate-900' },
    { label: 'Vigentes', value: documentosList.filter(d => d.status === 'vigente').length, color: 'text-emerald-600' },
    { label: 'A Vencer', value: documentosList.filter(d => d.status === 'a_vencer').length, color: 'text-amber-600' },
    { label: 'Vencidos', value: documentosList.filter(d => d.status === 'vencido').length, color: 'text-red-600' },
  ];

  function assinaturaBadge(doc: Documento) {
    const done = doc.assinaturas >= doc.assinaturasNecessarias && doc.assinaturasNecessarias > 0;
    const partial = doc.assinaturas > 0 && !done;
    if (doc.assinaturasNecessarias === 0) return null;
    return (
      <span className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1',
        done ? 'bg-teal-100 text-teal-700' : partial ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
      )}>
        <FileSignature className="w-3 h-3" />
        {doc.assinaturas}/{doc.assinaturasNecessarias}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modal */}
      <AnimatePresence>
        {(modalOpen || selectedDoc) && (
          <DocumentoModal
            documento={selectedDoc}
            onClose={() => { setModalOpen(false); setSelectedDoc(null); }}
            onSave={handleSaveDoc}
          />
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar documento, responsável..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm outline-none">
          <option value="all">Todos os status</option>
          <option value="vigente">Vigente</option>
          <option value="a_vencer">A Vencer</option>
          <option value="vencido">Vencido</option>
          <option value="em_revisao">Em Revisão</option>
        </select>
        <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm outline-none">
          <option value="all">Todas as categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button onClick={handleExportAll} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Documento
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{filtered.length} documento(s)</span>
          <Lock className="w-4 h-4 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((d, i) => {
            const cfg = docStatusConfig[d.status];
            const StatusIcon = cfg.icon;
            const CatIcon = categoriaIcons[d.categoria] ?? FileText;
            return (
              <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setSelectedDoc(d)}>
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  d.status === 'vencido' ? 'bg-red-100' : d.status === 'a_vencer' ? 'bg-amber-100' : 'bg-slate-100')}>
                  <CatIcon className={cn('w-4 h-4', d.status === 'vencido' ? 'text-red-500' : d.status === 'a_vencer' ? 'text-amber-500' : 'text-slate-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{d.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.categoria} · v{d.versao} · {d.tamanho} · Resp: {d.responsavel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end" onClick={e => e.stopPropagation()}>
                  {assinaturaBadge(d)}
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">Vence: {d.vencimento}</span>
                  <button onClick={() => handleDownload(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setSelectedDoc(d)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-650 transition-colors" title="Editar">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">Nenhum documento encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
