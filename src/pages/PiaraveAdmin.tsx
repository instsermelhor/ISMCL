import React, { useState, useMemo } from 'react';
import { usePiarave } from '../contexts/PiaraveContext';
import type {
  PiaraveCase,
  PiaraveGoal,
  PiaraveEvolution,
} from '../types/piarave';
import {
  Users,
  Lock,
  PlusCircle,
  Calendar,
  ShieldAlert,
  History,
  CheckCircle,
  Clock,
  Briefcase,
  AlertTriangle,
  LockKeyhole,
} from 'lucide-react';

const ROLE_LABELS: Record<PiaraveEvolution['role'], string> = {
  psicologo: 'Psicologia 🧠',
  psiquiatra: 'Psiquiatria 🩺',
  assistente_social: 'Serviço Social 🤝',
  advogado: 'Orientação Jurídica ⚖️',
  pedagogo: 'Pedagogia 📖',
  mediador: 'Mediação Familiar 👥',
};

const SECURITY_COLORS: Record<string, string> = {
  standard: '#22c55e',
  elevated: '#f59e0b',
  special: '#a78bfa',
  maximum: '#ef4444',
};

const STATUS_LABELS = {
  active: '🟢 Ativo',
  pending_evaluation: '⏳ Avaliação Pendente',
  completed: '✅ Concluído',
  archived: '📦 Arquivado',
  reopened: '🔄 Reaberto',
};

