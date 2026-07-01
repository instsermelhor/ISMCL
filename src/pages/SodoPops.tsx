// ============================================================
// SODO — CENTRAL DE POPs + SANDBOX
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { useState } from 'react';
import { useSodo } from '../contexts/SodoContext';
import type { DocPOP, SandboxScenario } from '../types/sodo';

const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  clinica:       { label: 'Clínica', color: '#ec4899', icon: '🏥' },
  social:        { label: 'Social', color: '#22c55e', icon: '🤝' },
  administrativa:{ label: 'Administrativa', color: '#0ea5e9', icon: '📋' },
  seguranca:     { label: 'Segurança', color: '#ef4444', icon: '🔒' },
  financeira:    { label: 'Financeira', color: '#f59e0b', icon: '💰' },
  tecnologia:    { label: 'Tecnologia', color: '#6366f1', icon: '⚙️' },
};

const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  basico:        { label: 'Básico', color: '#22c55e' },
  intermediario: { label: 'Intermediário', color: '#f59e0b' },
  avancado:      { label: 'Avançado', color: '#ef4444' },
};

export default function SodoPops() {
  const { pops, sandboxScenarios, selectedPop, selectPop, togglePopChecklist, completeSandboxStep, resetScenario } = useSodo();
  const [activeTab, setActiveTab] = useState<'pops' | 'sandbox'>('pops');
  const [selectedScenario, setSelectedScenario] = useState<SandboxScenario | null>(null);

  // ─── Sandbox Viewer ────────────────────────────────────────
  if (activeTab === 'sandbox' && selectedScenario) {
    const scenario = sandboxScenarios.find(s => s.id === selectedScenario.id) || selectedScenario;
    const completedSteps = scenario.steps.filter(s => s.completed).length;
    const progress = Math.round((completedSteps / scenario.steps.length) * 100);
    const diff = DIFFICULTY_LABELS[scenario.difficulty];

    return (
      <div>
        <button onClick={() => setSelectedScenario(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginBottom: 20, fontSize: 14 }}>← Voltar ao Sandbox</button>
        <div style={{ background: 'linear-gradient(135deg, #0c1a2e, #0f172a)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ background: `${diff.color}22`, color: diff.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{diff.label}</span>
            <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>⏱ {scenario.estimatedMinutes} min</span>
            <span style={{ background: scenario.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(99,102,241,0.1)', color: scenario.status === 'completed' ? '#22c55e' : '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
              {scenario.status === 'completed' ? '✓ Concluído' : scenario.status === 'running' ? '▶ Em andamento' : '○ Aguardando'}
            </span>
          </div>
          <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 6px' }}>🧪 {scenario.title}</h1>
          <p style={{ color: '#94a3b8', margin: '0 0 8px', fontSize: 14 }}>{scenario.description}</p>
          <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px' }}>👤 Persona: <b style={{ color: '#a5b4fc' }}>{scenario.persona}</b></p>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: '#94a3b8' }}>
              <span>Progresso</span><span>{progress}% ({completedSteps}/{scenario.steps.length} etapas)</span>
            </div>
            <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: 6, height: 8 }}>
              <div style={{ background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 6, height: '100%', width: `${progress}%`, transition: 'width 0.4s' }} />
            </div>
          </div>
        </div>

        {scenario.status === 'completed' ? (
          <div style={{ background: 'rgba(34,197,94,0.08)', borderRadius: 16, padding: 40, border: '1px solid rgba(34,197,94,0.2)', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h2 style={{ color: '#22c55e', marginBottom: 8 }}>Cenário Concluído com Sucesso!</h2>
            <p style={{ color: '#64748b', marginBottom: 24 }}>Você completou todas as etapas da simulação. Nenhum dado real foi afetado.</p>
            <button onClick={() => resetScenario(scenario.id)} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: '10px 24px', color: '#a5b4fc', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>↺ Reiniciar Cenário</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {scenario.steps.map((step, i) => {
              const prevCompleted = i === 0 || scenario.steps[i - 1].completed;
              const isActive = prevCompleted && !step.completed;
              return (
                <div key={step.id} style={{ background: step.completed ? 'rgba(34,197,94,0.05)' : isActive ? 'rgba(99,102,241,0.08)' : 'rgba(15,23,42,0.5)', borderRadius: 12, padding: '18px 22px', border: `1px solid ${step.completed ? 'rgba(34,197,94,0.25)' : isActive ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.08)'}`, opacity: !prevCompleted && !step.completed ? 0.5 : 1, transition: 'all 0.3s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: step.completed ? '#22c55e22' : 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: step.completed ? '#22c55e' : '#6366f1', fontWeight: 700, border: `1px solid ${step.completed ? '#22c55e44' : 'rgba(99,102,241,0.3)'}` }}>
                          {step.completed ? '✓' : step.order}
                        </div>
                        <div style={{ color: step.completed ? '#94a3b8' : '#e2e8f0', fontWeight: 700, fontSize: 15 }}>{step.title}</div>
                        <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 6, fontSize: 11 }}>{step.module}</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 6px', lineHeight: 1.5, paddingLeft: 36 }}>{step.instruction}</p>
                      {step.hint && <p style={{ color: '#475569', fontSize: 12, margin: 0, paddingLeft: 36 }}>💡 {step.hint}</p>}
                    </div>
                    {isActive && !step.completed && (
                      <button onClick={() => completeSandboxStep(scenario.id, step.id)} style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 10, padding: '8px 16px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', marginLeft: 16, flexShrink: 0 }}>Confirmar ✓</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ─── POP Viewer ─────────────────────────────────────────────
  if (activeTab === 'pops' && selectedPop) {
    const cat = CATEGORY_META[selectedPop.category];
    const checkedCount = selectedPop.checklist.filter(c => c.completed).length;
    const progress = Math.round((checkedCount / selectedPop.checklist.length) * 100);
    return (
      <div>
        <button onClick={() => selectPop(null)} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontWeight: 600, marginBottom: 20, fontSize: 14 }}>← Voltar aos POPs</button>
        <div style={{ background: 'linear-gradient(135deg, #0c1a2e, #0f172a)', borderRadius: 16, padding: '28px 32px', marginBottom: 24, border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <span style={{ background: `${cat.color}22`, color: cat.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{cat.icon} {cat.label}</span>
            <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>⏱ ~{selectedPop.estimatedMinutes} min</span>
          </div>
          <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 700, marginBottom: 4 }}>{selectedPop.code} · v{selectedPop.currentVersion}</div>
          <h1 style={{ color: '#fff', fontSize: 22, margin: '0 0 16px' }}>{selectedPop.title}</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>{selectedPop.objective}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          <div>
            {/* Info blocks */}
            {[
              { title: '📌 Aplicação', content: selectedPop.application },
              { title: '⚙️ Pré-requisitos', content: selectedPop.prerequisites.map((p, i) => `${i + 1}. ${p}`).join('\n') },
              { title: '🔄 Procedimento', content: selectedPop.procedure.map((p, i) => `${i + 1}. ${p}`).join('\n') },
              { title: '⚠️ Prazos', content: selectedPop.deadlines },
              { title: '📊 Indicadores', content: selectedPop.indicators.map(p => `• ${p}`).join('\n') },
              { title: '🚨 Riscos e Contingências', content: selectedPop.risks.map(p => `• ${p}`).join('\n') },
              { title: '✨ Boas Práticas', content: selectedPop.bestPractices.map(p => `• ${p}`).join('\n') },
            ].map(block => (
              <div key={block.title} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 12, padding: '18px 22px', marginBottom: 14, border: '1px solid rgba(99,102,241,0.08)' }}>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 10px', fontSize: 15 }}>{block.title}</h3>
                <p style={{ color: '#94a3b8', margin: 0, lineHeight: 1.7, whiteSpace: 'pre-line', fontSize: 13 }}>{block.content}</p>
              </div>
            ))}
          </div>

          {/* Checklist */}
          <div>
            <div style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '20px', border: '1px solid rgba(99,102,241,0.15)', position: 'sticky', top: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: 15 }}>✅ Checklist de Execução</h3>
                <span style={{ color: '#6366f1', fontWeight: 700, fontSize: 13 }}>{checkedCount}/{selectedPop.checklist.length}</span>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 6, height: 6, marginBottom: 16 }}>
                <div style={{ background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 6, height: '100%', width: `${progress}%`, transition: 'width 0.3s' }} />
              </div>
              {selectedPop.checklist.map(item => (
                <label key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12, cursor: 'pointer' }}>
                  <div onClick={() => togglePopChecklist(selectedPop.id, item.id)} style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.completed ? '#22c55e' : 'rgba(99,102,241,0.4)'}`, background: item.completed ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1, transition: 'all 0.2s' }}>
                    {item.completed && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <span style={{ color: item.completed ? '#64748b' : '#e2e8f0', fontSize: 13, textDecoration: item.completed ? 'line-through' : 'none' }}>{item.text}</span>
                    {item.required && <div style={{ color: '#ef4444', fontSize: 10, marginTop: 1 }}>Obrigatório</div>}
                  </div>
                </label>
              ))}
              {progress === 100 && (
                <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 10, padding: '12px', textAlign: 'center', marginTop: 8 }}>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>🎉 Checklist Completo!</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Todos os itens foram verificados.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0c1a2e 0%, #0f172a 100%)', borderRadius: 20, padding: '32px 40px', marginBottom: 28, border: '1px solid rgba(99,102,241,0.2)' }}>
        <div style={{ fontSize: 12, color: '#6366f1', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>SODO · Procedimentos e Simulações</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 8px' }}>📋 Central de POPs e Sandbox</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Procedimentos Operacionais Padronizados com checklist interativo e ambiente de simulação sem risco para dados reais.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[{ id: 'pops', label: '📋 POPs' }, { id: 'sandbox', label: '🧪 Sandbox' }].map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id as 'pops' | 'sandbox'); setSelectedScenario(null); selectPop(null); }}
            style={{ background: activeTab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', border: 'none', borderRadius: 10, padding: '8px 22px', color: activeTab === t.id ? '#fff' : '#94a3b8', fontWeight: activeTab === t.id ? 700 : 500, cursor: 'pointer', fontSize: 13 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* POPs list */}
      {activeTab === 'pops' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
          {pops.map(pop => {
            const cat = CATEGORY_META[pop.category];
            const checkedCount = pop.checklist.filter(c => c.completed).length;
            const progress = Math.round((checkedCount / pop.checklist.length) * 100);
            return (
              <div key={pop.id} onClick={() => selectPop(pop.id)} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ background: `${cat.color}22`, color: cat.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{cat.icon} {cat.label}</span>
                  <span style={{ color: '#475569', fontSize: 11 }}>⏱ ~{pop.estimatedMinutes} min</span>
                </div>
                <div style={{ color: '#6366f1', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>{pop.code}</div>
                <h3 style={{ color: '#e2e8f0', margin: '0 0 8px', fontSize: 15, lineHeight: 1.3 }}>{pop.title}</h3>
                <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 14px', lineHeight: 1.5 }}>{pop.objective.substring(0, 100)}...</p>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569', marginBottom: 4 }}>
                    <span>Checklist: {checkedCount}/{pop.checklist.length}</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ background: 'rgba(99,102,241,0.1)', borderRadius: 4, height: 4 }}>
                    <div style={{ background: progress === 100 ? '#22c55e' : cat.color, borderRadius: 4, height: '100%', width: `${progress}%` }} />
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#475569' }}>v{pop.currentVersion} · {new Date(pop.updatedAt).toLocaleDateString('pt-BR')}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sandbox list */}
      {activeTab === 'sandbox' && (
        <>
          <div style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 12, padding: '12px 18px', marginBottom: 20, border: '1px solid rgba(245,158,11,0.2)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 18 }}>🧪</span>
            <div>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13 }}>Ambiente Sandbox — Seguro</div>
              <div style={{ color: '#78716c', fontSize: 12 }}>Todas as simulações são isoladas. Nenhum dado real é criado, alterado ou excluído durante o treinamento.</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
            {sandboxScenarios.map(scenario => {
              const diff = DIFFICULTY_LABELS[scenario.difficulty];
              const completedCount = scenario.steps.filter(s => s.completed).length;
              return (
                <div key={scenario.id} onClick={() => setSelectedScenario(scenario)} style={{ background: 'rgba(15,23,42,0.7)', borderRadius: 14, padding: '22px 24px', border: '1px solid rgba(99,102,241,0.1)', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = diff.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <span style={{ background: `${diff.color}22`, color: diff.color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{diff.label}</span>
                    <span style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', padding: '3px 10px', borderRadius: 20, fontSize: 11 }}>⏱ {scenario.estimatedMinutes} min</span>
                    {scenario.status === 'completed' && <span style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>✓ Concluído</span>}
                  </div>
                  <h3 style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px', fontSize: 15 }}>🧪 {scenario.title}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>{scenario.description.substring(0, 90)}...</p>
                  <div style={{ color: '#475569', fontSize: 12, marginBottom: 10 }}>👤 {scenario.persona}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                    <span>{scenario.steps.length} etapas</span>
                    <span>{completedCount}/{scenario.steps.length} concluídas</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
