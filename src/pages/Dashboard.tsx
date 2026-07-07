import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Video, Calendar as CalendarIcon, Clock, AlertCircle, Heart, Users, Activity,
  CheckCircle, Timer, XCircle, UserCheck, TrendingUp, Wifi, ChevronRight,
  DollarSign, FileText, Shield, BookOpen, Cpu, TrendingDown, MessageSquare,
  Landmark, QrCode, Brain, Zap, ArrowUpRight, BarChart2, RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
function getTodayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function ls<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}

function KpiCard({
  label, value, sub, icon: Icon, color = 'teal', to, pulse = false,
}: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>; color?: string;
  to?: string; pulse?: boolean;
}) {
  const navigate = useNavigate();
  const colorMap: Record<string, string> = {
    teal: 'text-teal-700 bg-teal-50 border-teal-100',
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    rose: 'text-rose-700 bg-rose-50 border-rose-100',
    indigo: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    purple: 'text-purple-700 bg-purple-50 border-purple-100',
    slate: 'text-slate-700 bg-slate-50 border-slate-100',
  };
  return (
    <div
      onClick={() => to && navigate(to)}
      className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-all group ${to ? 'cursor-pointer hover:border-teal-200' : ''}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-xl border ${colorMap[color] ?? colorMap.teal}`}>
          <Icon className="w-4 h-4" />
        </div>
        {pulse && (
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
        )}
        {to && !pulse && <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />}
      </div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-bold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1.5">{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, to, label = 'Ver tudo' }: { title: string; to?: string; label?: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {to && (
        <button
          onClick={() => navigate(to)}
          className="flex items-center gap-0.5 text-xs font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider transition-colors"
        >
          {label}<ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function MetricRow({ label, value, to, highlight }: { label: string; value: React.ReactNode; to?: string; highlight?: string }) {
  const navigate = useNavigate();
  return (
    <div
      className={`flex justify-between items-center bg-slate-50 p-2.5 rounded-lg text-xs ${to ? 'cursor-pointer hover:bg-teal-50 transition-colors group' : ''}`}
      onClick={() => to && navigate(to)}
    >
      <span className="text-slate-500 group-hover:text-teal-700 transition-colors">{label}</span>
      <span className={`font-semibold font-mono ${highlight ?? 'text-slate-800'} flex items-center gap-1`}>
        {value}
        {to && <ArrowUpRight className="w-3 h-3 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
      </span>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'operational'>('summary');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const appointments  = ls<any[]>('appointments_list', []);
  const voluntarios   = ls<any[]>('cgi_voluntarios', []);
  const professionals = ls<any[]>('professionals_list', []);
  const dossiers      = ls<any[]>('satai_dossiers', []);
  const patients      = ls<any[]>('patients_list', []);
  const messages      = ls<any[]>('messages_list', []);
  const piaravecos    = ls<any[]>('piarave_cases', []);
  const transactions  = ls<any[]>('financial_transactions', []);
  const pixDonations  = ls<any[]>('financial_pix_donations', []);
  const sodoArticles  = ls<any[]>('sodo_articles', []);
  const sodoCourses   = ls<any[]>('sodo_courses', []);
  const sodoCerts     = ls<any[]>('sodo_certificates', []);
  const bankConns     = ls<any[]>('banking_integrations_list', []);

  const totalVolunteers    = voluntarios.length;
  const totalProfessionals = professionals.length;
  const activeProfessionals = professionals.filter((p: any) => p.status === 'ACTIVE').length;
  const totalHoursDonated  = voluntarios.reduce((s: number, v: any) => s + (Number(v.horasMes) || 0), 0)
    + professionals.reduce((s: number, p: any) => s + (Number(p.hoursDonated) || 0), 0);

  const completedAppts  = appointments.filter((a: any) => a.status === 'completed').length;
  const pendingAppts    = appointments.filter((a: any) => a.status === 'upcoming').length;
  const inProgressAppts = appointments.filter((a: any) => a.status === 'in_progress').length;
  const cancelledAppts  = appointments.filter((a: any) => a.status === 'cancelled').length;

  const pendingTriage  = dossiers.filter((d: any) => d.status === 'pending_review').length;
  const totalDossiers  = dossiers.length;
  const totalPatients  = patients.length;
  const activePatients = patients.filter((p: any) => p.status === 'Ativo').length;
  const openPiarave    = piaravecos.filter((c: any) => c.status === 'open' || c.status === 'em_atendimento').length;
  const unreadMessages = messages.filter((m: any) => !m.read).length;

  const totalIncome  = transactions.filter((t: any) => t.type === 'INCOME' && t.status === 'COMPLETED').reduce((s: number, t: any) => s + t.amount, 0);
  const totalExpense = transactions.filter((t: any) => t.type === 'EXPENSE' && t.status === 'COMPLETED').reduce((s: number, t: any) => s + t.amount, 0);
  const netBalance   = totalIncome - totalExpense;
  const pixTotal     = pixDonations.filter((d: any) => d.status !== 'EXPIRED').reduce((s: number, d: any) => s + d.amount, 0);
  const pendingPix   = pixDonations.filter((d: any) => d.status === 'PENDING').length;
  const connectedBanks = bankConns.filter((b: any) => b.status === 'CONNECTED').length;

  const upcomingList = appointments.filter((a: any) => a.status === 'upcoming').slice(0, 5);
  const activeRooms  = appointments
    .filter((a: any) => a.status === 'in_progress' || a.status === 'upcoming')
    .map((a: any) => ({
      id: `SALA-${(a.id?.toString() ?? '0000').slice(-4)}`,
      professional: a.professionalName ?? '—',
      patient: a.patientName ?? '—',
      duration: a.duration ?? '50 min',
      status: a.status,
    }));

  const occupancyRate = appointments.length > 0
    ? Math.round((completedAppts / appointments.length) * 100) : 0;

  const greeting   = getGreeting();
  const todayLabel = getTodayLabel();
  const timeStr    = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {greeting}, {user?.name?.split(' ')[0] ?? 'Bem-vindo'} 👋
            </h1>
            <p className="text-sm text-slate-500 mt-0.5 capitalize">{todayLabel} · {timeStr}</p>
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Sistema Operacional
            </div>
            <button onClick={() => window.location.reload()}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-teal-600 hover:border-teal-200 transition-all" title="Atualizar dados">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-8">
          {[
            { id: 'summary', label: '📋 Resumo Operacional Diário' },
            { id: 'operational', label: '📡 Telemetria & Salas Ativas' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-semibold relative transition-all ${activeTab === tab.id ? 'text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}>
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeDashboardTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600 rounded-full" />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ═══════ TAB 1: RESUMO OPERACIONAL ═══════ */}
          {activeTab === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* KPI: Clínico */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">🏥 Clínico & Atendimento</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <KpiCard label="Atendimentos Hoje" value={completedAppts} sub="concluídos" icon={CheckCircle} color="emerald" to="/calendar" />
                  <KpiCard label="Em Andamento" value={inProgressAppts} sub="consultas agora" icon={Activity} color="teal" to="/calendar" pulse={inProgressAppts > 0} />
                  <KpiCard label="Agendados" value={pendingAppts} sub="próximas sessões" icon={CalendarIcon} color="indigo" to="/calendar" />
                  <KpiCard label="Fila SATAI" value={pendingTriage} sub="aguardando triagem" icon={AlertCircle} color={pendingTriage > 0 ? 'amber' : 'slate'} to="/satai" />
                  <KpiCard label="Pacientes Ativos" value={activePatients} sub={`de ${totalPatients} cadastrados`} icon={Users} color="purple" to="/patients" />
                  <KpiCard label="PIARAVE Abertos" value={openPiarave} sub={`de ${piaravecos.length} casos`} icon={Shield} color="rose" to="/piarave" />
                </div>
              </div>

              {/* KPI: Equipe */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">👥 Equipe & Voluntariado</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Profissionais Ativos" value={activeProfessionals} sub={`de ${totalProfessionals} cadastrados`} icon={UserCheck} color="teal" to="/professionals" />
                  <KpiCard label="Voluntários CGI" value={totalVolunteers} sub="ativos no sistema" icon={Heart} color="rose" to="/cgi" />
                  <KpiCard label="Horas Doadas" value={`${totalHoursDonated}h`} sub="este mês" icon={Timer} color="amber" to="/cgi" />
                  <KpiCard label="Mensagens" value={unreadMessages || 0} sub="não lidas" icon={MessageSquare} color={unreadMessages > 0 ? 'rose' : 'slate'} to="/messages" />
                </div>
              </div>

              {/* KPI: Financeiro */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">💰 Financeiro & Captação</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Receitas" value={fmtBRL(totalIncome)} sub="lançamentos concluídos" icon={TrendingUp} color="emerald" to="/financial" />
                  <KpiCard label="Despesas" value={fmtBRL(totalExpense)} sub="lançamentos concluídos" icon={TrendingDown} color="rose" to="/financial" />
                  <KpiCard label="Saldo Líquido" value={fmtBRL(netBalance)} sub="receitas − despesas" icon={DollarSign} color={netBalance >= 0 ? 'teal' : 'rose'} to="/financial" />
                  <KpiCard label="Doações PIX" value={fmtBRL(pixTotal)} sub={`${pendingPix} pendentes`} icon={QrCode} color="indigo" to="/financial" />
                </div>
              </div>

              {/* KPI: Conhecimento */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">📚 SODO & Conhecimento</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Documentos SODO" value={sodoArticles.length} sub="artigos publicados" icon={FileText} color="indigo" to="/sodo" />
                  <KpiCard label="Cursos" value={sodoCourses.length} sub="trilhas de aprendizagem" icon={BookOpen} color="purple" to="/academia" />
                  <KpiCard label="Certificados" value={sodoCerts.length} sub="pela academia" icon={CheckCircle} color="emerald" to="/academia" />
                  <KpiCard label="Bancos Conectados" value={`${connectedBanks}/${bankConns.length}`} sub="integrações ativas" icon={Landmark} color={connectedBanks > 0 ? 'teal' : 'amber'} to="/financial" />
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Próximos Atendimentos */}
                <div className="lg:col-span-2">
                  <SectionHeader title="Próximos Atendimentos" to="/calendar" label="Agenda completa" />
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    {upcomingList.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Nenhum atendimento agendado pendente.</div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {upcomingList.map((apt: any) => (
                          <div key={apt.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-xl bg-slate-50 border border-slate-100">
                              <Clock className="w-4 h-4 text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-slate-700">{apt.time ?? '—'}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-slate-900 text-sm truncate">{apt.patientName ?? '—'}</div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                <span className="flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-medium capitalize">
                                  {apt.type === 'online' ? <Video className="w-3 h-3 text-teal-600" /> : <CalendarIcon className="w-3 h-3 text-amber-600" />}
                                  {apt.type ?? 'presencial'}
                                </span>
                                <span>{apt.professionalName ?? ''}</span>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              {apt.type === 'online' ? (
                                <button onClick={() => navigate(`/telehealth/${apt.id}`)}
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1">
                                  <Video className="w-3.5 h-3.5" />Iniciar
                                </button>
                              ) : (
                                <button onClick={() => navigate(`/patients/${apt.patientId ?? '1'}`)}
                                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">
                                  Prontuário
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna: Alertas + Acesso Rápido */}
                <div className="space-y-4">

                  <div>
                    <SectionHeader title="⚠️ Alertas Operacionais" />
                    <div className="space-y-2">
                      {pendingTriage > 0 && (
                        <div onClick={() => navigate('/satai')} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 cursor-pointer hover:bg-amber-100 transition-colors">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-amber-900">{pendingTriage} triagens SATAI pendentes</div>
                            <div className="text-[11px] text-amber-700 mt-0.5">Casos aguardando revisão técnica</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
                        </div>
                      )}
                      {pendingPix > 0 && (
                        <div onClick={() => navigate('/financial')} className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 rounded-xl p-3 cursor-pointer hover:bg-indigo-100 transition-colors">
                          <QrCode className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-indigo-900">{pendingPix} doações PIX pendentes</div>
                            <div className="text-[11px] text-indigo-700 mt-0.5">Aguardando confirmação bancária</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />
                        </div>
                      )}
                      {unreadMessages > 0 && (
                        <div onClick={() => navigate('/messages')} className="flex items-start gap-3 bg-rose-50 border border-rose-200 rounded-xl p-3 cursor-pointer hover:bg-rose-100 transition-colors">
                          <MessageSquare className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-xs font-bold text-rose-900">{unreadMessages} mensagens não lidas</div>
                            <div className="text-[11px] text-rose-700 mt-0.5">Acesse o módulo de Mensagens</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-rose-400 shrink-0" />
                        </div>
                      )}
                      {pendingTriage === 0 && pendingPix === 0 && unreadMessages === 0 && (
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />Tudo em dia!
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <SectionHeader title="🚀 Acesso Rápido" />
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Pacientes', icon: Users, to: '/patients', color: 'bg-purple-50 text-purple-700 border-purple-100' },
                        { label: 'Financeiro', icon: DollarSign, to: '/financial', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
                        { label: 'SATAI', icon: Brain, to: '/satai', color: 'bg-amber-50 text-amber-700 border-amber-100' },
                        { label: 'PIARAVE', icon: Shield, to: '/piarave', color: 'bg-rose-50 text-rose-700 border-rose-100' },
                        { label: 'SODO', icon: BookOpen, to: '/sodo', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                        { label: 'Doações', icon: QrCode, to: '/doe', color: 'bg-teal-50 text-teal-700 border-teal-100' },
                      ].map(q => (
                        <button key={q.to} onClick={() => navigate(q.to)}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all hover:shadow-sm active:scale-[0.97] ${q.color}`}>
                          <q.icon className="w-4 h-4 shrink-0" />{q.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <SectionHeader title="📢 Mural Institucional" />
                    <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4 text-teal-600 fill-current shrink-0" />
                        <h3 className="font-bold text-teal-900 text-xs">Campanha de Inverno 2026</h3>
                      </div>
                      <p className="text-[11px] text-teal-800 leading-relaxed">Arrecadação de agasalhos — ponto de coleta até 15/07.</p>
                      <button onClick={() => navigate('/doe')} className="text-[11px] font-bold text-teal-600 hover:text-teal-800 flex items-center gap-0.5">
                        Painel de doações<ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════ TAB 2: TELEMETRIA ═══════ */}
          {activeTab === 'operational' && (
            <motion.div key="operational" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }} className="space-y-6">

              {/* KPIs Tempo Real */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3">⚡ Indicadores em Tempo Real</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard label="Consultas em Andamento" value={inProgressAppts} sub="salas virtuais ativas" icon={Activity} color="teal" to="/calendar" pulse={inProgressAppts > 0} />
                  <KpiCard label="Concluídas Hoje" value={completedAppts} sub="sessões encerradas" icon={CheckCircle} color="emerald" to="/calendar" />
                  <KpiCard label="Ocupação de Agenda" value={`${occupancyRate}%`} sub="taxa de aproveitamento" icon={BarChart2} color="indigo" to="/calendar" />
                  <KpiCard label="Canceladas" value={cancelledAppts} sub="sessões canceladas" icon={XCircle} color={cancelledAppts > 2 ? 'rose' : 'slate'} to="/calendar" />
                </div>
              </div>

              {/* Métricas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                  <SectionHeader title="🌐 Métricas de Rede" />
                  <MetricRow label="Qualidade Geral" value={<><Wifi className="w-3.5 h-3.5" />Excelente (94%)</>} highlight="text-emerald-600" />
                  <MetricRow label="Latência Média (Ping)" value="38 ms" />
                  <MetricRow label="Salas com oscilação" value={`0 / ${activeRooms.length}`} highlight="text-amber-600" />
                  <MetricRow label="E2EE ativo" value="✅ Todas as salas" highlight="text-emerald-600" />
                  <MetricRow label="Uptime do Servidor" value="99.97%" highlight="text-emerald-600" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                  <SectionHeader title="👨‍⚕️ Profissionais em Operação" to="/professionals" label="Ver todos" />
                  <MetricRow label="Profissionais Ativos" value={`${activeProfessionals} técnicos`} highlight="text-teal-700" to="/professionals" />
                  <MetricRow label="Voluntários CGI" value={`${totalVolunteers} cadastrados`} to="/cgi" />
                  <MetricRow label="Horas doadas no mês" value={`${totalHoursDonated}h`} highlight="text-amber-600" to="/cgi" />
                  <MetricRow label="Ocupação de Agenda" value={`${occupancyRate}%`} />
                  <MetricRow label="Fila SATAI" value={`${pendingTriage} pendentes`} highlight={pendingTriage > 0 ? 'text-rose-600' : 'text-emerald-600'} to="/satai" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                  <SectionHeader title="⚠️ Cancelamentos & Absenteísmo" to="/calendar" label="Ver agenda" />
                  <div className="grid grid-cols-2 gap-3 mb-1">
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                      <XCircle className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-rose-700">{cancelledAppts}</div>
                      <div className="text-[10px] text-rose-600 font-semibold">Cancelamentos</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                      <AlertCircle className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <div className="text-2xl font-bold text-amber-700">{appointments.filter((a: any) => a.status === 'no_show').length}</div>
                      <div className="text-[10px] text-amber-600 font-semibold">No-show</div>
                    </div>
                  </div>
                  <MetricRow label="Taxa de absenteísmo" value={`${appointments.length > 0 ? ((cancelledAppts / appointments.length) * 100).toFixed(1) : 0}%`} highlight={cancelledAppts > 3 ? 'text-rose-600' : 'text-emerald-600'} />
                  <MetricRow label="Meta" value="< 10%" />
                </div>
              </div>

              {/* Resumos cruzados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                  <SectionHeader title="💰 Resumo Financeiro" to="/financial" label="Módulo completo" />
                  <MetricRow label="Receitas realizadas" value={fmtBRL(totalIncome)} highlight="text-emerald-600" to="/financial" />
                  <MetricRow label="Despesas realizadas" value={fmtBRL(totalExpense)} highlight="text-rose-600" to="/financial" />
                  <MetricRow label="Saldo líquido" value={fmtBRL(netBalance)} highlight={netBalance >= 0 ? 'text-teal-700' : 'text-rose-600'} to="/financial" />
                  <MetricRow label="Doações via PIX" value={fmtBRL(pixTotal)} highlight="text-indigo-600" to="/financial" />
                  <MetricRow label="Doações pendentes" value={`${pendingPix}`} highlight={pendingPix > 0 ? 'text-amber-600' : 'text-emerald-600'} to="/financial" />
                  <MetricRow label="Bancos integrados" value={`${connectedBanks} / ${bankConns.length}`} to="/financial" />
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-5 space-y-3">
                  <SectionHeader title="🧠 Sistema & Conhecimento" to="/sodo" label="Portal SODO" />
                  <MetricRow label="Documentos SODO" value={sodoArticles.length} to="/sodo" />
                  <MetricRow label="Cursos disponíveis" value={sodoCourses.length} to="/academia" />
                  <MetricRow label="Certificados emitidos" value={sodoCerts.length} highlight="text-emerald-600" to="/academia" />
                  <MetricRow label="Pacientes cadastrados" value={totalPatients} to="/patients" />
                  <MetricRow label="Casos PIARAVE ativos" value={openPiarave} highlight={openPiarave > 0 ? 'text-rose-600' : 'text-emerald-600'} to="/piarave" />
                  <MetricRow label="Triagens SATAI no sistema" value={totalDossiers} to="/satai" />
                </div>
              </div>

              {/* Salas Ativas */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Ambientes de Atendimento Ativos</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Salas virtuais de teleconsulta em operação agora</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2 py-1 rounded-full">
                      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} · Tempo real
                    </span>
                    <button onClick={() => navigate('/calendar')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-xs font-bold rounded-xl hover:bg-teal-500 transition-colors">
                      <Video className="w-3.5 h-3.5" />Ver Agenda
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-2.5 pr-4">Sala</th>
                        <th className="py-2.5 pr-4">Profissional</th>
                        <th className="py-2.5 pr-4">Beneficiário</th>
                        <th className="py-2.5 pr-4">Duração</th>
                        <th className="py-2.5 pr-4 text-center">Status</th>
                        <th className="py-2.5 text-center">E2EE</th>
                        <th className="py-2.5 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      {activeRooms.map((room: any) => (
                        <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 pr-4 font-mono text-slate-400">{room.id}</td>
                          <td className="py-3.5 pr-4">{room.professional}</td>
                          <td className="py-3.5 pr-4">{room.patient}</td>
                          <td className="py-3.5 pr-4 font-mono text-slate-500">{room.duration}</td>
                          <td className="py-3.5 pr-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${room.status === 'in_progress' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                              {room.status === 'in_progress' ? '🟢 Ativa' : '🟡 Aguardando'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center text-teal-600 font-semibold text-[10px]">🔒 Ativo</td>
                          <td className="py-3.5 text-right">
                            <button onClick={() => navigate('/calendar')}
                              className="flex items-center gap-1 ml-auto px-2.5 py-1 bg-teal-50 border border-teal-200 text-teal-700 text-[10px] font-bold rounded-lg hover:bg-teal-100 transition-colors">
                              <Zap className="w-3 h-3" />Acessar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {activeRooms.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-slate-400 text-sm">
                            <Video className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            Nenhuma sala de teleconsulta ativa no momento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Platform Health Link */}
              <div onClick={() => navigate('/auditoria-plataforma')}
                className="flex items-center justify-between bg-slate-900 text-white rounded-2xl p-4 cursor-pointer hover:bg-slate-800 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/10 rounded-xl"><Cpu className="w-5 h-5 text-teal-400" /></div>
                  <div>
                    <div className="font-bold text-sm">Platform Health & Audit Center</div>
                    <div className="text-xs text-slate-400 mt-0.5">Logs de auditoria, segurança e integridade da plataforma</div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-400 transition-colors" />
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
