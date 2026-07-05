import React, { useState } from 'react';
import {
  Search, UserPlus, ChevronRight, Users, Download, XCircle,
  FileText, Edit3, History, Lock, AlertTriangle, Shield,
  ClipboardList, Calendar, Phone, MapPin, User, Stethoscope,
  CheckCircle2, Clock, ArrowRight, FileWarning, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { beneficiarios, type Beneficiario } from '../../data/cgi-mock';
import { useIAM } from '../../contexts/IAMContext';

// ─── Configs visuais ──────────────────────────────────────────
const statusConfig = {
  ativo:        { label: 'Ativo',        color: 'bg-emerald-100 text-emerald-700' },
  inativo:      { label: 'Inativo',      color: 'bg-slate-100 text-slate-600' },
  em_avaliacao: { label: 'Em Avaliação', color: 'bg-amber-100 text-amber-700' },
  encerrado:    { label: 'Encerrado',    color: 'bg-rose-100 text-rose-700' },
};

const riskConfig = {
  high:   { label: 'Alto',   color: 'text-red-600 bg-red-50 border border-red-200' },
  medium: { label: 'Médio',  color: 'text-amber-600 bg-amber-50 border border-amber-200' },
  low:    { label: 'Baixo',  color: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
};

// ─── Componente: Acesso Negado ────────────────────────────────
function AccessDeniedModal({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-rose-600" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">Acesso Restrito</h3>
        <p className="text-sm text-slate-500 mb-1">
          <strong className="text-slate-700">{title}</strong>
        </p>
        <p className="text-xs text-slate-400 mb-6">
          Você não possui permissão para acessar este recurso.<br />
          Solicite acesso ao administrador do sistema.
        </p>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mb-6">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">Esta tentativa foi registrada no log de auditoria.</p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
        >
          Fechar
        </button>
      </motion.div>
    </div>
  );
}

// ─── Modal: Ver Prontuário ────────────────────────────────────
function ProntuarioModal({ beneficiario, onClose }: { beneficiario: Beneficiario; onClose: () => void }) {
  const entries = [
    { date: beneficiario.lastContact, tipo: 'Atendimento', prof: beneficiario.professional, descricao: 'Sessão de acolhimento e escuta qualificada. Paciente demonstrou boa evolução no processo terapêutico.', icon: Stethoscope, color: 'teal' },
    { date: beneficiario.registeredAt, tipo: 'Cadastro', prof: beneficiario.professional, descricao: 'Triagem inicial realizada. Risco classificado como ' + riskConfig[beneficiario.risk].label + '. Encaminhamento ao projeto ' + beneficiario.project + '.', icon: ClipboardList, color: 'violet' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-600 to-teal-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Prontuário Clínico</h3>
              <p className="text-xs text-teal-100">{beneficiario.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs bg-white/20 text-white px-2 py-1 rounded-lg">
              <Shield className="w-3 h-3" /> LGPD Protegido
            </span>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <XCircle className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Identificação */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { icon: User, label: 'Nome', value: beneficiario.name },
              { icon: Calendar, label: 'Idade', value: `${beneficiario.age} anos` },
              { icon: MapPin, label: 'Cidade', value: beneficiario.city },
              { icon: FileText, label: 'CPF (mascarado)', value: beneficiario.cpf },
              { icon: Stethoscope, label: 'Profissional', value: beneficiario.professional },
              { icon: ClipboardList, label: 'Projeto', value: beneficiario.project },
            ].map(f => (
              <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <f.icon className="w-3.5 h-3.5 text-teal-500" />
                  <p className="text-xs text-slate-400">{f.label}</p>
                </div>
                <p className="text-sm font-medium text-slate-800">{f.value}</p>
              </div>
            ))}
          </div>

          {/* Status e Risco */}
          <div className="flex gap-2">
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full', statusConfig[beneficiario.status].color)}>
              {statusConfig[beneficiario.status].label}
            </span>
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-lg border', riskConfig[beneficiario.risk].color)}>
              Vulnerabilidade {riskConfig[beneficiario.risk].label}
            </span>
          </div>

          {/* Linha do tempo */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">Histórico de Atendimentos</p>
            <div className="space-y-3">
              {entries.map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                    e.color === 'teal' ? 'bg-teal-100' : 'bg-violet-100')}>
                    <e.icon className={cn('w-4 h-4', e.color === 'teal' ? 'text-teal-600' : 'text-violet-600')} />
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">{e.tipo}</span>
                      <span className="text-xs text-slate-400">{e.date}</span>
                      <span className="text-xs text-slate-400 ml-auto">{e.prof.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    <p className="text-xs text-slate-600">{e.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documentos */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Documentos Vinculados</p>
            <div className="flex items-center gap-3 p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <FileWarning className="w-5 h-5 text-slate-300" />
              <p className="text-xs text-slate-400">{beneficiario.documents} documento(s) anexado(s) · {beneficiario.cases} caso(s) registrado(s)</p>
            </div>
          </div>

          {/* LGPD aviso */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Este prontuário contém dados sensíveis protegidos pela LGPD (Lei 13.709/2018).
              O acesso foi registrado no log de auditoria do sistema.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl transition-colors">
            Fechar Prontuário
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Editar Cadastro ───────────────────────────────────
function EditCadastroModal({
  beneficiario, onClose, onSave
}: {
  beneficiario: Beneficiario;
  onClose: () => void;
  onSave: (updated: Beneficiario) => void;
}) {
  const [name, setName] = useState(beneficiario.name);
  const [age, setAge] = useState(beneficiario.age);
  const [gender, setGender] = useState(beneficiario.gender);
  const [status, setStatus] = useState(beneficiario.status);
  const [risk, setRisk] = useState(beneficiario.risk);
  const [city, setCity] = useState(beneficiario.city);
  const [project, setProject] = useState(beneficiario.project);
  const [professional, setProfessional] = useState(beneficiario.professional);
  const [saved, setSaved] = useState(false);

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none';

  function handleSave() {
    onSave({ ...beneficiario, name, age, gender, status, risk, city, project, professional });
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
              <h3 className="text-base font-bold text-slate-900">Editar Cadastro</h3>
              <p className="text-xs text-slate-400">{beneficiario.name}</p>
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Idade</label>
              <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Gênero</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Beneficiario['status'])} className={`${inputCls} bg-white`}>
                <option value="ativo">Ativo</option>
                <option value="em_avaliacao">Em Avaliação</option>
                <option value="inativo">Inativo</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vulnerabilidade</label>
              <select value={risk} onChange={e => setRisk(e.target.value as Beneficiario['risk'])} className={`${inputCls} bg-white`}>
                <option value="low">Baixo Risco</option>
                <option value="medium">Médio Risco</option>
                <option value="high">Alto Risco</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cidade</label>
            <input value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Projeto Vinculado</label>
            <input value={project} onChange={e => setProject(e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Profissional Responsável</label>
            <input value={professional} onChange={e => setProfessional(e.target.value)} className={inputCls} />
          </div>

          {/* Aviso segurança */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Alterações em cadastros de beneficiários são registradas no log de auditoria.</p>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={handleSave}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-xl transition-all',
              saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
            {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Edit3 className="w-4 h-4" /> Salvar Alterações</>}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
            Cancelar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Histórico de Atividades ──────────────────────────
function HistoricoModal({ beneficiario, onClose }: { beneficiario: Beneficiario; onClose: () => void }) {
  const eventos = [
    { data: beneficiario.lastContact,    tipo: 'Atendimento',      desc: 'Sessão de atendimento registrada pelo profissional responsável.',  icon: Stethoscope, color: 'teal',   status: 'Concluído' },
    { data: beneficiario.registeredAt,   tipo: 'Triagem Inicial',  desc: `Cadastro realizado com classificação de vulnerabilidade ${riskConfig[beneficiario.risk].label}.`, icon: ClipboardList, color: 'violet', status: 'Concluído' },
    { data: beneficiario.registeredAt,   tipo: 'Encaminhamento',   desc: `Encaminhado ao projeto: ${beneficiario.project}.`,                icon: ArrowRight,    color: 'blue',   status: 'Ativo' },
  ];

  const auditEventos = [
    { data: new Date().toLocaleDateString('pt-BR'), acao: 'Prontuário consultado', usuario: 'Sistema', icone: FileText },
    { data: beneficiario.lastContact,               acao: 'Cadastro visualizado',  usuario: beneficiario.professional.split(' ').slice(0, 2).join(' '), icone: User },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
              <History className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Histórico de Atividades</h3>
              <p className="text-xs text-slate-400">{beneficiario.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Resumo */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Atendimentos', value: beneficiario.cases, icon: Stethoscope, color: 'teal' },
              { label: 'Documentos',   value: beneficiario.documents, icon: FileText,   color: 'violet' },
              { label: 'Último Contato', value: beneficiario.lastContact, icon: Calendar,  color: 'blue', small: true },
            ].map(k => (
              <div key={k.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-400 mb-1">{k.label}</p>
                <p className={cn('font-bold', k.small ? 'text-sm' : 'text-xl',
                  k.color === 'teal' ? 'text-teal-700' :
                  k.color === 'violet' ? 'text-violet-700' : 'text-blue-700'
                )}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Timeline de atendimentos */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-500" /> Linha do Tempo
            </p>
            <div className="relative space-y-0">
              {eventos.map((e, i) => (
                <div key={i} className="flex gap-3 relative pb-4">
                  {i < eventos.length - 1 && (
                    <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100" />
                  )}
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10',
                    e.color === 'teal' ? 'bg-teal-100' : e.color === 'violet' ? 'bg-violet-100' : 'bg-blue-100')}>
                    <e.icon className={cn('w-4 h-4',
                      e.color === 'teal' ? 'text-teal-600' : e.color === 'violet' ? 'text-violet-600' : 'text-blue-600')} />
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-slate-700">{e.tipo}</span>
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium',
                        e.status === 'Concluído' ? 'bg-emerald-100 text-emerald-700' : 'bg-teal-100 text-teal-700')}>
                        {e.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{e.data}</p>
                    <p className="text-xs text-slate-600">{e.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Log de auditoria */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-violet-500" /> Registro de Acessos (Auditoria)
            </p>
            <div className="space-y-2">
              {auditEventos.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <a.icone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">{a.acao}</p>
                    <p className="text-xs text-slate-400">{a.usuario} · {a.data}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal: Criar Beneficiário ────────────────────────────────
interface CreateCgiBeneficiaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (beneficiary: Beneficiario) => void;
}

function CreateCgiBeneficiaryModal({ isOpen, onClose, onCreate }: CreateCgiBeneficiaryModalProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [gender, setGender] = useState('F');
  const [status, setStatus] = useState<'ativo' | 'inativo' | 'em_avaliacao' | 'encerrado'>('ativo');
  const [risk, setRisk] = useState<'high' | 'medium' | 'low'>('low');
  const [project, setProject] = useState('Escuta Ativa');
  const [professional, setProfessional] = useState('Dra. Roberta Santos');
  const [city, setCity] = useState('São Paulo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newBeneficiary: Beneficiario = {
      id: `b${Date.now()}`,
      name,
      cpf: '***.***.***-' + Math.floor(10 + Math.random() * 90),
      age,
      gender,
      status,
      risk,
      project,
      professional,
      registeredAt: new Date().toISOString().split('T')[0],
      lastContact: new Date().toISOString().split('T')[0],
      city,
      documents: 0,
      cases: 1,
    };

    onCreate(newBeneficiary);
    onClose();
    setName(''); setAge(30); setGender('F'); setStatus('ativo');
    setRisk('low'); setProject('Escuta Ativa');
    setProfessional('Dra. Roberta Santos'); setCity('São Paulo');
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition-all';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Novo Beneficiário</h3>
          <button onClick={onClose} type="button" className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Nome do beneficiário" className={inputCls} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Idade</label>
              <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Gênero</label>
              <select value={gender} onChange={e => setGender(e.target.value)} className={`${inputCls} bg-white`}>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as any)} className={`${inputCls} bg-white`}>
                <option value="ativo">Ativo</option>
                <option value="em_avaliacao">Em Avaliação</option>
                <option value="inativo">Inativo</option>
                <option value="encerrado">Encerrado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Vulnerabilidade</label>
              <select value={risk} onChange={e => setRisk(e.target.value as any)} className={`${inputCls} bg-white`}>
                <option value="low">Baixo Risco</option>
                <option value="medium">Médio Risco</option>
                <option value="high">Alto Risco</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Projeto Vinculado</label>
            <input type="text" value={project} onChange={e => setProject(e.target.value)}
              placeholder="Ex: Escuta Ativa, Lar Protegido" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Profissional Responsável</label>
            <input type="text" value={professional} onChange={e => setProfessional(e.target.value)}
              placeholder="Nome do profissional" className={inputCls} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Cidade</label>
            <input type="text" value={city} onChange={e => setCity(e.target.value)} className={inputCls} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors">
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────
type ActiveModal =
  | { type: 'prontuario' }
  | { type: 'cadastro' }
  | { type: 'historico' }
  | { type: 'denied'; title: string }
  | null;

export function CGIBeneficiarios() {
  const { hasPermission, hasRole, currentUser } = useIAM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selected, setSelected] = useState<Beneficiario | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [beneficiariosList, setBeneficiariosList] = useState<Beneficiario[]>(() => {
    const saved = localStorage.getItem('cgi_beneficiarios');
    return saved ? JSON.parse(saved) : beneficiarios;
  });

  React.useEffect(() => {
    if (!localStorage.getItem('cgi_beneficiarios')) {
      localStorage.setItem('cgi_beneficiarios', JSON.stringify(beneficiarios));
    }
  }, []);

  // ─── Funções de permissão ─────────────────────────────────
  // Ver Prontuário: profissional clínico, coordenador clínico, gestor, diretor, super_admin
  const canViewProntuario = hasPermission('records', 'view') ||
    hasRole('professional') || hasRole('volunteer_professional') ||
    hasRole('super_admin') || hasRole('manager') || hasRole('director') || hasRole('president');

  // Editar Cadastro: quem pode criar/editar beneficiários
  const canEditCadastro = hasPermission('beneficiaries', 'edit') ||
    hasRole('super_admin') || hasRole('coordinator') || hasRole('manager') ||
    hasRole('professional') || hasRole('admin_collaborator');

  // Ver Histórico: quem tem view em beneficiários (mais amplo)
  const canViewHistorico = hasPermission('beneficiaries', 'view') ||
    hasRole('super_admin') || hasRole('auditor') || hasRole('manager') ||
    hasRole('director') || hasRole('president') || hasRole('coordinator') ||
    hasRole('professional') || hasRole('volunteer_professional') ||
    hasRole('admin_collaborator');

  // Criar novo: recepção, coordenadores, profissionais
  const canCreate = hasPermission('beneficiaries', 'create') ||
    hasRole('super_admin') || hasRole('coordinator') || hasRole('manager') ||
    hasRole('professional') || hasRole('admin_collaborator');

  // ─── Ação segura com verificação ─────────────────────────
  function secureAction(allowed: boolean, modalType: 'prontuario' | 'cadastro' | 'historico', label: string) {
    if (allowed) {
      setActiveModal({ type: modalType });
    } else {
      setActiveModal({ type: 'denied', title: label });
    }
  }

  function updateBeneficiario(updated: Beneficiario) {
    const list = beneficiariosList.map(b => b.id === updated.id ? updated : b);
    setBeneficiariosList(list);
    localStorage.setItem('cgi_beneficiarios', JSON.stringify(list));
  }

  const filtered = beneficiariosList.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = b.name.toLowerCase().includes(q) || b.professional.toLowerCase().includes(q) || b.project.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchRisk = riskFilter === 'all' || b.risk === riskFilter;
    return matchSearch && matchStatus && matchRisk;
  });

  const kpis = [
    { label: 'Total',        value: beneficiariosList.length,                                         color: 'text-slate-900' },
    { label: 'Ativos',       value: beneficiariosList.filter(b => b.status === 'ativo').length,       color: 'text-emerald-600' },
    { label: 'Em Avaliação', value: beneficiariosList.filter(b => b.status === 'em_avaliacao').length, color: 'text-amber-600' },
    { label: 'Alto Risco',   value: beneficiariosList.filter(b => b.risk === 'high').length,          color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">

      {/* Modais */}
      <AnimatePresence>
        {activeModal?.type === 'prontuario' && selected && (
          <ProntuarioModal beneficiario={selected} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'cadastro' && selected && (
          <EditCadastroModal
            beneficiario={selected}
            onClose={() => setActiveModal(null)}
            onSave={updated => { updateBeneficiario(updated); setSelected(updated); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'historico' && selected && (
          <HistoricoModal beneficiario={selected} onClose={() => setActiveModal(null)} />
        )}
        {activeModal?.type === 'denied' && (
          <AccessDeniedModal title={activeModal.title} onClose={() => setActiveModal(null)} />
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

      {/* Banner de perfil ativo */}
      {currentUser && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500">
          <Shield className="w-3.5 h-3.5 text-teal-500 shrink-0" />
          <span>Você está acessando como <strong className="text-slate-700">{currentUser.name}</strong> · {currentUser.roles.map(r => r).join(', ')}</span>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome, profissional ou projeto..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm outline-none" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500 outline-none">
          <option value="all">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="em_avaliacao">Em Avaliação</option>
          <option value="inativo">Inativo</option>
          <option value="encerrado">Encerrado</option>
        </select>
        <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 shadow-sm focus:ring-2 focus:ring-teal-500 outline-none">
          <option value="all">Todos os riscos</option>
          <option value="high">Alto Risco</option>
          <option value="medium">Médio Risco</option>
          <option value="low">Baixo Risco</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" /> Exportar
        </button>
        {/* Botão Cadastrar com verificação de permissão */}
        <button
          onClick={() => canCreate ? setIsCreateModalOpen(true) : setActiveModal({ type: 'denied', title: 'Cadastrar Novo Beneficiário' })}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors shadow-sm',
            canCreate
              ? 'bg-teal-600 text-white hover:bg-teal-500'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-dashed border-slate-300'
          )}
        >
          {canCreate ? <UserPlus className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Cadastrar
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{filtered.length} beneficiário(s)</span>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(selected?.id === b.id ? null : b)}
              className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
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
              <p className="text-xs text-slate-400 hidden lg:block w-28 shrink-0">
                {b.professional.split(' ')[0]} {b.professional.split(' ')[1]}
              </p>
              <ChevronRight className={cn('w-4 h-4 text-slate-300 transition-transform', selected?.id === b.id && 'rotate-90')} />
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-slate-400 text-sm">Nenhum beneficiário encontrado.</div>
          )}
        </div>
      </div>

      {/* Painel de detalhes */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
            className="bg-white rounded-2xl border border-teal-200 shadow-md p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{selected.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{selected.age} anos · {selected.gender === 'F' ? 'Feminino' : 'Masculino'} · {selected.city}</p>
              </div>
              <div className="flex gap-2">
                <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full', statusConfig[selected.status].color)}>
                  {statusConfig[selected.status].label}
                </span>
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', riskConfig[selected.risk].color)}>
                  {riskConfig[selected.risk].label} Risco
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100">
              {[
                { label: 'Projeto',          value: selected.project },
                { label: 'Profissional',     value: selected.professional },
                { label: 'Documentos',       value: `${selected.documents} doc(s)` },
                { label: 'Casos',            value: `${selected.cases} caso(s)` },
                { label: 'CPF (mascarado)',  value: selected.cpf },
                { label: 'Cadastro',         value: selected.registeredAt },
                { label: 'Último Contato',   value: selected.lastContact },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            {/* Botões de ação com controle de segurança */}
            <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">

              {/* Ver Prontuário */}
              <button
                onClick={() => secureAction(canViewProntuario, 'prontuario', 'Visualizar Prontuário Clínico')}
                title={canViewProntuario ? 'Ver prontuário clínico' : 'Sem permissão para ver prontuário'}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all',
                  canViewProntuario
                    ? 'bg-teal-600 text-white hover:bg-teal-500 shadow-sm'
                    : 'bg-slate-100 text-slate-400 border border-dashed border-slate-200 cursor-not-allowed'
                )}
              >
                {canViewProntuario ? <FileText className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Ver Prontuário
              </button>

              {/* Editar Cadastro */}
              <button
                onClick={() => secureAction(canEditCadastro, 'cadastro', 'Editar Cadastro do Beneficiário')}
                title={canEditCadastro ? 'Editar cadastro' : 'Sem permissão para editar cadastro'}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all border',
                  canEditCadastro
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-300 cursor-not-allowed'
                )}
              >
                {canEditCadastro ? <Edit3 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Editar Cadastro
              </button>

              {/* Histórico */}
              <button
                onClick={() => secureAction(canViewHistorico, 'historico', 'Visualizar Histórico de Atividades')}
                title={canViewHistorico ? 'Ver histórico' : 'Sem permissão para ver histórico'}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all border',
                  canViewHistorico
                    ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-slate-50 border-dashed border-slate-200 text-slate-300 cursor-not-allowed'
                )}
              >
                {canViewHistorico ? <History className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Histórico
              </button>

            </div>

            {/* Legenda de permissões */}
            <div className="flex flex-wrap gap-3 text-xs text-slate-400">
              {[
                { ok: canViewProntuario, label: 'Prontuário' },
                { ok: canEditCadastro,   label: 'Edição' },
                { ok: canViewHistorico,  label: 'Histórico' },
              ].map(p => (
                <span key={p.label} className={cn('flex items-center gap-1', p.ok ? 'text-teal-600' : 'text-slate-300')}>
                  {p.ok ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {p.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal criar beneficiário */}
      <CreateCgiBeneficiaryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(newBeneficiary) => {
          const updated = [...beneficiariosList, newBeneficiary];
          setBeneficiariosList(updated);
          localStorage.setItem('cgi_beneficiarios', JSON.stringify(updated));
        }}
      />
    </div>
  );
}
