import React, { useState } from 'react';
import { Search, Plus, AlertTriangle, CheckCircle2, Clock, Download, ShieldCheck, ShieldX } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../utils';
import { profissionais, type Profissional } from '../../data/cgi-mock';

const statusConfig = {
  ativo: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700', icon: ShieldX },
  ferias: { label: 'Férias', color: 'bg-blue-100 text-blue-700', icon: Clock },
};

const tipoConfig = {
  voluntario: { label: 'Voluntário', color: 'bg-violet-100 text-violet-700' },
  colaborador: { label: 'Colaborador', color: 'bg-teal-100 text-teal-700' },
};

function isRegistroVencido(validade: string) {
  return new Date(validade) < new Date();
}

function isRegistroProximoVencer(validade: string) {
  const diff = new Date(validade).getTime() - Date.now();
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 60; // 60 dias
}

export function CGIProfissionais() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profissional | null>(null);

  const filtered = profissionais.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(search.toLowerCase()) ||
    p.registro.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    { label: 'Total', value: profissionais.length },
    { label: 'Ativos', value: profissionais.filter(p => p.status === 'ativo').length },
    { label: 'Suspensos', value: profissionais.filter(p => p.status === 'suspenso').length },
    { label: 'Registros Vencidos', value: profissionais.filter(p => isRegistroVencido(p.registroValidade)).length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={cn('bg-white rounded-2xl p-4 border shadow-sm', i === 3 && kpis[3].value > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200')}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold', i === 3 && k.value > 0 ? 'text-red-600' : 'text-slate-900')}>{k.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, especialidade ou registro..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Profissional
        </button>
      </div>

      <div className="space-y-3">
        {filtered.map((p, i) => {
          const vencido = isRegistroVencido(p.registroValidade);
          const proxVencer = !vencido && isRegistroProximoVencer(p.registroValidade);
          const cfg = statusConfig[p.status];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(selected?.id === p.id ? null : p)}
              className={cn(
                'bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all',
                vencido ? 'border-red-200' : proxVencer ? 'border-amber-200' : 'border-slate-200'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                  {p.name.split(' ').filter((_,i)=>i>0).slice(0,2).map(w=>w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', tipoConfig[p.tipo].color)}>{tipoConfig[p.tipo].label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{p.especialidade} · {p.registro}</p>
                </div>
                <div className="flex items-center gap-2">
                  {vencido && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      <AlertTriangle className="w-3 h-3" /> Registro Vencido
                    </span>
                  )}
                  {proxVencer && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3" /> Vence em breve
                    </span>
                  )}
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                    <Icon className="w-3.5 h-3.5" />{cfg.label}
                  </span>
                </div>
              </div>

              {selected?.id === p.id && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {[
                      { label: 'Validade do Registro', value: p.registroValidade },
                      { label: 'Atend. no Mês', value: p.atendimentosMes },
                      { label: 'Horas no Mês', value: `${p.horasMes}h` },
                      { label: 'Admissão', value: p.admissao },
                      { label: 'Email', value: p.email },
                      { label: 'Telefone', value: p.phone },
                      { label: 'Projetos', value: p.projetos.join(', ') },
                    ].map(f => (
                      <div key={f.label}>
                        <p className="text-xs text-slate-400">{f.label}</p>
                        <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">Ver Perfil</button>
                    {p.status === 'suspenso' ? (
                      <button className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Reativar Acesso
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5">
                        <ShieldX className="w-4 h-4" /> Suspender
                      </button>
                    )}
                    <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Editar</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
