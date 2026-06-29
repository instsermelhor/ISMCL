import React, { useState } from 'react';
import {
  Search, Upload, Download, FileText, CheckCircle2, AlertTriangle,
  Clock, Edit3, Lock, RefreshCw, Plus, Shield, FileSignature,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import { documentos, type Documento, type DocStatus } from '../../data/cgi-mock';

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

export function CGIDocumentos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');

  const categorias = [...new Set(documentos.map(d => d.categoria))];

  const filtered = documentos.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.titulo.toLowerCase().includes(q) || d.responsavel.toLowerCase().includes(q) || d.categoria.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchCat = categoriaFilter === 'all' || d.categoria === categoriaFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const kpis = [
    { label: 'Total', value: documentos.length, color: 'text-slate-900' },
    { label: 'Vigentes', value: documentos.filter(d => d.status === 'vigente').length, color: 'text-emerald-600' },
    { label: 'A Vencer', value: documentos.filter(d => d.status === 'a_vencer').length, color: 'text-amber-600' },
    { label: 'Vencidos', value: documentos.filter(d => d.status === 'vencido').length, color: 'text-red-600' },
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
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
          <option value="all">Todos os status</option>
          <option value="vigente">Vigente</option>
          <option value="a_vencer">A Vencer</option>
          <option value="vencido">Vencido</option>
          <option value="em_revisao">Em Revisão</option>
        </select>
        <select value={categoriaFilter} onChange={e => setCategoriaFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
          <option value="all">Todas as categorias</option>
          {categorias.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Upload className="w-4 h-4" /> Enviar
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
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
                className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  d.status === 'vencido' ? 'bg-red-100' : d.status === 'a_vencer' ? 'bg-amber-100' : 'bg-slate-100')}>
                  <CatIcon className={cn('w-4 h-4', d.status === 'vencido' ? 'text-red-500' : d.status === 'a_vencer' ? 'text-amber-500' : 'text-slate-500')} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{d.titulo}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.categoria} · v{d.versao} · {d.tamanho} · Resp: {d.responsavel}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                  {assinaturaBadge(d)}
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                    <StatusIcon className="w-3 h-3" />{cfg.label}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">Vence: {d.vencimento}</span>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
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
