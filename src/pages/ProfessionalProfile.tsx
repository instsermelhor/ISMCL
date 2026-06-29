import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  ChevronLeft, 
  User,
  Briefcase,
  FileText,
  CalendarDays,
  Activity,
  Award,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  Phone
} from 'lucide-react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO DE GESTÃO - PERFIL DO PROFISSIONAL (RH / ADMIN)
// =========================================================================

export function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // MOCK DATA
  const prof = {
    name: 'Dra. Elena Silva',
    profession: 'Psicóloga',
    specialty: 'Psicoterapia Cognitivo-Comportamental',
    council: 'CRP 06/12345',
    status: 'ACTIVE',
    bondType: 'VOLUNTEER',
    email: 'elena.silva@exemplo.com',
    phone: '(11) 98765-4321',
    joinedAt: '15/02/2025',
    avatar: 'https://i.pravatar.cc/150?u=1',
    stats: {
      hoursDonated: 120,
      patientsHelped: 14,
      activeCases: 5,
      attendanceRate: 98
    },
    documents: [
      { id: 1, name: 'Identidade (RG/CPF)', status: 'VERIFIED', expiry: null },
      { id: 2, name: 'Diploma de Graduação', status: 'VERIFIED', expiry: null },
      { id: 3, name: 'Carteira do CRP', status: 'VERIFIED', expiry: '31/12/2026' },
      { id: 4, name: 'Comprovante de Endereço', status: 'PENDING', expiry: null },
    ]
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Activity },
    { id: 'personal', label: 'Dados Pessoais', icon: User },
    { id: 'professional', label: 'Atuação Clínica', icon: Briefcase },
    { id: 'documents', label: 'Documentos', icon: FileText },
    { id: 'schedule', label: 'Agenda & Disponibilidade', icon: CalendarDays },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/professionals')}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Perfil do Profissional</h1>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-teal-600 to-emerald-600"></div>
          
          <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6 mt-8">
            <div className="relative">
              <img src={prof.avatar} alt={prof.name} className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-md bg-white" />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg border-2 border-white flex items-center gap-1 shadow-sm">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{prof.name}</h2>
                  <div className="flex items-center gap-3 mt-1.5 text-slate-600 font-medium">
                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {prof.profession}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" /> {prof.council}</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                    Suspender
                  </button>
                  <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm">
                    Editar Perfil
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Mail className="w-4 h-4" /></div>
                  {prof.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><Phone className="w-4 h-4" /></div>
                  {prof.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"><CalendarDays className="w-4 h-4" /></div>
                  Desde {prof.joinedAt}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 p-1 bg-slate-200/50 rounded-2xl">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                  isActive 
                    ? "bg-white text-teal-700 shadow-sm" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                )}
              >
                <TabIcon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm min-h-[400px]">
          
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Extrato de Impacto Institucional</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-teal-50 border border-teal-100">
                    <div className="flex items-center gap-2 text-teal-600 font-medium mb-2"><Clock className="w-4 h-4" /> Horas Doadas</div>
                    <div className="text-3xl font-bold text-teal-900">{prof.stats.hoursDonated}h</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center gap-2 text-emerald-600 font-medium mb-2"><User className="w-4 h-4" /> Vidas Impactadas</div>
                    <div className="text-3xl font-bold text-emerald-900">{prof.stats.patientsHelped}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center gap-2 text-blue-600 font-medium mb-2"><Activity className="w-4 h-4" /> Casos Ativos</div>
                    <div className="text-3xl font-bold text-blue-900">{prof.stats.activeCases}</div>
                  </div>
                  <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-600 font-medium mb-2"><CheckCircle2 className="w-4 h-4" /> Assiduidade</div>
                    <div className="text-3xl font-bold text-indigo-900">{prof.stats.attendanceRate}%</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Pacientes Atualmente Vinculados</h3>
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                  <Lock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600 font-medium">Acesso Restrito</p>
                  <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                    Por motivos de sigilo clínico (LGPD), a lista nominal de pacientes só é visível ao próprio profissional ou ao Coordenador Clínico responsável.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Compliance & Validação</h3>
                  <p className="text-sm text-slate-500">Gestão de documentos obrigatórios e certificados.</p>
                </div>
                <button className="text-sm text-teal-600 font-medium hover:text-teal-700">Adicionar Documento</button>
              </div>

              <div className="space-y-3">
                {prof.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{doc.name}</div>
                        {doc.expiry && <div className="text-xs text-slate-500">Validade: {doc.expiry}</div>}
                      </div>
                    </div>
                    <div>
                      {doc.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">
                          <AlertTriangle className="w-3 h-3" /> Pendente de Revisão
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          
          {(activeTab === 'personal' || activeTab === 'professional' || activeTab === 'schedule') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <CalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Seção em Construção</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">Esta visualização será liberada na próxima fase de desenvolvimento.</p>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}
