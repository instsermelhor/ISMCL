import React, { useState, useMemo } from 'react';
import {
  Search, Plus, AlertTriangle, CheckCircle2, Clock, Download,
  ShieldCheck, ShieldX, XCircle, Eye, Edit3, Mail, Phone,
  Calendar, Briefcase, BarChart2, FolderOpen, Award, Save,
  User, Hash, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { profissionais as profissionaisMock, type Profissional } from '../../data/cgi-mock';

// ─── Catálogo do ecossistema ──────────────────────────────────

/** Especialidades pré-cadastradas na plataforma */
const ESPECIALIDADES_PLATAFORMA = [
  'Psicologia Clínica',
  'Psicologia Organizacional',
  'Psicologia Escolar',
  'Psicologia Forense',
  'Psiquiatria',
  'Neuropsicologia',
  'Assistência Social',
  'Serviço Social',
  'Gerontologia',
  'Terapia Ocupacional',
  'Fonoaudiologia',
  'Fisioterapia',
  'Nutrição',
  'Medicina Clínica',
  'Medicina do Trabalho',
  'Enfermagem',
  'Direito',
  'Direito de Família',
  'Advocacia',
  'Pedagogia',
  'Educação Especial',
  'Contabilidade',
  'Administração',
  'Comunicação Social',
  'Tecnologia da Informação',
];

/** Conselhos profissionais pré-cadastrados */
const CONSELHOS_PLATAFORMA = [
  { sigla: 'CRP',     label: 'CRP — Conselho Regional de Psicologia' },
  { sigla: 'CRM',     label: 'CRM — Conselho Regional de Medicina' },
  { sigla: 'CRESS',   label: 'CRESS — Conselho Regional de Serviço Social' },
  { sigla: 'OAB',     label: 'OAB — Ordem dos Advogados do Brasil' },
  { sigla: 'COREN',   label: 'COREN — Conselho Regional de Enfermagem' },
  { sigla: 'CREFITO', label: 'CREFITO — Conselho de Fisioterapia e Terapia Ocupacional' },
  { sigla: 'CFN',     label: 'CFN — Conselho Federal de Nutrição' },
  { sigla: 'CRO',     label: 'CRO — Conselho Regional de Odontologia' },
  { sigla: 'CRFA',    label: 'CRFA — Conselho de Fonoaudiologia' },
  { sigla: 'CFC',     label: 'CFC — Conselho Federal de Contabilidade' },
  { sigla: 'CFESS',   label: 'CFESS — Conselho Federal de Serviço Social' },
  { sigla: 'N/A',     label: 'Sem conselho obrigatório' },
];

// ─── Configs visuais ──────────────────────────────────────────
const statusConfig = {
  ativo:    { label: 'Ativo',    color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  suspenso: { label: 'Suspenso', color: 'bg-red-100 text-red-700',         icon: ShieldX },
  ferias:   { label: 'Férias',   color: 'bg-blue-100 text-blue-700',       icon: Clock },
};

const tipoConfig = {
  voluntario:  { label: 'Voluntário',  color: 'bg-violet-100 text-violet-700' },
  colaborador: { label: 'Colaborador', color: 'bg-teal-100 text-teal-700' },
};

function isRegistroVencido(validade: string) {
  return new Date(validade) < new Date();
}
function isRegistroProximoVencer(validade: string) {
  const diff = new Date(validade).getTime() - Date.now();
  return diff >= 0 && diff < 1000 * 60 * 60 * 24 * 60;
}

// ─── Hook: especialidades do ecossistema ─────────────────────
function useEspecialidades(): string[] {
  return useMemo(() => {
    const set = new Set<string>(ESPECIALIDADES_PLATAFORMA);
    try {
      const raw = localStorage.getItem('cgi_profissionais');
      const list = raw ? JSON.parse(raw) : profissionaisMock;
      list.forEach((p: { especialidade: string }) => {
        if (p?.especialidade) set.add(p.especialidade);
      });
    } catch {
      profissionaisMock.forEach(p => set.add(p.especialidade));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, []);
}

// ─── Componente: RegistroInput (conselho + número) ───────────
function RegistroInput({
  value, onChange
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  // Detecta sigla atual
  const siglaAtual = CONSELHOS_PLATAFORMA.find(c => value.startsWith(c.sigla))?.sigla ?? '';
  const numeroAtual = siglaAtual ? value.replace(siglaAtual, '').trim() : value;

  const [sigla, setSigla] = useState(siglaAtual || 'CRP');
  const [numero, setNumero] = useState(numeroAtual);

  function update(s: string, n: string) {
    setSigla(s);
    setNumero(n);
    onChange(s === 'N/A' ? 'N/A' : `${s} ${n}`.trim());
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all bg-white';

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <select
          value={sigla}
          onChange={e => update(e.target.value, numero)}
          className={inputCls}
        >
          {CONSELHOS_PLATAFORMA.map(c => (
            <option key={c.sigla} value={c.sigla}>{c.sigla}</option>
          ))}
        </select>
      </div>
      {sigla !== 'N/A' && (
        <div className="flex-[2]">
          <input
            type="text"
            value={numero}
            onChange={e => update(sigla, e.target.value)}
            placeholder="Nº do registro"
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}

// ─── Modal: Ver Perfil ────────────────────────────────────────
function VerPerfilModal({ prof, onClose }: { prof: Profissional; onClose: () => void }) {
  const vencido = isRegistroVencido(prof.registroValidade);
  const proxVencer = !vencido && isRegistroProximoVencer(prof.registroValidade);
  const cfg = statusConfig[prof.status];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header com gradient */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white font-bold text-xl">
                {prof.name.split(' ').filter((_, i) => i > 0).slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{prof.name}</h3>
                <p className="text-sm text-teal-100">{prof.especialidade}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    tipoConfig[prof.tipo].color)}>
                    {tipoConfig[prof.tipo].label}
                  </span>
                  <span className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full', cfg.color)}>
                    <Icon className="w-3 h-3" /> {cfg.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <XCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Alertas de registro */}
          {vencido && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <p className="text-xs text-red-700 font-medium">Registro profissional VENCIDO — Acesso clínico suspenso.</p>
            </div>
          )}
          {proxVencer && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">Registro vence em menos de 60 dias. Solicite renovação.</p>
            </div>
          )}

          {/* Dados de registro */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Hash,      label: 'Registro',          value: prof.registro },
              { icon: Calendar,  label: 'Validade',           value: prof.registroValidade, alert: vencido || proxVencer },
              { icon: Calendar,  label: 'Data de Admissão',   value: prof.admissao },
              { icon: Briefcase, label: 'Especialidade',      value: prof.especialidade },
            ].map(f => (
              <div key={f.label} className={cn('rounded-xl p-3', f.alert ? 'bg-red-50 border border-red-100' : 'bg-slate-50')}>
                <div className="flex items-center gap-1.5 mb-1">
                  <f.icon className={cn('w-3.5 h-3.5', f.alert ? 'text-red-400' : 'text-teal-500')} />
                  <p className="text-xs text-slate-400">{f.label}</p>
                </div>
                <p className={cn('text-sm font-semibold', f.alert ? 'text-red-700' : 'text-slate-800')}>{f.value}</p>
              </div>
            ))}
          </div>

          {/* Contato */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Contato</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{prof.email}</span>
              </div>
              <div className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">{prof.phone}</span>
              </div>
            </div>
          </div>

          {/* Produtividade */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Produtividade no Mês</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 text-center">
                <p className="text-xs text-teal-500 mb-1">Atendimentos</p>
                <p className="text-2xl font-bold text-teal-700">{prof.atendimentosMes}</p>
              </div>
              <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 text-center">
                <p className="text-xs text-violet-500 mb-1">Horas</p>
                <p className="text-2xl font-bold text-violet-700">{prof.horasMes}h</p>
              </div>
            </div>
          </div>

          {/* Projetos */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-teal-500" /> Projetos Vinculados
            </p>
            <div className="flex flex-wrap gap-2">
              {prof.projetos.map(pr => (
                <span key={pr} className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
                  <Award className="w-3 h-3 text-teal-500" /> {pr}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Fechar Perfil
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Editar Profissional ───────────────────────────────
function EditarProfissionalModal({
  prof, onClose, onSave,
}: {
  prof: Profissional;
  onClose: () => void;
  onSave: (updated: Profissional) => void;
}) {
  const especialidades = useEspecialidades();
  const [name, setName] = useState(prof.name);
  const [especialidade, setEspecialidade] = useState(prof.especialidade);
  const [registro, setRegistro] = useState(prof.registro);
  const [registroValidade, setRegistroValidade] = useState(prof.registroValidade);
  const [status, setStatus] = useState(prof.status);
  const [tipo, setTipo] = useState(prof.tipo);
  const [email, setEmail] = useState(prof.email);
  const [phone, setPhone] = useState(prof.phone);
  const [saved, setSaved] = useState(false);

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all';

  function handleSave() {
    onSave({ ...prof, name, especialidade, registro, registroValidade, status, tipo, email, phone });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-teal-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Editar Profissional</h3>
              <p className="text-xs text-slate-400">{prof.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Especialidade — select do ecossistema */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Especialidade</label>
              <select
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                className={`${inputCls} bg-white`}
              >
                {especialidades.map(e => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as Profissional['tipo'])} className={`${inputCls} bg-white`}>
                <option value="voluntario">Voluntário</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
          </div>

          {/* Registro — seletor de conselho + número */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Registro Profissional</label>
            <RegistroInput value={registro} onChange={setRegistro} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Validade do Registro</label>
            <input type="date" value={registroValidade} onChange={e => setRegistroValidade(e.target.value)} className={`${inputCls} bg-white`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Profissional['status'])} className={`${inputCls} bg-white`}>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="ferias">Férias</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Novo Profissional ─────────────────────────────────
interface CreateCgiProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (prof: Profissional) => void;
}

function CreateCgiProfessionalModal({ isOpen, onClose, onCreate }: CreateCgiProfessionalModalProps) {
  const especialidades = useEspecialidades();
  const [name, setName] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [registro, setRegistro] = useState('CRP ');
  const [registroValidade, setRegistroValidade] = useState('');
  const [status, setStatus] = useState<'ativo' | 'suspenso' | 'ferias'>('ativo');
  const [tipo, setTipo] = useState<'voluntario' | 'colaborador'>('voluntario');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newProf: Profissional = {
      id: `p${Date.now()}`,
      name,
      especialidade: especialidade || especialidades[0] || 'Psicologia Clínica',
      registro: registro.trim() || 'N/A',
      registroValidade: registroValidade || new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0],
      status,
      tipo,
      horasMes: 0,
      atendimentosMes: 0,
      projetos: [],
      email: email || 'contato@institutosermelhor.org',
      phone: phone || '(11) 99999-9999',
      admissao: new Date().toISOString().split('T')[0],
    };

    onCreate(newProf);
    onClose();
    setName(''); setEspecialidade(''); setRegistro('CRP ');
    setRegistroValidade(''); setStatus('ativo'); setTipo('voluntario');
    setEmail(''); setPhone('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-900">Novo Profissional</h3>
          </div>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome completo com título (Ex: Dra. Maria Souza)"
              className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Especialidade — select do ecossistema */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Especialidade *</label>
              <select
                value={especialidade}
                onChange={e => setEspecialidade(e.target.value)}
                className={`${inputCls} bg-white`}
                required
              >
                <option value="" disabled>Selecione...</option>
                {especialidades.map(esp => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tipo</label>
              <select value={tipo} onChange={e => setTipo(e.target.value as any)} className={`${inputCls} bg-white`}>
                <option value="voluntario">Voluntário</option>
                <option value="colaborador">Colaborador</option>
              </select>
            </div>
          </div>

          {/* Registro — seletor de conselho + número */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
              <Hash className="w-3.5 h-3.5 text-teal-500" /> Registro Profissional
            </label>
            <RegistroInput value={registro} onChange={setRegistro} />
            <p className="text-xs text-slate-400 mt-1">Selecione o conselho e informe o número do registro.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Validade do Registro</label>
            <input type="date" value={registroValidade} onChange={e => setRegistroValidade(e.target.value)}
              className={`${inputCls} bg-white`} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as any)} className={`${inputCls} bg-white`}>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="ferias">Férias</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="(11) 99999-9999" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@institutosermelhor.org" className={inputCls} />
            </div>
          </div>

          {/* Legenda dos conselhos */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-xs font-semibold text-slate-500 mb-1.5">Conselhos disponíveis na plataforma</p>
            <div className="flex flex-wrap gap-1.5">
              {CONSELHOS_PLATAFORMA.filter(c => c.sigla !== 'N/A').map(c => (
                <span key={c.sigla} className="text-xs px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded-full">
                  {c.sigla}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors">
              Adicionar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────
type ActiveModal =
  | { type: 'perfil'; prof: Profissional }
  | { type: 'editar'; prof: Profissional }
  | null;

export function CGIProfissionais() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profissional | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [profissionaisList, setProfissionaisList] = useState<Profissional[]>(() => {
    const saved = localStorage.getItem('cgi_profissionais');
    return saved ? JSON.parse(saved) : profissionaisMock;
  });

  React.useEffect(() => {
    if (!localStorage.getItem('cgi_profissionais')) {
      localStorage.setItem('cgi_profissionais', JSON.stringify(profissionaisMock));
    }
  }, []);

  function persist(list: Profissional[]) {
    setProfissionaisList(list);
    localStorage.setItem('cgi_profissionais', JSON.stringify(list));
  }

  function updateProfissional(updated: Profissional) {
    const list = profissionaisList.map(p => p.id === updated.id ? updated : p);
    persist(list);
    setSelected(updated);
  }

  function toggleStatus(prof: Profissional) {
    const updated: Profissional = {
      ...prof,
      status: prof.status === 'suspenso' ? 'ativo' : 'suspenso',
    };
    updateProfissional(updated);
  }

  const filtered = profissionaisList.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.especialidade.toLowerCase().includes(search.toLowerCase()) ||
    p.registro.toLowerCase().includes(search.toLowerCase())
  );

  const kpis = [
    { label: 'Total',              value: profissionaisList.length },
    { label: 'Ativos',             value: profissionaisList.filter(p => p.status === 'ativo').length },
    { label: 'Suspensos',          value: profissionaisList.filter(p => p.status === 'suspenso').length },
    { label: 'Registros Vencidos', value: profissionaisList.filter(p => isRegistroVencido(p.registroValidade)).length },
  ];

  return (
    <div className="space-y-6">

      {/* Modais */}
      <AnimatePresence>
        {activeModal?.type === 'perfil' && (
          <VerPerfilModal prof={activeModal.prof} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'editar' && (
          <EditarProfissionalModal
            prof={activeModal.prof}
            onClose={() => setActiveModal(null)}
            onSave={updated => { updateProfissional(updated); setActiveModal(null); }}
          />
        )}
      </AnimatePresence>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={cn('bg-white rounded-2xl p-4 border shadow-sm',
            i === 3 && k.value > 0 ? 'border-red-200 bg-red-50' : 'border-slate-200')}>
            <p className="text-xs text-slate-500 mb-1">{k.label}</p>
            <p className={cn('text-2xl font-bold', i === 3 && k.value > 0 ? 'text-red-600' : 'text-slate-900')}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, especialidade ou registro..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Profissional
        </button>
      </div>

      {/* Lista de profissionais */}
      <div className="space-y-3">
        {filtered.map((p, i) => {
          const vencido = isRegistroVencido(p.registroValidade);
          const proxVencer = !vencido && isRegistroProximoVencer(p.registroValidade);
          const cfg = statusConfig[p.status];
          const Icon = cfg.icon;
          const isOpen = selected?.id === p.id;

          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(isOpen ? null : p)}
              className={cn(
                'bg-white rounded-2xl border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all',
                vencido ? 'border-red-200' : proxVencer ? 'border-amber-200' : 'border-slate-200'
              )}
            >
              {/* Cabeçalho do card */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm shrink-0">
                  {p.name.split(' ').filter((_, i) => i > 0).slice(0, 2).map(w => w[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', tipoConfig[p.tipo].color)}>
                      {tipoConfig[p.tipo].label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{p.especialidade} · {p.registro}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {vencido && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                      <AlertTriangle className="w-3 h-3" /> Vencido
                    </span>
                  )}
                  {proxVencer && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                      <Clock className="w-3 h-3" /> Vence em breve
                    </span>
                  )}
                  <span className={cn('flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full', cfg.color)}>
                    <Icon className="w-3.5 h-3.5" /> {cfg.label}
                  </span>
                </div>
              </div>

              {/* Painel expandido */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                      {/* Dados rápidos */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { label: 'Validade do Registro', value: p.registroValidade, alert: vencido },
                          { label: 'Atend. no Mês',        value: String(p.atendimentosMes) },
                          { label: 'Horas no Mês',         value: `${p.horasMes}h` },
                          { label: 'Admissão',             value: p.admissao },
                          { label: 'Email',                value: p.email },
                          { label: 'Telefone',             value: p.phone },
                          { label: 'Projetos',             value: p.projetos.join(', ') || '—' },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-xs text-slate-400">{f.label}</p>
                            <p className={cn('text-sm font-medium mt-0.5', f.alert ? 'text-red-600' : 'text-slate-800')}>
                              {f.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Botões de ação */}
                      <div className="flex flex-wrap gap-2 pt-1">

                        {/* Ver Perfil */}
                        <button
                          onClick={() => setActiveModal({ type: 'perfil', prof: p })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
                        >
                          <Eye className="w-4 h-4" /> Ver Perfil
                        </button>

                        {/* Editar */}
                        <button
                          onClick={() => setActiveModal({ type: 'editar', prof: p })}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" /> Editar
                        </button>

                        {/* Suspender / Reativar */}
                        {p.status === 'suspenso' ? (
                          <button
                            onClick={() => toggleStatus(p)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-500 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" /> Reativar Acesso
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleStatus(p)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-xl hover:bg-red-50 transition-colors"
                          >
                            <ShieldX className="w-4 h-4" /> Suspender
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
            Nenhum profissional encontrado.
          </div>
        )}
      </div>

      {/* Modal criar profissional */}
      <CreateCgiProfessionalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={newProf => {
          const updated = [...profissionaisList, newProf];
          persist(updated);
        }}
      />
    </div>
  );
}
