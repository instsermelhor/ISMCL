// ============================================================
// PLATFORM HEALTH & AUDIT CENTER — PAGE
// Instituto Ser Melhor — Plataforma Integrada (Projeto Aura)
// ============================================================

import React, { useState } from 'react';
import { usePlatformHealth } from '../contexts/PlatformHealthContext';
import type { PlatformHealthTab, ReportType, BackupType, ComplianceLevel, LoadTestResult } from '../types/platform-health';

// ─── Color helpers ───────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  online: '#22c55e', degraded: '#f59e0b', offline: '#ef4444', maintenance: '#6366f1',
  synced: '#22c55e', partial: '#f59e0b', error: '#ef4444', pending: '#6b7280',
  passed: '#22c55e', failed: '#ef4444', running: '#3b82f6', idle: '#6b7280', completed: '#22c55e', warning: '#f59e0b',
  success: '#22c55e', scheduled: '#6366f1',
  open: '#ef4444', acknowledged: '#f59e0b', resolved: '#22c55e',
  atendido: '#22c55e', parcial: '#f59e0b', pendente: '#ef4444', nao_aplicavel: '#6b7280',
  critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6', info: '#6b7280',
  ok: '#22c55e', timeout: '#ef4444',
  ready: '#22c55e', generating: '#3b82f6',
};

const COMPLIANCE_LABEL: Record<ComplianceLevel, string> = {
  atendido: 'Atendido', parcial: 'Parcial', pendente: 'Pendente', nao_aplicavel: 'N/A',
};

const REPORT_LABELS: Record<ReportType, string> = {
  executive: 'Relatório Executivo', technical: 'Relatório Técnico', security: 'Relatório de Segurança',
  integrations: 'Relatório de Integrações', performance: 'Relatório de Desempenho', apis: 'Relatório de APIs',
  database: 'Relatório de Banco de Dados', workflows: 'Relatório de Workflows', accessibility: 'Relatório de Acessibilidade',
  compliance: 'Relatório de Compliance', corrections: 'Plano de Correções', certification: 'Certificado de Prontidão',
};

function Badge({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ background: color + '22', color, border: `1px solid ${color}55`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </span>
  );
}

function MetricCard({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div style={{ background: '#1e293b', borderRadius: 12, padding: '16px 20px', flex: 1, minWidth: 140, border: '1px solid #334155' }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: color || '#f8fafc' }}>
        {value}<span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

function Gauge({ value, max, label, color }: { value: number; max: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
        <span>{label}</span><span style={{ fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: '#334155', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 20px 0' }}>
      <span style={{ fontSize: 22 }}>{icon}</span> {title}
    </h2>
  );
}

// ─── Tab: Observability ─────────────────────────────────────
function TabObservability() {
  const { modules, healthMetrics, securityAlerts, traceLogs, acknowledgeAlert } = usePlatformHealth();
  const latest = healthMetrics[healthMetrics.length - 1];
  const onlineCount = modules.filter((m) => m.status === 'online').length;
  const avgUptime = Math.round(modules.reduce((acc, m) => acc + m.uptime, 0) / modules.length * 100) / 100;
  const avgLatency = Math.round(modules.reduce((acc, m) => acc + m.responseTimeMs, 0) / modules.length);
  const openAlerts = securityAlerts.filter((a) => a.status === 'open' || a.status === 'acknowledged').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MetricCard label="Módulos Online" value={`${onlineCount}/${modules.length}`} color="#22c55e" />
        <MetricCard label="Uptime Médio" value={avgUptime} unit="%" color="#22c55e" />
        <MetricCard label="Latência Média" value={avgLatency} unit="ms" color={avgLatency > 200 ? '#f59e0b' : '#22c55e'} />
        <MetricCard label="CPU" value={latest.cpuPercent.toFixed(0)} unit="%" color={latest.cpuPercent > 80 ? '#ef4444' : '#22c55e'} />
        <MetricCard label="Memória" value={latest.memoryPercent.toFixed(0)} unit="%" color={latest.memoryPercent > 75 ? '#f59e0b' : '#22c55e'} />
        <MetricCard label="Usuários Ativos" value={latest.activeUsers} />
        <MetricCard label="Alertas Abertos" value={openAlerts} color={openAlerts > 0 ? '#f59e0b' : '#22c55e'} />
      </div>

      {/* Resource Gauges */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 }}>Recursos do Sistema (Tempo Real)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Gauge label="CPU" value={latest.cpuPercent} max={100} color={latest.cpuPercent > 80 ? '#ef4444' : '#22c55e'} />
          <Gauge label="Memória" value={latest.memoryPercent} max={100} color={latest.memoryPercent > 80 ? '#ef4444' : '#3b82f6'} />
          <Gauge label={`Conexões DB (${latest.dbConnectionsActive}/${latest.dbConnectionsMax})`} value={latest.dbConnectionsActive} max={latest.dbConnectionsMax} color="#a78bfa" />
          <Gauge label={`Taxa de Erro (${latest.errorRate.toFixed(2)}%)`} value={latest.errorRate} max={5} color={latest.errorRate > 1 ? '#ef4444' : '#22c55e'} />
        </div>
      </div>

      {/* Module Status Table */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Status dos Módulos</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#64748b', borderBottom: '1px solid #334155' }}>
                {['Módulo', 'Status', 'Versão', 'Uptime', 'Latência', 'Taxa de Erro', 'APIs'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #1e293b80' }}>
                  <td style={{ padding: '10px 12px', color: '#f8fafc', fontWeight: 600 }}>{m.code}</td>
                  <td style={{ padding: '10px 12px' }}><Badge color={STATUS_COLOR[m.status]} label={m.status} /></td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{m.version}</td>
                  <td style={{ padding: '10px 12px', color: m.uptime >= 99.9 ? '#22c55e' : '#f59e0b', fontWeight: 700 }}>{m.uptime}%</td>
                  <td style={{ padding: '10px 12px', color: m.responseTimeMs > 300 ? '#f59e0b' : '#94a3b8' }}>{m.responseTimeMs}ms</td>
                  <td style={{ padding: '10px 12px', color: m.errorRate > 0.5 ? '#ef4444' : '#94a3b8' }}>{m.errorRate}%</td>
                  <td style={{ padding: '10px 12px', color: '#94a3b8' }}>{m.apis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trace Logs */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Tracing Distribuído</h3>
        <div style={{ fontFamily: 'monospace', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {traceLogs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: '#0f172a', borderRadius: 8, borderLeft: `3px solid ${STATUS_COLOR[log.status]}` }}>
              <span style={{ color: '#64748b', minWidth: 100 }}>{log.startTime.slice(11, 23)}</span>
              <span style={{ color: '#a78bfa', minWidth: 80 }}>[{log.service}]</span>
              <span style={{ color: log.parentSpanId ? '#94a3b8' : '#f8fafc', paddingLeft: log.parentSpanId ? 24 : 0 }}>{log.operation}</span>
              <span style={{ marginLeft: 'auto', color: '#64748b' }}>{log.durationMs}ms</span>
              <Badge color={STATUS_COLOR[log.status]} label={log.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Security Alerts */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Alertas de Segurança e Plataforma</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {securityAlerts.map((alert) => (
            <div key={alert.id} style={{ background: '#0f172a', borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${STATUS_COLOR[alert.severity]}`, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                  <Badge color={STATUS_COLOR[alert.severity]} label={alert.severity} />
                  <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>{alert.title}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{alert.description}</div>
                {alert.resolution && <div style={{ color: '#22c55e', fontSize: 12, marginTop: 6 }}>✓ {alert.resolution}</div>}
                <div style={{ color: '#475569', fontSize: 11, marginTop: 6 }}>{alert.timestamp}</div>
              </div>
              {alert.status === 'open' && (
                <button onClick={() => acknowledgeAlert(alert.id)} style={{ background: '#f59e0b20', color: '#f59e0b', border: '1px solid #f59e0b44', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
                  Confirmar
                </button>
              )}
              <Badge color={STATUS_COLOR[alert.status]} label={alert.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: E2E Journeys ──────────────────────────────────────
function TabE2E() {
  const { journeys, isRunningJourney, activeJourneyId, runJourney, resetJourney } = usePlatformHealth();

  const PRIORITY_COLOR: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {journeys.map((journey) => (
        <div key={journey.id} style={{ background: '#1e293b', borderRadius: 14, padding: '22px 26px', border: `1px solid ${journey.status === 'failed' ? '#ef444444' : '#334155'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <Badge color={PRIORITY_COLOR[journey.priority]} label={journey.priority} />
                <Badge color={STATUS_COLOR[journey.status]} label={journey.status} />
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>{journey.name}</h3>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>👤 {journey.persona}</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>{journey.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {journey.status !== 'idle' && (
                <button onClick={() => resetJourney(journey.id)} disabled={isRunningJourney} style={{ background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }}>
                  Resetar
                </button>
              )}
              <button
                onClick={() => runJourney(journey.id)}
                disabled={isRunningJourney}
                style={{ background: isRunningJourney ? '#334155' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: isRunningJourney ? '#64748b' : '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: isRunningJourney ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                {activeJourneyId === journey.id ? '▶ Executando...' : '▶ Executar'}
              </button>
            </div>
          </div>

          {/* Progress metrics */}
          {journey.lastRunAt && (
            <div style={{ display: 'flex', gap: 20, marginBottom: 16, fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Duração: <span style={{ color: '#f8fafc', fontWeight: 700 }}>{journey.totalDurationMs?.toLocaleString('pt-BR')}ms</span></span>
              <span style={{ color: '#64748b' }}>Taxa de sucesso: <span style={{ color: journey.passRate === 100 ? '#22c55e' : '#ef4444', fontWeight: 700 }}>{journey.passRate}%</span></span>
              <span style={{ color: '#64748b' }}>Executado em: <span style={{ color: '#94a3b8' }}>{journey.lastRunAt.slice(11, 19)}</span></span>
            </div>
          )}

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {journey.steps.map((step, idx) => (
              <div key={step.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '10px 14px', background: '#0f172a', borderRadius: 10, borderLeft: `3px solid ${STATUS_COLOR[step.status]}` }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#475569', minWidth: 24 }}>{idx + 1}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>{step.name}</span>
                    <Badge color="#a78bfa" label={step.module} />
                    {step.durationMs && <span style={{ fontSize: 11, color: '#64748b' }}>{step.durationMs}ms</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{step.action}</div>
                  {step.error && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠ {step.error}</div>}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {step.assertions.map((a, i) => (
                      <span key={i} style={{ fontSize: 10, background: '#1e293b', color: '#64748b', borderRadius: 4, padding: '2px 6px', border: '1px solid #334155' }}>✓ {a}</span>
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 18 }}>
                  {step.status === 'passed' ? '✅' : step.status === 'failed' ? '❌' : step.status === 'running' ? '🔄' : '⏳'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Inventory & Integrations ─────────────────────────
function TabInventory() {
  const { modules, integrations } = usePlatformHealth();
  const totalComponents = modules.reduce((a, m) => a + m.components, 0);
  const totalApis = modules.reduce((a, m) => a + m.apis, 0);
  const syncedInt = integrations.filter((i) => i.status === 'synced').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MetricCard label="Total de Módulos" value={modules.length} />
        <MetricCard label="Total de Componentes" value={totalComponents} />
        <MetricCard label="Total de APIs" value={totalApis} />
        <MetricCard label="Integrações" value={integrations.length} />
        <MetricCard label="Integrações OK" value={`${syncedInt}/${integrations.length}`} color="#22c55e" />
      </div>

      {/* Integration Map */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Mapa de Integrações</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {integrations.map((int) => (
            <div key={int.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#0f172a', borderRadius: 10, fontSize: 13 }}>
              <span style={{ color: '#a78bfa', fontWeight: 700, minWidth: 80 }}>{int.sourceModule}</span>
              <span style={{ color: '#475569', fontSize: 16 }}>{int.dataFlow === 'bidirectional' ? '⇄' : '→'}</span>
              <span style={{ color: '#a78bfa', fontWeight: 700, minWidth: 80 }}>{int.targetModule}</span>
              <span style={{ color: '#64748b', fontSize: 11, flex: 1 }}>{int.protocol} · {int.type}</span>
              <span style={{ color: '#64748b', fontSize: 11 }}>{int.latencyMs}ms</span>
              <Badge color={STATUS_COLOR[int.status]} label={int.status} />
              {int.errorMessage && <span title={int.errorMessage} style={{ cursor: 'help', color: '#f59e0b' }}>⚠</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Module Details */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Inventário de Módulos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
          {modules.map((m) => (
            <div key={m.id} style={{ background: '#0f172a', borderRadius: 12, padding: '16px 18px', border: `1px solid ${STATUS_COLOR[m.status]}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: '#f8fafc', fontSize: 14 }}>{m.code}</span>
                <Badge color={STATUS_COLOR[m.status]} label={m.status} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>{m.description}</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#94a3b8' }}>
                <span>v{m.version}</span>
                <span>{m.components} componentes</span>
                <span>{m.apis} APIs</span>
              </div>
              {m.dependencies.length > 0 && (
                <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>
                  Dependências: {m.dependencies.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Compliance & Permissions ─────────────────────────
function TabCompliance() {
  const { complianceItems, permissionAudit } = usePlatformHealth();
  const counts = { atendido: 0, parcial: 0, pendente: 0, nao_aplicavel: 0 };
  complianceItems.forEach((c) => { counts[c.level]++; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {(Object.entries(counts) as [ComplianceLevel, number][]).map(([k, v]) => (
          <MetricCard key={k} label={COMPLIANCE_LABEL[k]} value={v} color={STATUS_COLOR[k]} />
        ))}
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Matriz de Conformidade Legal</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complianceItems.map((item) => (
            <div key={item.id} style={{ background: '#0f172a', borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${STATUS_COLOR[item.level]}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <Badge color="#6366f1" label={item.framework} />
                {item.article && <span style={{ fontSize: 11, color: '#64748b' }}>{item.article}</span>}
                <Badge color={STATUS_COLOR[item.level]} label={COMPLIANCE_LABEL[item.level]} />
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{item.requirement}</span>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{item.description}</div>
              {item.evidence && <div style={{ fontSize: 11, color: '#22c55e', marginTop: 6 }}>📄 {item.evidence}</div>}
              {item.notes && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>📌 {item.notes}</div>}
              <div style={{ fontSize: 11, color: '#475569', marginTop: 6 }}>Responsável: {item.responsible}{item.dueDate ? ` · Prazo: ${item.dueDate}` : ''}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Auditoria de Permissões (RBAC/ABAC)</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {permissionAudit.map((item) => (
            <div key={item.id} style={{ background: '#0f172a', borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${item.hasExcessiveAccess ? '#ef4444' : '#22c55e'}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <Badge color="#a78bfa" label={item.role} />
                <Badge color="#6366f1" label={item.module} />
                {item.hasExcessiveAccess && <Badge color="#ef4444" label="Permissão Excessiva" />}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                Permissões: {item.permissions.join(', ')}
              </div>
              {item.findings.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: item.hasExcessiveAccess ? '#ef4444' : '#22c55e', marginTop: 2 }}>
                  {item.hasExcessiveAccess ? '⚠' : '✓'} {f}
                </div>
              ))}
              {item.recommendation && <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 6 }}>💡 {item.recommendation}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Load & Resilience ─────────────────────────────────
function TabLoad() {
  const { loadTests, resilienceTests, backups, isRunningLoadTest, runLoadTest, triggerBackup } = usePlatformHealth();
  const [selectedUsers, setSelectedUsers] = useState(1000);
  const userOptions = [100, 500, 1000, 5000, 10000];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Load Test Panel */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '22px 26px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Simulador de Carga</h3>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
          {userOptions.map((u) => (
            <button key={u} onClick={() => setSelectedUsers(u)} style={{ background: selectedUsers === u ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#334155', color: selectedUsers === u ? '#fff' : '#94a3b8', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {u.toLocaleString('pt-BR')} usuários
            </button>
          ))}
          <button onClick={() => runLoadTest(selectedUsers)} disabled={isRunningLoadTest} style={{ background: isRunningLoadTest ? '#334155' : '#22c55e20', color: isRunningLoadTest ? '#64748b' : '#22c55e', border: `1px solid ${isRunningLoadTest ? '#334155' : '#22c55e55'}`, borderRadius: 8, padding: '8px 20px', cursor: isRunningLoadTest ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700 }}>
            {isRunningLoadTest ? '⏳ Executando...' : '▶ Iniciar Teste'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {loadTests.map((lt: LoadTestResult) => (
            <div key={lt.id} style={{ background: '#0f172a', borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${STATUS_COLOR[lt.status]}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                <Badge color={STATUS_COLOR[lt.status]} label={lt.status} />
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{lt.name}</span>
                <span style={{ color: '#475569', fontSize: 11, marginLeft: 'auto' }}>{lt.executedAt.slice(11, 19)}</span>
              </div>
              {lt.dataPoints[0] && (
                <div style={{ display: 'flex', gap: 20, fontSize: 12, color: '#94a3b8', flexWrap: 'wrap' }}>
                  <span>Média: <strong style={{ color: '#f8fafc' }}>{lt.dataPoints[0].avgResponseMs}ms</strong></span>
                  <span>P95: <strong style={{ color: '#f8fafc' }}>{lt.dataPoints[0].p95ResponseMs}ms</strong></span>
                  <span>P99: <strong style={{ color: lt.dataPoints[0].p99ResponseMs > 2000 ? '#ef4444' : '#f8fafc' }}>{lt.dataPoints[0].p99ResponseMs}ms</strong></span>
                  <span>CPU: <strong style={{ color: lt.dataPoints[0].cpuPercent > 85 ? '#ef4444' : '#f8fafc' }}>{lt.dataPoints[0].cpuPercent}%</strong></span>
                  <span>Erros: <strong style={{ color: lt.dataPoints[0].errorRate > 1 ? '#ef4444' : '#22c55e' }}>{lt.dataPoints[0].errorRate}%</strong></span>
                </div>
              )}
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>{lt.conclusion}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Resilience Tests */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Testes de Resiliência e Recuperação</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {resilienceTests.map((t) => (
            <div key={t.id} style={{ background: '#0f172a', borderRadius: 10, padding: '14px 18px', borderLeft: `4px solid ${STATUS_COLOR[t.status]}` }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
                <Badge color={STATUS_COLOR[t.status]} label={t.status} />
                <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 13 }}>{t.scenario}</span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t.simulatedFailure}</div>
              <div style={{ display: 'flex', gap: 20, fontSize: 12 }}>
                <span style={{ color: '#94a3b8' }}>Recuperação: <strong style={{ color: '#22c55e' }}>{t.recoveryTimeSeconds}s</strong></span>
                <span style={{ color: '#94a3b8' }}>Perda de dados: <strong style={{ color: t.dataLossMinutes === 0 ? '#22c55e' : '#f59e0b' }}>{t.dataLossMinutes === 0 ? 'Nenhuma' : `${t.dataLossMinutes}min`}</strong></span>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{t.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Backup */}
      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>Backups e Recuperação</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            {(['full', 'incremental'] as BackupType[]).map((type) => (
              <button key={type} onClick={() => triggerBackup(type)} style={{ background: '#334155', color: '#94a3b8', border: '1px solid #475569', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                + Backup {type === 'full' ? 'Completo' : 'Incremental'}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {backups.map((b) => (
            <div key={b.id} style={{ background: '#0f172a', borderRadius: 10, padding: '12px 16px', display: 'flex', gap: 16, alignItems: 'center', fontSize: 13 }}>
              <Badge color={STATUS_COLOR[b.status]} label={b.status} />
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{b.type === 'full' ? '📦 Completo' : '🔄 Incremental'}</span>
              <span style={{ color: '#64748b', fontSize: 12 }}>{b.scheduledAt.slice(11, 19)}</span>
              {b.sizeGb > 0 && <span style={{ color: '#94a3b8', fontSize: 12 }}>{b.sizeGb} GB · {b.durationMinutes}min</span>}
              <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 'auto' }}>RTO {b.rtoHours}h · RPO {b.rpoMinutes}min</span>
              <Badge color={STATUS_COLOR[b.integrityCheck === 'passed' ? 'synced' : b.integrityCheck === 'failed' ? 'error' : 'pending']} label={b.integrityCheck} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Reports & Certification ──────────────────────────
function TabReports() {
  const { reports, generateReport } = usePlatformHealth();
  const [certVisible, setCertVisible] = useState(false);
  const certReport = reports.find((r) => r.type === 'certification');
  const criticalTotal = reports.reduce((a, r) => a + r.criticalFindings, 0);
  const highTotal = reports.reduce((a, r) => a + r.highFindings, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <MetricCard label="Achados Críticos" value={criticalTotal} color={criticalTotal > 0 ? '#ef4444' : '#22c55e'} />
        <MetricCard label="Achados Altos" value={highTotal} color={highTotal > 0 ? '#f97316' : '#22c55e'} />
        <MetricCard label="Relatórios Gerados" value={reports.filter((r) => r.status === 'ready').length} color="#22c55e" />
      </div>

      <div style={{ background: '#1e293b', borderRadius: 14, padding: '20px 24px', border: '1px solid #334155' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Relatórios Disponíveis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {reports.map((report) => (
            <div key={report.id} style={{ background: '#0f172a', borderRadius: 12, padding: '18px 20px', border: `1px solid ${STATUS_COLOR[report.status]}33` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Badge color={STATUS_COLOR[report.status]} label={report.status} />
                <span style={{ fontSize: 11, color: '#475569' }}>{report.generatedAt.slice(11, 19)}</span>
              </div>
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, marginBottom: 8 }}>{REPORT_LABELS[report.type]}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, lineHeight: 1.5 }}>{report.summary}</div>
              <div style={{ display: 'flex', gap: 8, fontSize: 11, marginBottom: 14 }}>
                {report.criticalFindings > 0 && <Badge color="#ef4444" label={`${report.criticalFindings} Crítico`} />}
                {report.highFindings > 0 && <Badge color="#f97316" label={`${report.highFindings} Alto`} />}
                {report.mediumFindings > 0 && <Badge color="#f59e0b" label={`${report.mediumFindings} Médio`} />}
                {report.criticalFindings === 0 && report.highFindings === 0 && <Badge color="#22c55e" label="Sem achados críticos" />}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => generateReport(report.type)} disabled={report.status === 'generating'} style={{ background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12 }}>
                  {report.status === 'generating' ? '⏳ Gerando...' : '🔄 Regenerar'}
                </button>
                {report.type === 'certification' && (
                  <button onClick={() => setCertVisible(true)} style={{ background: '#22c55e20', color: '#22c55e', border: '1px solid #22c55e44', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                    📜 Ver Certificado
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certification Modal */}
      {certVisible && certReport && (
        <div style={{ position: 'fixed', inset: 0, background: '#00000088', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setCertVisible(false)}>
          <div style={{ background: '#1e293b', borderRadius: 20, padding: '48px 56px', maxWidth: 680, width: '100%', border: '2px solid #22c55e55', boxShadow: '0 0 60px #22c55e22' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 56 }}>🏆</div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#f8fafc', margin: '16px 0 8px' }}>Certificado Interno de Prontidão</h1>
              <h2 style={{ fontSize: 16, fontWeight: 500, color: '#64748b', margin: 0 }}>Plataforma Integrada — Instituto Ser Melhor</h2>
            </div>
            <div style={{ background: '#0f172a', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.7 }}>{certReport.summary}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
              {[
                { label: '20 Módulos Validados', ok: true },
                { label: 'TypeScript sem erros', ok: true },
                { label: 'Testes E2E Críticos', ok: true },
                { label: 'Segurança MCSI', ok: true },
                { label: 'Conformidade LGPD', ok: true },
                { label: 'Backup verificado', ok: true },
                { label: 'Permissão excessiva (1)', ok: false },
                { label: 'Carga 10k usuários', ok: false },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: item.ok ? '#22c55e' : '#f59e0b' }}>
                  <span>{item.ok ? '✅' : '⚠️'}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <div style={{ background: '#22c55e11', border: '1px solid #22c55e33', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: '#22c55e', fontWeight: 700, marginBottom: 4 }}>Recomendação</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Aprovação condicionada à correção da permissão excessiva do papel financeiro e à implementação de réplicas de leitura para suporte a 10.000 usuários simultâneos antes da implantação em produção.
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#475569', fontSize: 12 }}>
              <span>Emitido em: {certReport.generatedAt.slice(0, 10)}</span>
              <span>Instituto Ser Melhor — Plataforma Aura v1.0</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button onClick={() => setCertVisible(false)} style={{ background: '#334155', color: '#94a3b8', border: 'none', borderRadius: 10, padding: '10px 28px', cursor: 'pointer', fontSize: 14 }}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
const TABS: { id: PlatformHealthTab; label: string; icon: string }[] = [
  { id: 'observability', label: 'Saúde & Observabilidade', icon: '📊' },
  { id: 'e2e', label: 'Testes E2E', icon: '🔄' },
  { id: 'inventory', label: 'Inventário & Integrações', icon: '📑' },
  { id: 'compliance', label: 'Auditoria & Compliance', icon: '⚖️' },
  { id: 'load', label: 'Carga & Resiliência', icon: '⚡' },
  { id: 'reports', label: 'Relatórios & Certificação', icon: '📄' },
];

export default function PlatformHealthCenter() {
  const { currentTab, setCurrentTab } = usePlatformHealth();

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: "'Inter', sans-serif", color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', borderBottom: '1px solid #334155', padding: '28px 40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Instituto Ser Melhor</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Platform Health & Audit Center
            </h1>
            <p style={{ margin: '8px 0 0', color: '#64748b', fontSize: 14 }}>
              Monitoramento permanente, validação integral e certificação da plataforma
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ width: 10, height: 10, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: 13, color: '#22c55e', fontWeight: 700 }}>Plataforma Operacional</span>
            </div>
            <span style={{ fontSize: 11, color: '#475569' }}>{new Date().toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 40px', display: 'flex', gap: 2, overflowX: 'auto' }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            style={{
              background: 'none', border: 'none', padding: '16px 20px', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
              color: currentTab === tab.id ? '#a78bfa' : '#64748b',
              borderBottom: currentTab === tab.id ? '2px solid #8b5cf6' : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '32px 40px' }}>
        {currentTab === 'observability' && (
          <div><SectionTitle icon="📊" title="Saúde & Observabilidade em Tempo Real" /><TabObservability /></div>
        )}
        {currentTab === 'e2e' && (
          <div><SectionTitle icon="🔄" title="Simulador de Testes End-to-End" /><TabE2E /></div>
        )}
        {currentTab === 'inventory' && (
          <div><SectionTitle icon="📑" title="Inventário Completo & Mapa de Integrações" /><TabInventory /></div>
        )}
        {currentTab === 'compliance' && (
          <div><SectionTitle icon="⚖️" title="Auditoria de Compliance & Permissões" /><TabCompliance /></div>
        )}
        {currentTab === 'load' && (
          <div><SectionTitle icon="⚡" title="Testes de Carga, Resiliência & Backup" /><TabLoad /></div>
        )}
        {currentTab === 'reports' && (
          <div><SectionTitle icon="📄" title="Relatórios & Certificação para Produção" /><TabReports /></div>
        )}
      </div>
    </div>
  );
}
