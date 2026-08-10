import React, { useState, useEffect } from 'react';
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
  Activity,
  XCircle
} from 'lucide-react';
import { cn } from '../utils';
import { professionalsService } from '../services/professionalsService';

// =========================================================================
// MÓDULO DE GESTÃO DE PROFISSIONAIS E VOLUNTÁRIOS
// =========================================================================

interface CreateProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (prof: any) => void;
}

function CreateProfessionalModal({ isOpen, onClose, onCreate }: CreateProfessionalModalProps) {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('Psicólogo');
  const [specialty, setSpecialty] = useState('');
  const [council, setCouncil] = useState('');
  const [email, setEmail] = useState('');
  const [bondType, setBondType] = useState<'VOLUNTEER' | 'EMPLOYEE' | 'PARTNER'>('VOLUNTEER');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const created = professionalsService.create({
      name,
      profession,
      specialty: specialty || 'Geral',
      councilNumber: council || 'N/A',
      councilState: 'SP',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@institutosermelhor.org`,
      status: 'ativo',
      bondType,
      availabilityHours: 10,
    });

    onCreate(created);
    onClose();
    setName('');
    setSpecialty('');
    setCouncil('');
    setEmail('');
    setBondType('VOLUNTEER');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Novo Profissional</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Dra. Juliana Costa"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Profissão
              </label>
              <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="Psicólogo">Psicólogo(a)</option>
                <option value="Psiquiatra">Psiquiatra</option>
                <option value="Assistente Social">Assistente Social</option>
                <option value="Advogado">Advogado(a)</option>
                <option value="Educador">Educador(a)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Especialidade
              </label>
              <input
                type="text"
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                placeholder="Ex: TCC, Trauma"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Conselho Profissional (CRP/CRM/CRESS/OAB)
            </label>
            <input
              type="text"
              value={council}
              onChange={(e) => setCouncil(e.target.value)}
              placeholder="Ex: CRP 06/123456"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              E-mail Institucional
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: juliana@institutosermelhor.org"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Vínculo Institucional
            </label>
            <select
              value={bondType}
              onChange={(e) => setBondType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="VOLUNTEER">Voluntário</option>
              <option value="EMPLOYEE">Contratado / CLT</option>
              <option value="PARTNER">Parceiro Institucional</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl transition-colors shadow-sm"
            >
              Cadastrar Profissional
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Professionals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [professionalsList, setProfessionalsList] = useState(() => professionalsService.getAll());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const unsub = professionalsService.subscribe(() => {
      setProfessionalsList(professionalsService.getAll());
    });
    return unsub;
  }, []);

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
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'ATIVO':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Ativo</span>;
      case 'PENDING_APPROVAL':
      case 'PENDENTE':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Pendente</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inativo</span>;
    }
  };

  const filteredProfessionals = professionalsList.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.profession.toLowerCase().includes(searchTerm.toLowerCase());
    const s = (p.status || '').toUpperCase();
    const matchesStatus = statusFilter === 'ALL' || s === statusFilter || (statusFilter === 'ACTIVE' && s === 'ATIVO');
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
            onClick={() => setIsCreateModalOpen(true)}
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
                  {prof.photoUrl ? (
                    <img src={prof.photoUrl} alt={prof.name} className="w-12 h-12 rounded-full object-cover border border-slate-100" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
                      {prof.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                    {prof.status === 'ativo' ? <div className="w-3 h-3 bg-emerald-500 rounded-full" /> : 
                     prof.status === 'pendente' ? <div className="w-3 h-3 bg-amber-500 rounded-full" /> : 
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
                                <div className="text-xs text-slate-400 mt-1">
                  {prof.councilNumber ?? prof.profession}
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Horas Doadas
                  </div>
                  <div className="font-semibold text-slate-700">{prof.availabilityHours ?? 0}h</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Projetos
                  </div>
                  <div className="font-semibold text-slate-700">{prof.projects?.length ?? 0}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
      <CreateProfessionalModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(newProf) => {
          const updated = [...professionalsList, newProf];
          setProfessionalsList(updated);
          localStorage.setItem('professionals_list', JSON.stringify(updated));
        }}
      />
    </div>
  );
}
