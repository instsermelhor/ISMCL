import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  User, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  FileText, 
  Lock, 
  Plus, 
  Clock, 
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  History,
  FileSpreadsheet,
  TrendingUp,
  Paperclip,
  Eye,
  Download,
  AlertCircle,
  Key,
  RefreshCw,
  EyeOff,
  FileCheck2,
  Printer,
  Share2,
  Search,
  Users,
  Briefcase,
  Compass,
  Bell,
  ClipboardList,
  CheckSquare,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../utils';
import { generateSOAP, summarizeHistory, semanticSearch } from '../services/gemini';

// =========================================================================
// MÓDULO 05: PRONTUÁRIO ELETRÔNICO INTELIGENTE (PEI) E GESTÃO CLÍNICA
// =========================================================================

interface AuditEntry {
  timestamp: string;
  action: string;
  professional: string;
  role: string;
  details: string;
  type: 'info' | 'warning' | 'security' | 'success';
}

interface Evolution {
  id: number;
  date: Date;
  professional: string;
  role: string;
  content: string;
  cid?: string;
  signed: boolean;
  signatureHash?: string;
  addendums: {
    id: number;
    date: Date;
    professional: string;
    content: string;
  }[];
}

interface Anamnese {
  version: number;
  updatedAt: string;
  updatedBy: string;
  queixaPrincipal: string;
  historicoPessoal: string;
  historicoFamiliar: string;
  historicoSocial: string;
  historicoEscolar: string;
  historicoOcupacional: string;
  medicamentosAlergias: string;
}

interface ScaleResult {
  id: string;
  name: string;
  score: number;
  date: string;
  interpretation: string;
}

