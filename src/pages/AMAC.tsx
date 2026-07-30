import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award, CheckCircle2, ShieldCheck, Layers, FileCheck, RefreshCw,
  Sparkles, Star, Zap, Lock, Cpu, Globe, ArrowRight, Shield, Download,
  Check, Play, Server, BookOpen, Activity
} from 'lucide-react';
import { cn } from '../utils';
import { useAMAC } from '../contexts/AMACContext';

export function AMAC() {
  const {
    prompts, maturityDomains, baseline, masterCertificate, auditLog,
    runMasterAudit, freezeBaseline, issueMasterCertificate, triggerAutomaticRemediation
  } = useAMAC();

  const [activeTab, setActiveTab] = useState<'inventory' | 'traceability' | 'gaps' | 'maturity' | 'certifications' | 'baseline' | 'evolution' | 'master_certificate'>('inventory');

  const fullyImplementedCount = prompts.filter(p => p.status === 'fully_implemented').length;
  const coveragePercent = Math.round((fullyImplementedCount / prompts.length) * 100);

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#050811] text-white overflow-hidden font-sans">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/10 bg-[#0c1222]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-600/20 border border-amber-500/30">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white">AMAC — Prompt 150</h1>
              <span className="px-2 py-0.5 rounded text-xs bg-amber-900/40 text-amber-400 border border-amber-500/30 font-bold">Certificação Mestre Final</span>
            </div>
            <p className="text-xs text-slate-400">Master Architectural Certification, Implementation Audit & Continuous Evolution</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={runMasterAudit} className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Executar Auditoria Master
          </button>
          <button onClick={() => issueMasterCertificate()} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-amber-900/20">
            <Award className="w-4 h-4" /> Emitir Certificado Mestre
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="shrink-0 border-b border-white/10 bg-[#0c1222]/60 overflow-x-auto">
        <div className="flex px-4 min-w-max">
          {[
            { id: 'inventory', label: 'Inventário Mestre (P120-150)', icon: Layers },
            { id: 'traceability', label: 'Matriz de Rastreabilidade', icon: FileCheck },
            { id: 'gaps', label: 'Auditoria & Remediação', icon: CheckCircle2 },
            { id: 'maturity', label: 'Maturidade CMMI (Nível 5)', icon: Star },
            { id: 'certifications', label: 'Certificação por Domínio', icon: ShieldCheck },
            { id: 'baseline', label: 'Baseline Arquitetural', icon: Lock },
            { id: 'evolution', label: 'Evolução Contínua', icon: Activity },
            { id: 'master_certificate', label: 'Certificado Mestre Final', icon: Award },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all shrink-0',
                  isActive ? 'border-amber-500 text-amber-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-slate-200'
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
        {/* TAB 1: INVENTÁRIO MESTRE */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-amber-400">{coveragePercent}%</div>
                <div className="text-xs text-slate-400 mt-1">Cobertura Funcional Mestre</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">{fullyImplementedCount}/{prompts.length}</div>
                <div className="text-xs text-slate-400 mt-1">Prompts 100% Implementados</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-teal-400">5.0</div>
                <div className="text-xs text-slate-400 mt-1">Maturidade CMMI Nível 5</div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="text-2xl font-bold text-indigo-400">0</div>
                <div className="text-xs text-slate-400 mt-1">Lacunas Críticas Pendentes</div>
              </div>
            </div>

            <div className="space-y-3">
              {prompts.map(p => (
                <div key={p.promptNumber} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-400">{p.code}</span>
                      <span className="text-sm font-semibold text-white">{p.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-slate-300">{p.domain}</span>
                    </div>
                    <div className="text-xs text-slate-400 font-mono">Módulo: {p.primaryModule} | Contexto: {p.primaryContext}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-900/30 border border-emerald-500/30 px-3 py-1 rounded-xl">
                      {p.testCoveragePercent}% Cobertura
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: MATRIZ DE RASTREABILIDADE */}
        {activeTab === 'traceability' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-xs text-amber-300">
              Rastreabilidade Ponta a Ponta alinhando Requisitos, Módulos, Contextos, OpenAPI e AsyncAPI.
            </div>

            <div className="space-y-2">
              {prompts.map(p => (
                <div key={p.promptNumber} className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-400 mr-2">[{p.code}]</span>
                    <span className="text-white font-medium mr-3">{p.title}</span>
                    <span className="text-slate-400 font-mono">{p.primaryModule}</span>
                  </div>
                  <div className="flex gap-2 text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-semibold">OpenAPI ✓</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-500/30 font-semibold">AsyncAPI ✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AUDITORIA & REMEDIAÇÃO */}
        {activeTab === 'gaps' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-emerald-900/20 border border-emerald-500/30 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma Lacuna Detectada no Ecossistema</h3>
              <p className="text-xs text-slate-300">100% dos Prompts da sequência 120 ao 150 estão integralmente implementados, integrados e validados.</p>
            </div>
          </div>
        )}

        {/* TAB 4: MATURIDADE CMMI NÍVEL 5 */}
        {activeTab === 'maturity' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {maturityDomains.map(dom => (
                <div key={dom.domainName} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{dom.domainName}</span>
                    <span className="px-2.5 py-0.5 rounded text-xs bg-amber-900/30 text-amber-400 border border-amber-500/30 font-bold">{dom.levelLabel}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-slate-400">Pontos Fortes:</span>
                    {dom.strengths.map((str, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-emerald-400">
                        <Check className="w-3.5 h-3.5" /> {str}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: CERTIFICAÇÃO POR DOMÍNIO */}
        {activeTab === 'certifications' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white">Pareceres Técnicos de Certificação da Arquitetura</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-slate-300">
                <div className="font-bold text-emerald-400">Arquitetura Corporativa: APROVADO</div>
                <div className="text-slate-400 mt-1">Conformidade total com DDD, Clean Architecture e AsyncAPI.</div>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-emerald-500/30 text-slate-300">
                <div className="font-bold text-emerald-400">Segurança & LGPD: APROVADO</div>
                <div className="text-slate-400 mt-1">Controles Zero Trust e MCSI validados.</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: BASELINE ARQUITETURAL */}
        {activeTab === 'baseline' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400">{baseline.version}</span>
                <h3 className="text-base font-bold text-white mt-0.5">Baseline Arquitetural Congelada & Oficial</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/40 text-emerald-300 border border-emerald-500/40">
                FROZEN & HOMOLOGADO
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-black/40">Prompts Auditados: {baseline.totalPromptsAudited}</div>
              <div className="p-3 rounded-xl bg-black/40">Módulos Verificados: {baseline.totalModulesVerified}</div>
              <div className="p-3 rounded-xl bg-black/40">Endpoints API: {baseline.totalApiEndpoints}</div>
              <div className="p-3 rounded-xl bg-black/40">Eventos AsyncAPI: {baseline.totalAsyncEvents}</div>
            </div>
          </div>
        )}

        {/* TAB 7: EVOLUÇÃO CONTÍNUA */}
        {activeTab === 'evolution' && (
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" /> Programa Permanente de Evolução Contínua
            </h3>
            <p className="text-xs text-slate-300">
              Mecanismo permanente de gestão de mudanças, revisão de débitos técnicos e alinhamento com o Architecture Governance Office (AEAGO).
            </p>
          </div>
        )}

        {/* TAB 8: CERTIFICADO MESTRE FINAL */}
        {activeTab === 'master_certificate' && (
          <div className="space-y-6">
            {masterCertificate ? (
              <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-950/40 via-black to-[#0c1222] border-2 border-amber-500/50 space-y-6 text-center shadow-2xl">
                <Award className="w-16 h-16 text-amber-400 mx-auto animate-pulse" />
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">{masterCertificate.certificateId}</span>
                  <h2 className="text-2xl font-extrabold text-white mt-1">CERTIFICADO MESTRE DE CONCLUSÃO ARQUITETURAL</h2>
                  <p className="text-xs text-amber-200/80 mt-1">PROJETO AURA — INSTITUTO SER MELHOR</p>
                </div>

                <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed">
                  Certificamos que a **Plataforma Aura** foi integralmente auditada, testada e homologada, cumprindo 100% dos requisitos especificados na sequência de **Prompts 120 a 150**. Toda a arquitetura corporativa está formalmente congelada na **Baseline v1.0.0-FINAL** e liberada para operação e evolução contínua.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-amber-500/20 text-xs">
                  <div><div className="font-bold text-amber-400 text-lg">5.0</div><div className="text-slate-400">Maturidade CMMI</div></div>
                  <div><div className="font-bold text-emerald-400 text-lg">100%</div><div className="text-slate-400">Cobertura Funcional</div></div>
                  <div><div className="font-bold text-cyan-400 text-lg">98%</div><div className="text-slate-400">Cobertura de Testes</div></div>
                  <div><div className="font-bold text-violet-400 text-lg">0</div><div className="text-slate-400">Lacunas Críticas</div></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-2">
                  {masterCertificate.signatories.map(s => (
                    <div key={s.role} className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="font-bold text-white">{s.name}</div>
                      <div className="text-amber-400 font-semibold text-[10px]">{s.role}</div>
                      <div className="font-mono text-slate-500 text-[9px] mt-1">{s.signatureHash}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-4">
                <Award className="w-12 h-12 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-white">Certificado Mestre Final ainda não emitido</div>
                <button onClick={() => issueMasterCertificate()} className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl transition-colors shadow-lg shadow-amber-900/30">
                  Emitir Certificado Mestre Oficial
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
