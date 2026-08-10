import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, Calendar, Users, Target, DollarSign,
  ChevronDown, ChevronUp, BarChart2, Tag, Clock, CheckCircle2,
  PauseCircle, AlertCircle, Download, X, Save, Kanban, List,
  Settings, Edit3, FileText, TrendingUp, Building2, Receipt,
  Printer, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle,
  UserCheck, ChevronRight, Globe, Eye, EyeOff, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils';
import { projetos as defaultProjetos, type ProjetoSocial } from '../../data/cgi-mock';
import { profissionais as profissionaisMock } from '../../data/cgi-mock';
import { voluntarios as voluntariosMock } from '../../data/cgi-mock';
import { programsService } from '../../services/programsService';
import type { SocialProgram } from '../../services/programsService';

// ─── Tipo Extendido ───────────────────────────────────────────
interface Despesa {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  categoria: 'pessoal' | 'material' | 'servico' | 'infraestrutura' | 'outro';
}

interface ProjetoExtended extends ProjetoSocial {
  centroCusto?: string;
  despesas?: Despesa[];
  notas?: string;
  isPublic?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────
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

const categoriaConfig: Record<Despesa['categoria'], { label: string; color: string }> = {
  pessoal: { label: 'Pessoal', color: 'bg-blue-100 text-blue-700' },
  material: { label: 'Material', color: 'bg-amber-100 text-amber-700' },
  servico: { label: 'Serviço', color: 'bg-violet-100 text-violet-700' },
  infraestrutura: { label: 'Infraestrutura', color: 'bg-orange-100 text-orange-700' },
  outro: { label: 'Outro', color: 'bg-slate-100 text-slate-600' },
};

function ProgressBar({ value, color = '#0d9488' }: { value: number; color?: string }) {
  return (
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${Math.min(value, 100)}%` }}
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

function ModalWrapper({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Hook: carregar profissionais do ecossistema ─────────────
function useEcosystemProfessionals(): string[] {
  return useMemo(() => {
    const names = new Set<string>();

    // 1. Equipe técnica (Professionals.tsx)
    try {
      const raw = localStorage.getItem('professionals_list');
      const list = raw ? JSON.parse(raw) : [];
      list.forEach((p: { name: string }) => { if (p?.name) names.add(p.name); });
    } catch { /* ignora */ }

    // 2. CGI Profissionais
    try {
      const raw = localStorage.getItem('cgi_profissionais');
      const list = raw ? JSON.parse(raw) : profissionaisMock;
      list.forEach((p: { name: string }) => { if (p?.name) names.add(p.name); });
    } catch {
      profissionaisMock.forEach(p => names.add(p.name));
    }

    // 3. CGI Voluntários
    try {
      const raw = localStorage.getItem('cgi_voluntarios');
      const list = raw ? JSON.parse(raw) : voluntariosMock;
      list.forEach((v: { name: string }) => { if (v?.name) names.add(v.name); });
    } catch {
      voluntariosMock.forEach(v => names.add(v.name));
    }

    return Array.from(names).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, []);
}

// ─── Hook: coletar etiquetas existentes nos projetos ─────────
const TAGS_PREDEFINIDAS = [
  'Saúde Mental', 'Mulheres', 'Psicologia', 'Psiquiatria',
  'Assistência Social', 'Criança', 'Adolescente', 'Risco Social',
  'Jurídico', 'Família', 'Violência Doméstica', 'Educação',
  'Capacitação', 'Voluntariado', 'LGBTQIA+', 'Idosos',
  'Saúde', 'Emprego', 'Moradia', 'Alimentação',
];

function useEcosystemTags(): string[] {
  return useMemo(() => {
    const tags = new Set<string>(TAGS_PREDEFINIDAS);
    try {
      const raw = localStorage.getItem('cgi_projetos');
      const list = raw ? JSON.parse(raw) : defaultProjetos;
      list.forEach((p: { tags?: string[] }) => {
        (p.tags ?? []).forEach((t: string) => tags.add(t));
      });
    } catch {
      defaultProjetos.forEach(p => p.tags.forEach(t => tags.add(t)));
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, []);
}

// ─── Componente: ProfessionalPicker (Coordenador - single) ────
function ProfessionalPicker({
  value, onChange, label, placeholder = 'Buscar profissional...'
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
}) {
  const professionals = useEcosystemProfessionals();
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = professionals.filter(p =>
    p.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
        <UserCheck className="w-3.5 h-3.5 text-teal-600" /> {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
        />
        {value && (
          <button onClick={() => { onChange(''); setQuery(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <AnimatePresence>
        {open && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto"
          >
            {filtered.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => { onChange(name); setQuery(name); setOpen(false); }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors flex items-center gap-2',
                  value === name ? 'bg-teal-50 text-teal-700 font-semibold' : 'text-slate-700'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-xs font-bold shrink-0">
                  {name.split(' ').slice(0, 2).map(w => w[0]).join('')}
                </div>
                {name}
                {value === name && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-teal-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente: TeamPicker (Equipe - multi-select) ───────────
function TeamPicker({
  selected, onChange
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const professionals = useEcosystemProfessionals();
  const [query, setQuery] = useState('');

  const filtered = professionals.filter(p =>
    p.toLowerCase().includes(query.toLowerCase()) && !selected.includes(p)
  );

  function toggle(name: string) {
    if (selected.includes(name)) {
      onChange(selected.filter(s => s !== name));
    } else {
      onChange([...selected, name]);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
        <Users className="w-3.5 h-3.5 text-teal-600" /> Equipe do Projeto
      </label>

      {/* Selecionados */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selected.map(name => (
            <span key={name}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
              <div className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center text-white text-[9px] font-bold">
                {name.split(' ').slice(0, 2).map(w => w[0]).join('')}
              </div>
              {name.split(' ').slice(0, 2).join(' ')}
              <button onClick={() => toggle(name)} className="ml-0.5 text-teal-500 hover:text-teal-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Busca */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar e adicionar profissional..."
          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {/* Lista disponível */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl max-h-36 overflow-y-auto divide-y divide-slate-100">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-3">
            {query ? 'Nenhum resultado encontrado.' : 'Todos os profissionais já foram adicionados.'}
          </p>
        )}
        {filtered.map(name => (
          <button key={name} type="button" onClick={() => toggle(name)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-teal-50 hover:text-teal-700 transition-colors text-left">
            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
              {name.split(' ').slice(0, 2).map(w => w[0]).join('')}
            </div>
            {name}
            <Plus className="w-3.5 h-3.5 ml-auto text-teal-500" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Componente: TagPicker (multi-select visual) ──────────────
function TagPicker({
  selected, onChange
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const allTags = useEcosystemTags();
  const [query, setQuery] = useState('');

  const filtered = query
    ? allTags.filter(t => t.toLowerCase().includes(query.toLowerCase()))
    : allTags;

  function toggle(tag: string) {
    if (selected.includes(tag)) {
      onChange(selected.filter(s => s !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
        <Tag className="w-3.5 h-3.5 text-teal-600" /> Etiquetas do Projeto
      </label>

      {/* Busca de tags */}
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Filtrar etiquetas..."
          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
        />
      </div>

      {/* Grade de etiquetas clicáveis */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {filtered.map(tag => {
            const isSelected = selected.includes(tag);
            return (
              <button key={tag} type="button" onClick={() => toggle(tag)}
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700'
                )}>
                <Tag className="w-3 h-3" />
                {tag}
                {isSelected && <CheckCircle2 className="w-3 h-3" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-xs text-slate-400 py-1">Nenhuma etiqueta encontrada.</p>
          )}
        </div>
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-teal-600 font-medium mt-1">{selected.length} etiqueta(s) selecionada(s)</p>
      )}
    </div>
  );
}

// ─── Modal: Criar / Editar Projeto ───────────────────────────
interface ProjectFormModalProps {
  projeto?: ProjetoExtended;
  onClose: () => void;
  onSave: (data: ProjetoExtended) => void;
}

function ProjectFormModal({ projeto, onClose, onSave }: ProjectFormModalProps) {
  const isEdit = !!projeto;
  const [saved, setSaved] = useState(false);

  // Campos simples
  const [nome, setNome] = useState(projeto?.nome ?? '');
  const [descricao, setDescricao] = useState(projeto?.descricao ?? '');
  const [status, setStatus] = useState<ProjetoSocial['status']>(projeto?.status ?? 'planejamento');
  const [isPublic, setIsPublic] = useState<boolean>(projeto?.isPublic ?? true);
  const [centroCusto, setCentroCusto] = useState(projeto?.centroCusto ?? '');
  const [orcamento, setOrcamento] = useState(projeto?.orcamento?.toString() ?? '');
  const [captado, setCaptado] = useState(projeto?.captado?.toString() ?? '0');
  const [inicio, setInicio] = useState(projeto?.inicio ?? '');
  const [fim, setFim] = useState(projeto?.fim ?? '');
  const [publicoAlvo, setPublicoAlvo] = useState(projeto?.publicoAlvo ?? '');
  const [objetivos, setObjetivos] = useState(projeto?.objetivos?.join('\n') ?? '');
  const [fontes, setFontes] = useState(
    Array.isArray(projeto?.fontes) ? (projeto.fontes as string[]).join(', ') : (projeto?.fontes ?? '')
  );

  // Campos do ecossistema
  const [coordenador, setCoordenador] = useState(projeto?.coordenador ?? '');
  const [equipe, setEquipe] = useState<string[]>(projeto?.equipe ?? []);
  const [tags, setTags] = useState<string[]>(projeto?.tags ?? []);

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none';

  function handleSave() {
    if (!nome.trim()) return;
    const novo: ProjetoExtended = {
      id: projeto?.id ?? `pr${Date.now()}`,
      nome,
      descricao,
      coordenador,
      inicio,
      fim,
      orcamento: parseFloat(orcamento) || 0,
      captado: parseFloat(captado) || 0,
      status,
      isPublic,
      beneficiariosAlvo: projeto?.beneficiariosAlvo ?? 0,
      beneficiariosAtivos: projeto?.beneficiariosAtivos ?? 0,
      equipe,
      tags,
      progresso: projeto?.progresso ?? 0,
      publicoAlvo,
      objetivos: objetivos.split('\n').map(s => s.trim()).filter(Boolean),
      fontes: fontes.split(',').map(s => s.trim()).filter(Boolean),
      resultados: projeto?.resultados,
      centroCusto,
      despesas: projeto?.despesas ?? [],
      notas: projeto?.notas ?? '',
    };
    onSave(novo);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 1000);
  }

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {isEdit ? <Edit3 className="w-5 h-5 text-teal-600" /> : <BarChart2 className="w-5 h-5 text-teal-600" />}
          <h3 className="text-base font-bold text-slate-900">{isEdit ? 'Editar Projeto' : 'Novo Projeto Social'}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Nome + Status */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Nome do Projeto *</label>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Projeto Conexão Familiar" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as ProjetoSocial['status'])} className={inputCls}>
              <option value="planejamento">Planejamento</option>
              <option value="ativo">Ativo</option>
              <option value="suspenso">Suspenso</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Descrição</label>
          <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Objetivo e escopo do projeto..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        {/* Coordenador — busca no ecossistema */}
        <div className="grid grid-cols-2 gap-4">
          <ProfessionalPicker
            label="Coordenador *"
            value={coordenador}
            onChange={setCoordenador}
            placeholder="Buscar coordenador..."
          />
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-teal-600" /> Centro de Custo
            </label>
            <input value={centroCusto} onChange={e => setCentroCusto(e.target.value)} placeholder="Ex: CC-001 / Social" className={inputCls} />
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-teal-600" /> Valor do Projeto (R$) *
            </label>
            <input type="number" min={0} value={orcamento} onChange={e => setOrcamento(e.target.value)} placeholder="Ex: 80000" className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Já Captado (R$)</label>
            <input type="number" min={0} value={captado} onChange={e => setCaptado(e.target.value)} placeholder="Ex: 62000" className={inputCls} />
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Data de Início</label>
            <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Data de Término Previsto</label>
            <input type="date" value={fim} onChange={e => setFim(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Público-Alvo</label>
          <textarea value={publicoAlvo} onChange={e => setPublicoAlvo(e.target.value)} placeholder="Descreva o público beneficiário..." rows={2} className={`${inputCls} resize-none`} />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Objetivos (um por linha)</label>
          <textarea value={objetivos} onChange={e => setObjetivos(e.target.value)} placeholder={'Objetivo 1\nObjetivo 2...'} rows={3} className={`${inputCls} resize-none`} />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Fontes de Recursos (separar por vírgula)</label>
          <input value={fontes} onChange={e => setFontes(e.target.value)} placeholder="Ex: Editais, doações, patrocínios..." className={inputCls} />
        </div>

        {/* Equipe — seletor do ecossistema */}
        <TeamPicker selected={equipe} onChange={setEquipe} />

        {/* Etiquetas — seletor do ecossistema */}
        <TagPicker selected={tags} onChange={setTags} />

      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
            saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> {isEdit ? 'Salvar Alterações' : 'Criar Projeto'}</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
          Cancelar
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── Modal: Gerenciar Projeto ─────────────────────────────────
interface ManageModalProps {
  projeto: ProjetoExtended;
  onClose: () => void;
  onUpdate: (updated: ProjetoExtended) => void;
}

function ManageModal({ projeto, onClose, onUpdate }: ManageModalProps) {
  const [progresso, setProgresso] = useState(projeto.progresso);
  const [beneficiariosAtivos, setBeneficiariosAtivos] = useState(projeto.beneficiariosAtivos);
  const [beneficiariosAlvo, setBeneficiariosAlvo] = useState(projeto.beneficiariosAlvo);
  const [status, setStatus] = useState(projeto.status);
  const [notas, setNotas] = useState(projeto.notas ?? '');
  const [captado, setCaptado] = useState(projeto.captado);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onUpdate({ ...projeto, progresso, beneficiariosAtivos, beneficiariosAlvo, status, notas, captado });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none';

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-teal-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Gerenciar Projeto</h3>
            <p className="text-xs text-slate-400">{projeto.nome}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Status do Projeto</label>
          <div className="grid grid-cols-4 gap-2">
            {(['planejamento', 'ativo', 'suspenso', 'concluido'] as const).map(s => {
              const cfg = statusConfig[s];
              return (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn('py-2 px-2 rounded-xl text-xs font-semibold border transition-all',
                    status === s ? cfg.color : 'border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100')}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progresso */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-600">Progresso Geral</label>
            <span className="text-sm font-bold text-teal-600">{progresso}%</span>
          </div>
          <input type="range" min={0} max={100} value={progresso}
            onChange={e => setProgresso(Number(e.target.value))}
            className="w-full accent-teal-600 h-2 rounded-full" />
          <ProgressBar value={progresso} />
        </div>

        {/* Captação */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Valor Captado (R$)</label>
            <input type="number" min={0} value={captado}
              onChange={e => setCaptado(Number(e.target.value))}
              className={inputCls} />
          </div>
          <div className="bg-slate-50 rounded-xl p-3 flex flex-col justify-center">
            <p className="text-xs text-slate-400">Orçamento Total</p>
            <p className="text-sm font-bold text-slate-800">{formatBRL(projeto.orcamento)}</p>
            <p className="text-xs text-teal-600 font-medium mt-0.5">
              {projeto.orcamento > 0 ? Math.round((captado / projeto.orcamento) * 100) : 0}% captado
            </p>
          </div>
        </div>

        {/* Beneficiários */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Beneficiários Ativos</label>
            <input type="number" min={0} value={beneficiariosAtivos}
              onChange={e => setBeneficiariosAtivos(Number(e.target.value))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Meta de Beneficiários</label>
            <input type="number" min={0} value={beneficiariosAlvo}
              onChange={e => setBeneficiariosAlvo(Number(e.target.value))}
              className={inputCls} />
          </div>
        </div>

        {/* Progresso beneficiários */}
        {beneficiariosAlvo > 0 && (
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-slate-400">Atingimento da meta</span>
              <span className="text-xs font-semibold text-violet-700">
                {beneficiariosAtivos}/{beneficiariosAlvo} ({Math.round((beneficiariosAtivos / beneficiariosAlvo) * 100)}%)
              </span>
            </div>
            <ProgressBar value={Math.round((beneficiariosAtivos / beneficiariosAlvo) * 100)} color="#8b5cf6" />
          </div>
        )}

        {/* Notas internas */}
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Notas / Observações Internas</label>
          <textarea value={notas} onChange={e => setNotas(e.target.value)}
            placeholder="Anotações, pendências, decisões da equipe..."
            rows={4} className={`${inputCls} resize-none`} />
        </div>

        {/* Info imutável */}
        <div className="bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-xs">
          <div><p className="text-slate-400">Coordenador</p><p className="font-medium text-slate-700 mt-0.5">{projeto.coordenador}</p></div>
          {(projeto as ProjetoExtended).centroCusto && (
            <div><p className="text-slate-400">Centro de Custo</p><p className="font-medium text-slate-700 mt-0.5">{(projeto as ProjetoExtended).centroCusto}</p></div>
          )}
          <div><p className="text-slate-400">Início</p><p className="font-medium text-slate-700 mt-0.5">{projeto.inicio}</p></div>
          <div><p className="text-slate-400">Término</p><p className="font-medium text-slate-700 mt-0.5">{projeto.fim}</p></div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
            saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">
          Cancelar
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── Modal: Prestação de Contas ───────────────────────────────
interface AccountabilityModalProps {
  projeto: ProjetoExtended;
  onClose: () => void;
  onUpdate: (updated: ProjetoExtended) => void;
}

function AccountabilityModal({ projeto, onClose, onUpdate }: AccountabilityModalProps) {
  const [despesas, setDespesas] = useState<Despesa[]>(projeto.despesas ?? []);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ descricao: '', valor: '', data: '', categoria: 'servico' as Despesa['categoria'] });
  const [saved, setSaved] = useState(false);

  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const saldo = projeto.captado - totalDespesas;
  const pctGasto = projeto.captado > 0 ? Math.round((totalDespesas / projeto.captado) * 100) : 0;

  function addDespesa() {
    if (!form.descricao.trim() || !form.valor) return;
    const nova: Despesa = {
      id: `d${Date.now()}`,
      descricao: form.descricao,
      valor: parseFloat(form.valor),
      data: form.data || new Date().toISOString().split('T')[0],
      categoria: form.categoria,
    };
    setDespesas(prev => [...prev, nova]);
    setForm({ descricao: '', valor: '', data: '', categoria: 'servico' });
    setShowForm(false);
  }

  function removeDespesa(id: string) {
    setDespesas(prev => prev.filter(d => d.id !== id));
  }

  function handleSave() {
    onUpdate({ ...projeto, despesas });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 900);
  }

  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none';

  return (
    <ModalWrapper onClose={onClose}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-violet-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900">Prestação de Contas</h3>
            <p className="text-xs text-slate-400">{projeto.nome}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

        {/* Resumo financeiro */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-teal-600" />
              <p className="text-xs text-teal-600 font-medium">Valor Captado</p>
            </div>
            <p className="text-lg font-bold text-teal-700">{formatBRL(projeto.captado)}</p>
            <p className="text-xs text-teal-500 mt-0.5">de {formatBRL(projeto.orcamento)}</p>
          </div>
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
              <p className="text-xs text-rose-600 font-medium">Total Despesas</p>
            </div>
            <p className="text-lg font-bold text-rose-700">{formatBRL(totalDespesas)}</p>
            <p className="text-xs text-rose-500 mt-0.5">{pctGasto}% do captado</p>
          </div>
          <div className={cn('border rounded-xl p-3', saldo >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-200')}>
            <div className="flex items-center gap-1.5 mb-1">
              <Minus className={cn('w-3.5 h-3.5', saldo >= 0 ? 'text-emerald-600' : 'text-amber-600')} />
              <p className={cn('text-xs font-medium', saldo >= 0 ? 'text-emerald-600' : 'text-amber-600')}>Saldo</p>
            </div>
            <p className={cn('text-lg font-bold', saldo >= 0 ? 'text-emerald-700' : 'text-amber-700')}>{formatBRL(saldo)}</p>
            <p className={cn('text-xs mt-0.5', saldo >= 0 ? 'text-emerald-500' : 'text-amber-600')}>
              {saldo < 0 ? '⚠ Saldo negativo' : 'Disponível'}
            </p>
          </div>
        </div>

        {/* Barra captação */}
        <div>
          <div className="flex justify-between mb-1 text-xs text-slate-500">
            <span>Captação vs Orçamento</span>
            <span>{projeto.orcamento > 0 ? Math.round((projeto.captado / projeto.orcamento) * 100) : 0}%</span>
          </div>
          <ProgressBar value={projeto.orcamento > 0 ? Math.round((projeto.captado / projeto.orcamento) * 100) : 0} color="#0d9488" />
        </div>

        {/* Centro de custo */}
        {(projeto as ProjetoExtended).centroCusto && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-xl px-3 py-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Centro de Custo: <strong className="text-slate-700">{(projeto as ProjetoExtended).centroCusto}</strong></span>
          </div>
        )}

        {/* Despesas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Lançamentos de Despesas</p>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">
              <Plus className="w-3.5 h-3.5" /> Lançar Despesa
            </button>
          </div>

          {/* Form nova despesa */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
                <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-violet-700">Nova Despesa</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                        placeholder="Descrição da despesa" className={inputCls} />
                    </div>
                    <input type="number" min={0} value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                      placeholder="Valor (R$)" className={inputCls} />
                    <input type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className={inputCls} />
                    <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Despesa['categoria'] }))}
                      className={inputCls}>
                      <option value="pessoal">Pessoal</option>
                      <option value="material">Material</option>
                      <option value="servico">Serviço</option>
                      <option value="infraestrutura">Infraestrutura</option>
                      <option value="outro">Outro</option>
                    </select>
                    <button onClick={addDespesa}
                      className="bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 transition-colors">
                      + Adicionar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Lista de despesas */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {despesas.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Nenhuma despesa lançada ainda.
              </div>
            )}
            {despesas.map(d => (
              <div key={d.id} className="flex items-center gap-3 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{d.descricao}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', categoriaConfig[d.categoria].color)}>
                      {categoriaConfig[d.categoria].label}
                    </span>
                    <span className="text-xs text-slate-400">{d.data}</span>
                  </div>
                </div>
                <p className="text-sm font-bold text-rose-600 shrink-0">{formatBRL(d.valor)}</p>
                <button onClick={() => removeDespesa(d.id)} className="text-slate-300 hover:text-red-400 transition-colors p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Alerta saldo negativo */}
        {saldo < 0 && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">Atenção: as despesas superam o valor captado em <strong>{formatBRL(Math.abs(saldo))}</strong>. Revise os lançamentos ou atualize o valor captado.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
        <button onClick={handleSave}
          className={cn('flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all',
            saved ? 'bg-emerald-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-500')}>
          {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar Lançamentos</>}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50">
          Fechar
        </button>
      </div>
    </ModalWrapper>
  );
}

// ─── Modal: Relatório do Projeto ──────────────────────────────
interface ReportModalProps {
  projeto: ProjetoExtended;
  onClose: () => void;
}

function ReportModal({ projeto, onClose }: ReportModalProps) {
  const despesas = projeto.despesas ?? [];
  const totalDespesas = despesas.reduce((s, d) => s + d.valor, 0);
  const saldo = projeto.captado - totalDespesas;
  const captacaoPct = projeto.orcamento > 0 ? Math.round((projeto.captado / projeto.orcamento) * 100) : 0;
  const benefPct = projeto.beneficiariosAlvo > 0 ? Math.round((projeto.beneficiariosAtivos / projeto.beneficiariosAlvo) * 100) : 0;
  const cfg = statusConfig[projeto.status];
  const Icon = cfg.icon;

  // Por categoria
  const categorias = (['pessoal', 'material', 'servico', 'infraestrutura', 'outro'] as Despesa['categoria'][]).map(cat => ({
    cat,
    total: despesas.filter(d => d.categoria === cat).reduce((s, d) => s + d.valor, 0),
  })).filter(c => c.total > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-teal-600 to-teal-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Relatório de Projeto</h3>
              <p className="text-xs text-teal-100">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Identificação */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{projeto.nome}</h2>
                <p className="text-sm text-slate-500 mt-1">{projeto.descricao}</p>
              </div>
              <span className={cn('flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border shrink-0', cfg.color)}>
                <Icon className="w-3 h-3" /> {cfg.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Coordenador', value: projeto.coordenador },
                { label: 'Centro de Custo', value: projeto.centroCusto || '—' },
                { label: 'Início', value: projeto.inicio },
                { label: 'Término Previsto', value: projeto.fim },
              ].map(f => (
                <div key={f.label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Progresso */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-teal-600" /> Indicadores de Desempenho</p>
            <div>
              <div className="flex justify-between mb-1"><span className="text-xs text-slate-500">Progresso Geral</span><span className="text-xs font-bold text-slate-700">{projeto.progresso}%</span></div>
              <ProgressBar value={projeto.progresso} />
            </div>
            {projeto.beneficiariosAlvo > 0 && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-slate-500">Meta Beneficiários</span>
                  <span className="text-xs font-bold text-violet-700">{projeto.beneficiariosAtivos}/{projeto.beneficiariosAlvo} ({benefPct}%)</span>
                </div>
                <ProgressBar value={benefPct} color="#8b5cf6" />
              </div>
            )}
          </div>

          {/* Financeiro */}
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-teal-600" /> Posição Financeira</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              {[
                { label: 'Valor do Projeto', value: formatBRL(projeto.orcamento), color: 'text-slate-800' },
                { label: 'Total Captado', value: `${formatBRL(projeto.captado)} (${captacaoPct}%)`, color: 'text-teal-700' },
                { label: 'Total Despesas', value: formatBRL(totalDespesas), color: 'text-rose-600' },
                { label: 'Saldo', value: formatBRL(saldo), color: saldo >= 0 ? 'text-emerald-700' : 'text-amber-700' },
              ].map(f => (
                <div key={f.label} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                  <p className="text-xs text-slate-400">{f.label}</p>
                  <p className={cn('text-sm font-bold mt-0.5', f.color)}>{f.value}</p>
                </div>
              ))}
            </div>

            {/* Captação barra */}
            <div className="mb-1">
              <div className="flex justify-between text-xs text-slate-400 mb-1"><span>Captação</span><span>{captacaoPct}%</span></div>
              <ProgressBar value={captacaoPct} color="#0d9488" />
            </div>

            {/* Despesas por categoria */}
            {categorias.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-500 mb-2">Despesas por Categoria</p>
                <div className="space-y-1.5">
                  {categorias.map(c => (
                    <div key={c.cat} className="flex items-center gap-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium w-28 text-center shrink-0', categoriaConfig[c.cat].color)}>
                        {categoriaConfig[c.cat].label}
                      </span>
                      <div className="flex-1">
                        <ProgressBar value={totalDespesas > 0 ? Math.round((c.total / totalDespesas) * 100) : 0} color="#6366f1" />
                      </div>
                      <span className="text-xs font-semibold text-slate-700 w-20 text-right shrink-0">{formatBRL(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Objetivos */}
          {projeto.objetivos && projeto.objetivos.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Objetivos</p>
              <ul className="space-y-1.5">
                {projeto.objetivos.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" /> {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados */}
          {projeto.resultados && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-700 mb-1">Resultados Alcançados</p>
              <p className="text-sm text-emerald-700">{projeto.resultados}</p>
            </div>
          )}

          {/* Equipe */}
          {projeto.equipe.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Equipe do Projeto</p>
              <div className="flex flex-wrap gap-1.5">
                {projeto.equipe.map(m => (
                  <span key={m} className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {projeto.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {projeto.tags.map(t => (
                <span key={t} className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  <Tag className="w-3 h-3" />{t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50">
          <p className="text-xs text-slate-400 text-center">Instituto Ser Melhor — Relatório gerado em {new Date().toLocaleString('pt-BR')}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────
function KanbanCard({ p }: { p: ProjetoExtended }) {
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
      {p.centroCusto && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Building2 className="w-3 h-3" /> {p.centroCusto}
        </div>
      )}
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
type ActiveModal =
  | { type: 'create' }
  | { type: 'edit'; projeto: ProjetoExtended }
  | { type: 'manage'; projeto: ProjetoExtended }
  | { type: 'accountability'; projeto: ProjetoExtended }
  | { type: 'report'; projeto: ProjetoExtended }
  | null;

export function CGIProjetos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Estado persistente — inicializado a partir do programsService (fonte canônica)
  const [projetosList, setProjetosList] = useState<ProjetoExtended[]>(() => {
    const fromService = programsService.getAll();
    if (fromService.length > 0) {
      // Converte SocialProgram → ProjetoExtended
      return fromService.map((sp): ProjetoExtended => ({
        id: sp.id,
        nome: sp.title,
        descricao: sp.description,
        status: sp.status as ProjetoSocial['status'],
        coordenador: sp.coordinator,
        inicio: sp.startDate,
        fim: sp.endDate,
        orcamento: sp.budget,
        captado: sp.raised,
        beneficiariosAlvo: sp.targetBeneficiaries,
        beneficiariosAtivos: sp.activeBeneficiaries,
        equipe: sp.team,
        tags: sp.tags,
        progresso: sp.progress,
        publicoAlvo: sp.targetAudience,
        objetivos: sp.objectives,
        fontes: sp.fundingSources,
        resultados: sp.results,
        centroCusto: sp.centroCusto,
        notas: sp.notas,
        isPublic: sp.isPublic,
      }));
    }
    const saved = localStorage.getItem('cgi_projetos');
    return saved ? JSON.parse(saved) : defaultProjetos;
  });

  // Escuta alterações reativas do programsService (ex: edições vindas de outra aba)
  useEffect(() => {
    const unsub = programsService.subscribe(() => {
      const fromService = programsService.getAll();
      setProjetosList(fromService.map((sp): ProjetoExtended => ({
        id: sp.id,
        nome: sp.title,
        descricao: sp.description,
        status: sp.status as ProjetoSocial['status'],
        coordenador: sp.coordinator,
        inicio: sp.startDate,
        fim: sp.endDate,
        orcamento: sp.budget,
        captado: sp.raised,
        beneficiariosAlvo: sp.targetBeneficiaries,
        beneficiariosAtivos: sp.activeBeneficiaries,
        equipe: sp.team,
        tags: sp.tags,
        progresso: sp.progress,
        publicoAlvo: sp.targetAudience,
        objetivos: sp.objectives,
        fontes: sp.fundingSources,
        resultados: sp.results,
        centroCusto: sp.centroCusto,
        notas: sp.notas,
        isPublic: sp.isPublic,
      })));
    });
    return unsub;
  }, []);

  /** Converte ProjetoExtended → SocialProgram e persiste via programsService */
  function toSocialProgram(p: ProjetoExtended): Omit<SocialProgram, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      title: p.nome,
      description: p.descricao,
      fullDescription: p.descricao,
      category: (p.tags[0] ?? 'Outro') as SocialProgram['category'],
      status: p.status as SocialProgram['status'],
      isPublic: (p as any).isPublic ?? false,
      targetAudience: p.publicoAlvo,
      objectives: p.objetivos,
      fundingSources: Array.isArray(p.fontes) ? p.fontes as string[] : [],
      results: p.resultados,
      coordinator: p.coordenador,
      team: p.equipe,
      tags: p.tags,
      startDate: p.inicio,
      endDate: p.fim,
      budget: p.orcamento,
      raised: p.captado,
      targetBeneficiaries: p.beneficiariosAlvo,
      activeBeneficiaries: p.beneficiariosAtivos,
      progress: p.progresso,
      centroCusto: p.centroCusto,
      notas: p.notas,
    };
  }

  function persist(list: ProjetoExtended[]) {
    setProjetosList(list);
    localStorage.setItem('cgi_projetos', JSON.stringify(list));
  }

  async function handleSaveNewProject(data: ProjetoExtended) {
    const created = await programsService.create(toSocialProgram(data));
    const withId = { ...data, id: created.id };
    persist([...projetosList, withId]);
  }

  async function handleUpdateProject(updated: ProjetoExtended) {
    await programsService.update(updated.id, toSocialProgram(updated));
    persist(projetosList.map(p => p.id === updated.id ? updated : p));
  }

  async function handleTogglePublic(id: string) {
    const p = projetosList.find(proj => proj.id === id);
    if (!p) return;
    const currentPublic = (p as any).isPublic ?? false;
    await programsService.update(id, { isPublic: !currentPublic });
    persist(projetosList.map(proj =>
      proj.id === id ? { ...proj, isPublic: !currentPublic } as any : proj
    ));
  }

  const filtered = projetosList.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.nome.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q) || p.coordenador.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const kpis = [
    { label: 'Total de Projetos', value: projetosList.length, color: 'text-slate-900' },
    { label: 'Ativos', value: projetosList.filter(p => p.status === 'ativo').length, color: 'text-emerald-600' },
    { label: 'Beneficiários Ativos', value: projetosList.reduce((s, p) => s + p.beneficiariosAtivos, 0), color: 'text-teal-600' },
    { label: 'Total Captado', value: formatBRL(projetosList.reduce((s, p) => s + p.captado, 0)), color: 'text-violet-600' },
  ];

  return (
    <>
      {/* Modais */}
      <AnimatePresence>
        {activeModal?.type === 'create' && (
          <ProjectFormModal
            onClose={() => setActiveModal(null)}
            onSave={data => { handleSaveNewProject(data); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'edit' && (
          <ProjectFormModal
            projeto={activeModal.projeto}
            onClose={() => setActiveModal(null)}
            onSave={data => { handleUpdateProject(data); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'manage' && (
          <ManageModal
            projeto={activeModal.projeto}
            onClose={() => setActiveModal(null)}
            onUpdate={updated => { handleUpdateProject(updated); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'accountability' && (
          <AccountabilityModal
            projeto={activeModal.projeto}
            onClose={() => setActiveModal(null)}
            onUpdate={updated => { handleUpdateProject(updated); setActiveModal(null); }}
          />
        )}
        {activeModal?.type === 'report' && (
          <ReportModal
            projeto={activeModal.projeto}
            onClose={() => setActiveModal(null)}
          />
        )}
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
          {/* Atalho para a página pública */}
          <button
            onClick={() => navigate('/programas')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-teal-200 text-teal-700 text-sm font-medium rounded-xl hover:bg-teal-50 transition-colors shadow-sm"
          >
            <Globe className="w-4 h-4" /> Página Pública
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <button
            onClick={() => setActiveModal({ type: 'create' })}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>

        {/* ── Kanban View ────────────────────────── */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map(col => {
              const colItems = projetosList.filter(p => p.status === col.id &&
                (statusFilter === 'all' || p.status === statusFilter) &&
                (!search || p.nome.toLowerCase().includes(search.toLowerCase()))
              );
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
                          {p.centroCusto && (
                            <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              <Building2 className="w-3 h-3" />{p.centroCusto}
                            </span>
                          )}
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
                            { icon: Building2, label: 'Centro de Custo', value: p.centroCusto || '—' },
                            { icon: Calendar, label: 'Início', value: p.inicio },
                            { icon: Calendar, label: 'Término', value: p.fim },
                          ].map(f => (
                            <div key={f.label} className="space-y-0.5">
                              <p className="text-xs text-slate-400">{f.label}</p>
                              <p className="text-sm font-medium text-slate-800">{f.value}</p>
                            </div>
                          ))}
                        </div>

                        {/* Financeiro resumo */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-slate-400 mb-1">Orçamento</p>
                            <p className="text-sm font-bold text-slate-800">{formatBRL(p.orcamento)}</p>
                          </div>
                          <div className="bg-teal-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-teal-500 mb-1">Captado</p>
                            <p className="text-sm font-bold text-teal-700">{formatBRL(p.captado)}</p>
                          </div>
                          <div className="bg-rose-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-rose-400 mb-1">Despesas</p>
                            <p className="text-sm font-bold text-rose-600">{formatBRL((p.despesas ?? []).reduce((s, d) => s + d.valor, 0))}</p>
                          </div>
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

                        {/* Notas */}
                        {p.notas && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-700 mb-1">Notas Internas</p>
                            <p className="text-xs text-amber-700">{p.notas}</p>
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

                        {/* Alert */}
                        {benefPct < 70 && p.status === 'ativo' && p.beneficiariosAlvo > 0 && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800">Meta de beneficiários abaixo do esperado ({benefPct}%). Revisão recomendada.</p>
                          </div>
                        )}

                        {/* Botões de Ação */}
                        <div className="flex flex-wrap gap-3 pt-1">
                          <button
                            onClick={e => { e.stopPropagation(); setActiveModal({ type: 'manage', projeto: p }); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors">
                            <Settings className="w-4 h-4" /> Gerenciar
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setActiveModal({ type: 'edit', projeto: p }); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                            <Edit3 className="w-4 h-4" /> Editar
                          </button>
                          {/* Toggle Visibilidade Pública */}
                          <button
                            onClick={e => { e.stopPropagation(); handleTogglePublic(p.id); }}
                            title={(p as any).isPublic ? 'Despublicar da página pública' : 'Publicar na página pública'}
                            className={cn(
                              'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl border transition-colors',
                              (p as any).isPublic
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            )}>
                            {(p as any).isPublic
                              ? <><Eye className="w-4 h-4" /> Público</>
                              : <><EyeOff className="w-4 h-4" /> Privado</>
                            }
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); navigate('/programas'); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-teal-200 text-teal-700 text-sm font-medium rounded-xl hover:bg-teal-50 transition-colors">
                            <ExternalLink className="w-4 h-4" /> Ver no Site
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setActiveModal({ type: 'accountability', projeto: p }); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                            <Receipt className="w-4 h-4" /> Prestação de Contas
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); setActiveModal({ type: 'report', projeto: p }); }}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors">
                            <FileText className="w-4 h-4" /> Relatório
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
                Nenhum projeto encontrado.
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
