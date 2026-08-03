import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldAlert, CheckCircle2, Key, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { validateStrongPassword, saveSuperAdminPasswordChange } from '../../services/SecureCredentialsService';
import { useIAM } from '../../contexts/IAMContext';

interface MandatoryPasswordChangeModalProps {
  email: string;
  onSuccess: () => void;
}

/**
 * MandatoryPasswordChangeModal — Modal de Troca Obrigatória de Senha no Primeiro Acesso
 * (Prompt 177 — ETAPA 3 e ETAPA 6)
 *
 * Exigências atendidas:
 * - Obriga a alteração da senha inicial no primeiro login do Super Administrador;
 * - Exige senha forte (mínimo 10 caracteres, maiúscula, minúscula, número e símbolo);
 * - Confirma nova senha;
 * - Registra a data da alteração e invalida a senha provisória;
 * - Registra log imutável de auditoria.
 */
export function MandatoryPasswordChangeModal({ email, onSuccess }: MandatoryPasswordChangeModalProps) {
  const { updateUser } = useIAM();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('A confirmação de senha não coincide com a nova senha.');
      return;
    }

    const val = validateStrongPassword(newPassword);
    if (!val.valid) {
      setError(val.message ?? 'Senha não atende aos requisitos institucionais.');
      return;
    }

    setIsLoading(true);
    try {
      // Grava no serviço seguro de credenciais
      saveSuperAdminPasswordChange(email, newPassword);

      // Atualiza usuário atual via IAMContext
      await updateUser('usr-001', {
        mustChangePassword: false,
        passwordLastChangedAt: new Date().toISOString(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch {
      setError('Falha ao registrar nova senha. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Glow decorativo */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {!isSuccess ? (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">Primeiro Acesso — Troca de Senha</h3>
                <p className="text-xs text-amber-400/90 font-medium">Requisito Obrigatório de Segurança</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
              Por norma da governança institucional do <strong>Instituto Ser Melhor</strong>, a senha provisória do Super Administrador (<code>{email}</code>) deve ser alterada imediatamente no primeiro acesso.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nova Senha Forte
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 10 carac. (A-Z, a-z, 0-9, @#$)"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all active:scale-[0.98]"
              >
                {isLoading ? 'Invalidando senha provisória...' : 'Salvar Nova Senha e Continuar'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-6 space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Senha Alterada com Sucesso</h3>
            <p className="text-xs text-slate-400">
              A senha provisória foi permanentemente invalidada e os registros de auditoria foram atualizados.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
