import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  ShieldAlert, 
  User, 
  Home, 
  HeartPulse, 
  CheckCircle2 
} from 'lucide-react';
import { cn } from '../utils';

// =========================================================================
// MÓDULO DE TRIAGEM / ACOLHIMENTO (AURA UI)
// =========================================================================
// Formulário em etapas (Steppers) para reduzir a carga cognitiva, com 
// auto-save (simulado) e design "Trauma-Informed".

const STEPS = [
  { id: 'personal', title: 'Dados Pessoais', icon: User },
  { id: 'social', title: 'Perfil Social', icon: Home },
  { id: 'clinical', title: 'Saúde e Risco', icon: HeartPulse },
  { id: 'review', title: 'Revisão', icon: CheckCircle2 }
];

export function TriageForm() {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    socialName: '',
    cpf: '',
    phone: '',
    income: '',
    housing: '',
    violenceHistory: false,
    chiefComplaint: '',
    suicidalIdeation: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Simula Auto-save
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
    }, 1000);
  };

  const nextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const currentStep = STEPS[currentStepIndex];

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/patients')}
              className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
              title="Voltar"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Novo Acolhimento</h1>
              <p className="text-stone-500 text-sm mt-1">Cadastro Mestre de Beneficiário</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
            {isSaving ? (
              <span className="flex items-center gap-1 text-teal-600"><Save className="w-3 h-3 animate-pulse" /> Salvando...</span>
            ) : lastSaved ? (
              <span>Rascunho salvo às {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            ) : null}
          </div>
        </header>

        {/* Stepper Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-stone-200 rounded-full z-0"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 rounded-full z-0 transition-all duration-500"
              style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            ></div>
            
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = index === currentStepIndex;
              const isPast = index < currentStepIndex;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isActive ? "bg-teal-600 border-teal-600 text-white shadow-md shadow-teal-900/20" : 
                    isPast ? "bg-teal-100 border-teal-600 text-teal-700" : "bg-white border-stone-300 text-stone-400"
                  )}>
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-teal-700" : isPast ? "text-stone-700" : "text-stone-400"
                  )}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden min-h-[400px] flex flex-col">
          <div className="p-6 sm:p-8 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                
                {/* STEP 1: DADOS PESSOAIS */}
                {currentStep.id === 'personal' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium text-stone-800 mb-6">Como devemos chamar você?</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Nome Completo</label>
                        <input 
                          type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                          className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5" 
                          placeholder="Nome igual ao documento"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Nome Social (Opcional)</label>
                        <input 
                          type="text" name="socialName" value={formData.socialName} onChange={handleChange}
                          className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5" 
                          placeholder="Como prefere ser chamado(a)"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">CPF</label>
                          <input 
                            type="text" name="cpf" value={formData.cpf} onChange={handleChange}
                            className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5" 
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-1">Telefone / WhatsApp</label>
                          <input 
                            type="text" name="phone" value={formData.phone} onChange={handleChange}
                            className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5" 
                            placeholder="(00) 00000-0000"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: PERFIL SOCIAL */}
                {currentStep.id === 'social' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium text-stone-800 mb-6">Conte-nos sobre a sua realidade atual</h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Renda Familiar Mensal (Aproximada)</label>
                        <select 
                          name="income" value={formData.income} onChange={handleChange}
                          className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5 bg-white"
                        >
                          <option value="">Selecione uma opção...</option>
                          <option value="none">Sem renda / Extrema Pobreza</option>
                          <option value="up_to_1">Até 1 salário mínimo</option>
                          <option value="1_to_3">De 1 a 3 salários mínimos</option>
                          <option value="more_3">Mais de 3 salários mínimos</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">Situação de Moradia</label>
                        <select 
                          name="housing" value={formData.housing} onChange={handleChange}
                          className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-2.5 bg-white"
                        >
                          <option value="">Selecione uma opção...</option>
                          <option value="owned">Própria</option>
                          <option value="rented">Alugada</option>
                          <option value="shelter">Abrigo institucional</option>
                          <option value="homeless">Situação de rua</option>
                        </select>
                      </div>
                      
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-start gap-3 mt-4">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <label className="flex items-center gap-2 font-medium text-rose-800 cursor-pointer">
                            <input 
                              type="checkbox" name="violenceHistory" checked={formData.violenceHistory} onChange={handleChange}
                              className="rounded text-rose-600 focus:ring-rose-500 border-rose-300 w-4 h-4"
                            />
                            Necessidade de Proteção (Violência Doméstica)
                          </label>
                          <p className="text-xs text-rose-700 mt-1">Marque se você ou dependentes sofrem ou sofreram algum tipo de violência e precisam de apoio do "Projeto Mulheres".</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: SAÚDE E RISCO */}
                {currentStep.id === 'clinical' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-medium text-stone-800 mb-6">O que te trouxe até nós?</h2>
                    
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">Descreva brevemente o que você está sentindo (Queixa Principal)</label>
                        <textarea 
                          name="chiefComplaint" value={formData.chiefComplaint} onChange={handleChange}
                          className="w-full rounded-xl border-stone-200 focus:ring-teal-600 focus:border-teal-600 shadow-sm px-4 py-3 min-h-[120px] resize-none" 
                          placeholder="Suas palavras são o mais importante agora. Não se preocupe com termos técnicos..."
                        />
                      </div>
                      
                      <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 flex items-start gap-3">
                        <HeartPulse className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" />
                        <div>
                          <label className="flex items-center gap-2 font-medium text-stone-800 cursor-pointer">
                            <input 
                              type="checkbox" name="suicidalIdeation" checked={formData.suicidalIdeation} onChange={handleChange}
                              className="rounded text-stone-600 focus:ring-stone-500 border-stone-300 w-4 h-4"
                            />
                            Estou tendo pensamentos de fazer mal a mim mesmo(a).
                          </label>
                          <p className="text-xs text-stone-500 mt-1">Isso nos ajuda a priorizar seu atendimento de forma mais rápida e cuidadosa.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVISÃO */}
                {currentStep.id === 'review' && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h2 className="text-xl font-medium text-stone-800">Tudo pronto!</h2>
                      <p className="text-stone-500 mt-2">Por favor, revise os dados antes de finalizar o cadastro.</p>
                    </div>
                    
                    <div className="bg-stone-50 rounded-xl p-5 space-y-4 text-sm border border-stone-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div><span className="text-stone-500">Nome:</span> <div className="font-medium">{formData.fullName || '-'}</div></div>
                        <div><span className="text-stone-500">Nome Social:</span> <div className="font-medium">{formData.socialName || '-'}</div></div>
                        <div><span className="text-stone-500">Telefone:</span> <div className="font-medium">{formData.phone || '-'}</div></div>
                        <div><span className="text-stone-500">Renda:</span> <div className="font-medium">{formData.income || '-'}</div></div>
                      </div>
                      
                      {formData.violenceHistory && (
                         <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium border border-rose-100 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4" /> Sinalizada necessidade de proteção.
                         </div>
                      )}
                      
                      {formData.suicidalIdeation && (
                         <div className="mt-2 p-3 bg-stone-200 text-stone-800 rounded-lg text-xs font-medium border border-stone-300 flex items-center gap-2">
                           <HeartPulse className="w-4 h-4" /> Sinalizado sofrimento agudo (Prioridade Clínica).
                         </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Footer Actions */}
          <div className="p-6 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
            {currentStepIndex > 0 ? (
              <button 
                onClick={prevStep}
                className="px-6 py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 rounded-xl hover:bg-stone-100 transition-colors shadow-sm"
              >
                Voltar
              </button>
            ) : <div></div>}
            
            {currentStepIndex < STEPS.length - 1 ? (
              <button 
                onClick={nextStep}
                className="px-6 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-500 transition-colors shadow-sm flex items-center gap-2"
              >
                Próxima Etapa <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={() => {
                  alert('Cadastro realizado com sucesso! O paciente foi encaminhado para a fila de triagem.');
                  navigate('/patients');
                }}
                className="px-8 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-500 transition-colors shadow-sm flex items-center gap-2 shadow-teal-900/20"
              >
                Finalizar Cadastro
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
