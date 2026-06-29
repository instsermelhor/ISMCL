import React, { useState } from 'react';
import { useSATAI } from '../contexts/SATAIContext';
import { mockBeneficiaries } from '../data/adaptive-registration-mock';
import type { SataiProtocol, SataiDossier, SataiProtocolQuestion } from '../types/satai';

const SataiAdmin: React.FC = () => {
  const {
    protocols,
    dossiers,
    saveProtocol,
    acceptDossier,
    rejectDossier,
  } = useSATAI();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'dossiers' | 'protocols'>('dashboard');
  const [selectedDossier, setSelectedDossier] = useState<SataiDossier | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<SataiProtocol | null>(null);
  const [newQuestionLabel, setNewQuestionLabel] = useState('');
  const [newQuestionType, setNewQuestionType] = useState<'text' | 'yes_no'>('text');

  const panel: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9',
    padding: '32px',
  };

  const card: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
  };

  // --- Handlers para Motor de Protocolos ---
  const handleAddQuestion = (protocol: SataiProtocol) => {
    if (!newQuestionLabel.trim()) return;

    const newQuestion: SataiProtocolQuestion = {
      id: `q_${Date.now()}`,
      label: newQuestionLabel,
      type: newQuestionType,
      required: false,
    };

    const updatedProtocol = {
      ...protocol,
      questions: [...protocol.questions, newQuestion],
    };

    saveProtocol(updatedProtocol);
    setSelectedProtocol(updatedProtocol);
    setNewQuestionLabel('');
  };

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{
            fontSize: '26px', fontWeight: 800, margin: '0 0 6px',
            background: 'linear-gradient(135deg, #6366f1, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            Central do Acolhimento & Triagem (SATAI)
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Painel Administrativo, Triagem por IA e Configuração de Protocolos
          </p>
        </div>
        <a
          href="/acolhimento"
          target="_blank"
          style={{
            padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, fontSize: '13px',
            textDecoration: 'none'
          }}
        >
          🚀 Novo Acolhimento Público
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
        {[
          { id: 'dashboard', label: 'Dashboard', icon: '📊' },
          { id: 'dossiers', label: 'Dossiês de Triagem', icon: '👥' },
          { id: 'protocols', label: 'Motor de Protocolos (No-Code)', icon: '⚙️' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            style={{
              padding: '9px 18px', borderRadius: '10px', border: '1px solid',
              borderColor: activeTab === t.id ? '#6366f1' : 'rgba(255,255,255,0.12)',
              background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? '#818cf8' : '#94a3b8',
              fontWeight: activeTab === t.id ? 700 : 400,
              fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 1. DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { label: 'Dossiês Totais', value: dossiers.length, color: '#6366f1', icon: '📁' },
              { label: 'Triagem Pendente', value: dossiers.filter(d => d.status === 'pending_review').length, color: '#f59e0b', icon: '⏳' },
              { label: 'Encaminhados (Aprovados)', value: dossiers.filter(d => d.status === 'accepted').length, color: '#10b981', icon: '✅' },
              { label: 'Protocolos Ativos', value: protocols.filter(p => p.active).length, color: '#8b5cf6', icon: '📄' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  fontSize: '24px', width: '50px', height: '50px', borderRadius: '12px',
                  background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {kpi.icon}
                </div>
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: kpi.color }}>{kpi.value}</div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>{kpi.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Demanda e Performance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>📊 Volume Geográfico & Demandas</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Ansiedade / Depressão', value: '45%' },
                  { label: 'Estresse Ocupacional', value: '25%' },
                  { label: 'Violência Doméstica', value: '18%' },
                  { label: 'Conflitos Familiares', value: '12%' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#6366f1' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700 }}>⏱️ Tempo de Resposta de Triagem</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Média Cadastro -> Triagem', value: '4.2 min' },
                  { label: 'Designação Profissional', value: '1.8 hrs' },
                  { label: 'Tempo Médio Início Atendimento', value: '24.5 hrs' },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>{item.label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#10b981' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. DOSSIÊS */}
      {activeTab === 'dossiers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Lista de Dossiês */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700 }}>Lista de Pacientes Triados</h3>
            {dossiers.map((d) => (
              <div
                key={d.id}
                onClick={() => setSelectedDossier(d)}
                style={{
                  ...card, cursor: 'pointer',
                  borderColor: selectedDossier?.id === d.id ? '#6366f1' : 'rgba(255,255,255,0.09)',
                  padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{d.beneficiaryName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {d.id} · Score IIP: {d.iipScore}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 700,
                  background: d.status === 'pending_review' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)',
                  color: d.status === 'pending_review' ? '#f59e0b' : '#10b981'
                }}>
                  {d.status === 'pending_review' ? 'Pendente' : 'Designado'}
                </span>
              </div>
            ))}
          </div>

          {/* Dossiê Detalhado */}
          {selectedDossier ? (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Dossiê Consolidado de Triagem</h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedDossier.id}</span>
              </div>

              {/* Informações Cadastrais */}
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: '#64748b' }}>DADOS CADASTRAIS (ARE)</span>
                <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>{selectedDossier.beneficiaryName}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                  Perfil: {selectedDossier.beneficiaryProfile} · Nível de Segurança: {selectedDossier.securityLevel}
                </div>
              </div>

              {/* Análise IA */}
              <div style={{ borderLeft: '3px solid #6366f1', paddingLeft: '14px', marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700 }}>🔍 ASSISTENTE IA: AVALIAÇÃO DE TRIAGEM</span>
                <p style={{ fontSize: '13px', color: '#e2e8f0', margin: '6px 0 0', lineHeight: 1.5 }}>
                  {selectedDossier.aiSummary}
                </p>
                {selectedDossier.aiInconsistencies.length > 0 && (
                  <div style={{ marginTop: '8px', color: '#f87171', fontSize: '12px' }}>
                    ⚠️ Inconsistências: {selectedDossier.aiInconsistencies.join(', ')}
                  </div>
                )}
              </div>

              {/* Fatores de Atenção */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '6px' }}>FATORES DE ATENÇÃO SINALIZADOS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedDossier.factorsOfAttention.map(f => (
                    <span key={f} style={{ fontSize: '11px', background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '3px 8px', borderRadius: '4px' }}>
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Ações de Designação */}
              {selectedDossier.status === 'pending_review' ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => acceptDossier(selectedDossier.id, 'prof-psi-01')}
                    style={{
                      flex: 1, padding: '10px', background: '#10b981', border: 'none',
                      borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Aceitar e Alocar Psicologia
                  </button>
                  <button
                    onClick={() => rejectDossier(selectedDossier.id)}
                    style={{
                      padding: '10px 14px', background: 'rgba(239,68,68,0.15)', border: 'none',
                      borderRadius: '6px', color: '#f87171', fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    Encaminhar Fila Social
                  </button>
                </div>
              ) : (
                <div style={{
                  padding: '12px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: '6px', color: '#10b981', fontSize: '13px', textAlign: 'center', fontWeight: 600
                }}>
                  ✓ Dossiê Aceito & Integrado ao Workflow
                </div>
              )}
            </div>
          ) : (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Selecione um dossiê para visualizar a avaliação.
            </div>
          )}
        </div>
      )}

      {/* 3. MOTOR DE PROTOCOLOS */}
      {activeTab === 'protocols' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Protocolos Cadastrados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 700 }}>Protocolos Institucionais</h3>
            {protocols.map((p) => (
              <div
                key={p.id}
                onClick={() => setSelectedProtocol(p)}
                style={{
                  ...card, cursor: 'pointer',
                  borderColor: selectedProtocol?.id === p.id ? '#6366f1' : 'rgba(255,255,255,0.09)',
                  padding: '16px'
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Perfil: {p.targetProfile} · {p.questions.length} perguntas
                </div>
              </div>
            ))}
          </div>

          {/* Edição / Criação No-Code */}
          {selectedProtocol ? (
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800 }}>
                Motor de Protocolos: {selectedProtocol.name}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>PERGUNTAS DO PROTOCOLO</span>
                {selectedProtocol.questions.map((q) => (
                  <div key={q.id} style={{
                    background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '6px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '13px' }}>{q.label}</span>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>
                      {q.type}
                    </span>
                  </div>
                ))}
              </div>

              {/* Criador de Novas Perguntas (No-code) */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '10px' }}>
                  ADICIONAR NOVA PERGUNTA AO BANCO
                </span>
                <input
                  type="text"
                  placeholder="Ex: Qual é a intensidade das dores físicas que sente?"
                  value={newQuestionLabel}
                  onChange={(e) => setNewQuestionLabel(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                    color: '#fff', fontSize: '13px', outline: 'none', marginBottom: '10px',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select
                    value={newQuestionType}
                    onChange={(e: any) => setNewQuestionType(e.target.value)}
                    style={{
                      flex: 1, padding: '10px', background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px',
                      color: '#fff', fontSize: '13px', outline: 'none'
                    }}
                  >
                    <option value="text">Texto livre</option>
                    <option value="yes_no">Sim / Não</option>
                  </select>
                  <button
                    onClick={() => handleAddQuestion(selectedProtocol)}
                    style={{
                      padding: '10px 20px', background: '#6366f1', border: 'none',
                      borderRadius: '6px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Inserir Pergunta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              Selecione um protocolo para gerenciar suas perguntas por metadados.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SataiAdmin;
