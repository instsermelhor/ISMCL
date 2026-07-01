// ============================================================
// SODO — CENTRO DE GOVERNANÇA DO CONHECIMENTO
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { useState } from 'react';
import { useSodo } from '../contexts/SodoContext';

const STATUS_META: Record<string, { label: string; color: string }> = {
  rascunho:   { label: 'Rascunho', color: '#94a3b8' },
  em_revisao: { label: 'Em Revisão', color: '#f59e0b' },
  aprovado:   { label: 'Aprovado', color: '#0ea5e9' },
  publicado:  { label: 'Publicado', color: '#22c55e' },
  arquivado:  { label: 'Arquivado', color: '#64748b' },
  obsoleto:   { label: 'Obsoleto', color: '#ef4444' },
};

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  criacao:       { label: 'Criação', icon: '✏️', color: '#6366f1' },
  revisao:       { label: 'Revisão', icon: '🔍', color: '#f59e0b' },
  aprovacao:     { label: 'Aprovação', icon: '✅', color: '#0ea5e9' },
  publicacao:    { label: 'Publicação', icon: '📤', color: '#22c55e' },
  arquivamento:  { label: 'Arquivamento', icon: '🗄️', color: '#64748b' },
  obsolescencia: { label: 'Obsolescência', icon: '⛔', color: '#ef4444' },
};

const CLASSIFICATION_META: Record<string, { label: string; color: string }> = {
  publico:               { label: 'Público', color: '#22c55e' },
  uso_interno:           { label: 'Uso Interno', color: '#0ea5e9' },
  restrito:              { label: 'Restrito', color: '#f59e0b' },
  confidencial:          { label: 'Confidencial', color: '#f97316' },
  altamente_confidencial:{ label: 'Alt. Confidencial', color: '#ef4444' },
  sigilo_especial:       { label: 'Sigilo Especial', color: '#7c3aed' },
};

