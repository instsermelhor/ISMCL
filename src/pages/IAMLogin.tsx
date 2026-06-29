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

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-2xl shadow-teal-500/30 mb-5">
            <Heart className="w-10 h-10 text-white fill-current" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Projeto Aura</h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">Instituto Ser Melhor</p>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Shield className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-xs text-teal-400 font-medium tracking-wide uppercase">
              Acesso Seguro e Centralizado
            </span>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
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
                className="p-8"
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Bem-vindo</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Acesse com suas credenciais institucionais
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
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
                        className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-300">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        id="remember"
                        className="w-4 h-4 rounded border-slate-600 bg-white/5 text-teal-500 focus:ring-teal-500/30"
                      />
                      <span className="text-sm text-slate-400">Lembrar dispositivo</span>
                    </label>
                    <button
                      type="button"
                      className="text-sm text-teal-400 hover:text-teal-300 transition-colors font-medium"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    id="btn-login-submit"
                    className="
                      w-full flex items-center justify-center gap-2 rounded-xl py-3.5
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
                        Acessar Plataforma
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Credenciais de teste */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="w-full flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors py-2"
                  >
                    <Info className="w-3.5 h-3.5" />
                    {showHints ? 'Ocultar credenciais de acesso' : 'Ver credenciais de acesso (demo)'}
                  </button>

                  <AnimatePresence>
                    {showHints && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 overflow-hidden"
                      >
                        <p className="text-xs font-semibold text-slate-300 mb-3">Perfis de Acesso — Demo:</p>
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
                            className="w-full flex items-center gap-3 text-left hover:bg-white/5 rounded-xl p-2 transition-colors"
                          >
                            <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${u.color}`}>
                              {u.label}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs text-slate-400 truncate">{u.email}</p>
                              <p className="text-xs text-slate-600 font-mono">{u.password}</p>
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
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-teal-500/20 border border-teal-500/30 mb-6">
                  <CheckCircle2 className="w-10 h-10 text-teal-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Acesso confirmado!</h2>
                <p className="text-slate-400 text-sm">
                  Identificando seu perfil e redirecionando...
                </p>
                <div className="flex justify-center gap-1 mt-6">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-teal-500"
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
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-teal-700" />
              <span>Zero Trust Architecture</span>
            </div>
            <span>•</span>
            <span>Ambiente monitorado e criptografado</span>
          </div>
          <p className="text-xs text-slate-700 mt-2">
            © 2026 Instituto Ser Melhor — Todos os direitos reservados
          </p>
        </motion.div>
      </div>
    </div>
  );
}
