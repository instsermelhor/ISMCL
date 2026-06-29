import React, { useState } from 'react';
import { Search, Filter, UserPlus, ChevronRight, AlertTriangle, Users, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import { beneficiarios, type Beneficiario } from '../../data/cgi-mock';

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
  inativo: { label: 'Inativo', color: 'bg-slate-100 text-slate-600' },
  em_avaliacao: { label: 'Em Avaliação', color: 'bg-amber-100 text-amber-700' },
  encerrado: { label: 'Encerrado', color: 'bg-rose-100 text-rose-700' },
};

const riskConfig = {
  high: { label: 'Alto', color: 'text-red-600 bg-red-50 border border-red-200' },
  medium: { label: 'Médio', color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  low: { label: 'Baixo', color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
};

export function CGIBeneficiarios() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Beneficiario | null>(null);

  const filtered = beneficiarios.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = b.name.toLowerCase().includes(q) || b.professional.toLowerCase().includes(q) || b.project.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchRisk = riskFilter === 'all' || b.risk === riskFilter;
    return matchSearch && matchStatus && matchRisk;
  });

  const kpis = [
    { label: 'Total', value: beneficiarios.length, color: 'text-slate-900' },
    { label: 'Ativos', value: beneficiarios.filter(b => b.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Em Avaliação', value: beneficiarios.filter(b => b.status === 'em_avaliacao').length, color: 'text-amber-600' },
    { label: 'Alto Risco', value: beneficiarios.filter(b => b.risk === 'high').length, color: 'text-red-600' },
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
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, profissional ou projeto..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500">
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="em_avaliacao">Em Avaliação</option>
          <option value="inativo">Inativo</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500">
          <option value="all">Todos os riscos</option>
          <option value="high">Alto Risco</option>
          <option value="medium">Médio Risco</option>
          <option value="low">Baixo Risco</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> Cadastrar
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{filtered.length} beneficiário(s)</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((b, i) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(selected?.id === b.id ? null : b)}
              className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold text-sm shrink-0">
                {b.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{b.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{b.age} anos · {b.city} · {b.project}</p>
              </div>
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full hidden sm:inline-flex', statusConfig[b.status].color)}>
                {statusConfig[b.status].label}
              </span>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-lg hidden md:inline-flex', riskConfig[b.risk].color)}>
                {riskConfig[b.risk].label}
              </span>
              <p className="text-xs text-slate-400 hidden lg:block w-28 shrink-0">{b.professional.split(' ')[0]} {b.professional.split(' ')[1]}</p>
              <ChevronRight className={cn('w-4 h-4 text-slate-300 transition-transform', selected?.id === b.id && 'rotate-90')} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">Nenhum beneficiário encontrado.</div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-teal-200 shadow-md p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{selected.age} anos · {selected.gender === 'F' ? 'Feminino' : 'Masculino'} · {selected.city}</p>
            </div>
            <div className="flex gap-2">
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusConfig[selected.status].color)}>{statusConfig[selected.status].label}</span>
              <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', riskConfig[selected.risk].color)}>{riskConfig[selected.risk].label} Risco</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
            {[
              { label: 'Projeto', value: selected.project },
              { label: 'Profissional', value: selected.professional },
              { label: 'Documentos', value: `${selected.documents} doc(s)` },
              { label: 'Casos', value: `${selected.cases} caso(s)` },
              { label: 'CPF (mascarado)', value: selected.cpf },
              { label: 'Cadastro', value: selected.registeredAt },
              { label: 'Último Contato', value: selected.lastContact },
            ].map(f => (
              <div key={f.label}>
                <p className="text-xs text-slate-400">{f.label}</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">Ver Prontuário</button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Editar Cadastro</button>
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Histórico</button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
