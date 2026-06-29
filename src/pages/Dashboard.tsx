import React from 'react';
import { motion } from 'motion/react';
import { Video, Calendar as CalendarIcon, Clock, AlertCircle, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const upcomingAppointments = [
  { id: '1', patient: 'Ana Silva', time: '14:00', type: 'online', status: 'next' },
  { id: '2', patient: 'Marcos Santos', time: '15:30', type: 'online', status: 'pending' },
  { id: '3', patient: 'Júlia Costa', time: '17:00', type: 'presencial', status: 'pending' },
];

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header>
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-end justify-between"
          >
            <div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Bom dia, Dra. Roberta</h1>
              <p className="text-slate-500 mt-1">Aqui está o resumo do seu dia no Instituto.</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-slate-500">Hoje, 28 de Junho</div>
            </div>
          </motion.div>
        </header>

        {/* Quick Stats / Impact */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-sm font-medium text-slate-500 mb-1">Horas doadas este mês</div>
            <div className="text-3xl font-semibold text-teal-700">12h</div>
            <div className="text-xs text-emerald-600 mt-2 font-medium bg-emerald-50 inline-flex px-2 py-1 rounded-md">
              +4h em relação ao mês anterior
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-sm font-medium text-slate-500 mb-1">Atendimentos realizados</div>
            <div className="text-3xl font-semibold text-slate-900">48</div>
            <div className="text-xs text-slate-500 mt-2">Vidas impactadas diretamente</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-sm font-medium text-slate-500 mb-1">Pendências</div>
            <div className="text-3xl font-semibold text-amber-600">2</div>
            <div className="text-xs text-amber-700 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Evoluções aguardando assinatura
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Agenda do Dia */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="col-span-2 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">Próximos Atendimentos</h2>
              <button 
                onClick={() => navigate('/calendar')}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Ver agenda completa
              </button>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-100">
                {upcomingAppointments.map((apt, index) => (
                  <div key={apt.id} className="p-5 flex items-center gap-6 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl bg-slate-50 border border-slate-100">
                      <Clock className="w-4 h-4 text-slate-400 mb-1" />
                      <span className="text-sm font-semibold text-slate-700">{apt.time}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-medium text-slate-900 truncate">{apt.patient}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          {apt.type === 'online' ? <Video className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />}
                          <span className="capitalize">{apt.type}</span>
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      {apt.status === 'next' ? (
                        <button 
                          onClick={() => navigate(`/telehealth/${apt.id}`)}
                          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
                        >
                          Iniciar Sessão
                        </button>
                      ) : (
                        <button 
                          onClick={() => navigate(`/patients/${apt.id}`)}
                          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          Ver Prontuário
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Avisos Institucionais */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-medium text-slate-900">Mural Institucional</h2>
            
            <div className="bg-teal-50 rounded-2xl p-5 border border-teal-100/50">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                <Heart className="w-5 h-5 text-teal-600" />
              </div>
              <h3 className="font-medium text-teal-900 mb-1">Campanha de Inverno</h3>
              <p className="text-sm text-teal-800 leading-relaxed">
                Estamos arrecadando agasalhos para as famílias cadastradas. O ponto de coleta está na recepção central até dia 15/07.
              </p>
            </div>
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="font-medium text-slate-900 mb-1">Novo Protocolo de Acolhimento</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-3">
                A atualização do manual de acolhimento para casos de vulnerabilidade extrema já está disponível.
              </p>
              <button className="text-sm font-medium text-teal-600 hover:text-teal-700">Ler documento completo</button>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
