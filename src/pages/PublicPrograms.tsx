import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart, Search, Filter, Users, Target, DollarSign, Calendar,
  ChevronRight, X, MapPin, TrendingUp, Star, ArrowRight,
  CheckCircle2, Clock, PauseCircle, Globe, Eye, Sparkles,
  BookOpen, Award, HandHeart,
} from 'lucide-react';
import { programsService, type SocialProgram, type ProgramStatus } from '../services/programsService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatBRL(val: number) {
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

const statusConfig: Record<ProgramStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ativo: { label: 'Em andamento', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: CheckCircle2 },
  planejamento: { label: 'Em planejamento', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  concluido: { label: 'Concluído', color: 'text-teal-700', bg: 'bg-teal-100', icon: Award },
  suspenso: { label: 'Suspenso', color: 'text-red-700', bg: 'bg-red-100', icon: PauseCircle },
};

const categoryColors: Record<string, string> = {
  'Saúde Mental': 'bg-violet-100 text-violet-700 border-violet-200',
  'Proteção Social': 'bg-rose-100 text-rose-700 border-rose-200',
  'Idoso': 'bg-amber-100 text-amber-700 border-amber-200',
  'Criança e Adolescente': 'bg-sky-100 text-sky-700 border-sky-200',
  'Cuidadores': 'bg-pink-100 text-pink-700 border-pink-200',
  'Educação': 'bg-indigo-100 text-indigo-700 border-indigo-200',
  'Transformação Digital': 'bg-cyan-100 text-cyan-700 border-cyan-200',
  'Outro': 'bg-slate-100 text-slate-700 border-slate-200',
};

