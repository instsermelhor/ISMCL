import React, { useState } from 'react';
import { Search, Plus, Download, Star, Clock, Award, CheckCircle2, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { voluntarios, type Voluntario } from '../../data/cgi-mock';

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  inativo: { label: 'Inativo', color: 'bg-slate-100 text-slate-500', icon: Pause },
  ferias: { label: 'Férias', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={cn('w-3 h-3', s <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')} />
      ))}
      <span className="ml-1 text-xs font-semibold text-slate-600">{value.toFixed(1)}</span>
    </span>
  );
}

export function CGIVoluntarios() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = voluntarios.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: 'Total', value: voluntarios.length, color: 'text-slate-900' },
    { label: 'Ativos', value: voluntarios.filter(v => v.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Horas no Mês', value: `${voluntarios.reduce((s, v) => s + v.horasMes, 0)}h`, color: 'text-teal-600' },
    { label: 'Horas Totais', value: `${voluntarios.reduce((s, v) => s + v.horasTotais, 0)}h`, color: 'text-violet-600' },
  ];

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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou área..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500">
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="ferias">Férias</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Voluntário
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((v, i) => {
          const cfg = statusConfig[v.status];
          const Icon = cfg.icon;
          const isExpanded = expanded === v.id;
          return (
            <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : v.id)}>
                <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
                  {v.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{v.name}</h3>
                    {v.reconhecimento && (
                      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        <Award className="w-3 h-3" />{v.reconhecimento.split('—')[0].trim()}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.area} · {v.horasMes}h este mês · {v.horasTotais}h totais</p>
                </div>
                <div className="flex items-center gap-3">
                  <StarRating value={v.avaliacao} />
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                    <Icon className="w-3.5 h-3.5" />{cfg.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                    className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Admissão', value: v.admissao },
                        { label: 'Horas no Mês', value: `${v.horasMes}h` },
                        { label: 'Horas Totais', value: `${v.horasTotais}h` },
                      ].map(f => (
                        <div key={f.label}>
                          <p className="text-xs text-slate-400">{f.label}</p>
                          <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Projetos</p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.projetos.map(p => (
                          <span key={p} className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700">{p}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-2">Capacitações</p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.capacitacoes.map(c => (
                          <span key={c} className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{c}</span>
                        ))}
                      </div>
                    </div>
                    {v.reconhecimento && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <Award className="w-4 h-4 text-amber-600 shrink-0" />
                        <p className="text-sm font-medium text-amber-800">{v.reconhecimento}</p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">Ver Perfil</button>
                      <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Editar</button>
                      <button className="px-4 py-2 bg-white border border-violet-200 text-violet-700 text-sm font-medium rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-1.5">
                        <Award className="w-4 h-4" /> Reconhecer
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
            Nenhum voluntário encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
