import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdaptiveRegistrationProvider, useAdaptiveRegistration } from '../contexts/AdaptiveRegistrationContext';
import type { AdaptiveQuestion } from '../types/adaptive-registration';

// ============================================================
// Wizard Interno
// ============================================================

const QuestionField: React.FC<{ question: AdaptiveQuestion }> = ({ question }) => {
  const { session, saveAnswer } = useAdaptiveRegistration();
  const currentValue = session.answers[question.id];

  const handleChange = (val: string | string[] | number | null) => {
    saveAnswer(question.id, val);
  };

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '10px',
    color: '#f1f5f9',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  switch (question.type) {
    case 'yes_no':
      return (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[{ label: 'Sim', value: 'yes' }, { label: 'Não', value: 'no' }].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              style={{
                padding: '12px 32px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: currentValue === opt.value ? '#6366f1' : 'rgba(255,255,255,0.2)',
                background: currentValue === opt.value
                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                  : 'rgba(255,255,255,0.05)',
                color: '#f1f5f9',
                fontSize: '15px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case 'radio':
    case 'select':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options?.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleChange(opt.value)}
              style={{
                padding: '13px 18px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: currentValue === opt.value ? '#6366f1' : 'rgba(255,255,255,0.15)',
                background: currentValue === opt.value
                  ? 'rgba(99,102,241,0.2)'
                  : 'rgba(255,255,255,0.04)',
                color: '#f1f5f9',
                fontSize: '14px',
                fontWeight: currentValue === opt.value ? 600 : 400,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options?.map((opt) => {
            const selected = Array.isArray(currentValue) && currentValue.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const prev = Array.isArray(currentValue) ? [...currentValue] : [];
                  const next = selected
                    ? prev.filter((v) => v !== opt.value)
                    : [...prev, opt.value];
                  handleChange(next);
                }}
                style={{
                  padding: '13px 18px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: selected ? '#6366f1' : 'rgba(255,255,255,0.15)',
                  background: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                  color: '#f1f5f9',
                  fontSize: '14px',
                  fontWeight: selected ? 600 : 400,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '5px',
                  border: '2px solid',
                  borderColor: selected ? '#6366f1' : 'rgba(255,255,255,0.3)',
                  background: selected ? '#6366f1' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  flexShrink: 0,
                }}>
                  {selected && '✓'}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
      );

    case 'scale':
      return (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => handleChange(n)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  border: '2px solid',
                  borderColor: currentValue === n ? '#6366f1' : 'rgba(255,255,255,0.2)',
                  background: currentValue === n
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'rgba(255,255,255,0.05)',
                  color: '#f1f5f9',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8' }}>
            <span>1 = Não urgente</span>
            <span>10 = Urgência máxima</span>
          </div>
        </div>
      );

    case 'file_upload':
      return (
        <div style={{
          border: '2px dashed rgba(255,255,255,0.2)',
          borderRadius: '12px',
          padding: '28px',
          textAlign: 'center',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.03)',
          color: '#94a3b8',
          fontSize: '14px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📎</div>
          <div>Clique para selecionar ou arraste o arquivo</div>
          <div style={{ fontSize: '12px', marginTop: '6px', color: '#64748b' }}>
            PDF, JPG ou PNG — máximo 10MB
          </div>
          {currentValue && (
            <div style={{ marginTop: '10px', color: '#6366f1', fontSize: '13px', fontWeight: 600 }}>
              ✓ Arquivo selecionado
            </div>
          )}
        </div>
      );

    case 'address_block':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[
            { id: 'cep', label: 'CEP', placeholder: '00000-000' },
            { id: 'logradouro', label: 'Logradouro (rua, av...)', placeholder: 'Rua...' },
            { id: 'numero', label: 'Número', placeholder: 'Nº' },
            { id: 'complemento', label: 'Complemento (opcional)', placeholder: 'Apto, bloco...' },
            { id: 'bairro', label: 'Bairro', placeholder: 'Bairro' },
            { id: 'cidade', label: 'Cidade', placeholder: 'Cidade' },
            { id: 'estado', label: 'Estado', placeholder: 'UF' },
          ].map((f) => (
            <div key={f.id}>
              <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px', display: 'block' }}>
                {f.label}
              </label>
              <input
                type="text"
                placeholder={f.placeholder}
                style={inputBase}
                onChange={(e) => handleChange(e.target.value)}
              />
            </div>
          ))}
        </div>
      );

    default:
      return (
        <input
          type={question.type === 'date' ? 'date' : question.type === 'email' ? 'email' : 'text'}
          style={inputBase}
          value={typeof currentValue === 'string' ? currentValue : ''}
          placeholder={
            question.type === 'cpf' ? '000.000.000-00' :
            question.type === 'phone' ? '(00) 00000-0000' : ''
          }
          onChange={(e) => handleChange(e.target.value)}
        />
      );
  }
};

// ---- Barra de Progresso ----

const ProgressBar: React.FC = () => {
  const { session, totalSteps, iipLabel, priorityColor } = useAdaptiveRegistration();
  const pct = Math.round((session.currentStep / totalSteps) * 100);

  return (
    <div style={{ marginBottom: '28px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '10px'
      }}>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>
          Etapa {session.currentStep} de {totalSteps}
        </span>
        {session.iipScore > 0 && (
          <span style={{
            fontSize: '12px', fontWeight: 700, color: priorityColor,
            background: `${priorityColor}22`, padding: '4px 12px', borderRadius: '20px'
          }}>
            Prioridade: {iipLabel}
          </span>
        )}
      </div>
      <div style={{
        height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
          borderRadius: '3px',
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  );
};

// ---- Passo do Wizard ----

const WizardStep: React.FC = () => {
  const {
    session, currentStepQuestions, totalSteps,
    canGoBack, canGoForward,
    goToNextStep, goToPrevStep, submitRegistration, isSubmitting
  } = useAdaptiveRegistration();
  const navigate = useNavigate();

  const stepTitles: Record<number, string> = {
    1: 'Identificação de Perfil',
    2: 'Dados Pessoais',
    3: 'Contato',
    4: 'Motivo do Atendimento',
    5: 'Indicadores de Vulnerabilidade',
    6: 'Saúde Mental — Triagem Inicial',
    7: 'Documentação',
    8: 'Privacidade e Consentimento',
  };

  const stepDescriptions: Record<number, string> = {
    1: 'Vamos começar entendendo quem você é para oferecer o melhor suporte.',
    2: 'Precisamos de algumas informações para criar seu perfil no sistema.',
    3: 'Como podemos entrar em contato com você?',
    4: 'Aqui você pode compartilhar o que te traz até nós. Sem julgamentos.',
    5: 'Estas informações nos ajudam a priorizar e personalizar seu atendimento.',
    6: 'Algumas perguntas sobre saúde mental para entendermos melhor seu momento.',
    7: 'Precisamos de alguns documentos para concluir seu cadastro com segurança.',
    8: 'Quase lá! Vamos garantir a proteção dos seus dados.',
  };

  if (session.status === 'pending_review') {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
        <h2 style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>
          Cadastro enviado com sucesso!
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '15px', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 24px' }}>
          Seu cadastro está em análise. Em breve nossa equipe entrará em contato para
          confirmar seu agendamento e iniciar o acolhimento.
        </p>
        <div style={{
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px', padding: '16px', maxWidth: '320px', margin: '0 auto 24px',
        }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Número do cadastro</div>
          <div style={{ color: '#6366f1', fontWeight: 700, fontSize: '18px', fontFamily: 'monospace' }}>
            ISM-{new Date().getFullYear()}-{String(Math.floor(Math.random() * 99999)).padStart(5, '0')}
          </div>
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            fontSize: '15px',
            cursor: 'pointer',
          }}
        >
          Acessar minha conta
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Título da etapa */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          display: 'inline-block',
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '6px',
          padding: '3px 12px',
          fontSize: '11px',
          color: '#818cf8',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '10px',
        }}>
          Etapa {session.currentStep}
        </div>
        <h2 style={{ color: '#f1f5f9', fontSize: '22px', fontWeight: 700, margin: '0 0 6px' }}>
          {stepTitles[session.currentStep] ?? 'Cadastro'}
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, lineHeight: 1.6 }}>
          {stepDescriptions[session.currentStep] ?? ''}
        </p>
      </div>

      {/* Perguntas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
        {currentStepQuestions.map((q) => (
          <div key={q.id}>
            <label style={{ display: 'block', fontWeight: 600, color: '#e2e8f0', fontSize: '15px', marginBottom: '6px' }}>
              {q.label}
              {q.required && <span style={{ color: '#f87171', marginLeft: '4px' }}>*</span>}
            </label>
            {q.description && (
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 10px', lineHeight: 1.5 }}>
                {q.description}
              </p>
            )}
            <QuestionField question={q} />
            {q.privacyNote && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '10px',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: '8px', padding: '10px 12px',
              }}>
                <span style={{ fontSize: '14px' }}>🔒</span>
                <span style={{ fontSize: '12px', color: '#6ee7b7', lineHeight: 1.5 }}>{q.privacyNote}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navegação */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        {canGoBack ? (
          <button
            onClick={goToPrevStep}
            style={{
              padding: '13px 24px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px',
              color: '#94a3b8',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            ← Voltar
          </button>
        ) : <div />}

        {canGoForward ? (
          <button
            onClick={goToNextStep}
            style={{
              padding: '13px 28px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
            }}
          >
            Continuar →
          </button>
        ) : (
          <button
            onClick={submitRegistration}
            disabled={isSubmitting}
            style={{
              padding: '13px 28px',
              background: isSubmitting
                ? 'rgba(99,102,241,0.5)'
                : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 20px rgba(16,185,129,0.3)',
            }}
          >
            {isSubmitting ? '⏳ Enviando...' : '✅ Concluir Cadastro'}
          </button>
        )}
      </div>
    </div>
  );
};

// ============================================================
// Página Principal
// ============================================================

const AdaptiveRegistrationInner: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
    }}>
      {/* Painel lateral — informativo */}
      <div style={{
        width: '300px',
        flexShrink: 0,
        marginRight: '32px',
        position: 'sticky',
        top: '40px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
        className="hide-on-mobile"
      >
        {/* Logo */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: 800,
            fontSize: '17px',
            color: '#fff',
            display: 'inline-block',
          }}>
            ISM
          </div>
          <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: 600, marginTop: '8px' }}>
            Instituto Ser Melhor
          </div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>Cadastro Institucional</div>
        </div>

        {/* Garantias */}
        {[
          { icon: '🔒', title: 'Sigilo Total', desc: 'Seus dados são protegidos pela LGPD e pelo nosso protocolo institucional.' },
          { icon: '💙', title: 'Sem Julgamentos', desc: 'Este é um espaço seguro. Suas respostas não serão usadas contra você.' },
          { icon: '🛡️', title: 'Cofre Digital', desc: 'Ative proteção máxima para dados sensíveis com um clique.' },
          { icon: '⚡', title: 'Acolhimento Ágil', desc: 'Priorização automática para os casos mais urgentes.' },
        ].map((item) => (
          <div key={item.title} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{ fontSize: '22px', marginBottom: '6px' }}>{item.icon}</div>
            <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
              {item.title}
            </div>
            <div style={{ color: '#64748b', fontSize: '12px', lineHeight: 1.5 }}>{item.desc}</div>
          </div>
        ))}

        {/* Emergência */}
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '14px',
        }}>
          <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
            🆘 Está em perigo agora?
          </div>
          <div style={{ color: '#94a3b8', fontSize: '12px', lineHeight: 1.5 }}>
            Ligue <strong style={{ color: '#f87171' }}>190 (SAMU)</strong> ou{' '}
            <strong style={{ color: '#f87171' }}>CVV 188</strong>
          </div>
        </div>
      </div>

      {/* Formulário Principal */}
      <div style={{
        flex: 1,
        maxWidth: '640px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '20px',
        padding: '36px',
        backdropFilter: 'blur(20px)',
      }}>
        <ProgressBar />
        <WizardStep />
      </div>
    </div>
  );
};

const AdaptiveRegistration: React.FC = () => (
  <AdaptiveRegistrationProvider>
    <AdaptiveRegistrationInner />
  </AdaptiveRegistrationProvider>
);

export default AdaptiveRegistration;
