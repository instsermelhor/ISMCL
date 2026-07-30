import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Rocket, ShieldCheck, CheckCircle2, FileCheck, Play, Award,
  Users, AlertTriangle, Layers, Lock, RefreshCw, Check, X,
  Clock, Activity, FileText, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { cn } from '../utils';
import { useAPRCG } from '../contexts/APRCGContext';
import type { CertificationDomain, CertificationStatus, UATCategory } from '../types/aprcg';

const CERT_STATUS_CONFIG: Record<CertificationStatus, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-900/30' },
  approved_with_restrictions: { label: 'Aprovado c/ Restrições', color: 'text-amber-400', bg: 'bg-amber-900/30' },
  rejected: { label: 'Reprovado', color: 'text-red-400', bg: 'bg-red-900/30' },
  pending: { label: 'Pendente', color: 'text-slate-400', bg: 'bg-white/10' },
};

export function APRCG() {
  const {
    checklist, certifications, uatCases, goLiveWindows, executiveApprovals, auditLog,
    toggleChecklistItem, updateCertification, executeUATCase, grantExecutiveApproval,
    scheduleGoLive, executeGoLive, executeRollback
  } = useAPRCG();

  const [activeTab, setActiveTab] = useState<'readiness' | 'certifications' | 'uat' | 'operational' | 'golive' | 'validation' | 'approvals' | 'audit'>('readiness');
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);

  // Form Go-Live Window
  const [goLiveForm, setGoLiveForm] = useState({
    releaseVersion: 'v2.0.0-PROD-RELEASE', scheduledStartAt: '', scheduledEndAt: '', releaseManager: 'Principal Release Manager'
  });

  const passedChecklistCount = checklist.filter(c => c.isPassed).length;
  const checklistScore = Math.round((passedChecklistCount / checklist.length) * 100);
  const isAllApproved = executiveApprovals.every(a => a.isApproved);

  const handleScheduleGoLive = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleGoLive({
      releaseVersion: goLiveForm.releaseVersion,
      scheduledStartAt: goLiveForm.scheduledStartAt || new Date().toISOString(),
      scheduledEndAt: goLiveForm.scheduledEndAt || new Date(Date.now() + 14400000).toISOString(),
      releaseManager: goLiveForm.releaseManager,
      rollbackPlanUrl: '/docs/plan_rollback.pdf',
      contingencyPlanUrl: '/docs/plan_contingency.pdf',
    });
    setShowGoLiveModal(false);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#070e17] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#0e1929]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30">
            <Rocket className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">APRCG</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 font-semibold">Prompt 149</span>
            </div>
            <p className="text-xs text-slate-400">Production Readiness, Enterprise Certification & Go-Live Program</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAllApproved && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-900/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Go-Live Autorizado pela Diretoria
            </span>
          )}
          <button onClick={() => setShowGoLiveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
            <Rocket className="w-4 h-4" /> Agendar Go-Live
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#0e1929]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'readiness', label: 'Checklist de Prontidão', icon: CheckCircle2 },
            { id: 'certifications', label: 'Certificação por Domínio', icon: Award },
            { id: 'uat', label: 'Testes de Aceitação UAT', icon: FileCheck },
            { id: 'operational', label: 'Prontidão Operacional & ACU', icon: Users },
            { id: 'golive', label: 'Go-Live & Rollback', icon: Rocket },
            { id: 'validation', label: 'Validação Pós-Deploy', icon: Activity },
            { id: 'approvals', label: 'Aprovação Executiva', icon: Lock },
            { id: 'audit', label: 'Auditoria de Release', icon: Layers },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-emerald-500 text-emerald-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
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
        {/* TAB 1: CHECKLIST DE PRONTIDÃO */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{checklistScore}%</div>
                <div className="text-xs text-slate-400 mt-1">Índice de Prontidão Global</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-teal-400">{passedChecklistCount}/{checklist.length}</div>
                <div className="text-xs text-slate-400 mt-1">Requisitos Homologados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-indigo-400">96%</div>
                <div className="text-xs text-slate-400 mt-1">Cobertura Global de Testes</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">0</div>
                <div className="text-xs text-slate-400 mt-1">Pendências Críticas</div>
              </div>
            </div>

            <div className="space-y-3">
              {checklist.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{item.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-slate-300 font-mono uppercase">{item.category}</span>
                    </div>
                    <p className="text-xs text-slate-300">{item.description}</p>
                    {item.evidenceRef && <span className="text-xs text-slate-500 font-mono">Evidência: {item.evidenceRef}</span>}
                  </div>

                  <button
                    onClick={() => toggleChecklistItem(item.id)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-semibold transition-colors shrink-0 flex items-center gap-1.5',
                      item.isPassed ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-white/10 text-slate-400'
                    )}
                  >
                    {item.isPassed ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                    {item.isPassed ? 'Homologado (100%)' : 'Pendente'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CERTIFICAÇÃO POR DOMÍNIO */}
        {activeTab === 'certifications' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certifications.map(cert => {
                const cfg = CERT_STATUS_CONFIG[cert.status];
                return (
                  <div key={cert.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">{cert.domainName}</span>
                      <span className={cn('px-2.5 py-0.5 rounded text-xs font-semibold', cfg.bg, cfg.color)}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-slate-300">{cert.notes}</p>
                    <div className="text-xs text-slate-400 flex items-center justify-between pt-2 border-t border-white/10">
                      <span>Avaliador: {cert.evaluatorName} ({cert.evaluatorRole})</span>
                      <span className="font-mono text-slate-500">Hash: {cert.signatureHash}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: TESTES DE ACEITAÇÃO UAT */}
        {activeTab === 'uat' && (
          <div className="space-y-4">
            {uatCases.map(test => (
              <div key={test.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400">{test.code}</span>
                    <span className="text-sm font-bold text-white">{test.title}</span>
                  </div>
                  <span className={cn('px-2.5 py-0.5 rounded text-xs font-semibold', test.status === 'passed' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400')}>
                    {test.status === 'passed' ? 'Aprovado no UAT' : 'Pendente'}
                  </span>
                </div>
                <div className="text-xs text-slate-300"><span className="text-slate-500 font-semibold mr-1">[Cenário]:</span> {test.scenario}</div>
                <div className="text-xs text-slate-300"><span className="text-emerald-400 font-semibold mr-1">[Resultado Esperado]:</span> {test.expectedResult}</div>
                <div className="flex gap-2 justify-end pt-1">
                  {test.status !== 'passed' && (
                    <button onClick={() => executeUATCase(test.id, 'passed', 'Analista de QA')} className="px-3 py-1.5 rounded-xl bg-emerald-600/30 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                      Homologar Caso UAT
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: PRONTIDÃO OPERACIONAL & ACU */}
        {activeTab === 'operational' && (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" /> Prontidão das Equipes & Universidade ACU
              </h3>
              <p className="text-xs text-slate-300">
                Confirmação de capacitação de voluntários, profissionais de saúde e gestores nos módulos da plataforma.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-black/40 text-xs border border-emerald-500/30">
                  <div className="font-bold text-emerald-400">100% Voluntários Treinados</div>
                  <div className="text-slate-400 mt-1">Trilha de Integração concluída na ACU.</div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 text-xs border border-emerald-500/30">
                  <div className="font-bold text-emerald-400">100% Equipe Técnica</div>
                  <div className="text-slate-400 mt-1">Psicólogos e Assistentes Sociais certificados.</div>
                </div>
                <div className="p-3 rounded-xl bg-black/40 text-xs border border-emerald-500/30">
                  <div className="font-bold text-emerald-400">Suporte 24/7 Ativo</div>
                  <div className="text-slate-400 mt-1">SLAs de atendimento e POPs validados.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GO-LIVE & ROLLBACK */}
        {activeTab === 'golive' && (
          <div className="space-y-4">
            {goLiveWindows.map(win => (
              <div key={win.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">{win.releaseVersion}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">Janela de Implantação Oficial</h3>
                  </div>
                  <span className={cn('px-3 py-1 rounded-full text-xs font-bold uppercase', win.status === 'completed' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40' : 'bg-amber-900/40 text-amber-300 border border-amber-500/40')}>
                    {win.status === 'completed' ? 'Concluído & Produção Ativa' : 'Agendado'}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2">
                  {win.status !== 'completed' ? (
                    <button onClick={() => executeGoLive(win.id)} className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30">
                      <Rocket className="w-4 h-4" /> Executar Go-Live Agora (Liberar para Produção)
                    </button>
                  ) : (
                    <button onClick={() => executeRollback(win.id, 'Solicitação manual de emergência')} className="py-2.5 px-4 rounded-xl bg-red-900/30 text-red-400 hover:bg-red-900/40 text-xs font-semibold border border-red-500/30">
                      Acionar Rollback de Emergência
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 6: VALIDAÇÃO PÓS-DEPLOY */}
        {activeTab === 'validation' && (
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <h3 className="text-sm font-bold text-white">Status da Validação Automática Pós-Implantação</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> APIs Respondem OK
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Event Bus Ativo
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> IA Engine Conectada
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Health Check 100%
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: APROVAÇÃO EXECUTIVA */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {executiveApprovals.map(app => (
                <div key={app.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">{app.roleTitle}</span>
                    <span className={cn('px-2.5 py-0.5 rounded text-xs font-semibold', app.isApproved ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-amber-900/30 text-amber-400')}>
                      {app.isApproved ? 'Assinado & Aprovado' : 'Pendente'}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white">{app.approverName}</div>
                  {app.comments && <p className="text-xs text-slate-300">"{app.comments}"</p>}
                  {!app.isApproved && (
                    <button onClick={() => grantExecutiveApproval(app.roleTitle, app.approverName, 'Aprovado formalmente.')} className="w-full py-2 rounded-xl bg-emerald-600/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                      Assinar Eletronicamente
                    </button>
                  )}
                  {app.digitalSignatureHash && <div className="text-xs font-mono text-slate-500 pt-1">Assinatura Digital: {app.digitalSignatureHash}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: AUDITORIA DE RELEASE */}
        {activeTab === 'audit' && (
          <div className="space-y-3">
            {auditLog.length === 0 ? (
              <div className="text-center text-slate-500 py-12 text-sm">Nenhum evento registrado ainda.</div>
            ) : (
              auditLog.map(log => (
                <div key={log.id} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-emerald-400 mr-2">[{log.action}]</span>
                    <span className="text-slate-300">{log.description}</span>
                  </div>
                  <span className="text-slate-500 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal Go-Live */}
      <AnimatePresence>
        {showGoLiveModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#0e1929] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4">
              <h3 className="text-base font-bold text-white">Agendar Janela de Go-Live</h3>
              <form onSubmit={handleScheduleGoLive} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Versão da Release</label>
                  <input type="text" required value={goLiveForm.releaseVersion} onChange={e => setGoLiveForm(p => ({ ...p, releaseVersion: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Release Manager Responsável</label>
                  <input type="text" required value={goLiveForm.releaseManager} onChange={e => setGoLiveForm(p => ({ ...p, releaseManager: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowGoLiveModal(false)} className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors">Agendar Release</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
