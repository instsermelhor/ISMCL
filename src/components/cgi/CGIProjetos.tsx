import React, { useState } from 'react';
import {
  Plus, Search, Calendar, Users, Target, DollarSign,
  ChevronDown, ChevronUp, BarChart2, Tag, Clock, CheckCircle2,
  PauseCircle, AlertCircle, Download, X, Save, Kanban, List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { projetos, type ProjetoSocial } from '../../data/cgi-mock';

const statusConfig: Record<ProjetoSocial['status'], { label: string; color: string; icon: React.ElementType }> = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  planejamento: { label: 'Planejamento', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
  concluido: { label: 'Concluído', color: 'bg-teal-100 text-teal-700 border-teal-200', icon: CheckCircle2 },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700 border-red-200', icon: PauseCircle },
};

const kanbanColumns: { id: ProjetoSocial['status']; label: string; color: string }[] = [
  { id: 'planejamento', label: 'Planejamento', color: 'border-blue-400' },
  { id: 'ativo', label: 'Em Andamento', color: 'border-emerald-400' },
  { id: 'suspenso', label: 'Suspenso', color: 'border-red-400' },
  { id: 'concluido', label: 'Concluído', color: 'border-teal-400' },
];

function ProgressBar({ value, color = '#0d9488' }: { value: number; color?: string }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

// ─── Create Project Modal ─────────────────────────────────────
function ProjectModal({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    nome: '', descricao: '', coordenador: '', inicio: '', fim: '',
    orcamento: '', publicoAlvo: '', objetivos: '',
    fontes: '', equipe: '',
    tags: '',
  });

  function handleSave() {
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1200);
  }

  function Field({ label, name, type = 'text', placeholder = '', multiline = false }: {
    label: string; name: keyof typeof form; type?: string; placeholder?: string; multiline?: boolean;
  }) {
    return (
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1 block">{label}</label>
        {multiline ? (
          <textarea
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            placeholder={placeholder}
            rows={3}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
          />
        ) : (
          <input
            type={type}
            value={form[name]}
            onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
            placeholder={placeholder}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-base font-bold text-slate-900">Novo Projeto Social</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          <Field label="Nome do Projeto *" name="nome" placeholder="Ex: Projeto Conexão Familiar" />
          <Field label="Descrição" name="descricao" placeholder="Objetivo e escopo do projeto..." multiline />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Coordenador *" name="coordenador" placeholder="Ex: Dra. Fernanda Lima" />
            <Field label="Orçamento Previsto (R$)" name="orcamento" type="number" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Início" name="inicio" type="date" />
            <Field label="Data de Término Previsto" name="fim" type="date" />
          </div>
          <Field label="Público-Alvo" name="publicoAlvo" placeholder="Descreva o público beneficiário..." multiline />
          <Field label="Objetivos (um por linha)" name="objetivos" placeholder="Objetivo 1&#10;Objetivo 2..." multiline />
          <Field label="Fontes de Recursos" name="fontes" placeholder="Ex: Editais, doações, patrocínios..." />
          <Field label="Equipe Inicial (separar por vírgula)" name="equipe" placeholder="Ex: Dr. João Paulo, Ana Beatriz" />
          <Field label="Tags (separar por vírgula)" name="tags" placeholder="Ex: Saúde Mental, Mulheres, Psicologia" />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
          <button onClick={handleSave}
            className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Criado!</> : <><Save className="w-4 h-4" /> Criar Projeto</>}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────
function KanbanCard({ p }: { p: ProjetoSocial }) {
  const cfg = statusConfig[p.status];
  const captacaoPct = p.orcamento > 0 ? Math.round((p.captado / p.orcamento) * 100) : 0;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all cursor-pointer space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-bold text-slate-900">{p.nome}</p>
        <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border shrink-0', cfg.color)}>
          {p.progresso}%
        </span>
      </div>
      <p className="text-xs text-slate-500 line-clamp-2">{p.descricao}</p>
      <ProgressBar value={p.progresso} />
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{p.coordenador.split(' ').slice(0, 2).join(' ')}</span>
        <span>{p.beneficiariosAtivos}/{p.beneficiariosAlvo} benef.</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-teal-600 font-semibold">{formatBRL(p.captado)}</span>
        <span className="text-slate-400">de {formatBRL(p.orcamento)} ({captacaoPct}%)</span>
      </div>
      {p.tags.slice(0, 2).map(t => (
        <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 mr-1">
          <Tag className="w-3 h-3" />{t}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export function CGIProjetos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [showModal, setShowModal] = useState(false);

  const filtered = projetos.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q) || p.coordenador.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: 'Total de Projetos', value: projetos.length, color: 'text-slate-900' },
    { label: 'Ativos', value: projetos.filter(p => p.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Beneficiários Ativos', value: projetos.reduce((s, p) => s + p.beneficiariosAtivos, 0), color: 'text-teal-600' },
    { label: 'Total Captado', value: formatBRL(projetos.reduce((s, p) => s + p.captado, 0)), color: 'text-violet-600' },
  ];

  return (
    <>
      <AnimatePresence>
        {showModal && <ProjectModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>

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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar projeto, coordenador..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm">
            <option value="all">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="planejamento">Planejamento</option>
            <option value="concluido">Concluído</option>
            <option value="suspenso">Suspenso</option>
          </select>
          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <button onClick={() => setViewMode('list')}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors',
                viewMode === 'list' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50')}>
              <List className="w-4 h-4" /> Lista
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={cn('flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors border-l border-slate-200',
                viewMode === 'kanban' ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50')}>
              <Kanban className="w-4 h-4" /> Kanban
            </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Relatório
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>

        {/* ── Kanban View ────────────────────────── */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map(col => {
              const colItems = projetos.filter(p => p.status === col.id && (
                statusFilter === 'all' || p.status === statusFilter
              ) && (
                !search || p.nome.toLowerCase().includes(search.toLowerCase())
              ));
              return (
                <div key={col.id} className={cn('rounded-2xl border-t-4 bg-slate-50 border border-t-current p-3 space-y-3', col.color)}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{col.label}</p>
                    <span className="text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      {colItems.length}
                    </span>
                  </div>
                  {colItems.map(p => <KanbanCard key={p.id} p={p} />)}
                  {colItems.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Nenhum projeto</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── List View ──────────────────────────── */}
        {viewMode === 'list' && (
          <div className="space-y-3">
            {filtered.map((p, i) => {
              const cfg = statusConfig[p.status];
              const Icon = cfg.icon;
              const isExp = expanded === p.id;
              const captacaoPct = p.orcamento > 0 ? Math.round((p.captado / p.orcamento) * 100) : 0;
              const benefPct = p.beneficiariosAlvo > 0 ? Math.round((p.beneficiariosAtivos / p.beneficiariosAlvo) * 100) : 0;

              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header */}
                  <div className="p-5 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isExp ? null : p.id)}>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                        <BarChart2 className="w-5 h-5 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-sm font-bold text-slate-900">{p.nome}</h3>
                          <span className={cn('flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border', cfg.color)}>
                            <Icon className="w-3 h-3" />{cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-1">{p.descricao}</p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400">Progresso geral</span>
                            <span className="text-xs font-semibold text-slate-700">{p.progresso}%</span>
                          </div>
                          <ProgressBar value={p.progresso} />
                        </div>
                      </div>
                      <div className="shrink-0 ml-2">
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          {[
                            { icon: Users, label: 'Coordenador', value: p.coordenador },
                            { icon: Calendar, label: 'Início', value: p.inicio },
                            { icon: Calendar, label: 'Término', value: p.fim },
                            { icon: DollarSign, label: 'Orçamento', value: formatBRL(p.orcamento) },
                          ].map(f => (
                            <div key={f.label} className="space-y-0.5">
                              <p className="text-xs text-slate-400">{f.label}</p>
                              <p className="text-sm font-medium text-slate-800">{f.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Público-Alvo */}
                        {p.publicoAlvo && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Público-Alvo</p>
                            <p className="text-sm text-slate-700">{p.publicoAlvo}</p>
                          </div>
                        )}

                        {/* Objetivos */}
                        {p.objetivos && p.objetivos.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-1.5">Objetivos</p>
                            <ul className="space-y-1">
                              {p.objetivos.map((obj, oi) => (
                                <li key={oi} className="flex items-start gap-2 text-xs text-slate-700">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Captação */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-teal-500" />
                              <span className="text-xs font-medium text-slate-700">Captação de Recursos</span>
                            </div>
                            <span className="text-xs font-semibold text-teal-700">{formatBRL(p.captado)} / {formatBRL(p.orcamento)} ({captacaoPct}%)</span>
                          </div>
                          <ProgressBar value={captacaoPct} color="#0d9488" />
                          {p.fontes && p.fontes.length > 0 && (
                            <p className="text-xs text-slate-400 mt-1">Fontes: {Array.isArray(p.fontes) ? p.fontes.join(', ') : p.fontes}</p>
                          )}
                        </div>

                        {/* Beneficiários */}
                        {p.beneficiariosAlvo > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-violet-500" />
                                <span className="text-xs font-medium text-slate-700">Meta de Beneficiários</span>
                              </div>
                              <span className="text-xs font-semibold text-violet-700">{p.beneficiariosAtivos} / {p.beneficiariosAlvo} ({benefPct}%)</span>
                            </div>
                            <ProgressBar value={benefPct} color="#8b5cf6" />
                          </div>
                        )}

                        {/* Resultados */}
                        {p.resultados && (
                          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                            <p className="text-xs font-semibold text-emerald-700 mb-1">Resultados</p>
                            <p className="text-xs text-emerald-700">{p.resultados}</p>
                          </div>
                        )}

                        {/* Equipe */}
                        {p.equipe.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-400 mb-2">Equipe</p>
                            <div className="flex flex-wrap gap-1.5">
                              {p.equipe.map(m => (
                                <span key={m} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{m}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Tags</p>
                          <div className="flex flex-wrap gap-1.5">
                            {p.tags.map(t => (
                              <span key={t} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                <Tag className="w-3 h-3" />{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Alert for behind-target */}
                        {benefPct < 70 && p.status === 'ativo' && p.beneficiariosAlvo > 0 && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">Meta de beneficiários abaixo do esperado ({benefPct}%). Revisão recomendada.</p>
                          </div>
                        )}

                        <div className="flex gap-3 pt-1">
                          <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">Gerenciar</button>
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Editar</button>
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Prestação de Contas</button>
                          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Relatório</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
                Nenhum projeto encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
