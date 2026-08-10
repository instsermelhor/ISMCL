/**
 * dataGovernanceService.ts — Serviço de Governança e Transição para Dados Reais
 *
 * Responsável por:
 * - Controle de modo Demonstração vs Produção Real
 * - Purga segura de dados fictícios
 * - Export/Import de backup completo em JSON
 */

import { patientsService } from './patientsService';
import { professionalsService } from './professionalsService';
import { appointmentsService } from './appointmentsService';
import { programsService } from './programsService';

const MODE_KEY = 'aura_operation_mode';
const UPDATED_EVENT = 'aura_governance_updated';

export type OperationMode = 'DEMO' | 'PRODUCTION';

function emit(): void {
  window.dispatchEvent(new CustomEvent(UPDATED_EVENT));
}

export const dataGovernanceService = {
  getMode(): OperationMode {
    return (localStorage.getItem(MODE_KEY) as OperationMode) ?? 'DEMO';
  },

  setMode(mode: OperationMode): void {
    localStorage.setItem(MODE_KEY, mode);
    emit();
  },

  isProduction(): boolean {
    return this.getMode() === 'PRODUCTION';
  },

  /**
   * Purga segura de dados fictícios — mantém usuários IAM e configurações
   */
  async purgeDemo(): Promise<void> {
    patientsService.purgeDemoData();
    professionalsService.purgeDemoData();
    appointmentsService.purgeDemoData();
    // Mantém programas sociais (editados pela equipe real)

    // Remove chaves de seed dos contextos principais
    const keysToRemove = [
      'satai_active_session',
      'satai_dossiers',
      'satai_audit_logs',
      'bpms_instances',
      'notification_log',
      'messages_list',
    ];
    keysToRemove.forEach((key) => localStorage.removeItem(key));

    this.setMode('PRODUCTION');
    emit();
  },

  /**
   * Exporta backup completo do estado atual como JSON
   */
  exportBackup(): void {
    const backup: Record<string, any> = {};
    const keys = [
      'patients_list',
      'professionals_list',
      'appointments_list',
      'aura_social_programs_v1',
      'cgi_projetos',
      'financial_campaigns',
      'financial_donors',
      'financial_pix_donations',
      'satai_dossiers',
      'aura_operation_mode',
    ];

    keys.forEach((key) => {
      try {
        const val = localStorage.getItem(key);
        if (val) backup[key] = JSON.parse(val);
      } catch {
        /* skip */
      }
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-aura-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Importa um backup JSON e restaura os dados
   */
  async importBackup(file: File): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
          });
          // Força recarga dos serviços
          window.dispatchEvent(new CustomEvent('aura_patients_updated'));
          window.dispatchEvent(new CustomEvent('aura_professionals_updated'));
          window.dispatchEvent(new CustomEvent('aura_appointments_updated'));
          window.dispatchEvent(new CustomEvent('aura_programs_updated'));
          emit();
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },

  /**
   * Retorna um resumo do estado atual da plataforma
   */
  getStatus() {
    return {
      mode: this.getMode(),
      patients: patientsService.getAll().length,
      professionals: professionalsService.getAll().length,
      appointments: appointmentsService.getAll().length,
      programs: programsService.getAll().length,
    };
  },

  subscribe(listener: () => void): () => void {
    window.addEventListener(UPDATED_EVENT, listener);
    return () => window.removeEventListener(UPDATED_EVENT, listener);
  },
};
