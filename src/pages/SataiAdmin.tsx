import React, { useState, useMemo } from 'react';
import { useSATAI } from '../contexts/SATAIContext';
import type {
  SataiProtocol,
  SataiDossier,
  SataiProtocolQuestion,
  SataiProgram,
} from '../types/satai';

// ─────────────────────────────────────────
// ESTILOS BASE
// ─────────────────────────────────────────

const S = {
  panel: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: '#f1f5f9',
    padding: '32px',
  } as React.CSSProperties,
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: '16px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
  } as React.CSSProperties,
  cardRed: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.25)',
    borderRadius: '16px',
    padding: '24px',
  } as React.CSSProperties,
  btn: (color: string = '#6366f1') => ({
    padding: '8px 18px',
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'opacity .2s',
  } as React.CSSProperties),
  btnOutline: {
    padding: '8px 18px',
    background: 'transparent',
    color: '#94a3b8',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  select: {
    width: '100%',
    padding: '10px 14px',
    background: '#1e1e3a',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
  } as React.CSSProperties,
  badge: (color: string) => ({
    padding: '3px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 700,
    background: color,
    color: '#fff',
    display: 'inline-block',
  } as React.CSSProperties),
};

// ─────────────────────────────────────────
// BADGES
// ─────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, [string, string]> = {
    published: ['#22c55e', '✅ Publicado'],
    draft: ['#f59e0b', '📝 Rascunho'],
    archived: ['#64748b', '📦 Arquivado'],
    pending_review: ['#f59e0b', '⏳ Aguardando'],
    accepted: ['#22c55e', '✅ Aceito'],
    rejected: ['#ef4444', '❌ Rejeitado'],
    referred: ['#6366f1', '↗️ Encaminhado'],
    programa_social: ['#3b82f6', '🏛️ Programa Social'],
    projeto: ['#8b5cf6', '🚀 Projeto'],
    convenio: ['#06b6d4', '🤝 Convênio'],
    campanha: ['#f97316', '📢 Campanha'],
    iniciativa: ['#10b981', '💡 Iniciativa'],
    parceria: ['#ec4899', '🔗 Parceria'],
  };
  const [color, label] = map[status] || ['#475569', status];
  return <span style={S.badge(color)}>{label}</span>;
};

const PriorityBadge = ({ level }: { level: string }) => {
  const map: Record<string, [string, string]> = {
    critical: ['#ef4444', '🔴 Crítico'],
    high: ['#f97316', '🟠 Alto'],
    medium: ['#f59e0b', '🟡 Médio'],
    low: ['#22c55e', '🟢 Baixo'],
    minimal: ['#64748b', '⚪ Mínimo'],
  };
  const [color, label] = map[level] || ['#475569', level];
  return <span style={S.badge(color)}>{label}</span>;
};

// ─────────────────────────────────────────
// TABS
// ─────────────────────────────────────────

type Tab = 'dashboard' | 'dossiers' | 'protocols' | 'builder' | 'programs';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'dossiers', label: 'Dossiês', icon: '📋' },
  { id: 'protocols', label: 'Protocolos', icon: '📑' },
  { id: 'builder', label: 'Builder Visual', icon: '🛠️' },
  { id: 'programs', label: 'Programas & Convênios', icon: '🏛️' },
];

// ─────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────