export default function PiaraveAdmin() {
  const {
    cases,
    auditLogs,
    updatePiaDetails,
    addGoalToPia,
    updateGoalStatus,
    addEvolutionToCase,
    addMeetingToCase,
    closeCase,
    reopenCase,
    saveSafetyPlan,
    logAccess,
  } = usePiarave();

  const [activeTab, setActiveTab] = useState<'bi' | 'cases' | 'audit'>('bi');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  // Controle de Sigilo ABAC (Simulado)
  const [currentProfessionalRole, setCurrentProfessionalRole] = useState<PiaraveEvolution['role']>('psicologo');
  const [decryptedSafetyPlans, setDecryptedSafetyPlans] = useState<Record<string, boolean>>({});

  // Fila de Casos Filtrada
  const [caseFilter, setCaseFilter] = useState<'all' | 'active' | 'pending_evaluation'>('all');
  const [searchCase, setSearchCase] = useState('');

  // Formulário para Nova Meta
  const [newGoal, setNewGoal] = useState({ description: '', intervention: '', indicator: '', targetDate: '', responsible: '' });

  // Formulário para Nova Evolução
  const [newEvolution, setNewEvolution] = useState('');

  // Formulário para Nova Reunião
  const [newMeeting, setNewMeeting] = useState({ agenda: '', participants: '', minutes: '', decisions: '' });

  // Form para Edição Geral do PIA
  const [editingPia, setEditingPia] = useState<{ general: string; specific: string; commitments: string } | null>(null);

  const selectedCase = useMemo(() => {
    return cases.find((c) => c.id === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Criptografia / Visualização do Plano de Segurança (MCSI-RN)
  const handleDecryptSafetyPlan = (c: PiaraveCase) => {
    if (!c.safetyPlan) return;
    const key = c.id;
    const isCurrentlyDecrypted = decryptedSafetyPlans[key];

    if (!isCurrentlyDecrypted) {
      // Registra no Log de Auditoria de Segurança
      logAccess(
        'safety_plan_accessed',
        c.id,
        `Plano de Segurança descriptografado pelo profissional (${currentProfessionalRole}). Justificativa: Auditoria e revisão do plano individual de fuga.`,
        c.securityLevel
      );
      setDecryptedSafetyPlans((prev) => ({ ...prev, [key]: true }));
    } else {
      setDecryptedSafetyPlans((prev) => ({ ...prev, [key]: false }));
    }
  };

  // KPIs de BI
  const biStats = useMemo(() => {
    const total = cases.length;
    const active = cases.filter((c) => c.status === 'active').length;
    const pending = cases.filter((c) => c.status === 'pending_evaluation').length;

    // Distribuição de demandas
    const demandsCount: Record<string, number> = {};
    cases.forEach((c) => {
      c.demandsReported.forEach((d) => {
        demandsCount[d] = (demandsCount[d] || 0) + 1;
      });
    });

    // Faixa etária fictícia
    const ageBreakdown = {
      mulheres: cases.filter((c) => (c.beneficiaryProfile as string) === 'woman' || c.id === 'CAS-PIARAVE-001').length,
      homens: cases.filter((c) => c.beneficiaryProfile === 'adult_civilian' && c.id !== 'CAS-PIARAVE-001').length,
      adolescentes: 0,
      crianças: 0,
      idosos: cases.filter((c) => (c.beneficiaryProfile as string) === 'elderly').length,
    };

    return {
      total,
      active,
      pending,
      demandsCount,
      ageBreakdown,
    };
  }, [cases]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const matchFilter =
        caseFilter === 'all' ||
        (caseFilter === 'active' && c.status === 'active') ||
        (caseFilter === 'pending_evaluation' && c.status === 'pending_evaluation');
      const matchSearch = c.beneficiaryName.toLowerCase().includes(searchCase.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [cases, caseFilter, searchCase]);

  // Edição do PIA Geral
  const handleStartEditPia = (c: PiaraveCase) => {
    setEditingPia({
      general: c.piaGeneralObjectives,
      specific: c.piaSpecificObjectives,
      commitments: c.piaFamilyCommitments,
    });
  };

  const handleSavePiaDetails = (c: PiaraveCase) => {
    if (!editingPia) return;
    updatePiaDetails(c.id, editingPia.general, editingPia.specific, editingPia.commitments);
    setEditingPia(null);
  };

  // Nova Meta
  const handleAddGoal = (c: PiaraveCase) => {
    if (!newGoal.description.trim()) return;
    addGoalToPia(c.id, newGoal);
    setNewGoal({ description: '', intervention: '', indicator: '', targetDate: '', responsible: '' });
  };

  // Nova Evolução
  const handleAddEvolution = (c: PiaraveCase) => {
    if (!newEvolution.trim()) return;
    addEvolutionToCase(c.id, newEvolution, currentProfessionalRole);
    setNewEvolution('');
  };

  // Nova Reunião
  const handleAddMeeting = (c: PiaraveCase) => {
    if (!newMeeting.agenda.trim()) return;
    addMeetingToCase(c.id, {
      agenda: newMeeting.agenda,
      participants: newMeeting.participants.split(',').map((p) => p.trim()),
      minutes: newMeeting.minutes,
      decisions: newMeeting.decisions,
      date: new Date().toISOString(),
    });
    setNewMeeting({ agenda: '', participants: '', minutes: '', decisions: '' });
  };

  // --- Segregação de Funções / Filtro de Conteúdo (ABAC/RBAC) ---
  const isAuthorizedToSeeEvolutions = (role: string) => {
    // Advogados só veem orientações jurídicas; Pedagogos veem o resto; Saúde Mental vê tudo.
    if (currentProfessionalRole === 'advogado') {
      return role === 'advogado';
    }
    if (currentProfessionalRole === 'pedagogo') {
      return role !== 'advogado' && role !== 'psiquiatra';
    }
    return true; // Psicólogos, Assistentes Sociais e Psiquiatras acessam tudo.
  };

  const panelStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)',
    fontFamily: "'Inter', sans-serif",
    color: '#f1f5f9',
    padding: '32px',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
  };

  return (
    <div style={panelStyle}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PIARAVE — Gestão de Casos e Auditoria
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '6px' }}>
            Ambiente Seguro da Equipe Multidisciplinar • Instituto Ser Melhor
          </p>
        </div>

        {/* Simulador de Role IAM */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>Operando como:</span>
          <select
            value={currentProfessionalRole}
            onChange={(e) => setCurrentProfessionalRole(e.target.value as PiaraveEvolution['role'])}
            style={{ padding: '6px 12px', background: '#1c1c36', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
          >
            {(Object.keys(ROLE_LABELS) as PiaraveEvolution['role'][]).map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0px' }}>
        {[
          { id: 'bi', label: '📊 Indicadores (BI)', icon: '📊' },
          { id: 'cases', label: '👥 Acompanhamento de Casos', icon: '👥' },
          { id: 'audit', label: '🛡️ Trilha de Auditoria (MCSI)', icon: '🛡️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as 'bi' | 'cases' | 'audit')}
            style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === t.id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === t.id ? '#a78bfa' : '#64748b', cursor: 'pointer',
              fontSize: '14px', fontWeight: activeTab === t.id ? 700 : 400
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ─────────────────────────────────────────────────────────
          TAB: INDICADORES (BI)
          ───────────────────────────────────────────────────────── */}
      {activeTab === 'bi' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', color: '#6366f1' }}>👥</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{biStats.total}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Total de Acolhimentos</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', color: '#22c55e' }}>🟢</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{biStats.active}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Casos em Acompanhamento</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', color: '#f59e0b' }}>⏳</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>{biStats.pending}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Avaliações Pendentes</div>
            </div>
            <div style={{ ...cardStyle, textAlign: 'center' }}>
              <div style={{ fontSize: '28px', color: '#ef4444' }}>🔴</div>
              <div style={{ fontSize: '32px', fontWeight: 800 }}>
                {cases.filter((c) => c.priorityLevel === 'critical').length}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Casos de Risco Crítico</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Gráfico/Lista de Demandas Relatadas */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Tipos de Demandas Mais Comuns</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(biStats.demandsCount)
                  .sort((a, b) => b[1] - a[1])
                  .map(([demand, count]) => (
                    <div key={demand} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                        <span>{demand.replace('_', ' ').toUpperCase()}</span>
                        <strong>{count} ocorrência(s)</strong>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px' }}>
                        <div style={{ height: '100%', width: `${(count / biStats.total) * 100}%`, background: 'linear-gradient(90deg, #6366f1, #a78bfa)', borderRadius: '999px' }} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Faixa Etária e Divisão de Gênero */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Distribuição de Linhas de Atendimento</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: '👩 Mulheres', val: biStats.ageBreakdown.mulheres },
                  { label: '👨 Homens', val: biStats.ageBreakdown.homens },
                  { label: '🧓 Idosos', val: biStats.ageBreakdown.idosos },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '14px' }}>{item.label}</span>
                    <span style={{ padding: '4px 12px', background: 'rgba(99,102,241,0.1)', color: '#a78bfa', borderRadius: '999px', fontSize: '13px', fontWeight: 700 }}>
                      {item.val} caso(s)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB: ACOMPANHAMENTO DE CASOS
          ───────────────────────────────────────────────────────── */}
      {activeTab === 'cases' && (
        <div style={{ display: 'grid', gridTemplateColumns: selectedCase ? '1fr 2fr' : '1fr', gap: '24px' }}>
          {/* Fila de Casos */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="🔍 Filtrar por nome..."
                value={searchCase}
                onChange={(e) => setSearchCase(e.target.value)}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#fff', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
              {(['all', 'active', 'pending_evaluation'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setCaseFilter(f)}
                  style={{
                    padding: '6px 12px', background: caseFilter === f ? '#6366f1' : 'rgba(255,255,255,0.04)',
                    color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Avaliação'}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => { setSelectedCaseId(c.id); setEditingPia(null); }}
                  style={{
                    ...cardStyle, cursor: 'pointer',
                    borderColor: selectedCaseId === c.id ? '#6366f1' : 'rgba(255, 255, 255, 0.09)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px' }}>{c.beneficiaryName}</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{STATUS_LABELS[c.status]}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', fontSize: '11px' }}>
                      {c.beneficiaryProfile}
                    </span>
                    <span style={{ padding: '2px 8px', background: SECURITY_COLORS[c.securityLevel], borderRadius: '999px', fontSize: '11px', color: '#000', fontWeight: 600 }}>
                      🛡️ {c.securityLevel.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Acolhido em: {new Date(c.createdAt).toLocaleDateString('pt-BR')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ficha e Prontuário do Caso Selecionado */}
          {selectedCase && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>{selectedCase.beneficiaryName}</h2>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>Caso {selectedCase.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {selectedCase.status !== 'completed' ? (
                      <button onClick={() => closeCase(selectedCase.id)} style={{ padding: '8px 16px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        Conceder Alta
                      </button>
                    ) : (
                      <button onClick={() => reopenCase(selectedCase.id)} style={{ padding: '8px 16px', background: '#eab308', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                        Reabrir Caso
                      </button>
                    )}
                    <button onClick={() => setSelectedCaseId(null)} style={{ padding: '8px 16px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                      Fechar
                    </button>
                  </div>
                </div>

                {/* Demandas Relatadas */}
                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Demandas Relatadas</h4>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {selectedCase.demandsReported.map((d) => (
                      <span key={d} style={{ fontSize: '12px', padding: '4px 10px', background: 'rgba(239,68,68,0.1)', color: '#fca5a5', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.2)' }}>
                        ⚠️ {d.replace('_', ' ').toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Plano de Segurança (Cofre Digital / MCSI) */}
                {selectedCase.safetyPlan && (
                  <div style={{ padding: '16px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Lock className="w-5 h-5 text-indigo-400" />
                        <strong style={{ fontSize: '14px' }}>Cofre Digital: Plano de Segurança</strong>
                      </div>
                      <button
                        onClick={() => handleDecryptSafetyPlan(selectedCase)}
                        style={{
                          padding: '6px 12px', background: decryptedSafetyPlans[selectedCase.id] ? '#ef4444' : '#6366f1',
                          color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600
                        }}
                      >
                        {decryptedSafetyPlans[selectedCase.id] ? '🔒 Ocultar/Criptografar' : '🔓 Descriptografar / Acessar'}
                      </button>
                    </div>

                    {decryptedSafetyPlans[selectedCase.id] ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                        <div>
                          <strong>Pessoa de Confiança:</strong> {selectedCase.safetyPlan.trustedPersonName}
                        </div>
                        <div>
                          <strong>Contato:</strong> {selectedCase.safetyPlan.trustedPersonContact}
                        </div>
                        <div>
                          <strong>Contato Emergência:</strong> {selectedCase.safetyPlan.emergencyContact}
                        </div>
                        <div>
                          <strong>Local de Fuga Seguro:</strong> {selectedCase.safetyPlan.safePlaceDescription}
                        </div>
                        <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                          <strong>Instruções de Ação Rápida:</strong>
                          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', lineHeight: 1.5 }}>
                            {selectedCase.safetyPlan.safetyInstructions}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                        <LockKeyhole className="w-4 h-4" />
                        <span>Este plano de segurança está encriptado no Cofre Digital. Qualquer descriptografia será auditada.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Plano Individual de Acompanhamento (PIA) */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>📋 Plano Individual de Acompanhamento (PIA v{selectedCase.piaVersion})</h3>
                    {!editingPia ? (
                      <button onClick={() => handleStartEditPia(selectedCase)} style={{ padding: '4px 10px', background: 'transparent', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                        ✏️ Editar Objetivos
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleSavePiaDetails(selectedCase)} style={{ padding: '4px 10px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          Salvar
                        </button>
                        <button onClick={() => setEditingPia(null)} style={{ padding: '4px 10px', background: 'transparent', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>
                          Cancelar
                        </button>
                      </div>
                    )}
                  </div>

                  {!editingPia ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                      <div><strong>Objetivo Geral:</strong> {selectedCase.piaGeneralObjectives}</div>
                      <div><strong>Objetivos Específicos:</strong> {selectedCase.piaSpecificObjectives}</div>
                      <div><strong>Compromissos Familiares/Acordos:</strong> {selectedCase.piaFamilyCommitments}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        value={editingPia.general}
                        onChange={(e) => setEditingPia({ ...editingPia, general: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                      />
                      <textarea
                        value={editingPia.specific}
                        onChange={(e) => setEditingPia({ ...editingPia, specific: e.target.value })}
                        style={{ width: '100%', height: '60px', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        value={editingPia.commitments}
                        onChange={(e) => setEditingPia({ ...editingPia, commitments: e.target.value })}
                        style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '13px' }}
                      />
                    </div>
                  )}

                  {/* Metas Ativas */}
                  <div style={{ marginTop: '16px' }}>
                    <strong style={{ fontSize: '13px', display: 'block', marginBottom: '8px' }}>Metas do PIA</strong>
                    {selectedCase.piaGoals.map((g) => (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '6px', fontSize: '13px' }}>
                        <div>
                          <strong>{g.description}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Resp: {g.responsible} | Meta: {g.targetDate}</div>
                        </div>
                        <select
                          value={g.status}
                          onChange={(e) => updateGoalStatus(selectedCase.id, g.id, e.target.value as PiaraveGoal['status'])}
                          style={{ padding: '4px 8px', background: '#1c1c36', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        >
                          <option value="PENDING">⏳ Pendente</option>
                          <option value="IN_PROGRESS">🔄 Em Progresso</option>
                          <option value="COMPLETED">✅ Concluído</option>
                          <option value="SUSPENDED">⏸️ Suspenso</option>
                        </select>
                      </div>
                    ))}

                    {/* Form para Meta */}
                    <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Adicionar Meta ao PIA</span>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text"
                          placeholder="Meta..."
                          value={newGoal.description}
                          onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                          style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                        <input
                          type="text"
                          placeholder="Responsável..."
                          value={newGoal.responsible}
                          onChange={(e) => setNewGoal({ ...newGoal, responsible: e.target.value })}
                          style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          placeholder="Indicador..."
                          value={newGoal.indicator}
                          onChange={(e) => setNewGoal({ ...newGoal, indicator: e.target.value })}
                          style={{ padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                        />
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            placeholder="Prazo (YYYY-MM-DD)..."
                            value={newGoal.targetDate}
                            onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                            style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                          />
                          <button onClick={() => handleAddGoal(selectedCase)} style={{ padding: '8px 12px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Evoluções e Rede Multidisciplinar */}
              <div style={cardStyle}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📈 Prontuário Cronológico & Rede</h3>

                {/* Evoluções com segregação de funções */}
                <div style={{ marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Evoluções Registradas</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {selectedCase.evolutions.map((ev) => {
                      const allowed = isAuthorizedToSeeEvolutions(ev.role);
                      return (
                        <div key={ev.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${allowed ? '#6366f1' : '#ef4444'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                            <span>{ev.professionalName} ({ROLE_LABELS[ev.role]})</span>
                            <span>{new Date(ev.date).toLocaleString('pt-BR')}</span>
                          </div>
                          {allowed ? (
                            <div style={{ fontSize: '13px', lineHeight: 1.4, color: '#e2e8f0' }}>{ev.content}</div>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <AlertTriangle className="w-4 h-4" />
                              <span>[Acesso Bloqueado: Informação restrita por papel profissional]</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Form para Nova Evolução */}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="Registrar nova evolução no prontuário..."
                      value={newEvolution}
                      onChange={(e) => setNewEvolution(e.target.value)}
                      style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none' }}
                    />
                    <button onClick={() => handleAddEvolution(selectedCase)} style={{ padding: '10px 18px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                      Assinar
                    </button>
                  </div>
                </div>

                {/* Reuniões de Rede */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Reuniões de Rede Multidisciplinar</span>
                  {selectedCase.meetings.map((m) => (
                    <div key={m.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', marginBottom: '8px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', marginBottom: '4px' }}>
                        <strong>Pauta: {m.agenda}</strong>
                        <span>{new Date(m.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div><strong>Participantes:</strong> {m.participants.join(', ')}</div>
                      <div><strong>Minuta:</strong> {m.minutes}</div>
                      <div><strong>Decisões:</strong> {m.decisions}</div>
                    </div>
                  ))}

                  {/* Form Reunião */}
                  <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Registrar Reunião de Rede</span>
                    <input
                      type="text"
                      placeholder="Pauta da reunião..."
                      value={newMeeting.agenda}
                      onChange={(e) => setNewMeeting({ ...newMeeting, agenda: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                    />
                    <input
                      type="text"
                      placeholder="Participantes (separados por vírgula)..."
                      value={newMeeting.participants}
                      onChange={(e) => setNewMeeting({ ...newMeeting, participants: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                    />
                    <input
                      type="text"
                      placeholder="Minuta de discussões..."
                      value={newMeeting.minutes}
                      onChange={(e) => setNewMeeting({ ...newMeeting, minutes: e.target.value })}
                      style={{ width: '100%', padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px', marginBottom: '6px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        type="text"
                        placeholder="Deliberações/Decisões..."
                        value={newMeeting.decisions}
                        onChange={(e) => setNewMeeting({ ...newMeeting, decisions: e.target.value })}
                        style={{ flex: 1, padding: '8px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#fff', fontSize: '12px' }}
                      />
                      <button onClick={() => handleAddMeeting(selectedCase)} style={{ padding: '8px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                        Registrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────
          TAB: TRILHA DE AUDITORIA (MCSI)
          ───────────────────────────────────────────────────────── */}
      {activeTab === 'audit' && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>🛡️ Registro Imutável de Transações e Segurança</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{
                padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px',
                borderLeft: `4px solid ${SECURITY_COLORS[log.securityLevel] || '#475569'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '13px' }}>{log.action.replace('_', ' ').toUpperCase()}</strong>
                    <span style={{ fontSize: '11px', padding: '1px 6px', background: SECURITY_COLORS[log.securityLevel], color: '#000', borderRadius: '4px', fontWeight: 700 }}>
                      {log.securityLevel.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{log.details}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ID do Caso: {log.dossierId}</div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '11px', color: '#64748b' }}>
                  <div>{log.performedBy} ({log.role})</div>
                  <div>{new Date(log.performedAt).toLocaleString('pt-BR')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