export function PatientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();

  // --- CONTROLE DE SIGILO E PRIVACIDADE (PEI-RN01, PEI-RN02) ---
  const [userRole, setUserRole] = useState<'ref' | 'external' | 'admin' | 'coord'>('ref');
  const [isPrivacyLocked, setIsPrivacyLocked] = useState(false);
  const [hasOverrideAccess, setHasOverrideAccess] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // --- AUTO-SIGILO LOGIC ---
  useEffect(() => {
    if (userRole === 'external' || userRole === 'admin') {
      setIsPrivacyLocked(true);
      setHasOverrideAccess(false);
    } else {
      setIsPrivacyLocked(false);
      setHasOverrideAccess(false);
    }
  }, [userRole]);

  // --- NAVEGAÇÃO DE ABAS ---
  const [activeTab, setActiveTab] = useState<'timeline' | 'anamnese' | 'evolutions' | 'documents' | 'scales' | 'attachments' | 'audit' | 'pic' | 'team' | 'meetings' | 'referrals' | 'alerts'>('timeline');

  // --- MÓDULO 06: GESTÃO DE CASOS & PIC STATE ---
  const [picPlan, setPicPlan] = useState({
    generalObjectives: 'Garantir integridade física e emocional da beneficiária por meio de atuação em rede social, jurídica e psicológica.',
    specificObjectives: '1. Reduzir crises de pânico e sintomas agudos de estresse pós-traumático.\n2. Estabelecer canal direto com rede de apoio municipal (CREAS).\n3. Readequação de rotina laboral para mitigar burnout.',
    familyCommitments: 'A beneficiária compromete-se a comparecer aos atendimentos psicológicos semanais e participar ativamente das orientações jurídicas sobre a medida protetiva.',
    version: 2,
    updatedAt: '28/06/2026 18:30',
    updatedBy: 'Dra. Roberta (Psicóloga)'
  });

  const [picVersionSelected, setPicVersionSelected] = useState<number>(2);

  const picV1 = {
    generalObjectives: 'Garantir a segurança e acolhimento inicial da beneficiária.',
    specificObjectives: '1. Estabelecer vínculo terapêutico estável.\n2. Mapear riscos imediatos de violência doméstica.',
    familyCommitments: 'Comparecer à primeira consulta médica de urgência.',
    version: 1,
    updatedAt: '14/06/2026 14:30',
    updatedBy: 'Dra. Roberta (Psicóloga)'
  };

  const [picGoals, setPicGoals] = useState([
    { id: 'g1', description: 'Garantir abrigo seguro e medidas protetivas contra o agressor', intervention: 'Encaminhamento urgente para CREAS e assessoria jurídica do ISM', indicator: 'Medidas protetivas deferidas por juiz', targetDate: '15/07/2026', status: 'IN_PROGRESS', responsible: 'Assistente Social Fernando' },
    { id: 'g2', description: 'Reduzir escore de ansiedade na escala GAD-7 para < 10', intervention: 'Sessões semanais de psicoterapia focada em trauma (TCC)', indicator: 'Aplicação de escala GAD-7 a cada 14 dias', targetDate: '30/08/2026', status: 'IN_PROGRESS', responsible: 'Dra. Roberta de Souza' },
    { id: 'g3', description: 'Avaliação psicofarmacológica dos episódios de insônia inicial', intervention: 'Encaminhamento para Psiquiatria ISM e acompanhamento de adesão medicamentosa', indicator: 'Diminuição da latência de sono de 90min para < 30min', targetDate: '31/07/2026', status: 'PENDING', responsible: 'Dr. Marcos Mendes' }
  ]);

  const [caseMeetings, setCaseMeetings] = useState([
    { id: 'm1', meetingDate: '25/06/2026 09:00', agenda: 'Discussão de rede de proteção e medidas judiciais de urgência', minutes: 'Reunião conjunta entre Psicologia, Serviço Social e Assessoria Jurídica. Avaliado o risco de integridade física. Definido o envio de relatório atualizado ao CREAS e peticionamento de urgência das medidas protetivas.', decisions: 'Acelerar encaminhamento ao CREAS; agendar consulta com psiquiatria para ajuste de humor/sono.', pendingTasks: 'Fernando: Contatar CREAS por telefone (Prazo: 29/06). Roberta: Aplicar GAD-7 em 28/06.', participants: ['Dra. Roberta (Psicologia)', 'Fernando (Serviço Social)', 'Dra. Camila (Assessoria Jurídica)'] }
  ]);

  const [referrals, setReferrals] = useState([
    { id: 'r1', type: 'EXTERNAL', destination: 'CREAS - Centro de Referência Especializado de Assistência Social', reason: 'Acompanhamento de vulnerabilidade e violência doméstica recente.', status: 'SENT', result: 'Aguardando devolutiva da equipe local.', date: '15/06/2026', professional: 'Assistente Social Fernando' },
    { id: 'r2', type: 'INTERNAL', destination: 'Psiquiatria ISM', reason: 'Avaliação farmacológica devido a sintomas de insônia e ansiedade refratários.', status: 'COMPLETED', result: 'Agendado para 02/07/2026 com Dr. Marcos.', date: '22/06/2026', professional: 'Dra. Roberta de Souza' }
  ]);

  const [caseAlerts, setCaseAlerts] = useState([
    { id: 'a1', type: 'PIC_REVISION_OVERDUE', message: 'Plano Individual de Cuidado (PIC) sem revisão há mais de 14 dias.', severity: 'MEDIUM', date: '28/06/2026' },
    { id: 'a2', type: 'REFERRAL_NO_RETURN', message: 'Encaminhamento externo para o CREAS sem confirmação de recebimento há 10 dias.', severity: 'HIGH', date: '25/06/2026' }
  ]);

  const [teamMembers, setTeamMembers] = useState([
    { name: 'Dra. Roberta de Souza', role: 'Psicóloga Clínica (Profissional de Referência)', council: 'CRP 06/123456', joinedAt: '14/06/2026' },
    { name: 'Assistente Social Fernando', role: 'Assistência Social', council: 'CRESS 12345', joinedAt: '14/06/2026' },
    { name: 'Dr. Marcos Mendes', role: 'Médico Psiquiatra', council: 'CRM 98765-SP', joinedAt: '22/06/2026' },
    { name: 'Dra. Camila Nogueira', role: 'Advogada (Assessoria Jurídica)', council: 'OAB/SP 456789', joinedAt: '25/06/2026' }
  ]);

  // Form states for adding elements
  const [newMeetingAgenda, setNewMeetingAgenda] = useState('');
  const [newMeetingMinutes, setNewMeetingMinutes] = useState('');
  const [newMeetingDecisions, setNewMeetingDecisions] = useState('');
  const [newMeetingTasks, setNewMeetingTasks] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [selectedMeetingParticipants, setSelectedMeetingParticipants] = useState<string[]>([]);

  const [newReferralType, setNewReferralType] = useState<'INTERNAL' | 'EXTERNAL'>('EXTERNAL');
  const [newReferralDestination, setNewReferralDestination] = useState('');
  const [newReferralReason, setNewReferralReason] = useState('');

  const [showAddGoalModal, setShowAddGoalModal] = useState(false);
  const [newGoalDesc, setNewGoalDesc] = useState('');
  const [newGoalIntervention, setNewGoalIntervention] = useState('');
  const [newGoalIndicator, setNewGoalIndicator] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('');
  const [newGoalResp, setNewGoalResp] = useState('Dra. Roberta de Souza');

  // --- BUSCA INTELIGENTE ---
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- MOCK PATIENT DATA ---
  const patient = {
    name: 'Ana Silva Santos',
    age: 32,
    gender: 'Feminino',
    status: 'Em acompanhamento',
    riskLevel: 'vermelho', // verde | amarelo | vermelho (Trauma/Vulnerabilidade)
    phone: '(11) 98765-4321',
    address: 'Zona Leste, São Paulo - SP',
    emergencyContact: 'Maria (Mãe) - (11) 91234-5678',
    socialProject: 'Acolher Saúde Mental',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' // premium mock photo
  };

  // --- MOCK ANAMNESE VERSIONAMENTO (PEI-RN04) ---
  const [anamneseVersion, setAnamneseVersion] = useState<number>(2);
  const [anamneseDraft, setAnamneseDraft] = useState<Anamnese>({
    version: 2,
    updatedAt: '28/06/2026 18:30',
    updatedBy: 'Dra. Roberta (Psicóloga)',
    queixaPrincipal: 'Crises de pânico recorrentes e desânimo persistente relacionados a estresse extremo no ambiente de trabalho.',
    historicoPessoal: 'Nega antecedentes cirúrgicos. Relata infância tranquila, porém com traços ansiosos desde a adolescência.',
    historicoFamiliar: 'Mãe com histórico de depressão. Pai falecido por doença cardiovascular.',
    historicoSocial: 'Reside com a mãe na Zona Leste. Relatou histórico recente de violência doméstica física/psicológica por ex-companheiro (Alerta de Vulnerabilidade Ativo).',
    historicoEscolar: 'Formada em Administração de Empresas por universidade pública local. Bom rendimento acadêmico.',
    historicoOcupacional: 'Gerente administrativa em empresa privada. Sobrecarga e pressão constante por metas corporativas.',
    medicamentosAlergias: 'Nega alergias alimentares ou medicamentosas. Faz uso eventual de fitoterápicos para insônia.'
  });

  const anamneseV1: Anamnese = {
    version: 1,
    updatedAt: '14/06/2026 14:30',
    updatedBy: 'Dra. Roberta (Psicóloga)',
    queixaPrincipal: 'Ansiedade crônica e crises de taquicardia ao pensar no trabalho.',
    historicoPessoal: 'Nega antecedentes clínicos importantes.',
    historicoFamiliar: 'Mãe ansiosa.',
    historicoSocial: 'Separada recentemente, residência temporária.',
    historicoEscolar: 'Superior completo.',
    historicoOcupacional: 'Gerente administrativa.',
    medicamentosAlergias: 'Nenhuma conhecida.'
  };

  // Handle version change
  const handleVersionChange = (version: number) => {
    setAnamneseVersion(version);
    if (version === 1) {
      setAnamneseDraft(anamneseV1);
      addAuditEntry('VISUALIZAÇÃO_VERSÃO', `Visualizou a Versão v1 da Anamnese.`, 'info');
    } else {
      setAnamneseDraft({
        version: 2,
        updatedAt: '28/06/2026 18:30',
        updatedBy: 'Dra. Roberta (Psicóloga)',
        queixaPrincipal: 'Crises de pânico recorrentes e desânimo persistente relacionados a estresse extremo no ambiente de trabalho.',
        historicoPessoal: 'Nega antecedentes cirúrgicos. Relata infância tranquila, porém com traços ansiosos desde a adolescência.',
        historicoFamiliar: 'Mãe com histórico de depressão. Pai falecido por doença cardiovascular.',
        historicoSocial: 'Reside com a mãe na Zona Leste. Relatou histórico recente de violência doméstica física/psicológica por ex-companheiro (Alerta de Vulnerabilidade Ativo).',
        historicoEscolar: 'Formada em Administração de Empresas por universidade pública local. Bom rendimento acadêmico.',
        historicoOcupacional: 'Gerente administrativa em empresa privada. Sobrecarga e pressão constante por metas corporativas.',
        medicamentosAlergias: 'Nega alergias alimentares ou medicamentosas. Faz uso eventual de fitoterápicos para insônia.'
      });
      addAuditEntry('VISUALIZAÇÃO_VERSÃO', `Retornou para a Versão v2 da Anamnese.`, 'info');
    }
  };

  const handleSaveAnamnese = () => {
    addAuditEntry('ATUALIZAÇÃO_ANAMNESE', `Criou nova versão (v${anamneseVersion + 1}) da Anamnese Clínica.`, 'success');
    alert('Nova versão da anamnese salva com sucesso!');
  };

  // --- MOCK EVOLUÇÕES CLÍNICAS (PEI-RN03) ---
  const [evolutions, setEvolutions] = useState<Evolution[]>([
    {
      id: 2,
      date: new Date(2026, 5, 21, 14, 30),
      professional: 'Dra. Roberta de Souza',
      role: 'Psicóloga Clínica',
      content: 'Paciente compareceu à sessão online pontualmente. Relata redução nas crises de pânico na última semana após aplicação de técnicas de grounding. Discutimos formas de posicionamento e estabelecimento de limites com chefia no ambiente corporativo. Mantém sintomas de insônia leve.',
      cid: 'CID-10: F41.1',
      signed: true,
      signatureHash: 'CRP-SIGN-98765-A2B3',
      addendums: []
    },
    {
      id: 1,
      date: new Date(2026, 5, 14, 14, 0),
      professional: 'Dra. Roberta de Souza',
      role: 'Psicóloga Clínica',
      content: 'Primeira sessão terapêutica. Acolhimento inicial focado no estabelecimento de vínculo e segurança. Paciente muito angustiada, chorou ao relatar histórico de violência doméstica de ex-parceiro e pressão no trabalho. Acordado encaminhamento para triagem de assistência social e avaliação psiquiátrica.',
      cid: 'CID-10: F43.0',
      signed: true,
      signatureHash: 'CRP-SIGN-98765-H8J9',
      addendums: [
        {
          id: 1,
          date: new Date(2026, 5, 15, 10, 0),
          professional: 'Dra. Roberta de Souza',
          content: 'Adendo: Encaminhamento oficial emitido para o CREAS na data de hoje e anexado à documentação.'
        }
      ]
    }
  ]);

  // --- NOVA EVOLUÇÃO STATE ---
  const [isWriting, setIsWriting] = useState(false);
  const [newEvoContent, setNewEvoContent] = useState('');
  const [newEvoCid, setNewEvoCid] = useState('');
  const [newEvoModality, setNewEvoModality] = useState<'online' | 'presencial'>('online');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save simulation (PEI-RN05)
  useEffect(() => {
    if (!newEvoContent || !isWriting) return;
    setIsSaving(true);
    const timer = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 2000);
    return () => clearTimeout(timer);
  }, [newEvoContent, isWriting]);

  const handleSignEvolution = () => {
    if (!newEvoContent.trim()) return;
    const now = new Date();
    const signatureHash = 'CRP-SIGN-98765-' + Math.random().toString(36).substring(2, 6).toUpperCase() + Date.now().toString().substring(10);
    const newEvo: Evolution = {
      id: Date.now(),
      date: now,
      professional: 'Dra. Roberta de Souza',
      role: 'Psicóloga Clínica',
      content: newEvoContent,
      cid: newEvoCid ? `CID-10: ${newEvoCid}` : undefined,
      signed: true,
      signatureHash,
      addendums: []
    };
    setEvolutions(prev => [newEvo, ...prev]);
    setNewEvoContent('');
    setNewEvoCid('');
    setIsWriting(false);
    addAuditEntry('ASSINATURA_EVOLUÇÃO', `Assinou digitalmente evolução clínica. Hash: ${signatureHash}`, 'success');
  };

  // Adendo (RN03)
  const [selectedEvoForAddendum, setSelectedEvoForAddendum] = useState<number | null>(null);
  const [addendumContent, setAddendumContent] = useState('');
  
  const handleAddAddendum = (evoId: number) => {
    if (!addendumContent.trim()) return;
    setEvolutions(prev => prev.map(evo => {
      if (evo.id === evoId) {
        return {
          ...evo,
          addendums: [...evo.addendums, {
            id: Date.now(),
            date: new Date(),
            professional: 'Dra. Roberta de Souza',
            content: addendumContent
          }]
        };
      }
      return evo;
    }));
    setAddendumContent('');
    setSelectedEvoForAddendum(null);
    addAuditEntry('ADENDO_EVOLUÇÃO', `Adicionou adendo à evolução clínica ID ${evoId}.`, 'info');
  };

  // --- MOCK ESCALAS E QUESTIONÁRIOS ---
  const [scaleResults, setScaleResults] = useState<ScaleResult[]>([
    { id: '1', name: 'GAD-7 (Ansiedade)', score: 18, date: '14/06/2026', interpretation: 'Ansiedade Grave' },
    { id: '2', name: 'GAD-7 (Ansiedade)', score: 14, date: '21/06/2026', interpretation: 'Ansiedade Moderada-Grave' },
    { id: '3', name: 'PHQ-9 (Depressão)', score: 16, date: '14/06/2026', interpretation: 'Depressão Moderadamente Grave' }
  ]);
  const [showScaleModal, setShowScaleModal] = useState(false);
  const [gadAnswers, setGadAnswers] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  
  const handleCompleteScale = () => {
    const totalScore = gadAnswers.reduce((a, b) => a + b, 0);
    let interp = 'Mínima';
    if (totalScore >= 15) interp = 'Ansiedade Grave';
    else if (totalScore >= 10) interp = 'Ansiedade Moderada';
    else if (totalScore >= 5) interp = 'Ansiedade Leve';

    const newResult: ScaleResult = {
      id: Date.now().toString(),
      name: 'GAD-7 (Ansiedade)',
      score: totalScore,
      date: new Date().toLocaleDateString('pt-BR'),
      interpretation: interp
    };
    setScaleResults(prev => [...prev, newResult]);
    setShowScaleModal(false);
    setGadAnswers([0, 0, 0, 0, 0, 0, 0]);
    addAuditEntry('APLICAÇÃO_ESCALA', `Aplicou e computou escore da escala GAD-7. Score: ${totalScore} (${interp}).`, 'success');
  };

  // --- MOCK ANEXOS ---
  const [attachments, setAttachments] = useState([
    { name: 'Laudo Neuropsicológico CREAS.pdf', size: '1.4 MB', date: '14/06/2026', uploader: 'Assistente Social Fernando', type: 'pdf' },
    { name: 'Guia de Encaminhamento CAPS.pdf', size: '480 KB', date: '21/06/2026', uploader: 'Dra. Roberta de Souza', type: 'pdf' },
    { name: 'Comprovante de Residência.jpg', size: '920 KB', date: '12/06/2026', uploader: 'Recepção Central', type: 'image' }
  ]);
  
  const handleDownloadAttachment = (name: string) => {
    addAuditEntry('DOWNLOAD_ANEXO', `Fez download do anexo: "${name}".`, 'info');
    alert(`Iniciando download seguro de: ${name}`);
  };

  // --- COPILOTO IA WORKSPACE (Gemini API Integration) ---
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  
  const handleSummarizeClinicalHistory = async () => {
    setIsAiLoading(true);
    addAuditEntry('IA_SÍNTESE', 'Solicitou resumo inteligente do histórico longitudinal à IA.', 'info');
    try {
      const combinedEvolutions = evolutions.map(e => `Data: ${e.date.toLocaleDateString()} - Profissional: ${e.professional} (${e.role}): ${e.content}`).join('\n\n');
      const summary = await summarizeHistory(combinedEvolutions);
      setAiResult(summary);
    } catch (e) {
      console.error(e);
      setAiResult('Falha ao processar síntese de dados clínicos.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSemanticSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiLoading(true);
    addAuditEntry('IA_BUSCA_SEMANTICA', `Executou busca semântica inteligente: "${aiSearchQuery}"`, 'info');
    try {
      const dbText = `
        Identificação: Ana Silva Santos, 32 anos. Risco Vermelho por violência doméstica.
        Anamnese Social: Relatou violência de ex-companheiro.
        Evolução 14/06: Primeira sessão. Choro ao relatar violência doméstica. Angústia e pânico.
        Evolução 21/06: Sessão online. Redução nas crises de pânico. Insônia leve.
      `;
      const result = await semanticSearch(aiSearchQuery, dbText);
      setAiResult(result);
    } catch (e) {
      console.error(e);
      setAiResult('Falha na consulta inteligente.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // --- TRILHA DE AUDITORIA IMUTÁVEL (LGPD - PEI-RN07) ---
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([
    { timestamp: '14/00:02', action: 'ACESSO_PRONTUÁRIO', professional: 'Dra. Roberta de Souza', role: 'Psicóloga Clínica', details: 'Acessou o Prontuário Clínico (Identificação e Histórico) de Ana Silva Santos.', type: 'info' },
    { timestamp: '14:00:15', action: 'VALIDAÇÃO_VÍNCULO', professional: 'Sistema de Segurança', role: 'A Aura Security', details: 'Vínculo ativo de profissional de referência confirmado para Dra. Roberta.', type: 'success' },
    { timestamp: '14:15:30', action: 'ACESSO_ANAMNESE', professional: 'Dra. Roberta de Souza', role: 'Psicóloga Clínica', details: 'Visualizou a Anamnese Geral do paciente (Versão v2).', type: 'info' }
  ]);

  const addAuditEntry = (action: string, details: string, type: 'info' | 'warning' | 'security' | 'success' = 'info') => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setAuditEntries(prev => [
      {
        timestamp: timeStr,
        action,
        professional: userRole === 'ref' ? 'Dra. Roberta de Souza' : userRole === 'coord' ? 'Dra. Carla Dias (Coordenadora)' : userRole === 'admin' ? 'Administrador Geral' : 'Dr. Marcos Mendes (Técnico Externo)',
        role: userRole === 'ref' ? 'Psicóloga Clínica' : userRole === 'coord' ? 'Coordenadora Técnica' : userRole === 'admin' ? 'TI Adm' : 'Médico Psiquiatra',
        details,
        type
      },
      ...prev
    ]);
  };

  // --- EXPORTAR RELATÓRIO DO PRONTUÁRIO (PRINT/PDF AUDITED) ---
  const handleExportPEI = () => {
    addAuditEntry('EXPORTAÇÃO_PRONTUÁRIO', 'Exportou relatório completo de prontuário eletrônico em PDF.', 'security');
    alert('Relatório médico-legal compilado e assinado eletronicamente com sucesso para download.');
  };

  // --- PRIVACY OVERRIDE LOGIC (PEI-RN02) ---
  const handleRequestOverride = () => {
    if (!overrideReason.trim()) {
      alert('Justificativa é obrigatória para override pericial.');
      return;
    }
    setHasOverrideAccess(true);
    setIsPrivacyLocked(false);
    setShowOverrideModal(false);
    addAuditEntry('OVERRIDE_PRIVACIDADE', `Acesso extraordinário liberado. Justificativa pericial: "${overrideReason}"`, 'security');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* ========================================================================= */}
      {/* HEADER PRINCIPAL DO PRONTUÁRIO COM DADOS DE IDENTIFICAÇÃO E RISCO */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            title="Voltar ao Painel"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 shadow-inner bg-slate-100 shrink-0 flex items-center justify-center">
              <img src={patient.photoUrl} alt={patient.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">{patient.name}</h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100/50">
                  {patient.status}
                </span>
                {patient.riskLevel === 'vermelho' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alto Risco / Trauma
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-teal-650" />
                <span>Prontuário Multidisciplinar</span>
                <span>•</span>
                <span>ID: {id?.padStart(6, '0') || '000124'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLES DE SIMULAÇÃO DE PERFIL E SIGILO (MOCK DA SEGURANÇA E ACESSOS) */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-right">
            <label className="text-[10px] uppercase font-bold text-slate-400">Simulador de Perfil Técnico</label>
            <select 
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value as any);
                addAuditEntry('ALTERAÇÃO_PERFIL', `Simulador: Alterou perfil ativo para ${e.target.value.toUpperCase()}.`, 'info');
              }}
              className="mt-1 text-xs bg-slate-50 border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-teal-500 focus:border-teal-500 py-1.5"
            >
              <option value="ref">Dra. Roberta (Prof. de Referência)</option>
              <option value="external">Dr. Marcos (Técnico sem Vínculo)</option>
              <option value="coord">Dra. Carla (Coordenadora / Perita)</option>
              <option value="admin">Administrador Geral (TI/TI Adm)</option>
            </select>
          </div>

          <button 
            onClick={handleExportPEI}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-750 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm self-end"
          >
            <Printer className="w-4 h-4" />
            Imprimir PEI
          </button>
        </div>
      </header>

      {/* Alerta de Acesso sob Override */}
      {hasOverrideAccess && (
        <div className="bg-rose-650 text-white px-6 py-2.5 text-xs font-bold flex justify-between items-center z-10 shadow">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>ATENÇÃO: VOCÊ ACESSOU ESTE PRONTUÁRIO SIGILOSO VIA JUSTIFICATIVA EXCEPCIONAL DE OVERRIDE (JUSTIFICATIVA: "{overrideReason}"). TODAS AS AÇÕES ESTÃO SENDO MONITORADAS E NOTIFICADAS EM TEMPO REAL.</span>
          </div>
          <button 
            onClick={() => {
              setHasOverrideAccess(false);
              setIsPrivacyLocked(true);
              addAuditEntry('RESTABELECIMENTO_SIGILO', 'Restabeleceu restrições de sigilo clínicas.', 'security');
            }}
            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg transition-colors border border-white/20"
          >
            Bloquear Acesso
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LAYOUT PRINCIPAL DO PRONTUÁRIO */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* BLOQUEIO DE PRIVACIDADE CASO NEGADO (PEI-RN01, PEI-RN02) */}
        {isPrivacyLocked && !hasOverrideAccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900/5 text-center">
            <motion.div 
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-w-md w-full bg-white border border-slate-200 shadow-2xl rounded-3xl p-8 space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1.5 bg-rose-500" />
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500 border border-rose-100 shadow-sm">
                <Lock className="w-8 h-8" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">Acesso Restrito - Prontuário Sigiloso</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Para garantir o acolhimento seguro, a integridade do beneficiário e as normas profissionais (LGPD), este prontuário é sigiloso e restrito a profissionais designados.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 leading-normal">
                Você está autenticado como **{userRole === 'admin' ? 'Administrador Geral' : 'Dr. Marcos Mendes (Psiquiatra sem vínculo)'}**. Administradores e profissionais sem vínculo direto com o tratamento não possuem permissão de leitura clínica.
              </div>

              <div className="flex flex-col gap-2 pt-2">
                {userRole === 'coord' || userRole === 'external' ? (
                  <button 
                    onClick={() => {
                      setOverrideReason('');
                      setShowOverrideModal(true);
                    }}
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-900/10 flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-4 h-4" />
                    Forçar Acesso de Emergência (Override)
                  </button>
                ) : (
                  <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-lg">
                    Seu perfil administrativo não permite override clínico. Apenas Coordenadores Técnicos ou Médicos Peritos podem justificar e forçar acesso.
                  </div>
                )}
                
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Voltar ao Painel
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            {/* LADO ESQUERDO: MENU DE ABAS E IDENTIFICAÇÃO BÁSICA */}
            <aside className="w-[300px] border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
              {/* Contatos / Info da Identificação */}
              <div className="p-5 border-b border-slate-100 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Informações da Ficha</h4>
                
                <ul className="space-y-3.5 text-xs text-slate-600 font-medium">
                  <li className="flex gap-2.5 items-start">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-900">{patient.phone}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Telefone Pessoal</span>
                    </div>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-900">{patient.emergencyContact}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Contato de Emergência</span>
                    </div>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-900">{patient.address}</span>
                    </div>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block text-slate-900">{patient.socialProject}</span>
                      <span className="text-[10px] text-slate-400 font-medium">Projeto Social ISM</span>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Tabs Navigation List */}
              <nav className="flex-1 p-3 space-y-1">
                <button 
                  onClick={() => { setActiveTab('timeline'); addAuditEntry('ABRIR_ABA', 'Aba Linha do Tempo visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'timeline' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <History className="w-4 h-4" />
                  Linha do Tempo Clínica
                </button>
                <button 
                  onClick={() => { setActiveTab('anamnese'); addAuditEntry('ABRIR_ABA', 'Aba Anamnese visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'anamnese' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <FileText className="w-4 h-4" />
                  Anamnese e Antecedentes
                </button>
                <button 
                  onClick={() => { setActiveTab('evolutions'); addAuditEntry('ABRIR_ABA', 'Aba Evoluções Clínicas visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'evolutions' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <FileCheck2 className="w-4 h-4" />
                  Evoluções & Consultas
                </button>
                <button 
                  onClick={() => { setActiveTab('documents'); addAuditEntry('ABRIR_ABA', 'Aba Documentos visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'documents' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <ShieldCheck className="w-4 h-4" />
                  Documentos Emitidos
                </button>
                <button 
                  onClick={() => { setActiveTab('scales'); addAuditEntry('ABRIR_ABA', 'Aba Escalas visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'scales' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  Escalas e Questionários
                </button>
                <button 
                  onClick={() => { setActiveTab('attachments'); addAuditEntry('ABRIR_ABA', 'Aba Anexos visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'attachments' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <Paperclip className="w-4 h-4" />
                  Anexos e Exames
                </button>
                <button 
                  onClick={() => { setActiveTab('audit'); addAuditEntry('ABRIR_ABA', 'Aba Trilha de Auditoria visualizada.', 'info'); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                    activeTab === 'audit' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                  )}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Trilha de Auditoria (LGPD)
                </button>

                <div className="pt-2 border-t border-slate-100 my-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">Gestão do Caso & PIC</div>
                  
                  <button 
                    onClick={() => { setActiveTab('pic'); addAuditEntry('ABRIR_ABA', 'Aba Plano de Cuidado (PIC) visualizada.', 'info'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      activeTab === 'pic' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Plano de Cuidado (PIC)
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('team'); addAuditEntry('ABRIR_ABA', 'Aba Equipe Técnica visualizada.', 'info'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      activeTab === 'team' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <Users className="w-4 h-4" />
                    Equipe Multidisciplinar
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('meetings'); addAuditEntry('ABRIR_ABA', 'Aba Reuniões de Caso visualizada.', 'info'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      activeTab === 'meetings' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <Briefcase className="w-4 h-4" />
                    Reuniões de Caso
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('referrals'); addAuditEntry('ABRIR_ABA', 'Aba Encaminhamentos visualizada.', 'info'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      activeTab === 'referrals' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <Compass className="w-4 h-4" />
                    Encaminhamentos
                  </button>
                  
                  <button 
                    onClick={() => { setActiveTab('alerts'); addAuditEntry('ABRIR_ABA', 'Aba Alertas do Caso visualizada.', 'info'); }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all",
                      activeTab === 'alerts' ? "bg-teal-50 text-teal-700" : "text-slate-650 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <div className="relative">
                      <Bell className="w-4 h-4" />
                      {caseAlerts.length > 0 && <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-rose-500" />}
                    </div>
                    Alertas do Caso
                  </button>
                </div>
              </nav>
            </aside>

            {/* LADO DIREITO: ÁREA DE EXIBIÇÃO CLÍNICA DE CADA ABA */}
            <main className="flex-1 bg-slate-50 overflow-y-auto p-8 relative flex flex-col gap-6">
              
              <AnimatePresence mode="wait">
                
                {/* 1. TAB LINHA DO TEMPO CLÍNICA LONGITUDINAL */}
                {activeTab === 'timeline' && (
                  <motion.div 
                    key="timeline"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Linha do Tempo Longitudinal</h2>
                      
                      {/* Timeline Search */}
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Buscar no histórico..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-white border-slate-200 text-xs rounded-xl focus:ring-teal-500 w-48 py-1.5"
                        />
                      </div>
                    </div>

                    <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 py-2">
                      {/* Item Timeline: New evolution */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-teal-600 border-2 border-white shadow" />
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                          <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                            <span>Sessão #2 • Teleatendimento</span>
                            <span>21/06/2026 14:30</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">Dra. Roberta de Souza (Psicóloga Clínica)</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-mono">
                            Redução nas crises de pânico. Foco em limites com chefia corporativa. Higiene do sono recomendada.
                          </p>
                        </div>
                      </div>

                      {/* Item Timeline: Scale application */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-indigo-500 border-2 border-white shadow" />
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                          <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                            <span>Aplicação de Escala Técnica</span>
                            <span>21/06/2026 14:20</span>
                          </div>
                          <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> GAD-7 (Ansiedade) Calculado
                          </h4>
                          <p className="text-xs text-slate-600 leading-normal">
                            Escore de **14 pontos** (Ansiedade Moderada-Grave). Redução de 4 pontos em relação à triagem do dia 14/06.
                          </p>
                        </div>
                      </div>

                      {/* Item Timeline: First session */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-teal-600 border-2 border-white shadow" />
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                          <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                            <span>Sessão #1 • Acolhimento e Vínculo</span>
                            <span>14/06/2026 14:00</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">Dra. Roberta de Souza (Psicóloga Clínica)</h4>
                          <p className="text-xs text-slate-600 leading-relaxed font-mono">
                            Acolhimento de paciente em crise. Relato de violência doméstica recente por ex-companheiro. Alto estresse e angústia.
                          </p>
                        </div>
                      </div>

                      {/* Item Timeline: social worker attachment */}
                      <div className="relative">
                        <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 rounded-full bg-slate-600 border-2 border-white shadow" />
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl space-y-2 shadow-sm">
                          <div className="flex justify-between text-[11px] text-slate-500 font-bold uppercase">
                            <span>Documento Anexado</span>
                            <span>14/06/2026 11:15</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">Assistente Social Fernando</h4>
                          <p className="text-xs text-slate-600 leading-normal">
                            Carregou o **Laudo Neuropsicológico CREAS.pdf** no prontuário do beneficiário.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. TAB ANAMNESE CLINICA COM VERSIONAMENTO (PEI-RN04) */}
                {activeTab === 'anamnese' && (
                  <motion.div 
                    key="anamnese"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-250 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-teal-650" />
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Anamnese Geral Multidisciplinar</h2>
                      </div>
                      
                      {/* Version selector (PEI-RN04) */}
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        <span>Versão do Documento:</span>
                        <select 
                          value={anamneseVersion}
                          onChange={(e) => handleVersionChange(Number(e.target.value))}
                          className="bg-white border-slate-200 text-xs rounded-xl font-bold py-1.5"
                        >
                          <option value={2}>Versão 2 (Atual - 28/06/2026)</option>
                          <option value={1}>Versão 1 (Original - 14/06/2026)</option>
                        </select>
                      </div>
                    </div>

                    {/* Editor Form */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Queixa Principal</label>
                          <textarea 
                            value={anamneseDraft.queixaPrincipal}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, queixaPrincipal: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full h-24 bg-slate-50/50 border-slate-200 rounded-xl leading-relaxed text-slate-800 disabled:bg-slate-100 disabled:text-slate-500"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Histórico Social</label>
                          <textarea 
                            value={anamneseDraft.historicoSocial}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, historicoSocial: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full h-24 bg-slate-50/50 border-slate-200 rounded-xl leading-relaxed text-slate-800 disabled:bg-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Histórico Pessoal & Antecedentes</label>
                          <textarea 
                            value={anamneseDraft.historicoPessoal}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, historicoPessoal: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full h-20 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-100"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Histórico Familiar</label>
                          <textarea 
                            value={anamneseDraft.historicoFamiliar}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, historicoFamiliar: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full h-20 bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Histórico Escolar</label>
                          <input 
                            type="text"
                            value={anamneseDraft.historicoEscolar}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, historicoEscolar: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-100 py-2"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Histórico Ocupacional</label>
                          <input 
                            type="text"
                            value={anamneseDraft.historicoOcupacional}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, historicoOcupacional: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-100 py-2"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-[10px] uppercase font-bold text-slate-400">Medicamentos e Alergias</label>
                          <input 
                            type="text"
                            value={anamneseDraft.medicamentosAlergias}
                            onChange={(e) => setAnamneseDraft(prev => ({...prev, medicamentosAlergias: e.target.value}))}
                            disabled={anamneseVersion === 1}
                            className="w-full bg-slate-50/50 border-slate-200 rounded-xl text-slate-800 disabled:bg-slate-100 py-2"
                          />
                        </div>
                      </div>

                      {anamneseVersion === 2 && (
                        <div className="flex justify-between items-center border-t border-slate-100 pt-4 text-xs">
                          <span className="text-slate-400 font-mono text-[10px]">
                            Última alteração por: {anamneseDraft.updatedBy} em {anamneseDraft.updatedAt}
                          </span>
                          
                          <button 
                            onClick={handleSaveAnamnese}
                            className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-sm transition-all"
                          >
                            Salvar Alterações (Criar v3)
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* 3. TAB EVOLUÇÕES E AVALIAÇÕES COM ADENDO (PEI-RN03) */}
                {activeTab === 'evolutions' && (
                  <motion.div 
                    key="evolutions"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Evoluções Clínicas Registradas</h2>
                      <button 
                        onClick={() => setIsWriting(true)}
                        disabled={isWriting}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Nova Evolução
                      </button>
                    </div>

                    {/* Evolução clínica em escrita */}
                    {isWriting && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-2 border-teal-600/30 rounded-3xl overflow-hidden shadow-lg"
                      >
                        <div className="bg-teal-50 px-6 py-3 border-b border-teal-100 flex justify-between items-center text-xs text-teal-850 font-bold">
                          <span>Nova Evolução Clínica (Rascunho Ativo)</span>
                          <span className="font-mono text-[10px]">
                            {isSaving ? 'Salvando...' : lastSaved ? `Salvo às ${lastSaved.toLocaleTimeString()}` : 'Alterado'}
                          </span>
                        </div>
                        <div className="p-6 space-y-4">
                          <textarea 
                            value={newEvoContent}
                            onChange={(e) => setNewEvoContent(e.target.value)}
                            placeholder="Descreva o atendimento terapêutico..."
                            className="w-full h-32 text-xs border-slate-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 leading-relaxed text-slate-800"
                          />
                          
                          <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                            <div className="flex items-center gap-2">
                              <label className="text-slate-500">Código CID:</label>
                              <input 
                                type="text" 
                                value={newEvoCid}
                                onChange={(e) => setNewEvoCid(e.target.value)}
                                placeholder="F41.1 (opcional)"
                                className="border-slate-200 rounded-xl w-32 py-1 text-xs"
                              />
                            </div>
                            <div className="flex items-center justify-end gap-2 text-xs">
                              <button 
                                onClick={() => setIsWriting(false)}
                                className="px-3 py-1.5 hover:bg-slate-100 rounded-lg text-slate-650"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={handleSignEvolution}
                                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-sm"
                              >
                                Assinar e Finalizar
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Evolutions list */}
                    <div className="space-y-4">
                      {evolutions.map((evo) => (
                        <div key={evo.id} className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm relative">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-slate-900">{evo.professional}</h4>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{evo.role} • {format(evo.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {evo.signed && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-100/50" title={evo.signatureHash}>
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Assinado (CRP)
                                </span>
                              )}
                              <button 
                                onClick={() => setSelectedEvoForAddendum(evo.id)}
                                className="px-2.5 py-1 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-650 rounded-lg transition-all"
                              >
                                Adicionar Adendo (PEI-RN03)
                              </button>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed font-mono bg-slate-50/50 p-4 rounded-2xl border border-slate-150">
                            {evo.content}
                          </p>

                          {evo.cid && (
                            <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded text-[9px] font-semibold">
                              {evo.cid}
                            </span>
                          )}

                          {/* Render Addendums list (RN03) */}
                          {evo.addendums.length > 0 && (
                            <div className="mt-3 pl-6 border-l-2 border-amber-400 space-y-3">
                              {evo.addendums.map(add => (
                                <div key={add.id} className="bg-amber-50/30 border border-amber-100/50 rounded-xl p-3.5 space-y-1.5 text-xs">
                                  <div className="flex justify-between items-center text-[10px] font-bold text-amber-800 uppercase">
                                    <span>Adendo Clinico</span>
                                    <span>{add.date.toLocaleDateString()}</span>
                                  </div>
                                  <p className="text-slate-600 font-medium leading-relaxed">{add.content}</p>
                                  <span className="text-[9px] text-slate-400 block font-mono">Assinado por: {add.professional}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Write Addendum form */}
                          {selectedEvoForAddendum === evo.id && (
                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3.5">
                              <h5 className="text-[10px] font-bold text-amber-800 uppercase">Novo Adendo à Evolução (RN03)</h5>
                              <textarea 
                                value={addendumContent}
                                onChange={(e) => setAddendumContent(e.target.value)}
                                placeholder="Insira o adendo com as correções/inclusões necessárias..."
                                className="w-full h-20 text-xs border-slate-200 bg-white rounded-xl focus:ring-amber-500 focus:border-amber-500 text-slate-800"
                              />
                              <div className="flex justify-end gap-2 text-[10px]">
                                <button 
                                  onClick={() => setSelectedEvoForAddendum(null)}
                                  className="px-2.5 py-1 text-slate-500 font-bold hover:text-slate-700"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => handleAddAddendum(evo.id)}
                                  className="px-3.5 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg"
                                >
                                  Confirmar e Assinar Adendo
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 4. TAB DOCUMENTOS EMITIDOS */}
                {activeTab === 'documents' && (
                  <motion.div 
                    key="documents"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Documentos Clínicos do Paciente</h2>
                      <span className="text-xs text-slate-400 font-mono">Assinaturas Registradas ICP-Brasil</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5">
                      {[
                        { title: 'Atestado de Comparecimento', date: '21/06/2026', author: 'Dra. Roberta de Souza', size: '210 KB', hash: 'CRP-SIGN-98765-H3K9' },
                        { title: 'Guia de Encaminhamento Clínico', date: '14/06/2026', author: 'Dra. Roberta de Souza', size: '180 KB', hash: 'CRP-SIGN-98765-X9Y2' },
                        { title: 'Declaração de Acompanhamento Social', date: '07/06/2026', author: 'Assistente Social Fernando', size: '340 KB', hash: 'CRESS-SIGN-1234-A7B8' }
                      ].map((doc, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:border-slate-350 transition-all">
                          <div className="flex items-center gap-3.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <FileText className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-slate-900">{doc.title}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">{doc.date} • {doc.size} • Por: {doc.author}</p>
                              <span className="text-[8px] font-mono text-emerald-650 font-bold block mt-0.5">Validador: {doc.hash}</span>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => {
                              addAuditEntry('DOCUMENTO_DOWNLOAD', `Download do documento emitido: ${doc.title}.pdf`, 'info');
                              alert(`Iniciando download do PDF assinado.`);
                            }}
                            className="px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all"
                          >
                            Baixar Documento
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. TAB ESCALAS CLÍNICAS E GRÁFICOS DE PROGNÓSTICO (PEI-RN06) */}
                {activeTab === 'scales' && (
                  <motion.div 
                    key="scales"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Biblioteca de Escalas e Gráfico de Progresso</h2>
                      <button 
                        onClick={() => setShowScaleModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Aplicar Escala (GAD-7)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Escore comparativo / Gráfico do Prognóstico (PEI-RN06) */}
                      <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold text-slate-900 uppercase">Gráfico de Evolução Comparativa (Ansiedade GAD-7)</h3>
                          <span className="text-[10px] text-teal-650 font-bold">Prognóstico Clínico</span>
                        </div>

                        {/* Custom styled CSS line chart to wow the user (premium look without heavy libraries) */}
                        <div className="h-44 flex items-end justify-between px-6 pt-6 border-b border-slate-200 pb-2 relative">
                          {/* Grid horizontal guidelines */}
                          <div className="absolute inset-x-0 top-[20%] border-t border-dashed border-slate-100 text-[8px] text-slate-400 font-mono text-right pr-2">Crítico (20 pts)</div>
                          <div className="absolute inset-x-0 top-[50%] border-t border-dashed border-slate-100 text-[8px] text-slate-400 font-mono text-right pr-2">Moderado (10 pts)</div>
                          <div className="absolute inset-x-0 top-[80%] border-t border-dashed border-slate-100 text-[8px] text-slate-400 font-mono text-right pr-2">Mínimo (5 pts)</div>

                          {/* Data points */}
                          <div className="flex flex-col items-center z-10 w-1/3">
                            <span className="text-[10px] font-bold text-rose-600 mb-1">18 pts</span>
                            <div className="w-4.5 bg-rose-500 rounded-t-lg transition-all" style={{ height: '110px' }} />
                            <span className="text-[9px] font-mono text-slate-500 mt-2">14/06 (v1)</span>
                          </div>
                          
                          <div className="flex flex-col items-center z-10 w-1/3">
                            <span className="text-[10px] font-bold text-amber-600 mb-1">14 pts</span>
                            <div className="w-4.5 bg-amber-500 rounded-t-lg transition-all" style={{ height: '84px' }} />
                            <span className="text-[9px] font-mono text-slate-500 mt-2">21/06 (v2)</span>
                          </div>

                          <div className="flex flex-col items-center z-10 w-1/3">
                            <span className="text-[10px] font-bold text-teal-600 mb-1">12 pts</span>
                            <div className="w-4.5 bg-teal-500 rounded-t-lg transition-all animate-pulse" style={{ height: '72px' }} />
                            <span className="text-[9px] font-mono text-slate-500 mt-2">Hoje (v3)</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-500 leading-normal">
                          **Evolução Terapêutica:** Redução de **33%** nos sintomas de ansiedade reportados desde a triagem inicial, indicando resposta favorável às intervenções clínicas de regulação e suporte social.
                        </p>
                      </div>

                      {/* Histórico das Escalas na direita */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-900 uppercase">Escores Anteriores</h3>
                        
                        <div className="space-y-3 text-xs font-medium">
                          {scaleResults.map((result) => (
                            <div key={result.id} className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-1">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-slate-800">{result.name}</span>
                                <span className="text-[9px] text-slate-400">{result.date}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span>Pontuação: <strong className="text-indigo-700">{result.score} pts</strong></span>
                                <span className={cn(
                                  "font-semibold",
                                  result.score >= 15 ? "text-rose-600" : result.score >= 10 ? "text-amber-600" : "text-emerald-600"
                                )}>
                                  {result.interpretation}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* 6. TAB ANEXOS E EXAMES */}
                {activeTab === 'attachments' && (
                  <motion.div 
                    key="attachments"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Documentos Anexos e Exames Digitalizados</h2>
                      <span className="text-xs text-slate-400 font-mono">Retenção de Arquivos: 5 anos (LGPD)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {attachments.map((attach, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-400">
                              <Paperclip className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold text-slate-900 truncate" title={attach.name}>{attach.name}</h4>
                              <p className="text-[9px] text-slate-500 mt-0.5">{attach.date} • {attach.size}</p>
                              <span className="text-[9px] text-slate-400 block mt-0.5">Carregado por: {attach.uploader}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-1 border-t border-slate-100">
                            <button 
                              onClick={() => handleDownloadAttachment(attach.name)}
                              className="px-3.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 8. TAB PLANO INDIVIDUAL DE CUIDADO (PIC) */}
                {activeTab === 'pic' && (
                  <motion.div 
                    key="pic"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Plano Individual de Cuidado (PIC)</h2>
                        <p className="text-xs text-slate-500 mt-1">Versionamento estrutural ativo de metas e objetivos do beneficiário.</p>
                      </div>
                      
                      {/* Version Dropdown Selector */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Versão do Plano:</label>
                        <select 
                          value={picVersionSelected}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            setPicVersionSelected(v);
                            if (v === 1) {
                              setPicPlan(prev => ({
                                ...prev,
                                generalObjectives: picV1.generalObjectives,
                                specificObjectives: picV1.specificObjectives,
                                familyCommitments: picV1.familyCommitments,
                                version: 1,
                                updatedAt: picV1.updatedAt,
                                updatedBy: picV1.updatedBy
                              }));
                              addAuditEntry('VISUALIZAÇÃO_PIC', 'Visualizou v1 do PIC histórico.', 'info');
                            } else {
                              setPicPlan(prev => ({
                                ...prev,
                                generalObjectives: 'Garantir integridade física e emocional da beneficiária por meio de atuação em rede social, jurídica e psicológica.',
                                specificObjectives: '1. Reduzir crises de pânico e sintomas agudos de estresse pós-traumático.\n2. Estabelecer canal direto com rede de apoio municipal (CREAS).\n3. Readequação de rotina laboral para mitigar burnout.',
                                familyCommitments: 'A beneficiária compromete-se a comparecer aos atendimentos psicológicos semanais e participar ativamente das orientações jurídicas sobre a medida protetiva.',
                                version: 2,
                                updatedAt: '28/06/2026 18:30',
                                updatedBy: 'Dra. Roberta (Psicóloga)'
                              }));
                              addAuditEntry('VISUALIZAÇÃO_PIC', 'Visualizou v2 (atual) do PIC.', 'info');
                            }
                          }}
                          className="bg-white border-slate-200 text-xs rounded-xl focus:ring-teal-500 py-1 font-semibold"
                        >
                          <option value={2}>v2 (Atual) - 28/06/2026</option>
                          <option value={1}>v1 (Histórico) - 14/06/2026</option>
                        </select>
                      </div>
                    </div>

                    {/* PIC Metadata Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/80 border border-slate-200/50 p-3.5 rounded-2xl text-[11px] text-slate-650">
                      <span>Assinado por: <strong>{picPlan.updatedBy}</strong></span>
                      <span>Última revisão: <strong>{picPlan.updatedAt}</strong></span>
                      <span className="bg-teal-50 border border-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">v{picPlan.version} Ativa</span>
                    </div>

                    {/* Core PIC Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Objetivo Geral</label>
                        <textarea 
                          value={picPlan.generalObjectives}
                          onChange={(e) => setPicPlan(prev => ({ ...prev, generalObjectives: e.target.value }))}
                          disabled={picVersionSelected === 1}
                          className="w-full text-xs bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl p-3 font-medium h-28 resize-none leading-relaxed text-slate-700"
                        />
                      </div>
                      
                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Objetivos Específicos</label>
                        <textarea 
                          value={picPlan.specificObjectives}
                          onChange={(e) => setPicPlan(prev => ({ ...prev, specificObjectives: e.target.value }))}
                          disabled={picVersionSelected === 1}
                          className="w-full text-xs bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl p-3 font-medium h-28 resize-none leading-relaxed text-slate-700"
                        />
                      </div>

                      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Pactos e Compromissos Familiares</label>
                        <textarea 
                          value={picPlan.familyCommitments || ''}
                          onChange={(e) => setPicPlan(prev => ({ ...prev, familyCommitments: e.target.value }))}
                          disabled={picVersionSelected === 1}
                          className="w-full text-xs bg-slate-50 border-0 focus:ring-2 focus:ring-teal-500 rounded-xl p-3 font-medium h-28 resize-none leading-relaxed text-slate-700"
                        />
                      </div>
                    </div>

                    {/* Goals / Metas List */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Metas de Evolução e Prazos</h3>
                        {picVersionSelected === 2 && (
                          <button 
                            onClick={() => setShowAddGoalModal(true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-650 hover:bg-teal-700 text-white text-[11px] font-bold rounded-xl transition-all shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" /> Adicionar Meta
                          </button>
                        )}
                      </div>

                      <div className="space-y-3.5">
                        {picGoals.map((goal) => (
                          <div key={goal.id} className="bg-white border border-slate-250/70 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2.5">
                                <span className={cn(
                                  "inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold uppercase",
                                  goal.status === 'ACHIEVED' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                  goal.status === 'IN_PROGRESS' ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                  goal.status === 'NOT_ACHIEVED' ? "bg-rose-50 text-rose-700 border border-rose-100" :
                                  "bg-slate-100 text-slate-650 border border-slate-200"
                                )}>
                                  {goal.status === 'ACHIEVED' ? 'Concluída' :
                                   goal.status === 'IN_PROGRESS' ? 'Em Andamento' :
                                   goal.status === 'NOT_ACHIEVED' ? 'Não Atingida' : 'Pendente'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">Prazo: {goal.targetDate}</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-900 leading-normal">{goal.description}</h4>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                <strong>Intervenção:</strong> {goal.intervention}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-normal">
                                <strong>Indicador:</strong> {goal.indicator}
                              </p>
                            </div>

                            <div className="flex items-center gap-3.5 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                              <div className="flex flex-col text-right">
                                <span className="text-[9px] text-slate-400 font-bold uppercase">Responsável</span>
                                <span className="text-[11px] text-slate-800 font-semibold">{goal.responsible}</span>
                              </div>
                              
                              {picVersionSelected === 2 && (
                                <div className="flex gap-1">
                                  <select 
                                    value={goal.status}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      setPicGoals(prev => prev.map(g => g.id === goal.id ? { ...g, status: newStatus } : g));
                                      addAuditEntry('ATUALIZAÇÃO_META', `Status da meta "${goal.description}" alterado para ${newStatus}.`, 'info');
                                    }}
                                    className="bg-slate-50 border-slate-250 text-[10px] rounded-lg focus:ring-teal-500 py-1 font-semibold text-slate-700"
                                  >
                                    <option value="PENDING">Pendente</option>
                                    <option value="IN_PROGRESS">Em Andamento</option>
                                    <option value="ACHIEVED">Concluída</option>
                                    <option value="NOT_ACHIEVED">Não Atingida</option>
                                  </select>
                                  <button 
                                    onClick={() => {
                                      setPicGoals(prev => prev.filter(g => g.id !== goal.id));
                                      addAuditEntry('REMOÇÃO_META', `Removeu a meta: "${goal.description}"`, 'warning');
                                    }}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors"
                                    title="Excluir Meta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Save new version control */}
                    {picVersionSelected === 2 && (
                      <div className="flex justify-end pt-3 border-t border-slate-200">
                        <button 
                          onClick={() => {
                            setPicPlan(prev => ({
                              ...prev,
                              version: prev.version + 1,
                              updatedAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                              updatedBy: 'Dra. Roberta (Psicóloga)'
                            }));
                            addAuditEntry('ASSINATURA_PIC', `Salvou e assinou digitalmente Versão v${picPlan.version + 1} do PIC.`, 'success');
                            alert('Nova versão v' + (picPlan.version + 1) + ' do Plano Individual de Cuidado (PIC) gerada e salva com sucesso na trilha de auditoria.');
                          }}
                          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-teal-900/10 flex items-center gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" /> Salvar Versão e Assinar PIC
                        </button>
                      </div>
                    )}

                    {/* Modal para adicionar meta */}
                    {showAddGoalModal && (
                      <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div 
                          initial={{ scale: 0.96, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-white rounded-3xl p-6 max-w-md w-full border border-slate-250 shadow-2xl space-y-4"
                        >
                          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Nova Meta de Cuidado</h3>
                          
                          <div className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Descrição da Meta</label>
                              <input 
                                type="text" 
                                value={newGoalDesc}
                                onChange={(e) => setNewGoalDesc(e.target.value)}
                                placeholder="Ex: Reduzir isolamento social"
                                className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Intervenção Prevista</label>
                              <input 
                                type="text" 
                                value={newGoalIntervention}
                                onChange={(e) => setNewGoalIntervention(e.target.value)}
                                placeholder="Ex: Inclusão em oficinas de convivência"
                                className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-500">Indicador</label>
                                <input 
                                  type="text" 
                                  value={newGoalIndicator}
                                  onChange={(e) => setNewGoalIndicator(e.target.value)}
                                  placeholder="Ex: Frequência semanal"
                                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-slate-500">Prazo Estimado</label>
                                <input 
                                  type="text" 
                                  value={newGoalDate}
                                  onChange={(e) => setNewGoalDate(e.target.value)}
                                  placeholder="dd/mm/aaaa"
                                  className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                                />
                              </div>
                            </div>
                            <div className="space-y-1">
                              <label className="font-bold text-slate-500">Profissional Responsável</label>
                              <select 
                                value={newGoalResp}
                                onChange={(e) => setNewGoalResp(e.target.value)}
                                className="w-full bg-slate-50 border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                              >
                                {teamMembers.map(t => (
                                  <option key={t.name} value={t.name}>{t.name} ({t.role})</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex gap-2 justify-end pt-2">
                            <button 
                              onClick={() => setShowAddGoalModal(false)}
                              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 text-xs font-bold rounded-xl transition-colors"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={() => {
                                if (!newGoalDesc || !newGoalIntervention || !newGoalDate) {
                                  alert('Por favor, preencha a descrição, intervenção e data limite.');
                                  return;
                                }
                                const newGoal = {
                                  id: Date.now().toString(),
                                  description: newGoalDesc,
                                  intervention: newGoalIntervention,
                                  indicator: newGoalIndicator || 'Avaliação qualitativa',
                                  targetDate: newGoalDate,
                                  status: 'PENDING',
                                  responsible: newGoalResp
                                };
                                setPicGoals(prev => [...prev, newGoal]);
                                addAuditEntry('ADICIONAR_META', `Adicionou nova meta: "${newGoalDesc}"`, 'info');
                                setNewGoalDesc('');
                                setNewGoalIntervention('');
                                setNewGoalIndicator('');
                                setNewGoalDate('');
                                setShowAddGoalModal(false);
                              }}
                              className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-colors"
                            >
                              Adicionar
                            </button>
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 9. TAB EQUIPE MULTIDISCIPLINAR */}
                {activeTab === 'team' && (
                  <motion.div 
                    key="team"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Equipe Técnica Multidisciplinar</h2>
                        <p className="text-xs text-slate-500 mt-1">Profissionais alocados no caso e autorizados a acessar os registros.</p>
                      </div>
                      
                      {userRole === 'coord' && (
                        <button 
                          onClick={() => {
                            const newMember = {
                              name: 'Pedagogo Júlio César',
                              role: 'Apoio Pedagógico',
                              council: 'REPE 8899',
                              joinedAt: new Date().toLocaleDateString('pt-BR')
                            };
                            setTeamMembers(prev => [...prev, newMember]);
                            addAuditEntry('DESIGNAÇÃO_EQUIPE', 'Adicionou Pedagogo Júlio César à equipe técnica do caso.', 'success');
                            alert('Pedagogo Júlio César alocado com sucesso à equipe de acompanhamento deste caso.');
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-teal-650 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          <PlusCircle className="w-4.5 h-4.5" /> Alocar Profissional
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {teamMembers.map((member, idx) => (
                        <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 text-teal-600 font-bold text-sm">
                            {member.name.split(' ').pop()?.substring(0, 2).toUpperCase() || 'P'}
                          </div>
                          
                          <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                            </div>
                            <p className="text-[11px] text-slate-650 font-medium">{member.role}</p>
                            <div className="flex justify-between text-[9px] text-slate-400 font-mono pt-1">
                              <span>Conselho: {member.council}</span>
                              <span>Entrou em: {member.joinedAt}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 10. TAB REUNIÕES DE CASO */}
                {activeTab === 'meetings' && (
                  <motion.div 
                    key="meetings"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Reuniões Clínicas e Sociais de Caso</h2>
                        <p className="text-xs text-slate-500 mt-1">Atas, decisões e planos de ação multidisciplinares.</p>
                      </div>
                    </div>

                    {/* Add new meeting form */}
                    <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase">Registrar Nova Reunião de Equipe</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500">Pauta Principal (Objetivo)</label>
                          <input 
                            type="text" 
                            value={newMeetingAgenda}
                            onChange={(e) => setNewMeetingAgenda(e.target.value)}
                            placeholder="Ex: Alinhamento de medidas protetivas e CAPS"
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500">Data e Hora do Encontro</label>
                          <input 
                            type="text" 
                            value={newMeetingDate}
                            onChange={(e) => setNewMeetingDate(e.target.value)}
                            placeholder="Ex: 29/06/2026 às 15:30"
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-bold text-slate-500">Discussões Clínicas (Resumo/Ata)</label>
                          <textarea 
                            value={newMeetingMinutes}
                            onChange={(e) => setNewMeetingMinutes(e.target.value)}
                            placeholder="Breve resumo da discussão, hipóteses clínicas levantadas e condutas..."
                            className="w-full h-20 bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 resize-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500">Decisões Tomadas</label>
                          <input 
                            type="text" 
                            value={newMeetingDecisions}
                            onChange={(e) => setNewMeetingDecisions(e.target.value)}
                            placeholder="Ex: Encaminhar ao CAPS e acionar OAB"
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500">Plano de Ação / Tarefas e Responsáveis</label>
                          <input 
                            type="text" 
                            value={newMeetingTasks}
                            onChange={(e) => setNewMeetingTasks(e.target.value)}
                            placeholder="Ex: Fernando: enviar ofício CAPS até 01/07."
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                          />
                        </div>
                        
                        <div className="md:col-span-2 space-y-1.5">
                          <label className="font-bold text-slate-500 block mb-1">Participantes Presentes</label>
                          <div className="flex flex-wrap gap-3">
                            {teamMembers.map(t => {
                              const isChecked = selectedMeetingParticipants.includes(t.name);
                              return (
                                <label key={t.name} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-50">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedMeetingParticipants(prev => prev.filter(p => p !== t.name));
                                      } else {
                                        setSelectedMeetingParticipants(prev => [...prev, t.name]);
                                      }
                                    }}
                                    className="text-teal-600 rounded focus:ring-teal-500"
                                  />
                                  <span className="text-[11px] text-slate-700">{t.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => {
                            if (!newMeetingAgenda || !newMeetingMinutes || !newMeetingDate) {
                              alert('Por favor, preencha a pauta, resumo da ata e data da reunião.');
                              return;
                            }
                            const newM = {
                              id: Date.now().toString(),
                              meetingDate: newMeetingDate,
                              agenda: newMeetingAgenda,
                              minutes: newMeetingMinutes,
                              decisions: newMeetingDecisions || 'Alinhamento geral terapêutico',
                              pendingTasks: newMeetingTasks || 'Sem tarefas adicionais pendentes',
                              participants: selectedMeetingParticipants.length > 0 ? selectedMeetingParticipants : ['Dra. Roberta de Souza']
                            };
                            setCaseMeetings(prev => [newM, ...prev]);
                            addAuditEntry('REGISTRO_REUNIÃO', `Registrou ata de reunião multidisciplinar sobre: "${newMeetingAgenda}"`, 'success');
                            
                            // Limpar campos
                            setNewMeetingAgenda('');
                            setNewMeetingMinutes('');
                            setNewMeetingDecisions('');
                            setNewMeetingTasks('');
                            setNewMeetingDate('');
                            setSelectedMeetingParticipants([]);
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Salvar Ata de Reunião
                        </button>
                      </div>
                    </div>

                    {/* Historical List */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Reuniões</h4>
                      
                      {caseMeetings.map((meeting) => (
                        <div key={meeting.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono border-b border-slate-100 pb-2">
                            <span>Data do Encontro: {meeting.meetingDate}</span>
                            <span>ID: RE-{meeting.id.substring(0, 4)}</span>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-900">Pauta: {meeting.agenda}</h4>
                            <p className="text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                              {meeting.minutes}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-[11px]">
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <strong>Decisões:</strong>
                                <p className="text-slate-600 mt-1 font-medium">{meeting.decisions}</p>
                              </div>
                              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                                <strong>Plano de Ação / Pendências:</strong>
                                <p className="text-slate-600 mt-1 font-medium">{meeting.pendingTasks}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                            <span className="text-[9px] text-slate-400 font-bold uppercase shrink-0">Participantes:</span>
                            {meeting.participants.map((p, i) => (
                              <span key={i} className="text-[10px] bg-slate-100 text-slate-650 px-2 py-0.5 rounded-md font-medium border border-slate-150">{p}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 11. TAB ENCAMINHAMENTOS */}
                {activeTab === 'referrals' && (
                  <motion.div 
                    key="referrals"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Encaminhamentos Clínicos e Sociais</h2>
                        <p className="text-xs text-slate-500 mt-1">Direcionamento assistencial para a rede pública (SUS/SUAS/Judicial) e parceiros.</p>
                      </div>
                    </div>

                    {/* New Referral Form */}
                    <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-bold text-slate-900 uppercase">Emitir Novo Encaminhamento</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="space-y-1.5">
                          <label className="font-bold text-slate-500">Tipo de Fluxo</label>
                          <select 
                            value={newReferralType}
                            onChange={(e) => setNewReferralType(e.target.value as any)}
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 font-semibold"
                          >
                            <option value="EXTERNAL">Rede Externa (CRAS, CREAS, CAPS, OAB, etc.)</option>
                            <option value="INTERNAL">Rede Interna (Especialidades Instituto)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="font-bold text-slate-500">Instituição / Profissional de Destino</label>
                          <input 
                            type="text" 
                            value={newReferralDestination}
                            onChange={(e) => setNewReferralDestination(e.target.value)}
                            placeholder="Ex: CREAS Leste ou Psiquiatra de Referência do Município"
                            className="w-full bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3"
                          />
                        </div>
                        <div className="space-y-1.5 md:col-span-3">
                          <label className="font-bold text-slate-500">Motivo do Encaminhamento & Resumo do Caso</label>
                          <textarea 
                            value={newReferralReason}
                            onChange={(e) => setNewReferralReason(e.target.value)}
                            placeholder="Justificativa técnica, queixa principal e objetivo do encaminhamento..."
                            className="w-full h-20 bg-white border-slate-200 rounded-xl focus:ring-teal-500 py-2 px-3 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={() => {
                            if (!newReferralDestination || !newReferralReason) {
                              alert('Por favor, preencha o destino e o motivo do encaminhamento.');
                              return;
                            }
                            const newR = {
                              id: Date.now().toString(),
                              type: newReferralType,
                              destination: newReferralDestination,
                              reason: newReferralReason,
                              status: 'SENT',
                              result: 'Documento gerado e entregue ao beneficiário.',
                              date: new Date().toLocaleDateString('pt-BR'),
                              professional: 'Dra. Roberta de Souza'
                            };
                            setReferrals(prev => [newR, ...prev]);
                            addAuditEntry('EMISSÃO_ENCAMINHAMENTO', `Emitiu guia de encaminhamento para ${newReferralDestination}.`, 'info');
                            
                            // Limpar campos
                            setNewReferralDestination('');
                            setNewReferralReason('');
                            
                            alert('Guia de encaminhamento gerada com sucesso e arquivada na Linha do Tempo. Prontuário atualizado.');
                          }}
                          className="px-4 py-2 bg-teal-600 hover:bg-teal-550 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Emitir Guia e Enviar
                        </button>
                      </div>
                    </div>

                    {/* Referral List */}
                    <div className="space-y-3.5 pt-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Histórico de Encaminhamentos</h4>
                      
                      {referrals.map((ref) => (
                        <div key={ref.id} className="bg-white border border-slate-250 p-5 rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center gap-2">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                                ref.type === 'INTERNAL' ? "bg-purple-50 text-purple-700 border border-purple-100" : "bg-blue-50 text-blue-700 border border-blue-100"
                              )}>
                                {ref.type === 'INTERNAL' ? 'Interno' : 'Externo'}
                              </span>
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                                ref.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                ref.status === 'SENT' ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                "bg-slate-100 text-slate-650"
                              )}>
                                {ref.status === 'COMPLETED' ? 'Concluído' : 'Enviado / Pendente'}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">{ref.date}</span>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-xs font-bold text-slate-900">Destino: {ref.destination}</h4>
                            <p className="text-xs text-slate-650 leading-relaxed font-medium bg-slate-50 p-3 rounded-xl">
                              <strong>Motivo:</strong> {ref.reason}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 pt-2.5 border-t border-slate-100 text-[11px] justify-between flex-wrap gap-y-2">
                            <div className="text-slate-500 font-medium">
                              Autor: <strong>{ref.professional}</strong>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-1 md:flex-initial min-w-[200px] justify-end">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">Retorno:</label>
                              <input 
                                type="text" 
                                value={ref.result || ''}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setReferrals(prev => prev.map(r => r.id === ref.id ? { ...r, result: text, status: text.length > 5 ? 'COMPLETED' : 'SENT' } : r));
                                }}
                                placeholder="Registrar devolutiva da rede..."
                                className="bg-slate-50 border-slate-200 text-xs rounded-lg focus:ring-teal-500 py-1 px-2.5 flex-1 max-w-[240px]"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 12. TAB ALERTAS DO CASO */}
                {activeTab === 'alerts' && (
                  <motion.div 
                    key="alerts"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Alertas de Telemetria e Inatividade</h2>
                        <p className="text-xs text-slate-500 mt-1">Notificações sistêmicas sobre desvios no Plano de Cuidado (PIC).</p>
                      </div>
                    </div>

                    {caseAlerts.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-center text-xs font-semibold text-emerald-700">
                        Nenhum desvio ou alerta ativo no caso. O plano de cuidado está regular.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {caseAlerts.map((alert) => (
                          <div 
                            key={alert.id} 
                            className={cn(
                              "p-4 rounded-2xl border flex items-center justify-between gap-4 shadow-sm",
                              alert.severity === 'HIGH' ? "bg-rose-50 border-rose-150 text-rose-905" : "bg-amber-50 border-amber-150 text-amber-905"
                            )}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                                  alert.severity === 'HIGH' ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                                )}>
                                  {alert.severity === 'HIGH' ? 'Crítico' : 'Médio'}
                                </span>
                                <span className="text-[10px] text-slate-450 font-mono font-bold">{alert.date}</span>
                              </div>
                              <p className="text-xs font-bold">{alert.message}</p>
                            </div>
                            
                            <button 
                              onClick={() => {
                                setCaseAlerts(prev => prev.filter(a => a.id !== alert.id));
                                addAuditEntry('RESOLUÇÃO_ALERTA', `Alerta resolvido: "${alert.message}"`, 'success');
                              }}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[10px] font-bold rounded-lg transition-all shadow-sm shrink-0"
                            >
                              Resolver Alerta
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 7. TAB TRILHA DE AUDITORIA IMUTÁVEL (LGPD - PEI-RN07) */}
                {activeTab === 'audit' && (
                  <motion.div 
                    key="audit"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h2 className="text-base font-bold text-slate-950 uppercase tracking-wide">Trilha de Auditoria Médico-Legal (LGPD)</h2>
                      <span className="text-[9px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-100">Imutável</span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Conforme determinações da LGPD e conselhos profissionais de saúde, todas as ações de leitura clínica, overrides, edição de dados e exportações são catalogadas neste ledger indestrutível.
                    </p>

                    <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[10px] text-slate-700">
                      {auditEntries.map((log, index) => (
                        <div 
                          key={index}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col gap-1.5",
                            log.type === 'security' ? "bg-rose-50 border-rose-100 text-rose-800" :
                            log.type === 'success' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                            log.type === 'warning' ? "bg-amber-50 border-amber-100 text-amber-800" :
                            "bg-slate-50 border-slate-200 text-slate-700"
                          )}
                        >
                          <div className="flex justify-between font-bold text-[9px] border-b border-black/5 pb-1 uppercase">
                            <span>[{log.action}] {log.timestamp}</span>
                            <span>{log.type}</span>
                          </div>
                          <p className="font-semibold text-slate-800">{log.professional} ({log.role})</p>
                          <p className="leading-relaxed text-slate-600">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* ========================================================================= */}
              {/* SEÇÃO INTEGRADA DO COPILOTO IA NA PARTE INFERIOR DO PEI */}
              {/* ========================================================================= */}
              <section className="bg-indigo-50/40 border border-indigo-100 rounded-3xl p-6 mt-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold text-sm">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    Copiloto IA — Análise de Prontuário PEI
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Suporte Clínico</span>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={handleSummarizeClinicalHistory}
                    disabled={isAiLoading}
                    className="flex-1 py-3 px-4 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5"
                  >
                    {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <History className="w-4.5 h-4.5" />}
                    Sintetizar Histórico Clínico Longitudinal
                  </button>

                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Busca inteligente (ex: quando ela falou sobre sono?)"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSemanticSearch()}
                      className="flex-1 text-xs bg-white border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleSemanticSearch}
                      disabled={isAiLoading || !aiSearchQuery.trim()}
                      className="px-4 py-2.5 bg-white border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-50 text-indigo-750 text-xs font-bold rounded-xl transition-all flex items-center gap-1 shrink-0"
                    >
                      <Search className="w-4.5 h-4.5" />
                      Buscar
                    </button>
                  </div>
                </div>

                {/* IA Output display */}
                {aiResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-indigo-100 rounded-2xl p-5 space-y-3 relative shadow-inner"
                  >
                    <div className="flex justify-between items-center text-[10px] text-indigo-600 font-bold border-b border-indigo-50 pb-2">
                      <span>COPILOTO IA AURA — RELATÓRIO DO HISTÓRICO:</span>
                      <button 
                        onClick={() => setAiResult(null)}
                        className="text-stone-400 hover:text-stone-600 font-semibold"
                      >
                        Fechar
                      </button>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap max-h-56 overflow-y-auto">
                      {aiResult}
                    </div>
                  </motion.div>
                )}
              </section>

            </main>
          </>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODAL DE JUSTIFICATIVA PARA OVERRIDE DE SIGILO (PEI-RN02) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showOverrideModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-900 uppercase">Override Excepcional de Sigilo</span>
                <button 
                  onClick={() => setShowOverrideModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  Fechar
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2.5 text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-3.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-[11px] font-semibold leading-normal">
                    Este ato viola a restrição primária de vínculo terapêutico. O override deve ser estritamente motivado por razões ético-profissionais urgentes e gerará uma notificação automática na governança de TI.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] uppercase font-bold text-slate-400">Justificativa da Abertura Excepcional</label>
                  <textarea 
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Ex: Auditoria técnica anual / Solicitação pericial do juizado de violência doméstica conforme mandado nº 12345."
                    className="w-full h-24 text-xs border-slate-200 rounded-xl focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
                <button 
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleRequestOverride}
                  className="px-4 py-2 bg-rose-650 hover:bg-rose-600 text-white rounded-xl transition-colors shadow-md shadow-rose-900/10"
                >
                  Liberar e Gravar Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL PARA RESPONDER ESCALA GAD-7 (ANSIEDADE) */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showScaleModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-slate-900 uppercase">Aplicação de Escala GAD-7 (Transtorno de Ansiedade)</span>
                <button 
                  onClick={() => setShowScaleModal(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm"
                >
                  Fechar
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs">
                <p className="text-slate-500 leading-normal">
                  Nas últimas duas semanas, com que frequência o beneficiário foi incomodado pelos seguintes problemas? Marque de 0 (Nenhuma) a 3 (Quase todos os dias).
                </p>
                
                {[
                  '1. Sentir-se nervoso, ansioso ou muito tenso.',
                  '2. Não ser capaz de parar ou de controlar as preocupações.',
                  '3. Preocupar-se muito com diversas coisas diferentes.',
                  '4. Dificuldade para relaxar.',
                  '5. Ficar tão inquieto que é difícil permanecer sentado.',
                  '6. Ficar facilmente aborrecido ou irritado.',
                  '7. Sentir medo de que algo terrível possa acontecer.'
                ].map((q, idx) => (
                  <div key={idx} className="bg-slate-50 p-4 border border-slate-150 rounded-2xl space-y-2">
                    <span className="font-semibold text-slate-800 block">{q}</span>
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                      {[
                        { val: 0, lbl: 'Nenhuma vez' },
                        { val: 1, lbl: 'Vários dias' },
                        { val: 2, lbl: 'Mais da metade' },
                        { val: 3, lbl: 'Quase sempre' }
                      ].map(opt => (
                        <button 
                          key={opt.val}
                          type="button"
                          onClick={() => setGadAnswers(prev => {
                            const copy = [...prev];
                            copy[idx] = opt.val;
                            return copy;
                          })}
                          className={cn(
                            "py-2 px-1 rounded-xl font-bold border transition-colors",
                            gadAnswers[idx] === opt.val 
                              ? "bg-indigo-600 border-indigo-600 text-white" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          )}
                        >
                          {opt.val} - {opt.lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0 text-xs">
                <span className="font-bold text-slate-700">Total Parcial: {gadAnswers.reduce((a, b) => a + b, 0)} pontos</span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowScaleModal(false)}
                    className="px-4 py-2 border border-slate-200 text-slate-650 hover:bg-slate-100 rounded-xl font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleCompleteScale}
                    className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-900/10"
                  >
                    Gravar Escore
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