const DashboardTab: React.FC = () => {
  const { protocols, dossiers, programs, auditLogs } = useSATAI();

  const stats = useMemo(() => ({
    totalProtocols: protocols.length,
    publishedProtocols: protocols.filter(p => p.status === 'published').length,
    draftProtocols: protocols.filter(p => p.status === 'draft').length,
    totalDossiers: dossiers.length,
    pendingDossiers: dossiers.filter(d => d.status === 'pending_review').length,
    criticalDossiers: dossiers.filter(d => d.priorityLevel === 'critical').length,
    totalPrograms: programs.length,
    activePrograms: programs.filter(p => p.active).length,
    totalBeneficiaries: programs.reduce((a, p) => a + p.beneficiaryCount, 0),
    totalSessions: protocols.reduce((a, p) => a + (p.stats?.totalSessions || 0), 0),
    criticalCases: protocols.reduce((a, p) => a + (p.stats?.criticalCasesIdentified || 0), 0),
  }), [protocols, dossiers, programs]);

  const KPI = ({ value, label, color, icon }: { value: string | number; label: string; color: string; icon: string }) => (
    <div style={{ ...S.card, textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: '32px', marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: 24 }}>Visão Geral da Plataforma</h2>

      {/* Alertas críticos */}
      {stats.criticalDossiers > 0 && (
        <div style={{ ...S.cardRed, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '24px' }}>🚨</span>
          <div>
            <strong style={{ color: '#ef4444' }}>{stats.criticalDossiers} dossiê(s) com prioridade crítica</strong>
            <div style={{ fontSize: '13px', color: '#fca5a5', marginTop: 4 }}>
              Requer revisão imediata da equipe técnica.
            </div>
          </div>
        </div>
      )}

      {/* KPIs Linha 1 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <KPI value={stats.publishedProtocols} label="Protocolos Publicados" color="#22c55e" icon="📑" />
        <KPI value={stats.draftProtocols} label="Em Rascunho" color="#f59e0b" icon="📝" />
        <KPI value={stats.pendingDossiers} label="Dossiês Pendentes" color="#f97316" icon="⏳" />
        <KPI value={stats.criticalDossiers} label="Casos Críticos" color="#ef4444" icon="🔴" />
      </div>

      {/* KPIs Linha 2 */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <KPI value={stats.activePrograms} label="Programas Ativos" color="#6366f1" icon="🏛️" />
        <KPI value={stats.totalBeneficiaries.toLocaleString('pt-BR')} label="Beneficiários Totais" color="#3b82f6" icon="👥" />
        <KPI value={stats.totalSessions.toLocaleString('pt-BR')} label="Sessões Realizadas" color="#8b5cf6" icon="📊" />
        <KPI value={stats.criticalCases} label="Casos Críticos Detectados" color="#ec4899" icon="⚠️" />
      </div>

      {/* Protocolos por uso */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={S.card}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Protocolos por Volume de Uso</h3>
          {protocols
            .filter(p => p.stats && p.stats.totalSessions > 0)
            .sort((a, b) => (b.stats?.totalSessions || 0) - (a.stats?.totalSessions || 0))
            .map(p => (
              <div key={p.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '13px' }}>{p.name}</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>{p.stats?.totalSessions} sessões</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, ((p.stats?.totalSessions || 0) / stats.totalSessions) * 100)}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    borderRadius: 999,
                  }} />
                </div>
              </div>
            ))}
        </div>

        <div style={S.card}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: 16 }}>Últimas Ações de Auditoria</h3>
          {auditLogs.slice(0, 5).map(log => (
            <div key={log.id} style={{
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', gap: 12, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: '18px' }}>
                {log.action.includes('published') ? '✅' :
                  log.action.includes('created') ? '➕' :
                    log.action.includes('accepted') ? '👍' :
                      log.action.includes('alert') ? '🚨' : '📝'}
              </span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600 }}>{log.entityName}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>{log.details}</div>
                <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
                  {new Date(log.performedAt).toLocaleString('pt-BR')} — {log.performedBy}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// DOSSIÊS
// ─────────────────────────────────────────

const DossiersTab: React.FC = () => {
  const { dossiers, protocols, programs, acceptDossier, rejectDossier, referDossier } = useSATAI();
  const [filter, setFilter] = useState<'all' | 'pending_review' | 'accepted' | 'rejected' | 'referred'>('all');
  const [selected, setSelected] = useState<SataiDossier | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = filter === 'all' ? dossiers : dossiers.filter(d => d.status === filter);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(['all', 'pending_review', 'accepted', 'rejected', 'referred'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              ...S.btnOutline,
              background: filter === f ? '#6366f1' : 'transparent',
              color: filter === f ? '#fff' : '#94a3b8',
            }}>
              {f === 'all' ? 'Todos' : f === 'pending_review' ? 'Pendentes' : f === 'accepted' ? 'Aceitos' : f === 'rejected' ? 'Rejeitados' : 'Encaminhados'}
            </button>
          ))}
        </div>

        {filtered.map(d => (
          <div key={d.id} onClick={() => { setSelected(d); setNotes(''); }} style={{
            ...S.card,
            marginBottom: 12,
            cursor: 'pointer',
            borderColor: selected?.id === d.id ? '#6366f1' : 'rgba(255,255,255,0.09)',
            transition: 'border-color .2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 700, fontSize: '15px' }}>{d.beneficiaryName}</span>
              <PriorityBadge level={d.priorityLevel} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
              <StatusBadge status={d.status} />
              <span style={S.badge('#334155')}>#{d.id}</span>
            </div>
            {d.aiRiskFlags && d.aiRiskFlags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {d.aiRiskFlags.map((f, i) => (
                  <span key={i} style={S.badge('#7f1d1d')}>⚠️ {f}</span>
                ))}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>
              {new Date(d.createdAt).toLocaleString('pt-BR')} • {d.protocolName}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Dossiê #{selected.id}</h3>
            <button onClick={() => setSelected(null)} style={S.btnOutline}>✕ Fechar</button>
          </div>

          {/* Beneficiário */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Beneficiário</h4>
            <div style={{ fontWeight: 700, fontSize: '17px' }}>{selected.beneficiaryName}</div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 4 }}>
              {selected.beneficiaryProfile} | IIP Score: <strong style={{ color: '#f59e0b' }}>{selected.iipScore}</strong>
            </div>
          </div>

          {/* Protocolo e Programas */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Protocolo Utilizado</h4>
            <div style={{ fontSize: '14px' }}>{selected.protocolName}</div>
            {selected.programIds.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {selected.programIds.map(pid => {
                  const prog = programs.find(p => p.id === pid);
                  return prog ? <span key={pid} style={S.badge('#1d4ed8')}>{prog.code}</span> : null;
                })}
              </div>
            )}
          </div>

          {/* Alertas */}
          {selected.aiRiskFlags && selected.aiRiskFlags.length > 0 && (
            <div style={{ ...S.cardRed, marginBottom: 16 }}>
              <h4 style={{ fontSize: '13px', color: '#ef4444', marginBottom: 8 }}>🚨 Alertas de Risco</h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {selected.aiRiskFlags.map((f, i) => <span key={i} style={S.badge('#7f1d1d')}>{f}</span>)}
              </div>
            </div>
          )}

          {/* IA */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>🤖 Síntese IA</h4>
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#cbd5e1' }}>{selected.aiSummary}</p>
          </div>

          {selected.factorsOfAttention.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Fatores de Atenção</h4>
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {selected.factorsOfAttention.map((f, i) => (
                  <li key={i} style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: 4 }}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Ações */}
          {selected.status === 'pending_review' && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Ações</h4>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observações (opcional)..."
                style={{ ...S.input, height: 80, resize: 'vertical', marginBottom: 12 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  style={S.btn('#22c55e')}
                  onClick={() => { acceptDossier(selected.id, 'prof-001', notes); setSelected(null); }}
                >✅ Aceitar</button>
                <button
                  style={S.btn('#6366f1')}
                  onClick={() => { referDossier(selected.id, 'prof-002', 'acolhimento-inicial', notes); setSelected(null); }}
                >↗️ Encaminhar</button>
                <button
                  style={S.btn('#ef4444')}
                  onClick={() => { rejectDossier(selected.id, notes); setSelected(null); }}
                >❌ Rejeitar</button>
              </div>
            </div>
          )}

          {selected.status !== 'pending_review' && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              <StatusBadge status={selected.status} />
              {selected.reviewedBy && (
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: 8 }}>
                  Revisado por {selected.reviewedBy} em {selected.reviewedAt ? new Date(selected.reviewedAt).toLocaleString('pt-BR') : '-'}
                </div>
              )}
              {selected.referralNotes && (
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: 8 }}>📝 {selected.referralNotes}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// LISTA DE PROTOCOLOS
// ─────────────────────────────────────────

const ProtocolsTab: React.FC<{ onEdit: (p: SataiProtocol) => void }> = ({ onEdit }) => {
  const { protocols, programs, publishProtocol, archiveProtocol, cloneProtocol, deleteProtocolDraft, createProtocol } = useSATAI();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [showPublishModal, setShowPublishModal] = useState<string | null>(null);
  const [changelog, setChangelog] = useState('');

  const filtered = protocols.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar protocolo..."
          style={{ ...S.input, maxWidth: 280 }}
        />
        {(['all', 'draft', 'published', 'archived'] as const).map(f => (
          <button key={f} onClick={() => setStatusFilter(f)} style={{
            ...S.btnOutline,
            background: statusFilter === f ? '#6366f1' : 'transparent',
            color: statusFilter === f ? '#fff' : '#94a3b8',
          }}>
            {f === 'all' ? 'Todos' : f === 'draft' ? '📝 Rascunho' : f === 'published' ? '✅ Publicados' : '📦 Arquivados'}
          </button>
        ))}
        <button
          style={{ ...S.btn('#6366f1'), marginLeft: 'auto' }}
          onClick={() => {
            const p = createProtocol('Novo Protocolo', 'all', []);
            onEdit(p);
          }}
        >+ Novo Protocolo</button>
      </div>

      {filtered.map(p => {
        const linkedProgs = programs.filter(pr => p.programIds.includes(pr.id));
        return (
          <div key={p.id} style={{ ...S.card, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>{p.code} • v{p.version} • {p.questions.length} perguntas</div>
              </div>
              <StatusBadge status={p.status} />
            </div>

            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 10, lineHeight: 1.5 }}>{p.description}</p>

            {linkedProgs.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {linkedProgs.map(pr => <span key={pr.id} style={S.badge('#1d4ed8')}>{pr.code}</span>)}
              </div>
            )}

            {p.stats && (
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                {[
                  { label: 'Sessões', value: p.stats.totalSessions },
                  { label: 'Completas', value: p.stats.completedSessions },
                  { label: 'Críticos', value: p.stats.criticalCasesIdentified },
                  { label: 'Score Médio', value: `${p.stats.averageScore.toFixed(1)}%` },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '18px', color: '#6366f1' }}>{s.value}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={S.btn('#334155')} onClick={() => onEdit(p)}>✏️ Editar</button>
              <button style={S.btn('#1e40af')} onClick={() => cloneProtocol(p.id)}>📋 Clonar</button>
              {p.status === 'draft' && (
                <>
                  <button
                    style={S.btn('#22c55e')}
                    onClick={() => { setShowPublishModal(p.id); setChangelog(''); }}
                  >🚀 Publicar</button>
                  <button style={S.btn('#ef4444')} onClick={() => deleteProtocolDraft(p.id)}>🗑️ Excluir</button>
                </>
              )}
              {p.status === 'published' && (
                <button style={S.btn('#64748b')} onClick={() => archiveProtocol(p.id)}>📦 Arquivar</button>
              )}
            </div>

            {/* Histórico de versões */}
            {p.versionHistory.length > 0 && (
              <details style={{ marginTop: 12 }}>
                <summary style={{ cursor: 'pointer', fontSize: '13px', color: '#94a3b8' }}>
                  🕐 Histórico de versões ({p.versionHistory.length})
                </summary>
                <div style={{ marginTop: 8 }}>
                  {p.versionHistory.map((v, i) => (
                    <div key={i} style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.03)',
                      borderRadius: 8,
                      marginBottom: 6,
                      borderLeft: '3px solid #6366f1',
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                        <strong style={{ fontSize: '13px' }}>v{v.version}</strong>
                        <StatusBadge status={v.status} />
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {v.publishedAt ? new Date(v.publishedAt).toLocaleDateString('pt-BR') : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{v.changelog}</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginTop: 2 }}>
                        {v.publishedBy || '—'} | {v.questionSnapshot.length} perguntas
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        );
      })}

      {/* Modal de Publicação */}
      {showPublishModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ ...S.card, maxWidth: 480, width: '90%' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: 16 }}>🚀 Publicar Protocolo</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 12 }}>
              Descreva as mudanças realizadas nesta versão (changelog):
            </p>
            <textarea
              value={changelog}
              onChange={e => setChangelog(e.target.value)}
              placeholder="Ex: Adicionadas perguntas sobre situação familiar. Revisão linguística..."
              style={{ ...S.input, height: 100, resize: 'vertical', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={S.btn('#22c55e')}
                onClick={() => {
                  if (showPublishModal) {
                    publishProtocol(showPublishModal, changelog || 'Sem descrição de mudanças.');
                    setShowPublishModal(null);
                  }
                }}
              >✅ Confirmar Publicação</button>
              <button style={S.btnOutline} onClick={() => setShowPublishModal(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// BUILDER VISUAL DE PROTOCOLOS
// ─────────────────────────────────────────

const BuilderTab: React.FC<{ editingProtocol: SataiProtocol | null; onSave: () => void }> = ({ editingProtocol, onSave }) => {
  const { saveProtocol } = useSATAI();
  const [protocol, setProtocol] = useState<SataiProtocol | null>(editingProtocol);
  const [newQ, setNewQ] = useState({ label: '', type: 'text' as SataiProtocolQuestion['type'], required: true, section: '' });
  const [editingQ, setEditingQ] = useState<string | null>(null);

  React.useEffect(() => {
    setProtocol(editingProtocol);
  }, [editingProtocol]);

  if (!protocol) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        <div style={{ fontSize: '48px', marginBottom: 16 }}>🛠️</div>
        <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: 8 }}>Nenhum Protocolo Selecionado</h3>
        <p style={{ fontSize: '14px' }}>Vá para a aba Protocolos e clique em "Editar" para abrir um protocolo no builder.</p>
      </div>
    );
  }

  const updateField = (field: keyof SataiProtocol, value: unknown) => {
    setProtocol(p => p ? { ...p, [field]: value } : null);
  };

  const addQuestion = () => {
    if (!newQ.label.trim()) return;
    const q: SataiProtocolQuestion = {
      id: `q_${Date.now()}`,
      label: newQ.label,
      type: newQ.type,
      required: newQ.required,
      section: newQ.section,
      order: (protocol.questions.length + 1),
    };
    setProtocol(p => p ? { ...p, questions: [...p.questions, q] } : null);
    setNewQ({ label: '', type: 'text', required: true, section: '' });
  };

  const removeQuestion = (qId: string) => {
    setProtocol(p => p ? { ...p, questions: p.questions.filter(q => q.id !== qId) } : null);
  };

  const moveQuestion = (qId: string, dir: 'up' | 'down') => {
    setProtocol(p => {
      if (!p) return null;
      const idx = p.questions.findIndex(q => q.id === qId);
      if (dir === 'up' && idx === 0) return p;
      if (dir === 'down' && idx === p.questions.length - 1) return p;
      const qs = [...p.questions];
      const target = dir === 'up' ? idx - 1 : idx + 1;
      [qs[idx], qs[target]] = [qs[target], qs[idx]];
      return { ...p, questions: qs.map((q, i) => ({ ...q, order: i + 1 })) };
    });
  };

  const handleSave = () => {
    if (protocol) {
      saveProtocol(protocol);
      onSave();
    }
  };

  const QUESTION_TYPES: { value: SataiProtocolQuestion['type']; label: string }[] = [
    { value: 'text', label: 'Texto curto' },
    { value: 'textarea', label: 'Texto longo' },
    { value: 'radio', label: 'Seleção única' },
    { value: 'checkbox', label: 'Múltipla escolha' },
    { value: 'yes_no', label: 'Sim / Não' },
    { value: 'scale', label: 'Escala numérica' },
    { value: 'date', label: 'Data' },
    { value: 'number', label: 'Número' },
    { value: 'select', label: 'Select / Dropdown' },
    { value: 'rating', label: 'Avaliação por estrelas' },
    { value: 'file_upload', label: 'Upload de arquivo' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
      {/* Coluna esquerda: formulário de configuração */}
      <div>
        <div style={S.card}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: 20 }}>⚙️ Configurações do Protocolo</h3>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Nome</label>
            <input value={protocol.name} onChange={e => updateField('name', e.target.value)} style={S.input} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Código</label>
            <input value={protocol.code} onChange={e => updateField('code', e.target.value)} style={S.input} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Descrição</label>
            <textarea value={protocol.description} onChange={e => updateField('description', e.target.value)}
              style={{ ...S.input, height: 80, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Objetivo</label>
            <textarea value={protocol.objective} onChange={e => updateField('objective', e.target.value)}
              style={{ ...S.input, height: 60, resize: 'vertical' }} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Público-Alvo</label>
            <select value={protocol.targetProfile} onChange={e => updateField('targetProfile', e.target.value)} style={S.select}>
              <option value="all">Todos</option>
              <option value="adult">Adulto Geral</option>
              <option value="woman">Mulher</option>
              <option value="man">Homem</option>
              <option value="minor">Menor de Idade</option>
              <option value="elderly">Idoso</option>
              <option value="teenager">Adolescente</option>
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Setor Responsável</label>
            <input value={protocol.sector} onChange={e => updateField('sector', e.target.value)} style={S.input} />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Duração Estimada (min)</label>
            <input type="number" value={protocol.estimatedDurationMin}
              onChange={e => updateField('estimatedDurationMin', Number(e.target.value))} style={S.input} />
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={protocol.requiresProfessionalReview}
                onChange={e => updateField('requiresProfessionalReview', e.target.checked)} />
              Requer revisão profissional
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px' }}>
              <input type="checkbox" checked={protocol.lgpdSensitiveData}
                onChange={e => updateField('lgpdSensitiveData', e.target.checked)} />
              Dados sensíveis (LGPD)
            </label>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: 6 }}>Base Legal</label>
            <input value={protocol.legalBasis || ''} onChange={e => updateField('legalBasis', e.target.value)} style={S.input} />
          </div>

          <button style={{ ...S.btn('#22c55e'), width: '100%' }} onClick={handleSave}>
            💾 Salvar Protocolo
          </button>
        </div>

        {/* Adicionar Pergunta */}
        <div style={{ ...S.card, marginTop: 16 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: 16 }}>➕ Adicionar Pergunta</h3>
          <div style={{ marginBottom: 10 }}>
            <input value={newQ.label} onChange={e => setNewQ(n => ({ ...n, label: e.target.value }))}
              placeholder="Texto da pergunta..." style={S.input} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <select value={newQ.type} onChange={e => setNewQ(n => ({ ...n, type: e.target.value as SataiProtocolQuestion['type'] }))} style={S.select}>
              {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input value={newQ.section} onChange={e => setNewQ(n => ({ ...n, section: e.target.value }))}
              placeholder="Seção (ex: Saúde Mental)" style={S.input} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '13px', marginBottom: 10 }}>
            <input type="checkbox" checked={newQ.required} onChange={e => setNewQ(n => ({ ...n, required: e.target.checked }))} />
            Pergunta obrigatória
          </label>
          <button style={{ ...S.btn('#6366f1'), width: '100%' }} onClick={addQuestion}>
            Adicionar Pergunta
          </button>
        </div>
      </div>

      {/* Coluna direita: lista de perguntas + preview */}
      <div>
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600 }}>
              📋 Perguntas ({protocol.questions.length})
            </h3>
            <span style={{ fontSize: '13px', color: '#64748b' }}>
              ≈ {protocol.estimatedDurationMin} min
            </span>
          </div>

          {protocol.questions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#475569' }}>
              <div style={{ fontSize: '32px', marginBottom: 8 }}>📝</div>
              <p>Nenhuma pergunta adicionada ainda.</p>
            </div>
          )}

          {protocol.questions.map((q, idx) => (
            <div key={q.id} style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: 10,
              marginBottom: 8,
              border: editingQ === q.id ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>#{idx + 1}</span>
                    {q.section && <span style={S.badge('#1e3a5f')}>{q.section}</span>}
                    <span style={S.badge('#334155')}>{QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type}</span>
                    {q.required && <span style={S.badge('#7c2d12')}>Obrigatório</span>}
                    {q.showIf && <span style={S.badge('#1e3a8a')}>Condicional</span>}
                  </div>
                  <div style={{ fontSize: '14px', color: '#e2e8f0' }}>{q.label}</div>
                  {q.options && (
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: 4 }}>
                      {q.options.length} opções
                      {q.options.some(o => o.triggerAlert) && (
                        <span style={{ color: '#ef4444', marginLeft: 8 }}>⚠️ com alertas</span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button style={{ ...S.btnOutline, padding: '4px 8px' }} onClick={() => moveQuestion(q.id, 'up')}>↑</button>
                  <button style={{ ...S.btnOutline, padding: '4px 8px' }} onClick={() => moveQuestion(q.id, 'down')}>↓</button>
                  <button style={{ ...S.btn('#ef4444'), padding: '4px 8px' }} onClick={() => removeQuestion(q.id)}>✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────
// PROGRAMAS & CONVÊNIOS
// ─────────────────────────────────────────

const ProgramsTab: React.FC = () => {
  const { programs, protocols, saveProgram, createProgram, linkProtocolToProgram, unlinkProtocolFromProgram } = useSATAI();
  const [selected, setSelected] = useState<SataiProgram | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newProg, setNewProg] = useState({ name: '', code: '', type: 'programa_social' as SataiProgram['type'] });

  const PROG_TYPES: { value: SataiProgram['type']; label: string }[] = [
    { value: 'programa_social', label: '🏛️ Programa Social' },
    { value: 'projeto', label: '🚀 Projeto' },
    { value: 'convenio', label: '🤝 Convênio' },
    { value: 'campanha', label: '📢 Campanha' },
    { value: 'iniciativa', label: '💡 Iniciativa' },
    { value: 'parceria', label: '🔗 Parceria' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 24 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Programas Cadastrados</h3>
          <button style={S.btn('#6366f1')} onClick={() => setShowCreate(true)}>+ Novo</button>
        </div>

        {showCreate && (
          <div style={{ ...S.card, marginBottom: 16, borderColor: '#6366f1' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12 }}>Novo Programa / Convênio</h4>
            <input value={newProg.name} onChange={e => setNewProg(n => ({ ...n, name: e.target.value }))}
              placeholder="Nome..." style={{ ...S.input, marginBottom: 8 }} />
            <input value={newProg.code} onChange={e => setNewProg(n => ({ ...n, code: e.target.value }))}
              placeholder="Código (ex: PAIF)..." style={{ ...S.input, marginBottom: 8 }} />
            <select value={newProg.type} onChange={e => setNewProg(n => ({ ...n, type: e.target.value as SataiProgram['type'] }))}
              style={{ ...S.select, marginBottom: 12 }}>
              {PROG_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={S.btn('#22c55e')} onClick={() => {
                if (newProg.name && newProg.code) {
                  const p = createProgram(newProg.name, newProg.code, newProg.type);
                  setSelected(p);
                  setNewProg({ name: '', code: '', type: 'programa_social' });
                  setShowCreate(false);
                }
              }}>Criar</button>
              <button style={S.btnOutline} onClick={() => setShowCreate(false)}>Cancelar</button>
            </div>
          </div>
        )}

        {programs.map(prog => (
          <div key={prog.id} onClick={() => setSelected(prog)} style={{
            ...S.card,
            marginBottom: 10,
            cursor: 'pointer',
            borderColor: selected?.id === prog.id ? '#6366f1' : 'rgba(255,255,255,0.09)',
            transition: 'border-color .2s',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{prog.name}</span>
              <span style={S.badge(prog.active ? '#166534' : '#4b5563')}>
                {prog.active ? '✅ Ativo' : '⏸️ Inativo'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={S.badge('#1e3a8a')}>{prog.code}</span>
              <StatusBadge status={prog.type} />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              {prog.beneficiaryCount.toLocaleString('pt-BR')} beneficiários •
              {prog.linkedProtocolIds.length} protocolo(s)
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{selected.name}</h3>
            <button onClick={() => setSelected(null)} style={S.btnOutline}>✕</button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <span style={S.badge('#1e3a8a')}>{selected.code}</span>
              <StatusBadge status={selected.type} />
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 6 }}>
              <strong>Público-alvo:</strong> {selected.targetAudience || '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 6 }}>
              <strong>Parceiro:</strong> {selected.partnerOrg || '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 6 }}>
              <strong>Base Legal:</strong> {selected.legalBasis || '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 6 }}>
              <strong>Início:</strong> {selected.startDate} {selected.endDate ? `→ ${selected.endDate}` : '(Indeterminado)'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              <strong>Beneficiários:</strong> {selected.beneficiaryCount.toLocaleString('pt-BR')}
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
              📑 Protocolos Vinculados
            </h4>
            {protocols.map(p => {
              const linked = selected.linkedProtocolIds.includes(p.id);
              return (
                <div key={p.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{p.code} • v{p.version}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatusBadge status={p.status} />
                    {linked ? (
                      <button
                        style={S.btn('#ef4444')}
                        onClick={() => {
                          unlinkProtocolFromProgram(p.id, selected.id);
                          setSelected(prev => prev ? { ...prev, linkedProtocolIds: prev.linkedProtocolIds.filter(id => id !== p.id) } : null);
                        }}
                      >Desvincular</button>
                    ) : (
                      <button
                        style={S.btn('#22c55e')}
                        onClick={() => {
                          linkProtocolToProgram(p.id, selected.id);
                          setSelected(prev => prev ? { ...prev, linkedProtocolIds: [...prev.linkedProtocolIds, p.id] } : null);
                        }}
                      >Vincular</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              style={{ ...S.btn(selected.active ? '#64748b' : '#22c55e'), width: '100%' }}
              onClick={() => {
                const updated = { ...selected, active: !selected.active };
                saveProgram(updated);
                setSelected(updated);
              }}
            >
              {selected.active ? '⏸️ Desativar Programa' : '▶️ Ativar Programa'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────
// PÁGINA PRINCIPAL DO SATAI ADMIN
// ─────────────────────────────────────────

const SataiAdmin: React.FC = () => {
  const { protocols, dossiers, programs } = useSATAI();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [builderProtocol, setBuilderProtocol] = useState<SataiProtocol | null>(null);

  const pendingCount = dossiers.filter(d => d.status === 'pending_review').length;
  const criticalCount = dossiers.filter(d => d.priorityLevel === 'critical' && d.status === 'pending_review').length;
  const draftCount = protocols.filter(p => p.status === 'draft').length;

  const handleEditProtocol = (p: SataiProtocol) => {
    setBuilderProtocol(p);
    setActiveTab('builder');
  };

  return (
    <div style={S.panel}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, margin: 0, background: 'linear-gradient(90deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            SATAI — Central de Acolhimento
          </h1>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: 6 }}>
            Plataforma Configurável de Protocolos Institucionais • Instituto Ser Melhor
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {criticalCount > 0 && (
            <div style={{ ...S.badge('#ef4444'), padding: '8px 14px', fontSize: '13px' }}>
              🚨 {criticalCount} CRÍTICO{criticalCount > 1 ? 'S' : ''}
            </div>
          )}
          <div style={{ textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
            <div>{protocols.filter(p => p.status === 'published').length} protocolos publicados</div>
            <div>{programs.filter(p => p.active).length} programas ativos</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 20px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === tab.id ? '#a78bfa' : '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? 700 : 400,
              fontFamily: 'inherit',
              transition: 'color .2s',
              position: 'relative',
            }}
          >
            {tab.icon} {tab.label}
            {tab.id === 'dossiers' && pendingCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 4,
                background: '#f59e0b', color: '#000', borderRadius: '50%',
                width: 16, height: 16, fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{pendingCount}</span>
            )}
            {tab.id === 'protocols' && draftCount > 0 && (
              <span style={{
                position: 'absolute', top: 6, right: 4,
                background: '#6366f1', color: '#fff', borderRadius: '50%',
                width: 16, height: 16, fontSize: '10px', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{draftCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {activeTab === 'dashboard' && <DashboardTab />}
      {activeTab === 'dossiers' && <DossiersTab />}
      {activeTab === 'protocols' && <ProtocolsTab onEdit={handleEditProtocol} />}
      {activeTab === 'builder' && (
        <BuilderTab
          editingProtocol={builderProtocol}
          onSave={() => setActiveTab('protocols')}
        />
      )}
      {activeTab === 'programs' && <ProgramsTab />}
    </div>
  );
};

export default SataiAdmin;