// ─── Barra de Progresso Animada ───────────────────────────────────────────────
function ProgressBar({ value, color = '#0d9488' }: { value: number; color?: string }) {
  return (
    <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        className="absolute top-0 left-0 h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

// ─── Card de Programa ─────────────────────────────────────────────────────────
function ProgramCard({ program, onSelect }: { program: SocialProgram; onSelect: (p: SocialProgram) => void }) {
  const status = statusConfig[program.status] || statusConfig.ativo;
  const StatusIcon = status.icon;
  const catColor = categoryColors[program.category] || categoryColors['Outro'];
  const pctFunded = program.budget > 0 ? Math.min((program.raised / program.budget) * 100, 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.12)' }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden cursor-pointer group"
      onClick={() => onSelect(program)}
    >
      {/* Header colorido */}
      <div
        className="h-2"
        style={{
          background: program.status === 'ativo'
            ? 'linear-gradient(90deg, #0d9488, #14b8a6)'
            : program.status === 'planejamento'
            ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
            : program.status === 'concluido'
            ? 'linear-gradient(90deg, #0f766e, #2dd4bf)'
            : 'linear-gradient(90deg, #ef4444, #f87171)',
        }}
      />

      <div className="p-6">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${catColor}`}>
            {program.category}
          </span>
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        </div>

        {/* Título */}
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors mb-2 leading-snug">
          {program.title}
        </h3>

        {/* Descrição */}
        <p className="text-slate-500 text-sm leading-relaxed mb-4 line-clamp-2">
          {program.description}
        </p>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2.5 bg-slate-50 rounded-xl">
            <div className="text-lg font-bold text-slate-800">{program.activeBeneficiaries}</div>
            <div className="text-xs text-slate-500 mt-0.5">Beneficiários</div>
          </div>
          <div className="text-center p-2.5 bg-slate-50 rounded-xl">
            <div className="text-lg font-bold text-teal-700">{program.progress}%</div>
            <div className="text-xs text-slate-500 mt-0.5">Progresso</div>
          </div>
          <div className="text-center p-2.5 bg-slate-50 rounded-xl">
            <div className="text-lg font-bold text-slate-800">{program.team.length}</div>
            <div className="text-xs text-slate-500 mt-0.5">Profissionais</div>
          </div>
        </div>

        {/* Progresso bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Captação</span>
            <span>{formatBRL(program.raised)} / {formatBRL(program.budget)}</span>
          </div>
          <ProgressBar value={pctFunded} color={program.status === 'ativo' ? '#0d9488' : '#3b82f6'} />
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span className="truncate max-w-[120px]">{program.coordinator}</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 group-hover:gap-2 transition-all">
            Ver detalhes <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Modal de Detalhes ────────────────────────────────────────────────────────
function ProgramDetailModal({ program, onClose, onParticipate }: {
  program: SocialProgram;
  onClose: () => void;
  onParticipate: () => void;
}) {
  const status = statusConfig[program.status] || statusConfig.ativo;
  const StatusIcon = status.icon;
  const catColor = categoryColors[program.category] || categoryColors['Outro'];
  const pctFunded = program.budget > 0 ? Math.min((program.raised / program.budget) * 100, 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="bg-white w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header colorido */}
        <div
          className="h-1.5 rounded-t-3xl"
          style={{
            background:
              program.status === 'ativo'
                ? 'linear-gradient(90deg, #0d9488, #14b8a6, #06b6d4)'
                : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
          }}
        />

        <div className="p-6 sm:p-8">
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 sm:top-7 sm:right-7 p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${catColor}`}>
              {program.category}
            </span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {status.label}
            </span>
          </div>

          {/* Título */}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight pr-8">
            {program.title}
          </h2>

          {/* Coordenador */}
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-5">
            <Award className="w-4 h-4 text-teal-600" />
            <span>Coordenação: <strong>{program.coordinator}</strong></span>
          </div>

          {/* Descrição completa */}
          <p className="text-slate-700 leading-relaxed mb-6 text-[15px]">
            {program.fullDescription || program.description}
          </p>

          {/* Grid de métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-teal-50 to-teal-100/60 rounded-2xl p-4 text-center">
              <div className="text-2xl font-extrabold text-teal-700">{program.activeBeneficiaries}</div>
              <div className="text-xs text-teal-600 font-medium mt-0.5">Beneficiários ativos</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-2xl p-4 text-center">
              <div className="text-2xl font-extrabold text-blue-700">{program.targetBeneficiaries}</div>
              <div className="text-xs text-blue-600 font-medium mt-0.5">Meta</div>
            </div>
            <div className="bg-gradient-to-br from-violet-50 to-violet-100/60 rounded-2xl p-4 text-center">
              <div className="text-2xl font-extrabold text-violet-700">{program.progress}%</div>
              <div className="text-xs text-violet-600 font-medium mt-0.5">Progresso</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-2xl p-4 text-center">
              <div className="text-2xl font-extrabold text-amber-700">{program.team.length}</div>
              <div className="text-xs text-amber-600 font-medium mt-0.5">Profissionais</div>
            </div>
          </div>

          {/* Captação */}
          <div className="bg-slate-50 rounded-2xl p-4 mb-5">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="font-semibold text-slate-700">Captação de recursos</span>
              <span className="text-teal-700 font-bold">{Math.round(pctFunded)}%</span>
            </div>
            <ProgressBar value={pctFunded} />
            <div className="flex justify-between text-xs text-slate-500 mt-2">
              <span>Captado: <strong className="text-slate-700">{formatBRL(program.raised)}</strong></span>
              <span>Meta: <strong className="text-slate-700">{formatBRL(program.budget)}</strong></span>
            </div>
          </div>

          {/* Datas */}
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Início: <strong className="text-slate-700">{formatDate(program.startDate)}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Término: <strong className="text-slate-700">{formatDate(program.endDate)}</strong></span>
            </div>
          </div>

          {/* Público-alvo */}
          {program.targetAudience && (
            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" /> Público-alvo
              </h4>
              <p className="text-sm text-slate-600 bg-teal-50 rounded-xl px-4 py-3">
                {program.targetAudience}
              </p>
            </div>
          )}

          {/* Objetivos */}
          {program.objectives && program.objectives.length > 0 && (
            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-600" /> Objetivos
              </h4>
              <ul className="space-y-2">
                {program.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Resultados */}
          {program.results && (
            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-violet-600" /> Resultados alcançados
              </h4>
              <p className="text-sm text-slate-600 bg-violet-50 rounded-xl px-4 py-3">
                {program.results}
              </p>
            </div>
          )}

          {/* Equipe */}
          {program.team.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" /> Equipe responsável
              </h4>
              <div className="flex flex-wrap gap-2">
                {program.team.map((member, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-medium"
                  >
                    <Star className="w-3 h-3" />
                    {member}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {program.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {program.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          {program.status === 'ativo' && (
            <button
              onClick={onParticipate}
              className="w-full py-4 rounded-2xl font-bold text-white text-base bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2 group"
            >
              <HandHeart className="w-5 h-5" />
              Solicitar participação / Acolhimento
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          )}
          {program.status === 'planejamento' && (
            <div className="w-full py-4 rounded-2xl font-semibold text-blue-700 text-sm bg-blue-50 border border-blue-100 text-center">
              Este programa está em planejamento. Em breve abriremos inscrições!
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente Principal ─────────────────────────────────────────────────────
const CATEGORIES = ['Todos', 'Saúde Mental', 'Proteção Social', 'Idoso', 'Criança e Adolescente', 'Cuidadores', 'Educação', 'Transformação Digital', 'Outro'];

export default function PublicPrograms() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<SocialProgram[]>(() => programsService.getPublic());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selected, setSelected] = useState<SocialProgram | null>(null);

  // Inscrever no serviço para atualizações reativas em tempo real
  useEffect(() => {
    const unsub = programsService.subscribe(() => {
      setPrograms(programsService.getPublic());
    });
    programsService.syncWithAPI();
    return unsub;
  }, []);

  // Filtros combinados
  const filtered = useMemo(() => {
    return programs.filter((p) => {
      const matchSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.targetAudience || '').toLowerCase().includes(search.toLowerCase());
      const matchCat = category === 'Todos' || p.category === category;
      const matchStatus = statusFilter === 'Todos' || p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [programs, search, category, statusFilter]);

  // Métricas de impacto
  const stats = useMemo(() => {
    const active = programs.filter((p) => p.status === 'ativo');
    return {
      totalPrograms: programs.length,
      activePrograms: active.length,
      totalBeneficiaries: programs.reduce((acc, p) => acc + p.activeBeneficiaries, 0),
      totalRaised: programs.reduce((acc, p) => acc + p.raised, 0),
    };
  }, [programs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/30 to-blue-50/20">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white">
        {/* Background decorativo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-teal-300/80 text-sm mb-8">
            <button onClick={() => navigate('/')} className="hover:text-white transition-colors">Início</button>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white font-medium">Nossos Programas</span>
          </nav>

          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-teal-500/20 rounded-2xl border border-teal-400/30 backdrop-blur-sm">
              <Heart className="w-8 h-8 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 text-sm font-semibold uppercase tracking-wide">Instituto Ser Melhor</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight">
                Nossos Programas Sociais
              </h1>
            </div>
          </div>

          <p className="text-teal-100/90 text-lg max-w-2xl leading-relaxed mb-10">
            Iniciativas que transformam vidas. Conheça os programas do Instituto Ser Melhor e descubra como você pode fazer parte dessa mudança.
          </p>

          {/* Stats de Impacto */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Programas', value: stats.totalPrograms, icon: BookOpen, color: 'text-teal-300' },
              { label: 'Ativos', value: stats.activePrograms, icon: CheckCircle2, color: 'text-emerald-300' },
              { label: 'Beneficiários', value: stats.totalBeneficiaries, icon: Users, color: 'text-blue-300' },
              { label: 'Captado', value: formatBRL(stats.totalRaised), icon: DollarSign, color: 'text-amber-300' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4"
              >
                <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
                <div className="text-2xl font-extrabold">{s.value}</div>
                <div className="text-teal-200/80 text-xs font-medium mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filtros ───────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar programa, público-alvo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtro Status */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="Todos">Todos os status</option>
              <option value="ativo">Em andamento</option>
              <option value="planejamento">Em planejamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>

          {/* Chips de categoria */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  category === cat
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de Programas ─────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-slate-600 font-medium text-lg mb-1">Nenhum programa encontrado</p>
            <p className="text-slate-400 text-sm">Tente outros filtros ou termos de busca.</p>
            <button
              onClick={() => { setSearch(''); setCategory('Todos'); setStatusFilter('Todos'); }}
              className="mt-4 px-5 py-2 rounded-xl bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition"
            >
              Limpar filtros
            </button>
          </motion.div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-slate-500">
                <strong className="text-slate-700">{filtered.length}</strong>{' '}
                {filtered.length === 1 ? 'programa encontrado' : 'programas encontrados'}
              </p>
            </div>
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((p) => (
                  <ProgramCard key={p.id} program={p} onSelect={setSelected} />
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}

        {/* CTA Fundo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-gradient-to-br from-teal-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-blue-500/10 pointer-events-none" />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center mx-auto mb-4">
              <HandHeart className="w-7 h-7 text-teal-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Precisa de apoio?</h2>
            <p className="text-teal-100/80 text-lg max-w-lg mx-auto mb-8">
              Realize nosso acolhimento gratuito e descubra qual programa social é mais adequado para você ou sua família.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/acolhimento')}
                className="px-8 py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-teal-500 to-teal-400 hover:from-teal-400 hover:to-teal-300 text-slate-900 shadow-lg transition-all flex items-center justify-center gap-2 group"
              >
                Iniciar acolhimento
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/doe')}
                className="px-8 py-4 rounded-2xl font-bold text-base bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all flex items-center justify-center gap-2"
              >
                <Heart className="w-4 h-4 text-rose-400" />
                Apoiar os programas
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Modal de Detalhes ─────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <ProgramDetailModal
            program={selected}
            onClose={() => setSelected(null)}
            onParticipate={() => {
              setSelected(null);
              navigate('/acolhimento');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
