import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
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
  Phone,
  MapPin,
  Heart,
  Save,
  Edit3,
  Calendar,
  LockKeyhole,
  Check,
  Plus,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO DE GESTÃO - PERFIL DO PROFISSIONAL (RH / ADMIN)
// =========================================================================

// Interface estendida para o perfil completo do profissional
interface PersonalData {
  cpf: string;
  rg: string;
  birthDate: string;
  gender: string;
  maritalStatus: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

interface ClinicalData {
  councilType: string;
  councilNumber: string;
  councilState: string;
  expiryDate: string;
  specialties: string[];
  targetAudience: string[];
  projects: string[];
  approach: string;
  biography: string;
}

interface ScheduleDay {
  enabled: boolean;
  slots: { time: string; status: 'free' | 'busy' | 'unavailable' }[];
}

interface ScheduleData {
  consultationDuration: number; // minutos
  modality: 'online' | 'presential' | 'hybrid';
  weeklyAvailability: Record<string, ScheduleDay>; // 'segunda', 'terca', etc.
}

interface ProfessionalDetails {
  id: string;
  name: string;
  profession: string;
  specialty: string;
  council: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  bondType: 'VOLUNTEER' | 'EMPLOYEE' | 'PARTNER';
  email: string;
  phone: string;
  joinedAt: string;
  avatar: string;
  stats: {
    hoursDonated: number;
    patientsHelped: number;
    activeCases: number;
    attendanceRate: number;
  };
  documents: {
    id: number;
    name: string;
    status: 'VERIFIED' | 'PENDING' | 'EXPIRED';
    expiry: string | null;
  }[];
  personal: PersonalData;
  clinical: ClinicalData;
  schedule: ScheduleData;
}

const DEFAULT_DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const DEFAULT_SLOTS = [
  { time: '08:00', status: 'free' as const },
  { time: '09:00', status: 'free' as const },
  { time: '10:00', status: 'free' as const },
  { time: '11:00', status: 'free' as const },
  { time: '14:00', status: 'free' as const },
  { time: '15:00', status: 'free' as const },
  { time: '16:05', status: 'free' as const },
  { time: '17:00', status: 'free' as const },
];

export function ProfessionalProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);

  // Carregamento de dados com persistência
  const [prof, setProf] = useState<ProfessionalDetails | null>(null);

  useEffect(() => {
    const key = `professional_details_${id}`;
    const saved = localStorage.getItem(key);

    if (saved) {
      setProf(JSON.parse(saved));
    } else {
      // Cria dados mockados detalhados iniciais para o profissional
      const initialData: ProfessionalDetails = {
        id: id || '1',
        name: id === '2' ? 'Dr. Roberto Almeida' : id === '3' ? 'Carla Mendes' : id === '4' ? 'Márcio Souza' : 'Dra. Elena Silva',
        profession: id === '2' ? 'Psiquiatra' : id === '3' ? 'Assistente Social' : id === '4' ? 'Advogado' : 'Psicóloga',
        specialty: id === '2' ? 'Psiquiatria Geral' : id === '3' ? 'Projetos Sociais' : id === '4' ? 'Direito da Família' : 'Psicoterapia Cognitivo-Comportamental',
        council: id === '2' ? 'CRM-SP 98765' : id === '3' ? 'CRESS 54321' : id === '4' ? 'OAB-SP 112233' : 'CRP 06/12345',
        status: id === '4' ? 'INACTIVE' : 'ACTIVE',
        bondType: id === '2' ? 'EMPLOYEE' : id === '4' ? 'PARTNER' : 'VOLUNTEER',
        email: id === '2' ? 'roberto.almeida@exemplo.com' : id === '3' ? 'carla.mendes@exemplo.com' : id === '4' ? 'marcio.souza@exemplo.com' : 'elena.silva@exemplo.com',
        phone: id === '2' ? '(11) 97777-6666' : id === '3' ? '(11) 98888-5555' : id === '4' ? '(11) 99999-4444' : '(11) 98765-4321',
        joinedAt: id === '2' ? '10/01/2024' : id === '3' ? '01/05/2025' : id === '4' ? '20/09/2023' : '15/02/2025',
        avatar: `https://i.pravatar.cc/150?u=${id || '1'}`,
        stats: {
          hoursDonated: id === '2' ? 45 : id === '3' ? 0 : id === '4' ? 200 : 120,
          patientsHelped: id === '2' ? 8 : id === '3' ? 0 : id === '4' ? 0 : 14,
          activeCases: id === '2' ? 8 : id === '3' ? 0 : id === '4' ? 0 : 5,
          attendanceRate: id === '2' ? 95 : id === '3' ? 0 : id === '4' ? 99 : 98,
        },
        documents: [
          { id: 1, name: 'Identidade (RG/CPF)', status: 'VERIFIED', expiry: null },
          { id: 2, name: 'Diploma de Graduação', status: 'VERIFIED', expiry: null },
          { id: 3, name: 'Registro do Conselho Profissional', status: 'VERIFIED', expiry: '31/12/2026' },
          { id: 4, name: 'Comprovante de Residência', status: 'PENDING', expiry: null },
        ],
        personal: {
          cpf: '123.456.789-00',
          rg: '12.345.678-9',
          birthDate: '1990-05-15',
          gender: 'Feminino',
          maritalStatus: 'Solteiro(a)',
          address: {
            cep: '01001-000',
            street: 'Praça da Sé',
            number: '123',
            complement: 'Apt 42',
            neighborhood: 'Sé',
            city: 'São Paulo',
            state: 'SP'
          },
          emergencyContact: {
            name: 'Carlos Silva',
            relationship: 'Irmão',
            phone: '(11) 98888-8888'
          }
        },
        clinical: {
          councilType: id === '2' ? 'CRM' : id === '3' ? 'CRESS' : id === '4' ? 'OAB' : 'CRP',
          councilNumber: id === '2' ? '98765' : id === '3' ? '54321' : id === '4' ? '112233' : '12345',
          councilState: 'SP',
          expiryDate: '2026-12-31',
          specialties: id === '2' ? ['Psiquiatria Geral', 'Psicofarmacologia'] : id === '3' ? ['Assistência Familiar'] : id === '4' ? ['Direito Civil'] : ['Psicoterapia Cognitivo-Comportamental', 'Terapia de Casal', 'Atendimento de Adolescentes'],
          targetAudience: id === '4' ? ['Adultos'] : ['Adolescentes', 'Adultos'],
          projects: id === '2' ? ['Lar Protegido'] : id === '3' ? ['Cuidar+', 'Envelhecer Bem'] : id === '4' ? ['Lar Protegido'] : ['Escuta Ativa', 'Lar Protegido'],
          approach: id === '2' ? 'Abordagem médica integrativa e psicofarmacologia clínica.' : id === '3' ? 'Visita domiciliar e suporte social interdisciplinar.' : id === '4' ? 'Assessoria jurídica para direitos de família e menor.' : 'Terapia Cognitivo-Comportamental com foco em inteligência emocional e superação de traumas.',
          biography: 'Profissional dedicada à saúde e bem-estar comunitário, atuando de maneira ativa no suporte social e clínico das famílias integradas no Instituto Ser Melhor.'
        },
        schedule: {
          consultationDuration: 50,
          modality: 'hybrid',
          weeklyAvailability: {
            'Segunda': { enabled: true, slots: DEFAULT_SLOTS.map(s => ({ ...s })) },
            'Terça': { enabled: true, slots: DEFAULT_SLOTS.map(s => ({ ...s })) },
            'Quarta': { enabled: false, slots: DEFAULT_SLOTS.map(s => ({ ...s, status: 'unavailable' })) },
            'Quinta': { enabled: true, slots: DEFAULT_SLOTS.map(s => ({ ...s })) },
            'Sexta': { enabled: true, slots: DEFAULT_SLOTS.map(s => ({ ...s })) },
            'Sábado': { enabled: false, slots: DEFAULT_SLOTS.map(s => ({ ...s, status: 'unavailable' })) }
          }
        }
      };
      setProf(initialData);
      localStorage.setItem(key, JSON.stringify(initialData));
    }
  }, [id]);

  function saveChanges(updated: ProfessionalDetails) {
    setProf(updated);
    localStorage.setItem(`professional_details_${id}`, JSON.stringify(updated));
    // Sincroniza também com professionals_list no localStorage para atualizar a lista principal
    try {
      const listRaw = localStorage.getItem('professionals_list');
      if (listRaw) {
        const list = JSON.parse(listRaw);
        const index = list.findIndex((p: any) => p.id === id);
        if (index !== -1) {
          list[index] = {
            ...list[index],
            name: updated.name,
            profession: updated.profession,
            specialty: updated.specialty,
            council: updated.council,
          };
          localStorage.setItem('professionals_list', JSON.stringify(list));
        }
      }
    } catch {
      // ignora
    }
  }

  if (!prof) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 min-h-[400px]">
        <div className="text-center text-slate-400">Carregando perfil...</div>
      </div>
    );
  }

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
              <div className={cn(
                "absolute -bottom-2 -right-2 text-white text-xs font-bold px-2 py-1 rounded-lg border-2 border-white flex items-center gap-1 shadow-sm",
                prof.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
              )}>
                <CheckCircle2 className="w-3 h-3" /> {prof.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
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
                  <button 
                    onClick={() => {
                      const updatedStatus = prof.status === 'ACTIVE' ? 'SUSPENDED' as const : 'ACTIVE' as const;
                      saveChanges({ ...prof, status: updatedStatus });
                    }}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm border",
                      prof.status === 'ACTIVE' 
                        ? "bg-white border-red-200 text-red-600 hover:bg-red-50" 
                        : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500"
                    )}
                  >
                    {prof.status === 'ACTIVE' ? 'Suspender' : 'Reativar'}
                  </button>
                  <button 
                    onClick={() => setIsEditing(e => !e)}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-xl transition-colors shadow-sm flex items-center gap-1.5",
                      isEditing 
                        ? "bg-amber-600 text-white hover:bg-amber-505" 
                        : "bg-teal-600 text-white hover:bg-teal-500"
                    )}
                  >
                    {isEditing ? <><Check className="w-4 h-4" /> Finalizar Edição</> : <><Edit3 className="w-4 h-4" /> Editar Perfil</>}
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
                onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
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
          
          {/* TAB: VISÃO GERAL */}
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
                  <LockKeyhole className="w-8 h-8 text-slate-450 mx-auto mb-3 text-teal-600" />
                  <p className="text-slate-650 font-medium">Acesso Restrito LGPD</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                    Por motivos de sigilo clínico obrigatório, a lista nominal de beneficiários só é visível ao próprio profissional ou ao Coordenador Clínico da unidade.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: DADOS PESSOAIS */}
          {activeTab === 'personal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Dados Pessoais & Contato</h3>
                  <p className="text-sm text-slate-500">Informações confidenciais de cadastro e emergência.</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Acesso Seguro
                </span>
              </div>

              <div className="space-y-6">
                {/* Seção 1: Geral */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <User className="w-4 h-4 text-teal-600" /> Dados Identificadores
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nome Completo</label>
                      {isEditing ? (
                        <input value={prof.name} onChange={e => saveChanges({ ...prof, name: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">CPF</label>
                      {isEditing ? (
                        <input value={prof.personal.cpf} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, cpf: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.cpf}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">RG</label>
                      {isEditing ? (
                        <input value={prof.personal.rg} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, rg: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.rg}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Nascimento</label>
                      {isEditing ? (
                        <input type="date" value={prof.personal.birthDate} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, birthDate: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.birthDate}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Gênero</label>
                      {isEditing ? (
                        <select value={prof.personal.gender} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, gender: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500">
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.gender}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Estado Civil</label>
                      {isEditing ? (
                        <input value={prof.personal.maritalStatus} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, maritalStatus: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.maritalStatus}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 2: Endereço */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal-600" /> Endereço Residencial
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Logradouro</label>
                      {isEditing ? (
                        <input value={prof.personal.address.street} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, street: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.address.street}, {prof.personal.address.number}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Número</label>
                      {isEditing ? (
                        <input value={prof.personal.address.number} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, number: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.address.number}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">CEP</label>
                      {isEditing ? (
                        <input value={prof.personal.address.cep} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, cep: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.address.cep}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Bairro</label>
                      {isEditing ? (
                        <input value={prof.personal.address.neighborhood} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, neighborhood: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.address.neighborhood}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Cidade / Estado</label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <input value={prof.personal.address.city} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, city: e.target.value } } })}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                          <input value={prof.personal.address.state} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, address: { ...prof.personal.address, state: e.target.value } } })}
                            className="w-16 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none text-center" />
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.address.city} - {prof.personal.address.state}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Seção 3: Contatos de Emergência */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-100" /> Contato de Emergência
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Nome do Contato</label>
                      {isEditing ? (
                        <input value={prof.personal.emergencyContact.name} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, emergencyContact: { ...prof.personal.emergencyContact, name: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.emergencyContact.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Parentesco</label>
                      {isEditing ? (
                        <input value={prof.personal.emergencyContact.relationship} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, emergencyContact: { ...prof.personal.emergencyContact, relationship: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.emergencyContact.relationship}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Telefone</label>
                      {isEditing ? (
                        <input value={prof.personal.emergencyContact.phone} onChange={e => saveChanges({ ...prof, personal: { ...prof.personal, emergencyContact: { ...prof.personal.emergencyContact, phone: e.target.value } } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.personal.emergencyContact.phone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: ATUAÇÃO CLÍNICA */}
          {activeTab === 'professional' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Atuação Clínica & Especialidades</h3>
                  <p className="text-sm text-slate-500">Dados do conselho, projetos alocados e foco de atuação.</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Registro Ativo
                </span>
              </div>

              <div className="space-y-6">
                {/* Registro de Conselho */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-teal-600" /> Conselho e Inscrição
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Conselho (Tipo)</label>
                      {isEditing ? (
                        <select value={prof.clinical.councilType} onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, councilType: e.target.value }, council: `${e.target.value} ${prof.clinical.councilNumber}` })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none">
                          <option value="CRP">CRP - Psicologia</option>
                          <option value="CRM">CRM - Psiquiatria/Medicina</option>
                          <option value="CRESS">CRESS - Serviço Social</option>
                          <option value="OAB">OAB - Advocacia</option>
                        </select>
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.clinical.councilType}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Número de Registro</label>
                      {isEditing ? (
                        <input value={prof.clinical.councilNumber} onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, councilNumber: e.target.value }, council: `${prof.clinical.councilType} ${e.target.value}` })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.clinical.councilNumber} - {prof.clinical.councilState}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Data de Validade</label>
                      {isEditing ? (
                        <input type="date" value={prof.clinical.expiryDate} onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, expiryDate: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none" />
                      ) : (
                        <p className="text-sm font-medium text-slate-800">{prof.clinical.expiryDate}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Abordagem Técnica e Especialidades */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-500" /> Especialidades & Escopo
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Especialidades e Focos</label>
                      {isEditing ? (
                        <input 
                          value={prof.clinical.specialties.join(', ')} 
                          onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
                          placeholder="Separados por vírgula..." 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" 
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {prof.clinical.specialties.map(spec => (
                            <span key={spec} className="px-2.5 py-1 bg-violet-100 text-violet-800 text-xs font-semibold rounded-lg">{spec}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2">Público-Alvo</label>
                      {isEditing ? (
                        <input 
                          value={prof.clinical.targetAudience.join(', ')} 
                          onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, targetAudience: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })}
                          placeholder="Separados por vírgula (ex: Adultos, Crianças)..." 
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" 
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {prof.clinical.targetAudience.map(t => (
                            <span key={t} className="px-2.5 py-1 bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Abordagem Técnica</label>
                      {isEditing ? (
                        <textarea value={prof.clinical.approach} onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, approach: e.target.value } })}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500 h-20 resize-none" />
                      ) : (
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{prof.clinical.approach}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projetos Vinculados no Ecossistema */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                    <FolderOpenIcon className="w-4 h-4 text-teal-650" /> Projetos do Ecossistema Vinculados
                  </h4>
                  {isEditing ? (
                    <input 
                      value={prof.clinical.projects.join(', ')} 
                      onChange={e => saveChanges({ ...prof, clinical: { ...prof.clinical, projects: e.target.value.split(',').map(p => p.trim()).filter(Boolean) } })}
                      placeholder="Separados por vírgula..." 
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-teal-500" 
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {prof.clinical.projects.map(pr => (
                        <span key={pr} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" /> {pr}
                        </span>
                      ))}
                      {prof.clinical.projects.length === 0 && <p className="text-xs text-slate-400">Nenhum projeto vinculado.</p>}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB: DOCUMENTOS */}
          {activeTab === 'documents' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Compliance & Validação</h3>
                  <p className="text-sm text-slate-500">Gestão de documentos obrigatórios e certificados.</p>
                </div>
                <button 
                  onClick={() => {
                    const newDocName = prompt('Qual o nome do novo documento?');
                    if (newDocName) {
                      const updatedDocs = [...prof.documents, { id: Date.now(), name: newDocName, status: 'PENDING' as const, expiry: null }];
                      saveChanges({ ...prof, documents: updatedDocs });
                    }
                  }}
                  className="text-sm text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Adicionar Documento
                </button>
              </div>

              <div className="space-y-3">
                {prof.documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-sm">{doc.name}</div>
                        {doc.expiry && <div className="text-xs text-slate-500">Validade: {doc.expiry}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <select 
                          value={doc.status} 
                          onChange={e => {
                            const updatedDocs = prof.documents.map(d => d.id === doc.id ? { ...d, status: e.target.value as any } : d);
                            saveChanges({ ...prof, documents: updatedDocs });
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="VERIFIED">Verificado</option>
                          <option value="PENDING">Pendente</option>
                          <option value="EXPIRED">Expirado</option>
                        </select>
                      ) : (
                        doc.status === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Verificado
                          </span>
                        ) : doc.status === 'EXPIRED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Expirado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-700">
                            <AlertTriangle className="w-3 h-3" /> Pendente de Revisão
                          </span>
                        )
                      )}
                      {isEditing && (
                        <button 
                          onClick={() => {
                            const updatedDocs = prof.documents.filter(d => d.id !== doc.id);
                            saveChanges({ ...prof, documents: updatedDocs });
                          }}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB: AGENDA & DISPONIBILIDADE */}
          {activeTab === 'schedule' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Agenda & Grade de Disponibilidade</h3>
                  <p className="text-sm text-slate-500">Defina os dias da semana e horários livres de atendimento clínico.</p>
                </div>
              </div>

              {/* Parâmetros gerais da agenda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Duração da Consulta (minutos)</label>
                  {isEditing ? (
                    <select 
                      value={prof.schedule.consultationDuration}
                      onChange={e => saveChanges({ ...prof, schedule: { ...prof.schedule, consultationDuration: Number(e.target.value) } })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value={30}>30 minutos</option>
                      <option value={40}>40 minutos</option>
                      <option value={50}>50 minutos</option>
                      <option value={60}>60 minutos</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800">{prof.schedule.consultationDuration} minutos</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Modalidade Preferencial</label>
                  {isEditing ? (
                    <select 
                      value={prof.schedule.modality}
                      onChange={e => saveChanges({ ...prof, schedule: { ...prof.schedule, modality: e.target.value as any } })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value="online">Online / Telemedicina</option>
                      <option value="presential">Presencial (Sede)</option>
                      <option value="hybrid">Híbrido</option>
                    </select>
                  ) : (
                    <p className="text-sm font-semibold text-slate-800 uppercase">{prof.schedule.modality}</p>
                  )}
                </div>
              </div>

              {/* Painel da grade semanal */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" /> Grade Horária Semanal
                </h4>

                <div className="space-y-3">
                  {DEFAULT_DAYS.map(day => {
                    const dayAvailability = prof.schedule.weeklyAvailability[day] ?? { enabled: false, slots: [] };
                    return (
                      <div key={day} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/20">
                        {/* Dia e interruptor */}
                        <div className="flex items-center justify-between md:justify-start gap-4">
                          <span className="font-semibold text-slate-800 text-sm w-20">{day}</span>
                          <button
                            disabled={!isEditing}
                            onClick={() => {
                              const updatedWeekly = {
                                ...prof.schedule.weeklyAvailability,
                                [day]: {
                                  ...dayAvailability,
                                  enabled: !dayAvailability.enabled,
                                  slots: dayAvailability.enabled 
                                    ? dayAvailability.slots.map(s => ({ ...s, status: 'unavailable' as const })) 
                                    : DEFAULT_SLOTS.map(s => ({ ...s }))
                                }
                              };
                              saveChanges({ ...prof, schedule: { ...prof.schedule, weeklyAvailability: updatedWeekly } });
                            }}
                            className={cn(
                              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                              dayAvailability.enabled ? "bg-teal-500" : "bg-slate-200",
                              !isEditing && "opacity-60 cursor-not-allowed"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                              dayAvailability.enabled ? "translate-x-6" : "translate-x-1"
                            )} />
                          </button>
                        </div>

                        {/* Grade de slots de horário */}
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {dayAvailability.enabled ? (
                            dayAvailability.slots.map((slot, sIdx) => (
                              <button
                                key={slot.time}
                                disabled={!isEditing}
                                onClick={() => {
                                  const updatedSlots = dayAvailability.slots.map((s, i) =>
                                    i === sIdx ? { ...s, status: s.status === 'free' ? 'unavailable' as const : 'free' as const } : s
                                  );
                                  const updatedWeekly = {
                                    ...prof.schedule.weeklyAvailability,
                                    [day]: { ...dayAvailability, slots: updatedSlots }
                                  };
                                  saveChanges({ ...prof, schedule: { ...prof.schedule, weeklyAvailability: updatedWeekly } });
                                }}
                                className={cn(
                                  "text-xs px-2.5 py-1.5 font-semibold rounded-lg transition-all border",
                                  slot.status === 'free' 
                                    ? "bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100" 
                                    : "bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed"
                                )}
                              >
                                {slot.time}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-slate-450 italic">Sem atendimentos neste dia da semana</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </div>
  );
}

// Icon helper wrapper
function FolderOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2z" />
      <path d="M2 10h20" />
    </svg>
  );
}
