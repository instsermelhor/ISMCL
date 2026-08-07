import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, MessageCircle, Mail, Phone, Smartphone, Globe, Check, Loader2, Save } from 'lucide-react';
import { cn } from '../../utils';
import type { CommunicationPreference, NotificationChannel } from '../../types/actg.types';
import { updateCommunicationPreferences } from '../../services/actgService';

interface NotificationPreferencesProps {
  entityId: string;
  entityType: 'BENEFICIARY' | 'PROFESSIONAL';
  initialPreferences?: Partial<CommunicationPreference>;
  className?: string;
}

const CHANNEL_OPTIONS: Array<{ key: keyof Pick<CommunicationPreference, 'allowWhatsApp' | 'allowEmail' | 'allowSms' | 'allowPush'>; label: string; icon: React.ElementType; channel: NotificationChannel }> = [
  { key: 'allowWhatsApp', label: 'WhatsApp', icon: MessageCircle, channel: 'WHATSAPP' },
  { key: 'allowEmail', label: 'E-mail', icon: Mail, channel: 'EMAIL' },
  { key: 'allowSms', label: 'SMS', icon: Phone, channel: 'SMS' },
  { key: 'allowPush', label: 'Notificações Push', icon: Smartphone, channel: 'PUSH' },
];

const REMINDER_OPTIONS = [
  { value: '7d', label: '7 dias antes' },
  { value: '24h', label: '24 horas antes' },
  { value: '2h', label: '2 horas antes' },
  { value: '30min', label: '30 minutos antes' },
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  entityId,
  entityType,
  initialPreferences,
  className,
}) => {
  const [prefs, setPrefs] = useState<Partial<CommunicationPreference>>({
    allowWhatsApp: false,
    allowEmail: true,
    allowSms: false,
    allowPush: true,
    reminderIntervals: ['24h', '2h'],
    ...initialPreferences,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggleChannel = (key: string) => {
    setPrefs((p) => ({ ...p, [key]: !p[key as keyof typeof p] }));
    setSaved(false);
  };

  const toggleReminder = (value: string) => {
    setPrefs((p) => {
      const current = p.reminderIntervals ?? [];
      return {
        ...p,
        reminderIntervals: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCommunicationPreferences(entityId, prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Tratar erro
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)} id="notification-preferences-panel">
      {/* Channels */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-teal-400" />
          Canais de Notificação
        </h3>
        <div className="space-y-3">
          {CHANNEL_OPTIONS.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-200">{label}</span>
              </div>
              <button
                id={`pref-toggle-${key}`}
                role="switch"
                aria-checked={!!prefs[key as keyof typeof prefs]}
                aria-label={`${prefs[key as keyof typeof prefs] ? 'Desativar' : 'Ativar'} notificações por ${label}`}
                onClick={() => toggleChannel(key)}
                className={cn(
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200',
                  prefs[key as keyof typeof prefs] ? 'bg-teal-500' : 'bg-slate-600',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200',
                    prefs[key as keyof typeof prefs] ? 'translate-x-4.5' : 'translate-x-0.5',
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Reminders */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-800/40 p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Lembretes Automáticos</h3>
        <div className="space-y-2">
          {REMINDER_OPTIONS.map(({ value, label }) => {
            const checked = prefs.reminderIntervals?.includes(value) ?? false;
            return (
              <label key={value} className="flex items-center gap-2.5 cursor-pointer" htmlFor={`reminder-${value}`}>
                <div
                  id={`reminder-${value}`}
                  role="checkbox"
                  aria-checked={checked}
                  onClick={() => toggleReminder(value)}
                  className={cn(
                    'flex items-center justify-center w-4 h-4 rounded border transition-all duration-150',
                    checked ? 'bg-teal-500 border-teal-500' : 'border-slate-600 bg-transparent',
                  )}
                >
                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="text-sm text-slate-200">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Save button */}
      <motion.button
        id="save-notification-preferences"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSave}
        disabled={saving}
        aria-label="Salvar preferências de notificação"
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200',
          saved
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-teal-500/20 border border-teal-500/30 text-teal-400 hover:bg-teal-500/30',
        )}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <Check className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'Salvando...' : saved ? 'Preferências salvas!' : 'Salvar preferências'}
      </motion.button>
    </div>
  );
};

export default NotificationPreferences;
