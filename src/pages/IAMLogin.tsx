import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Shield,
  Info,
} from 'lucide-react';
import { useIAM } from '../contexts/IAMContext';
import { useAuraContent } from '../contexts/AuraContentContext';

// ----------------------------------------------------------------
// Campo de input reutilizável
// ----------------------------------------------------------------

function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  icon: Icon,
  rightElement,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ComponentType<{ className?: string }>;
  rightElement?: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={`w-4 h-4 ${error ? 'text-red-400' : 'text-slate-500'}`} />
          </div>
        )}
        <input
          id={id}
          name={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`
            w-full rounded-xl py-3.5 text-sm text-white placeholder:text-slate-500
            bg-white/5 border transition-all duration-200 outline-none
            ${Icon ? 'pl-11' : 'pl-4'}
            ${rightElement ? 'pr-12' : 'pr-4'}
            ${
              error
                ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                : 'border-white/10 focus:border-teal-500/60 focus:ring-2 focus:ring-teal-500/20'
            }
          `}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------
// AuraLandingColumn — coluna esquerda com conteúdo institucional dinâmico
// ----------------------------------------------------------------

const ACCENT_MAP: Record<string, string> = {
  teal: 'border-teal-500/40',
  sky:  'border-sky-500/40',
  rose: 'border-rose-500/40',
  amber: 'border-amber-500/40',
};

