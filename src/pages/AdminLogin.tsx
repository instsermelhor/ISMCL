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
  Shield,
  ShieldCheck,
  KeyRound,
  Clock,
} from 'lucide-react';
import { useIAM } from '../contexts/IAMContext';
import { MandatoryPasswordChangeModal } from '../components/auth/MandatoryPasswordChangeModal';
import { getInitialSuperAdminConfig } from '../services/SecureCredentialsService';

// ----------------------------------------------------------------
// Campo de input reutilizável
// ----------------------------------------------------------------

function AdminInputField({
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
            w-full rounded-xl py-3.5 text-sm text-white placeholder:text-slate-500
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
// Componente Principal — Tela de Autenticação Administrativa
// Prompt 177 — ETAPAS 1, 2, 3, 6, 8
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

  // Troca obrigatória de senha (Prompt 177 ETAPA 3)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<string>('/painel-supremo');

  const superAdminConfig = getInitialSuperAdminConfig();

  // Redirecionar se já autenticado
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
        setTimeout(() => navigate(result.redirectPath ?? '/painel-supremo', { replace: true }), 1200);
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
    setTimeout(() => navigate(pendingRedirect, { replace: true }), 1000);
  };

  const isLocked = !!lockedUntil && Date.now() < lockedUntil;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 50%, #1a0a2e 100%)',
      }}
    >
      {/* Modal de Troca Obrigatória de Senha (ETAPA 3) */}
      {showPasswordChangeModal && (
        <MandatoryPasswordChangeModal
          email={email}
          onSuccess={handlePasswordChangeComplete}
        />
      )}

      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Orb teal */}
        <motion.div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.07, 0.12, 0.07] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.07, 0.14, 0.07] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.025]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="admin-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#admin-grid)" />
        </svg>
      </div>

      {/* Card central */}
      <div className="relative z-10 w-full max-w-md">

        {/* Header institucional */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          {/* Logo */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative">
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(124,58,237,0.15) 100%)',
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            />
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'conic-gradient(from 0deg, transparent 70%, rgba(245,158,11,0.2) 100%)',
              }}
            />
            <div className="relative flex items-center justify-center">
              <Heart className="w-7 h-7 text-amber-400 fill-current" />
            </div>
          </div>

          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Área Administrativa
          </h1>
          <p className="text-slate-400 text-sm font-medium">
            Acesso exclusivo para administradores autorizados.
          </p>

          {/* Badge de segurança */}
          <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Shield className="w-3 h-3 text-amber-400" />
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
              Instituto Ser Melhor · IAM Protegido
            </span>
          </div>
        </motion.div>

        {/* Card de Autenticação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(24px)',
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
                className="p-8"
              >
                {/* Header do card */}
                <div className="mb-6 text-left border-b border-white/5 pb-4">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    Autenticação Institucional
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Insira suas credenciais para acessar o Painel Supremo Administrativo
                  </p>
                </div>

                {/* Alerta de bloqueio por força bruta */}
                <AnimatePresence>
                  {isLocked && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 flex items-start gap-3 rounded-xl bg-red-950/50 border border-red-500/40 px-4 py-3"
                    >
                      <Clock className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-red-300">Conta temporariamente bloqueada</p>
                        <p className="text-xs text-red-400 mt-0.5">
                          Muitas tentativas de login. Tente novamente em{' '}
                          <strong className="text-red-200">{lockCountdown}s</strong>.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AdminInputField
                    id="admin-email"
                    label="E-mail Institucional"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder={superAdminConfig.email || 'admin@institutosermelhor.org'}
                    autoComplete="email"
                    icon={Mail}
                    error={!!error}
                    disabled={isLocked}
                  />

                  <AdminInputField
                    id="admin-password"
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    icon={Lock}
                    error={!!error}
                    disabled={isLocked}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
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
                        className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-left"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Botão Entrar (Prompt 177 - ETAPA 2) */}
                  <button
                    type="submit"
                    disabled={isLoading || isLocked}
                    id="btn-admin-login-submit"
                    className="
                      w-full flex items-center justify-center gap-2 rounded-xl py-3.5
                      font-bold text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-200 active:scale-[0.98] cursor-pointer
                      shadow-lg
                    "
                    style={{
                      background: isLocked
                        ? 'rgba(100,100,100,0.3)'
                        : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: isLocked ? 'none' : '0 0 24px rgba(245,158,11,0.3)',
                      color: '#fff',
                    }}
                    onMouseEnter={e => {
                      if (!isLocked && !isLoading) {
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 36px rgba(245,158,11,0.5)';
                        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.boxShadow = isLocked ? 'none' : '0 0 24px rgba(245,158,11,0.3)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                    }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
                  </button>
                </form>

                {/* Link: ← Voltar ao Portal Principal (Prompt 177 - ETAPA 2) */}
                <div className="mt-6 border-t border-white/5 pt-4 text-center">
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    id="btn-admin-voltar-portal"
                    className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-amber-400 transition-colors bg-none border-none cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Voltar ao Portal Principal
                  </button>
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-amber-400" />
                </motion.div>
                <h2 className="text-lg font-bold text-white mb-1">Acesso Autorizado</h2>
                <p className="text-slate-400 text-xs">
                  Carregando o Painel Supremo Administrativo...
                </p>
                <div className="flex justify-center gap-1 mt-4">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                      animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </motion.div>

        {/* Rodapé de Segurança */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-6"
        >
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-500/70" />
              <span>Zero Trust · RBAC/ABAC · Rate Limiting</span>
            </div>
            <span>•</span>
            <span>Trilha de Auditoria Imutável</span>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            © 2026 Instituto Ser Melhor — Todos os direitos reservados
          </p>
        </motion.div>

      </div>
    </div>
  );
}
