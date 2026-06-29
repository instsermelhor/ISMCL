import React, { useState } from 'react';
import {
  mockBeneficiaries,
  adaptiveQuestions,
  vulnerabilityIndicators,
  triageQuestions,
} from '../data/adaptive-registration-mock';
import type { RegisteredBeneficiary } from '../types/adaptive-registration';

// ============================================================
// Helpers de UI
// ============================================================

const statusColor: Record<string, string> = {
  in_progress: '#6366f1',
  pending_documents: '#f59e0b',
  pending_review: '#3b82f6',
  approved: '#10b981',
  rejected: '#ef4444',
};

const statusLabel: Record<string, string> = {
  in_progress: 'Em andamento',
  pending_documents: 'Aguard. documentos',
  pending_review: 'Em análise',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
};

const priorityLabel: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  regular: 'Regular',
};

const priorityColor: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  regular: '#22c55e',
};

const securityLabel: Record<string, string> = {
  standard: 'Padrão',
  elevated: 'Elevado',
  special: 'Especial',
  maximum: 'Máximo',
};

const securityColor: Record<string, string> = {
  standard: '#64748b',
  elevated: '#f59e0b',
  special: '#8b5cf6',
  maximum: '#ef4444',
};

// ============================================================
// Painel Admin
// ============================================================

type Tab = 'dashboard' | 'beneficiaries' | 'questions' | 'vulnerability' | 'triage';

const AdaptiveRegistrationAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<RegisteredBeneficiary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const panel: React.CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9',
    padding: '32px',
  };

  const card: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
  };

  // ---- Métricas ----
  const total = mockBeneficiaries.length;
  const critical = mockBeneficiaries.filter((b) => b.priorityLevel === 'critical').length;
  const pendingDocs = mockBeneficiaries.filter((b) => b.registrationStatus === 'pending_documents').length;
  const vaultEnabled = mockBeneficiaries.filter((b) => b.hasDigitalVault).length;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'beneficiaries', label: 'Beneficiários', icon: '👥' },
    { id: 'questions', label: 'Perguntas', icon: '📝' },
    { id: 'vulnerability', label: 'Vulnerabilidade', icon: '🛡️' },
    { id: 'triage', label: 'Triagem', icon: '🩺' },
  ];

  const filteredBeneficiaries = mockBeneficiaries.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={panel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 6px', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Central do Cadastro Adaptativo
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Administração do ARE — Adaptive Registration Engine
          </p>
        </div>
        <a
          href="/registro"
          target="_blank"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '10px',
            color: '#fff', fontWeight: 700, fontSize: '13px',
            textDecoration: 'none',
          }}
        >
          🔗 Abrir Formulário Público
        </a>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '9px 18px',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: activeTab === t.id ? '#6366f1' : 'rgba(255,255,255,0.12)',
              background: activeTab === t.id ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              color: activeTab === t.id ? '#818cf8' : '#94a3b8',
              fontWeight: activeTab === t.id ? 700 : 400,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ---- DASHBOARD ---- */}
      {activeTab === 'dashboard' && (
        <div>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            {[
              { label: 'Total Cadastros', value: total, icon: '📋', color: '#6366f1' },
              { label: 'Prioridade Crítica', value: critical, icon: '🚨', color: '#ef4444' },
              { label: 'Aguard. Documentos', value: pendingDocs, icon: '📎', color: '#f59e0b' },
              { label: 'Cofre Digital Ativo', value: vaultEnabled, icon: '🔒', color: '#10b981' },
            ].map((kpi) => (
              <div key={kpi.label} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  fontSize: '28px', width: '54px', height: '54px', borderRadius: '12px',
                  background: `${kpi.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
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

          {/* Distribuição de Prioridade */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
                📊 Distribuição por Prioridade
              </h3>
              {(['critical', 'high', 'regular'] as const).map((level) => {
                const count = mockBeneficiaries.filter((b) => b.priorityLevel === level).length;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={level} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{priorityLabel[level]}</span>
                      <span style={{ fontSize: '13px', color: priorityColor[level], fontWeight: 700 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: priorityColor[level], borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>
                🔐 Distribuição por Nível de Segurança
              </h3>
              {(['special', 'elevated', 'standard'] as const).map((level) => {
                const count = mockBeneficiaries.filter((b) => b.securityLevel === level).length;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={level} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{securityLabel[level]}</span>
                      <span style={{ fontSize: '13px', color: securityColor[level], fontWeight: 700 }}>{count} ({pct}%)</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: securityColor[level], borderRadius: '3px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ---- BENEFICIÁRIOS ---- */}
      {activeTab === 'beneficiaries' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', maxWidth: '380px', padding: '10px 16px',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '10px', color: '#f1f5f9', fontSize: '14px', outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredBeneficiaries.map((b) => (
              <div
                key={b.id}
                onClick={() => setSelectedBeneficiary(b)}
                style={{
                  ...card,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '20px',
                  transition: 'border-color 0.2s',
                  borderColor: selectedBeneficiary?.id === b.id ? '#6366f1' : 'rgba(255,255,255,0.09)',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${priorityColor[b.priorityLevel]}, ${securityColor[b.securityLevel]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '18px', color: '#fff',
                }}>
                  {b.name.charAt(0)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: '#e2e8f0', marginBottom: '4px' }}>
                    {b.name} {b.socialName && b.socialName !== b.name && (
                      <span style={{ color: '#64748b', fontWeight: 400, fontSize: '13px' }}>
                        ({b.socialName})
                      </span>
                    )}
                    {b.hasDigitalVault && (
                      <span style={{ marginLeft: '8px', fontSize: '13px' }}>🔒</span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {b.id} · CPF: {b.cpf}
                    {b.institution && ` · ${b.institution}`}
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: `${priorityColor[b.priorityLevel]}22`, color: priorityColor[b.priorityLevel],
                  }}>
                    {priorityLabel[b.priorityLevel]}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: `${statusColor[b.registrationStatus]}22`, color: statusColor[b.registrationStatus],
                  }}>
                    {statusLabel[b.registrationStatus]}
                  </span>
                  <span style={{
                    padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                    background: 'rgba(255,255,255,0.06)', color: '#94a3b8',
                  }}>
                    IIP: {b.iipScore}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Detalhes do beneficiário selecionado */}
          {selectedBeneficiary && (
            <div style={{ ...card, marginTop: '24px', borderColor: '#6366f1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#e2e8f0' }}>
                  Perfil: {selectedBeneficiary.name}
                </h3>
                <button
                  onClick={() => setSelectedBeneficiary(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '20px' }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {[
                  { label: 'Perfil', value: selectedBeneficiary.profile === 'security_forces' ? '🫡 Segurança Pública' : selectedBeneficiary.profile === 'minor' ? '👦 Menor' : '👤 Civil' },
                  { label: 'IIP Score', value: `${selectedBeneficiary.iipScore}/100` },
                  { label: 'Prioridade', value: priorityLabel[selectedBeneficiary.priorityLevel] },
                  { label: 'Segurança', value: securityLabel[selectedBeneficiary.securityLevel] },
                  { label: 'Status', value: statusLabel[selectedBeneficiary.registrationStatus] },
                  { label: 'Cofre Digital', value: selectedBeneficiary.hasDigitalVault ? '🔒 Ativo' : '— Inativo' },
                  { label: 'Cadastro', value: new Date(selectedBeneficiary.createdAt).toLocaleDateString('pt-BR') },
                  { label: 'Motivos', value: selectedBeneficiary.attendanceMotives.join(', ') },
                ].map((item) => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '14px',
                  }}>
                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- PERGUNTAS ---- */}
      {activeTab === 'questions' && (
        <div>
          <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', fontSize: '13px', color: '#818cf8' }}>
            💡 As perguntas abaixo são orientadas por metadados. Novos fluxos podem ser adicionados sem alteração no código — apenas atualize o arquivo de configuração ou use a API de perguntas.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {adaptiveQuestions.map((q) => (
              <div key={q.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                  background: 'rgba(99,102,241,0.15)', borderRadius: '8px', padding: '6px 12px',
                  fontSize: '11px', fontWeight: 700, color: '#818cf8', flexShrink: 0, marginTop: '2px',
                }}>
                  Etapa {q.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0', marginBottom: '4px' }}>
                    {q.label}
                    {q.required && <span style={{ color: '#f87171', marginLeft: '4px', fontSize: '12px' }}>*</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>
                      {q.type}
                    </span>
                    {q.showIf && (
                      <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 8px', borderRadius: '4px' }}>
                        condicional
                      </span>
                    )}
                    {q.triggersAction && q.triggersAction.length > 0 && (
                      <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.12)', color: '#10b981', padding: '2px 8px', borderRadius: '4px' }}>
                        {q.triggersAction.length} ação(ões) automática(s)
                      </span>
                    )}
                    {q.options && (
                      <span style={{ fontSize: '11px', background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px' }}>
                        {q.options.length} opções
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: q.required ? '#10b981' : '#64748b', flexShrink: 0 }}>
                  {q.required ? '● Obrigatório' : '○ Opcional'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- VULNERABILIDADE ---- */}
      {activeTab === 'vulnerability' && (
        <div>
          <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', fontSize: '13px', color: '#818cf8' }}>
            🛡️ Indicadores de vulnerabilidade contribuem automaticamente para o cálculo do IIP. Pesos podem ser ajustados pelo Super Administrador.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {vulnerabilityIndicators.map((vi) => (
              <div key={vi.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  background: vi.active ? '#10b981' : '#64748b',
                }} />
                <div style={{ flex: 1, fontWeight: 500, fontSize: '14px', color: '#e2e8f0' }}>
                  {vi.label}
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                  background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                }}>
                  +{vi.iipWeight} IIP
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: vi.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                  color: vi.active ? '#10b981' : '#64748b',
                }}>
                  {vi.active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- TRIAGEM ---- */}
      {activeTab === 'triage' && (
        <div>
          <div style={{ marginBottom: '16px', padding: '14px 18px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', fontSize: '13px', color: '#f87171' }}>
            🩺 Perguntas de triagem de saúde mental. Aquelas marcadas como "prioridade crítica automática" elevam o caso imediatamente ao nível Crítico, independente do score IIP total.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {triageQuestions.map((tq) => (
              <div key={tq.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0,
                  background: tq.active ? '#10b981' : '#64748b',
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: '#e2e8f0' }}>{tq.label}</div>
                  {tq.triggersCritical && (
                    <div style={{ fontSize: '11px', color: '#f87171', marginTop: '4px' }}>
                      ⚡ Eleva para prioridade CRÍTICA automaticamente
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                  background: 'rgba(239,68,68,0.12)', color: '#f87171',
                }}>
                  +{tq.iipWeight} IIP
                </div>
                <div style={{
                  padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                  background: tq.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)',
                  color: tq.active ? '#10b981' : '#64748b',
                }}>
                  {tq.active ? 'Ativo' : 'Inativo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdaptiveRegistrationAdmin;
