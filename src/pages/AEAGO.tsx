import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building, Box, Cpu, FileCheck, AlertTriangle, ShieldCheck, RefreshCw,
  Layers, Plus, CheckCircle2, Zap, Lock, Terminal, Activity, ArrowRight,
  GitCommit, Compass, Wrench, Check
} from 'lucide-react';
import { cn } from '../utils';
import { useAEAGO } from '../contexts/AEAGOContext';
import type { ArchitectureDomain, ADRStatus, DebtSeverity, DebtType } from '../types/aeago';

const DOMAIN_LABELS: Record<ArchitectureDomain, string> = {
  identity_iam: 'IAM & Identidade',
  workflow_bpms: 'BPMS & Workflow',
  triage_satai: 'SATAI & Triagem',
  case_piarave: 'PIARAVE & Atendimento',
  documents_ecm: 'AECM & Arquivo Digital',
  university_acu: 'ACU & Universidade',
  integrations_aeip: 'AEIP & Barramento APIs',
  governance_aegrc: 'AEGRC & Governança',
  security_mcsi: 'MCSI & Segurança',
  observability: 'Observabilidade & Health',
};

const SEVERITY_CONFIG: Record<DebtSeverity, { label: string; color: string; bg: string }> = {
  critical: { label: 'Crítico', color: 'text-red-400', bg: 'bg-red-900/30' },
  high: { label: 'Alto', color: 'text-orange-400', bg: 'bg-orange-900/30' },
  medium: { label: 'Médio', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  low: { label: 'Baixo', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
};

export function AEAGO() {
  const {
    components, adrs, violations, technicalDebts, standards, digitalTwinNodes, auditLog,
    addADR, addTechnicalDebt, resolveTechnicalDebt, syncDigitalTwin, runComplianceCheck
  } = useAEAGO();

  const [activeTab, setActiveTab] = useState<'inventory' | 'digitaltwin' | 'adrs' | 'dependencies' | 'compliance' | 'debt' | 'roadmap' | 'audit'>('inventory');
  const [showAdrModal, setShowAdrModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);

  // Form ADR
  const [adrForm, setAdrForm] = useState({
    title: '', domain: 'integrations_aeip' as ArchitectureDomain, context: '', decision: '', consequences: '', alternatives: '', author: '', approver: 'CTO'
  });

  // Form Débito Técnico
  const [debtForm, setDebtForm] = useState({
    title: '', type: 'architectural' as DebtType, severity: 'medium' as DebtSeverity, domain: 'integrations_aeip' as ArchitectureDomain, description: '', estimatedFixEffortHours: 8, remediationPlan: ''
  });

  const handleCreateADR = (e: React.FormEvent) => {
    e.preventDefault();
    addADR({
      title: adrForm.title,
      status: 'accepted',
      domain: adrForm.domain,
      context: adrForm.context,
      decision: adrForm.decision,
      consequences: adrForm.consequences,
      alternativesConsidered: adrForm.alternatives.split(',').map(s => s.trim()).filter(Boolean),
      author: adrForm.author || 'Enterprise Architect',
      approver: adrForm.approver,
      version: '1.0',
    });
    setShowAdrModal(false);
    setAdrForm({ title: '', domain: 'integrations_aeip', context: '', decision: '', consequences: '', alternatives: '', author: '', approver: 'CTO' });
  };

  const handleCreateDebt = (e: React.FormEvent) => {
    e.preventDefault();
    addTechnicalDebt({
      title: debtForm.title,
      type: debtForm.type,
      severity: debtForm.severity,
      domain: debtForm.domain,
      componentId: 'comp-6',
      description: debtForm.description,
      estimatedFixEffortHours: debtForm.estimatedFixEffortHours,
      remediationPlan: debtForm.remediationPlan,
    });
    setShowDebtModal(false);
    setDebtForm({ title: '', type: 'architectural', severity: 'medium', domain: 'integrations_aeip', description: '', estimatedFixEffortHours: 8, remediationPlan: '' });
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#070a12] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#0e1322]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30">
            <Building className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AEAGO</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-blue-900/40 text-blue-400 border border-blue-500/30 font-semibold">Prompt 148</span>
            </div>
            <p className="text-xs text-slate-400">Enterprise Architecture Governance, Digital Twin & Platform Evolution Office</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={syncDigitalTwin} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Digital Twin
          </button>
          <button onClick={() => setShowAdrModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/20">
            <Plus className="w-4 h-4" /> Registrar ADR
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#0e1322]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'inventory', label: 'Repositório & Inventário', icon: Box },
            { id: 'digitaltwin', label: 'Digital Twin Arquitetural', icon: Cpu },
            { id: 'adrs', label: 'Decisões Arquiteturais (ADRs)', icon: FileCheck },
            { id: 'dependencies', label: 'Análise de Dependências', icon: GitCommit },
            { id: 'compliance', label: 'Compliance & Padrões', icon: ShieldCheck },
            { id: 'debt', label: 'Débito Técnico', icon: Wrench },
            { id: 'roadmap', label: 'Roadmap Evolutivo', icon: Compass },
            { id: 'audit', label: 'Auditoria Arquitetural', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-blue-500 text-blue-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* TAB 1: REPOSITÓRIO & INVENTÁRIO */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-blue-400">{components.length}</div>
                <div className="text-xs text-slate-400 mt-1">Componentes Inventariados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{adrs.length}</div>
                <div className="text-xs text-slate-400 mt-1">ADRs Homologados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">{technicalDebts.filter(d => d.status !== 'resolved').length}</div>
                <div className="text-xs text-slate-400 mt-1">Débitos Técnicos Ativos</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-purple-400">100%</div>
                <div className="text-xs text-slate-400 mt-1">Aderência aos Padrões</div>
              </div>
            </div>

            <div className="space-y-3">
              {components.map(comp => (
                <div key={comp.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-400">{comp.code}</span>
                      <span className="text-sm font-bold text-white">{comp.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-slate-300 font-semibold">{DOMAIN_LABELS[comp.domain]}</span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-semibold">Operacional</span>
                  </div>
                  <p className="text-xs text-slate-300">{comp.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {comp.technologies.map(tech => (
                      <span key={tech} className="px-2 py-0.5 rounded text-xs bg-blue-900/20 text-blue-300 border border-blue-500/20">{tech}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: DIGITAL TWIN ARQUITETURAL */}
        {activeTab === 'digitaltwin' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-blue-900/20 border border-blue-500/30 text-xs text-blue-300 flex items-center justify-between">
              <div>
                <span className="font-bold">Digital Twin Ativo:</span> Representação virtual em tempo real de todos os microsserviços, barramentos e conexões.
              </div>
              <button onClick={syncDigitalTwin} className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                Sincronizar Agora
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {digitalTwinNodes.map(node => (
                <div key={node.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{node.type}</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white">{node.label}</div>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/10">
                    <span>Entradas: {node.incomingConnections}</span>
                    <span>Saídas: {node.outgoingConnections}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: DECISÕES ARQUITETURAIS (ADRs) */}
        {activeTab === 'adrs' && (
          <div className="space-y-4">
            {adrs.map(adr => (
              <div key={adr.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400">ADR-{adr.number}</span>
                    <span className="text-sm font-bold text-white">{adr.title}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 uppercase font-bold">{adr.status}</span>
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500 font-semibold mr-2">[Contexto]:</span> {adr.context}
                </div>
                <div className="text-xs text-slate-300">
                  <span className="text-blue-400 font-semibold mr-2">[Decisão]:</span> {adr.decision}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/10">
                  <span>Autor: {adr.author} | Aprovador: {adr.approver}</span>
                  <span className="font-mono text-slate-500">Assinatura: {adr.digitalSignatureHash}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: ANÁLISE DE DEPENDÊNCIAS */}
        {activeTab === 'dependencies' && (
          <div className="space-y-4">
            {violations.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhuma violação de dependência detectada na plataforma!</div>
            ) : (
              violations.map(v => (
                <div key={v.id} className="p-4 rounded-2xl bg-amber-900/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400">{v.violationType.toUpperCase()}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-300">Severidade {v.severity}</span>
                  </div>
                  <div className="text-sm font-semibold text-white">De: {v.sourceComponentName} → Para: {v.targetComponentName}</div>
                  <div className="text-xs text-slate-400">Recomendação: {v.recommendation}</div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 5: COMPLIANCE & PADRÕES */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Catálogo de Padrões Arquiteturais Oficiais</span>
              <button onClick={runComplianceCheck} className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 text-xs font-semibold border border-blue-500/30">
                Executar Validação de Conformidade
              </button>
            </div>

            <div className="space-y-4">
              {standards.map(std => (
                <div key={std.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-400">{std.code}</span>
                    <span className="px-2.5 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-semibold">{std.complianceRatePercent}% Conforme</span>
                  </div>
                  <div className="text-sm font-bold text-white">{std.title}</div>
                  <p className="text-xs text-slate-300">{std.description}</p>
                  <div className="space-y-1 pt-1">
                    {std.mandatoryRules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> {rule}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: DÉBITO TÉCNICO */}
        {activeTab === 'debt' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400">Gestão da Dívida Técnica</span>
              <button onClick={() => setShowDebtModal(true)} className="px-3 py-1.5 rounded-xl bg-amber-600/20 text-amber-400 text-xs font-semibold border border-amber-500/30">
                + Registrar Débito Técnico
              </button>
            </div>

            {technicalDebts.map(debt => {
              const sev = SEVERITY_CONFIG[debt.severity];
              return (
                <div key={debt.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">{debt.code}</span>
                      <span className="text-sm font-bold text-white">{debt.title}</span>
                      <span className={cn('px-2 py-0.5 rounded text-xs font-semibold', sev.bg, sev.color)}>{sev.label}</span>
                    </div>
                    {debt.status !== 'resolved' ? (
                      <button onClick={() => resolveTechnicalDebt(debt.id)} className="px-3 py-1 rounded-xl bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold border border-emerald-500/30">
                        Resolver
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-semibold">Resolvido</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">{debt.description}</p>
                  <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/10">
                    <span>Plano: {debt.remediationPlan}</span>
                    <span>Esforço Estimado: {debt.estimatedFixEffortHours}h</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 7: ROADMAP EVOLUTIVO */}
        {activeTab === 'roadmap' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" /> Roadmap Arquitetural Evolutivo — Projeto Aura
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 text-slate-300">
                <div className="font-bold text-emerald-400">Fase 1: Consolidação dos Módulos Core (Prompts 120–143) [Concluído]</div>
                <div className="text-slate-400 mt-1">IAM, BPMS, SATAI, PIARAVE, Platform Health Center, SODO.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-blue-500/30 text-slate-300">
                <div className="font-bold text-blue-400">Fase 2: Governança, ECM e Universidade Corporativa (Prompts 144–146) [Concluído]</div>
                <div className="text-slate-400 mt-1">AEGRC, AECM-KG, ACU-LMS.</div>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-purple-500/30 text-slate-300">
                <div className="font-bold text-purple-400">Fase 3: Interoperabilidade e Governança de Arquitetura (Prompts 147–148) [Concluído]</div>
                <div className="text-slate-400 mt-1">AEIP (Hub de Integração & APIs) e AEAGO (Architecture Governance Office).</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: AUDITORIA ARQUITETURAL */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLog.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento de arquitetura registrado ainda.</div>
            ) : (
              auditLog.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-blue-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal ADR */}
      <AnimatePresence>
        {showAdrModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#0e1322] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Registrar Nova Decisão Arquitetural (ADR)</h3>
              <form onSubmit={handleCreateADR} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Título da Decisão</label>
                  <input type="text" required value={adrForm.title} onChange={e => setAdrForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Contexto</label>
                  <textarea value={adrForm.context} onChange={e => setAdrForm(p => ({ ...p, context: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" rows={2} />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Decisão Tomada</label>
                  <textarea value={adrForm.decision} onChange={e => setAdrForm(p => ({ ...p, decision: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" rows={2} />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Consequências</label>
                  <textarea value={adrForm.consequences} onChange={e => setAdrForm(p => ({ ...p, consequences: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" rows={2} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdrModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">Homologar ADR</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Débito Técnico */}
        {showDebtModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#0e1322] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Registrar Débito Técnico</h3>
              <form onSubmit={handleCreateDebt} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Título do Débito</label>
                  <input type="text" required value={debtForm.title} onChange={e => setDebtForm(p => ({ ...p, title: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Descrição</label>
                  <textarea value={debtForm.description} onChange={e => setDebtForm(p => ({ ...p, description: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" rows={2} />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Plano de Remediação</label>
                  <textarea value={debtForm.remediationPlan} onChange={e => setDebtForm(p => ({ ...p, remediationPlan: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-blue-500" rows={2} />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowDebtModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors">Registrar Débito</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
