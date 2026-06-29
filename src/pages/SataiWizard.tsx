import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSATAI } from '../contexts/SATAIContext';
import { useAdaptiveRegistration } from '../contexts/AdaptiveRegistrationContext';

const SataiWizard: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeSession,
    selectedProtocol,
    startTriageSession,
    saveAnswer,
    goToNextStep,
    goToPrevStep,
    submitTriage,
    isSubmitting,
    fontSizeClass,
    setFontSizeClass,
    highContrast,
    setHighContrast,
  } = useSATAI();

  const { session: areSession } = useAdaptiveRegistration();

  // Inicializar a sessão de acolhimento assim que a página carregar
  useEffect(() => {
    if (!activeSession) {
      startTriageSession(areSession.id);
    }
  }, [activeSession, startTriageSession, areSession]);

  if (!activeSession) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh',
        background: '#0a0a16', color: '#fff', fontSize: '18px'
      }}>
        Iniciando acolhimento digital...
      </div>
    );
  }

  // --- Classes CSS Emuladas via Inline Styles ---
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

  const handleMotiveToggle = (value: string) => {
    const prev = (areSession.answers['attendance_motives'] as string[]) || [];
    const next = prev.includes(value)
      ? prev.filter((v) => v !== value)
      : [...prev, value];
    // Salvando na sessão do ARE para manter sincronizado com IIP
    areSession.answers['attendance_motives'] = next;
  };

  // --- RENDERIZAR ETAPAS (1 a 8) ---
  const renderStepContent = () => {
    const inputStyle: React.CSSProperties = {
      width: '100%',
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${themeColors.borderColor}`,
      borderRadius: '8px',
      color: '#fff',
      fontSize: activeSizes.text,
      outline: 'none',
      boxSizing: 'border-box',
    };

    switch (activeSession.currentStep) {
      case 1: // ETAPA 1 — APRESENTAÇÃO ACOLHEDORA
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🤝</div>
            <p style={{ fontSize: activeSizes.text, color: themeColors.textColor, lineHeight: 1.6 }}>
              Olá, seja bem-vindo(a) ao seu <strong>Acolhimento Inicial</strong> do Instituto Ser Melhor.
            </p>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6 }}>
              Esta etapa serve para compreendermos detalhadamente a sua situação e as suas dores. 
              Estimamos um tempo de preenchimento de <strong>aproximadamente 6 minutos</strong>.
            </p>
            <div style={{
              background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#818cf8',
              lineHeight: 1.5, display: 'flex', gap: '10px', alignItems: 'flex-start'
            }}>
              <span>🛡️</span>
              <span>
                <strong>Confidencialidade Garantida:</strong> Seus dados são protegidos por criptografia de ponta a ponta 
                e pelo nosso protocolo institucional alinhado à LGPD. Nenhuma informação de saúde ou demanda social 
                será compartilhada publicamente.
              </span>
            </div>
          </div>
        );

      case 2: // ETAPA 2 — CONFIRMAÇÃO DOS DADOS DO ARE
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.label, fontWeight: 700, color: themeColors.textColor }}>
              Confirmação de Dados Cadastrais
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText }}>
              Por favor, confirme se seus dados básicos estão corretos. Se desejar, faça correções:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: themeColors.subText, display: 'block', marginBottom: '4px' }}>Nome Completo</label>
                <input
                  type="text"
                  style={inputStyle}
                  defaultValue={areSession.answers['full_name'] as string || ''}
                  onChange={(e) => { areSession.answers['full_name'] = e.target.value; }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', color: themeColors.subText, display: 'block', marginBottom: '4px' }}>CPF</label>
                <input
                  type="text"
                  style={inputStyle}
                  defaultValue={areSession.answers['cpf'] as string || ''}
                  onChange={(e) => { areSession.answers['cpf'] = e.target.value; }}
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: themeColors.subText, display: 'block', marginBottom: '4px' }}>Telefone</label>
              <input
                type="text"
                style={inputStyle}
                defaultValue={areSession.answers['phone'] as string || ''}
                onChange={(e) => { areSession.answers['phone'] = e.target.value; }}
              />
            </div>
          </div>
        );

      case 3: // ETAPA 3 — IDENTIFICAÇÃO DO MOTIVO DO ATENDIMENTO
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: activeSizes.label, fontWeight: 700, color: themeColors.textColor }}>
              Que tipo de apoio você busca no Instituto?
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, marginBottom: '8px' }}>
              Selecione todas as opções que façam sentido para você:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'Apoio Psicológico / Saúde Mental', value: 'depressao' },
                { label: 'Violência Doméstica / Familiar', value: 'violencia' },
                { label: 'Pensamentos Intrusivos / Risco de Autolesão', value: 'suicidio' },
                { label: 'Dificuldades no Trabalho / Burnout', value: 'burnout' },
                { label: 'Assistência Social / Vulnerabilidade Financeira', value: 'vulnerabilidade' },
              ].map((motive) => {
                const selected = ((areSession.answers['attendance_motives'] as string[]) || []).includes(motive.value);
                return (
                  <button
                    key={motive.value}
                    onClick={() => handleMotiveToggle(motive.value)}
                    style={{
                      padding: '12px 16px', borderRadius: '8px', border: '1px solid',
                      borderColor: selected ? themeColors.primary : themeColors.borderColor,
                      background: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                      color: '#fff', fontSize: activeSizes.text, cursor: 'pointer',
                      textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px'
                    }}
                  >
                    <span style={{
                      width: '18px', height: '18px', borderRadius: '4px', border: '2px solid',
                      borderColor: selected ? themeColors.primary : 'rgba(255,255,255,0.3)',
                      background: selected ? themeColors.primary : 'transparent',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px'
                    }}>
                      {selected && '✓'}
                    </span>
                    {motive.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 4: // ETAPA 4 — QUESTIONÁRIOS CONFIGURÁVEIS (PROTOCOLOS)
        if (!selectedProtocol) return null;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase' }}>
                Protocolo Aplicado: {selectedProtocol.name}
              </span>
              <p style={{ color: themeColors.subText, fontSize: '13px', margin: '4px 0 0' }}>
                {selectedProtocol.description} (v{selectedProtocol.version})
              </p>
            </div>

            {selectedProtocol.questions.map((q) => {
              const val = activeSession.answers[q.id];
              return (
                <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: activeSizes.label, fontWeight: 600, color: themeColors.textColor }}>
                    {q.label} {q.required && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  {q.description && (
                    <span style={{ fontSize: '12px', color: themeColors.subText }}>{q.description}</span>
                  )}

                  {/* Radio */}
                  {q.type === 'radio' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => saveAnswer(q.id, opt.value)}
                          style={{
                            padding: '10px 14px', borderRadius: '6px', border: '1px solid',
                            borderColor: val === opt.value ? themeColors.primary : themeColors.borderColor,
                            background: val === opt.value ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                            color: '#fff', fontSize: '13px', cursor: 'pointer', textAlign: 'left'
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Yes No */}
                  {q.type === 'yes_no' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {['yes', 'no'].map((opt) => (
                        <button
                          key={opt}
                          onClick={() => saveAnswer(q.id, opt)}
                          style={{
                            padding: '10px 24px', borderRadius: '6px', border: '1px solid',
                            borderColor: val === opt ? themeColors.primary : themeColors.borderColor,
                            background: val === opt ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
                            color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 600
                          }}
                        >
                          {opt === 'yes' ? 'Sim' : 'Não'}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Textarea */}
                  {q.type === 'textarea' && (
                    <textarea
                      style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                      value={(val as string) || ''}
                      onChange={(e) => saveAnswer(q.id, e.target.value)}
                    />
                  )}

                  {/* Text */}
                  {q.type === 'text' && (
                    <input
                      type="text"
                      style={inputStyle}
                      value={(val as string) || ''}
                      onChange={(e) => saveAnswer(q.id, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );

      case 5: // ETAPA 5 — FATORES DE PRIORIDADE
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.label, fontWeight: 700, color: themeColors.textColor }}>
              Registro de Fatores de Atenção
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.5 }}>
              Para organizar o seu acolhimento de forma humanizada, o sistema sinalizou preliminarmente
              as seguintes necessidades:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                'Necessidade de acolhimento multidisciplinar (Psicologia + Social)',
                'Acompanhamento contínuo e monitorado por escala de vulnerabilidade',
                'Priorização institucional de alocação de equipe técnica',
              ].map((factor) => (
                <div key={factor} style={{
                  background: 'rgba(255,255,255,0.03)', border: `1px solid ${themeColors.borderColor}`,
                  borderRadius: '8px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'center'
                }}>
                  <span style={{ color: '#10b981', fontSize: '18px' }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#e2e8f0' }}>{factor}</span>
                </div>
              ))}
            </div>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#f59e0b', lineHeight: 1.5
            }}>
              ⚠️ <strong>Aviso Importante:</strong> Esta triagem não constitui um diagnóstico clínico ou parecer 
              profissional. Serve unicamente para acelerar o processo interno de admissão.
            </div>
          </div>
        );

      case 6: // ETAPA 6 — CLASSIFICAÇÃO INSTITUCIONAL
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.label, fontWeight: 700, color: themeColors.textColor }}>
              Classificação Preliminar do Atendimento
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText }}>
              Com base no seu perfil, definimos as diretivas operacionais abaixo para o seu caso:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: themeColors.subText }}>CATEGORIA PRINCIPAL</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px' }}>
                  {areSession.profile === 'security_forces' ? 'Saúde Mental Militar' : 'Acolhimento Clínico'}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px' }}>
                <span style={{ fontSize: '11px', color: themeColors.subText }}>NÍVEL DE SEGURANÇA</span>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '4px', color: '#8b5cf6' }}>
                  {areSession.securityLevel.toUpperCase()}
                </div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', gridColumn: 'span 2' }}>
                <span style={{ fontSize: '11px', color: themeColors.subText }}>FLUXO RECOMENDADO</span>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px', color: '#10b981' }}>
                  Workflow Engine: acolhimento-inicial-v1.3
                </div>
              </div>
            </div>
          </div>
        );

      case 7: // ETAPA 7 — DOSSIÊ INICIAL DO BENEFICIÁRIO (PREVIA & UPLOAD ADICIONAL)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: activeSizes.label, fontWeight: 700, color: themeColors.textColor }}>
              Prévia do Dossiê de Acolhimento
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText }}>
              Este é o documento imutável gerado para a equipe técnica. Você pode anexar arquivos adicionais se desejar:
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.2)', border: `1px solid ${themeColors.borderColor}`,
              borderRadius: '8px', padding: '14px', fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0'
            }}>
              <div>[ISM-DOSSIÊ INICIAL]</div>
              <div>OPERADOR: SATAI AUTOMATION</div>
              <div>PACIENTE: {areSession.answers['full_name'] as string || 'Anônimo'}</div>
              <div>IIP SCORE: {areSession.iipScore} / 100</div>
              <div>CLASSIFICAÇÃO: {areSession.priorityLevel.toUpperCase()}</div>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: themeColors.textColor, display: 'block', marginBottom: '6px' }}>
                Deseja anexar algum laudo ou documento anterior? (Opcional)
              </label>
              <div style={{
                border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '8px', padding: '20px',
                textAlign: 'center', background: 'rgba(255,255,255,0.02)', color: themeColors.subText, cursor: 'pointer'
              }}>
                📎 Clique para selecionar arquivos
              </div>
            </div>
          </div>
        );

      case 8: // ETAPA 8 — ENCAMINHAMENTO AUTOMÁTICO & CONCLUSÃO
        return (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: '60px', marginBottom: '14px' }}>🚀</div>
            <h3 style={{ fontSize: activeSizes.title, fontWeight: 800, color: '#10b981', marginBottom: '8px' }}>
              Acolhimento Encaminhado!
            </h3>
            <p style={{ fontSize: activeSizes.text, color: themeColors.subText, lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 20px' }}>
              Seus dados e questionários foram processados pela IA de triagem e enviados diretamente 
              para a fila de designação técnica do motor BPMS.
            </p>
            <button
              onClick={() => navigate('/portal-beneficiario')}
              style={{
                padding: '12px 28px', background: themeColors.primaryGradient, border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Ir para o Portal do Beneficiário
            </button>
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
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      padding: '40px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center'
    }}>
      {/* Header de Acessibilidade */}
      <div style={{
        width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.03)',
        padding: '10px 16px', borderRadius: '8px', border: `1px solid ${themeColors.borderColor}`
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['text-normal', 'text-large', 'text-xlarge'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFontSizeClass(size)}
              style={{
                background: fontSizeClass === size ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: 'none', color: '#fff', padding: '4px 8px', borderRadius: '4px',
                fontSize: size === 'text-normal' ? '12px' : size === 'text-large' ? '14px' : '16px',
                cursor: 'pointer', fontWeight: fontSizeClass === size ? 700 : 400
              }}
            >
              A
            </button>
          ))}
        </div>
        <button
          onClick={() => setHighContrast(!highContrast)}
          style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '11px',
            cursor: 'pointer', fontWeight: 600
          }}
        >
          🌓 {highContrast ? 'Modo Normal' : 'Alto Contraste'}
        </button>
      </div>

      {/* Card Principal */}
      <div style={{
        width: '100%', maxWidth: '600px',
        background: themeColors.cardBg,
        border: `1px solid ${themeColors.borderColor}`,
        borderRadius: '16px', padding: '32px',
        boxSizing: 'border-box'
      }}>
        {/* Progress bar */}
        {activeSession.currentStep < 8 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: themeColors.subText, marginBottom: '6px' }}>
              <span>Etapa {activeSession.currentStep} de 7</span>
              <span>Progresso: {Math.round((activeSession.currentStep / 7) * 100)}%</span>
            </div>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(activeSession.currentStep / 7) * 100}%`,
                background: themeColors.primary, transition: 'width 0.3s'
              }} />
            </div>
          </div>
        )}

        {/* Conteúdo */}
        {renderStepContent()}

        {/* Ações */}
        {activeSession.currentStep < 8 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginTop: '32px',
            borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px'
          }}>
            {activeSession.currentStep > 1 ? (
              <button
                onClick={goToPrevStep}
                style={{
                  padding: '10px 20px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px',
                  color: '#fff', fontSize: '13px', cursor: 'pointer'
                }}
              >
                Voltar
              </button>
            ) : <div />}

            {activeSession.currentStep < 7 ? (
              <button
                onClick={goToNextStep}
                style={{
                  padding: '10px 24px', background: themeColors.primaryGradient,
                  border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px',
                  fontWeight: 700, cursor: 'pointer'
                }}
              >
                Continuar
              </button>
            ) : (
              <button
                onClick={submitTriage}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px', background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', borderRadius: '6px', color: '#fff', fontSize: '13px',
                  fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Encaminhando...' : 'Finalizar e Enviar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SataiWizard;
