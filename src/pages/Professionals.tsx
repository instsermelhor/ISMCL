import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  ChevronRight,
  Shield,
  Clock,
  HeartPulse,
  Brain,
  Scale,
  MoreVertical,
  Activity
} from 'lucide-react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO DE GESTÃO DE PROFISSIONAIS E VOLUNTÁRIOS
// =========================================================================

const MOCK_PROFESSIONALS = [
  {
    id: '1',
    name: 'Dra. Elena Silva',
    profession: 'Psicóloga',
    specialty: 'Psicologia Clínica',
    council: 'CRP 06/12345',
    status: 'ACTIVE',
    hoursDonated: 120,
    activePatients: 5,
    bondType: 'VOLUNTEER',
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    id: '2',
    name: 'Dr. Roberto Almeida',
    profession: 'Psiquiatra',
    specialty: 'Psiquiatria Geral',
    council: 'CRM-SP 98765',
    status: 'ACTIVE',
    hoursDonated: 45,
    activePatients: 8,
    bondType: 'EMPLOYEE',
    avatar: 'https://i.pravatar.cc/150?u=2'
  },
  {
    id: '3',
    name: 'Carla Mendes',
    profession: 'Assistente Social',
    specialty: 'Projetos Sociais',
    council: 'CRESS 54321',
    status: 'PENDING_APPROVAL',
    hoursDonated: 0,
    activePatients: 0,
    bondType: 'VOLUNTEER',
    avatar: 'https://i.pravatar.cc/150?u=3'
  },
  {
    id: '4',
    name: 'Márcio Souza',
    profession: 'Advogado',
    specialty: 'Direito da Família',
    council: 'OAB-SP 112233',
    status: 'INACTIVE',
    hoursDonated: 200,
    activePatients: 0,
    bondType: 'PARTNER',
    avatar: 'https://i.pravatar.cc/150?u=4'
  }
];

export function Professionals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const getProfessionIcon = (profession: string) => {
    switch (profession) {
      case 'Psicóloga':
      case 'Psicólogo': return <Brain className="w-4 h-4" />;
      case 'Psiquiatra':
      case 'Médico': return <HeartPulse className="w-4 h-4" />;
      case 'Advogado':
      case 'Advogada': return <Scale className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ativo</span>;
      case 'PENDING_APPROVAL':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pendente</span>;
      case 'INACTIVE':
      case 'SUSPENDED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inativo</span>;
      default:
        return null;
    }
  };

  const filteredProfessionals = MOCK_PROFESSIONALS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.profession.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Equipe Técnica</h1>
            <p className="text-sm text-slate-500 mt-1">Gestão de profissionais, voluntários e parceiros institucionais.</p>
          </div>
          
          <button 
            onClick={() => navigate('/professionals/new')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-xl hover:bg-teal-500 transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Novo Profissional
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome, profissão ou CRP/CRM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-transparent border-none text-sm focus:ring-0 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          
          <div className="w-px bg-slate-200 hidden sm:block"></div>
          
          <div className="flex items-center gap-2 px-2 sm:px-4">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 py-2.5 pr-8 cursor-pointer"
            >
              <option value="ALL">Todos os Status</option>
              <option value="ACTIVE">Ativos</option>
              <option value="PENDING_APPROVAL">Pendentes</option>
              <option value="INACTIVE">Inativos</option>
            </select>
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProfessionals.map((prof, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={prof.id}
              onClick={() => navigate(`/professionals/${prof.id}`)}
              className="group bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md hover:border-teal-200 transition-all cursor-pointer flex flex-col"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <img src={prof.avatar} alt={prof.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {prof.status === 'ACTIVE' ? <div className="w-3 h-3 bg-emerald-500 rounded-full" /> : 
                     prof.status === 'PENDING_APPROVAL' ? <div className="w-3 h-3 bg-amber-500 rounded-full" /> : 
                     <div className="w-3 h-3 bg-slate-300 rounded-full" />}
                  </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4 flex-1">
                <h3 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors">{prof.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                  {getProfessionIcon(prof.profession)}
                  <span>{prof.profession}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{prof.council}</div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horas Doadas
                  </div>
                  <div className="font-semibold text-slate-700">{prof.hoursDonated}h</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Casos Ativos
                  </div>
                  <div className="font-semibold text-slate-700">{prof.activePatients}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