export default function SodoAdmin() {
  const { articles, governanceLog, biMetrics, publishDocument, archiveDocument } = useSodo();
  const [activeTab, setActiveTab] = useState<'documentos' | 'ciclo' | 'bi' | 'versionamento'>('documentos');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [confirmAction, setConfirmAction] = useState<{ type: 'publish' | 'archive'; articleId: string; title: string } | null>(null);

  const filteredArticles = filterStatus === 'todos' ? articles : articles.filter(a => a.status === filterStatus);

  function handleConfirm() {
    if (!confirmAction) return;
    if (confirmAction.type === 'publish') publishDocument(confirmAction.articleId);
    else archiveDocument(confirmAction.articleId);
    setConfirmAction(null);
  }

  return (
    <div>
      {/* Confirmation Modal */}
      {confirmAction && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#0f172a', border: `1px solid ${confirmAction.type === 'publish' ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`, borderRadius: 20, padding: 32, width: 420, maxWidth: '90vw' }}>
            <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>{confirmAction.type === 'publish' ? '📤' : '🗄️'}</div>
            <h2 style={{ color: '#e2e8f0', textAlign: 'center', marginBottom: 8 }}>{confirmAction.type === 'publish' ? 'Publicar Documento' : 'Arquivar Documento'}</h2>
            <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>
              {confirmAction.type === 'publish' ? 'O documento será tornado público para os usuários autorizados.' : 'O documento será arquivado e ficará indisponível para consulta.'}<br />
              <b style={{ color: '#e2e8f0' }}>{confirmAction.title}</b>
            </p>
            <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>Esta ação será registrada no Histórico de Governança.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmAction(null)} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
              <button onClick={handleConfirm} style={{ flex: 1, background: confirmAction.type === 'publish' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #64748b, #475569)', border: 'none', borderRadius: 12, padding: '12px', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                {confirmAction.type === 'publish' ? 'Publicar' : 'Arquivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0f172a 100%)', borderRadius: 20, padding: '32px 40px', marginBottom: 28, border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>SODO · Governança</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>🏛️ Centro de Governança do Conhecimento</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 20px' }}>Controle do ciclo de vida documental, versionamento, conformidade e rastreabilidade completa.</p>
        <div style={{ display: 'flex', gap: 20 }}>
          {[
            { label: 'Total de Documentos', val: articles.length, color: '#6366f1' },
            { label: 'Publicados', val: articles.filter(a => a.status === 'publicado').length, color: '#22c55e' },
            { label: 'Em Revisão', val: articles.filter(a => a.status === 'em_revisao').length, color: '#f59e0b' },
            { label: 'Arquivados', val: articles.filter(a => a.status === 'arquivado').length, color: '#64748b' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ color: m.color, fontWeight: 800, fontSize: 24 }}>{m.val}</div>
              <div style={{ color: '#64748b', fontSize: 12 }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'documentos', label: '📄 Documentos' },
          { id: 'ciclo', label: '🔄 Histórico' },
          { id: 'versionamento', label: '🏷️ Versionamento' },
          { id: 'bi', label: '📊 BI' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
            style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', border: 'none', borderRadius: 10, padding: '8px 18px', color: activeTab === t.id ? '#fff' : '#94a3b8', fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Documents Tab */}
      {activeTab === 'documentos' && (
        <>
          {/* Filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {['todos', 'rascunho', 'em_revisao', 'aprovado', 'publicado', 'arquivado'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                style={{ background: filterStatus === s ? 'rgba(99,102,241,0.2)' : 'rgba(15,23,42,0.7)', border: `1px solid ${filterStatus === s ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.1)'}`, borderRadius: 8, padding: '5px 14px', color: filterStatus === s ? '#a5b4fc' : '#64748b', cursor: 'pointer', fontSize: 12, fontWeight: filterStatus === s ? 700 : 400 }}>
                {s === 'todos' ? 'Todos' : STATUS_META[s]?.label || s}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredArticles.map(a => {
              const st = STATUS_META[a.status];
              const cl = CLASSIFICATION_META[a.classification];
              return (
                <div key={a.id} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 12 }}>{a.code}</span>
                      <span style={{ background: `${st.color}22`, color: st.color, padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>{st.label}</span>
                      <span style={{ background: `${cl.color}22`, color: cl.color, padding: '2px 8px', borderRadius: 6, fontSize: 10 }}>🔐 {cl.label}</span>
                    </div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{a.title}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#475569' }}>
                      <span>v{a.currentVersion}</span>
                      <span>✍️ {a.author}</span>
                      <span>📅 {new Date(a.updatedAt).toLocaleDateString('pt-BR')}</span>
                      {a.validUntil && <span>⏰ Válido até {new Date(a.validUntil).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {a.status !== 'publicado' && a.status !== 'arquivado' && (
                      <button onClick={() => setConfirmAction({ type: 'publish', articleId: a.id, title: a.title })}
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '6px 12px', color: '#22c55e', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>📤 Publicar</button>
                    )}
                    {a.status !== 'arquivado' && (
                      <button onClick={() => setConfirmAction({ type: 'archive', articleId: a.id, title: a.title })}
                        style={{ background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 8, padding: '6px 12px', color: '#64748b', cursor: 'pointer', fontSize: 12 }}>🗄️ Arquivar</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Governance History */}
      {activeTab === 'ciclo' && (
        <div>
          <h2 style={{ color: '#e2e8f0', fontSize: 18, marginBottom: 20 }}>📜 Histórico de Governança</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {governanceLog.map(log => {
              const action = ACTION_META[log.action];
              return (
                <div key={log.id} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '16px 20px', border: `1px solid ${action.color}22`, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${action.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{action.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ color: action.color, fontWeight: 700, fontSize: 12 }}>{action.label}</span>
                      <span style={{ color: '#6366f1', fontSize: 12, fontWeight: 700 }}>{log.documentCode}</span>
                      {log.fromVersion && log.toVersion && <span style={{ color: '#64748b', fontSize: 11 }}>v{log.fromVersion} → v{log.toVersion}</span>}
                      {!log.fromVersion && log.toVersion && <span style={{ color: '#64748b', fontSize: 11 }}>v{log.toVersion}</span>}
                    </div>
                    <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{log.documentTitle}</div>
                    {log.notes && <div style={{ color: '#94a3b8', fontSize: 13 }}>{log.notes}</div>}
                    <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>👤 {log.performedBy} · {new Date(log.performedAt).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Versioning Policy */}
      {activeTab === 'versionamento' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[
            {
              title: '📋 Política de Versionamento',
              items: [
                { label: 'Versão Major (X.0.0)', desc: 'Reestruturação completa do conteúdo ou mudança de escopo significativa.' },
                { label: 'Versão Minor (1.X.0)', desc: 'Adição de novos capítulos, seções ou atualização de fluxos.' },
                { label: 'Versão Patch (1.1.X)', desc: 'Correções textuais, ajustes menores e atualizações de dados.' },
              ],
            },
            {
              title: '🔄 Ciclo de Vida Documental',
              items: [
                { label: '✏️ Rascunho', desc: 'Documento em elaboração. Visível apenas para o autor.' },
                { label: '🔍 Em Revisão', desc: 'Submetido ao revisor designado para validação técnica.' },
                { label: '✅ Aprovado', desc: 'Aprovado pelo gestor responsável. Pronto para publicação.' },
                { label: '📤 Publicado', desc: 'Disponível para todos os perfis autorizados.' },
                { label: '🗄️ Arquivado', desc: 'Indisponível para consulta. Histórico preservado.' },
                { label: '⛔ Obsoleto', desc: 'Substituído por versão mais recente. Mantido por 24 meses.' },
              ],
            },
            {
              title: '📅 Prazos de Revisão',
              items: [
                { label: 'Documentos Clínicos', desc: 'Revisão obrigatória a cada 12 meses ou com mudança normativa.' },
                { label: 'Documentos Jurídicos', desc: 'Revisão a cada 6 meses ou com nova legislação aplicável.' },
                { label: 'Manuais Operacionais', desc: 'Revisão a cada 24 meses ou com atualização de módulo.' },
                { label: 'POPs', desc: 'Revisão a cada 12 meses ou após incidentes de processo.' },
                { label: 'Políticas Institucionais', desc: 'Revisão anual com aprovação da Diretoria Executiva.' },
              ],
            },
            {
              title: '👥 Responsabilidades',
              items: [
                { label: 'Autor', desc: 'Elabora o documento, mantém o conteúdo atualizado.' },
                { label: 'Revisor', desc: 'Valida técnica e linguisticamente o conteúdo.' },
                { label: 'Aprovador', desc: 'Autoriza formalmente a publicação e assume responsabilidade.' },
                { label: 'DPO', desc: 'Valida conformidade LGPD de todos os documentos publicados.' },
                { label: 'Centro de Governança', desc: 'Monitora ciclo de vida, alertas de vencimento e conformidade.' },
              ],
            },
          ].map(panel => (
            <div key={panel.title} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <h3 style={{ color: '#e2e8f0', margin: '0 0 16px', fontSize: 16 }}>{panel.title}</h3>
              {panel.items.map(item => (
                <div key={item.label} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                  <div style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 13, marginBottom: 3 }}>{item.label}</div>
                  <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* BI */}
      {activeTab === 'bi' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
            {[
              { label: 'Certificados Emitidos', val: biMetrics.totalCertificatesIssued, icon: '🏆', color: '#f59e0b' },
              { label: 'Cursos Concluídos', val: biMetrics.totalCoursesCompleted, icon: '✅', color: '#22c55e' },
              { label: 'Taxa de Aprovação', val: `${biMetrics.averagePassRate}%`, icon: '🎯', color: '#6366f1' },
              { label: 'Alunos Ativos (mês)', val: biMetrics.activeLearnersThisMonth, icon: '👥', color: '#0ea5e9' },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px', border: `1px solid ${m.color}22` }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ color: m.color, fontWeight: 800, fontSize: 26 }}>{m.val}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{m.label}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: 24, border: '1px solid rgba(99,102,241,0.1)' }}>
            <h3 style={{ color: '#e2e8f0', marginTop: 0, marginBottom: 16 }}>📊 Status do Acervo Documental</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const count = articles.filter(a => a.status === key).length;
                const pct = articles.length > 0 ? Math.round((count / articles.length) * 100) : 0;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 80, color: '#94a3b8', fontSize: 12 }}>{meta.label}</div>
                    <div style={{ flex: 1, background: 'rgba(99,102,241,0.1)', borderRadius: 6, height: 10 }}>
                      <div style={{ background: meta.color, borderRadius: 6, height: '100%', width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ width: 30, color: '#64748b', fontSize: 12, textAlign: 'right' }}>{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
