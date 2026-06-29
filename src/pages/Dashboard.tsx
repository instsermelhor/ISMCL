import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  Heart,
  Users,
  Activity,
  CheckCircle,
  Timer,
  XCircle,
  UserCheck,
  TrendingUp,
  Wifi,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const upcomingAppointments = [
  { id: '1', patient: 'Ana Silva', time: '14:00', type: 'online', status: 'next' },
  { id: '2', patient: 'Marcos Santos', time: '15:30', type: 'online', status: 'pending' },
  { id: '3', patient: 'Júlia Costa', time: '17:00', type: 'presencial', status: 'pending' },
];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'summary' | 'operational'>('summary');
  const greeting = getGreeting();
  const todayLabel = getTodayLabel();

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{greeting}, {user?.name ?? 'Bem-vindo'}</h1>
            <p className="text-sm text-slate-500 mt-1">Aqui está o resumo do seu dia no Instituto Ser Melhor.</p>
          </motion.div>
          
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-xs font-semibold text-slate-400 font-mono uppercase bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {todayLabel}
            </div>
          </div>
        </header>

        {/* Tab Switcher (Professional Tabbed View) */}
        <div className="flex border-b border-slate-200 gap-6">
          <button 
            onClick={() => setActiveTab('summary')}
            className={`pb-3 text-sm font-semibold relative transition-all ${activeTab === 'summary' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Resumo Operacional Diário
            {activeTab === 'summary' && (
              <motion.div layoutId="activeDashboardTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600" />
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('operational')}
            className={`pb-3 text-sm font-semibold relative transition-all ${activeTab === 'operational' ? 'text-teal-700 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Painel de Telemetria e Salas Ativas
            {activeTab === 'operational' && (
              <motion.div layoutId="activeDashboardTab" className="absolute bottom-0 inset-x-0 h-0.5 bg-teal-600" />
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'summary' ? (
            <motion.div
              key="summary-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Quick Stats / Impact */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Horas doadas este mês</div>
                  <div className="text-3xl font-bold text-teal-700">12h</div>
                  <div className="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 inline-flex px-2 py-1 rounded-md border border-emerald-100/50">
                    +4h em relação ao mês anterior
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Atendimentos realizados</div>
                  <div className="text-3xl font-bold text-slate-900">48</div>
                  <div className="text-xs text-slate-500 mt-2">Vidas acolhidas de forma integral</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Pendências</div>
                  <div className="text-3xl font-bold text-amber-600">2</div>
                  <div className="text-xs text-amber-700 mt-2 flex items-center gap-1.5 font-medium bg-amber-50 inline-flex px-2 py-1 rounded-md border border-amber-100/50">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Evoluções aguardando assinatura
                  </div>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Agenda do Dia */}
                <div className="col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900">Próximos Atendimentos</h2>
                    <button 
                      onClick={() => navigate('/calendar')}
                      className="text-xs font-bold text-teal-650 hover:text-teal-700 uppercase tracking-wider flex items-center gap-0.5"
                    >
                      Ver agenda completa
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                    <div className="divide-y divide-slate-100">
                      {upcomingAppointments.map((apt) => (
                        <div key={apt.id} className="p-5 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                          <div className="flex flex-col items-center justify-center shrink-0 w-14 h-14 rounded-xl bg-slate-50 border border-slate-100">
                            <Clock className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-xs font-bold text-slate-700">{apt.time}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-slate-900 truncate">{apt.patient}</h4>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1 bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full font-medium capitalize">
                                {apt.type === 'online' ? <Video className="w-3 h-3 text-teal-650" /> : <CalendarIcon className="w-3 h-3 text-amber-600" />}
                                {apt.type}
                              </span>
                              <span>Agendado</span>
                            </div>
                          </div>
                          
                          <div>
                            {apt.status === 'next' ? (
                              <button 
                                onClick={() => navigate(`/telehealth/${apt.id}`)}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition-all shadow-sm shadow-teal-900/10 flex items-center gap-1"
                              >
                                <Video className="w-4.5 h-4.5" />
                                Iniciar Sessão
                              </button>
                            ) : (
                              <button 
                                onClick={() => navigate(`/patients/${apt.id}`)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors"
                              >
                                Ver Prontuário
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mural Institucional */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-slate-900">Mural Institucional</h2>
                  
                  <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100/50 space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-teal-600 fill-current" />
                    </div>
                    <h3 className="font-bold text-teal-900 text-sm">Campanha de Inverno</h3>
                    <p className="text-xs text-teal-800 leading-relaxed">
                      Estamos arrecadando agasalhos para as famílias cadastradas. O ponto de coleta está na recepção central até dia 15/07.
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm space-y-2">
                    <h3 className="font-bold text-slate-950 text-sm">Novo Protocolo de Acolhimento</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-3">
                      A atualização do manual de acolhimento para casos de vulnerabilidade extrema já está disponível no drive compartilhado.
                    </p>
                    <button className="text-xs font-bold text-teal-650 hover:text-teal-700">Ler manual completo</button>
                  </div>
                </div>

              </div>
            </motion.div>
          ) : (
            <motion.div
              key="operational-tab"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Telemetria Grid - Real-time operational indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultas em Andamento</div>
                    <span className="flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">4</div>
                  <p className="text-xs text-stone-500 mt-1 font-mono">Salas virtuais ativas agora</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultas Concluídas</div>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">18</div>
                  <p className="text-xs text-emerald-600 mt-1 font-medium bg-emerald-50 inline-flex px-1.5 py-0.5 rounded">Hoje</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Média de Espera</div>
                    <Timer className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">8.5 min</div>
                  <p className="text-xs text-stone-500 mt-1 font-mono">Tempo na fila antes do início</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Tempo de Atendimento</div>
                    <Clock className="w-4 h-4 text-teal-650" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mt-2">48.2 min</div>
                  <p className="text-xs text-stone-500 mt-1 font-mono">Média por sessão terapêutica</p>
                </div>

              </div>

              {/* Second Row Operational Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Cancelamentos e faltas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Cancelamentos & Absenteísmo</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-150">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-400">
                        <XCircle className="w-3.5 h-3.5 text-rose-500" /> Cancelamentos
                      </div>
                      <div className="text-2xl font-bold text-rose-700 mt-1">2</div>
                      <span className="text-[9px] text-stone-500 font-mono">Últimas 24 horas</span>
                    </div>

                    <div className="bg-stone-50 p-4 rounded-xl border border-stone-150">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-stone-400">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" /> Faltas (No-show)
                      </div>
                      <div className="text-2xl font-bold text-amber-700 mt-1">1</div>
                      <span className="text-[9px] text-stone-500 font-mono">Hoje</span>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-normal flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      Taxa de absenteísmo atual de **5.2%**. O ideal é manter abaixo de 10% para melhor aproveitamento da fila de espera.
                    </span>
                  </div>
                </div>

                {/* Qualidade e Conexões ativas */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Métricas de Conexão (Rede)</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Qualidade Geral da Rede:</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <Wifi className="w-3.5 h-3.5" /> Excelente (94%)
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Latência Média (Ping):</span>
                      <span className="font-mono font-semibold text-slate-800">38 ms</span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Salas ativas com alerta de oscilação:</span>
                      <span className="font-semibold text-amber-600 font-mono">0 / 4</span>
                    </div>
                  </div>
                </div>

                {/* Profissionais online */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Profissionais em Operação</h3>
                  
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Profissionais Ativos Online:</span>
                      <span className="font-semibold text-teal-700 flex items-center gap-1 font-mono">
                        <UserCheck className="w-3.5 h-3.5 text-teal-650" /> 8 técnicos
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Taxa de Ocupação de Agenda:</span>
                      <span className="font-semibold text-slate-800 font-mono">82%</span>
                    </div>

                    <div className="flex justify-between items-center bg-stone-50 p-2.5 rounded-lg">
                      <span className="text-slate-500">Fila de Triagem Pendente:</span>
                      <span className="font-semibold text-rose-600 font-mono">3 urgentes</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Salas Ativas Real-time Table */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-semibold text-slate-950">Ambientes de Atendimento Ativos (Salas Virtuais)</h3>
                  <span className="text-[10px] bg-slate-100 font-mono text-slate-500 px-2 py-1 rounded-full">Atualizado em tempo real</span>
                </div>

                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5">ID da Sala</th>
                        <th className="py-2.5">Profissional</th>
                        <th className="py-2.5">Beneficiário</th>
                        <th className="py-2.5">Duração</th>
                        <th className="py-2.5 text-center">Qualidade de Sinal</th>
                        <th className="py-2.5 text-right">E2EE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                      <tr>
                        <td className="py-3.5 font-mono text-slate-400">ROOM-289A</td>
                        <td className="py-3.5">Dra. Roberta de Souza</td>
                        <td className="py-3.5">Ana Silva Santos</td>
                        <td className="py-3.5 font-mono">14:02</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold">Excelente</span>
                        </td>
                        <td className="py-3.5 text-right text-teal-650">Ativo</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-mono text-slate-400">ROOM-144F</td>
                        <td className="py-3.5">Dr. Fernando Costa</td>
                        <td className="py-3.5">Marcos Pereira Silva</td>
                        <td className="py-3.5 font-mono">25:12</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold">Excelente</span>
                        </td>
                        <td className="py-3.5 text-right text-teal-650">Ativo</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-mono text-slate-400">ROOM-882C</td>
                        <td className="py-3.5">Dr. Ricardo Mendes</td>
                        <td className="py-3.5">Julia Costa Santos</td>
                        <td className="py-3.5 font-mono">42:05</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-amber-50 text-amber-800 rounded-md font-semibold">Instável (180ms)</span>
                        </td>
                        <td className="py-3.5 text-right text-teal-650">Ativo</td>
                      </tr>
                      <tr>
                        <td className="py-3.5 font-mono text-slate-400">ROOM-904K</td>
                        <td className="py-3.5">Dra. Carla Dias</td>
                        <td className="py-3.5">Paulo Henrique Rodrigues</td>
                        <td className="py-3.5 font-mono">08:44</td>
                        <td className="py-3.5 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-semibold">Excelente</span>
                        </td>
                        <td className="py-3.5 text-right text-teal-650">Ativo</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
