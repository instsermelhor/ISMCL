import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  Clock,
} from 'lucide-react';
import { useIAM } from '../contexts/IAMContext';
import { MandatoryPasswordChangeModal } from '../components/auth/MandatoryPasswordChangeModal';
import { getInitialSuperAdminConfig } from '../services/SecureCredentialsService';

// ----------------------------------------------------------------
// Campo de input
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
  disabled,
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
  disabled?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-300 mb-1.5 text-left">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className={`w-4 h-4 ${error ? 'text-red-400' : disabled ? 'text-slate-600' : 'text-slate-500'}`} />
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
          disabled={disabled}
          className={`
            w-full rounded-xl py-3.5 text-sm text-white placeholder:text-slate-600
            bg-white/5 border transition-all duration-200 outline-none
            ${Icon ? 'pl-11' : 'pl-4'}
            ${rightElement ? 'pr-12' : 'pr-4'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${
              error
                ? 'border-red-500/60 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
                : 'border-white/10 focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20'
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
// AdminLogin — Área Restrita (Prompt 177 + Prompt 178)
// Interface minimalista: apenas Logo · E-mail · Senha · Entrar · ← Voltar
// ----------------------------------------------------------------

type LoginStep = 'credentials' | 'success';

export function AdminLogin() {
  const { login, isAuthenticated, getRedirectPath } = useIAM();
  const navigate = useNavigate();

  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);

  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string>('/painel-supremo');

  const superAdminConfig = getInitialSuperAdminConfig();

  // Redireciona se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate(getRedirectPath(), { replace: true });
    }
  }, [isAuthenticated, getRedirectPath, navigate]);

  // Countdown de bloqueio por força bruta
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setLockCountdown(0);
        setError('');
        clearInterval(interval);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (lockedUntil && Date.now() < lockedUntil) return;
    if (!email || !password) {
      setError('Preencha o e-mail e a senha para continuar.');
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error ?? 'E-mail ou senha incorretos.');
        if (result.lockedUntil) {
          setLockedUntil(result.lockedUntil);
          setLockCountdown(Math.ceil((result.lockedUntil - Date.now()) / 1000));
        }
      } else if (result.requiresPasswordChange) {
        setPendingRedirect(result.redirectPath ?? '/painel-supremo');
        setShowPasswordChangeModal(true);
      } else {
        setStep('success');
        setTimeout(() => navigate(result.redirectPath ?? '/dashboard', { replace: true }), 1000);
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChangeComplete = () => {
    setShowPasswordChangeModal(false);
    setStep('success');
    setTimeout(() => navigate(pendingRedirect, { replace: true }), 800);
  };

  const isLocked = !!lockedUntil && Date.now() < lockedUntil;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 55%, #1a0a2e 100%)',
      }}
    >
      {/* Modal de troca obrigatória de senha */}
      {showPasswordChangeModal && (
        <MandatoryPasswordChangeModal
          email={email}
          onSuccess={handlePasswordChangeComplete}
        />
      )}

      {/* Ornamentos de fundo (decorativos, sem texto) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-48 -right-48 w-[560px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-48 -left-48 w-[560px] h-[560px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="ar-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ar-grid)" />
        </svg>
      </div>

      {/* Conteúdo central */}
      <div className="relative z-10 w-full max-w-sm">

        {/* ── Logo do Projeto Aura ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center mb-10"
        >
          <div className="relative w-20 h-20 mb-0">
            {/* Anel animado */}
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(245,158,11,0.25) 100%)',
              }}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            />
            {/* Fundo do logo */}
            <div
              className="absolute inset-0.5 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(124,58,237,0.12) 100%)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}
            >
              <Heart className="w-8 h-8 text-amber-400 fill-current" />
            </div>
          </div>
        </motion.div>

        {/* ── Card de Autenticação ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.07)',
            backdropFilter: 'blur(28px)',
          }}
        >
          <AnimatePresence mode="wait">

            {/* ── PASSO: CREDENCIAIS ── */}
            {step === 'credentials' && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="p-8 space-y-5"
              >
                {/* Bloqueio por força bruta */}
                <AnimatePresence>
                  {isLocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-3 rounded-xl bg-red-950/50 border border-red-500/40 px-4 py-3"
                    >
                      <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-300">Acesso temporariamente suspenso</p>
                        <p className="text-xs text-red-400 mt-0.5">
                          Aguarde <strong className="text-red-200">{lockCountdown}s</strong> para tentar novamente.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {/* Campo: E-mail */}
                  <InputField
                    id="ar-email"
                    label="E-mail"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Seu e-mail"
                    autoComplete="email"
                    icon={Mail}
                    error={!!error}
                    disabled={isLocked}
                  />

                  {/* Campo: Senha */}
                  <InputField
                    id="ar-password"
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••••"
                    autoComplete="current-password"
                    icon={Lock}
                    error={!!error}
                    disabled={isLocked}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(s => !s)}
                        className="text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        tabIndex={-1}
                        disabled={isLocked}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {/* Mensagem de erro */}
                  <AnimatePresence>
                    {error && !isLocked && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/25 px-4 py-3 text-left"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Botão: Entrar */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || isLocked}
                    whileHover={!isLoading && !isLocked ? { scale: 1.01, translateY: -1 } : {}}
                    whileTap={{ scale: 0.98 }}
                    id="btn-ar-entrar"
                    className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
                    style={{
                      background: isLocked
                        ? 'rgba(100,100,100,0.25)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: isLocked ? 'none' : '0 0 20px rgba(245,158,11,0.28)',
                    }}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : isLocked ? (
                      <>
                        <Clock className="w-4 h-4" />
                        Aguarde {lockCountdown}s
                      </>
                    ) : (
                      <>
                        Entrar
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Link: ← Voltar */}
                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    id="btn-ar-voltar"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── PASSO: SUCESSO ── */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="p-10 flex flex-col items-center gap-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 220, damping: 14 }}
                  className="w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-7 h-7 text-amber-400" />
                </motion.div>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

      </div>
    </div>
  );
}
