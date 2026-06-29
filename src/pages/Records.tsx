import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  Plus, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ChevronRight, 
  Calendar,
  Sparkles,
  ArrowRight,
  UserCheck,
  Power,
  TrendingUp,
  X,
  FileText,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '../utils';

// Interfaces
interface CaseItem {
  id: string;
  beneficiaryName: string;
  beneficiaryAge: number;
  project: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH' | 'EMERGENTIAL';
  stage: 'triagem' | 'acolhimento' | 'acompanhamento' | 'revisao' | 'alta';
  openedBy: string;
  openedAt: string;
  classification: string;
  reason: string;
  assignedProfessionals: Array<{ name: string; role: string }>;
  alertsCount: number;
  closedAt?: string;
  closureReason?: string;
  resultsAchieved?: string;
}

export function Records() {
  const navigate = useNavigate();
  
  // --- MOCK DATA PARA CASOS ---
  const [cases, setCases] = useState<CaseItem[]>([
    {
      id: 'CAS-001',
      beneficiaryName: 'Ana Silva Santos',
      beneficiaryAge: 32,
      project: 'Acolher Saúde Mental',
      priority: 'HIGH',
      stage: 'acompanhamento',
      openedBy: 'Roberta de Souza',
      openedAt: '14/06/2026',
      classification: 'Violência Doméstica / Ansiedade',
      reason: 'Paciente acolhida após encaminhamento judicial com queixas de pânico e agressões físicas por ex-parceiro.',
      assignedProfessionals: [
        { name: 'Dra. Roberta de Souza', role: 'Psicóloga' },
        { name: 'Fernando Lima', role: 'Assistente Social' },
        { name: 'Dr. Marcos Mendes', role: 'Psiquiatra' }
      ],
      alertsCount: 2
    },
    {
      id: 'CAS-002',
      beneficiaryName: 'Marcos Santos Oliveira',
      beneficiaryAge: 14,
      project: 'Acolher Infância',
      priority: 'VERY_HIGH',
      stage: 'acolhimento',
      openedBy: 'Carla Dias',
      openedAt: '20/06/2026',
      classification: 'Bullying / Conflitos Familiares',
      reason: 'Jovem encaminhado pela coordenação escolar devido a risco de evasão escolar, agressividade e marcas corporais de negligência.',
      assignedProfessionals: [
        { name: 'Dr. Carlos Alberto', role: 'Pedagogo' }
      ],
      alertsCount: 1
    },
    {
      id: 'CAS-003',
      beneficiaryName: 'Júlia Costa',
      beneficiaryAge: 45,
      project: 'Acolher Saúde Mental',
      priority: 'NORMAL',
      stage: 'revisao',
      openedBy: 'Roberta de Souza',
      openedAt: '05/06/2026',
      classification: 'Sofrimento Psíquico / Luto',
      reason: 'Demanda espontânea decorrente de processo de luto prolongado de cônjuge e isolamento social severo.',
      assignedProfessionals: [
        { name: 'Dra. Roberta de Souza', role: 'Psicóloga' }
      ],
      alertsCount: 0
    },
    {
      id: 'CAS-004',
      beneficiaryName: 'Amanda Rocha',
      beneficiaryAge: 27,
      project: 'Projeto Mulheres',
      priority: 'EMERGENTIAL',
      stage: 'triagem',
      openedBy: 'Carla Dias',
      openedAt: '28/06/2026',
      classification: 'Violência Sexual / Risco Imediato',
      reason: 'Encaminhamento urgente da Defensoria Pública para proteção integral, acolhimento psicossocial e assistência social emergencial.',
      assignedProfessionals: [],
      alertsCount: 3
    },
    {
      id: 'CAS-005',
      beneficiaryName: 'Ricardo Lima',
      beneficiaryAge: 51,
      project: 'Acolher Saúde Mental',
      priority: 'LOW',
      stage: 'alta',
      openedBy: 'Roberta de Souza',
      openedAt: '10/05/2026',
      classification: 'Ansiedade Moderada',
      reason: 'Paciente referia episódios de insônia inicial vinculados a estresse profissional temporário.',
      assignedProfessionals: [
        { name: 'Dra. Roberta de Souza', role: 'Psicóloga' }
      ],
      alertsCount: 0,
      closedAt: '20/06/2026',
      closureReason: 'Conclusão do plano de cuidado (PIC atingido)',
      resultsAchieved: 'Remissão total dos sintomas de insônia e ansiedade, restabelecimento de hábitos de lazer e rotina laboral saudável.'
    }
  ]);

  // --- FILTROS E BUSCA ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProject, setFilterProject] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // --- MODAIS STATE ---
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  // Form fields for Open Case
  const [newBeneficiary, setNewBeneficiary] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newProject, setNewProject] = useState('Acolher Saúde Mental');
  const [newPriority, setNewPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH' | 'EMERGENTIAL'>('NORMAL');
  const [newClassification, setNewClassification] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newOrigin, setNewOrigin] = useState('TRIAGE');

  // Form fields for Assign Professional
  const [assignName, setAssignName] = useState('Fernando Lima');
  const [assignRole, setAssignRole] = useState('Assistente Social');

  // Form fields for Discharge
  const [dischargeReason, setDischargeReason] = useState('PLAN_COMPLETED');
  const [dischargeResults, setDischargeResults] = useState('');
  const [dischargeSummary, setDischargeSummary] = useState('');

  // Form fields for Reopen Case
  const [reopenPriority, setReopenPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'VERY_HIGH' | 'EMERGENTIAL'>('NORMAL');
  const [reopenReason, setReopenReason] = useState('');

  // AI Assistant summaries
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // --- HANDLERS ---
  const handleOpenCaseSubmit = () => {
    if (!newBeneficiary || !newAge || !newClassification || !newReason) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const newCaseItem: CaseItem = {
      id: `CAS-00${cases.length + 1}`,
      beneficiaryName: newBeneficiary,
      beneficiaryAge: Number(newAge),
      project: newProject,
      priority: newPriority,
      stage: newOrigin === 'TRIAGE' ? 'triagem' : 'acolhimento',
      openedBy: 'Roberta de Souza',
      openedAt: new Date().toLocaleDateString('pt-BR'),
      classification: newClassification,
      reason: newReason,
      assignedProfessionals: [],
      alertsCount: 0
    };

    setCases(prev => [newCaseItem, ...prev]);
    setShowOpenModal(false);
    
    // Clear fields
    setNewBeneficiary('');
    setNewAge('');
    setNewClassification('');
    setNewReason('');
  };

  const handleAssignSubmit = () => {
    if (!selectedCase) return;

    setCases(prev => prev.map(c => {
      if (c.id === selectedCase.id) {
        return {
          ...c,
          assignedProfessionals: [...c.assignedProfessionals, { name: assignName, role: assignRole }]
        };
      }
      return c;
    }));

    setShowAssignModal(false);
    alert(`${assignName} foi designado(a) com sucesso como ${assignRole} para o caso.`);
  };

  const handleDischargeSubmit = () => {
    if (!selectedCase || !dischargeResults || !dischargeSummary) {
      alert('Preencha os resultados alcançados e as orientações.');
      return;
    }

    setCases(prev => prev.map(c => {
      if (c.id === selectedCase.id) {
        return {
          ...c,
          stage: 'alta',
          closedAt: new Date().toLocaleDateString('pt-BR'),
          closureReason: dischargeReason === 'PLAN_COMPLETED' ? 'Conclusão do plano de cuidado (PIC atingido)' : 'Solicitação do beneficiário',
          resultsAchieved: dischargeResults
        };
      }
      return c;
    }));

    setShowDischargeModal(false);
    setDischargeResults('');
    setDischargeSummary('');
  };

  const handleReopenSubmit = () => {
    if (!selectedCase || !reopenReason) {
      alert('Justificativa é obrigatória.');
      return;
    }

    setCases(prev => prev.map(c => {
      if (c.id === selectedCase.id) {
        return {
          ...c,
          stage: 'acolhimento',
          priority: reopenPriority,
          reason: reopenReason,
          openedAt: new Date().toLocaleDateString('pt-BR'),
          closedAt: undefined,
          closureReason: undefined,
          resultsAchieved: undefined
        };
      }
      return c;
    }));

    setShowReopenModal(false);
    setReopenReason('');
  };

  const handleTriggerAiSummary = (c: CaseItem) => {
    setSelectedCase(c);
    setShowAiModal(true);
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      setAiSummary(`### ANÁLISE IA AURA — RESUMO DE CASO: ${c.beneficiaryName} (${c.id})

**1. Diagnóstico de Vulnerabilidade:**
- Caso classificado sob o escopo de **${c.classification}**.
- Gravidade avaliada como **${c.priority}** devido ao histórico descrito: *"${c.reason}"*.

**2. Equipe de Cuidado Social:**
- O caso conta com ${c.assignedProfessionals.length} profissional(is) alocado(s) na equipe multidisciplinar.
${c.assignedProfessionals.map(p => `- ${p.name} (${p.role})`).join('\n')}

**3. Recomendação Inteligente Aura:**
- ${c.assignedProfessionals.length === 0 ? '⚠️ CRÍTICO: Este caso emergencial está sem profissionais técnicos de referência designados. Recomenda-se alocação imediata de Assistência Social e Psicologia.' : 'Equipe multidisciplinar alocada adequada.'}
- Recomenda-se a elaboração e assinatura do **Plano Individual de Cuidado (PIC)** em até 48h.
- Monitoramento ativado para detecção de inatividade de teleatendimento.`);
    }, 1500);
  };

  // Filtragem local
  const filteredCases = cases.filter(c => {
    const matchesSearch = c.beneficiaryName.toLowerCase().includes(searchTerm.toLowerCase()) || c.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'ALL' || c.project === filterProject;
    const matchesPriority = filterPriority === 'ALL' || c.priority === filterPriority;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const getCasesInStage = (stage: 'triagem' | 'acolhimento' | 'acompanhamento' | 'revisao' | 'alta') => {
    return filteredCases.filter(c => c.stage === stage);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 bg-slate-50 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-600" />
              Gestão Integrada de Casos
            </h1>
            <p className="text-slate-500 text-sm mt-1">Supervisão de fluxo de atendimento, coordenação multidisciplinar e andamento dos PICs.</p>
          </div>
          
          <button 
            onClick={() => setShowOpenModal(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-all shadow-sm self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nova Abertura de Caso
          </button>
        </header>

        {/* Filters Panel */}
        <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input 
              type="text" 
              placeholder="Buscar por nome do beneficiário ou código do caso..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl text-xs"
            />
          </div>
          
          <div className="flex gap-3">
            <select 
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              className="bg-slate-50 border-0 text-xs rounded-xl focus:ring-teal-550 py-2.5 font-semibold text-slate-700"
            >
              <option value="ALL">Todos os Projetos</option>
              <option value="Acolher Saúde Mental">Acolher Saúde Mental</option>
              <option value="Acolher Infância">Acolher Infância</option>
              <option value="Projeto Mulheres">Projeto Mulheres</option>
            </select>

            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border-0 text-xs rounded-xl focus:ring-teal-550 py-2.5 font-semibold text-slate-700"
            >
              <option value="ALL">Todas as Prioridades</option>
              <option value="LOW">Baixa</option>
              <option value="NORMAL">Média</option>
              <option value="HIGH">Alta</option>
              <option value="VERY_HIGH">Muito Alta</option>
              <option value="EMERGENTIAL">Emergencial</option>
            </select>
          </div>
        </div>

        {/* Kanban Board Container */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 overflow-x-auto pb-4">
          
          {/* 1. TRIAGEM */}
          <div className="flex flex-col min-w-[240px] space-y-4">
            <div className="flex justify-between items-center bg-slate-200/50 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. Triagem (Fila)</span>
              <span className="bg-slate-300 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{getCasesInStage('triagem').length}</span>
            </div>
            <div className="flex-1 space-y-3">
              {getCasesInStage('triagem').map(c => <CaseCard key={c.id} c={c} onAssign={() => { setSelectedCase(c); setShowAssignModal(true); }} onDischarge={() => { setSelectedCase(c); setShowDischargeModal(true); }} onReopen={() => { setSelectedCase(c); setShowReopenModal(true); }} onAiSummary={() => handleTriggerAiSummary(c)} />)}
            </div>
          </div>

          {/* 2. ACOLHIMENTO */}
          <div className="flex flex-col min-w-[240px] space-y-4">
            <div className="flex justify-between items-center bg-indigo-50 border border-indigo-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">2. Acolhimento</span>
              <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{getCasesInStage('acolhimento').length}</span>
            </div>
            <div className="flex-1 space-y-3">
              {getCasesInStage('acolhimento').map(c => <CaseCard key={c.id} c={c} onAssign={() => { setSelectedCase(c); setShowAssignModal(true); }} onDischarge={() => { setSelectedCase(c); setShowDischargeModal(true); }} onReopen={() => { setSelectedCase(c); setShowReopenModal(true); }} onAiSummary={() => handleTriggerAiSummary(c)} />)}
            </div>
          </div>

          {/* 3. ACOMPANHAMENTO */}
          <div className="flex flex-col min-w-[240px] space-y-4">
            <div className="flex justify-between items-center bg-teal-50 border border-teal-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">3. Em Acompanhamento</span>
              <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{getCasesInStage('acompanhamento').length}</span>
            </div>
            <div className="flex-1 space-y-3">
              {getCasesInStage('acompanhamento').map(c => <CaseCard key={c.id} c={c} onAssign={() => { setSelectedCase(c); setShowAssignModal(true); }} onDischarge={() => { setSelectedCase(c); setShowDischargeModal(true); }} onReopen={() => { setSelectedCase(c); setShowReopenModal(true); }} onAiSummary={() => handleTriggerAiSummary(c)} />)}
            </div>
          </div>

          {/* 4. REVISÃO DE PIC */}
          <div className="flex flex-col min-w-[240px] space-y-4">
            <div className="flex justify-between items-center bg-amber-50 border border-amber-100 p-3 rounded-xl">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">4. Revisão PIC</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{getCasesInStage('revisao').length}</span>
            </div>
            <div className="flex-1 space-y-3">
              {getCasesInStage('revisao').map(c => <CaseCard key={c.id} c={c} onAssign={() => { setSelectedCase(c); setShowAssignModal(true); }} onDischarge={() => { setSelectedCase(c); setShowDischargeModal(true); }} onReopen={() => { setSelectedCase(c); setShowReopenModal(true); }} onAiSummary={() => handleTriggerAiSummary(c)} />)}
            </div>
          </div>

          {/* 5. ALTA */}
          <div className="flex flex-col min-w-[240px] space-y-4">
            <div className="flex justify-between items-center bg-slate-100 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">5. Alta Concluída</span>
              <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{getCasesInStage('alta').length}</span>
            </div>
            <div className="flex-1 space-y-3">
              {getCasesInStage('alta').map(c => <CaseCard key={c.id} c={c} onAssign={() => { setSelectedCase(c); setShowAssignModal(true); }} onDischarge={() => { setSelectedCase(c); setShowDischargeModal(true); }} onReopen={() => { setSelectedCase(c); setShowReopenModal(true); }} onAiSummary={() => handleTriggerAiSummary(c)} />)}
            </div>
          </div>

        </div>

      </div>

      {/* --- MODAIS DE SIMULAÇÃO --- */}
      
      {/* 1. MODAL ABERTURA DE CASO */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Abertura de Caso Clínico/Social</h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Nome do Beneficiário *</label>
                <input 
                  type="text" 
                  value={newBeneficiary}
                  onChange={(e) => setNewBeneficiary(e.target.value)}
                  placeholder="Ex: Amanda Rocha"
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Idade *</label>
                <input 
                  type="number" 
                  value={newAge}
                  onChange={(e) => setNewAge(e.target.value)}
                  placeholder="Ex: 27"
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Projeto Social</label>
                <select 
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                >
                  <option value="Acolher Saúde Mental">Acolher Saúde Mental</option>
                  <option value="Acolher Infância">Acolher Infância</option>
                  <option value="Projeto Mulheres">Projeto Mulheres</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Prioridade Inicial</label>
                <select 
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                >
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="VERY_HIGH">Muito Alta</option>
                  <option value="EMERGENTIAL">Emergencial</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Origem de Abertura</label>
                <select 
                  value={newOrigin}
                  onChange={(e) => setNewOrigin(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                >
                  <option value="TRIAGE">Triagem Inicial (Fila)</option>
                  <option value="COURT">Determinação Judicial</option>
                  <option value="DEMAND">Demanda Espontânea</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Classificação Inicial *</label>
                <input 
                  type="text" 
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value)}
                  placeholder="Ex: Violência doméstica / Risco familiar"
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="font-bold text-slate-500">Motivo Detalhado / Queixa *</label>
                <textarea 
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="Descrição da queixa que originou a abertura deste caso..."
                  className="w-full h-20 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowOpenModal(false)}
                className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleOpenCaseSubmit}
                className="px-4.5 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Confirmar Abertura
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 2. MODAL DESIGNAR PROFISSIONAL */}
      {showAssignModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Designar Equipe Multidisciplinar</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <p className="text-xs text-slate-500">Adicione profissionais capacitados para o acompanhamento do caso de <strong>{selectedCase.beneficiaryName}</strong>.</p>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Profissional Disponível</label>
                <select 
                  value={assignName}
                  onChange={(e) => {
                    setAssignName(e.target.value);
                    if (e.target.value === 'Fernando Lima') setAssignRole('Assistente Social');
                    if (e.target.value === 'Dr. Marcos Mendes') setAssignRole('Médico Psiquiatra');
                    if (e.target.value === 'Dra. Camila Nogueira') setAssignRole('Advogada');
                  }}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2.5 px-3"
                >
                  <option value="Fernando Lima">Fernando Lima (Assistência Social)</option>
                  <option value="Dr. Marcos Mendes">Dr. Marcos Mendes (Psiquiatria)</option>
                  <option value="Dra. Camila Nogueira">Dra. Camila Nogueira (Assessoria Jurídica)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Função/Papel no Caso</label>
                <input 
                  type="text" 
                  value={assignRole}
                  disabled
                  className="w-full bg-slate-100 border-slate-200 rounded-xl text-slate-500 py-2.5 px-3"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAssignSubmit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Alocar Profissional
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. MODAL ALTA DO CASO */}
      {showDischargeModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Registrar Alta / Encerramento do Caso</h3>
              <button onClick={() => setShowDischargeModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-slate-500">Confirme a alta institucional do beneficiário <strong>{selectedCase.beneficiaryName}</strong>. Esta ação desativará todos os alertas pendentes deste caso.</p>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Motivo Principal de Encerramento</label>
                <select 
                  value={dischargeReason}
                  onChange={(e) => setDischargeReason(e.target.value)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                >
                  <option value="PLAN_COMPLETED">Conclusão do plano de cuidado (PIC atingido)</option>
                  <option value="PATIENT_REQUEST">Solicitação voluntária do beneficiário</option>
                  <option value="DEF_REFERRAL">Encaminhamento definitivo para CAPS/CREAS municipal</option>
                  <option value="LOST_CONTACT">Perda de vínculo / Sem contato &gt; 60 dias</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Resultados Alcançados *</label>
                <input 
                  type="text" 
                  value={dischargeResults}
                  onChange={(e) => setDischargeResults(e.target.value)}
                  placeholder="Ex: Obtenção de medida protetiva e redução de ansiedade."
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Parecer Final & Orientações de Alta *</label>
                <textarea 
                  value={dischargeSummary}
                  onChange={(e) => setDischargeSummary(e.target.value)}
                  placeholder="Resumo final e orientações recomendadas pós-alta..."
                  className="w-full h-20 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowDischargeModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDischargeSubmit}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-550 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Confirmar Alta
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. MODAL REABRIR CASO */}
      {showReopenModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-150 pb-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase">Reabertura de Caso Clínico/Social</h3>
              <button onClick={() => setShowReopenModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <p className="text-xs text-slate-500">Reative o acompanhamento de <strong>{selectedCase.beneficiaryName}</strong> após alta anterior. Um novo fluxo de acolhimento será iniciado.</p>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Nova Prioridade</label>
                <select 
                  value={reopenPriority}
                  onChange={(e) => setReopenPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                >
                  <option value="LOW">Baixa</option>
                  <option value="NORMAL">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="VERY_HIGH">Muito Alta</option>
                  <option value="EMERGENTIAL">Emergencial</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-500">Justificativa técnica da reabertura *</label>
                <textarea 
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="Relate os novos fatos sociais ou clínicos que justificam a reativação do caso..."
                  className="w-full h-20 bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button 
                onClick={() => setShowReopenModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleReopenSubmit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-colors shadow-md"
              >
                Reabrir Caso
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 5. MODAL IA AURA RESUMO */}
      {showAiModal && selectedCase && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-indigo-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative space-y-4"
          >
            <div className="flex justify-between items-center border-b border-indigo-50 pb-2">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
                Copiloto IA Aura — Análise de Caso
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            {aiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-indigo-650 animate-spin" />
                <span className="text-xs font-semibold text-slate-500 font-mono">Sintetizando e correlacionando logs assistenciais...</span>
              </div>
            ) : (
              <div className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-80 overflow-y-auto bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {aiSummary}
              </div>
            )}

            <div className="flex justify-end pt-1">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
              >
                Fechar Painel IA
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

// Inner Component for Case Card in Kanban
function CaseCard({ 
  c, 
  onAssign, 
  onDischarge, 
  onReopen,
  onAiSummary 
}: { 
  c: CaseItem; 
  onAssign: () => void; 
  onDischarge: () => void; 
  onReopen: () => void;
  onAiSummary: () => void;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between h-48">
      
      <div className="space-y-1.5 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] text-slate-450 font-bold font-mono">{c.id}</span>
          
          <span className={cn(
            "text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded",
            c.priority === 'EMERGENTIAL' ? "bg-rose-100 text-rose-800 animate-pulse border border-rose-200" :
            c.priority === 'VERY_HIGH' ? "bg-orange-100 text-orange-850" :
            c.priority === 'HIGH' ? "bg-amber-100 text-amber-850" :
            c.priority === 'NORMAL' ? "bg-blue-100 text-blue-800" :
            "bg-slate-100 text-slate-700"
          )}>
            {c.priority === 'EMERGENTIAL' ? 'Emergencial' :
             c.priority === 'VERY_HIGH' ? 'Muito Alta' :
             c.priority === 'HIGH' ? 'Alta' :
             c.priority === 'NORMAL' ? 'Média' : 'Baixa'}
          </span>
        </div>
        
        <h4 
          onClick={() => c.stage !== 'triagem' && navigate(`/patients/1`)}
          className={cn(
            "text-xs font-bold text-slate-900 truncate",
            c.stage !== 'triagem' ? "cursor-pointer hover:text-teal-650 hover:underline" : ""
          )}
          title={c.beneficiaryName}
        >
          {c.beneficiaryName}
        </h4>
        <p className="text-[10px] text-slate-500 font-medium">Idade: {c.beneficiaryAge} anos • {c.project}</p>
        
        <div className="text-[9.5px] text-slate-650 font-medium truncate pt-1 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{c.classification}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
        {/* Avatars */}
        <div className="flex -space-x-1.5 overflow-hidden">
          {c.assignedProfessionals.length === 0 ? (
            <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-100 font-bold px-1.5 py-0.5 rounded">Sem equipe</span>
          ) : (
            c.assignedProfessionals.map((p, idx) => (
              <div key={idx} className="w-6 h-6 rounded-full bg-teal-50 border border-white flex items-center justify-center text-[9px] font-bold text-teal-700 shadow-sm" title={`${p.name} (${p.role})`}>
                {p.name.split(' ').pop()?.substring(0, 1).toUpperCase()}
              </div>
            ))
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button 
            onClick={onAiSummary}
            className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100/80 text-indigo-750 flex items-center justify-center transition-colors border border-indigo-100/50" 
            title="Copiloto IA Aura"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
          
          {c.stage === 'alta' ? (
            <button 
              onClick={onReopen}
              className="px-2 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 text-[9.5px] font-extrabold rounded-lg transition-colors flex items-center gap-0.5"
              title="Reabrir Caso"
            >
              <Power className="w-3 h-3 text-emerald-650" /> Reabrir
            </button>
          ) : (
            <div className="flex gap-1">
              <button 
                onClick={onAssign}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors border border-slate-200" 
                title="Designar Profissionais"
              >
                <Users className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={onDischarge}
                className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors border border-rose-150" 
                title="Dar Alta institucional"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Alert Badge Indicator */}
      {c.alertsCount > 0 && c.stage !== 'alta' && (
        <span className="absolute top-4 right-4 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
      )}

    </div>
  );
}
