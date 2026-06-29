import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePiarave } from '../contexts/PiaraveContext';
import { useAdaptiveRegistration } from '../contexts/AdaptiveRegistrationContext';
import type { PiaraveDemandType } from '../types/piarave';
import {
  Heart,
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Home,
  CheckCircle,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';

const DEMAND_LABELS: Record<PiaraveDemandType, string> = {
  violencia_emocional: 'Violência Emocional',
  abuso_psicologico: 'Abuso Psicológico',
  manipulacao_psicologica: 'Manipulação Psicológica',
  controle_excessivo: 'Controle Excessivo ou Monitoramento',
  isolamento_social: 'Isolamento Social (afastamento de amigos/família)',
  gaslighting: 'Gaslighting (fazer você duvidar da sua própria sanidade)',
  chantagem_emocional: 'Chantagem Emocional',
  ameacas: 'Ameaças Diretas ou Indiretas',
  perseguicao: 'Perseguição (Stalking)',
  dependencia_emocional: 'Dependência Emocional',
  abuso_financeiro: 'Exploração / Abuso Financeiro',
  alienacao_familiar: 'Alienação Familiar',
  conflitos_conjugais: 'Conflitos Conjugais Graves',
  conflitos_parentais: 'Conflitos Parentais',
  separacao_litigiosa: 'Separação Litigiosa Difícil',
  violencia_pos_separacao: 'Violência Pós-Separação',
  assedio_moral: 'Assédio Moral',
  outras_relacionais: 'Outras Situações Relacionais de Sofrimento',
};

export default function PiaraveAcolhimento() {
  const navigate = useNavigate();
  const {
    lines,
    activeSession,
    startPiaraveSession,
    saveAnswer,
    toggleDemand,
    updateSafetyPlanDraft,
    goToNextStep,
    goToPrevStep,
    submitPiaraveTriage,
  } = usePiarave();

  const { session: areSession } = useAdaptiveRegistration();

  const [selectedLineId, setSelectedLineId] = useState<string>('');
  const [fontSizeClass, setFontSizeClass] = useState<'text-normal' | 'text-large' | 'text-xlarge'>('text-normal');
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [showExitToast, setShowExitToast] = useState<boolean>(false);

  // --- Classes CSS Emuladas ---
  const sizeMap = {
    'text-normal': { title: '22px', text: '14px', label: '15px' },
    'text-large': { title: '26px', text: '16px', label: '17px' },
    'text-xlarge': { title: '30px', text: '18px', label: '19px' },
  };
  const activeSizes = sizeMap[fontSizeClass];

  const themeColors = {
    bg: highContrast
      ? '#000000'
      : 'linear-gradient(135deg, #09090e 0%, #111124 50%, #0d1527 100%)',
    cardBg: highContrast ? '#111111' : 'rgba(255, 255, 255, 0.04)',
    borderColor: highContrast ? '#ffffff' : 'rgba(255, 255, 255, 0.1)',
    textColor: '#ffffff',
    subText: highContrast ? '#cccccc' : '#94a3b8',
    primary: highContrast ? '#ffffff' : '#6366f1',
    primaryGradient: highContrast
      ? 'linear-gradient(135deg, #ffffff, #aaaaaa)'
      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  };

  // Botão de pânico (saída rápida)
  const handleQuickExit = () => {
    // Redireciona para o Google imediatamente
    window.location.href = 'https://www.google.com';
  };

  const handleStart = () => {
    if (!selectedLineId) return;
    startPiaraveSession(areSession.id, selectedLineId);
  };

  const currentLine = lines.find((l) => l.id === activeSession?.lineId);

  // Etapas:
  // 1: Seleção de demandas relatadas (checkboxes)
  // 2: Questionário adaptativo da linha
  // 3: Plano de Segurança
  // 4: Finalização e Confirmação
  const totalSteps = 4;

  const handleNext = () => {
    if (!activeSession) return;
    if (activeSession.currentStep === 1 && activeSession.selectedDemands.length === 0) {
      alert('Por favor, selecione pelo menos uma das opções de sofrimento relacional.');
      return;
    }
    if (activeSession.currentStep < totalSteps) {
      goToNextStep();
    }
  };

  const handleSubmit = async () => {
    await submitPiaraveTriage();
    navigate('/piarave/portal');
  };

  // --- RENDERIZAR WIZARD ---
  const renderStep = () => {
    if (!activeSession) return null;

    switch (activeSession.currentStep) {
      case 1:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.title, fontWeight: 700, color: themeColors.textColor }}>
              Classificação Inicial de Sofrimento Relacional
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6 }}>
              No Instituto Ser Melhor, acreditamos que sua dor importa. Selecione abaixo todas as situações
              que você vivencia ou vivenciou recentemente nessa relação (seleção múltipla):
            </p>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr', gap: '12px',
              maxHeight: '300px', overflowY: 'auto', paddingRight: '6px'
            }}>
              {(Object.keys(DEMAND_LABELS) as PiaraveDemandType[]).map((dem) => {
                const checked = activeSession.selectedDemands.includes(dem);
                return (
                  <label
                    key={dem}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px', borderRadius: '10px',
                      background: checked ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${checked ? themeColors.primary : themeColors.borderColor}`,
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDemand(dem)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: activeSizes.text, color: '#fff' }}>{DEMAND_LABELS[dem]}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.title, fontWeight: 700, color: themeColors.textColor }}>
              Protocolo Técnico de Acolhimento
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText }}>
              Responda a estas perguntas. Elas nos ajudam a entender melhor as dinâmicas e o suporte necessário.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {currentLine?.questions.map((q) => {
                const value = activeSession.answers[q.id] ?? '';
                return (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: activeSizes.label, fontWeight: 600, color: '#fff' }}>
                      {q.label} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                    </label>
                    {q.description && (
                      <span style={{ fontSize: '12px', color: themeColors.subText }}>{q.description}</span>
                    )}

                    {q.type === 'yes_no' && (
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {['sim', 'nao'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => saveAnswer(q.id, opt)}
                            style={{
                              flex: 1, padding: '12px', borderRadius: '8px',
                              border: `1px solid ${value === opt ? themeColors.primary : themeColors.borderColor}`,
                              background: value === opt ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                              color: '#fff', fontSize: activeSizes.text, cursor: 'pointer'
                            }}
                          >
                            {opt === 'sim' ? 'Sim' : 'Não'}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'textarea' && (
                      <textarea
                        value={value as string}
                        onChange={(e) => saveAnswer(q.id, e.target.value)}
                        placeholder="Escreva livremente aqui..."
                        style={{
                          width: '100%', height: '100px', padding: '12px',
                          background: 'rgba(255,255,255,0.04)', color: '#fff',
                          border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                          fontSize: activeSizes.text, resize: 'vertical', outline: 'none'
                        }}
                      />
                    )}

                    {q.type === 'radio' && q.options && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {q.options.map((opt) => (
                          <label
                            key={opt.value}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '12px', borderRadius: '8px',
                              background: value === opt.value ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.02)',
                              border: `1px solid ${value === opt.value ? themeColors.primary : themeColors.borderColor}`,
                              cursor: 'pointer'
                            }}
                          >
                            <input
                              type="radio"
                              name={q.id}
                              checked={value === opt.value}
                              onChange={() => saveAnswer(q.id, opt.value)}
                              style={{ cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: activeSizes.text, color: '#fff' }}>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert style={{ color: '#ef4444', width: '28px', height: '28px' }} />
              <h3 style={{ fontSize: activeSizes.title, fontWeight: 700, color: themeColors.textColor }}>
                Criação do Plano de Segurança Pessoal
              </h3>
            </div>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6 }}>
              O Plano de Segurança é um conjunto de medidas de proteção que guardamos no nosso
              <strong> Cofre Digital</strong> com criptografia ponta a ponta. Preencha o que se sentir confortável:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: themeColors.subText, marginBottom: '6px' }}>
                  Pessoa de Confiança (Nome)
                </label>
                <input
                  type="text"
                  value={activeSession.safetyPlanDraft?.trustedPersonName || ''}
                  onChange={(e) => updateSafetyPlanDraft({ trustedPersonName: e.target.value })}
                  placeholder="Ex: Minha irmã Juliana"
                  style={{
                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)',
                    color: '#fff', border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                    fontSize: activeSizes.text
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: themeColors.subText, marginBottom: '6px' }}>
                  Contato da Pessoa de Confiança
                </label>
                <input
                  type="text"
                  value={activeSession.safetyPlanDraft?.trustedPersonContact || ''}
                  onChange={(e) => updateSafetyPlanDraft({ trustedPersonContact: e.target.value })}
                  placeholder="Ex: (11) 99999-8888"
                  style={{
                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)',
                    color: '#fff', border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                    fontSize: activeSizes.text
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: themeColors.subText, marginBottom: '6px' }}>
                  Local Seguro de Fuga
                </label>
                <input
                  type="text"
                  value={activeSession.safetyPlanDraft?.safePlaceDescription || ''}
                  onChange={(e) => updateSafetyPlanDraft({ safePlaceDescription: e.target.value })}
                  placeholder="Ex: Casa dos meus pais no interior"
                  style={{
                    width: '100%', padding: '12px', background: 'rgba(255,255,255,0.04)',
                    color: '#fff', border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                    fontSize: activeSizes.text
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: themeColors.subText, marginBottom: '6px' }}>
                  Instruções e Ações de Proteção Imediata
                </label>
                <textarea
                  value={activeSession.safetyPlanDraft?.safetyInstructions || ''}
                  onChange={(e) => updateSafetyPlanDraft({ safetyInstructions: e.target.value })}
                  placeholder="Ex: Deixar documentos chaves na mochila da irmã; sair se ele começar a gritar..."
                  style={{
                    width: '100%', height: '80px', padding: '12px', background: 'rgba(255,255,255,0.04)',
                    color: '#fff', border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                    fontSize: activeSizes.text, resize: 'vertical'
                  }}
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>💜</div>
            <h3 style={{ fontSize: activeSizes.title, fontWeight: 700, color: themeColors.textColor }}>
              Seu Acolhimento foi Registrado
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
              Agradecemos sua coragem em compartilhar. Suas respostas e seu plano de segurança foram salvos
              com segurança. Um de nossos profissionais credenciados (Psicólogo ou Assistente Social) irá revisar seu
              caso com total sigilo.
            </p>
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '12px', padding: '16px', maxWidth: '480px', margin: '16px auto 0',
              display: 'flex', gap: '10px', alignItems: 'center', textAlign: 'left'
            }}>
              <CheckCircle style={{ color: '#22c55e', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#86efac' }}>
                <strong>Tudo Certo:</strong> Caso encaminhado para a equipe multidisciplinar e integrado à
                Plataforma de Gestão de Casos (PIA).
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: themeColors.bg,
      color: themeColors.textColor,
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      {/* Top Header com Acessibilidade e Pânico */}
      <header style={{
        height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', borderBottom: `1px solid ${themeColors.borderColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#14b8a6', fontWeight: 700 }}>
          <Heart className="w-5 h-5 fill-current" />
          <span>PIARAVE — Acolhimento Especializado</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Controles de Acessibilidade */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
            <button
              onClick={() => setFontSizeClass('text-normal')}
              style={{ padding: '4px 8px', border: 'none', background: fontSizeClass === 'text-normal' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', fontSize: '12px', cursor: 'pointer', borderRadius: '4px' }}
            >A</button>
            <button
              onClick={() => setFontSizeClass('text-large')}
              style={{ padding: '4px 8px', border: 'none', background: fontSizeClass === 'text-large' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', fontSize: '14px', cursor: 'pointer', borderRadius: '4px' }}
            >A+</button>
            <button
              onClick={() => setFontSizeClass('text-xlarge')}
              style={{ padding: '4px 8px', border: 'none', background: fontSizeClass === 'text-xlarge' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', fontSize: '16px', cursor: 'pointer', borderRadius: '4px' }}
            >A++</button>
          </div>
          <button
            onClick={() => setHighContrast(!highContrast)}
            style={{
              padding: '6px 12px', background: 'rgba(255,255,255,0.06)', border: `1px solid ${themeColors.borderColor}`,
              borderRadius: '8px', color: '#fff', fontSize: '12px', cursor: 'pointer'
            }}
          >🌓 Contraste</button>

          {/* Botão de Pânico */}
          <button
            onClick={handleQuickExit}
            style={{
              padding: '8px 16px', background: '#ef4444', color: '#fff',
              border: 'none', borderRadius: '8px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)'
            }}
          >
            🚨 SAÍDA RÁPIDA (PÂNICO)
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px'
      }}>
        <div style={{
          width: '100%', maxWidth: '580px', background: themeColors.cardBg,
          border: `1px solid ${themeColors.borderColor}`, borderRadius: '16px',
          padding: '32px', backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          {!activeSession ? (
            // Tela Inicial
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛡️</div>
              <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Acolhimento Relacional Especializado</h2>
              <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6 }}>
                Este espaço é dedicado a pessoas expostas a relacionamentos abusivos, manipulação psicológica (gaslighting)
                e violência emocional.
              </p>
              <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6 }}>
                Não realizamos diagnósticos de terceiros nem atribuímos transtornos. Nosso objetivo é
                prover <strong>escuta qualificada, apoio terapêutico e proteção integral</strong>.
              </p>
              <div style={{
                background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#818cf8',
                lineHeight: 1.5
              }}>
                <strong>Segurança de Dados:</strong> Suas respostas serão encriptadas e estarão sob a
                guarda do Cofre Digital do Instituto Ser Melhor.
              </div>

              <div style={{ marginTop: '8px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: themeColors.subText, marginBottom: '6px' }}>
                  Selecione sua Linha de Atendimento:
                </label>
                <select
                  value={selectedLineId}
                  onChange={(e) => setSelectedLineId(e.target.value)}
                  style={{
                    width: '100%', padding: '12px', background: '#1c1c36', color: '#fff',
                    border: `1px solid ${themeColors.borderColor}`, borderRadius: '8px',
                    outline: 'none', fontSize: activeSizes.text
                  }}
                >
                  <option value="">Selecione...</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>{l.name} ({l.targetAudience})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStart}
                disabled={!selectedLineId}
                style={{
                  padding: '14px', background: selectedLineId ? themeColors.primary : '#475569',
                  color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700,
                  cursor: selectedLineId ? 'pointer' : 'not-allowed', marginTop: '12px',
                  fontSize: activeSizes.label, transition: 'all 0.2s'
                }}
              >
                Iniciar Acolhimento
              </button>
            </div>
          ) : (
            // Tela do Wizard
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Progresso */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: themeColors.subText }}>
                  <span>Etapa {activeSession.currentStep} de {totalSteps}</span>
                  <span>{Math.round((activeSession.currentStep / totalSteps) * 100)}% concluído</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div style={{
                    width: `${(activeSession.currentStep / totalSteps) * 100}%`,
                    height: '100%', background: themeColors.primaryGradient,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>

              {/* Conteúdo da Etapa */}
              {renderStep()}

              {/* Botões do Rodapé */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', marginTop: '16px',
                borderTop: `1px solid ${themeColors.borderColor}`, paddingTop: '20px'
              }}>
                <button
                  onClick={goToPrevStep}
                  disabled={activeSession.currentStep === 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px',
                    background: 'transparent', color: activeSession.currentStep === 1 ? '#475569' : '#fff',
                    border: `1px solid ${activeSession.currentStep === 1 ? '#334155' : themeColors.borderColor}`,
                    borderRadius: '8px', cursor: activeSession.currentStep === 1 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>

                {activeSession.currentStep < totalSteps ? (
                  <button
                    onClick={handleNext}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                      background: themeColors.primary, color: '#fff', border: 'none',
                      borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Próximo <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 24px',
                      background: '#22c55e', color: '#fff', border: 'none',
                      borderRadius: '8px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    Confirmar Envio <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Canais de Apoio Rápidos fixados no rodapé */}
      <footer style={{
        padding: '16px', borderTop: `1px solid ${themeColors.borderColor}`,
        textAlign: 'center', fontSize: '13px', color: themeColors.subText,
        background: 'rgba(0,0,0,0.2)', display: 'flex', justifySelf: 'flex-end',
        justifyContent: 'center', gap: '20px', flexWrap: 'wrap'
      }}>
        <span>Apoio Imediato:</span>
        <a href="tel:180" style={{ color: '#f43f5e', textDecoration: 'none', fontWeight: 600 }}>📞 Ligue 180 (Violência contra Mulher)</a>
        <a href="tel:188" style={{ color: '#a78bfa', textDecoration: 'none', fontWeight: 600 }}>📞 Ligue 188 (CVV - Apoio Emocional)</a>
        <a href="tel:192" style={{ color: '#ef4444', textDecoration: 'none', fontWeight: 600 }}>📞 Ligue 192 (SAMU)</a>
      </footer>
    </div>
  );
}
