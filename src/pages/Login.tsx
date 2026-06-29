import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, KeyRound, ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const emailVal = (formData.get('email') as string).trim();
    const passwordVal = formData.get('password') as string;

    if (!emailVal || !passwordVal) {
      setError('Preencha o email e a senha para continuar.');
      return;
    }

    setIsLoading(true);
    try {
      await login(emailVal, passwordVal);
      navigate('/dashboard');
    } catch {
      setError('Erro ao autenticar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-teal-100 selection:text-teal-900">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900"
        >
          Projeto Aura
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 text-center text-sm text-slate-500 font-medium"
        >
          by Instituto Ser Melhor
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email institucional
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="seu@institutosermelhor.org"
                  className="block w-full rounded-xl border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4 transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <div className="mt-2 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Digite sua senha"
                  className="block w-full rounded-xl border-0 py-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-teal-600 sm:text-sm sm:leading-6 px-4 pr-12 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2"
              >
                <KeyRound className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                  Lembrar dispositivo
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-teal-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
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
            </div>
          </form>

          {/* Dica de acesso */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="w-full flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              {showHint ? 'Ocultar credenciais de teste' : 'Ver credenciais de acesso de teste'}
            </button>

            {showHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2"
              >
                <p className="text-xs font-semibold text-slate-600 mb-2">Credenciais de Teste:</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-100 text-teal-700 text-xs font-semibold shrink-0">Admin</span>
                    <div className="text-xs text-slate-600">
                      <div><span className="font-medium">Email:</span> ism@ism.org</div>
                      <div><span className="font-medium">Senha:</span> teste</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-semibold shrink-0">Psic.</span>
                    <div className="text-xs text-slate-600">
                      <div><span className="font-medium">Email:</span> voluntario@institutosermelhor.org</div>
                      <div><span className="font-medium">Senha:</span> senha123</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Acesso restrito. Ambiente seguro monitorado.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
