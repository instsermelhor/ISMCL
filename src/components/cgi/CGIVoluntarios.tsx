import React, { useState } from 'react';
import { Search, Plus, Download, Star, Clock, Award, CheckCircle2, Pause, ChevronDown, ChevronUp, XCircle, Edit3, Eye, User, Save, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { voluntarios as defaultVoluntarios, type Voluntario } from '../../data/cgi-mock';
import { useAuth } from '../../contexts/AuthContext';
import { useSecurity } from '../../contexts/SecurityContext';

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

// ─── Modal: Ver Perfil de Voluntário ──────────────────────────
function ViewVolunteerModal({ volunteer, onClose }: { volunteer: Voluntario; onClose: () => void }) {
  const cfg = statusConfig[volunteer.status];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="bg-gradient-to-r from-violet-650 to-violet-500 px-6 py-5 bg-violet-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-lg">
                {volunteer.name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">{volunteer.name}</h3>
                <p className="text-xs text-violet-100">{volunteer.area} · Desde {volunteer.admissao}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20">
              <XCircle className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div className="flex gap-2">
            <span className={cn('flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full', cfg.color)}>
              <Icon className="w-3.5 h-3.5" /> {cfg.label}
            </span>
            <span className="bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> Avaliação: {volunteer.avaliacao}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-xs text-slate-400">Horas no Mês</p>
              <p className="text-xl font-bold text-slate-800">{volunteer.horasMes}h</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl text-center">
              <p className="text-xs text-slate-400">Horas Totais</p>
              <p className="text-xl font-bold text-slate-800">{volunteer.horasTotais}h</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Projetos Ativos</p>
            <div className="flex flex-wrap gap-1.5">
              {volunteer.projetos.map(p => (
                <span key={p} className="text-xs font-medium px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">{p}</span>
              ))}
              {volunteer.projetos.length === 0 && <span className="text-xs text-slate-400">Nenhum projeto associado.</span>}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Capacitações Concluídas</p>
            <div className="flex flex-wrap gap-1.5">
              {volunteer.capacitacoes.map(c => (
                <span key={c} className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">{c}</span>
              ))}
              {volunteer.capacitacoes.length === 0 && <span className="text-xs text-slate-400">Nenhuma capacitação registrada.</span>}
            </div>
          </div>

          {volunteer.reconhecimento && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-800 mb-1 flex items-center gap-1">
                <Award className="w-4 h-4 fill-amber-400 text-amber-500" /> Destaque & Reconhecimento
              </p>
              <p className="text-xs text-amber-700">{volunteer.reconhecimento}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Editar Voluntário ─────────────────────────────────
function EditVolunteerModal({
  volunteer, onClose, onSave
}: {
  volunteer: Voluntario;
  onClose: () => void;
  onSave: (v: Voluntario) => void;
}) {
  const [name, setName] = useState(volunteer.name);
  const [area, setArea] = useState(volunteer.area);
  const [status, setStatus] = useState(volunteer.status);
  const [projetos, setProjetos] = useState(volunteer.projetos.join(', '));
  const [capacitacoes, setCapacitacoes] = useState(volunteer.capacitacoes.join(', '));
  const [horasMes, setHorasMes] = useState(volunteer.horasMes.toString());
  const [horasTotais, setHorasTotais] = useState(volunteer.horasTotais.toString());
  const [avaliacao, setAvaliacao] = useState(volunteer.avaliacao.toString());
  const [saved, setSaved] = useState(false);

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all';

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      ...volunteer,
      name,
      area,
      status,
      horasMes: parseInt(horasMes) || 0,
      horasTotais: parseInt(horasTotais) || 0,
      avaliacao: parseFloat(avaliacao) || 5.0,
      projetos: projetos.split(',').map(p => p.trim()).filter(Boolean),
      capacitacoes: capacitacoes.split(',').map(c => c.trim()).filter(Boolean),
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

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
            <h3 className="text-lg font-bold text-slate-900">Editar Voluntário</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Área de Atuação</label>
              <select value={area} onChange={e => setArea(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="Jurídico">Jurídico</option>
                <option value="TI / Sistemas">TI / Sistemas</option>
                <option value="Comunicação">Comunicação</option>
                <option value="Contabilidade">Contabilidade</option>
                <option value="Psicologia">Psicologia</option>
                <option value="Assistência Social">Assistência Social</option>
                <option value="Administração">Administração</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className={`${inputCls} bg-white`}>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="ferias">Férias</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Projetos (separados por vírgula)</label>
            <input type="text" value={projetos} onChange={e => setProjetos(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Capacitações (separadas por vírgula)</label>
            <input type="text" value={capacitacoes} onChange={e => setCapacitacoes(e.target.value)} className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Horas Mês</label>
              <input type="number" value={horasMes} onChange={e => setHorasMes(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Horas Total</label>
              <input type="number" value={horasTotais} onChange={e => setHorasTotais(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Avaliação (1-5)</label>
              <input type="number" step="0.1" min="1" max="5" value={avaliacao} onChange={e => setAvaliacao(e.target.value)} className={inputCls} />
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

// ─── Modal: Reconhecer Voluntário ────────────────────────────
function RecognizeVolunteerModal({
  volunteer, onClose, onSave
}: {
  volunteer: Voluntario;
  onClose: () => void;
  onSave: (v: Voluntario) => void;
}) {
  const [reconhecimento, setReconhecimento] = useState(volunteer.reconhecimento ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({
      ...volunteer,
      reconhecimento: reconhecimento.trim() || undefined,
    });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-bold text-slate-900">Reconhecer Voluntário</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-650">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-500">Escreva um destaque ou agradecimento para exibir no perfil deste voluntário.</p>
          <div>
            <textarea
              rows={3}
              value={reconhecimento}
              onChange={e => setReconhecimento(e.target.value)}
              placeholder="Ex: Voluntário Destaque do Mês de Junho/2026 pelo seu compromisso com a triagem e suporte técnico."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Reconhecido!</> : <><Save className="w-4 h-4" /> Salvar</>}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal de Criação de Voluntário ───────────────────────────
interface CreateCgiVolunteerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (v: Voluntario) => void;
}

function CreateCgiVolunteerModal({ isOpen, onClose, onCreate }: CreateCgiVolunteerModalProps) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('Jurídico');
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'ferias'>('ativo');
  const [projetos, setProjetos] = useState('Lar Protegido');
  const [capacitacoes, setCapacitacoes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newVolunteer: Voluntario = {
      id: `v${Date.now()}`,
      name,
      area,
      status,
      horasTotais: 0,
      horasMes: 0,
      projetos: projetos.split(',').map(p => p.trim()).filter(Boolean),
      capacitacoes: capacitacoes.split(',').map(c => c.trim()).filter(Boolean),
      admissao: new Date().toISOString().split('T')[0],
      avaliacao: 5.0,
    };

    onCreate(newVolunteer);
    onClose();
    setName('');
    setArea('Jurídico');
    setStatus('ativo');
    setProjetos('Lar Protegido');
    setCapacitacoes('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Novo Voluntário</h3>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nome do voluntário"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Área de Atuação</label>
              <select
                value={area}
                onChange={e => setArea(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
              >
                <option value="Jurídico">Jurídico</option>
                <option value="TI / Sistemas">TI / Sistemas</option>
                <option value="Comunicação">Comunicação</option>
                <option value="Contabilidade">Contabilidade</option>
                <option value="Psicologia">Psicologia</option>
                <option value="Assistência Social">Assistência Social</option>
                <option value="Administração">Administração</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="ferias">Férias</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Projetos (separados por vírgula)</label>
            <input
              type="text"
              value={projetos}
              onChange={e => setProjetos(e.target.value)}
              placeholder="Ex: Lar Protegido, Escuta Ativa"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Capacitações (separadas por vírgula)</label>
            <input
              type="text"
              value={capacitacoes}
              onChange={e => setCapacitacoes(e.target.value)}
              placeholder="Ex: Direitos Humanos, LGPD"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
            >
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
  | { type: 'perfil'; volunteer: Voluntario }
  | { type: 'editar'; volunteer: Voluntario }
  | { type: 'reconhecer'; volunteer: Voluntario }
  | null;

export function CGIVoluntarios() {
  const { user } = useAuth();
  const { logAction } = useSecurity();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  const [voluntariosList, setVoluntariosList] = useState<Voluntario[]>(() => {
    const saved = localStorage.getItem('cgi_voluntarios');
    return saved ? JSON.parse(saved) : defaultVoluntarios;
  });

  React.useEffect(() => {
    if (!localStorage.getItem('cgi_voluntarios')) {
      localStorage.setItem('cgi_voluntarios', JSON.stringify(defaultVoluntarios));
    }
  }, []);

  function persist(list: Voluntario[]) {
    setVoluntariosList(list);
    localStorage.setItem('cgi_voluntarios', JSON.stringify(list));
  }

  function handleSaveVolunteer(updated: Voluntario) {
    const list = voluntariosList.map(v => v.id === updated.id ? updated : v);
    persist(list);
    logAction({
      userId: user?.email ?? 'sistema',
      userName: user?.name ?? 'Coordenador',
      action: 'EDIT',
      targetCode: `VOL-${updated.id}`,
      description: `[Voluntariado] Editou perfil do voluntário: ${updated.name}`,
      ipAddress: '—',
      device: navigator.userAgent.slice(0, 80),
    });
  }

  function handleExportVolunteers() {
    try {
      const dataStr = JSON.stringify(voluntariosList, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voluntarios_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logAction({
        userId: user?.email ?? 'sistema',
        userName: user?.name ?? 'Coordenador',
        action: 'VIEW',
        targetCode: 'VOL-EXPORT',
        description: `[Voluntariado] Exportou base de dados de voluntários (${voluntariosList.length} registros)`,
        ipAddress: '—',
        device: navigator.userAgent.slice(0, 80),
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao exportar base de dados.');
    }
  }

  const filtered = voluntariosList.filter(v => {
    const q = search.toLowerCase();
    const matchSearch = v.name.toLowerCase().includes(q) || v.area.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: 'Total', value: voluntariosList.length, color: 'text-slate-900' },
    { label: 'Ativos', value: voluntariosList.filter(v => v.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Horas no Mês', value: `${voluntariosList.reduce((s, v) => s + v.horasMes, 0)}h`, color: 'text-teal-600' },
    { label: 'Horas Totais', value: `${voluntariosList.reduce((s, v) => s + v.horasTotais, 0)}h`, color: 'text-violet-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Modais */}
      <AnimatePresence>
        {activeModal?.type === 'perfil' && (
          <ViewVolunteerModal volunteer={activeModal.volunteer} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'editar' && (
          <EditVolunteerModal
            volunteer={activeModal.volunteer}
            onClose={() => setActiveModal(null)}
            onSave={updated => { handleSaveVolunteer(updated); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'reconhecer' && (
          <RecognizeVolunteerModal
            volunteer={activeModal.volunteer}
            onClose={() => setActiveModal(null)}
            onSave={updated => { handleSaveVolunteer(updated); setActiveModal(null); }}
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
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou área..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 shadow-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500 outline-none">
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
          <option value="ferias">Férias</option>
        </select>
        <button
          onClick={handleExportVolunteers}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" /> Exportar
        </button>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
        >
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
                    className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-4"
                    onClick={e => e.stopPropagation()}>
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
                        <p className="text-xs text-amber-700 font-medium">{v.reconhecimento}</p>
                      </div>
                    )}
                    <div className="flex gap-3 pt-1">
                      <button onClick={() => setActiveModal({ type: 'perfil', volunteer: v })} className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">Ver Perfil</button>
                      <button onClick={() => setActiveModal({ type: 'editar', volunteer: v })} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">Editar</button>
                      <button onClick={() => setActiveModal({ type: 'reconhecer', volunteer: v })} className="px-4 py-2 bg-white border border-violet-200 text-violet-700 text-sm font-medium rounded-xl hover:bg-violet-50 transition-colors flex items-center gap-1.5">
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

      {/* Modal de Criação */}
      <CreateCgiVolunteerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(newVolunteer) => {
          const updated = [...voluntariosList, newVolunteer];
          persist(updated);
          logAction({
            userId: user?.email ?? 'sistema',
            userName: user?.name ?? 'Coordenador',
            action: 'EDIT',
            targetCode: `VOL-${newVolunteer.id}`,
            description: `[Voluntariado] Cadastrou novo voluntário: ${newVolunteer.name}`,
            ipAddress: '—',
            device: navigator.userAgent.slice(0, 80),
          });
        }}
      />
    </div>
  );
}