function AuraLandingColumn() {
  const navigate = useNavigate();
  const { content } = useAuraContent();

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="lg:col-span-7 bg-slate-900/40 border border-white/5 rounded-3xl p-6 lg:p-10 backdrop-blur-md space-y-6 text-left"
    >
      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold uppercase tracking-wider">
        {content.badgeText}
      </div>

      {/* Título */}
      <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
        {content.headline}
      </h2>

      {/* Subtítulo */}
      <p className="text-slate-400 text-sm font-medium">
        {content.subheadline}
      </p>

      {/* Corpo principal */}
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
        {content.introText.split('\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}

        {/* Público atendido */}
        {content.audienceItems.length > 0 && (
          <ul className="list-disc list-inside space-y-2 text-slate-400 text-xs pl-2">
            {content.audienceItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}

        {/* Seções com borda colorida */}
        {content.sections.map(section => (
          <div
            key={section.id}
            className={`border-l-2 ${ACCENT_MAP[section.accentColor] ?? 'border-slate-500/40'} pl-4 py-1 space-y-2`}
          >
            <h4 className="text-white font-semibold text-xs uppercase tracking-wide">
              {section.title}
            </h4>
            {section.body.split('\n').map((line, i) => (
              <p key={i} className="text-xs text-slate-400 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        ))}

        {/* Nota de disponibilidade */}
        {content.availabilityNote && (
          <p className="text-xs text-slate-400">{content.availabilityNote}</p>
        )}
      </div>

      {/* Ações rápidas */}
      <div className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {content.quickActions.map(action => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className={`px-4 py-3 rounded-xl font-semibold text-xs transition-all text-center active:scale-[0.98] ${action.colorClass}`}
          >
            {action.emoji} {action.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ----------------------------------------------------------------
// Tela de Login
// ----------------------------------------------------------------

type LoginStep = 'credentials' | 'success';

export function IAMLogin() {
  const { login, isAuthenticated, getRedirectPath } = useIAM();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHints, setShowHints] = useState(false);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [isAuthenticated, getRedirectPath, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha o e-mail e a senha para continuar.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error ?? 'E-mail ou senha incorretos.');
      } else {
        setStep('success');
        setTimeout(() => navigate(result.redirectPath ?? '/dashboard', { replace: true }), 1200);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0f2027 100%)',
      }}
    >
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #14b8a6 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10 py-6 px-4">

        {/* Left Column: Institutional Presentation — conteúdo dinâmico via AuraContentContext */}
        <AuraLandingColumn />

        {/* Right Column: Login Card & Credentials */}
        <div className="lg:col-span-5 w-full max-w-md mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-6 lg:mb-8"
          >
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-2xl shadow-teal-500/30 mb-4">
              <Heart className="w-8 h-8 text-white fill-current" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Portal do Colaborador</h1>
            <p className="text-slate-400 text-xs mt-1 font-medium">Acesso Restrito e Identificado</p>
          </motion.div>

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <AnimatePresence mode="wait">

              {/* ---- STEP: LOGIN ---- */}
              {step === 'credentials' && (
                <motion.div
                  key="credentials"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="p-6 lg:p-8"
                >
                  <div className="mb-6 text-left">
                    <h2 className="text-lg font-bold text-white">Identificação</h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      Insira suas credenciais institucionais
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField
                      id="email"
                      label="E-mail institucional"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="seu@institutosermelhor.org"
                      autoComplete="email"
                      icon={Mail}
                      error={!!error}
                    />

                    <InputField
                      id="password"
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={setPassword}
                      placeholder="Digite sua senha"
                      autoComplete="current-password"
                      icon={Lock}
                      error={!!error}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-slate-500 hover:text-slate-300 transition-colors"
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-left"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-red-300">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          id="remember"
                          className="w-3.5 h-3.5 rounded border-slate-600 bg-white/5 text-teal-500 focus:ring-teal-500/30"
                        />
                        <span className="text-xs text-slate-400">Lembrar acesso</span>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium bg-none border-none cursor-pointer"
                      >
                        Esqueceu a senha?
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      id="btn-login-submit"
                      className="
                        w-full flex items-center justify-center gap-2 rounded-xl py-3
                        bg-gradient-to-r from-teal-500 to-teal-600
                        text-white font-semibold text-sm
                        shadow-lg shadow-teal-500/25
                        hover:from-teal-400 hover:to-teal-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-200 active:scale-[0.98]
                      "
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          Entrar no Painel
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Credenciais de teste */}
                  <div className="mt-4 border-t border-white/5 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowHints(!showHints)}
                      className="w-full flex items-center justify-center gap-2 text-[11px] text-slate-500 hover:text-slate-350 transition-colors py-1 cursor-pointer bg-none border-none"
                    >
                      <Info className="w-3 h-3" />
                      {showHints ? 'Ocultar credenciais de demonstração' : 'Ver credenciais de demonstração'}
                    </button>

                    <AnimatePresence>
                      {showHints && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5 overflow-hidden max-h-[180px] overflow-y-auto pr-1 custom-scrollbar text-left"
                        >
                          {[
                            { label: 'Super Admin',       email: 'ism@ism.org',                                 password: 'teste',            color: 'bg-slate-700 text-white' },
                            { label: 'Prof. Voluntária',  email: 'voluntario@institutosermelhor.org',            password: 'senha123',         color: 'bg-emerald-900/60 text-emerald-300' },
                            { label: 'Auditora',          email: 'auditora@institutosermelhor.org',              password: 'auditoria123',     color: 'bg-zinc-800 text-zinc-300' },
                            { label: 'Coordenadora',      email: 'coordenadora@institutosermelhor.org',          password: 'coord123',         color: 'bg-orange-900/60 text-orange-300' },
                            { label: 'Gestor',            email: 'gestor@institutosermelhor.org',                password: 'gestor123',        color: 'bg-rose-900/60 text-rose-300' },
                            { label: 'Diretora',          email: 'diretora@institutosermelhor.org',              password: 'diretora123',      color: 'bg-purple-900/60 text-purple-300' },
                            { label: 'Vol. Administrativa', email: 'admin.voluntario@institutosermelhor.org',   password: 'voluntario123',    color: 'bg-lime-900/60 text-lime-300' },
                            { label: 'Beneficiário',      email: 'beneficiario@exemplo.com',                    password: 'beneficiario123',  color: 'bg-sky-900/60 text-sky-300' },
                          ].map(u => (
                            <button
                              key={u.email}
                              type="button"
                              onClick={() => { setEmail(u.email); setPassword(u.password); }}
                              className="w-full flex items-center gap-2 text-left hover:bg-white/5 rounded-lg p-1.5 transition-colors cursor-pointer border-none"
                            >
                              <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${u.color}`}>
                                {u.label}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                                <p className="text-[10px] text-slate-600 font-mono">{u.password}</p>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {/* ---- STEP: SUCESSO ---- */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="p-8 text-center"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-500/20 border border-teal-500/30 mb-4">
                    <CheckCircle2 className="w-8 h-8 text-teal-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white mb-1">Acesso Autorizado</h2>
                  <p className="text-slate-400 text-xs">
                    Identificando suas atribuições institucionais...
                  </p>
                  <div className="flex justify-center gap-1 mt-4">
                    {[0, 1, 2].map(i => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-teal-500"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* Rodapé */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center mt-6"
          >
            <div className="flex items-center justify-center gap-3 text-[10px] text-slate-600">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-teal-700" />
                <span>Zero Trust Core</span>
              </div>
              <span>•</span>
              <span>Tráfego Auditado</span>
            </div>
            <p className="text-[10px] text-slate-700 mt-1">
              © 2026 Instituto Ser Melhor — Todos os direitos reservados
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
